# Security Review — PR #13 (arena/backend-foundation-csrf-port)

**Scope:** Focused security review of PR #13 before merge. No changes made, no commits pushed, no merge, no deploy.
**Branch:** `arena/backend-foundation-csrf-port` @ `a5230ee` (based on `origin/main` `fccedf6`)
**PR:** #13 (76 files, +18,702 / −40)
**Review date:** 2026-10-25

---

## Executive Summary

PR #13 ports PR #8's backend foundation onto current `main` and adds server-side Origin/CSRF protection. The foundation layer itself is well-designed and fail-closed. However, the CSRF implementation contains a **HIGH-severity vulnerability**: when `AUTH_URL` is not configured, the expected origin is derived from the untrusted `Host` header, which an attacker can spoof to completely bypass CSRF protection. Additionally, the documented Referer fallback is not enforced (it is read but never used for authorization), and the non-browser-client allowlist is a documented but real design trade-off.

**Do not merge until Finding #1 (Host header spoofing) is resolved.**

---

## Finding #1 — Expected origin derived from untrusted Host header (HIGH)

### Evidence

`src/server/foundation/csrf.ts`, lines 38–48:

```ts
export function getExpectedOrigin(request: Request): string | null {
  const configured = process.env.AUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  const host = request.headers.get("host");
  if (host) {
    // Strip port for origin comparison; scheme defaults to https.
    const hostname = host.split(":")[0];
    return `https://${hostname}`;
  }
  return null;
}
```

### Vulnerability

When `AUTH_URL` is not set (which is the current default — it's optional per `.env.example`), the expected origin is derived from the `Host` header. The `Host` header is fully client-controlled. An attacker can:

1. Send a state-changing POST with `Host: attacker.com` and `Origin: https://attacker.com`
2. `getExpectedOrigin()` returns `https://attacker.com`
3. `origin === expectedOrigin` → request is **allowed**

This completely bypasses CSRF protection for cookie-authenticated mutations (`POST /api/v1/admin/customers`, `PATCH /api/v1/admin/customers/[id]`) whenever `AUTH_URL` is unset.

### Verification

A simulation of the actual `verifyOrigin` logic confirmed:

| Scenario | Result |
|---|---|
| No `AUTH_URL`, `Host: attacker.com`, `Origin: https://attacker.com` | **ALLOWED** (vulnerable) |
| `AUTH_URL` set, `Origin: https://attacker.com` | BLOCKED (403 ORIGIN_MISMATCH) |

### Recommendation

Do not derive the expected origin from the `Host` header. Either:
- Require `AUTH_URL` to be configured before CSRF protection is active (refuse state changes with 503/403 when unset), or
- Maintain a trusted allowlist of origins, or
- Derive origin only from a trusted proxy header (e.g. `X-Forwarded-Host`) when behind a known reverse proxy, never from raw `Host`.

---

## Finding #2 — No Origin + no Referer + no Fetch Metadata is accepted (MEDIUM)

### Evidence

`src/server/foundation/csrf.ts`, lines 74–81:

```ts
// --- No Origin and no Fetch Metadata: non-browser client --------------
// Allowed but logged (defense-in-depth: these clients cannot set
// Sec-Fetch-Site, so their lack of it is expected).
logWarn("csrf.non_browser_client", {
  method: request.method,
  hasReferer: referer !== null,
});
return null;
```

### Behavior

A state-changing request with:
- No `Origin` header
- No `Sec-Fetch-Site` header
- Any `Referer` value (or none)

…is **accepted** (`null` returned). Referer is read (line 59) but never checked against the expected origin — it is only logged.

### Safety analysis

This is acceptable **only because** authentication requires a valid NextAuth session cookie. Non-browser clients (curl, mobile apps, server-to-server) must manually manage cookies and cannot be tricked into sending them via a malicious site. The `Content-Type: application/json` requirement in `readJsonBody` (`src/server/foundation/http.ts`, lines 35–39) also blocks simple HTML form submissions.

The residual risk is for very old browsers that send neither `Origin` nor `Sec-Fetch-Site`. SameSite=Lax (set on the session cookie per `next-auth`) is the documented compensating control.

### Recommendation

This is a documented design trade-off, not a bug. Keep it, but consider logging more prominently and revisiting if same-origin browser requests without `Sec-Fetch-Site` become a concern.

---

## Finding #3 — Referer fallback documented but not enforced (MEDIUM)

### Evidence

`src/server/foundation/csrf.ts`:
- Line 59: `const referer = request.headers.get("referer");` — read but never compared
- Lines 60–81: `referer` appears only in the log at line 80 (`hasReferer: referer !== null`)
- Module docstring (lines 13–14): "verifies on every state-changing request that `Origin` (falling back to `Referer`) matches the expected application origin"

### Gap

The comment promises a Referer fallback, but the code never uses `referer` for authorization. If `Origin` is missing and `Sec-Fetch-Site` is missing, the request is allowed regardless of what `Referer` says.

### Recommendation

Either implement the Referer fallback (compare `Referer`'s origin against `expectedOrigin`) or update the docstring to remove the promise of Referer fallback. Given that modern browsers send either `Origin` or `Sec-Fetch-Site`, this is a minor gap, but the documentation/code mismatch should be fixed.

---

## Finding #4 — CSRF runs before every authenticated state-changing handler (PASS)

### Evidence

`src/server/foundation/admin-http.ts`, lines 78–99:

```ts
export async function handleFoundationRoute(
  routeTemplate: string,
  handler: …,
  request?: Request,
): Promise<Response> {
  const correlationId = newCorrelationId();

  // CSRF origin verification runs before auth for state-changing methods
  if (request !== null && request !== undefined) {
    const csrfResult = verifyOrigin(request);
    if (csrfResult !== null) {
      logWarn("csrf.rejected", { route: routeTemplate, method: request.method, correlationId });
      return csrfResult;
    }
  }

  try {
    const actor = await requireActor();   // ← auth enforced server-side after CSRF
    …
```

### Verification

All state-changing routes pass `request` as the third argument:

| Route | Method | Passes `request` |
|---|---|---|
| `src/app/api/v1/admin/customers/route.ts` | POST | ✓ line 24 |
| `src/app/api/v1/admin/customers/[id]/route.ts` | PATCH | ✓ line 33 |

All other `handleFoundationRoute` calls are GET-only (safe methods, CSRF correctly not applied). All `handlePlannedRoute` calls return `501 NOT_IMPLEMENTED` before any state change, so CSRF is not needed there.

Authorization (`requireActor`) is enforced server-side **after** CSRF but **before** the handler runs. ✓

---

## Finding #5 — Production fails closed: no fake adapter, no false success (PASS)

### Evidence

`src/server/foundation/config.ts`, lines 42–52:

```ts
if (requested === "fake" && env.NODE_ENV === "production") {
  return { kind: "refused", requested, reason: "fake_in_production" };
}
```

`src/server/foundation/runtime.ts`, lines 33–44:

```ts
if (selection.kind !== "active") {
  …
  return null;
}
```

`src/server/foundation/admin-http.ts`, lines 93–97:

```ts
if (!services) {
  throw new ApiError("DEPENDENCY_UNAVAILABLE");  // 503
}
```

### Verification

- In production (`NODE_ENV=production`), the fake adapter is refused → `getFoundationServices()` returns `null`
- `handleFoundationRoute` throws `DEPENDENCY_UNAVAILABLE` (503) when services is null
- No silent fallback to fixtures or in-memory storage
- No write can fake success

The only implemented write routes (`POST /api/v1/admin/customers`, `PATCH /api/v1/admin/customers/[id]`) both go through `handleFoundationRoute` and will return 503 in production without a real adapter. ✓

---

## Finding #6 — Same-site cross-origin requests correctly blocked (PASS)

### Evidence

`src/server/foundation/csrf.ts`, lines 65–71:

```ts
if (secFetchSite !== null) {
  if (secFetchSite === "same-origin") return null;
  // cross-site, same-site (non-origin), cross-site-same-origin, etc.
  return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfCrossSite");
}
```

`Sec-Fetch-Site: same-site` (e.g., a subdomain making a cross-origin request) is rejected with 403. Same-site subdomain attacks are blocked. ✓

---

## Finding #7 — Middleware does not bypass CSRF (PASS)

### Evidence

`src/middleware.ts`, lines 11–14:

```ts
if (pathname.startsWith("/api/")) {
  return NextResponse.next();
}
```

API routes pass through middleware untouched. Each handler enforces its own rules (CSRF + auth + adapter availability). CSRF runs inside the handler via `handleFoundationRoute`. ✓

---

## Finding #8 — No unrelated or risky changes in the 76 files (PASS)

### Evidence

The 76 files consist of:

| Category | Count | Assessment |
|---|---|---|
| New foundation files (`src/server/foundation/`) | 16 | All new, no existing code modified |
| New API routes (`src/app/api/v1/admin/`) | 38 | All new routes; only customers POST/PATCH are state-changing |
| New types/client (`src/lib/`) | 2 | `api-types.ts`, `api-client.ts` — new files only |
| New CSRF module + test | 2 | `csrf.ts`, `foundation-csrf.test.ts` |
| Modified existing files | 3 | `globals.css` (CSS only, resolved to main's redesign), `tokens.css` (identical diff on both sides), `.env.example` (docs only) |
| New docs | 8 | Documentation only |
| New tests | 9 | Test files only |
| Audit report | 1 | `PR8_AUDIT_REPORT.md` — documentation |

No existing application code was modified except `globals.css` (presentation only). No database schema changes. No runtime behavior changes to existing routes. ✓

---

## Consolidated Findings Table

| # | Finding | Severity | File | Status |
|---|---|---|---|---|
| 1 | Expected origin derived from untrusted `Host` header; spoofable | **HIGH** | `src/server/foundation/csrf.ts:38-48` | **Unresolved** |
| 2 | No Origin + no Referer + no Fetch Metadata → accepted (documented trade-off) | MEDIUM | `src/server/foundation/csrf.ts:74-81` | Documented design |
| 3 | Referer fallback documented but not enforced | MEDIUM | `src/server/foundation/csrf.ts:59, 13-14` | Doc/code mismatch |
| 4 | CSRF runs before auth; auth enforced server-side | PASS | `src/server/foundation/admin-http.ts:78-99` | OK |
| 5 | Production fails closed; no fake adapter writes | PASS | `config.ts:42-52`, `runtime.ts:33-44` | OK |
| 6 | Same-site cross-origin blocked | PASS | `csrf.ts:65-71` | OK |
| 7 | Middleware doesn't bypass CSRF | PASS | `middleware.ts:11-14` | OK |
| 8 | No unrelated/risky changes | PASS | All 76 files | OK |

---

## Recommendation

**Do not merge PR #13 until Finding #1 (Host header spoofing) is resolved.**

### Required fix before merge

1. **Fix the Host header spoofing** in `src/server/foundation/csrf.ts` `getExpectedOrigin()`:
   - Option A: Require `AUTH_URL` to be configured; if unset, refuse state-changing requests (503) instead of falling back to `Host`.
   - Option B: Use a trusted allowlist of origins.
   - Option C: Only trust `Host` from a known proxy (check `X-Forwarded-Proto`/`X-Forwarded-Host` from trusted proxies only).

2. **Fix the Referer fallback** (Finding #3): either implement it or correct the docstring.

3. **Re-run tests** after the fix: `vitest run`, `tsc --noEmit`, `eslint`, `prettier --check`, `next build`.

### What is safe to merge after fix

Everything else in the PR: foundation layer, API routes, types, client, docs, tests, CSS resolution. The CSRF module structure is sound — only the origin resolution source needs to change.

---

**Preserved:** PR #8's original branch (`arena/b04f8c7e-blackx-construction-finishing` @ `9b84ec8`) is untouched. PR #13 is on a separate branch (`arena/backend-foundation-csrf-port` @ `a5230ee`). No deployments were made.
