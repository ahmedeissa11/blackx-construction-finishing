/**
 * Foundation HTTP handlers: the authorization matrix (401/403 before
 * adapter state), fail-closed 503 governance, real persistence across
 * requests against the dev fake, 501 planned markers, error-envelope
 * shape, and public health/readiness. The owner session source is
 * mocked exactly like the intake admin tests.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSession = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/auth", () => ({
  getReviewSession: async () => mockSession.value,
}));

import { GET as getHealth } from "@/app/api/v1/health/route";
import { GET as getMe } from "@/app/api/v1/me/route";
import { GET as getReady } from "@/app/api/v1/ready/route";
import { GET as getAuditEvents } from "@/app/api/v1/admin/audit-events/route";
import { GET as getCustomers, POST as postCustomer } from "@/app/api/v1/admin/customers/route";
import {
  GET as getCustomer,
  PATCH as patchCustomer,
} from "@/app/api/v1/admin/customers/[id]/route";
import { GET as getEngineers } from "@/app/api/v1/admin/engineers/route";
import { GET as getOpenApi } from "@/app/api/v1/admin/openapi.json/route";
import { GET as getProjects, POST as postProject } from "@/app/api/v1/admin/projects/route";
import { GET as getSystemStatus } from "@/app/api/v1/admin/system/status/route";
import { ApiError } from "@/server/foundation/errors";
import { readJsonBody } from "@/server/foundation/http";
import { resetFoundationCacheForTests } from "@/server/foundation/runtime";

const OWNER_SESSION = {
  user: { email: "owner@example.com", name: "Company Owner Review", role: "owner_review" },
};
const WRONG_ROLE_SESSION = {
  user: { email: "someone@example.com", name: "Someone Else", role: "customer" },
};

const AUTH_ENV = {
  AUTH_SECRET: "test-secret-value-with-32-plus-chars",
  ADMIN_OWNER_EMAIL: "owner@example.com",
  ADMIN_OWNER_PASSWORD_HASH: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
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
  setEnv({ ...AUTH_ENV, DATA_ADAPTER: "fake", NODE_ENV: "test" });
});

afterEach(() => {
  process.env = previousEnv;
  resetFoundationCacheForTests();
});

function jsonRequest(url: string, init?: RequestInit): Request {
  return new Request(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function expectEnvelope(body: Record<string, unknown>, code: string): void {
  const error = body.error as Record<string, unknown>;
  expect(error.code).toBe(code);
  expect(typeof error.messageKey).toBe("string");
  expect(JSON.stringify(body)).not.toContain("stack");
}

describe("health & readiness (public, minimal)", () => {
  it("health is always ok and exposes nothing else", async () => {
    const response = await getHealth();
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toEqual({ status: "ok" });
  });

  it("ready reflects auth configuration only", async () => {
    const readyResponse = await getReady();
    expect(readyResponse.status).toBe(200);
    expect(await bodyOf(readyResponse)).toEqual({ status: "ready" });

    setEnv({
      AUTH_SECRET: undefined,
      ADMIN_OWNER_EMAIL: undefined,
      ADMIN_OWNER_PASSWORD_HASH: undefined,
    });
    const notReadyResponse = await getReady();
    expect(notReadyResponse.status).toBe(503);
    expect(await bodyOf(notReadyResponse)).toEqual({ status: "not_ready" });
  });
});

describe("authorization matrix", () => {
  it("anonymous ⇒ 401, wrong role ⇒ 403, before any adapter state", async () => {
    mockSession.value = null;
    let response = await getCustomers(new Request("http://x/api/v1/admin/customers"));
    expect(response.status).toBe(401);
    expectEnvelope(await bodyOf(response), "UNAUTHENTICATED");

    mockSession.value = WRONG_ROLE_SESSION;
    response = await getCustomers(new Request("http://x/api/v1/admin/customers"));
    expect(response.status).toBe(403);
    expectEnvelope(await bodyOf(response), "FORBIDDEN");
  });

  it("owner without a configured adapter ⇒ 503 (fail-closed, no fixture fallback)", async () => {
    mockSession.value = OWNER_SESSION;
    setEnv({ DATA_ADAPTER: undefined });
    const response = await getCustomers(new Request("http://x/api/v1/admin/customers"));
    expect(response.status).toBe(503);
    expectEnvelope(await bodyOf(response), "DEPENDENCY_UNAVAILABLE");
  });

  it("owner with the fake requested in production mode ⇒ 503", async () => {
    mockSession.value = OWNER_SESSION;
    setEnv({ DATA_ADAPTER: "fake", NODE_ENV: "production" });
    const response = await getCustomers(new Request("http://x/api/v1/admin/customers"));
    expect(response.status).toBe(503);
    expectEnvelope(await bodyOf(response), "DEPENDENCY_UNAVAILABLE");
  });

  it("planned endpoints check auth before the 501 marker", async () => {
    mockSession.value = null;
    let response = await postProject();
    expect(response.status).toBe(401);

    mockSession.value = OWNER_SESSION;
    response = await postProject();
    expect(response.status).toBe(501);
    const body = await bodyOf(response);
    expectEnvelope(body, "NOT_IMPLEMENTED");
    const details = (body.error as Record<string, unknown>).details as Record<string, unknown>;
    expect(details.blockedBy).toContain("TBD-PO-05");
  });

  it("engineers is a planned surface (staff accounts TBD-PO-03)", async () => {
    mockSession.value = OWNER_SESSION;
    const response = await getEngineers();
    expect(response.status).toBe(501);
    expectEnvelope(await bodyOf(response), "NOT_IMPLEMENTED");
  });
});

describe("customers over HTTP (persistence across requests)", () => {
  beforeEach(() => {
    mockSession.value = OWNER_SESSION;
  });

  it("POST → 201, then list/get/patch see the same record; audit is appended", async () => {
    const createResponse = await postCustomer(
      jsonRequest("http://x/api/v1/admin/customers", {
        method: "POST",
        headers: { "Idempotency-Key": "http-key-000000000001" },
        body: JSON.stringify({
          name: "Mona Adel",
          phone: "+20 100 123 4567",
          city: "Nasr City",
        }),
      }),
    );
    expect(createResponse.status).toBe(201);
    expect(createResponse.headers.get("cache-control")).toBe("no-store");
    const created = await bodyOf(createResponse);
    expect(created.reference).toBe("CU-000001");
    const id = created.id as string;

    const listResponse = await getCustomers(new Request("http://x/api/v1/admin/customers"));
    const list = await bodyOf(listResponse);
    expect(list.total).toBe(1);

    const getResponse = await getCustomer(new Request("http://x"), {
      params: Promise.resolve({ id }),
    });
    expect(getResponse.status).toBe(200);
    const detail = await bodyOf(getResponse);
    expect(detail.name).toBe("Mona Adel");
    // Contract §3.3 summary block (requests [] until PO-12 linking).
    expect(detail.summary).toEqual({ requests: [], projects: [], openFindings: 0 });

    const patchResponse = await patchCustomer(
      jsonRequest("http://x", {
        method: "PATCH",
        body: JSON.stringify({ city: "Mokattam", version: 1 }),
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(patchResponse.status).toBe(200);
    const patched = await bodyOf(patchResponse);
    expect(patched.city).toBe("Mokattam");
    expect(patched.version).toBe(2);

    const auditResponse = await getAuditEvents(new Request("http://x/api/v1/admin/audit-events"));
    const audit = await bodyOf(auditResponse);
    expect(audit.total).toBe(2);
  });

  it("rejects malformed JSON with the shared envelope", async () => {
    const response = await postCustomer(
      jsonRequest("http://x/api/v1/admin/customers", { method: "POST", body: "{not json" }),
    );
    expect(response.status).toBe(400);
    expectEnvelope(await bodyOf(response), "MALFORMED_BODY");
  });

  it("rejects mass-assignment attempts (workspaceId/id) as 422 readOnly", async () => {
    const response = await postCustomer(
      jsonRequest("http://x/api/v1/admin/customers", {
        method: "POST",
        headers: { "Idempotency-Key": "http-key-000000000002" },
        body: JSON.stringify({
          name: "Mona Adel",
          phone: "+20 100 123 4567",
          workspaceId: "someone-elses-workspace",
          id: "chosen-id",
        }),
      }),
    );
    expect(response.status).toBe(422);
    const body = await bodyOf(response);
    const fieldErrors = (body.error as Record<string, unknown>).fieldErrors as Record<
      string,
      string[]
    >;
    expect(fieldErrors.workspaceId).toEqual(["readOnly"]);
    expect(fieldErrors.id).toEqual(["readOnly"]);
  });

  it("lists projects as an honest empty page (no fixture leakage)", async () => {
    const response = await getProjects(new Request("http://x/api/v1/admin/projects"));
    expect(response.status).toBe(200);
    expect(await bodyOf(response)).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
  });
});

describe("identity & system surfaces", () => {
  it("/me works without a data adapter; anonymous ⇒ 401", async () => {
    setEnv({ DATA_ADAPTER: undefined });
    mockSession.value = null;
    expect((await getMe()).status).toBe(401);

    mockSession.value = OWNER_SESSION;
    const me = await getMe();
    expect(me.status).toBe(200);
    const body = await bodyOf(me);
    expect(body).toMatchObject({ role: "OWN", provisioning: "environment", status: "active" });
    expect(body).not.toHaveProperty("passwordHash");
  });

  it("system status is owner-gated and contains no secret material", async () => {
    mockSession.value = null;
    expect((await getSystemStatus()).status).toBe(401);

    mockSession.value = OWNER_SESSION;
    const response = await getSystemStatus();
    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    const serialized = JSON.stringify(body);
    expect(serialized).not.toContain("test-secret-value");
    expect(serialized).not.toContain("scrypt");
    expect(body.dataAdapter).toMatchObject({
      configured: true,
      name: "fake",
      productionCapable: false,
    });
  });

  it("rejects over-cap JSON bodies (declared length refused before buffering)", async () => {
    const oversized = new Request("http://x", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "40000" },
      body: "{}",
    });
    await expect(readJsonBody(oversized)).rejects.toMatchObject({
      code: "MALFORMED_BODY",
    } satisfies Partial<ApiError>);

    const withinCap = new Request("http://x", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true }),
    });
    await expect(readJsonBody(withinCap)).resolves.toEqual({ ok: true });
  });

  it("serves the OpenAPI document to the owner only", async () => {
    mockSession.value = null;
    expect((await getOpenApi()).status).toBe(401);

    mockSession.value = OWNER_SESSION;
    const response = await getOpenApi();
    expect(response.status).toBe(200);
    const body = await bodyOf(response);
    expect(body.openapi).toBe("3.1.0");
    const paths = body.paths as Record<string, unknown>;
    expect(paths).toHaveProperty("/api/v1/admin/customers");
    expect(paths).toHaveProperty("/api/v1/health");
  });
});
