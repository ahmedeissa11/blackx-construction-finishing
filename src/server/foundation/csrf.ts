/**
 * Server-side Origin / CSRF protection for state-changing foundation routes
 * (contract §1.2, security decision TBD-TECH-02).
 *
 * Threat model: cookie-authenticated mutations (customer create/update)
 * ride the session cookie automatically in browser requests. SameSite=Lax
 * and `__Secure-` are browser-enforced compensating controls, but they do
 * not protect against:
 *   - same-site subdomain attacks (Lax permits same-site POST cookies)
 *   - older browsers that ignore SameSite
 *   - any future form-encoded endpoint that bypasses the content-type
 *     preflight mitigation
 *
 * This module verifies on every state-changing request that `Origin`
 * (falling back to `Referer`) matches the expected application origin
 * resolved server-side from `AUTH_URL` or the `Host` header, or that
 * Fetch Metadata `Sec-Fetch-Site` is `same-origin`. Requests with a
 * mismatched Origin ⇒ 403. Requests with no Origin and no Fetch Metadata
 * (non-browser clients: curl, mobile apps, server-to-server) stay allowed
 * but are logged. Safe methods (GET/HEAD/OPTIONS) are never checked —
 * CSRF only applies to state-changing operations.
 *
 * The expected origin is never client-controlled: `AUTH_URL` (configured
 * by the operator) takes precedence, then the `Host` header, then a
 * derived `https://<host>` fallback. All values are names/booleans only;
 * secrets never appear in logs.
 */

import { logWarn } from "./logger";

/** HTTP methods that mutate state and require origin verification. */
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Resolves the expected application origin server-side. Never client-controlled.
 * `AUTH_URL` (operator-configured, no trailing slash) takes precedence;
 * otherwise derives `https://<host>` from the `Host` header.
 */
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

/**
 * Verifies the Origin / CSRF posture of a request.
 *
 * Returns `null` when the request may proceed, or a `Response` (403) when
 * it must be rejected. Non-browser clients without Origin/Fetch Metadata
 * are allowed but a structured warning is logged.
 */
export function verifyOrigin(request: Request): Response | null {
  // Safe methods are never CSRF-checked.
  if (!STATE_CHANGING_METHODS.has(request.method)) return null;

  const expectedOrigin = getExpectedOrigin(request);
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");

  // --- Origin present: must match expected origin -----------------------
  if (origin !== null) {
    if (expectedOrigin === null) {
      // No server-configured origin to compare against: refuse state changes.
      return jsonError(403, "ORIGIN_REQUIRED", "errors.csrfOriginRequired");
    }
    if (origin !== expectedOrigin) {
      logWarn("csrf.origin_mismatch", {
        method: request.method,
        expectedOrigin,
        requestOrigin: origin,
      });
      return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfOriginMismatch");
    }
    return null;
  }

  // --- No Origin header: consult Fetch Metadata -------------------------
  if (secFetchSite !== null) {
    if (secFetchSite === "same-origin") return null;
    // cross-site, same-site (non-origin), cross-site-same-origin, etc.
    logWarn("csrf.non_same_origin_site", {
      method: request.method,
      secFetchSite,
    });
    return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfCrossSite");
  }

  // --- No Origin and no Fetch Metadata: non-browser client --------------
  // Allowed but logged (defense-in-depth: these clients cannot set
  // Sec-Fetch-Site, so their lack of it is expected).
  logWarn("csrf.non_browser_client", {
    method: request.method,
    hasReferer: referer !== null,
  });
  return null;
}

/** Builds a JSON error response with the shared envelope shape. */
function jsonError(status: number, code: string, messageKey: string): Response {
  return new Response(
    JSON.stringify({
      error: { code, messageKey },
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    },
  );
}
