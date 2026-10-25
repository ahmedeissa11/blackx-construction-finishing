/**
 * HTTP boundary for the public intake routes (contract §1.1, §1.7).
 * Route handlers do transport work only — body parsing, headers, the
 * error envelope — and delegate every rule to the intake service (§5.1).
 */

import { IntakeError, type IntakeReceipt } from "./ports";
import { getIntakeService } from "./runtime";
import type { IntakeSubmissionResult } from "./service";

/** Provisional public-payload cap (TBD-TECH-03); forms are far below it. */
const MAX_BODY_BYTES = 32_768;

export function jsonOk(body: unknown, status = 200): Response {
  return jsonResponse(body, status);
}

function jsonResponse(body: unknown, status: number, headers?: HeadersInit): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Admin reads carry submitter PII; receipts carry references.
      // Nothing from this API may be stored by shared/browser caches.
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

async function readJsonBody(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new IntakeError("MALFORMED_BODY");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) {
    throw new IntakeError("MALFORMED_BODY");
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new IntakeError("MALFORMED_BODY");
  }
}

function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const first = forwarded?.split(",")[0]?.trim();
  if (first) return first;
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export function intakeErrorResponse(error: unknown): Response {
  if (error instanceof IntakeError) {
    const headers: HeadersInit =
      error.retryAfterSec !== undefined ? { "Retry-After": String(error.retryAfterSec) } : {};
    return jsonResponse(
      {
        error: {
          code: error.code,
          messageKey: error.messageKey,
          ...(error.fieldErrors !== undefined ? { fieldErrors: error.fieldErrors } : {}),
        },
      },
      error.httpStatus,
      headers,
    );
  }
  // Unexpected: log without any request data, return no internals (§1.7).
  const correlationId = globalThis.crypto.randomUUID();
  console.error(`[intake] unexpected error correlationId=${correlationId}`);
  return jsonResponse(
    {
      error: {
        code: "INTERNAL",
        messageKey: "errors.internal",
        details: { correlationId },
      },
    },
    500,
  );
}

type SubmitFn = (
  body: unknown,
  context: { idempotencyKey: string | null; clientIp: string },
) => Promise<IntakeSubmissionResult>;

export async function handleIntakePost(
  request: Request,
  submit: (service: NonNullable<ReturnType<typeof getIntakeService>>) => SubmitFn,
): Promise<Response> {
  try {
    const service = getIntakeService();
    if (!service) {
      // No real adapter is registered yet, or the fake adapter was
      // requested in production (§5.4). Fail closed: nothing is written
      // and no success is ever faked.
      throw new IntakeError("DEPENDENCY_UNAVAILABLE", {
        messageKey: "errors.intakeUnavailable",
      });
    }
    const body = await readJsonBody(request);
    const { receipt } = await submit(service)(body, {
      idempotencyKey: request.headers.get("idempotency-key"),
      clientIp: clientIp(request),
    });
    const safeReceipt: IntakeReceipt = receipt;
    return jsonResponse(safeReceipt, 201);
  } catch (error) {
    return intakeErrorResponse(error);
  }
}
