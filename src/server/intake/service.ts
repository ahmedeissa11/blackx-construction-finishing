/**
 * Public intake application service (contract §3.1).
 *
 * Owns the business rules; depends only on `IntakePorts` — never on a
 * database client, ORM, or SQL (§5.1 layering). Guarantees, in order:
 *
 * 1. A required, well-formed Idempotency-Key (§1.8) — else 400, no write.
 * 2. Full Appendix-A server validation — failures consume nothing.
 * 3. Rate limits (§1.9) — provisional TECH-03 thresholds below.
 * 4. Scoped idempotency claim over the *normalized* DTO hash: replay
 *    returns the original 201 receipt; changed payload ⇒ 409; concurrent
 *    duplicate ⇒ 409 + Retry-After without executing.
 * 5. One atomic transaction: record (+ status history) + audit + outbox
 *    intents (§1.10). The receipt is returned only after commit, so a
 *    submission can never be half-saved or lost because a notification
 *    provider is down — sending itself is out of scope here.
 *
 * Intake creates no Customer and links nothing (TBD-PO-12). The
 * customer-confirmation intent is enqueued only when the submitter
 * granted WhatsApp consent (Meta opt-in); whether/what to send remains
 * the PO-01 template-approval process.
 */

import { createHash } from "node:crypto";
import {
  IntakeError,
  type ContactMessageRecord,
  type IntakePorts,
  type IntakeReceipt,
  type IntakeRequestRecord,
} from "./ports";
import {
  validateContactMessageInput,
  validateInspectionRequestInput,
  type IntakeAllowlists,
  type NormalizedContactMessage,
  type NormalizedInspectionRequest,
} from "./validation";

export interface IntakeRequestContext {
  idempotencyKey: string | null;
  /** Best-effort client IP for rate limiting; "unknown" shares a bucket. */
  clientIp: string;
}

export interface IntakeSubmissionResult {
  receipt: IntakeReceipt;
  /** True when an earlier identical submission is being replayed. */
  replayed: boolean;
}

export interface IntakeServiceConfig {
  perIpAndPhone: { limit: number; windowSec: number };
  perIp: { limit: number; windowSec: number };
}

/** Provisional thresholds — final values are TBD-TECH-03. */
export const DEFAULT_INTAKE_CONFIG: IntakeServiceConfig = {
  perIpAndPhone: { limit: 5, windowSec: 3600 },
  perIp: { limit: 60, windowSec: 3600 },
};

const PUBLIC_SCOPE = "public";
const REQUEST_ROUTE = "/api/v1/public/inspection-requests";
const CONTACT_ROUTE = "/api/v1/public/contact-messages";
const CONSENT_SOURCE = "public_website";
const IDEMPOTENCY_RETENTION_MS = 24 * 60 * 60 * 1000; // §1.8 public minimum
const IDEMPOTENCY_KEY_PATTERN = /^[\x20-\x7e]{16,128}$/;

/** Provisional template keys; Meta approval is the PO-01 process (§7.5). */
const STAFF_ALERT_TEMPLATE = "intake.staff_alert";
const CUSTOMER_CONFIRMATION_TEMPLATE = "intake.customer_confirmation";

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") {
    return JSON.stringify(value) ?? "null";
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, entryValue]) => entryValue !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

/** SHA-256 over method + route template + canonical normalized DTO (§1.8). */
function payloadHash(routeTemplate: string, normalized: unknown): string {
  return createHash("sha256")
    .update(`POST${routeTemplate}${stableStringify(normalized)}`)
    .digest("hex");
}

function requireIdempotencyKey(key: string | null): string {
  if (key === null || !IDEMPOTENCY_KEY_PATTERN.test(key)) {
    throw new IntakeError("IDEMPOTENCY_KEY_REQUIRED");
  }
  return key;
}

export function createIntakeService(
  ports: IntakePorts,
  allowlists: IntakeAllowlists,
  config: IntakeServiceConfig = DEFAULT_INTAKE_CONFIG,
) {
  async function enforceRateLimits(
    route: string,
    clientIp: string,
    phoneE164: string,
  ): Promise<void> {
    const byIpAndPhone = await ports.rateLimits.hit(
      `intake:${route}:ip-phone:${clientIp}:${phoneE164}`,
      config.perIpAndPhone.limit,
      config.perIpAndPhone.windowSec,
    );
    if (!byIpAndPhone.allowed) {
      throw new IntakeError("RATE_LIMITED", { retryAfterSec: byIpAndPhone.retryAfterSec });
    }
    const byIp = await ports.rateLimits.hit(
      `intake:${route}:ip:${clientIp}`,
      config.perIp.limit,
      config.perIp.windowSec,
    );
    if (!byIp.allowed) {
      throw new IntakeError("RATE_LIMITED", { retryAfterSec: byIp.retryAfterSec });
    }
  }

  async function executeIdempotent(
    routeTemplate: string,
    key: string,
    normalized: unknown,
    work: () => Promise<IntakeReceipt>,
  ): Promise<IntakeSubmissionResult> {
    const claimResult = await ports.idempotency.claim(
      PUBLIC_SCOPE,
      "POST",
      routeTemplate,
      key,
      payloadHash(routeTemplate, normalized),
    );
    if (claimResult.kind === "completed") {
      return { receipt: claimResult.receipt, replayed: true };
    }
    if (claimResult.kind === "payload_mismatch") {
      throw new IntakeError("IDEMPOTENCY_PAYLOAD_MISMATCH");
    }
    if (claimResult.kind === "in_progress") {
      throw new IntakeError("IDEMPOTENCY_IN_PROGRESS", {
        retryAfterSec: claimResult.retryAfterSec,
      });
    }

    let receipt: IntakeReceipt;
    try {
      receipt = await work();
    } catch (cause) {
      await ports.idempotency.releaseRetryable(claimResult.claim);
      if (cause instanceof IntakeError) throw cause;
      throw new IntakeError("INTERNAL", { cause });
    }

    const expiresAt = new Date(
      Date.parse(ports.clock.now()) + IDEMPOTENCY_RETENTION_MS,
    ).toISOString();
    try {
      await ports.idempotency.complete(claimResult.claim, 201, receipt, expiresAt);
    } catch {
      // The business transaction already committed; the receipt stands.
      // Making claim completion atomic with the commit is an explicit
      // real-adapter conformance requirement (§5.2, CT-PORT).
    }
    return { receipt, replayed: false };
  }

  function outboxKey(entityId: string, eventType: string, recipientKind: string): string {
    return createHash("sha256").update(`${entityId}:${eventType}:${recipientKind}`).digest("hex");
  }

  async function submitInspectionRequest(
    body: unknown,
    context: IntakeRequestContext,
  ): Promise<IntakeSubmissionResult> {
    const key = requireIdempotencyKey(context.idempotencyKey);
    const outcome = validateInspectionRequestInput(body, allowlists);
    if (!outcome.ok) {
      throw new IntakeError("VALIDATION_FAILED", { fieldErrors: outcome.fieldErrors });
    }
    const input: NormalizedInspectionRequest = outcome.value;
    await enforceRateLimits(REQUEST_ROUTE, context.clientIp, input.phoneE164);

    return executeIdempotent(REQUEST_ROUTE, key, input, () =>
      ports.unitOfWork.run(async (repos) => {
        const now = ports.clock.now();
        const id = ports.ids.newId();
        const reference = await repos.references.next("request");
        const record: IntakeRequestRecord = {
          id,
          reference,
          customerId: null,
          fullName: input.fullName,
          phoneE164: input.phoneE164,
          ...(input.email !== undefined ? { email: input.email } : {}),
          serviceSlug: input.serviceSlug,
          city: input.city,
          ...(input.areaM2 !== undefined ? { areaM2: input.areaM2 } : {}),
          ...(input.unitType !== undefined ? { unitType: input.unitType } : {}),
          description: input.description,
          consent: {
            contact: input.consent.contact,
            whatsapp: input.consent.whatsapp,
            capturedAt: now,
            source: CONSENT_SOURCE,
          },
          locale: input.locale,
          status: "new",
          priority: "normal",
          assigneeId: null,
          submittedAt: now,
          version: 1,
        };
        await repos.requests.create(record, { status: "new", at: now, actorId: "public" });
        await repos.audit.append({
          id: ports.ids.newId(),
          event: "request.created",
          actorKind: "public",
          entityType: "request",
          entityId: id,
          at: now,
          reference,
        });
        await repos.outbox.enqueue({
          id: ports.ids.newId(),
          eventType: "staff_alert",
          channel: "whatsapp",
          recipientKind: "staff",
          templateKey: STAFF_ALERT_TEMPLATE,
          locale: input.locale,
          params: { reference },
          entityType: "request",
          entityId: id,
          idempotencyKey: outboxKey(id, "staff_alert", "staff"),
          status: "queued",
          createdAt: now,
        });
        if (input.consent.whatsapp) {
          await repos.outbox.enqueue({
            id: ports.ids.newId(),
            eventType: "customer_confirmation",
            channel: "whatsapp",
            recipientKind: "submitter",
            templateKey: CUSTOMER_CONFIRMATION_TEMPLATE,
            locale: input.locale,
            params: { reference },
            entityType: "request",
            entityId: id,
            idempotencyKey: outboxKey(id, "customer_confirmation", "submitter"),
            status: "queued",
            createdAt: now,
          });
        }
        return { id, reference, receivedAt: now };
      }),
    );
  }

  async function submitContactMessage(
    body: unknown,
    context: IntakeRequestContext,
  ): Promise<IntakeSubmissionResult> {
    const key = requireIdempotencyKey(context.idempotencyKey);
    const outcome = validateContactMessageInput(body, allowlists);
    if (!outcome.ok) {
      throw new IntakeError("VALIDATION_FAILED", { fieldErrors: outcome.fieldErrors });
    }
    const input: NormalizedContactMessage = outcome.value;
    await enforceRateLimits(CONTACT_ROUTE, context.clientIp, input.phoneE164);

    return executeIdempotent(CONTACT_ROUTE, key, input, () =>
      ports.unitOfWork.run(async (repos) => {
        const now = ports.clock.now();
        const id = ports.ids.newId();
        const reference = await repos.references.next("contact_message");
        const record: ContactMessageRecord = {
          id,
          reference,
          fullName: input.fullName,
          phoneE164: input.phoneE164,
          subject: input.subject,
          message: input.message,
          consent: {
            contact: input.consent.contact,
            whatsapp: input.consent.whatsapp,
            capturedAt: now,
            source: CONSENT_SOURCE,
          },
          locale: input.locale,
          receivedAt: now,
        };
        await repos.contactMessages.create(record);
        await repos.audit.append({
          id: ports.ids.newId(),
          event: "contact_message.created",
          actorKind: "public",
          entityType: "contact_message",
          entityId: id,
          at: now,
          reference,
        });
        await repos.outbox.enqueue({
          id: ports.ids.newId(),
          eventType: "staff_alert",
          channel: "whatsapp",
          recipientKind: "staff",
          templateKey: STAFF_ALERT_TEMPLATE,
          locale: input.locale,
          params: { reference },
          entityType: "contact_message",
          entityId: id,
          idempotencyKey: outboxKey(id, "staff_alert", "staff"),
          status: "queued",
          createdAt: now,
        });
        return { id, reference, receivedAt: now };
      }),
    );
  }

  return { submitInspectionRequest, submitContactMessage };
}

export type IntakeService = ReturnType<typeof createIntakeService>;
