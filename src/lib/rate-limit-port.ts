/**
 * Safe integration interface for a future shared/server-side rate limiter.
 *
 * Security context (P0 finding, confirmed on `main`): the owner-login
 * throttle in `src/lib/admin-auth.ts` keeps its state in a per-process
 * `Map<string, LoginAttempt>`. Across serverless/cold-start instances
 * that map is reset, so an attacker can bypass per-IP/per-email attempt
 * caps simply by landing on a fresh instance. An in-memory replacement
 * does NOT solve serverless throttling — only shared storage (e.g. the
 * database colleague's adapter, Redis, or a Vercel KV-style store) does.
 *
 * This file defines the port a future rate-limiter must implement so the
 * login throttle can be migrated off process memory without changing the
 * caller's shape. Nothing here is wired into login yet, and nothing here
 * enables production persistence or weakens the existing guard.
 */

export interface RateLimitResult {
  /** Whether the request may proceed. */
  readonly allowed: boolean;
  /** Seconds until the caller may retry (meaningful when `allowed` is false). */
  readonly retryAfterSec: number;
}

/**
 * A shared rate-limit store. `hit` is atomic: exactly one execution is
 * permitted per (key, limit, window) across all instances.
 *
 * Implementation notes for the future owner:
 * - Back this with shared storage, never a module-level Map.
 * - Key by `ip:normalizedEmail` (see `getLoginRateLimitKey` in admin-auth.ts).
 * - Return `Retry-After` consistent with `retryAfterSec` on denial.
 * - Record failures only; do not log passwords, tokens, or full request bodies.
 */
export interface RateLimitPort {
  hit(key: string, limit: number, windowSec: number): Promise<RateLimitResult>;
}

/**
 * Documented limitation of the current implementation, kept here so the
 * migration away from it is explicit and reviewable.
 */
export const LOGIN_THROTTLE_LIMITATION = {
  code: "SEC-LOGIN-THROTTLE-IN-MEMORY",
  severity: "P0",
  description:
    "admin-auth.ts stores login attempts in a per-process Map, which resets on every serverless cold start and is therefore ineffective as a login brute-force throttle across instances.",
  requiredFix:
    "Replace the Map with the RateLimitPort above backed by shared storage before production login traffic.",
  doNotPretend:
    "An in-memory Map (or any per-process store) is not a serverless-safe substitute for shared storage.",
} as const;
