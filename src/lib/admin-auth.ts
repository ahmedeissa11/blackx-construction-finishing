import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";

function scryptAsync(
  password: string,
  salt: Buffer,
  keyLength: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keyLength, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey as Buffer);
    });
  });
}

const PASSWORD_HASH_PREFIX = "scrypt";
const DEFAULT_SCRYPT_N = 16_384;
const DEFAULT_SCRYPT_R = 8;
const DEFAULT_SCRYPT_P = 1;
const DERIVED_KEY_LENGTH = 64;
const MAX_FAILED_ATTEMPTS = 5;
const ATTEMPT_WINDOW_MS = 10 * 60 * 1000;
const BLOCK_DURATION_MS = 15 * 60 * 1000;

/**
 * SECURITY LIMITATION (P0, confirmed): this Map is per-process memory.
 * On serverless platforms each cold start gets a fresh Map, so the
 * login throttle is reset and can be bypassed by spreading attempts
 * across instances. It does NOT protect against brute force in
 * production. Replace with the shared RateLimitPort defined in
 * `src/lib/rate-limit-port.ts` before production login traffic.
 *
 * @see src/lib/rate-limit-port.ts LOGIN_THROTTLE_LIMITATION
 */
type LoginAttempt = {
  count: number;
  firstAttemptAt: number;
  blockedUntil: number;
};

const loginAttempts = new Map<string, LoginAttempt>();

export type OwnerReviewUser = {
  id: string;
  email: string;
  name: string;
  role: typeof OWNER_REVIEW_ROLE;
};

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function getConfiguredEmail(): string {
  return normalizeEmail(process.env.ADMIN_OWNER_EMAIL ?? "");
}

function getConfiguredPasswordHash(): string {
  return (process.env.ADMIN_OWNER_PASSWORD_HASH ?? "").trim();
}

export function isAdminAuthConfigured(): boolean {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  const email = getConfiguredEmail();
  const passwordHash = getConfiguredPasswordHash();
  return (
    secret.trim().length >= 32 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    passwordHash.startsWith(`${PASSWORD_HASH_PREFIX}$`)
  );
}

export async function hashOwnerPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = (await scryptAsync(password, salt, DERIVED_KEY_LENGTH, {
    N: DEFAULT_SCRYPT_N,
    r: DEFAULT_SCRYPT_R,
    p: DEFAULT_SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return [
    PASSWORD_HASH_PREFIX,
    DEFAULT_SCRYPT_N,
    DEFAULT_SCRYPT_R,
    DEFAULT_SCRYPT_P,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

function parsePasswordHash(encoded: string): {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  expected: Buffer;
} | null {
  const parts = encoded.split("$");
  if (parts.length !== 6 || parts[0] !== PASSWORD_HASH_PREFIX) return null;

  const N = Number(parts[1]);
  const r = Number(parts[2]);
  const p = Number(parts[3]);
  if (!Number.isInteger(N) || N < 2_048 || N > 65_536 || (N & (N - 1)) !== 0) return null;
  if (!Number.isInteger(r) || r < 1 || r > 16) return null;
  if (!Number.isInteger(p) || p < 1 || p > 8) return null;

  try {
    const salt = Buffer.from(parts[4] ?? "", "base64");
    const expected = Buffer.from(parts[5] ?? "", "base64");
    if (salt.length < 16 || expected.length !== DERIVED_KEY_LENGTH) return null;
    return { N, r, p, salt, expected };
  } catch {
    return null;
  }
}

export async function verifyOwnerPassword(password: string, encoded: string): Promise<boolean> {
  const parsed = parsePasswordHash(encoded);
  if (!parsed) {
    // Keep invalid configurations on a similar code path without revealing details.
    await scryptAsync(password, Buffer.alloc(16, 7), DERIVED_KEY_LENGTH, {
      N: DEFAULT_SCRYPT_N,
      r: DEFAULT_SCRYPT_R,
      p: DEFAULT_SCRYPT_P,
      maxmem: 64 * 1024 * 1024,
    }).catch(() => undefined);
    return false;
  }

  const derived = (await scryptAsync(password, parsed.salt, DERIVED_KEY_LENGTH, {
    N: parsed.N,
    r: parsed.r,
    p: parsed.p,
    maxmem: 64 * 1024 * 1024,
  })) as Buffer;
  return timingSafeEqual(derived, parsed.expected);
}

export function getLoginRateLimitKey(email: string, headers: Headers): string {
  const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const ip = forwardedFor || headers.get("x-real-ip") || "unknown";
  return `${ip}:${normalizeEmail(email)}`;
}

export function isLoginRateLimited(key: string, now = Date.now()): boolean {
  const attempt = loginAttempts.get(key);
  if (!attempt) return false;
  if (attempt.blockedUntil > now) return true;
  if (now - attempt.firstAttemptAt > ATTEMPT_WINDOW_MS && attempt.blockedUntil <= now) {
    loginAttempts.delete(key);
    return false;
  }
  return false;
}

function recordLoginFailure(key: string, now = Date.now()): void {
  const current = loginAttempts.get(key);
  if (!current || now - current.firstAttemptAt > ATTEMPT_WINDOW_MS) {
    loginAttempts.set(key, { count: 1, firstAttemptAt: now, blockedUntil: 0 });
    return;
  }

  const count = current.count + 1;
  loginAttempts.set(key, {
    count,
    firstAttemptAt: current.firstAttemptAt,
    blockedUntil: count >= MAX_FAILED_ATTEMPTS ? now + BLOCK_DURATION_MS : current.blockedUntil,
  });
}

function clearLoginFailures(key: string): void {
  loginAttempts.delete(key);
}

export async function verifyOwnerCredentials(args: {
  email: string;
  password: string;
  headers: Headers;
}): Promise<OwnerReviewUser | null> {
  const email = normalizeEmail(args.email);
  const password = args.password;
  const rateLimitKey = getLoginRateLimitKey(email, args.headers);

  if (!email || !password || password.length > 256 || isLoginRateLimited(rateLimitKey)) {
    return null;
  }

  const configuredEmail = getConfiguredEmail();
  const configuredHash = getConfiguredPasswordHash();
  const emailMatches = email.length > 0 && email === configuredEmail;
  const passwordMatches = await verifyOwnerPassword(password, configuredHash);

  if (!emailMatches || !passwordMatches) {
    recordLoginFailure(rateLimitKey);
    return null;
  }

  clearLoginFailures(rateLimitKey);
  return {
    id: "owner-review",
    email: configuredEmail,
    name: "Company Owner Review",
    role: OWNER_REVIEW_ROLE,
  };
}
