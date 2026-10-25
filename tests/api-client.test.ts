/**
 * Typed frontend API client: request shapes (relative URLs, JSON,
 * Idempotency-Key on create), query building, and error-envelope
 * normalization to ApiClientError. Fetch is mocked; no network.
 */

import { describe, expect, it, vi } from "vitest";
import { ApiClientError, createApiClient } from "@/lib/api-client";

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("api client", () => {
  it("builds list queries and returns typed pages", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ items: [], total: 0, page: 2, pageSize: 5 }));
    const client = createApiClient(fetchFn as unknown as typeof fetch);
    const page = await client.listCustomers({ page: 2, pageSize: 5, search: "mona" });
    expect(page.page).toBe(2);
    const [url, init] = fetchFn.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/v1/admin/customers?page=2&pageSize=5&search=mona");
    expect(init.method).toBe("GET");
    expect(init.credentials).toBe("same-origin");
  });

  it("sends an Idempotency-Key on create (explicit or generated UUID)", async () => {
    const fetchFn = vi.fn(
      async (_input: RequestInfo | URL, _init?: RequestInit): Promise<Response> =>
        jsonResponse({ id: "c1" }, 201),
    );
    const client = createApiClient(fetchFn as unknown as typeof fetch);

    await client.createCustomer(
      { name: "Mona Adel", phone: "+20 100 123 4567" },
      { idempotencyKey: "given-key-00000000001" },
    );
    let init = fetchFn.mock.calls[0]?.[1] as RequestInit;
    expect((init.headers as Record<string, string>)["Idempotency-Key"]).toBe(
      "given-key-00000000001",
    );

    await client.createCustomer({ name: "Mona Adel", phone: "+20 100 123 4567" });
    init = fetchFn.mock.calls[1]?.[1] as RequestInit;
    const generated = (init.headers as Record<string, string>)["Idempotency-Key"];
    expect(generated).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("normalizes the error envelope to ApiClientError", async () => {
    const fetchFn = vi.fn(async () =>
      jsonResponse(
        {
          error: {
            code: "VALIDATION_FAILED",
            messageKey: "errors.validationFailed",
            fieldErrors: { workspaceId: ["readOnly"] },
          },
        },
        422,
      ),
    );
    const client = createApiClient(fetchFn as unknown as typeof fetch);
    try {
      await client.listCustomers();
      throw new Error("expected ApiClientError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError);
      const apiError = error as ApiClientError;
      expect(apiError.status).toBe(422);
      expect(apiError.code).toBe("VALIDATION_FAILED");
      expect(apiError.messageKey).toBe("errors.validationFailed");
      expect(apiError.fieldErrors).toEqual({ workspaceId: ["readOnly"] });
    }
  });

  it("maps non-envelope failures to a generic INTERNAL error without prose", async () => {
    const fetchFn = vi.fn(async () => new Response("proxy exploded", { status: 502 }));
    const client = createApiClient(fetchFn as unknown as typeof fetch);
    try {
      await client.health();
      throw new Error("expected ApiClientError");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiClientError);
      expect((error as ApiClientError).code).toBe("INTERNAL");
      expect((error as ApiClientError).status).toBe(502);
    }
  });

  it("encodes path ids", async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ id: "a/b" }));
    const client = createApiClient(fetchFn as unknown as typeof fetch);
    await client.getCustomer("a/b");
    const [url] = fetchFn.mock.calls[0] as unknown as [string];
    expect(url).toBe("/api/v1/admin/customers/a%2Fb");
  });
});
