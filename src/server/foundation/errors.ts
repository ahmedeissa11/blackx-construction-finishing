/**
 * Foundation API errors — the contract §1.7 error model, generalized
 * from the intake slice (`src/server/intake/ports.ts`) for the whole
 * business API. The envelope shape is identical; this module adds the
 * codes the foundation needs (`CONFLICT_STATE`, `CONFLICT_VERSION`,
 * `NOT_IMPLEMENTED`) and an optional safe `details` object.
 *
 * Errors never carry user-facing prose (the API returns localization
 * `messageKey`s only), never carry request data, and never expose
 * internals (SQL, stack traces, provider payloads) — contract §1.7.
 */

export type ApiErrorCode =
  | "MALFORMED_BODY"
  | "INVALID_QUERY"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT_STATE"
  | "CONFLICT_VERSION"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "IDEMPOTENCY_PAYLOAD_MISMATCH"
  | "IDEMPOTENCY_IN_PROGRESS"
  | "RATE_LIMITED"
  | "DEPENDENCY_UNAVAILABLE"
  | "NOT_IMPLEMENTED"
  | "INTERNAL";

const HTTP_STATUS: Record<ApiErrorCode, number> = {
  MALFORMED_BODY: 400,
  INVALID_QUERY: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT_STATE: 409,
  CONFLICT_VERSION: 409,
  VALIDATION_FAILED: 422,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  IDEMPOTENCY_PAYLOAD_MISMATCH: 409,
  IDEMPOTENCY_IN_PROGRESS: 409,
  RATE_LIMITED: 429,
  DEPENDENCY_UNAVAILABLE: 503,
  NOT_IMPLEMENTED: 501,
  INTERNAL: 500,
};

/** Stable localization keys (contract §1.7: the API never returns prose). */
const DEFAULT_MESSAGE_KEYS: Record<ApiErrorCode, string> = {
  MALFORMED_BODY: "errors.malformedBody",
  INVALID_QUERY: "errors.invalidQuery",
  UNAUTHENTICATED: "errors.unauthenticated",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.notFound",
  CONFLICT_STATE: "errors.conflictState",
  CONFLICT_VERSION: "errors.conflictVersion",
  VALIDATION_FAILED: "errors.validationFailed",
  IDEMPOTENCY_KEY_REQUIRED: "errors.idempotencyKeyRequired",
  IDEMPOTENCY_PAYLOAD_MISMATCH: "errors.idempotencyPayloadMismatch",
  IDEMPOTENCY_IN_PROGRESS: "errors.idempotencyInProgress",
  RATE_LIMITED: "errors.rateLimited",
  DEPENDENCY_UNAVAILABLE: "errors.backendUnavailable",
  NOT_IMPLEMENTED: "errors.notImplemented",
  INTERNAL: "errors.internal",
};

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly messageKey: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: Record<string, unknown>;
  readonly retryAfterSec?: number;

  constructor(
    code: ApiErrorCode,
    options?: {
      messageKey?: string;
      fieldErrors?: Record<string, string[]>;
      details?: Record<string, unknown>;
      retryAfterSec?: number;
      cause?: unknown;
    },
  ) {
    super(code);
    this.name = "ApiError";
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.messageKey = options?.messageKey ?? DEFAULT_MESSAGE_KEYS[code];
    this.fieldErrors = options?.fieldErrors;
    this.details = options?.details;
    this.retryAfterSec = options?.retryAfterSec;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * Raised by repository adapters when an optimistic-concurrency check
 * fails inside storage (contract §5.2). Services map it to
 * `409 CONFLICT_VERSION`; it must never escape to the HTTP boundary
 * unmapped, and adapters must raise it without applying partial writes.
 */
export class VersionConflictError extends Error {
  constructor(entityType: string, id: string) {
    super(`Version conflict on ${entityType} ${id}`);
    this.name = "VersionConflictError";
  }
}

/**
 * Structural ApiError check. Next.js dev can load this module in more
 * than one route bundle (the same phenomenon the intake runtime
 * documents for its singleton), which makes bare `instanceof`
 * unreliable across bundles; production chunks share instances, but
 * error mapping must be correct in both. Name + shape is stable.
 */
function isApiErrorLike(error: unknown): error is ApiError {
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as Partial<ApiError> & { name?: unknown };
  return (
    candidate.name === "ApiError" &&
    typeof candidate.code === "string" &&
    candidate.code in HTTP_STATUS &&
    typeof candidate.messageKey === "string"
  );
}

function isVersionConflictLike(error: unknown): boolean {
  return (
    error instanceof VersionConflictError ||
    (typeof error === "object" &&
      error !== null &&
      (error as { name?: unknown }).name === "VersionConflictError")
  );
}

/** Maps any thrown value to an ApiError (already-typed errors pass through). */
export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;
  if (isApiErrorLike(error)) {
    return new ApiError(error.code, {
      messageKey: error.messageKey,
      ...(error.fieldErrors !== undefined ? { fieldErrors: error.fieldErrors } : {}),
      ...(error.details !== undefined ? { details: error.details } : {}),
      ...(error.retryAfterSec !== undefined ? { retryAfterSec: error.retryAfterSec } : {}),
      cause: error,
    });
  }
  if (isVersionConflictLike(error)) {
    return new ApiError("CONFLICT_VERSION", { cause: error });
  }
  return new ApiError("INTERNAL", { cause: error });
}
