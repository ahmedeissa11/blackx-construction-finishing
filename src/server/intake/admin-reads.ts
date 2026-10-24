/**
 * Staff intake reads — GET /api/v1/admin/requests[/{id}] and
 * /admin/contact-messages[/{id}] (contract §3.3–§3.4, READ persistence:
 * these append no audit/outbox/business writes, §1.10).
 *
 * Authorization is enforced at the route boundary (existing owner
 * session only — see admin-http.ts). The provisional §1.3 staff role
 * sets and every §3.11 resource predicate remain TBD-PO-03: until the
 * owner approves the matrix, nothing here grants blanket "STAFF"
 * access, and no mutation endpoint exists. Detail DTO omissions
 * (workflow/context) belong to aggregates that do not exist yet and
 * will be added additively when those slices land (§2.4).
 */

import {
  IntakeError,
  type AuditEntry,
  type ConsentRecord,
  type ContactMessageRecord,
  type IntakePorts,
  type IntakeRequestRecord,
  type OutboxIntent,
  type Page,
  type RequestHistoryEntry,
} from "./ports";
import type { IntakeAllowlists } from "./validation";

export interface RequestSummaryDTO {
  id: string;
  reference: string;
  customerId: string | null;
  /** Linked customer name when present, else the submitted name (§2.4). */
  customerName: string;
  serviceSlug: string;
  city: string;
  submittedAt: string;
  status: string;
  priority: string;
  assigneeId: string | null;
  version: number;
}

export interface RequestDetailDTO extends RequestSummaryDTO {
  phoneE164: string;
  email?: string;
  areaM2?: number;
  unitType?: string;
  description: string;
  consent: ConsentRecord;
  history: RequestHistoryEntry[];
}

export type ContactMessageDTO = ContactMessageRecord;

/** AuditLogDTO (§2.7): actor/entity projections, reference-only metadata. */
export interface AuditLogDTO {
  id: string;
  at: string;
  actor: { kind: "public" };
  action: string;
  entity: { type: string; id: string; reference: string };
}

/** NotificationDTO (§2.7 slice): no params/idempotencyKey/phone exposure. */
export interface NotificationDTO {
  id: string;
  eventType: string;
  channel: string;
  recipient: { kind: "staff" | "customer" };
  templateKey: string;
  related: { entityType: string; entityId: string; reference: string };
  status: string;
  /** No worker exists yet (TECH-06), so queued rows have attempted 0 times. */
  attempts: number;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * OverviewDTO (§2.7) — intake-only honest slice. Metric/queue vocabulary
 * freezes at overview kickoff; actionQueue derivation (due dates, labels)
 * is deliberately not invented here, so it is empty until that work lands.
 */
export interface OverviewDTO {
  generatedAt: string;
  metrics: Record<string, number>;
  actionQueue: never[];
  recentActivity: AuditLogDTO[];
  operationalFlow: { stage: string; count: number }[];
}

const NOTIFICATION_STATUSES = new Set([
  "queued",
  "sending",
  "sent",
  "delivered",
  "read",
  "failed",
  "dead",
]);
const NOTIFICATION_CHANNELS = new Set(["whatsapp", "email"]);
/** Outbox event catalog as stored today (final catalog is TBD-PO-01). */
const NOTIFICATION_EVENT_TYPES = new Set(["staff_alert", "customer_confirmation"]);
const INTAKE_ENTITY_TYPES = new Set(["request", "contact_message"]);

/** §4.1 request lifecycle vocabulary (filter validation only). */
const REQUEST_STATUSES = new Set([
  "new",
  "contacted",
  "inspection_scheduled",
  "inspection_done",
  "quotation_sent",
  "approved",
  "on_hold",
  "cancelled",
]);

const MAX_SEARCH_LENGTH = 200;

function invalidQuery(): IntakeError {
  return new IntakeError("INVALID_QUERY");
}

function parsePageParams(
  params: URLSearchParams,
  allowedKeys: ReadonlySet<string>,
  sortField: "submittedAt" | "receivedAt" | "at" | "createdAt",
): { page: number; pageSize: number; direction: "asc" | "desc" } {
  for (const key of new Set(params.keys())) {
    if (!allowedKeys.has(key)) throw invalidQuery();
  }
  const parseIntParam = (name: string, fallback: number): number => {
    const raw = params.get(name);
    if (raw === null) return fallback;
    if (!/^\d+$/.test(raw)) throw invalidQuery();
    return Number(raw);
  };
  const page = parseIntParam("page", 1);
  const pageSize = parseIntParam("pageSize", 20);
  if (page < 1 || pageSize < 1 || pageSize > 100) throw invalidQuery();

  const sort = params.get("sort") ?? `-${sortField}`;
  if (sort !== sortField && sort !== `-${sortField}`) throw invalidQuery();
  return { page, pageSize, direction: sort.startsWith("-") ? "desc" : "asc" };
}

function parseSearch(params: URLSearchParams): string | undefined {
  const raw = params.get("search");
  if (raw === null || raw === "") return undefined;
  if (raw.length > MAX_SEARCH_LENGTH) throw invalidQuery();
  return raw;
}

function toRequestSummary(record: IntakeRequestRecord): RequestSummaryDTO {
  return {
    id: record.id,
    reference: record.reference,
    customerId: record.customerId,
    customerName: record.fullName,
    serviceSlug: record.serviceSlug,
    city: record.city,
    submittedAt: record.submittedAt,
    status: record.status,
    priority: record.priority,
    assigneeId: record.assigneeId,
    version: record.version,
  };
}

function parseDateRange(params: URLSearchParams): { from?: string; to?: string } {
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  for (const bound of [from, to]) {
    if (bound !== undefined && !Number.isFinite(Date.parse(bound))) throw invalidQuery();
  }
  if (from !== undefined && to !== undefined && Date.parse(from) > Date.parse(to)) {
    throw invalidQuery();
  }
  return {
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to } : {}),
  };
}

function toAuditLogDTO(entry: AuditEntry): AuditLogDTO {
  return {
    id: entry.id,
    at: entry.at,
    actor: { kind: entry.actorKind },
    action: entry.event,
    entity: { type: entry.entityType, id: entry.entityId, reference: entry.reference },
  };
}

function toNotificationDTO(row: OutboxIntent): NotificationDTO {
  return {
    id: row.id,
    eventType: row.eventType,
    channel: row.channel,
    // Stored "submitter" projects to the DTO's customer side (§2.7);
    // no userId/customerId exists to expose at intake time.
    recipient: { kind: row.recipientKind === "staff" ? "staff" : "customer" },
    templateKey: row.templateKey,
    related: {
      entityType: row.entityType,
      entityId: row.entityId,
      reference: row.params.reference,
    },
    status: row.status,
    attempts: 0,
    createdAt: row.createdAt,
    updatedAt: row.createdAt,
    version: 1,
  };
}

export function createAdminIntakeReads(ports: IntakePorts, allowlists: IntakeAllowlists) {
  async function listRequests(params: URLSearchParams): Promise<Page<RequestSummaryDTO>> {
    const { page, pageSize, direction } = parsePageParams(
      params,
      new Set(["page", "pageSize", "sort", "status", "serviceSlug", "assigneeId", "search"]),
      "submittedAt",
    );
    const status = params.get("status") ?? undefined;
    if (status !== undefined && !REQUEST_STATUSES.has(status)) throw invalidQuery();
    const serviceSlug = params.get("serviceSlug") ?? undefined;
    if (serviceSlug !== undefined && !allowlists.serviceSlugs.has(serviceSlug)) {
      throw invalidQuery();
    }
    const assigneeId = params.get("assigneeId") ?? undefined;
    if (assigneeId !== undefined && assigneeId.trim() === "") throw invalidQuery();
    const result = await ports.repositories.requests.list({
      page,
      pageSize,
      direction,
      ...(status !== undefined ? { status } : {}),
      ...(serviceSlug !== undefined ? { serviceSlug } : {}),
      ...(assigneeId !== undefined ? { assigneeId } : {}),
      ...(parseSearch(params) !== undefined ? { search: parseSearch(params) } : {}),
    });
    return { ...result, items: result.items.map(toRequestSummary) };
  }

  async function getRequest(id: string): Promise<RequestDetailDTO> {
    const found = await ports.repositories.requests.byId(id);
    if (!found) throw new IntakeError("NOT_FOUND");
    const { record, history } = found;
    return {
      ...toRequestSummary(record),
      phoneE164: record.phoneE164,
      ...(record.email !== undefined ? { email: record.email } : {}),
      ...(record.areaM2 !== undefined ? { areaM2: record.areaM2 } : {}),
      ...(record.unitType !== undefined ? { unitType: record.unitType } : {}),
      description: record.description,
      consent: record.consent,
      history,
    };
  }

  async function listContactMessages(params: URLSearchParams): Promise<Page<ContactMessageDTO>> {
    const { page, pageSize, direction } = parsePageParams(
      params,
      new Set(["page", "pageSize", "sort", "subject", "from", "to", "search"]),
      "receivedAt",
    );
    const subject = params.get("subject") ?? undefined;
    if (subject !== undefined && !allowlists.subjects.has(subject)) throw invalidQuery();
    const { from, to } = parseDateRange(params);
    return ports.repositories.contactMessages.list({
      page,
      pageSize,
      direction,
      ...(subject !== undefined ? { subject } : {}),
      ...(from !== undefined ? { from } : {}),
      ...(to !== undefined ? { to } : {}),
      ...(parseSearch(params) !== undefined ? { search: parseSearch(params) } : {}),
    });
  }

  async function getContactMessage(id: string): Promise<ContactMessageDTO> {
    const found = await ports.repositories.contactMessages.byId(id);
    if (!found) throw new IntakeError("NOT_FOUND");
    return found;
  }

  async function listAuditLogs(params: URLSearchParams): Promise<Page<AuditLogDTO>> {
    const { page, pageSize, direction } = parsePageParams(
      params,
      new Set([
        "page",
        "pageSize",
        "sort",
        "actorId",
        "action",
        "entityType",
        "entityId",
        "from",
        "to",
      ]),
      "at",
    );
    const actorId = params.get("actorId") ?? undefined;
    if (actorId !== undefined && actorId.trim() === "") throw invalidQuery();
    const action = params.get("action") ?? undefined;
    if (action !== undefined && (action.trim() === "" || action.length > 100)) {
      throw invalidQuery();
    }
    const entityType = params.get("entityType") ?? undefined;
    if (entityType !== undefined && !INTAKE_ENTITY_TYPES.has(entityType)) throw invalidQuery();
    const entityId = params.get("entityId") ?? undefined;
    if (entityId !== undefined && entityId.trim() === "") throw invalidQuery();
    const result = await ports.repositories.audit.query({
      page,
      pageSize,
      direction,
      ...(actorId !== undefined ? { actorId } : {}),
      ...(action !== undefined ? { action } : {}),
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
      ...parseDateRange(params),
    });
    return { ...result, items: result.items.map(toAuditLogDTO) };
  }

  async function listNotifications(params: URLSearchParams): Promise<Page<NotificationDTO>> {
    const { page, pageSize, direction } = parsePageParams(
      params,
      new Set([
        "page",
        "pageSize",
        "sort",
        "status",
        "channel",
        "eventType",
        "entityType",
        "entityId",
      ]),
      "createdAt",
    );
    const status = params.get("status") ?? undefined;
    if (status !== undefined && !NOTIFICATION_STATUSES.has(status)) throw invalidQuery();
    const channel = params.get("channel") ?? undefined;
    if (channel !== undefined && !NOTIFICATION_CHANNELS.has(channel)) throw invalidQuery();
    const eventType = params.get("eventType") ?? undefined;
    if (eventType !== undefined && !NOTIFICATION_EVENT_TYPES.has(eventType)) throw invalidQuery();
    const entityType = params.get("entityType") ?? undefined;
    if (entityType !== undefined && !INTAKE_ENTITY_TYPES.has(entityType)) throw invalidQuery();
    const entityId = params.get("entityId") ?? undefined;
    if (entityId !== undefined && entityId.trim() === "") throw invalidQuery();
    const result = await ports.repositories.outbox.list({
      page,
      pageSize,
      direction,
      ...(status !== undefined ? { status } : {}),
      ...(channel !== undefined ? { channel } : {}),
      ...(eventType !== undefined ? { eventType } : {}),
      ...(entityType !== undefined ? { entityType } : {}),
      ...(entityId !== undefined ? { entityId } : {}),
    });
    return { ...result, items: result.items.map(toNotificationDTO) };
  }

  async function getOverview(): Promise<OverviewDTO> {
    const probe = { page: 1, pageSize: 1, direction: "desc" as const };
    const [newRequests, allRequests, allContacts, queued, recent] = await Promise.all([
      ports.repositories.requests.list({ ...probe, status: "new" }),
      ports.repositories.requests.list(probe),
      ports.repositories.contactMessages.list(probe),
      ports.repositories.outbox.list({ ...probe, status: "queued" }),
      ports.repositories.audit.query({ page: 1, pageSize: 10, direction: "desc" }),
    ]);
    return {
      generatedAt: ports.clock.now(),
      metrics: {
        requestsNew: newRequests.total,
        requestsTotal: allRequests.total,
        contactMessagesTotal: allContacts.total,
        notificationsQueued: queued.total,
      },
      actionQueue: [],
      recentActivity: recent.items.map(toAuditLogDTO),
      operationalFlow: [{ stage: "new", count: newRequests.total }],
    };
  }

  return {
    listRequests,
    getRequest,
    listContactMessages,
    getContactMessage,
    listAuditLogs,
    listNotifications,
    getOverview,
  };
}

export type AdminIntakeReads = ReturnType<typeof createAdminIntakeReads>;
