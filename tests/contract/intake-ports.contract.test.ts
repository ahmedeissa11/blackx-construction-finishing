/**
 * CT-PORT (intake subset) — adapter conformance for the public-intake
 * ports in `src/server/intake/ports.ts`, per API contract §8.1.
 *
 * This shared suite asserts adapter *behavior* only: transaction
 * atomicity (incl. fault-injection rollback), read-your-own-writes,
 * reference uniqueness, scoped-idempotency semantics, rate-limit
 * windows, append-only audit surface, and reset. It runs today against
 * the governed in-memory fake; the database colleague's real adapter
 * must pass it unchanged against a disposable test database before
 * integration (§5.5, §8.2) — select it then via INTAKE_CONTRACT_ADAPTER.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { createFakeIntakeAdapter, type FakeIntakeAdapter } from "@/server/intake/fake-adapter";
import type { ContactMessageRecord, IntakePorts, IntakeRequestRecord } from "@/server/intake/ports";
import { describeWithAdapter, resolveAdapter, type ContractAdapter } from "./harness";

let nowMs = Date.parse("2026-10-24T10:00:00.000Z");
let idCounter = 0;

const clock = { now: () => new Date(nowMs).toISOString() };
const ids = { newId: () => `test-id-${++idCounter}` };

const fakeByPorts = new WeakMap<IntakePorts, FakeIntakeAdapter>();

const fakeAdapter: ContractAdapter<IntakePorts> = {
  name: "fake-memory",
  async create() {
    const fake = createFakeIntakeAdapter({ clock, ids });
    fakeByPorts.set(fake.ports, fake);
    return fake.ports;
  },
  async reset(ports) {
    await fakeByPorts.get(ports)?.reset();
  },
};

const registry: readonly ContractAdapter<IntakePorts>[] = [fakeAdapter];
const adapter = resolveAdapter(registry, process.env.INTAKE_CONTRACT_ADAPTER, fakeAdapter.name);

function makeRequestRecord(id: string, reference: string): IntakeRequestRecord {
  return {
    id,
    reference,
    customerId: null,
    fullName: "Contract Test",
    phoneE164: "+201001234567",
    serviceSlug: "interior-finishing",
    city: "Cairo",
    description: "Contract-test description with enough length.",
    consent: { contact: true, whatsapp: true, capturedAt: clock.now(), source: "public_website" },
    locale: "en",
    status: "new",
    priority: "normal",
    assigneeId: null,
    submittedAt: clock.now(),
    version: 1,
  };
}

function makeContactRecord(
  id: string,
  reference: string,
  overrides: Partial<ContactMessageRecord> = {},
): ContactMessageRecord {
  return {
    id,
    reference,
    fullName: "Contract Test",
    phoneE164: "+201001234567",
    subject: "Other",
    message: "Contract-test message.",
    consent: { contact: true, whatsapp: false, capturedAt: clock.now(), source: "public_website" },
    locale: "en",
    receivedAt: clock.now(),
    ...overrides,
  };
}

beforeEach(() => {
  nowMs = Date.parse("2026-10-24T10:00:00.000Z");
});

describeWithAdapter("Intake ports contract (CT-PORT subset)", adapter, (getPorts) => {
  it("commits business + history + audit + outbox writes atomically", async () => {
    const ports = getPorts();
    await ports.unitOfWork.run(async (repos) => {
      const reference = await repos.references.next("request");
      await repos.requests.create(makeRequestRecord("req-1", reference), {
        status: "new",
        at: clock.now(),
        actorId: "public",
      });
      await repos.audit.append({
        id: "aud-1",
        event: "request.created",
        actorKind: "public",
        entityType: "request",
        entityId: "req-1",
        at: clock.now(),
        reference,
      });
      await repos.outbox.enqueue({
        id: "out-1",
        eventType: "staff_alert",
        channel: "whatsapp",
        recipientKind: "staff",
        templateKey: "intake.staff_alert",
        locale: "en",
        params: { reference },
        entityType: "request",
        entityId: "req-1",
        idempotencyKey: "out-key-1",
        status: "queued",
        createdAt: clock.now(),
      });
    });

    const stored = await ports.repositories.requests.byId("req-1");
    expect(stored?.record.reference).toBe("RQ-000001");
    expect(stored?.history).toHaveLength(1);
    expect(
      (
        await ports.repositories.audit.query({
          page: 1,
          pageSize: 50,
          direction: "asc",
          entityId: "req-1",
        })
      ).total,
    ).toBe(1);
    expect(await ports.repositories.outbox.listByEntity("request", "req-1")).toHaveLength(1);
  });

  it("rolls back every write when the transaction throws (fault injection)", async () => {
    const ports = getPorts();
    await expect(
      ports.unitOfWork.run(async (repos) => {
        await repos.contactMessages.create(makeContactRecord("msg-1", "MSG-000001"));
        await repos.audit.append({
          id: "aud-x",
          event: "contact_message.created",
          actorKind: "public",
          entityType: "contact_message",
          entityId: "msg-1",
          at: clock.now(),
          reference: "MSG-000001",
        });
        throw new Error("injected failure");
      }),
    ).rejects.toThrow("injected failure");

    expect(await ports.repositories.contactMessages.count()).toBe(0);
    expect(await ports.repositories.contactMessages.byId("msg-1")).toBeNull();
    expect(
      (await ports.repositories.audit.query({ page: 1, pageSize: 50, direction: "asc" })).items,
    ).toEqual([]);
  });

  it("reads its own writes inside the transaction", async () => {
    const ports = getPorts();
    await ports.unitOfWork.run(async (repos) => {
      await repos.contactMessages.create(makeContactRecord("msg-2", "MSG-000009"));
      const inside = await repos.contactMessages.byId("msg-2");
      expect(inside?.reference).toBe("MSG-000009");
      expect(await repos.contactMessages.count()).toBe(1);
    });
  });

  it("returns copies: mutating a read result never changes stored state", async () => {
    const ports = getPorts();
    await ports.unitOfWork.run(async (repos) => {
      await repos.contactMessages.create(makeContactRecord("msg-3", "MSG-000003"));
    });
    const first = await ports.repositories.contactMessages.byId("msg-3");
    if (first) first.message = "tampered";
    const second = await ports.repositories.contactMessages.byId("msg-3");
    expect(second?.message).toBe("Contract-test message.");
  });

  it("generates unique sequential references per kind, independently", async () => {
    const ports = getPorts();
    const refs = await ports.unitOfWork.run(async (repos) => [
      await repos.references.next("request"),
      await repos.references.next("request"),
      await repos.references.next("contact_message"),
      await repos.references.next("request"),
    ]);
    expect(refs).toEqual(["RQ-000001", "RQ-000002", "MSG-000001", "RQ-000003"]);
    expect(new Set(refs).size).toBe(refs.length);
  });

  it("scoped idempotency: claim → complete → replay, mismatch, in-progress, scope isolation", async () => {
    const ports = getPorts();
    const route = "/api/v1/public/inspection-requests";
    const receipt = { id: "req-9", reference: "RQ-000009", receivedAt: clock.now() };

    const first = await ports.idempotency.claim("public", "POST", route, "key-1", "hash-a");
    expect(first.kind).toBe("claimed");

    const concurrent = await ports.idempotency.claim("public", "POST", route, "key-1", "hash-a");
    expect(concurrent.kind).toBe("in_progress");

    const mismatch = await ports.idempotency.claim("public", "POST", route, "key-1", "hash-b");
    expect(mismatch.kind).toBe("payload_mismatch");

    if (first.kind === "claimed") {
      await ports.idempotency.complete(
        first.claim,
        201,
        receipt,
        new Date(nowMs + 24 * 3600 * 1000).toISOString(),
      );
    }
    const replay = await ports.idempotency.claim("public", "POST", route, "key-1", "hash-a");
    expect(replay).toEqual({ kind: "completed", httpStatus: 201, receipt });

    // Same raw key on a different route is a different record (§1.8).
    const otherRoute = await ports.idempotency.claim(
      "public",
      "POST",
      "/api/v1/public/contact-messages",
      "key-1",
      "hash-a",
    );
    expect(otherRoute.kind).toBe("claimed");

    // After retention expiry the same key is a new intent (§1.8).
    nowMs += 25 * 3600 * 1000;
    const afterExpiry = await ports.idempotency.claim("public", "POST", route, "key-1", "hash-a");
    expect(afterExpiry.kind).toBe("claimed");
  });

  it("releaseRetryable frees an in-progress claim for a safe retry", async () => {
    const ports = getPorts();
    const route = "/api/v1/public/contact-messages";
    const first = await ports.idempotency.claim("public", "POST", route, "key-2", "hash-a");
    expect(first.kind).toBe("claimed");
    if (first.kind === "claimed") {
      await ports.idempotency.releaseRetryable(first.claim);
    }
    const retry = await ports.idempotency.claim("public", "POST", route, "key-2", "hash-a");
    expect(retry.kind).toBe("claimed");
  });

  it("enforces fixed-window rate limits and recovers after the window", async () => {
    const ports = getPorts();
    expect((await ports.rateLimits.hit("k", 2, 3600)).allowed).toBe(true);
    expect((await ports.rateLimits.hit("k", 2, 3600)).allowed).toBe(true);
    const denied = await ports.rateLimits.hit("k", 2, 3600);
    expect(denied.allowed).toBe(false);
    expect(denied.retryAfterSec).toBeGreaterThan(0);
    nowMs += 3601 * 1000;
    expect((await ports.rateLimits.hit("k", 2, 3600)).allowed).toBe(true);
  });

  it("exposes no audit mutation surface (append-only, SEC-09)", () => {
    const audit = getPorts().repositories.audit as unknown as Record<string, unknown>;
    expect(typeof audit.append).toBe("function");
    expect(audit.update).toBeUndefined();
    expect(audit.delete).toBeUndefined();
    expect(audit.remove).toBeUndefined();
  });

  it("lists with deterministic order, stable pages, filters, and folded search (§1.6)", async () => {
    const ports = getPorts();
    const stamps = [
      "2026-10-20T09:00:00.000Z",
      "2026-10-21T09:00:00.000Z",
      "2026-10-22T09:00:00.000Z",
      "2026-10-23T09:00:00.000Z",
      "2026-10-24T09:00:00.000Z",
    ];
    await ports.unitOfWork.run(async (repos) => {
      for (const [index, stamp] of stamps.entries()) {
        await repos.contactMessages.create(
          makeContactRecord(`msg-p${index + 1}`, `MSG-00000${index + 1}`, {
            receivedAt: stamp,
            subject: index % 2 === 0 ? "Service enquiry" : "Other",
          }),
        );
      }
    });

    const repo = ports.repositories.contactMessages;
    const page1 = await repo.list({ page: 1, pageSize: 2, direction: "desc" });
    const page2 = await repo.list({ page: 2, pageSize: 2, direction: "desc" });
    const page3 = await repo.list({ page: 3, pageSize: 2, direction: "desc" });
    expect(page1.total).toBe(5);
    const orderedIds = [...page1.items, ...page2.items, ...page3.items].map((item) => item.id);
    expect(orderedIds).toEqual(["msg-p5", "msg-p4", "msg-p3", "msg-p2", "msg-p1"]);
    expect(new Set(orderedIds).size).toBe(5);

    const filtered = await repo.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      subject: "Service enquiry",
    });
    expect(filtered.items.map((item) => item.id)).toEqual(["msg-p1", "msg-p3", "msg-p5"]);

    const ranged = await repo.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      from: "2026-10-21T00:00:00.000Z",
      to: "2026-10-22T23:59:59.999Z",
    });
    expect(ranged.items.map((item) => item.id)).toEqual(["msg-p2", "msg-p3"]);

    // Search folds Arabic-Indic digits and case (documented fake semantics).
    const searched = await repo.list({ page: 1, pageSize: 10, direction: "asc", search: "١٢٣٤٥" });
    expect(searched.total).toBe(5);
    const byName = await repo.list({ page: 1, pageSize: 10, direction: "asc", search: "contract" });
    expect(byName.total).toBe(5);
    const noHit = await repo.list({ page: 1, pageSize: 10, direction: "asc", search: "zzz-none" });
    expect(noHit.total).toBe(0);
    expect(noHit.items).toEqual([]);
  });

  it("queries audit + outbox with paging/filters and matches pasted formatted phones", async () => {
    const ports = getPorts();
    await ports.unitOfWork.run(async (repos) => {
      await repos.requests.create(makeRequestRecord("req-s", "RQ-000777"), {
        status: "new",
        at: clock.now(),
        actorId: "public",
      });
      await repos.audit.append({
        id: "aud-s1",
        event: "request.created",
        actorKind: "public",
        entityType: "request",
        entityId: "req-s",
        at: "2026-10-24T09:00:00.000Z",
        reference: "RQ-000777",
      });
      await repos.audit.append({
        id: "aud-s2",
        event: "contact_message.created",
        actorKind: "public",
        entityType: "contact_message",
        entityId: "msg-s",
        at: "2026-10-24T08:00:00.000Z",
        reference: "MSG-000777",
      });
      await repos.outbox.enqueue({
        id: "out-s1",
        eventType: "staff_alert",
        channel: "whatsapp",
        recipientKind: "staff",
        templateKey: "intake.staff_alert",
        locale: "en",
        params: { reference: "RQ-000777" },
        entityType: "request",
        entityId: "req-s",
        idempotencyKey: "out-key-s1",
        status: "queued",
        createdAt: clock.now(),
      });
    });

    // Pasted formatted phone ("100 123 4567") matches stored "+201001234567".
    const byPhone = await ports.repositories.requests.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      search: "100 123 4567",
    });
    expect(byPhone.items.map((item) => item.id)).toEqual(["req-s"]);
    // No assignees exist yet: the §3.4 assignee filter matches nothing.
    const byAssignee = await ports.repositories.requests.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      assigneeId: "anyone",
    });
    expect(byAssignee.total).toBe(0);

    const auditDesc = await ports.repositories.audit.query({
      page: 1,
      pageSize: 10,
      direction: "desc",
    });
    expect(auditDesc.items.map((entry) => entry.id)).toEqual(["aud-s1", "aud-s2"]);
    const auditFiltered = await ports.repositories.audit.query({
      page: 1,
      pageSize: 10,
      direction: "asc",
      action: "request.created",
      from: "2026-10-24T00:00:00.000Z",
    });
    expect(auditFiltered.items.map((entry) => entry.id)).toEqual(["aud-s1"]);
    const auditByActor = await ports.repositories.audit.query({
      page: 1,
      pageSize: 10,
      direction: "asc",
      actorId: "user-1",
    });
    expect(auditByActor.total).toBe(0);

    const outbox = await ports.repositories.outbox.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      status: "queued",
      entityType: "request",
    });
    expect(outbox.items.map((row) => row.id)).toEqual(["out-s1"]);
    const outboxNone = await ports.repositories.outbox.list({
      page: 1,
      pageSize: 10,
      direction: "asc",
      status: "sent",
    });
    expect(outboxNone.total).toBe(0);
  });

  it("reset returns every store to empty and the ports stay usable", async () => {
    const ports = getPorts();
    await ports.unitOfWork.run(async (repos) => {
      await repos.contactMessages.create(makeContactRecord("msg-4", "MSG-000004"));
    });
    expect(await ports.repositories.contactMessages.count()).toBe(1);

    await adapter.reset(ports);

    expect(await ports.repositories.contactMessages.count()).toBe(0);
    await ports.unitOfWork.run(async (repos) => {
      await repos.contactMessages.create(makeContactRecord("msg-5", "MSG-000005"));
    });
    expect(await ports.repositories.contactMessages.count()).toBe(1);
  });
});

describe("Intake contract adapter selection", () => {
  it("registers the fake under a stable name and fails loudly on unknown names", () => {
    expect(resolveAdapter(registry, undefined, fakeAdapter.name).name).toBe("fake-memory");
    expect(() => resolveAdapter(registry, "real-db")).toThrowError(/fake-memory/);
  });
});
