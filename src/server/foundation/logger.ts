/**
 * Structured logging for the business API foundation.
 *
 * One JSON object per line on stdout/stderr (platform log drains parse
 * it). Fields are allow-list style: callers pass small, deliberate
 * metadata (route template, status, error code, correlation id, entity
 * type/id, adapter name) — never request bodies. As a second line of
 * defense, any key whose name suggests a secret is redacted before
 * emission, and string values are length-capped.
 *
 * NEVER log: passwords, password hashes, tokens, session cookies,
 * connection strings, env-var values, submitted PII, or financial
 * detail (contract §6 / SEC rules; task security requirements).
 */

type LogLevel = "info" | "warn" | "error";

export type LogFields = Record<string, string | number | boolean | null | undefined>;

const SENSITIVE_KEY_PATTERN =
  /password|passwd|secret|token|cookie|authorization|credential|hash|connection|dsn|api[-_]?key|session/i;

const MAX_VALUE_LENGTH = 200;

function sanitize(fields: LogFields): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (SENSITIVE_KEY_PATTERN.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = typeof value === "string" ? value.slice(0, MAX_VALUE_LENGTH) : value;
  }
  return out;
}

function emit(level: LogLevel, event: string, fields: LogFields): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...sanitize(fields),
  });
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.info(line);
  }
}

export function logInfo(event: string, fields: LogFields = {}): void {
  emit("info", event, fields);
}

export function logWarn(event: string, fields: LogFields = {}): void {
  emit("warn", event, fields);
}

export function logError(event: string, fields: LogFields = {}): void {
  emit("error", event, fields);
}

/** Correlation id for one request/logical operation (safe to return to clients in error details). */
export function newCorrelationId(): string {
  return globalThis.crypto.randomUUID();
}
