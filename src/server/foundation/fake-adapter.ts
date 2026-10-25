/**
 * Governed in-memory fake adapter for the foundation ports — the
 * reference implementation of the required *observable behavior*
 * (contract §5.4–§5.5), exactly like the intake fake. DEVELOPMENT AND
 * TESTS ONLY: `runtime.ts` refuses it in production. State is
 * per-process and lost on restart; it contains no business rules
 * (rules live in services). The database colleague's real adapter must
 * pass the same contract suite against a disposable test database —
 * fake-green alone is never integration evidence.
 *
 * Observable semantics implemented here (asserted by the contract
 * suite): workspace scoping on every operation; deterministic ordering
 * (sort field + `id` tiebreak); §1.6 pagination; folded text search
 * (case + Arabic-Indic/Persian digits; phone fields also match pasted
 * formatted numbers); version-checked updates; snapshot-transaction
 * UnitOfWork with read-your-own-writes and full rollback on throw —
 * including the idempotency completion, so a committed effect and its
 * replay record cannot diverge.
 *
 * Known fake limitations (real-adapter suite must cover): no cross-
 * process sharing, no true transaction isolation under concurrency, no
 * durability/backup. See docs/database-integration-contract.md.
 */

import { foldSearchText, normalizePhone } from "@/server/intake/validation";
import { VersionConflictError } from "./errors";
import type {
  AuditEventQuery,
  AuditEventRecord,
  BaseListQuery,
  BaseRecord,
  Clock,
  ComplaintRecord,
  ContractRecord,
  CustomerRecord,
  DiaryEntryRecord,
  DocumentRecord,
  DueRecord,
  FindingRecord,
  FoundationPorts,
  FoundationRepositories,
  GenericClaimResult,
  HandoverRecord,
  IdGenerator,
  IdempotencyClaimRef,
  InspectionRecord,
  MilestoneRecord,
  Page,
  PaymentRecord,
  ProgressMeasurementRecord,
  ProjectRecord,
  PurchaseRecord,
  QuotationRecord,
  SupplierRecord,
  UserRecord,
  VersionedRecord,
  WarrantyRequestRecord,
  WeeklyReportRecord,
} from "./ports";

interface IdempotencyRecord {
  payloadHash: string;
  state: "in_progress" | "completed";
  leaseUntilMs: number;
  httpStatus?: number;
  resourceKind?: string;
  resourceId?: string;
  expiresAtMs?: number;
}

interface FakeState {
  users: Map<string, UserRecord>;
  customers: Map<string, CustomerRecord>;
  projects: Map<string, ProjectRecord>;
  milestones: Map<string, MilestoneRecord>;
  diary: Map<string, DiaryEntryRecord>;
  progress: Map<string, ProgressMeasurementRecord>;
  findings: Map<string, FindingRecord>;
  reports: Map<string, WeeklyReportRecord>;
  inspections: Map<string, InspectionRecord>;
  quotations: Map<string, QuotationRecord>;
  contracts: Map<string, ContractRecord>;
  handovers: Map<string, HandoverRecord>;
  warrantyRequests: Map<string, WarrantyRequestRecord>;
  documents: Map<string, DocumentRecord>;
  dues: Map<string, DueRecord>;
  payments: Map<string, PaymentRecord>;
  suppliers: Map<string, SupplierRecord>;
  purchases: Map<string, PurchaseRecord>;
  complaints: Map<string, ComplaintRecord>;
  auditEvents: AuditEventRecord[];
  sequences: Map<string, number>;
  idempotency: Map<string, IdempotencyRecord>;
}

function emptyState(): FakeState {
  return {
    users: new Map(),
    customers: new Map(),
    projects: new Map(),
    milestones: new Map(),
    diary: new Map(),
    progress: new Map(),
    findings: new Map(),
    reports: new Map(),
    inspections: new Map(),
    quotations: new Map(),
    contracts: new Map(),
    handovers: new Map(),
    warrantyRequests: new Map(),
    documents: new Map(),
    dues: new Map(),
    payments: new Map(),
    suppliers: new Map(),
    purchases: new Map(),
    complaints: new Map(),
    auditEvents: [],
    sequences: new Map(),
    idempotency: new Map(),
  };
}

/** Provisional reference prefixes (final formats TBD-PO-11; fake-only). */
const REFERENCE_PREFIXES: Record<string, string> = {
  customer: "CU",
  project: "PR",
  finding: "FD",
  inspection: "IN",
  quotation: "QT",
  contract: "CT",
  warranty: "WR",
  supplier: "SU",
  purchase: "PU",
  complaint: "CMP",
};

const IDEMPOTENCY_LEASE_MS = 30_000;

function localizedValues(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    return [record.ar, record.en].filter((item): item is string => typeof item === "string");
  }
  return [];
}

interface CollectionSpec<TRecord extends BaseRecord, TQuery extends BaseListQuery> {
  /** Plain text fields searched with folded substring matching. */
  searchText: (record: TRecord) => string[];
  /** Phone fields: also matched separator-free against a folded query. */
  searchPhones?: (record: TRecord) => string[];
  /** Endpoint filters beyond workspace/search/range (exact semantics). */
  matchesFilters: (record: TRecord, query: TQuery) => boolean;
  entityType: string;
}

function paginate<T>(rows: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize;
  return { items: rows.slice(start, start + pageSize), total: rows.length, page, pageSize };
}

function sortRows<TRecord extends BaseRecord>(
  rows: TRecord[],
  sortField: string,
  direction: "asc" | "desc",
): TRecord[] {
  const factor = direction === "desc" ? -1 : 1;
  return [...rows].sort((a, b) => {
    const av = String((a as Record<string, unknown>)[sortField] ?? "");
    const bv = String((b as Record<string, unknown>)[sortField] ?? "");
    if (av !== bv) return av < bv ? -factor : factor;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });
}

export interface FakeFoundationAdapter {
  ports: FoundationPorts;
  /** Test support: wipe all state (maps to the real adapter's test-DB reset). */
  reset(): void;
}

export function createFakeFoundationAdapter(deps?: {
  clock?: Clock;
  ids?: IdGenerator;
}): FakeFoundationAdapter {
  const clock: Clock = deps?.clock ?? { now: () => new Date().toISOString() };
  const ids: IdGenerator = deps?.ids ?? { newId: () => globalThis.crypto.randomUUID() };

  let committed = emptyState();
  let working: FakeState | null = null;
  const state = (): FakeState => working ?? committed;

  function makeCollection<TRecord extends VersionedRecord, TQuery extends BaseListQuery>(
    pick: (s: FakeState) => Map<string, TRecord>,
    spec: CollectionSpec<TRecord, TQuery>,
  ) {
    return {
      async create(record: TRecord): Promise<void> {
        pick(state()).set(record.id, structuredClone(record));
      },
      async byId(workspaceId: string, id: string): Promise<TRecord | null> {
        const found = pick(state()).get(id);
        if (!found || found.workspaceId !== workspaceId) return null;
        return structuredClone(found);
      },
      async list(query: TQuery): Promise<Page<TRecord>> {
        return listFrom(pick(state()), query, spec);
      },
      async update(record: TRecord, expectedVersion: number): Promise<void> {
        const store = pick(state());
        const existing = store.get(record.id);
        if (!existing || existing.workspaceId !== record.workspaceId) {
          throw new VersionConflictError(spec.entityType, record.id);
        }
        if (existing.version !== expectedVersion) {
          throw new VersionConflictError(spec.entityType, record.id);
        }
        store.set(record.id, structuredClone(record));
      },
      async count(workspaceId: string): Promise<number> {
        let total = 0;
        for (const record of pick(state()).values()) {
          if (record.workspaceId === workspaceId) total += 1;
        }
        return total;
      },
    };
  }

  function makeImmutableCollection<TRecord extends BaseRecord, TQuery extends BaseListQuery>(
    pick: (s: FakeState) => Map<string, TRecord>,
    spec: CollectionSpec<TRecord, TQuery>,
  ) {
    return {
      async create(record: TRecord): Promise<void> {
        pick(state()).set(record.id, structuredClone(record));
      },
      async byId(workspaceId: string, id: string): Promise<TRecord | null> {
        const found = pick(state()).get(id);
        if (!found || found.workspaceId !== workspaceId) return null;
        return structuredClone(found);
      },
      async list(query: TQuery): Promise<Page<TRecord>> {
        return listFrom(pick(state()), query, spec);
      },
      async count(workspaceId: string): Promise<number> {
        let total = 0;
        for (const record of pick(state()).values()) {
          if (record.workspaceId === workspaceId) total += 1;
        }
        return total;
      },
    };
  }

  function listFrom<TRecord extends BaseRecord, TQuery extends BaseListQuery>(
    store: Map<string, TRecord>,
    query: TQuery,
    spec: CollectionSpec<TRecord, TQuery>,
  ): Page<TRecord> {
    const foldedSearch = query.search !== undefined ? foldSearchText(query.search) : undefined;
    const foldedPhoneSearch =
      query.search !== undefined ? normalizePhone(foldSearchText(query.search)) : undefined;
    const rows: TRecord[] = [];
    for (const record of store.values()) {
      if (record.workspaceId !== query.workspaceId) continue;
      const sortValue = String((record as Record<string, unknown>)[query.sortField] ?? "");
      if (query.from !== undefined && sortValue < query.from) continue;
      if (query.to !== undefined && sortValue > query.to) continue;
      if (!spec.matchesFilters(record, query)) continue;
      if (foldedSearch !== undefined && foldedSearch !== "") {
        const textHit = spec
          .searchText(record)
          .some((value) => foldSearchText(value).includes(foldedSearch));
        const phoneHit =
          foldedPhoneSearch !== undefined &&
          foldedPhoneSearch !== "" &&
          (spec.searchPhones?.(record) ?? []).some((value) =>
            normalizePhone(foldSearchText(value)).includes(foldedPhoneSearch),
          );
        if (!textHit && !phoneHit) continue;
      }
      rows.push(record);
    }
    const sorted = sortRows(rows, query.sortField, query.direction);
    const page = paginate(sorted, query.page, query.pageSize);
    return { ...page, items: page.items.map((item) => structuredClone(item)) };
  }

  const eq =
    <TRecord, TQuery>(
      pickValue: (q: TQuery) => string | undefined,
      pickRecord: (r: TRecord) => string | undefined,
    ) =>
    (record: TRecord, query: TQuery): boolean => {
      const wanted = pickValue(query);
      return wanted === undefined || pickRecord(record) === wanted;
    };
  const all =
    <TRecord, TQuery>(...checks: Array<(r: TRecord, q: TQuery) => boolean>) =>
    (record: TRecord, query: TQuery): boolean =>
      checks.every((check) => check(record, query));

  const repositories: FoundationRepositories = {
    users: {
      ...makeCollection((s) => s.users, {
        entityType: "user",
        searchText: (r) => [r.displayName, r.email],
        searchPhones: (r) => (r.phoneE164 ? [r.phoneE164] : []),
        matchesFilters: all<UserRecord, BaseListQuery & { role?: string; status?: string }>(
          eq(
            (q) => q.role,
            (r) => r.role,
          ),
          eq(
            (q) => q.status,
            (r) => r.status,
          ),
        ),
      }),
      async byEmail(workspaceId: string, email: string): Promise<UserRecord | null> {
        for (const record of state().users.values()) {
          if (record.workspaceId === workspaceId && record.email === email) {
            return structuredClone(record);
          }
        }
        return null;
      },
    },
    customers: {
      ...makeCollection((s) => s.customers, {
        entityType: "customer",
        searchText: (r) => [r.name, r.reference, r.email ?? "", r.city ?? ""],
        searchPhones: (r) => [r.phoneE164],
        matchesFilters: () => true,
      }),
      async byPhone(workspaceId: string, phoneE164: string): Promise<CustomerRecord[]> {
        const matches: CustomerRecord[] = [];
        for (const record of state().customers.values()) {
          if (record.workspaceId === workspaceId && record.phoneE164 === phoneE164) {
            matches.push(structuredClone(record));
          }
        }
        return matches;
      },
    },
    projects: makeCollection((s) => s.projects, {
      entityType: "project",
      searchText: (r) => [r.reference, ...localizedValues(r.title)],
      matchesFilters: all<
        ProjectRecord,
        BaseListQuery & { customerId?: string; status?: string; serviceSlug?: string }
      >(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
        eq(
          (q) => q.serviceSlug,
          (r) => r.serviceSlug,
        ),
      ),
    }),
    milestones: makeCollection((s) => s.milestones, {
      entityType: "milestone",
      searchText: (r) => [...localizedValues(r.title)],
      matchesFilters: all<MilestoneRecord, BaseListQuery & { projectId: string; status?: string }>(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
      ),
    }),
    diary: makeImmutableCollection((s) => s.diary, {
      entityType: "diary_entry",
      searchText: (r) => [r.title],
      matchesFilters: eq<DiaryEntryRecord, BaseListQuery & { projectId: string }>(
        (q) => q.projectId,
        (r) => r.projectId,
      ),
    }),
    progress: makeImmutableCollection((s) => s.progress, {
      entityType: "progress_measurement",
      searchText: () => [],
      matchesFilters: all<
        ProgressMeasurementRecord,
        BaseListQuery & { projectId: string; milestoneId?: string }
      >(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.milestoneId,
          (r) => r.milestoneId,
        ),
      ),
    }),
    findings: makeCollection((s) => s.findings, {
      entityType: "finding",
      searchText: (r) => [r.reference, r.title],
      matchesFilters: all<
        FindingRecord,
        BaseListQuery & { projectId?: string; kind?: string; status?: string; assigneeId?: string }
      >(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.kind,
          (r) => r.kind,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
        eq(
          (q) => q.assigneeId,
          (r) => r.assigneeId,
        ),
      ),
    }),
    reports: makeCollection((s) => s.reports, {
      entityType: "weekly_report",
      searchText: (r) => [r.title],
      matchesFilters: all<
        WeeklyReportRecord,
        BaseListQuery & { projectId?: string; status?: string }
      >(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
      ),
    }),
    inspections: makeCollection((s) => s.inspections, {
      entityType: "inspection",
      searchText: (r) => [r.reference],
      matchesFilters: all<
        InspectionRecord,
        BaseListQuery & { requestId?: string; engineerId?: string; status?: string }
      >(
        eq(
          (q) => q.requestId,
          (r) => r.requestId,
        ),
        eq(
          (q) => q.engineerId,
          (r) => r.engineerId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
      ),
    }),
    quotations: makeCollection((s) => s.quotations, {
      entityType: "quotation",
      searchText: (r) => [r.reference, r.revisions.at(-1)?.title ?? ""],
      matchesFilters: all<
        QuotationRecord,
        BaseListQuery & { customerId?: string; requestId?: string }
      >(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.requestId,
          (r) => r.requestId,
        ),
      ),
    }),
    contracts: makeCollection((s) => s.contracts, {
      entityType: "contract",
      searchText: (r) => [r.reference],
      matchesFilters: all<
        ContractRecord,
        BaseListQuery & { customerId?: string; status?: string; projectId?: string }
      >(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
      ),
    }),
    handovers: makeCollection((s) => s.handovers, {
      entityType: "handover",
      searchText: () => [],
      matchesFilters: all<HandoverRecord, BaseListQuery & { projectId?: string; status?: string }>(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
      ),
    }),
    warrantyRequests: makeCollection((s) => s.warrantyRequests, {
      entityType: "warranty_request",
      searchText: (r) => [r.reference, r.title],
      matchesFilters: all<
        WarrantyRequestRecord,
        BaseListQuery & { projectId?: string; status?: string; assigneeId?: string }
      >(
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
        eq(
          (q) => q.assigneeId,
          (r) => r.assigneeId,
        ),
      ),
    }),
    documents: makeCollection((s) => s.documents, {
      entityType: "document",
      searchText: (r) => [r.title],
      matchesFilters: (r, q) => {
        const query = q as typeof q & {
          entityType?: string;
          entityId?: string;
          docType?: string;
          visibleToCustomer?: boolean;
        };
        if (query.entityType !== undefined && r.owner.entityType !== query.entityType) return false;
        if (query.entityId !== undefined && r.owner.entityId !== query.entityId) return false;
        if (query.docType !== undefined && r.docType !== query.docType) return false;
        if (
          query.visibleToCustomer !== undefined &&
          r.visibleToCustomer !== query.visibleToCustomer
        )
          return false;
        return true;
      },
    }),
    dues: makeCollection((s) => s.dues, {
      entityType: "due",
      searchText: (r) => [...localizedValues(r.label)],
      matchesFilters: all<DueRecord, BaseListQuery & { customerId?: string; projectId?: string }>(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
      ),
    }),
    payments: makeCollection((s) => s.payments, {
      entityType: "payment",
      searchText: () => [],
      matchesFilters: all<
        PaymentRecord,
        BaseListQuery & { customerId?: string; projectId?: string; method?: string }
      >(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.method,
          (r) => r.method,
        ),
      ),
    }),
    suppliers: makeCollection((s) => s.suppliers, {
      entityType: "supplier",
      searchText: (r) => [r.reference, ...localizedValues(r.name)],
      searchPhones: (r) => (r.phoneE164 ? [r.phoneE164] : []),
      matchesFilters: () => true,
    }),
    purchases: makeCollection((s) => s.purchases, {
      entityType: "purchase",
      searchText: (r) => [r.reference, r.supplierInvoiceRef],
      matchesFilters: all<
        PurchaseRecord,
        BaseListQuery & { supplierId?: string; projectId?: string }
      >(
        eq(
          (q) => q.supplierId,
          (r) => r.supplierId,
        ),
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
      ),
    }),
    complaints: makeCollection((s) => s.complaints, {
      entityType: "complaint",
      searchText: (r) => [r.reference, r.title],
      matchesFilters: all<
        ComplaintRecord,
        BaseListQuery & { customerId?: string; projectId?: string; status?: string; kind?: string }
      >(
        eq(
          (q) => q.customerId,
          (r) => r.customerId,
        ),
        eq(
          (q) => q.projectId,
          (r) => r.projectId,
        ),
        eq(
          (q) => q.status,
          (r) => r.status,
        ),
        eq(
          (q) => q.kind,
          (r) => r.kind,
        ),
      ),
    }),
    auditEvents: {
      async append(entry: AuditEventRecord): Promise<void> {
        state().auditEvents.push(structuredClone(entry));
      },
      async query(query: AuditEventQuery): Promise<Page<AuditEventRecord>> {
        const rows = state().auditEvents.filter((entry) => {
          if (entry.workspaceId !== query.workspaceId) return false;
          if (query.actorId !== undefined && entry.actor.userId !== query.actorId) return false;
          if (query.action !== undefined && entry.action !== query.action) return false;
          if (query.entityType !== undefined && entry.entity.type !== query.entityType)
            return false;
          if (query.entityId !== undefined && entry.entity.id !== query.entityId) return false;
          if (query.from !== undefined && entry.at < query.from) return false;
          if (query.to !== undefined && entry.at > query.to) return false;
          return true;
        });
        const factor = query.direction === "desc" ? -1 : 1;
        rows.sort((a, b) => {
          if (a.at !== b.at) return a.at < b.at ? -factor : factor;
          return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
        });
        const page = paginate(rows, query.page, query.pageSize);
        return { ...page, items: page.items.map((item) => structuredClone(item)) };
      },
    },
    references: {
      async next(kind: string): Promise<string> {
        const sequences = state().sequences;
        const nextValue = (sequences.get(kind) ?? 0) + 1;
        sequences.set(kind, nextValue);
        const prefix = REFERENCE_PREFIXES[kind] ?? "REF";
        return `${prefix}-${String(nextValue).padStart(6, "0")}`;
      },
    },
  };

  const claimKey = (scope: string, method: string, routeTemplate: string, key: string): string =>
    `${scope}|${method}|${routeTemplate}|${key}`;

  const ports: FoundationPorts = {
    unitOfWork: {
      async run<T>(work: (repos: FoundationRepositories) => Promise<T>): Promise<T> {
        if (working !== null) {
          // Nested run joins the outer transaction (fake simplification).
          return work(repositories);
        }
        working = structuredClone(committed);
        try {
          const result = await work(repositories);
          committed = working;
          return result;
        } finally {
          working = null;
        }
      },
    },
    repositories,
    idempotency: {
      async claim(
        scope: string,
        method: string,
        routeTemplate: string,
        key: string,
        payloadHash: string,
      ): Promise<GenericClaimResult> {
        const store = state().idempotency;
        const mapKey = claimKey(scope, method, routeTemplate, key);
        const nowMs = Date.parse(clock.now());
        const existing = store.get(mapKey);
        if (existing) {
          const expired =
            existing.state === "completed" &&
            existing.expiresAtMs !== undefined &&
            nowMs > existing.expiresAtMs;
          const leaseExpired = existing.state === "in_progress" && nowMs > existing.leaseUntilMs;
          if (!expired && !leaseExpired) {
            if (existing.payloadHash !== payloadHash) return { kind: "payload_mismatch" };
            if (existing.state === "completed") {
              return {
                kind: "completed",
                httpStatus: existing.httpStatus ?? 200,
                resourceKind: existing.resourceKind ?? "",
                resourceId: existing.resourceId ?? "",
              };
            }
            return { kind: "in_progress", retryAfterSec: 5 };
          }
        }
        store.set(mapKey, {
          payloadHash,
          state: "in_progress",
          leaseUntilMs: nowMs + IDEMPOTENCY_LEASE_MS,
        });
        return { kind: "claimed", claim: { scope, method, routeTemplate, key } };
      },
      async complete(
        claim: IdempotencyClaimRef,
        httpStatus: number,
        resourceKind: string,
        resourceId: string,
        expiresAt: string,
      ): Promise<void> {
        const store = state().idempotency;
        const mapKey = claimKey(claim.scope, claim.method, claim.routeTemplate, claim.key);
        const existing = store.get(mapKey);
        if (!existing) return;
        store.set(mapKey, {
          ...existing,
          state: "completed",
          httpStatus,
          resourceKind,
          resourceId,
          expiresAtMs: Date.parse(expiresAt),
        });
      },
      async releaseRetryable(claim: IdempotencyClaimRef): Promise<void> {
        const store = state().idempotency;
        const mapKey = claimKey(claim.scope, claim.method, claim.routeTemplate, claim.key);
        const existing = store.get(mapKey);
        if (existing && existing.state === "in_progress") store.delete(mapKey);
      },
    },
    clock,
    ids,
  };

  return {
    ports,
    reset() {
      committed = emptyState();
      working = null;
    },
  };
}
