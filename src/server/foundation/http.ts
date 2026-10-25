/**
 * HTTP transport for foundation routes (contract §1.1, §1.7): JSON
 * responses with `Cache-Control: no-store` (business data must never be
 * stored by shared/browser caches), size-capped JSON body parsing, and
 * the shared error envelope. Unexpected errors are logged structurally
 * with a correlation id — without any request data — and return no
 * internals.
 */

import type { ApiErrorBody } from "@/lib/api-types";
import { ApiError, toApiError } from "./errors";
import { logError, logWarn } from "./logger";

/** Same provisional payload cap as intake (TBD-TECH-03). */
const MAX_BODY_BYTES = 32_768;

export function jsonResponse(body: unknown, status = 200, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError("MALFORMED_BODY");
  }
  // Reject over-cap bodies up front when the client declares a length,
  // so an oversized payload is refused without buffering it first.
  // Undeclared/chunked bodies are still capped by the byte check below.
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    throw new ApiError("MALFORMED_BODY");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new ApiError("MALFORMED_BODY");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("MALFORMED_BODY");
  }
}

export function apiErrorResponse(
  error: unknown,
  context: { routeTemplate: string; correlationId: string },
): Response {
  const apiError = toApiError(error);
  if (apiError.code === "INTERNAL") {
    logError("api.unexpected_error", {
      route: context.routeTemplate,
      correlationId: context.correlationId,
    });
    const body: ApiErrorBody = {
      error: {
        code: "INTERNAL",
        messageKey: "errors.internal",
        details: { correlationId: context.correlationId },
      },
    };
    return jsonResponse(body, 500);
  }
  if (apiError.httpStatus >= 500) {
    logWarn("api.request_failed", {
      route: context.routeTemplate,
      code: apiError.code,
      status: apiError.httpStatus,
      correlationId: context.correlationId,
    });
  }
  const body: ApiErrorBody = {
    error: {
      code: apiError.code,
      messageKey: apiError.messageKey,
      ...(apiError.fieldErrors !== undefined ? { fieldErrors: apiError.fieldErrors } : {}),
      ...(apiError.details !== undefined ? { details: apiError.details } : {}),
    },
  };
  const headers: HeadersInit =
    apiError.retryAfterSec !== undefined ? { "Retry-After": String(apiError.retryAfterSec) } : {};
  return jsonResponse(body, apiError.httpStatus, headers);
}
