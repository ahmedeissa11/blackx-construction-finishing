/**
 * Server-side Origin / CSRF protection tests for state-changing
 * foundation routes (security decision TBD-TECH-02).
 *
 * Covers:
 *   - Positive: matching Origin ⇒ request proceeds
 *   - Positive: no Origin + Sec-Fetch-Site: same-origin ⇒ proceeds
 *   - Positive: matching Referer (Origin absent) ⇒ request proceeds
 *   - Positive: no Origin + no Referer + no Fetch Metadata (non-browser client) ⇒ proceeds, logged
 *   - Positive: safe method GET with any/mismatched Origin ⇒ proceeds (no CSRF)
 *   - Negative: mismatched Origin ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: Host: attacker.com + Origin: https://attacker.com rejected when no trusted origin configured
 *   - Negative: cross-site Sec-Fetch-Site ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: same-site Sec-Fetch-Site ⇒ 403 ORIGIN_MISMATCH (same-site is NOT same-origin)
 *   - Negative: mismatched Referer ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: malformed Referer ⇒ 403 ORIGIN_MISMATCH
 *   - Negative: no trusted origin configured + browser headers ⇒ 403 ORIGIN_REQUIRED
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

const TRUSTED_ORIGIN = "https://app.example.com";

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
    AUTH_URL: TRUSTED_ORIGIN,
  });
});

afterEach(() => {
  process.env = previousEnv;
  resetFoundationCacheForTests();
});

function requestWithHeaders(
  url: string,
  method: string,
  headers: Record<string, string | null>,
): Request {
  const urlObj = new URL(url);
  const allHeaders: Record<string, string> = { host: urlObj.host };
  for (const [key, value] of Object.entries(headers)) {
    if (value !== null && value !== undefined) allHeaders[key] = value;
  }
  return new Request(url, { method, headers: allHeaders });
}

describe("getExpectedOrigin", () => {
  it("returns AUTH_URL when configured", () => {
    process.env.AUTH_URL = "https://admin.example.com/";
    expect(getExpectedOrigin()).toBe("https://admin.example.com");
  });

  it("returns null when AUTH_URL is unset", () => {
    delete process.env.AUTH_URL;
    expect(getExpectedOrigin()).toBeNull();
  });
});

describe("verifyOrigin — positive (allowed)", () => {
  it("matching Origin allows state-changing request", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: TRUSTED_ORIGIN,
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("no Origin + Sec-Fetch-Site: same-origin allows", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      "sec-fetch-site": "same-origin",
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("matching Referer (Origin absent) allows", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: `${TRUSTED_ORIGIN}/dashboard`,
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("Referer with only origin matches trusted origin", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: TRUSTED_ORIGIN,
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("no Origin + no Referer + no Fetch Metadata (non-browser client) allows", () => {
    const req = new Request("https://app.example.com/api/v1/admin/customers", { method: "POST" });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("safe method GET with mismatched Origin is not checked", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "GET", {
      origin: "https://evil.example.com",
    });
    expect(verifyOrigin(req)).toBeNull();
  });
});

describe("verifyOrigin — negative (rejected with 403)", () => {
  it("mismatched Origin returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: "https://evil.example.com",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("Host: attacker.com + Origin: https://attacker.com rejected when no trusted origin", async () => {
    delete process.env.AUTH_URL;
    const req = new Request("https://app.example.com/api/v1/admin/customers", {
      method: "POST",
      headers: {
        host: "attacker.com",
        origin: "https://attacker.com",
      },
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_REQUIRED");
  });

  it("no trusted origin + Origin header returns 403 ORIGIN_REQUIRED", async () => {
    delete process.env.AUTH_URL;
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: TRUSTED_ORIGIN,
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_REQUIRED");
  });

  it("Sec-Fetch-Site: cross-site returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      "sec-fetch-site": "cross-site",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("Sec-Fetch-Site: same-site (non-origin) returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      "sec-fetch-site": "same-site",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("mismatched Referer returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: "https://evil.example.com/dashboard",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("malformed Referer returns 403 ORIGIN_MISMATCH", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: "not-a-valid-url",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    const body = JSON.parse(await res!.text());
    expect(body.error.code).toBe("ORIGIN_MISMATCH");
  });

  it("Origin present but no trusted origin configured returns 403", async () => {
    delete process.env.AUTH_URL;
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: TRUSTED_ORIGIN,
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
  });
});

describe("handleFoundationRoute — CSRF integration", () => {
  const handler = vi.fn(() => Promise.resolve({ body: { ok: true }, status: 200 }));

  beforeEach(() => {
    handler.mockReset();
    mockSession.value = OWNER_SESSION;
  });

  it("POST with matching Origin proceeds to handler", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: TRUSTED_ORIGIN,
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("POST with mismatched Origin returns 403 without calling handler", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: "https://evil.example.com",
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });

  it("GET with mismatched Origin proceeds (safe method not checked)", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "GET", {
      origin: "https://evil.example.com",
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("PATCH with matching Origin proceeds", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers/1", "PATCH", {
      origin: TRUSTED_ORIGIN,
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers/{id}", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("POST with Host: attacker.com + Origin: https://attacker.com returns 403 without calling handler", async () => {
    delete process.env.AUTH_URL;
    const req = new Request("https://app.example.com/api/v1/admin/customers", {
      method: "POST",
      headers: { host: "attacker.com", origin: "https://attacker.com" },
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});
