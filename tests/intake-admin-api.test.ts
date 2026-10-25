/**
 * Staff intake-read tests (CT-API subset for contract §3.3–§3.4).
 *
 * The route guard is exercised with the existing owner-session source
 * mocked: anonymous ⇒ 401, wrong role ⇒ 403, owner without an adapter
 * ⇒ 503, owner with the dev fake ⇒ real reads. Service-level tests pin
 * §1.6 query validation, §2.4 projection minimization (list summaries
 * carry no phone/description), filters/search, 404s, and the READ
 * guarantee (reads append no audit rows, §1.10).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSession = vi.hoisted(() => ({ value: null as unknown }));
vi.mock("@/auth", () => ({
  getReviewSession: async () => mockSession.value,
}));

import { GET as getAdminAuditLogs } from "@/app/api/v1/admin/audit-logs/route";
import { GET as getAdminNotifications } from "@/app/api/v1/admin/notifications/route";
import { GET as getAdminOverview } from "@/app/api/v1/admin/overview/route";
import { GET as getAdminRequests } from "@/app/api/v1/admin/requests/route";
import { GET as getAdminRequest } from "@/app/api/v1/admin/requests/[id]/route";
import { POST as postRequest } from "@/app/api/v1/public/inspection-requests/route";
import { createAdminIntakeReads, type AdminIntakeReads } from "@/server/intake/admin-reads";
import { createFakeIntakeAdapter, type FakeIntakeAdapter } from "@/server/intake/fake-adapter";
import { IntakeError } from "@/server/intake/ports";
import { buildIntakeAllowlists, resetIntakeServiceCacheForTests } from "@/server/intake/runtime";
import { createIntakeService, type IntakeService } from "@/server/intake/service";

const NOW = "2026-10-24T10:00:00.000Z";
let idCounter = 0;
const clock = { now: () => NOW };
const ids = { newId: () => `id-${++idCounter}` };

let fake: FakeIntakeAdapter;
let service: IntakeService;
let reads: AdminIntakeReads;

const ctx = (key: string) => ({ idempotencyKey: key, clientIp: "203.0.113.9" });

function requestBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: "Seed User Alpha",
    phone: "+20 100 111 2222",
    serviceSlug: "kitchens",
    city: "Al Mansurah",
    description: "Seeded description that easily exceeds twenty characters.",
    consent: { contact: true, whatsapp: false },
    locale: "en",
    ...overrides,
  };
}

function contactBody(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    fullName: "Seed Contact Beta",
    phone: "+20 100 333 4444",
    subject: "Service enquiry",
    message: "Seeded contact message for admin read tests.",
    consent: { contact: true, whatsapp: false },
    locale: "en",
    ...overrides,
  };
}

beforeEach(async () => {
  idCounter = 0;
  fake = createFakeIntakeAdapter({ clock, ids });
  const allowlists = buildIntakeAllowlists();
  service = createIntakeService(fake.ports, allowlists);
  reads = createAdminIntakeReads(fake.ports, allowlists);

  await service.submitInspectionRequest(requestBody(), ctx("seed-key-00000000001"));
  await service.submitInspectionRequest(
    requestBody({
      fullName: "Seed User Gamma",
      phone: "+20 100 555 6666",
      serviceSlug: "interior-finishing",
      city: "Cairo",
    }),
    ctx("seed-key-00000000002"),
  );
  await service.submitContactMessage(contactBody(), ctx("seed-key-00000000003"));
});

async function expectCode(promise: Promise<unknown>, code: string): Promise<IntakeError> {
  try {
    await promise;
  } catch (error) {
    expect(error).toBeInstanceOf(IntakeError);
    expect((error as IntakeError).code).toBe(code);
    return error as IntakeError;
  }
  throw new Error(`Expected ${code}, but the call succeeded`);
}

const params = (query: string) => new URLSearchParams(query);

describe("admin request reads (service)", () => {
  it("lists summaries without phone or description, with correct page metadata", async () => {
    const page = await reads.listRequests(params(""));
    expect(page).toMatchObject({ total: 2, page: 1, pageSize: 20 });
    expect(page.items).toHaveLength(2);
    for (const item of page.items) {
      expect(item.customerId).toBeNull();
      expect(item.priority).toBe("normal");
      expect(item.status).toBe("new");
      expect(item).not.toHaveProperty("phoneE164");
      expect(item).not.toHaveProperty("description");
      expect(item).not.toHaveProperty("consent");
    }
    expect(page.items.map((item) => item.customerName).sort()).toEqual([
      "Seed User Alpha",
      "Seed User Gamma",
    ]);
  });

  it("paginates deterministically without overlap", async () => {
    const first = await reads.listRequests(params("pageSize=1&page=1"));
    const second = await reads.listRequests(params("pageSize=1&page=2"));
    const third = await reads.listRequests(params("pageSize=1&page=3"));
    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(1);
    expect(third.items).toHaveLength(0);
    expect(first.items[0]?.id).not.toBe(second.items[0]?.id);
    expect(third.total).toBe(2);
  });

  it("filters by status, service, and folded search", async () => {
    expect((await reads.listRequests(params("status=new"))).total).toBe(2);
    expect((await reads.listRequests(params("status=contacted"))).total).toBe(0);
    expect((await reads.listRequests(params("serviceSlug=kitchens"))).total).toBe(1);
    expect((await reads.listRequests(params("search=gamma"))).total).toBe(1);
    expect((await reads.listRequests(params("search=٥٥٥٦٦٦٦"))).total).toBe(1);
    expect((await reads.listRequests(params("search=RQ-000001"))).total).toBe(1);
    // §3.4 lists assigneeId as a filter; no record has an assignee yet,
    // so it filters to empty rather than failing the query.
    expect((await reads.listRequests(params("assigneeId=anyone"))).total).toBe(0);
    // Pasted formatted phones must match the separator-free stored value.
    expect((await reads.listRequests(params("search=100%20111%202222"))).total).toBe(1);
  });

  it("rejects invalid query values instead of ignoring them (§1.6)", async () => {
    for (const query of [
      "page=0",
      "page=abc",
      "pageSize=0",
      "pageSize=101",
      "sort=city",
      "status=bogus",
      "serviceSlug=unknown-service",
      "surprise=1",
    ]) {
      const error = await expectCode(reads.listRequests(params(query)), "INVALID_QUERY");
      expect(error.httpStatus).toBe(400);
    }
  });

  it("returns the full staff detail and 404 for unknown ids", async () => {
    const [summary] = (await reads.listRequests(params("search=Alpha"))).items;
    const detail = await reads.getRequest(summary?.id as string);
    expect(detail).toMatchObject({
      reference: "RQ-000001",
      phoneE164: "+201001112222",
      customerId: null,
      status: "new",
    });
    expect(detail.history).toEqual([{ status: "new", at: NOW, actorId: "public" }]);
    expect(detail.consent.contact).toBe(true);
    const error = await expectCode(reads.getRequest("missing-id"), "NOT_FOUND");
    expect(error.httpStatus).toBe(404);
  });

  it("appends no audit rows for reads (READ, §1.10)", async () => {
    const before = await fake.ports.repositories.audit.query({
      page: 1,
      pageSize: 50,
      direction: "asc",
    });
    await reads.listRequests(params(""));
    await reads.listContactMessages(params(""));
    const after = await fake.ports.repositories.audit.query({
      page: 1,
      pageSize: 50,
      direction: "asc",
    });
    expect(after.total).toBe(before.total);
  });
});

describe("admin contact-message reads (service)", () => {
  it("lists, filters by subject/range, and reads detail", async () => {
    const page = await reads.listContactMessages(params(""));
    expect(page.total).toBe(1);
    expect(page.items[0]).toMatchObject({ reference: "MSG-000001", subject: "Service enquiry" });

    expect((await reads.listContactMessages(params("subject=Service%20enquiry"))).total).toBe(1);
    expect((await reads.listContactMessages(params("subject=Other"))).total).toBe(0);
    expect(
      (await reads.listContactMessages(params("from=2026-10-24T00:00:00Z&to=2026-10-24T23:59:59Z")))
        .total,
    ).toBe(1);
    expect((await reads.listContactMessages(params("from=2026-10-25T00:00:00Z"))).total).toBe(0);

    const detail = await reads.getContactMessage(page.items[0]?.id as string);
    expect(detail.message).toContain("Seeded contact message");
    await expectCode(reads.getContactMessage("missing"), "NOT_FOUND");
  });

  it("rejects bad subjects and inverted/invalid ranges", async () => {
    await expectCode(reads.listContactMessages(params("subject=Billing")), "INVALID_QUERY");
    await expectCode(reads.listContactMessages(params("from=not-a-date")), "INVALID_QUERY");
    await expectCode(
      reads.listContactMessages(params("from=2026-10-25T00:00:00Z&to=2026-10-24T00:00:00Z")),
      "INVALID_QUERY",
    );
  });
});

describe("admin audit-log reads (service)", () => {
  it("maps entries to AuditLogDTO and filters by action/entity/range", async () => {
    const all = await reads.listAuditLogs(params(""));
    expect(all.total).toBe(3);
    for (const entry of all.items) {
      expect(entry.actor).toEqual({ kind: "public" });
      expect(entry.entity.reference).toMatch(/^(RQ|MSG)-\d{6}$/);
      expect(entry.at).toBe(NOW);
    }
    expect((await reads.listAuditLogs(params("action=request.created"))).total).toBe(2);
    expect((await reads.listAuditLogs(params("action=contact_message.created"))).total).toBe(1);
    expect((await reads.listAuditLogs(params("entityType=request"))).total).toBe(2);
    expect((await reads.listAuditLogs(params("from=2026-10-25T00:00:00Z"))).total).toBe(0);
    // No staff user actors exist yet: an actorId filter matches nothing.
    expect((await reads.listAuditLogs(params("actorId=user-1"))).total).toBe(0);
  });

  it("rejects invalid audit filters and never appends while reading (§3.9)", async () => {
    await expectCode(reads.listAuditLogs(params("entityType=quotation")), "INVALID_QUERY");
    await expectCode(reads.listAuditLogs(params("to=not-a-date")), "INVALID_QUERY");
    await expectCode(reads.listAuditLogs(params("actorId=%20")), "INVALID_QUERY");
    const q = { page: 1, pageSize: 50, direction: "asc" as const };
    const before = (await fake.ports.repositories.audit.query(q)).total;
    await reads.listAuditLogs(params(""));
    expect((await fake.ports.repositories.audit.query(q)).total).toBe(before);
  });
});

describe("admin notification reads (service)", () => {
  it("projects outbox rows without params, idempotency keys, or phone data", async () => {
    const page = await reads.listNotifications(params(""));
    expect(page.total).toBe(3);
    for (const row of page.items) {
      expect(row.status).toBe("queued");
      expect(row.attempts).toBe(0);
      expect(row.channel).toBe("whatsapp");
      expect(row.recipient.kind).toBe("staff");
      expect(row.related.reference).toMatch(/^(RQ|MSG)-\d{6}$/);
      expect(row).not.toHaveProperty("params");
      expect(row).not.toHaveProperty("idempotencyKey");
      expect(JSON.stringify(row)).not.toContain("201001112222");
    }
    expect((await reads.listNotifications(params("eventType=staff_alert"))).total).toBe(3);
    expect((await reads.listNotifications(params("eventType=customer_confirmation"))).total).toBe(
      0,
    );
    expect((await reads.listNotifications(params("status=sent"))).total).toBe(0);
    expect((await reads.listNotifications(params("channel=email"))).total).toBe(0);
    expect((await reads.listNotifications(params("entityType=contact_message"))).total).toBe(1);
  });

  it("rejects unknown notification filter values", async () => {
    await expectCode(reads.listNotifications(params("status=bogus")), "INVALID_QUERY");
    await expectCode(reads.listNotifications(params("channel=sms")), "INVALID_QUERY");
    await expectCode(reads.listNotifications(params("eventType=marketing")), "INVALID_QUERY");
    await expectCode(reads.listNotifications(params("entityType=customer")), "INVALID_QUERY");
  });
});

describe("admin overview (service)", () => {
  it("computes honest intake counts and recent activity at request time", async () => {
    const overview = await reads.getOverview();
    expect(overview.generatedAt).toBe(NOW);
    expect(overview.metrics).toEqual({
      requestsNew: 2,
      requestsTotal: 2,
      contactMessagesTotal: 1,
      notificationsQueued: 3,
    });
    expect(overview.operationalFlow).toEqual([{ stage: "new", count: 2 }]);
    expect(overview.actionQueue).toEqual([]);
    expect(overview.recentActivity).toHaveLength(3);
    expect(overview.recentActivity.map((entry) => entry.action).sort()).toEqual([
      "contact_message.created",
      "request.created",
      "request.created",
    ]);
  });
});

describe("admin read routes (authorization + governance)", () => {
  const savedEnv = { ...process.env };
  const ownerSession = { user: { role: "owner_review", email: "owner@example.test" } };

  afterEach(() => {
    process.env = { ...savedEnv };
    vi.unstubAllEnvs();
    mockSession.value = null;
    resetIntakeServiceCacheForTests();
  });

  const get = (path: string) => new Request(`http://localhost${path}`, { method: "GET" });

  it("returns 401 anonymously even when no adapter is configured", async () => {
    delete process.env.DATA_ADAPTER;
    mockSession.value = null;
    resetIntakeServiceCacheForTests();
    const response = await getAdminRequests(get("/api/v1/admin/requests"));
    expect(response.status).toBe(401);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe(
      "UNAUTHENTICATED",
    );
  });

  it("returns 403 for a non-owner role (no blanket staff access)", async () => {
    vi.stubEnv("DATA_ADAPTER", "fake");
    mockSession.value = { user: { role: "customer" } };
    resetIntakeServiceCacheForTests();
    const response = await getAdminRequests(get("/api/v1/admin/requests"));
    expect(response.status).toBe(403);
    expect(((await response.json()) as { error: { code: string } }).error.code).toBe("FORBIDDEN");
  });

  it("returns 503 for the owner when the adapter is unavailable or production-refused", async () => {
    mockSession.value = ownerSession;
    delete process.env.DATA_ADAPTER;
    resetIntakeServiceCacheForTests();
    expect((await getAdminRequests(get("/api/v1/admin/requests"))).status).toBe(503);

    vi.stubEnv("DATA_ADAPTER", "fake");
    vi.stubEnv("NODE_ENV", "production");
    resetIntakeServiceCacheForTests();
    expect((await getAdminRequests(get("/api/v1/admin/requests"))).status).toBe(503);
  });

  it("serves seeded reads to the owner with the dev fake, incl. 404 and 400", async () => {
    vi.stubEnv("DATA_ADAPTER", "fake");
    vi.stubEnv("NODE_ENV", "test");
    mockSession.value = ownerSession;
    resetIntakeServiceCacheForTests();

    const created = await postRequest(
      new Request("http://localhost/api/v1/public/inspection-requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": "admin-route-seed-001",
        },
        body: JSON.stringify(requestBody({ fullName: "Route Seed Unique Zeta" })),
      }),
    );
    expect(created.status).toBe(201);
    const receipt = (await created.json()) as { id: string; reference: string };

    const list = await getAdminRequests(get("/api/v1/admin/requests?search=Zeta"));
    expect(list.status).toBe(200);
    const page = (await list.json()) as { total: number; items: Array<{ reference: string }> };
    expect(page.total).toBe(1);
    expect(page.items[0]?.reference).toBe(receipt.reference);

    const detail = await getAdminRequest(get(`/api/v1/admin/requests/${receipt.id}`), {
      params: Promise.resolve({ id: receipt.id }),
    });
    expect(detail.status).toBe(200);
    expect(((await detail.json()) as { reference: string }).reference).toBe(receipt.reference);

    const missing = await getAdminRequest(get("/api/v1/admin/requests/nope"), {
      params: Promise.resolve({ id: "nope" }),
    });
    expect(missing.status).toBe(404);

    const overview = await getAdminOverview();
    expect(overview.status).toBe(200);
    expect(overview.headers.get("cache-control")).toBe("no-store");
    const notifications = await getAdminNotifications(get("/api/v1/admin/notifications"));
    expect(notifications.status).toBe(200);
    const auditLogs = await getAdminAuditLogs(get("/api/v1/admin/audit-logs"));
    expect(auditLogs.status).toBe(200);

    mockSession.value = null;
    expect((await getAdminOverview()).status).toBe(401);
    expect((await getAdminAuditLogs(get("/api/v1/admin/audit-logs"))).status).toBe(401);
    expect((await getAdminNotifications(get("/api/v1/admin/notifications"))).status).toBe(401);
    mockSession.value = ownerSession;

    const badQuery = await getAdminRequests(get("/api/v1/admin/requests?pageSize=500"));
    expect(badQuery.status).toBe(400);
    expect(((await badQuery.json()) as { error: { code: string } }).error.code).toBe(
      "INVALID_QUERY",
    );
  });
});
