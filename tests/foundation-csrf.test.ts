/**
 * Server-side Origin / CSRF protection tests for state-changing
 * foundation routes (security decision TBD-TECH-02).
 *
 * Covers:
 *   - Positive: matching Origin ⇒ request proceeds
 *   - Positive: no Origin + Sec-Fetch-Site: same-origin ⇒ proceeds
 *   - Positive: no Origin + no Fetch Metadata (non-browser client) ⇒ proceeds, logged
 *   - Positive: safe method GET with any/mismatched Origin ⇒ proceeds (no CSRF)
 *   - Negative: mismatched Origin ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: cross-site Sec-Fetch-Site ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: no server-configured origin + Origin header ⇒ 403 ORIGIN_REQUIRED
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSession = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/auth", () => ({
  getReviewSession: async () => mockSession.value,
}));

import { handleFoundationRoute } from "@/server/foundation/admin-http";
import { verifyOrigin, getExpectedOrigin } from "@/server/foundation/csrf";
import { resetFoundationCacheForTests } from "@/server/foundation/runtime";
import type { FoundationServices } from "@/server/foundation/services";

const OWNER_SESSION = {
  user: { email: "owner@example.com", name: "Company Owner Review", role: "owner_review" },
};

let previousEnv: NodeJS.ProcessEnv;

function setEnv(env: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetFoundationCacheForTests();
}

beforeEach(() => {
  previousEnv = { ...process.env };
  mockSession.value = null;
  setEnv({
    AUTH_SECRET: "test-secret-value-with-32-plus-chars",
    ADMIN_OWNER_EMAIL: "owner@example.com",
    ADMIN_OWNER_PASSWORD_HASH: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    DATA_ADAPTER: "fake",
    NODE_ENV: "test",
  });
});

afterEach(() => {
  process.env = previousEnv;
  resetFoundationCacheForTests();
});

function requestWithOrigin(
  url: string,
  method: string,
  origin?: string | null,
  secFetchSite?: string | null,
): Request {
  const urlObj = new URL(url);
  const headers: Record<string, string> = { host: urlObj.host };
  if (origin !== undefined && origin !== null) headers.origin = origin;
  if (secFetchSite !== undefined && secFetchSite !== null) headers["sec-fetch-site"] = secFetchSite;
  return new Request(url, { method, headers });
}

describe("getExpectedOrigin", () => {
  it("returns AUTH_URL when configured", () => {
    process.env.AUTH_URL = "https://admin.example.com";
    const req = requestWithOrigin(
      "https://other.example.com/api",
      "POST",
      "https://other.example.com",
    );
    expect(getExpectedOrigin(req)).toBe("https://admin.example.com");
  });

  it("derives from Host header when AUTH_URL unset", () => {
    delete process.env.AUTH_URL;
    const req = requestWithOrigin("https://app.example.com/api", "POST", "https://app.example.com");
    expect(getExpectedOrigin(req)).toBe("https://app.example.com");
  });

  it("returns null when neither is available", () => {
    delete process.env.AUTH_URL;
    const req = new Request("http://localhost/api", { method: "POST" });
    req.headers.delete("host");
    expect(getExpectedOrigin(req)).toBeNull();
  });
});

describe("verifyOrigin — positive (allowed)", () => {
  it("matching Origin allows state-changing request", () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      "https://app.example.com",
    );
    expect(verifyOrigin(req)).toBeNull();
  });

  it("no Origin + Sec-Fetch-Site: same-origin allows", () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      null,
      "same-origin",
    );
    expect(verifyOrigin(req)).toBeNull();
  });

  it("no Origin + no Fetch Metadata (non-browser client) allows", () => {
    const req = new Request("https://app.example.com/api/v1/admin/customers", { method: "POST" });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("safe method GET with mismatched Origin is not checked", () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "GET",
      "https://evil.example.com",
    );
    expect(verifyOrigin(req)).toBeNull();
  });
});

describe("verifyOrigin — negative (rejected with 403)", () => {
  it("mismatched Origin returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      "https://evil.example.com",
    );
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("Sec-Fetch-Site: cross-site returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      null,
      "cross-site",
    );
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("Sec-Fetch-Site: same-site (non-origin) returns 403", () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      null,
      "same-site",
    );
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });

  it("no configured origin + Origin header returns 403 ORIGIN_REQUIRED", async () => {
    delete process.env.AUTH_URL;
    // No Host header → no derivable origin → ORIGIN_REQUIRED
    const req = new Request("https://app.example.com/api/v1/admin/customers", {
      method: "POST",
      headers: { origin: "https://app.example.com" },
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_REQUIRED");
  });
});

describe("handleFoundationRoute — CSRF integration", () => {
  const handler = vi.fn(() => Promise.resolve({ body: { ok: true }, status: 200 }));

  beforeEach(() => {
    handler.mockReset();
    mockSession.value = OWNER_SESSION;
  });

  it("POST with matching Origin proceeds to handler", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      "https://app.example.com",
    );
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("POST with mismatched Origin returns 403 without calling handler", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "POST",
      "https://evil.example.com",
    );
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("GET with mismatched Origin proceeds (safe method not checked)", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers",
      "GET",
      "https://evil.example.com",
    );
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("PATCH with matching Origin proceeds", async () => {
    const req = requestWithOrigin(
      "https://app.example.com/api/v1/admin/customers/1",
      "PATCH",
      "https://app.example.com",
    );
    const res = await handleFoundationRoute("/api/v1/admin/customers/{id}", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
