/**
 * Public intake API/service tests (CT-API subset for contract §3.1).
 *
 * Covers: Appendix-A validation matrix + strict DTOs, idempotency
 * replay/mismatch/key rules, atomic rollback under fault injection,
 * SEC-08 outbox payload minimization, consent-gated confirmation
 * intents, rate limiting, and the fail-closed adapter governance at
 * the HTTP boundary (unset ⇒ 503; fake in production ⇒ 503).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as postContact } from "@/app/api/v1/public/contact-messages/route";
import { POST as postRequest } from "@/app/api/v1/public/inspection-requests/route";
import { createFakeIntakeAdapter, type FakeIntakeAdapter } from "@/server/intake/fake-adapter";
import { IntakeError, type IntakePorts } from "@/server/intake/ports";
import { buildIntakeAllowlists, resetIntakeServiceCacheForTests } from "@/server/intake/runtime";
import { createIntakeService, type IntakeService } from "@/server/intake/service";

const NOW = "2026-10-24T10:00:00.000Z";
let idCounter = 0;
const clock = { now: () => NOW };
const ids = { newId: () => `id-${++idCounter}` };

let fake: FakeIntakeAdapter;
let service: IntakeService;

beforeEach(() => {
  idCounter = 0;
  fake = createFakeIntakeAdapter({ clock, ids });
  service = createIntakeService(fake.ports, buildIntakeAllowlists());
});

function validRequestBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: "Mona Adel Hassan",
    phone: "+20 100 123 4567",
    email: "mona@example.com",
    serviceSlug: "interior-finishing",
    city: "Cairo",
    areaM2: 120,
    unitType: "Apartment",
    description: "Full finishing for a three-bedroom apartment including kitchen.",
    consent: { contact: true, whatsapp: true },
    locale: "en",
    ...overrides,
  };
}

function validContactBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: "Mona Adel Hassan",
    phone: "0100 123 4567",
    subject: "Service enquiry",
    message: "I would like to ask about your finishing packages.",
    consent: { contact: true, whatsapp: false },
    locale: "en",
    ...overrides,
  };
}

const ctx = (key: string | null = "123e4567-e89b-12d3-a456-426614174000", ip = "203.0.113.7") => ({
  idempotencyKey: key,
  clientIp: ip,
});

async function expectIntakeError(promise: Promise<unknown>, code: string): Promise<IntakeError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(IntakeError);
    expect((error as IntakeError).code).toBe(code);
    return error as IntakeError;
  }
  throw new Error(`Expected IntakeError ${code}, but the call succeeded`);
}

describe("public inspection-request intake (service)", () => {
  it("saves request + history + audit + outbox intents and returns a minimal receipt", async () => {
    const { receipt, replayed } = await service.submitInspectionRequest(validRequestBody(), ctx());
    expect(replayed).toBe(false);
    expect(receipt).toEqual({ id: "id-1", reference: "RQ-000001", receivedAt: NOW });

    const stored = await fake.ports.repositories.requests.byId(receipt.id);
    expect(stored?.record).toMatchObject({
      reference: "RQ-000001",
      customerId: null,
      fullName: "Mona Adel Hassan",
      phoneE164: "+201001234567",
      serviceSlug: "interior-finishing",
      areaM2: 120,
      status: "new",
      version: 1,
    });
    expect(stored?.record.consent).toEqual({
      contact: true,
      whatsapp: true,
      capturedAt: NOW,
      source: "public_website",
    });
    expect(stored?.history).toEqual([{ status: "new", at: NOW, actorId: "public" }]);

    const audit = await fake.ports.repositories.audit.query({
      page: 1,
      pageSize: 50,
      direction: "asc",
      entityId: receipt.id,
    });
    expect(audit.items).toHaveLength(1);
    expect(audit.items[0]).toMatchObject({ event: "request.created", actorKind: "public" });

    const outbox = await fake.ports.repositories.outbox.listByEntity("request", receipt.id);
    expect(outbox.map((row) => row.eventType).sort()).toEqual([
      "customer_confirmation",
      "staff_alert",
    ]);
    for (const row of outbox) {
      expect(row.status).toBe("queued");
      // SEC-08: params carry the reference and nothing else.
      expect(row.params).toEqual({ reference: "RQ-000001" });
      expect(JSON.stringify(row.params)).not.toContain("Mona Adel Hassan");
      expect(JSON.stringify(row.params)).not.toContain("201001234567");
    }
  });

  it("enqueues no customer confirmation when WhatsApp consent is declined", async () => {
    const { receipt } = await service.submitInspectionRequest(
      validRequestBody({ consent: { contact: true, whatsapp: false } }),
      ctx(),
    );
    const outbox = await fake.ports.repositories.outbox.listByEntity("request", receipt.id);
    expect(outbox.map((row) => row.eventType)).toEqual(["staff_alert"]);
  });

  it("folds Arabic-Indic digits in phone and area, and preserves a missing country code", async () => {
    const { receipt } = await service.submitInspectionRequest(
      validRequestBody({ phone: "٠١٠٠ ١٢٣ ٤٥٦٧", areaM2: "١٢٠,٥" }),
      ctx(),
    );
    const stored = await fake.ports.repositories.requests.byId(receipt.id);
    expect(stored?.record.phoneE164).toBe("01001234567");
    expect(stored?.record.areaM2).toBe(120.5);
  });

  it("rejects invalid payloads with dictionary field-error keys and writes nothing", async () => {
    const cases: Array<[Record<string, unknown>, string, string]> = [
      [{ fullName: "Al" }, "fullName", "nameShort"],
      [{ phone: "123" }, "phone", "phoneInvalid"],
      [{ email: "not-an-email" }, "email", "emailInvalid"],
      [{ serviceSlug: "not-a-service" }, "serviceSlug", "invalidOption"],
      [{ unitType: "Castle" }, "unitType", "invalidOption"],
      [{ areaM2: "abc" }, "areaM2", "areaInvalid"],
      [{ areaM2: -5 }, "areaM2", "areaInvalid"],
      [{ description: "too short" }, "description", "descriptionShort"],
      [{ locale: "fr" }, "locale", "invalidOption"],
      [{ consent: { contact: false, whatsapp: true } }, "consent.contact", "consentRequired"],
      [{ consent: { contact: true } }, "consent.whatsapp", "required"],
      [{ unexpected: 1 }, "unexpected", "unknownField"],
      [{ id: "spoof" }, "id", "readOnly"],
      [{ status: "approved" }, "status", "readOnly"],
      [{ version: 1 }, "version", "readOnly"],
      [
        { consent: { contact: true, whatsapp: true, textVersion: "v9" } },
        "consent.textVersion",
        "readOnly",
      ],
    ];
    for (const [overrides, field, key] of cases) {
      const error = await expectIntakeError(
        service.submitInspectionRequest(validRequestBody(overrides), ctx()),
        "VALIDATION_FAILED",
      );
      expect(error.httpStatus).toBe(422);
      expect(error.fieldErrors?.[field]).toContain(key);
    }
    expect(await fake.ports.repositories.requests.count()).toBe(0);
    expect(
      (await fake.ports.repositories.audit.query({ page: 1, pageSize: 50, direction: "asc" }))
        .items,
    ).toEqual([]);
  });

  it("requires a well-formed idempotency key before any write", async () => {
    await expectIntakeError(
      service.submitInspectionRequest(validRequestBody(), ctx(null)),
      "IDEMPOTENCY_KEY_REQUIRED",
    );
    await expectIntakeError(
      service.submitInspectionRequest(validRequestBody(), ctx("short")),
      "IDEMPOTENCY_KEY_REQUIRED",
    );
    expect(await fake.ports.repositories.requests.count()).toBe(0);
  });

  it("replays the original receipt for the same key + payload without duplicating effects", async () => {
    const first = await service.submitInspectionRequest(validRequestBody(), ctx());
    const second = await service.submitInspectionRequest(validRequestBody(), ctx());
    expect(second.replayed).toBe(true);
    expect(second.receipt).toEqual(first.receipt);
    expect(await fake.ports.repositories.requests.count()).toBe(1);
    expect(
      (await fake.ports.repositories.audit.query({ page: 1, pageSize: 50, direction: "asc" }))
        .total,
    ).toBe(1);
    expect(
      await fake.ports.repositories.outbox.listByEntity("request", first.receipt.id),
    ).toHaveLength(2);
  });

  it("rejects the same key with a changed payload (409) and keeps one record", async () => {
    await service.submitInspectionRequest(validRequestBody(), ctx());
    const error = await expectIntakeError(
      service.submitInspectionRequest(validRequestBody({ city: "Giza" }), ctx()),
      "IDEMPOTENCY_PAYLOAD_MISMATCH",
    );
    expect(error.httpStatus).toBe(409);
    expect(await fake.ports.repositories.requests.count()).toBe(1);
  });

  it("does not consume the idempotency key on validation failure", async () => {
    await expectIntakeError(
      service.submitInspectionRequest(validRequestBody({ phone: "bad" }), ctx()),
      "VALIDATION_FAILED",
    );
    const ok = await service.submitInspectionRequest(validRequestBody(), ctx());
    expect(ok.receipt.reference).toBe("RQ-000001");
  });

  it("rolls back everything and frees the key when a write fails mid-transaction", async () => {
    const faultyPorts: IntakePorts = {
      ...fake.ports,
      unitOfWork: {
        run: (work) =>
          fake.ports.unitOfWork.run((repos) =>
            work({
              ...repos,
              outbox: {
                ...repos.outbox,
                enqueue: async () => {
                  throw new Error("outbox down");
                },
              },
            }),
          ),
      },
    };
    const faulty = createIntakeService(faultyPorts, buildIntakeAllowlists());
    await expectIntakeError(faulty.submitInspectionRequest(validRequestBody(), ctx()), "INTERNAL");
    expect(await fake.ports.repositories.requests.count()).toBe(0);
    expect(
      (await fake.ports.repositories.audit.query({ page: 1, pageSize: 50, direction: "asc" }))
        .items,
    ).toEqual([]);

    // Same key retries cleanly against the healthy service.
    const retry = await service.submitInspectionRequest(validRequestBody(), ctx());
    expect(retry.receipt.reference).toBe("RQ-000001");
    expect(await fake.ports.repositories.requests.count()).toBe(1);
  });

  it("rate-limits repeated submissions from the same IP + phone", async () => {
    const limited = createIntakeService(fake.ports, buildIntakeAllowlists(), {
      perIpAndPhone: { limit: 2, windowSec: 3600 },
      perIp: { limit: 100, windowSec: 3600 },
    });
    await limited.submitInspectionRequest(validRequestBody(), ctx("rl-key-000000000001"));
    await limited.submitInspectionRequest(validRequestBody(), ctx("rl-key-000000000002"));
    const error = await expectIntakeError(
      limited.submitInspectionRequest(validRequestBody(), ctx("rl-key-000000000003")),
      "RATE_LIMITED",
    );
    expect(error.httpStatus).toBe(429);
    expect(error.retryAfterSec).toBeGreaterThan(0);
    expect(await fake.ports.repositories.requests.count()).toBe(2);
  });
});

describe("public contact-message intake (service)", () => {
  it("saves the message with audit + one staff alert and returns an MSG receipt", async () => {
    const { receipt } = await service.submitContactMessage(validContactBody(), ctx());
    expect(receipt.reference).toBe("MSG-000001");
    const stored = await fake.ports.repositories.contactMessages.byId(receipt.id);
    expect(stored).toMatchObject({ subject: "Service enquiry", phoneE164: "01001234567" });
    const audit = await fake.ports.repositories.audit.query({
      page: 1,
      pageSize: 50,
      direction: "asc",
      entityId: receipt.id,
    });
    expect(audit.items[0]?.event).toBe("contact_message.created");
    const outbox = await fake.ports.repositories.outbox.listByEntity("contact_message", receipt.id);
    expect(outbox.map((row) => row.eventType)).toEqual(["staff_alert"]);
    expect(outbox[0]?.params).toEqual({ reference: "MSG-000001" });
  });

  it("validates subjects against the published localized values", async () => {
    const arabic = await service.submitContactMessage(
      validContactBody({ subject: "استفسار عن خدمة", locale: "ar" }),
      ctx(),
    );
    expect(arabic.receipt.reference).toBe("MSG-000001");
    const error = await expectIntakeError(
      service.submitContactMessage(
        validContactBody({ subject: "Billing" }),
        ctx("k-000000000000004"),
      ),
      "VALIDATION_FAILED",
    );
    expect(error.fieldErrors?.subject).toContain("invalidOption");
  });

  it("never invents an email field for contact messages", async () => {
    const error = await expectIntakeError(
      service.submitContactMessage(validContactBody({ email: "a@b.com" }), ctx()),
      "VALIDATION_FAILED",
    );
    expect(error.fieldErrors?.email).toContain("unknownField");
  });
});

describe("intake HTTP boundary + adapter governance", () => {
  const savedEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllEnvs();
    resetIntakeServiceCacheForTests();
  });

  function makeHttpRequest(body: unknown, headers: Record<string, string> = {}): Request {
    return new Request("http://localhost/api/v1/public/inspection-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: typeof body === "string" ? body : JSON.stringify(body),
    });
  }

  it("fails closed with 503 when no adapter is configured", async () => {
    delete process.env.DATA_ADAPTER;
    resetIntakeServiceCacheForTests();
    const response = await postRequest(
      makeHttpRequest(validRequestBody(), { "Idempotency-Key": "http-key-0000000001" }),
    );
    expect(response.status).toBe(503);
    const payload = (await response.json()) as { error: { code: string } };
    expect(payload.error.code).toBe("DEPENDENCY_UNAVAILABLE");
  });

  it("refuses the fake adapter in production (503, never a fake success)", async () => {
    vi.stubEnv("DATA_ADAPTER", "fake");
    vi.stubEnv("NODE_ENV", "production");
    resetIntakeServiceCacheForTests();
    const response = await postRequest(
      makeHttpRequest(validRequestBody(), { "Idempotency-Key": "http-key-0000000002" }),
    );
    expect(response.status).toBe(503);
  });

  it("serves 201 + envelope errors correctly with the fake outside production", async () => {
    vi.stubEnv("DATA_ADAPTER", "fake");
    vi.stubEnv("NODE_ENV", "test");
    resetIntakeServiceCacheForTests();

    const created = await postRequest(
      makeHttpRequest(validRequestBody({ phone: "+20 111 222 3333" }), {
        "Idempotency-Key": "http-key-0000000003",
      }),
    );
    expect(created.status).toBe(201);
    const receipt = (await created.json()) as { reference: string; receivedAt: string };
    expect(receipt.reference).toMatch(/^RQ-\d{6}$/);
    expect(receipt.receivedAt).toEqual(expect.any(String));

    const noKey = await postRequest(makeHttpRequest(validRequestBody()));
    expect(noKey.status).toBe(400);
    expect(((await noKey.json()) as { error: { code: string } }).error.code).toBe(
      "IDEMPOTENCY_KEY_REQUIRED",
    );

    const invalid = await postRequest(
      makeHttpRequest(validRequestBody({ phone: "bad" }), {
        "Idempotency-Key": "http-key-0000000004",
      }),
    );
    expect(invalid.status).toBe(422);
    const invalidPayload = (await invalid.json()) as {
      error: { code: string; messageKey: string; fieldErrors?: Record<string, string[]> };
    };
    expect(invalidPayload.error.code).toBe("VALIDATION_FAILED");
    expect(invalidPayload.error.fieldErrors?.phone).toContain("phoneInvalid");
    // Error envelope carries keys, never user-facing prose (§1.7).
    expect(invalidPayload.error.messageKey).toBe("errors.validationFailed");

    const malformed = await postRequest(
      makeHttpRequest("{not json", { "Idempotency-Key": "http-key-0000000005" }),
    );
    expect(malformed.status).toBe(400);
    expect(((await malformed.json()) as { error: { code: string } }).error.code).toBe(
      "MALFORMED_BODY",
    );

    const contact = await postContact(
      new Request("http://localhost/api/v1/public/contact-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "http-key-0000000006",
        },
        body: JSON.stringify(validContactBody()),
      }),
    );
    expect(contact.status).toBe(201);
    expect(((await contact.json()) as { reference: string }).reference).toMatch(/^MSG-\d{6}$/);
  });
});
