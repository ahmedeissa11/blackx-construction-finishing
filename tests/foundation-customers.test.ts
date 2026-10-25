/**
 * Foundation customer service — business rules without HTTP and without
 * a real database (governed fake adapter): strict validation
 * (unknown/read-only ⇒ 422), phone normalization, idempotent create
 * (replay, payload mismatch, missing key), version-checked PATCH
 * (conflict, empty patch, nullable clears), workspace scoping,
 * pagination/filter/search, audit appends, and DTO minimization
 * (no workspaceId on the wire).
 */

import { beforeEach, describe, expect, it } from "vitest";
import {
  createFakeFoundationAdapter,
  type FakeFoundationAdapter,
} from "@/server/foundation/fake-adapter";
import { ApiError } from "@/server/foundation/errors";
import {
  createFoundationServices,
  type Actor,
  type FoundationServices,
} from "@/server/foundation/services";

const NOW = "2026-10-25T10:00:00.000Z";
let idCounter = 0;
const clock = { now: () => NOW };
const ids = { newId: () => `id-${++idCounter}` };

const actor: Actor = {
  userId: "owner-review",
  email: "owner@example.com",
  displayName: "Company Owner Review",
  role: "OWN",
  workspaceId: "blackx",
  provisioning: "environment",
};
const foreignActor: Actor = {
  ...actor,
  userId: "owner-review-2",
  workspaceId: "other-workspace",
};

let fake: FakeFoundationAdapter;
let services: FoundationServices;

const KEY = "test-key-000000000001";
const KEY2 = "test-key-000000000002";

function customerBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    name: "Mona Adel",
    phone: "+20 100 123 4567",
    email: "Mona@Example.COM",
    city: "Nasr City",
    ...overrides,
  };
}

async function expectApiError(promise: Promise<unknown>, code: string): Promise<ApiError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).code).toBe(code);
    return error as ApiError;
  }
  throw new Error(`Expected ${code}, but the call succeeded`);
}

beforeEach(() => {
  idCounter = 0;
  fake = createFakeFoundationAdapter({ clock, ids });
  services = createFoundationServices(fake.ports);
});

describe("createCustomer", () => {
  it("creates a normalized customer, mints a reference, and appends audit", async () => {
    const { dto: created, status } = await services.createCustomer(
      actor,
      customerBody(),
      KEY,
      "corr-1",
    );
    expect(status).toBe(201);
    expect(created.reference).toBe("CU-000001");
    expect(created.phoneE164).toBe("+201001234567");
    expect(created.email).toBe("Mona@Example.COM");
    expect(created.whatsappConsent).toEqual({ granted: false });
    expect(created.portalUserIds).toEqual([]);
    expect(created.version).toBe(1);
    expect(created.createdAt).toBe(NOW);
    expect(created).not.toHaveProperty("workspaceId");

    const audit = await services.listAuditEvents(actor, new URLSearchParams(""));
    expect(audit.total).toBe(1);
    expect(audit.items[0]).toMatchObject({
      action: "customer.created",
      actor: { kind: "user", userId: "owner-review", role: "OWN" },
      entity: { type: "customer", id: created.id, reference: "CU-000001" },
      correlationId: "corr-1",
    });
  });

  it("rejects unknown and read-only fields (mass-assignment defense)", async () => {
    const error = await expectApiError(
      services.createCustomer(
        actor,
        customerBody({ workspaceId: "evil", id: "x", bogus: 1 }),
        KEY,
        "c",
      ),
      "VALIDATION_FAILED",
    );
    expect(error.fieldErrors).toMatchObject({
      workspaceId: ["readOnly"],
      id: ["readOnly"],
      bogus: ["unknownField"],
    });
    const list = await services.listCustomers(actor, new URLSearchParams(""));
    expect(list.total).toBe(0);
  });

  it("rejects missing/short names, bad phones and bad emails with field errors", async () => {
    const error = await expectApiError(
      services.createCustomer(actor, { name: "Al", phone: "123", email: "not-an-email" }, KEY, "c"),
      "VALIDATION_FAILED",
    );
    expect(error.fieldErrors?.name).toContain("tooShort");
    expect(error.fieldErrors?.phone).toContain("phoneInvalid");
    expect(error.fieldErrors?.email).toContain("emailInvalid");
  });

  it("requires a valid Idempotency-Key", async () => {
    await expectApiError(
      services.createCustomer(actor, customerBody(), null, "c"),
      "IDEMPOTENCY_KEY_REQUIRED",
    );
    await expectApiError(
      services.createCustomer(actor, customerBody(), "short", "c"),
      "IDEMPOTENCY_KEY_REQUIRED",
    );
  });

  it("replays the original result for the same key + payload without a second write", async () => {
    const first = await services.createCustomer(actor, customerBody(), KEY, "c1");
    const replay = await services.createCustomer(actor, customerBody(), KEY, "c2");
    expect(replay.status).toBe(201);
    expect(replay.dto.id).toBe(first.dto.id);
    const list = await services.listCustomers(actor, new URLSearchParams(""));
    expect(list.total).toBe(1);
    const audit = await services.listAuditEvents(actor, new URLSearchParams(""));
    expect(audit.total).toBe(1);
  });

  it("returns 409 for the same key with a different payload", async () => {
    await services.createCustomer(actor, customerBody(), KEY, "c1");
    await expectApiError(
      services.createCustomer(actor, customerBody({ name: "Different Name" }), KEY, "c2"),
      "IDEMPOTENCY_PAYLOAD_MISMATCH",
    );
  });

  it("scopes idempotency by actor: another actor's same key is a separate intent", async () => {
    await services.createCustomer(actor, customerBody(), KEY, "c1");
    const other = await services.createCustomer(foreignActor, customerBody(), KEY, "c2");
    expect(other.status).toBe(201);
    const ownList = await services.listCustomers(actor, new URLSearchParams(""));
    const foreignList = await services.listCustomers(foreignActor, new URLSearchParams(""));
    expect(ownList.total).toBe(1);
    expect(foreignList.total).toBe(1);
  });
});

describe("list/get customers", () => {
  beforeEach(async () => {
    await services.createCustomer(actor, customerBody(), KEY, "c1");
    await services.createCustomer(
      actor,
      customerBody({
        name: "Omar Sherif",
        phone: "0100 987 6543",
        email: undefined,
        city: "Mokattam",
      }),
      KEY2,
      "c2",
    );
  });

  it("paginates deterministically and reports totals", async () => {
    const first = await services.listCustomers(actor, new URLSearchParams("pageSize=1&page=1"));
    const second = await services.listCustomers(actor, new URLSearchParams("pageSize=1&page=2"));
    const third = await services.listCustomers(actor, new URLSearchParams("pageSize=1&page=3"));
    expect(first.total).toBe(2);
    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(1);
    expect(third.items).toHaveLength(0);
    expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
  });

  it("searches folded text and formatted phone input", async () => {
    const byName = await services.listCustomers(actor, new URLSearchParams("search=Omar"));
    expect(byName.items.map((item) => item.name)).toEqual(["Omar Sherif"]);
    const byFormattedPhone = await services.listCustomers(
      actor,
      new URLSearchParams("search=100 123 4567"),
    );
    expect(byFormattedPhone.items.map((item) => item.name)).toEqual(["Mona Adel"]);
    const byArabicDigits = await services.listCustomers(
      actor,
      new URLSearchParams("search=١٠٠١٢٣٤٥٦٧"),
    );
    expect(byArabicDigits.items.map((item) => item.name)).toEqual(["Mona Adel"]);
  });

  it("rejects unknown query params and bad pagination", async () => {
    await expectApiError(
      services.listCustomers(actor, new URLSearchParams("derivedStatus=active")),
      "INVALID_QUERY",
    );
    await expectApiError(
      services.listCustomers(actor, new URLSearchParams("pageSize=101")),
      "INVALID_QUERY",
    );
    await expectApiError(
      services.listCustomers(actor, new URLSearchParams("sort=phoneE164")),
      "INVALID_QUERY",
    );
  });

  it("hides other workspaces' records as NOT_FOUND", async () => {
    const list = await services.listCustomers(actor, new URLSearchParams(""));
    const id = list.items[0]?.id as string;
    await expectApiError(services.getCustomer(foreignActor, id), "NOT_FOUND");
    const foreignList = await services.listCustomers(foreignActor, new URLSearchParams(""));
    expect(foreignList.total).toBe(0);
  });
});

describe("updateCustomer", () => {
  it("applies changes, bumps version, clears nullable fields, and audits", async () => {
    const { dto: created } = await services.createCustomer(actor, customerBody(), KEY, "c1");
    const updated = await services.updateCustomer(
      actor,
      created.id,
      { city: null, email: "new@Example.com", version: 1 },
      "c2",
    );
    expect(updated.version).toBe(2);
    expect(updated.email).toBe("new@Example.com");
    expect(updated).not.toHaveProperty("city");
    expect(updated.name).toBe("Mona Adel");

    const audit = await services.listAuditEvents(
      actor,
      new URLSearchParams("action=customer.updated"),
    );
    expect(audit.total).toBe(1);
  });

  it("conflicts on a stale version (409) and writes nothing", async () => {
    const { dto: created } = await services.createCustomer(actor, customerBody(), KEY, "c1");
    await services.updateCustomer(
      actor,
      created.id,
      { name: "Mona Adel Hassan", version: 1 },
      "c2",
    );
    await expectApiError(
      services.updateCustomer(actor, created.id, { name: "Stale Write", version: 1 }, "c3"),
      "CONFLICT_VERSION",
    );
    const after = await services.getCustomer(actor, created.id);
    expect(after.name).toBe("Mona Adel Hassan");
    expect(after.version).toBe(2);
  });

  it("rejects a version-only patch as EMPTY_PATCH", async () => {
    const { dto: created } = await services.createCustomer(actor, customerBody(), KEY, "c1");
    const error = await expectApiError(
      services.updateCustomer(actor, created.id, { version: 1 }, "c2"),
      "VALIDATION_FAILED",
    );
    expect(error.details).toMatchObject({ reason: "EMPTY_PATCH" });
  });

  it("rejects read-only fields and missing version", async () => {
    const { dto: created } = await services.createCustomer(actor, customerBody(), KEY, "c1");
    const readOnlyError = await expectApiError(
      services.updateCustomer(actor, created.id, { reference: "CU-999999", version: 1 }, "c2"),
      "VALIDATION_FAILED",
    );
    expect(readOnlyError.fieldErrors).toMatchObject({ reference: ["readOnly"] });
    const missingVersion = await expectApiError(
      services.updateCustomer(actor, created.id, { name: "No Version" }, "c3"),
      "VALIDATION_FAILED",
    );
    expect(missingVersion.fieldErrors).toMatchObject({ version: ["required"] });
  });

  it("returns NOT_FOUND for unknown ids", async () => {
    await expectApiError(
      services.updateCustomer(actor, "missing-id", { name: "Nobody Here", version: 1 }, "c"),
      "NOT_FOUND",
    );
  });
});

describe("read-only domains over the ports", () => {
  it("return honest empty pages before any data exists", async () => {
    const projects = await services.listProjects(actor, new URLSearchParams(""));
    expect(projects).toEqual({ items: [], total: 0, page: 1, pageSize: 20 });
    const documents = await services.listDocuments(actor, new URLSearchParams(""));
    expect(documents.total).toBe(0);
    const dues = await services.listDues(actor, new URLSearchParams(""));
    expect(dues.total).toBe(0);
  });

  it("rejects an invalid visibleToCustomer filter value", async () => {
    await expectApiError(
      services.listDocuments(actor, new URLSearchParams("visibleToCustomer=yes")),
      "INVALID_QUERY",
    );
  });

  it("derives due balances and purchase totals from stored records", async () => {
    const ws = actor.workspaceId;
    const base = { workspaceId: ws, createdAt: NOW, updatedAt: NOW, version: 1 };
    await fake.ports.repositories.dues.create({
      ...base,
      id: "due-1",
      customerId: "cust-1",
      projectId: "proj-1",
      label: { ar: "دفعة أولى", en: "First installment" },
      dueDate: "2026-10-01",
      amountMinor: 100_000,
      currency: "EGP",
    });
    await fake.ports.repositories.payments.create({
      ...base,
      id: "pay-1",
      customerId: "cust-1",
      projectId: "proj-1",
      paidAt: NOW,
      method: "instapay",
      amountMinor: 40_000,
      currency: "EGP",
      allocations: [{ dueId: "due-1", amountMinor: 40_000 }],
    });
    const due = await services.getDue(actor, "due-1");
    expect(due.allocatedMinor).toBe(40_000);
    expect(due.remainingMinor).toBe(60_000);
    expect(due.balanceStatus).toBe("overdue");

    await fake.ports.repositories.purchases.create({
      ...base,
      id: "pur-1",
      reference: "PU-000001",
      supplierId: "sup-1",
      projectId: "proj-1",
      date: "2026-10-20",
      supplierInvoiceRef: "INV-77",
      lines: [
        {
          label: { ar: "رخام", en: "Marble" },
          quantity: 2.5,
          unit: { ar: "م٢", en: "m2" },
          unitPriceMinor: 120_000,
        },
      ],
      discountMinor: 10_000,
      paidAmountMinor: 90_000,
      currency: "EGP",
    });
    const purchase = await services.getPurchase(actor, "pur-1");
    expect(purchase.totals).toEqual({
      grossMinor: 300_000,
      netMinor: 290_000,
      payableMinor: 200_000,
    });
  });
});
