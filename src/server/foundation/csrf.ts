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
 * resolved from server configuration, or that Fetch
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
 *   AUTH_URL — single canonical Auth.js URL, used as the default trusted origin.
 *   CSRF_TRUSTED_ORIGINS — optional explicit comma-separated origin allowlist.
 *   When unset, all browser state-changing requests fail closed.
 */

import { logWarn } from "./logger";

/** HTTP methods that mutate state and require origin verification. */
const STATE_CHANGING_METHODS = new Set(["POST", "PATCH", "PUT", "DELETE"]);

/**
 * Resolves the trusted application origin(s) server-side from configuration.
 * `CSRF_TRUSTED_ORIGINS` may contain a comma-separated list of origins.
 * Otherwise the single canonical `AUTH_URL` is used. Never put a list in
 * `AUTH_URL`: Auth.js parses that variable as a single URL. Only
 * operator-configured origins are trusted. The raw `Host` header is never
 * used because it can be spoofed.
 */
export function getExpectedOrigins(): string[] {
  const explicit = process.env.CSRF_TRUSTED_ORIGINS;
  const configured = explicit ?? process.env.AUTH_URL;
  if (!configured?.trim()) return [];
  const entries = explicit === undefined ? [configured] : configured.split(",");
  const origins: string[] = [];
  for (const entry of entries) {
    try {
      const url = new URL(entry.trim());
      // Fail the entire configuration closed on malformed entries. Origins
      // cannot contain paths, credentials, wildcards, queries or fragments.
      if (
        !/^https?:\/\//i.test(entry.trim()) ||
        !["https:", "http:"].includes(url.protocol) ||
        url.username ||
        url.password ||
        url.hostname.includes("*") ||
        url.pathname !== "/" ||
        url.search ||
        url.hash ||
        /[\\\s]/.test(entry.trim())
      )
        return [];
      origins.push(url.origin);
    } catch {
      return [];
    }
  }
  return [...new Set(origins)];
}

/** Returns the first trusted origin, or null if none configured. */
export function getExpectedOrigin(): string | null {
  return getExpectedOrigins()[0] ?? null;
}

/**
 * Parses the origin (scheme + host + port) from a Referer URL.
 * Returns null if the Referer is malformed or empty.
 */
function parseRefererOrigin(referer: string): string | null {
  try {
    const url = new URL(referer.trim());
    if (
      !/^https?:\/\//i.test(referer) ||
      /[\\\s]/.test(referer) ||
      !["https:", "http:"].includes(url.protocol) ||
      url.username ||
      url.password
    )
      return null;
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

  const trustedOrigins = getExpectedOrigins();
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const secFetchSite = request.headers.get("sec-fetch-site");
  const hasBrowserHeader = origin !== null || referer !== null || secFetchSite !== null;

  // No trusted origin configured: refuse all browser state changes.
  if (trustedOrigins.length === 0) {
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

  // Every supplied source header must validate. Fetch Metadata must not
  // override a mismatched/malformed Referer, nor may Referer rescue Origin.
  if (origin !== null && !trustedOrigins.includes(origin)) {
    logWarn("csrf.origin_mismatch", { method: request.method });
    return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfOriginMismatch");
  }

  if (referer !== null) {
    const refererOrigin = parseRefererOrigin(referer);
    if (refererOrigin === null || !trustedOrigins.includes(refererOrigin)) {
      // Never log raw Referer URLs: their queries can contain credentials.
      logWarn("csrf.referer_mismatch", { method: request.method });
      return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfRefererMismatch");
    }
  }
  if (origin !== null) return null;

  if (secFetchSite !== null) {
    if (secFetchSite === "same-origin") return null;
    // same-site is NOT same-origin.
    logWarn("csrf.non_same_origin_site", { method: request.method });
    return jsonError(403, "ORIGIN_MISMATCH", "errors.csrfCrossSite");
  }
  if (referer !== null) return null;

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
