/**
 * CT-PORT (foundation) — adapter conformance suite for the foundation
 * repository ports. Behavior-only: this suite must pass UNCHANGED
 * against the database colleague's real adapter on a disposable test
 * database (contract §5.5, §8.2). Today only the governed fake is
 * registered; selecting an unregistered adapter fails loudly at
 * collection time (no silent fallback).
 *
 *   FOUNDATION_CONTRACT_ADAPTER=fake npm run test:contract
 *
 * (Dedicated env var, mirroring the intake suite's
 * INTAKE_CONTRACT_ADAPTER, so all three contract suites can select
 * their adapters independently in a single run — the probe keeps the
 * generic CONTRACT_ADAPTER.)
 *
 * Covered observable behavior: workspace scoping, deterministic
 * ordering + pagination stability, folded search (incl. formatted
 * phone), version-checked updates, UnitOfWork atomicity with
 * fault injection + read-your-own-writes, append-only audit surface,
 * reference uniqueness, scoped idempotency lifecycle, and reset.
 */

import { describe, expect, it } from "vitest";
import {
  createFakeFoundationAdapter,
  type FakeFoundationAdapter,
} from "@/server/foundation/fake-adapter";
import { VersionConflictError } from "@/server/foundation/errors";
import type {
  CustomerRecord,
  DocumentRecord,
  FoundationPorts,
  ProjectRecord,
} from "@/server/foundation/ports";
import { describeWithAdapter, resolveAdapter, type ContractAdapter } from "./harness";

const NOW = "2026-10-25T10:00:00.000Z";
const WS = "ws-a";
const OTHER_WS = "ws-b";

const fakeWrappers = new WeakMap<FoundationPorts, FakeFoundationAdapter>();

const fakeAdapter: ContractAdapter<FoundationPorts> = {
  name: "fake",
  async create() {
    let counter = 0;
    const fake = createFakeFoundationAdapter({
      clock: { now: () => NOW },
      ids: { newId: () => `ct-${++counter}` },
    });
    fakeWrappers.set(fake.ports, fake);
    return fake.ports;
  },
  async reset(port) {
    fakeWrappers.get(port)?.reset();
  },
  async dispose(port) {
    fakeWrappers.delete(port);
  },
};

const adapter = resolveAdapter(
  [fakeAdapter],
  process.env.FOUNDATION_CONTRACT_ADAPTER,
  fakeAdapter.name,
);

function customerRecord(id: string, overrides: Partial<CustomerRecord> = {}): CustomerRecord {
  return {
    id,
    workspaceId: WS,
    reference: `CU-${id}`,
    name: `Customer ${id}`,
    phoneE164: "+201001234567",
    whatsappConsent: { granted: false },
    portalUserIds: [],
    createdAt: NOW,
    updatedAt: NOW,
    version: 1,
    ...overrides,
  };
}

function baseQuery(overrides: Record<string, unknown> = {}) {
  return {
    workspaceId: WS,
    page: 1,
    pageSize: 20,
    sortField: "createdAt",
    direction: "asc" as const,
    ...overrides,
  };
}

describeWithAdapter("foundation ports", adapter, (getPort) => {
  describe("aggregate repositories", () => {
    it("round-trips create/byId with defensive copies", async () => {
      const ports = getPort();
      const record = customerRecord("c1");
      await ports.repositories.customers.create(record);
      const found = await ports.repositories.customers.byId(WS, "c1");
      expect(found).toEqual(record);
      // Mutating the returned copy must not corrupt stored state.
      (found as CustomerRecord).name = "Tampered";
      const again = await ports.repositories.customers.byId(WS, "c1");
      expect(again?.name).toBe("Customer c1");
    });

    it("scopes every read by workspace", async () => {
      const ports = getPort();
      await ports.repositories.customers.create(customerRecord("c1"));
      expect(await ports.repositories.customers.byId(OTHER_WS, "c1")).toBeNull();
      expect(
        (await ports.repositories.customers.list(baseQuery({ workspaceId: OTHER_WS }))).total,
      ).toBe(0);
      expect(await ports.repositories.customers.count(OTHER_WS)).toBe(0);
      expect(await ports.repositories.customers.count(WS)).toBe(1);
    });

    it("paginates deterministically without overlap (id tiebreak)", async () => {
      const ports = getPort();
      for (const id of ["c3", "c1", "c5", "c2", "c4"]) {
        await ports.repositories.customers.create(customerRecord(id));
      }
      const seen: string[] = [];
      for (let page = 1; page <= 3; page += 1) {
        const result = await ports.repositories.customers.list(baseQuery({ page, pageSize: 2 }));
        expect(result.total).toBe(5);
        seen.push(...result.items.map((item) => item.id));
      }
      expect(seen).toEqual(["c1", "c2", "c3", "c4", "c5"]);
      const beyond = await ports.repositories.customers.list(baseQuery({ page: 4, pageSize: 2 }));
      expect(beyond.items).toHaveLength(0);
      expect(beyond.total).toBe(5);
    });

    it("searches folded text, references, and formatted phone numbers", async () => {
      const ports = getPort();
      await ports.repositories.customers.create(customerRecord("c1", { name: "Mona Adel" }));
      await ports.repositories.customers.create(
        customerRecord("c2", { name: "Omar Sherif", phoneE164: "+201009876543" }),
      );
      const byName = await ports.repositories.customers.list(baseQuery({ search: "mona" }));
      expect(byName.items.map((item) => item.id)).toEqual(["c1"]);
      const byReference = await ports.repositories.customers.list(baseQuery({ search: "CU-C2" }));
      expect(byReference.items.map((item) => item.id)).toEqual(["c2"]);
      const byFormattedPhone = await ports.repositories.customers.list(
        baseQuery({ search: "100 123 4567" }),
      );
      expect(byFormattedPhone.items.map((item) => item.id)).toEqual(["c1"]);
      const byArabicDigits = await ports.repositories.customers.list(
        baseQuery({ search: "١٠٠٩٨٧٦٥٤٣" }),
      );
      expect(byArabicDigits.items.map((item) => item.id)).toEqual(["c2"]);
    });

    it("enforces optimistic concurrency on update", async () => {
      const ports = getPort();
      await ports.repositories.customers.create(customerRecord("c1"));
      const current = await ports.repositories.customers.byId(WS, "c1");
      await ports.repositories.customers.update(
        { ...(current as CustomerRecord), name: "Updated", version: 2 },
        1,
      );
      expect((await ports.repositories.customers.byId(WS, "c1"))?.version).toBe(2);
      await expect(
        ports.repositories.customers.update(
          { ...(current as CustomerRecord), name: "Stale", version: 2 },
          1,
        ),
      ).rejects.toBeInstanceOf(VersionConflictError);
      expect((await ports.repositories.customers.byId(WS, "c1"))?.name).toBe("Updated");
    });

    it("applies the same semantics to other aggregates (projects, documents)", async () => {
      const ports = getPort();
      const project: ProjectRecord = {
        id: "p1",
        workspaceId: WS,
        reference: "PR-000001",
        title: { ar: "فيلا لوران", en: "Ain Shams Villa" },
        customerId: "c1",
        contractId: "ct1",
        serviceSlug: "interior-finishing",
        status: "in_progress",
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      };
      await ports.repositories.projects.create(project);
      const byArabicTitle = await ports.repositories.projects.list(baseQuery({ search: "لوران" }));
      expect(byArabicTitle.items.map((item) => item.id)).toEqual(["p1"]);
      const filtered = await ports.repositories.projects.list(baseQuery({ status: "on_hold" }));
      expect(filtered.total).toBe(0);

      const document: DocumentRecord = {
        id: "d1",
        workspaceId: WS,
        owner: { entityType: "project", entityId: "p1" },
        title: "Contract scan",
        docType: "contract",
        visibleToCustomer: false,
        currentVersionNo: 1,
        versions: [
          {
            versionNo: 1,
            fileName: "contract.pdf",
            mimeType: "application/pdf",
            sizeBytes: 1234,
            storageRef: "adapter-owned-ref",
            uploadedBy: "u1",
            uploadedAt: NOW,
          },
        ],
        createdAt: NOW,
        updatedAt: NOW,
        version: 1,
      };
      await ports.repositories.documents.create(document);
      const byOwner = await ports.repositories.documents.list(
        baseQuery({ entityType: "project", entityId: "p1" }),
      );
      expect(byOwner.items.map((item) => item.id)).toEqual(["d1"]);
      const byWrongOwner = await ports.repositories.documents.list(
        baseQuery({ entityType: "project", entityId: "p2" }),
      );
      expect(byWrongOwner.total).toBe(0);
      const byVisibility = await ports.repositories.documents.list(
        baseQuery({ visibleToCustomer: true }),
      );
      expect(byVisibility.total).toBe(0);
    });
  });

  describe("UnitOfWork", () => {
    it("commits business + audit writes atomically and reads its own writes", async () => {
      const ports = getPort();
      await ports.unitOfWork.run(async (tx) => {
        await tx.customers.create(customerRecord("c1"));
        const inside = await tx.customers.byId(WS, "c1");
        expect(inside?.id).toBe("c1");
        await tx.auditEvents.append({
          id: "a1",
          workspaceId: WS,
          at: NOW,
          actor: { kind: "user", userId: "u1", role: "OWN" },
          action: "customer.created",
          entity: { type: "customer", id: "c1", reference: "CU-c1" },
        });
      });
      expect(await ports.repositories.customers.count(WS)).toBe(1);
      const audit = await ports.repositories.auditEvents.query({
        workspaceId: WS,
        page: 1,
        pageSize: 20,
        direction: "asc",
      });
      expect(audit.total).toBe(1);
    });

    it("rolls back everything when work throws (fault injection)", async () => {
      const ports = getPort();
      await expect(
        ports.unitOfWork.run(async (tx) => {
          await tx.customers.create(customerRecord("c1"));
          await tx.auditEvents.append({
            id: "a1",
            workspaceId: WS,
            at: NOW,
            actor: { kind: "user", userId: "u1" },
            action: "customer.created",
            entity: { type: "customer", id: "c1" },
          });
          throw new Error("injected failure");
        }),
      ).rejects.toThrow("injected failure");
      expect(await ports.repositories.customers.count(WS)).toBe(0);
      const audit = await ports.repositories.auditEvents.query({
        workspaceId: WS,
        page: 1,
        pageSize: 20,
        direction: "asc",
      });
      expect(audit.total).toBe(0);
    });
  });

  describe("audit, references, idempotency", () => {
    it("exposes an append-only audit surface (no update/delete methods)", () => {
      const ports = getPort();
      expect(Object.keys(ports.repositories.auditEvents).sort()).toEqual(["append", "query"]);
      expect(Object.keys(ports.repositories.diary)).not.toContain("update");
      expect(Object.keys(ports.repositories.progress)).not.toContain("update");
    });

    it("filters audit queries and keeps deterministic order", async () => {
      const ports = getPort();
      for (const [id, action] of [
        ["a1", "customer.created"],
        ["a2", "customer.updated"],
      ] as const) {
        await ports.repositories.auditEvents.append({
          id,
          workspaceId: WS,
          at: NOW,
          actor: { kind: "user", userId: "u1" },
          action,
          entity: { type: "customer", id: "c1" },
        });
      }
      const filtered = await ports.repositories.auditEvents.query({
        workspaceId: WS,
        page: 1,
        pageSize: 20,
        direction: "desc",
        action: "customer.updated",
      });
      expect(filtered.items.map((item) => item.id)).toEqual(["a2"]);
    });

    it("mints unique sequential references per kind", async () => {
      const ports = getPort();
      const first = await ports.repositories.references.next("customer");
      const second = await ports.repositories.references.next("customer");
      const other = await ports.repositories.references.next("project");
      expect(first).not.toBe(second);
      expect(first.startsWith("CU-")).toBe(true);
      expect(other.startsWith("PR-")).toBe(true);
    });

    it("runs the scoped idempotency lifecycle (claim/complete/replay/mismatch/release)", async () => {
      const ports = getPort();
      const claimed = await ports.idempotency.claim("u1", "POST", "/x", "key-0000000000001", "h1");
      expect(claimed.kind).toBe("claimed");
      if (claimed.kind !== "claimed") throw new Error("expected claim");

      const concurrent = await ports.idempotency.claim(
        "u1",
        "POST",
        "/x",
        "key-0000000000001",
        "h1",
      );
      expect(concurrent.kind).toBe("in_progress");

      await ports.idempotency.complete(
        claimed.claim,
        201,
        "customer",
        "c1",
        "2027-01-01T00:00:00.000Z",
      );
      const replay = await ports.idempotency.claim("u1", "POST", "/x", "key-0000000000001", "h1");
      expect(replay).toMatchObject({ kind: "completed", httpStatus: 201, resourceId: "c1" });

      const mismatch = await ports.idempotency.claim("u1", "POST", "/x", "key-0000000000001", "h2");
      expect(mismatch.kind).toBe("payload_mismatch");

      // Different actor scope: independent record.
      const otherScope = await ports.idempotency.claim(
        "u2",
        "POST",
        "/x",
        "key-0000000000001",
        "h2",
      );
      expect(otherScope.kind).toBe("claimed");
      if (otherScope.kind === "claimed") {
        await ports.idempotency.releaseRetryable(otherScope.claim);
        const reclaimed = await ports.idempotency.claim(
          "u2",
          "POST",
          "/x",
          "key-0000000000001",
          "h2",
        );
        expect(reclaimed.kind).toBe("claimed");
      }
    });

    it("reset returns every store to empty", async () => {
      const ports = getPort();
      await ports.repositories.customers.create(customerRecord("c1"));
      await adapter.reset(ports);
      expect(await ports.repositories.customers.count(WS)).toBe(0);
    });
  });
});
