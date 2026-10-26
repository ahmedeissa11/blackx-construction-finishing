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
import { verifyOrigin, getExpectedOrigin, getExpectedOrigins } from "@/server/foundation/csrf";
import { resetFoundationCacheForTests } from "@/server/foundation/runtime";

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
    CSRF_TRUSTED_ORIGINS: undefined,
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

describe("getExpectedOrigins — comma-separated CSRF_TRUSTED_ORIGINS", () => {
  it("returns single origin list for single CSRF_TRUSTED_ORIGINS", () => {
    process.env.CSRF_TRUSTED_ORIGINS = "https://app.example.com";
    expect(getExpectedOrigins()).toEqual(["https://app.example.com"]);
  });

  it("returns multiple origins for comma-separated CSRF_TRUSTED_ORIGINS", () => {
    process.env.CSRF_TRUSTED_ORIGINS =
      "https://blackx-construction-finishing.vercel.app, https://blackx-construction-finishing-f58f26z4s-ahmedeissa11s-projects.vercel.app";
    expect(getExpectedOrigins()).toEqual([
      "https://blackx-construction-finishing.vercel.app",
      "https://blackx-construction-finishing-f58f26z4s-ahmedeissa11s-projects.vercel.app",
    ]);
  });

  it("strips trailing slashes from each origin", () => {
    process.env.CSRF_TRUSTED_ORIGINS = "https://app.example.com/, https://other.example.com/";
    expect(getExpectedOrigins()).toEqual(["https://app.example.com", "https://other.example.com"]);
  });

  it("returns empty array when CSRF_TRUSTED_ORIGINS is unset", () => {
    delete process.env.CSRF_TRUSTED_ORIGINS;
    delete process.env.AUTH_URL;
    expect(getExpectedOrigins()).toEqual([]);
  });

  it("fails closed for empty entries in comma-separated CSRF_TRUSTED_ORIGINS", () => {
    process.env.CSRF_TRUSTED_ORIGINS = "https://app.example.com, , https://other.example.com";
    expect(getExpectedOrigins()).toEqual([]);
  });
});

describe("verifyOrigin — multiple trusted origins", () => {
  const MULTI_ORIGIN_ENV = {
    AUTH_SECRET: "test-secret-value-with-32-plus-chars",
    ADMIN_OWNER_EMAIL: "owner@example.com",
    ADMIN_OWNER_PASSWORD_HASH: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
    DATA_ADAPTER: "fake",
    NODE_ENV: "test",
    CSRF_TRUSTED_ORIGINS: "https://app.example.com, https://preview.example.com",
  };

  beforeEach(() => {
    setEnv(MULTI_ORIGIN_ENV);
  });

  it("accepts Origin matching first trusted origin", () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: "https://app.example.com",
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("accepts Origin matching second trusted origin", () => {
    const req = requestWithHeaders("https://preview.example.com/api/v1/admin/customers", "POST", {
      origin: "https://preview.example.com",
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("rejects arbitrary Vercel preview subdomain not in CSRF_TRUSTED_ORIGINS", async () => {
    const req = requestWithHeaders(
      "https://blackx-construction-finishing-arbitrary-preview.vercel.app/api/v1/admin/customers",
      "POST",
      {
        origin: "https://blackx-construction-finishing-arbitrary-preview.vercel.app",
      },
    );
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(JSON.parse(await res!.text()).error.code).toBe("ORIGIN_MISMATCH");
  });

  it("rejects *.vercel.app wildcard-style origin not explicitly listed", async () => {
    const req = requestWithHeaders(
      "https://any-preview.vercel.app/api/v1/admin/customers",
      "POST",
      {
        origin: "https://any-preview.vercel.app",
      },
    );
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(JSON.parse(await res!.text()).error.code).toBe("ORIGIN_MISMATCH");
  });

  it("rejects malicious Referer not in trusted origins", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: "https://evil.example.com/dashboard",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(JSON.parse(await res!.text()).error.code).toBe("ORIGIN_MISMATCH");
  });

  it("rejects Referer with subdomain of trusted origin not explicitly listed", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: "https://untrusted.app.example.com/dashboard",
    });
    const res = verifyOrigin(req);
    expect(res).not.toBeNull();
    expect(res!.status).toBe(403);
    expect(JSON.parse(await res!.text()).error.code).toBe("ORIGIN_MISMATCH");
  });

  it("accepts Referer matching second trusted origin", () => {
    const req = requestWithHeaders("https://preview.example.com/api/v1/admin/customers", "POST", {
      origin: null,
      referer: "https://preview.example.com/dashboard",
    });
    expect(verifyOrigin(req)).toBeNull();
  });

  it("getExpectedOrigin returns first origin only for backward compatibility", () => {
    expect(getExpectedOrigin()).toBe("https://app.example.com");
  });
});

describe("handleFoundationRoute — multi-origin CSRF integration", () => {
  const handler = vi.fn(() => Promise.resolve({ body: { ok: true }, status: 200 }));

  beforeEach(() => {
    handler.mockReset();
    mockSession.value = OWNER_SESSION;
    setEnv({
      AUTH_SECRET: "test-secret-value-with-32-plus-chars",
      ADMIN_OWNER_EMAIL: "owner@example.com",
      ADMIN_OWNER_PASSWORD_HASH: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
      DATA_ADAPTER: "fake",
      NODE_ENV: "test",
      CSRF_TRUSTED_ORIGINS: "https://app.example.com, https://preview.example.com",
    });
  });

  it("POST from first trusted origin proceeds to handler", async () => {
    const req = requestWithHeaders("https://app.example.com/api/v1/admin/customers", "POST", {
      origin: "https://app.example.com",
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("POST from second trusted origin proceeds to handler", async () => {
    const req = requestWithHeaders("https://preview.example.com/api/v1/admin/customers", "POST", {
      origin: "https://preview.example.com",
    });
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it("POST from untrusted Vercel preview subdomain returns 403 without calling handler", async () => {
    const req = requestWithHeaders(
      "https://blackx-construction-finishing-arbitrary-preview.vercel.app/api/v1/admin/customers",
      "POST",
      {
        origin: "https://blackx-construction-finishing-arbitrary-preview.vercel.app",
      },
    );
    const res = await handleFoundationRoute("/api/v1/admin/customers", handler, req);
    expect(res.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});

describe("CSRF configuration hardening", () => {
  it("keeps AUTH_URL a single Auth.js-compatible URL when using an allowlist", () => {
    process.env.CSRF_TRUSTED_ORIGINS = "https://app.example.com,https://preview.example.com";
    expect(new URL(process.env.AUTH_URL!).origin).toBe(TRUSTED_ORIGIN);
    expect(getExpectedOrigins()).toEqual([TRUSTED_ORIGIN, "https://preview.example.com"]);
  });

  it("normalizes origins and removes duplicates", () => {
    process.env.CSRF_TRUSTED_ORIGINS = "https://APP.example.com:443/,https://app.example.com";
    expect(getExpectedOrigins()).toEqual([TRUSTED_ORIGIN]);
  });

  it.each([
    "",
    " ",
    "null",
    "not-a-url",
    "https://*.vercel.app",
    "https://app.example.com/path",
    "https://app.example.com/?query=1",
    "https://app.example.com/#fragment",
    "https://user:pass@app.example.com",
    "ftp://app.example.com",
    "file:///tmp/file",
    "https://app.example.com,",
    "https://app.example.com,not-a-url",
    "https://app.example.com\\evil",
    "https:app.example.com",
  ])("fails closed for invalid explicit configuration %j", (configured) => {
    // An explicitly empty allowlist disables trust instead of widening to AUTH_URL.
    process.env.CSRF_TRUSTED_ORIGINS = configured;
    expect(getExpectedOrigins()).toEqual([]);
    expect(
      verifyOrigin(
        requestWithHeaders(TRUSTED_ORIGIN, "POST", {
          origin: TRUSTED_ORIGIN,
          "sec-fetch-site": "same-origin",
        }),
      )?.status,
    ).toBe(403);
  });

  it("does not interpret AUTH_URL as a list", () => {
    process.env.AUTH_URL = "https://app.example.com,https://preview.example.com";
    expect(getExpectedOrigins()).toEqual([]);
  });
});

describe("CSRF source-header precedence and exact matching", () => {
  it.each([
    "null",
    "",
    "https://app.example.com.evil.test",
    "https://evil-app.vercel.app",
    "http://app.example.com",
    "https://app.example.com:444",
    "https://app.example.com/",
    "https://user@app.example.com",
    "https://app.example.com https://evil.test",
    "https://app.example.com, https://evil.test",
  ])("rejects invalid Origin %j despite valid Referer and same-origin metadata", (origin) => {
    expect(
      verifyOrigin(
        requestWithHeaders(TRUSTED_ORIGIN, "POST", {
          origin,
          referer: `${TRUSTED_ORIGIN}/dashboard`,
          "sec-fetch-site": "same-origin",
          host: "app.example.com",
          "x-forwarded-host": "app.example.com",
        }),
      )?.status,
    ).toBe(403);
  });

  it.each([
    "https://evil.test/path",
    "https://app.example.com.evil.test/path",
    "not-a-url",
    "",
    "https://app.example.com@evil.test/path",
    "https://user@app.example.com/path",
    "blob:https://app.example.com/id",
    "https://app.example.com:444/path",
  ])("does not let same-origin metadata or trusted Origin override bad Referer %j", (referer) => {
    for (const origin of [null, TRUSTED_ORIGIN]) {
      expect(
        verifyOrigin(
          requestWithHeaders(TRUSTED_ORIGIN, "POST", {
            origin,
            referer,
            "sec-fetch-site": "same-origin",
          }),
        )?.status,
      ).toBe(403);
    }
  });

  it.each(["POST", "PATCH", "PUT", "DELETE"])("checks %s mutations", (method) => {
    expect(
      verifyOrigin(
        requestWithHeaders(TRUSTED_ORIGIN, method, {
          origin: "https://evil.test",
        }),
      )?.status,
    ).toBe(403);
  });

  it("does not log raw Referer URLs or Origin values", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    try {
      verifyOrigin(
        requestWithHeaders(TRUSTED_ORIGIN, "POST", {
          referer: "https://evil.test/?private=do-not-log-this",
        }),
      );
      expect(warn).toHaveBeenCalled();
      expect(JSON.stringify(warn.mock.calls)).not.toContain("do-not-log-this");
      expect(JSON.stringify(warn.mock.calls)).not.toContain("evil.test");
    } finally {
      warn.mockRestore();
    }
  });
});

describe("handleFoundationRoute — conflicting browser headers", () => {
  it("rejects bad Referer with same-origin metadata before invoking the handler", async () => {
    mockSession.value = OWNER_SESSION;
    const handler = vi.fn();
    const response = await handleFoundationRoute(
      "/api/v1/admin/customers",
      handler,
      requestWithHeaders(TRUSTED_ORIGIN, "POST", {
        referer: "https://evil.test/dashboard",
        "sec-fetch-site": "same-origin",
      }),
    );
    expect(response.status).toBe(403);
    expect(handler).not.toHaveBeenCalled();
  });
});
