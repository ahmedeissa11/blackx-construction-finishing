/**
 * Backend foundation — stored records and repository ports for every
 * business domain. This is the database-independent boundary the
 * database colleague implements behind (contract §5): ports exchange
 * the record shapes below only — never ORM entities, never vendor query
 * syntax — so any engine (relational or document) can sit underneath
 * without touching services or routes. Nothing here chooses a database,
 * ORM, physical schema, or migration approach; those are the
 * colleague's (TBD-DB-01…10). Adapter conformance is behavioral and is
 * tested by `tests/contract/foundation-ports.contract.test.ts`.
 *
 * Conventions (contract §1.4–§1.5, §5.2):
 * - Every record carries `workspaceId` (company scoping). Repository
 *   methods ALWAYS take/apply the workspace; a record in another
 *   workspace is indistinguishable from a missing one.
 * - `id` is opaque, server-generated, non-sequential (format TBD-DB-04).
 *   `reference` is the human code, unique per entity kind, minted via
 *   `ReferenceSequence` (format TBD-PO-11).
 * - Timestamps are ISO-8601 UTC strings; dates are `YYYY-MM-DD`. The
 *   server is the only clock authority for created/updated/recorded
 *   times. Money is integer minor units + `currency` (ISO 4217).
 * - Mutable aggregates carry `version` starting at 1; `update` is
 *   version-checked and raises `VersionConflictError` on a stale
 *   expected version without applying partial writes.
 * - Immutable records (diary, progress, audit) expose no update/delete
 *   methods on their ports — by design, not omission.
 *
 * Wave-1 granularity note: contract §5.3 sketches richer workflow port
 * methods (e.g. `QuotationRepository.replaceUnsentRevision`). Those
 * land with their services once the gating owner decisions
 * (TBD-PO-03/04/05/12/13/18) are approved. Wave 1 standardizes on
 * aggregate-record repositories (`Repository<T>`) so the storage
 * boundary, workspace scoping, and conformance suite exist for every
 * domain today. Adding a port method later is a contract change
 * requiring suite updates (§5.3).
 */

import type { Clock, IdGenerator, Page, ReferenceSequence } from "@/server/intake/ports";
import type {
  ContractStatus,
  FindingKind,
  FindingStatus,
  InspectionStatus,
  LocalizedText,
  MilestoneStatus,
  PaymentMethod,
  Priority,
  ProjectStatus,
  RoleCode,
  UserStatus,
  WarrantyStatus,
  WeeklyReportStatus,
} from "@/lib/api-types";

export type { Clock, IdGenerator, Page, ReferenceSequence };

// ---------------------------------------------------------------------------
// Shared record bases and query shape
// ---------------------------------------------------------------------------

export interface BaseRecord {
  id: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface VersionedRecord extends BaseRecord {
  version: number;
}

/** Every list query: workspace-scoped, §1.6 page/sort/search + typed filters. */
export interface BaseListQuery {
  workspaceId: string;
  page: number;
  pageSize: number;
  /** Field name on the record; adapters add `id` as the stable tiebreak. */
  sortField: string;
  direction: "asc" | "desc";
  search?: string;
  /** Inclusive ISO bounds applied to the sort timestamp field. */
  from?: string;
  to?: string;
}

/**
 * Aggregate repository. `create`/`update` receive complete records —
 * services own business rules and field derivation; adapters own
 * storage mapping only.
 */
export interface Repository<TRecord extends VersionedRecord, TQuery extends BaseListQuery> {
  create(record: TRecord): Promise<void>;
  byId(workspaceId: string, id: string): Promise<TRecord | null>;
  list(query: TQuery): Promise<Page<TRecord>>;
  /** Throws VersionConflictError when `expectedVersion` is stale. */
  update(record: TRecord, expectedVersion: number): Promise<void>;
  count(workspaceId: string): Promise<number>;
}

/** Immutable-record repository: no update/delete exist (contract §5.3). */
export interface ImmutableRepository<TRecord extends BaseRecord, TQuery extends BaseListQuery> {
  create(record: TRecord): Promise<void>;
  byId(workspaceId: string, id: string): Promise<TRecord | null>;
  list(query: TQuery): Promise<Page<TRecord>>;
  count(workspaceId: string): Promise<number>;
}

// ---------------------------------------------------------------------------
// Identity: users & roles (engineers are staff-role users, contract §1.3)
// ---------------------------------------------------------------------------

export interface UserRecord extends VersionedRecord {
  email: string;
  phoneE164?: string;
  displayName: string;
  role: RoleCode;
  status: UserStatus;
  customerId?: string;
  /**
   * Password hash (adapter-encoded). NEVER serialized into any DTO,
   * never logged. Absent for invited users until activation.
   */
  passwordHash?: string;
  lastLoginAt?: string;
}

export type UserListQuery = BaseListQuery & { role?: string; status?: string };

export interface UserRepository extends Repository<UserRecord, UserListQuery> {
  byEmail(workspaceId: string, email: string): Promise<UserRecord | null>;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface CustomerRecord extends VersionedRecord {
  reference: string;
  name: string;
  phoneE164: string;
  email?: string;
  city?: string;
  /** Server-managed only (TBD-PO-01); never settable through inputs. */
  whatsappConsent: { granted: boolean; at?: string; source?: string };
  portalUserIds: string[];
}

export type CustomerListQuery = BaseListQuery;

export interface CustomerRepository extends Repository<CustomerRecord, CustomerListQuery> {
  /**
   * Lookup support for the future explicit staff link workflow.
   * Duplicate policy (reject vs. allow) is TBD-PO-12 — this lookup must
   * never be used to silently merge or auto-link customers.
   */
  byPhone(workspaceId: string, phoneE164: string): Promise<CustomerRecord[]>;
}

// ---------------------------------------------------------------------------
// Projects & operations
// ---------------------------------------------------------------------------

export interface ProjectRecord extends VersionedRecord {
  reference: string;
  title: LocalizedText;
  customerId: string;
  contractId: string;
  quotationId?: string;
  serviceSlug: string;
  status: ProjectStatus;
  cancellationNote?: string;
}

export type ProjectListQuery = BaseListQuery & {
  customerId?: string;
  status?: string;
  serviceSlug?: string;
};

export type ProjectRepository = Repository<ProjectRecord, ProjectListQuery>;

export interface MilestoneRecord extends VersionedRecord {
  projectId: string;
  title: LocalizedText;
  detail?: string;
  status: MilestoneStatus;
  progressPercent: number;
  plannedDate: string;
  completedAt?: string;
}

export type MilestoneListQuery = BaseListQuery & { projectId: string; status?: string };
export type MilestoneRepository = Repository<MilestoneRecord, MilestoneListQuery>;

export interface DiaryEntryRecord extends BaseRecord {
  projectId: string;
  entryDate: string;
  title: string;
  body?: string;
  authorId: string;
  attachmentDocumentIds: string[];
}

export type DiaryListQuery = BaseListQuery & { projectId: string };
export type DiaryRepository = ImmutableRepository<DiaryEntryRecord, DiaryListQuery>;

export interface ProgressMeasurementRecord extends BaseRecord {
  projectId: string;
  milestoneId?: string;
  measuredPercent: number;
  measuredAt: string;
  recordedAt: string;
  measuredBy: string;
  note?: string;
}

export type ProgressListQuery = BaseListQuery & { projectId: string; milestoneId?: string };
export type ProgressRepository = ImmutableRepository<ProgressMeasurementRecord, ProgressListQuery>;

export interface FindingRecord extends VersionedRecord {
  reference: string;
  projectId: string;
  kind: FindingKind;
  source: "staff" | "portal";
  phase?: string;
  title: string;
  location?: string;
  detail: string;
  correctiveAction?: string;
  assigneeId?: string;
  severity: Priority;
  status: FindingStatus;
  reportedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export type FindingListQuery = BaseListQuery & {
  projectId?: string;
  kind?: string;
  status?: string;
  assigneeId?: string;
};
export type FindingRepository = Repository<FindingRecord, FindingListQuery>;

export interface WeeklyReportRecord extends VersionedRecord {
  projectId: string;
  weekStart: string;
  title: string;
  progressPercent?: number;
  status: WeeklyReportStatus;
  documentId?: string;
  publishedAt?: string;
}

export type ReportListQuery = BaseListQuery & { projectId?: string; status?: string };
export type ReportRepository = Repository<WeeklyReportRecord, ReportListQuery>;

// ---------------------------------------------------------------------------
// Inspections (requests themselves live in the intake ports)
// ---------------------------------------------------------------------------

export interface InspectionRecord extends VersionedRecord {
  reference: string;
  requestId: string;
  customerId?: string | null;
  serviceSlug: string;
  scheduledAt: string;
  engineerId: string;
  status: InspectionStatus;
  result?: { notes: string; completedAt: string; completedBy: string };
}

export type InspectionListQuery = BaseListQuery & {
  requestId?: string;
  engineerId?: string;
  status?: string;
};
export type InspectionRepository = Repository<InspectionRecord, InspectionListQuery>;

// ---------------------------------------------------------------------------
// Quotations & BOQ (aggregate: revisions with priced items, contract §2.5).
// Whether the adapter stores revisions/items nested or as related rows
// is its own mapping decision; the port exchanges the aggregate.
// ---------------------------------------------------------------------------

export interface QuotationItemRecord {
  id: string;
  description: string;
  unit: string;
  quantity: number;
  unitPriceMinor: number;
  /** Server-computed at write time; adapters store, never recompute differently. */
  lineTotalMinor: number;
}

export interface QuotationRevisionRecord {
  revisionNo: number;
  title: string;
  items: QuotationItemRecord[];
  totals: { subtotalMinor: number; taxMinor?: number; totalMinor: number };
  validUntil?: string;
  internalReview: {
    status: "not_submitted" | "pending" | "approved" | "changes_requested" | "not_required";
    submittedBy?: string;
    submittedAt?: string;
    decidedBy?: string;
    decidedAt?: string;
    note?: string;
  };
  delivery: { status: "not_sent" | "sent"; sentAt?: string; sentBy?: string };
  customerDecision: null | {
    outcome: "approved" | "rejected";
    decidedAt: string;
    recordedAt: string;
    actorKind: "customer" | "recorded_by_staff";
    customerUserId?: string;
    recordedByUserId?: string;
    comment?: string;
  };
  createdBy: string;
  createdAt: string;
}

export interface QuotationRecord extends VersionedRecord {
  reference: string;
  requestId?: string;
  customerId: string;
  projectId?: string;
  currency: string;
  currentRevisionNo: number;
  revisions: QuotationRevisionRecord[];
}

export type QuotationListQuery = BaseListQuery & {
  customerId?: string;
  requestId?: string;
};
export type QuotationRepository = Repository<QuotationRecord, QuotationListQuery>;

// ---------------------------------------------------------------------------
// Contracts & change orders (aggregate, contract §2.5)
// ---------------------------------------------------------------------------

export interface ChangeOrderRecord {
  id: string;
  description: string;
  amountDeltaMinor: number;
  durationDeltaDays?: number;
  decisionStatus: "pending" | "approved" | "rejected";
  decision?: {
    outcome: "approved" | "rejected";
    actorId: string;
    actorKind: string;
    at: string;
    note?: string;
  };
  createdBy: string;
  createdAt: string;
  version: number;
}

export interface ContractRecord extends VersionedRecord {
  reference: string;
  quotationId: string;
  quotationRevisionNo: number;
  customerId: string;
  projectId?: string;
  type: string;
  /** Snapshot from the customer-approved quotation revision. */
  baseAmountMinor: number;
  currency: string;
  status: ContractStatus;
  issuedAt?: string;
  issuedBy?: string;
  issuedDocumentId?: string;
  signature?: {
    signedAt: string;
    signMethod: string;
    evidenceDocumentId?: string;
    recordedAt: string;
    recordedBy: string;
  };
  changeOrders: ChangeOrderRecord[];
}

export type ContractListQuery = BaseListQuery & {
  customerId?: string;
  status?: string;
  projectId?: string;
};
export type ContractRepository = Repository<ContractRecord, ContractListQuery>;

// ---------------------------------------------------------------------------
// Handover & warranty
// ---------------------------------------------------------------------------

export interface HandoverRecord extends VersionedRecord {
  projectId: string;
  scheduledAt?: string;
  checklist: Array<{
    id: string;
    label: string;
    mandatory: boolean;
    checked: boolean;
    checkedBy?: string;
    checkedAt?: string;
  }>;
  status: "pending" | "handed_over";
  handedOverAt?: string;
  acknowledgement?: { byUserId: string; at: string; method: string };
}

export type HandoverListQuery = BaseListQuery & { projectId?: string; status?: string };
export type HandoverRepository = Repository<HandoverRecord, HandoverListQuery>;

export interface WarrantyRequestRecord extends VersionedRecord {
  reference: string;
  projectId: string;
  source: "staff" | "portal";
  title: string;
  /** Original report text; staff must never append resolution text here. */
  detail: string;
  status: WarrantyStatus;
  visitScheduledAt?: string;
  assigneeId?: string;
  resolutionNote?: string;
  resolvedBy?: string;
  closedAt?: string;
}

export type WarrantyListQuery = BaseListQuery & {
  projectId?: string;
  status?: string;
  assigneeId?: string;
};
export type WarrantyRepository = Repository<WarrantyRequestRecord, WarrantyListQuery>;

// ---------------------------------------------------------------------------
// Documents & file metadata (bytes live behind a future FileStoragePort)
// ---------------------------------------------------------------------------

export interface DocumentVersionRecord {
  versionNo: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /**
   * Adapter-owned opaque storage reference. NEVER serialized into a
   * DTO, never a URL, never logged (contract §2.6/§3.7).
   */
  storageRef: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DocumentRecord extends VersionedRecord {
  owner: { entityType: string; entityId: string };
  title: string;
  docType: string;
  visibleToCustomer: boolean;
  currentVersionNo: number;
  versions: DocumentVersionRecord[];
}

export type DocumentListQuery = BaseListQuery & {
  entityType?: string;
  entityId?: string;
  docType?: string;
  visibleToCustomer?: boolean;
};
export type DocumentRepository = Repository<DocumentRecord, DocumentListQuery>;

// ---------------------------------------------------------------------------
// Finance — FOUNDATION-PROPOSED (not in api-contract v1). Records only;
// balances/totals/status are service read-models, never stored here.
// Write rules (allocation, settlement, approvals) need owner decisions.
// ---------------------------------------------------------------------------

export interface DueRecord extends VersionedRecord {
  customerId: string;
  projectId: string;
  label: LocalizedText;
  dueDate: string;
  amountMinor: number;
  currency: string;
}

export type DueListQuery = BaseListQuery & { customerId?: string; projectId?: string };
export type DueRepository = Repository<DueRecord, DueListQuery>;

export interface PaymentRecord extends VersionedRecord {
  customerId: string;
  projectId: string;
  paidAt: string;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  allocations: Array<{ dueId: string; amountMinor: number }>;
}

export type PaymentListQuery = BaseListQuery & {
  customerId?: string;
  projectId?: string;
  method?: string;
};
export type PaymentRepository = Repository<PaymentRecord, PaymentListQuery>;

export interface SupplierRecord extends VersionedRecord {
  reference: string;
  name: LocalizedText;
  category?: LocalizedText;
  phoneE164?: string;
  city?: LocalizedText;
}

export type SupplierListQuery = BaseListQuery;
export type SupplierRepository = Repository<SupplierRecord, SupplierListQuery>;

export interface PurchaseRecord extends VersionedRecord {
  reference: string;
  supplierId: string;
  projectId: string;
  date: string;
  supplierInvoiceRef: string;
  lines: Array<{
    label: LocalizedText;
    quantity: number;
    unit: LocalizedText;
    unitPriceMinor: number;
  }>;
  discountMinor: number;
  paidAmountMinor: number;
  currency: string;
}

export type PurchaseListQuery = BaseListQuery & {
  supplierId?: string;
  projectId?: string;
};
export type PurchaseRepository = Repository<PurchaseRecord, PurchaseListQuery>;

// ---------------------------------------------------------------------------
// Complaints & messages — FOUNDATION-PROPOSED (contact messages = intake).
// ---------------------------------------------------------------------------

export interface ComplaintRecord extends VersionedRecord {
  reference: string;
  kind: "complaint" | "suggestion";
  customerId: string;
  projectId?: string;
  category: string;
  title: string;
  detail: string;
  status: "open" | "in_progress" | "resolved";
  priority: "normal" | "high";
  assigneeId?: string | null;
  replies: Array<{
    id: string;
    visibility: "customer" | "internal";
    authorId: string;
    authorDisplayName?: string;
    at: string;
    text: string;
  }>;
  resolutionSummary?: string;
}

export type ComplaintListQuery = BaseListQuery & {
  customerId?: string;
  projectId?: string;
  status?: string;
  kind?: string;
};
export type ComplaintRepository = Repository<ComplaintRecord, ComplaintListQuery>;

// ---------------------------------------------------------------------------
// Audit events (append-only; foundation staff audit — the real adapter
// must unify storage with the intake audit trail, see integration
// contract; metadata is reference-only, never PII — SEC-08/09)
// ---------------------------------------------------------------------------

export interface AuditEventRecord {
  id: string;
  workspaceId: string;
  at: string;
  actor: { kind: "user" | "public" | "system" | "provider"; userId?: string; role?: string };
  action: string;
  entity: { type: string; id: string; reference?: string };
  correlationId?: string;
}

export interface AuditEventQuery {
  workspaceId: string;
  page: number;
  pageSize: number;
  direction: "asc" | "desc";
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export interface AuditEventRepository {
  /** Append-only: no update/delete methods exist on this port (SEC-09). */
  append(entry: AuditEventRecord): Promise<void>;
  query(query: AuditEventQuery): Promise<Page<AuditEventRecord>>;
}

// ---------------------------------------------------------------------------
// Generic idempotency for authenticated creates (contract §1.8).
// Mirrors the intake store's semantics, but the stored completion is a
// safe resource reference ({ httpStatus, resourceKind, resourceId })
// instead of an intake receipt. Payload hashes only — never raw bodies.
// ---------------------------------------------------------------------------

export interface IdempotencyClaimRef {
  scope: string;
  method: string;
  routeTemplate: string;
  key: string;
}

export type GenericClaimResult =
  | { kind: "claimed"; claim: IdempotencyClaimRef }
  | { kind: "completed"; httpStatus: number; resourceKind: string; resourceId: string }
  | { kind: "payload_mismatch" }
  | { kind: "in_progress"; retryAfterSec: number };

export interface GenericIdempotencyStore {
  claim(
    scope: string,
    method: string,
    routeTemplate: string,
    key: string,
    payloadHash: string,
  ): Promise<GenericClaimResult>;
  /** Must be consistent with the business commit (same transaction or equivalent). */
  complete(
    claim: IdempotencyClaimRef,
    httpStatus: number,
    resourceKind: string,
    resourceId: string,
    expiresAt: string,
  ): Promise<void>;
  releaseRetryable(claim: IdempotencyClaimRef): Promise<void>;
}

// ---------------------------------------------------------------------------
// Assembly: repositories + transaction boundary + adapter bundle
// ---------------------------------------------------------------------------

export interface FoundationRepositories {
  users: UserRepository;
  customers: CustomerRepository;
  projects: ProjectRepository;
  milestones: MilestoneRepository;
  diary: DiaryRepository;
  progress: ProgressRepository;
  findings: FindingRepository;
  reports: ReportRepository;
  inspections: InspectionRepository;
  quotations: QuotationRepository;
  contracts: ContractRepository;
  handovers: HandoverRepository;
  warrantyRequests: WarrantyRepository;
  documents: DocumentRepository;
  dues: DueRepository;
  payments: PaymentRepository;
  suppliers: SupplierRepository;
  purchases: PurchaseRepository;
  complaints: ComplaintRepository;
  auditEvents: AuditEventRepository;
  references: ReferenceSequence;
}

/**
 * Transaction boundary (contract §5.2): every repository write inside
 * `work` — business and audit rows included — commits or rolls back
 * atomically, with read-your-own-writes inside the transaction. The
 * mechanism (native transaction, isolation level) is the adapter
 * owner's (TBD-DB-05); this observable behavior is contractual.
 */
export interface FoundationUnitOfWork {
  run<T>(work: (repos: FoundationRepositories) => Promise<T>): Promise<T>;
}

/** Everything foundation services need, supplied by an adapter bundle. */
export interface FoundationPorts {
  unitOfWork: FoundationUnitOfWork;
  /** Read-side access outside a transaction. */
  repositories: FoundationRepositories;
  idempotency: GenericIdempotencyStore;
  clock: Clock;
  ids: IdGenerator;
}
