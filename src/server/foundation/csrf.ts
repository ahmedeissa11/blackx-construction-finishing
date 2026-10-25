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
 * (falling back to `Referer`) matches the trusted application origin
 * resolved from the `AUTH_URL` environment variable, or that Fetch
 * Metadata `Sec-Fetch-Site` is `same-origin`. The raw `Host` header is
 * never trusted: it is client-controlled and can be spoofed to bypass
 * origin checks.
 *
 * Requests with a mismatched Origin/Referer ⇒ 403. When no trusted
 * origin is configured, all browser state-changing requests are refused
 * with 403 ORIGIN_REQUIRED. Requests from non-browser clients (no
 * Origin, no Referer, no Sec-Fetch-Site) stay allowed but are logged —
 * they must still present a valid session cookie and cannot be tricked
 * into sending cookies by a malicious site.
 *
 * Safe methods (GET/HEAD/OPTIONS) are never checked — CSRF only applies
 * to state-changing operations.
 *
 * Configuration:
 *   AUTH_URL — required trusted origin for state-changing requests.
 *   When unset, all browser state-changing requests fail closed.
 */

import { logWarn } from "./logger";

/** HTTP methods that mutate state and require origin verification. */
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/** Headers that indicate the request originates from a browser context. */
const BROWSER_HEADERS = ["origin", "referer", "sec-fetch-site"];

/**
 * Resolves the trusted application origin server-side from configuration.
 * Never client-controlled: only the operator-configured `AUTH_URL` is
 * trusted. The raw `Host` header is never used because it can be spoofed.
 */
export function getExpectedOrigin(): string | null {
  const configured = process.env.AUTH_URL?.trim();
  if (!configured) return null;
  return configured.replace(/\/+$/, "");
}

/** Returns true if the request carries any browser-origin header. */
function hasBrowserHeader(request: Request): boolean {
  return BROWSER_HEADERS.some((header) => request.headers.get(header) !== null);
}

/**
 * Parses the origin (scheme + host + port) from a Referer URL.
 * Returns null if the Referer is malformed or empty.
 */
function parseRefererOrigin(referer: string): string | null {
  try {
    const url = new URL(referer.trim());
    return url.origin;
  } catch {
    return null;
  }
}

/**
 * Verifies the Origin / CSRF posture of a request.
 *
 * Returns `null` when the request may proceed, or a `Response` (403) when
 * it must be rejected.
 */
export function verifyOrigin(request: Request): Response | null {
  // Safe methods are never CSRF-checked.
  if (!STATE_CHANGING_METHODS.has(request.method)) return null;

  const trustedOrigin = getExpectedOrigin();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");
  const hasBrowserHeader = origin !== null || referer !== null || secFetchSite !== null;

  // No trusted origin configured: refuse all browser state changes.
  if (trustedOrigin === null) {
    if (hasBrowserHeader) {
      logWarn("csrf.origin_required_no_trusted_origin", {
        method: request.method,
      });
      return jsonError(403, "ORIGIN_REQUIRED", "errors.csrfOriginRequired");
    }
    // Non-browser client without any browser header: allowed but logged.
    // These clients must still present a valid session cookie and cannot
    // be tricked into sending cookies by a malicious site.
    logWarn("csrf.non_browser_client_no_trusted_origin", {
      method: request.method,
    });
    return null;
  }

  // --- Origin present: must match trusted origin -----------------------
  if (origin !== null) {
    if (origin !== trustedOrigin) {
      logWarn("csrf.origin_mismatch", {
        method: request.method,
        trustedOrigin,
        requestOrigin: origin,
      });
      return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfOriginMismatch");
    }
    return null;
  }

  // --- No Origin header: consult Fetch Metadata -----------------------
  if (secFetchSite !== null) {
    if (secFetchSite === "same-origin") return null;
    // cross-site, same-site (non-origin), etc. — same-site is NOT same-origin.
    logWarn("csrf.non_same_origin_site", {
      method: request.method,
      secFetchSite,
    });
    return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfCrossSite");
  }

  // --- No Origin: fall back to Referer --------------------------------
  if (referer !== null) {
    const refererOrigin = parseRefererOrigin(referer);
    if (refererOrigin === null || refererOrigin !== trustedOrigin) {
      logWarn("csrf.referer_mismatch", {
        method: request.method,
        trustedOrigin,
        referer,
      });
      return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfRefererMismatch");
    }
    return null;
  }

  // --- No Origin, no Fetch Metadata, no Referer: non-browser client ---
  logWarn("csrf.non_browser_client", {
    method: request.method,
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
