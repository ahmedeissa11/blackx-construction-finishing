/**
 * Staging security integration tests for BLACK X backend foundation.
 *
 * These tests run against the deployed foundation routes using the fake
 * adapter in an isolated non-production environment, simulating staging
 * conditions with AUTH_URL explicitly configured. They verify CSRF
 * protection, fail-closed governance, and planned-route markers without
 * touching production, production env vars, or real customer data.
 *
 * Staging simulation:
 *   - AUTH_URL is set to a trusted origin (simulating a Vercel Preview
 *     deployment with AUTH_URL matching the preview origin).
 *   - DATA_ADAPTER=fake (dev/test only, refused in production).
 *   - NODE_ENV=test for normal staging behavior; NODE_ENV=production
 *     only for the fake-adapter-refusal test.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSession = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/auth", () => ({
  getReviewSession: async () => mockSession.value,
}));

import { GET as getCustomers, POST as postCustomer } from "@/app/api/v1/admin/customers/route";
import {
  GET as getCustomer,
  PATCH as patchCustomer,
} from "@/app/api/v1/admin/customers/[id]/route";
import { GET as getProjects, POST as postProject } from "@/app/api/v1/admin/projects/route";
import { GET as getSystemStatus } from "@/app/api/v1/admin/system/status/route";
import { GET as getHealth } from "@/app/api/v1/health/route";
import { resetFoundationCacheForTests } from "@/server/foundation/runtime";

const STAGING_ORIGIN = "https://blackx-preview-staging.vercel.app";
const EVIL_ORIGIN = "https://evil.example";

const OWNER_SESSION = {
  user: { email: "owner@example.com", name: "Company Owner Review", role: "owner_review" },
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
  // Staging simulation: AUTH_URL matches the preview origin.
  setEnv({
    ...AUTH_ENV,
    AUTH_URL: STAGING_ORIGIN,
    DATA_ADAPTER: "fake",
    NODE_ENV: "test",
  });
});

afterEach(() => {
  process.env = previousEnv;
  resetFoundationCacheForTests();
});

function stagingRequest(path: string, method: string, origin?: string | null): Request {
  const headers: Record<string, string> = {};
  if (origin !== null && origin !== undefined) headers.origin = origin;
  headers["content-type"] = "application/json";
  return new Request(`https://${new URL(STAGING_ORIGIN).host}${path}`, {
    method,
    headers,
  });
}

async function bodyOf(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

function expectEnvelope(body: Record<string, unknown>, code: string): void {
  const error = body.error as Record<string, unknown>;
  expect(error.code).toBe(code);
  expect(typeof error.messageKey).toBe("string");
}

describe("Staging security — CSRF origin protection", () => {
  it("1a. State-changing POST with Origin: https://evil.example is rejected with 403", async () => {
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/customers", "POST", EVIL_ORIGIN);
    const res = await postCustomer(req);
    expect(res.status).toBe(403);
    const body = await bodyOf(res);
    expectEnvelope(body, "ORIGIN_MISMATCH");
  });

  it("1b. State-changing PATCH with Origin: https://evil.example is rejected with 403", async () => {
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/customers/1", "PATCH", EVIL_ORIGIN);
    const res = await patchCustomer(req, { params: Promise.resolve({ id: "1" }) });
    expect(res.status).toBe(403);
    const body = await bodyOf(res);
    expectEnvelope(body, "ORIGIN_MISMATCH");
  });

  it("2. Matching same-origin request passes CSRF and reaches auth/adapter response", async () => {
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/customers", "POST", STAGING_ORIGIN);
    const res = await postCustomer(req);
    // CSRF passes (not 403); then auth passes (owner session); then adapter
    // is active (fake in test mode). The request has no valid JSON body,
    // so we get a structured error from body parsing — NOT a 403 from CSRF.
    // The important assertion is that CSRF did not reject the request.
    expect(res.status).not.toBe(403);
    const body = await bodyOf(res);
    // If it reaches body parsing/validation, we get a structured error envelope.
    if (res.status >= 400) {
      const error = body.error as Record<string, unknown>;
      expect(typeof error.messageKey).toBe("string");
    }
  });

  it("3. No trusted origin configured → fail closed with 403 ORIGIN_REQUIRED", async () => {
    delete process.env.AUTH_URL;
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/customers", "POST", STAGING_ORIGIN);
    const res = await postCustomer(req);
    expect(res.status).toBe(403);
    const body = await bodyOf(res);
    expectEnvelope(body, "ORIGIN_REQUIRED");
  });
});

describe("Staging security — fail-closed production governance", () => {
  it("4. Fake adapter is refused when NODE_ENV=production", async () => {
    mockSession.value = OWNER_SESSION;
    // Simulate production: NODE_ENV=production with DATA_ADAPTER=fake.
    setEnv({
      ...AUTH_ENV,
      AUTH_URL: STAGING_ORIGIN,
      DATA_ADAPTER: "fake",
      NODE_ENV: "production",
    });
    const req = stagingRequest("/api/v1/admin/customers", "POST", STAGING_ORIGIN);
    const res = await postCustomer(req);
    expect(res.status).toBe(503);
    const body = await bodyOf(res);
    expectEnvelope(body, "DEPENDENCY_UNAVAILABLE");
  });
});

describe("Staging security — planned write routes return 501", () => {
  it("5a. POST /api/v1/admin/projects returns 501 NOT_IMPLEMENTED", async () => {
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/projects", "POST", STAGING_ORIGIN);
    const res = await postProject();
    expect(res.status).toBe(501);
    const body = await bodyOf(res);
    expectEnvelope(body, "NOT_IMPLEMENTED");
  });

  it("5b. GET /api/v1/admin/projects is read-only and allowed", async () => {
    mockSession.value = OWNER_SESSION;
    const req = stagingRequest("/api/v1/admin/projects", "GET", STAGING_ORIGIN);
    const res = await getProjects(req);
    expect(res.status).not.toBe(403);
    expect(res.status).not.toBe(501);
  });
});

describe("Staging security — unauthenticated protected routes return 401", () => {
  it("6a. GET /api/v1/admin/customers without session → 401 UNAUTHENTICATED", async () => {
    mockSession.value = null;
    const req = stagingRequest("/api/v1/admin/customers", "GET", STAGING_ORIGIN);
    const res = await getCustomers(req);
    expect(res.status).toBe(401);
    const body = await bodyOf(res);
    expectEnvelope(body, "UNAUTHENTICATED");
  });

  it("6b. GET /api/v1/admin/system/status without session → 401 UNAUTHENTICATED", async () => {
    mockSession.value = null;
    const req = stagingRequest("/api/v1/admin/system/status", "GET", STAGING_ORIGIN);
    const res = await getSystemStatus();
    expect(res.status).toBe(401);
    const body = await bodyOf(res);
    expectEnvelope(body, "UNAUTHENTICATED");
  });

  it("6c. Public /api/v1/health does NOT require auth", async () => {
    mockSession.value = null;
    const res = await getHealth();
    expect(res.status).toBe(200);
    const body = await bodyOf(res);
    expect(body).toEqual({ status: "ok" });
  });
});
