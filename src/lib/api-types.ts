/**
 * BLACK X business API — shared wire types (DTOs, inputs, envelopes).
 *
 * This module is the single TypeScript source for the `/api/v1` wire
 * shapes used by both the server (`src/server/foundation`) and the
 * browser-safe typed client (`src/lib/api-client.ts`). It contains types
 * only — no runtime code, no data, no secrets — so it is safe to import
 * from client components.
 *
 * Field sets follow `docs/api-contract-v1.md` §2 wherever that (proposed)
 * contract defines them. Domains the contract does not cover yet
 * (finance dues/payments/purchases/suppliers, complaints) are marked
 * "foundation-proposed": shapes derive from the existing preview
 * fixtures, money is integer minor units per contract §1.5, and the
 * shapes need a contract amendment before anyone treats them as frozen.
 *
 * `ro` in comments = server-owned/read-only (sending it in an input is a
 * 422 `readOnly` error, contract §2). IDs/references/timestamps are
 * always server-generated. Money is ALWAYS integer minor units plus an
 * explicit ISO-4217 `currency` — never floats (contract §1.5).
 */

import type { LocalizedText } from "@/lib/i18n";

export type { LocalizedText };

/** List envelope for every list endpoint (contract §1.6). */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/** Error envelope for every error response (contract §1.7). */
export interface ApiErrorBody {
  error: {
    code: string;
    messageKey: string;
    fieldErrors?: Record<string, string[]>;
    details?: Record<string, unknown>;
  };
}

// ---------------------------------------------------------------------------
// Identity, workspace, system
// ---------------------------------------------------------------------------

/** Role codes (contract §1.3, provisional until TBD-PO-03). */
export type RoleCode = "OWN" | "OPS" | "CRD" | "INS" | "PM" | "QA" | "CUST";

export type UserStatus = "invited" | "active" | "disabled";

/** Contract §2.3. Password hashes/tokens/sessions never appear here. */
export interface UserDTO {
  id: string; // ro
  email: string;
  phoneE164?: string;
  displayName: string;
  role: RoleCode;
  status: UserStatus;
  customerId?: string;
  createdAt: string; // ro
  updatedAt: string; // ro
  lastLoginAt?: string; // ro
  version: number; // ro
}

/**
 * `GET /api/v1/me` (contract §3.2). Today the only identity is the
 * environment-configured company-owner account, which predates any user
 * store, so stored-record fields (timestamps, version) do not exist for
 * it. `provisioning` says where the identity comes from; when database
 * users land (TBD-PO-03/TBD-TECH-01) this returns "database" with the
 * full UserDTO fields populated.
 */
export interface CurrentUserDTO {
  id: string; // ro
  email: string;
  displayName: string;
  role: RoleCode;
  status: UserStatus;
  provisioning: "environment" | "database";
}

/**
 * Engineers are staff users in an engineering role (contract §1.3) —
 * there is no separate engineer table. This is a filtered view of
 * UserDTO; it is empty until staff accounts exist (TBD-PO-03).
 */
export type EngineerDTO = Pick<UserDTO, "id" | "displayName" | "role" | "status" | "phoneE164">;

/** Current workspace surface. Single-workspace today; see server README. */
export interface WorkspaceDTO {
  id: string;
  mode: "single-workspace";
  multiCompany: false;
}

/**
 * Owner-gated operational status (`GET /api/v1/admin/system/status`).
 * Booleans and names only — never values of secrets or connection data.
 */
export interface SystemStatusDTO {
  environment: "production" | "development" | "test";
  apiVersion: "v1";
  authConfigured: boolean;
  dataAdapter: {
    /** True only when a registered adapter is actually serving. */
    configured: boolean;
    /** Registered adapter name in use, or null when none is serving. */
    name: string | null;
    /** The dev/test fake is never production-capable. */
    productionCapable: boolean;
  };
  workspaceId: string;
  domains: {
    /** Read + write HTTP endpoints implemented. */
    implemented: string[];
    /** Read endpoints implemented; writes return 501 (decisions open). */
    readOnly: string[];
    /** Ports/DTOs defined; no HTTP surface yet beyond 501 markers. */
    planned: string[];
  };
}

// ---------------------------------------------------------------------------
// Customers (contract §2.4 / §3.3 — implemented)
// ---------------------------------------------------------------------------

export interface CustomerDTO {
  id: string; // ro
  reference: string; // ro
  name: string;
  phoneE164: string;
  email?: string;
  city?: string;
  /** ro — set only by an approved consent-capture flow (TBD-PO-01). */
  whatsappConsent: { granted: boolean; at?: string; source?: string };
  portalUserIds: string[]; // ro
  /**
   * ro, service-computed read-model field (contract §2.4). Omitted while
   * the derivation inputs (linked requests/projects) are not wired;
   * clients must treat absence as "unknown", never as a status.
   */
  derivedStatus?: string;
  createdAt: string; // ro
  updatedAt: string; // ro
  version: number; // ro
}

export interface CustomerCreateInput {
  name: string;
  /** Accepted in human format; normalized server-side (no country guessed, TBD-PO-10). */
  phone: string;
  email?: string;
  city?: string;
}

export interface CustomerUpdateInput {
  name?: string;
  phone?: string;
  email?: string | null;
  city?: string | null;
  /** Expected current version (optimistic concurrency, contract §1.8). */
  version: number;
}

/** Inspection-request lifecycle (contract §4.1). */
export type InspectionRequestStatus =
  | "new"
  | "contacted"
  | "inspection_scheduled"
  | "inspection_done"
  | "quotation_sent"
  | "approved"
  | "on_hold"
  | "cancelled";

/** Staff list projection of a public-inspection request (contract §2.4). */
export interface RequestSummaryDTO {
  id: string; // ro
  reference: string; // ro
  /** ro — null until a staff member explicitly links the request (§3.4). */
  customerId: string | null;
  /** ro — linked customer name, otherwise the submitted full name. */
  customerName: string;
  serviceSlug: string;
  city: string;
  submittedAt: string; // ro
  status: InspectionRequestStatus;
  priority: "normal" | "high" | "urgent";
  assigneeId?: string;
  assigneeName?: string; // ro
  version: number; // ro
}

/**
 * `GET /api/v1/admin/customers/{id}` (contract §3.3): the customer plus a
 * read-model summary of explicitly linked work.
 */
export interface CustomerDetailDTO extends CustomerDTO {
  summary: {
    /**
     * Requests explicitly linked to this customer. Always empty while
     * request→customer linking is unimplemented (TBD-PO-12): intake
     * never links silently, so no request can appear here yet.
     */
    requests: RequestSummaryDTO[];
    /** All projects owned by this customer (enriched summaries). */
    projects: ProjectSummaryDTO[];
    /**
     * Findings across those projects that are not yet resolved
     * (status `open` or `in_progress`) — the same "open" semantics the
     * admin/portal UI uses today.
     */
    openFindings: number;
  };
}

// ---------------------------------------------------------------------------
// Projects & operations (contract §2.6 — reads implemented, writes planned)
// ---------------------------------------------------------------------------

export type ProjectStatus = "in_progress" | "on_hold" | "handed_over" | "cancelled";

export interface ProjectSummaryDTO {
  id: string;
  reference: string;
  title: LocalizedText;
  customerId: string;
  /** ro — resolved by the service when the customer record is visible. */
  customerName?: string;
  contractId: string;
  serviceSlug: string;
  status: ProjectStatus;
  /**
   * ro — PROVISIONAL derivation (TBD-PO-18): latest measurement's
   * percent by (measuredAt, recordedAt, id), else 0. Not a reporting
   * policy until the owner approves PO-18.
   */
  progressPercent: number;
  currentMilestoneId?: string;
  updatedAt: string;
  version: number;
}

export interface ProjectDTO extends ProjectSummaryDTO {
  quotationId?: string;
  createdAt: string;
}

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export interface MilestoneDTO {
  id: string;
  projectId: string;
  title: LocalizedText;
  detail?: string;
  status: MilestoneStatus;
  progressPercent: number;
  plannedDate: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface DiaryEntryDTO {
  id: string;
  projectId: string;
  entryDate: string;
  title: string;
  body?: string;
  authorId: string; // ro
  attachmentDocumentIds: string[];
  createdAt: string;
}

export interface ProgressMeasurementDTO {
  id: string;
  projectId: string;
  milestoneId?: string;
  measuredPercent: number;
  measuredAt: string;
  recordedAt: string; // ro
  measuredBy: string; // ro
  note?: string;
}

export type FindingKind = "issue" | "quality";
export type FindingStatus = "open" | "in_progress" | "resolved";
export type Priority = "normal" | "high" | "urgent";

export interface FindingDTO {
  id: string;
  reference: string;
  projectId: string;
  kind: FindingKind;
  source: "staff" | "portal"; // ro
  phase?: string;
  title: string;
  location?: string;
  detail: string;
  correctiveAction?: string;
  assigneeId?: string;
  severity: Priority;
  status: FindingStatus;
  reportedAt: string; // ro
  resolvedAt?: string; // ro
  resolvedBy?: string; // ro
  version: number;
}

export type WeeklyReportStatus = "draft" | "pending" | "approved" | "sent";

export interface WeeklyReportDTO {
  id: string;
  projectId: string;
  weekStart: string;
  title: string;
  progressPercent?: number;
  status: WeeklyReportStatus;
  documentId?: string;
  publishedAt?: string; // ro
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Inspections (contract §2.4 — reads implemented; writes blocked by PO-13)
// ---------------------------------------------------------------------------

export type InspectionStatus = "inspection_scheduled" | "inspection_done" | "cancelled";

export interface InspectionDTO {
  id: string;
  reference: string;
  requestId: string;
  customerId?: string | null;
  serviceSlug: string;
  scheduledAt: string;
  engineerId: string;
  status: InspectionStatus;
  result?: { notes: string; completedAt: string; completedBy: string };
  version: number;
}

// ---------------------------------------------------------------------------
// Quotations & contracts (contract §2.5 — summary reads; detail/writes planned)
// ---------------------------------------------------------------------------

export interface MoneyTotalsDTO {
  subtotalMinor: number;
  /** Omitted (never zero-filled) until the tax policy exists (TBD-PO-04). */
  taxMinor?: number;
  totalMinor: number;
}

export type DecisionEligibility = "not_sent" | "actionable" | "decided" | "superseded" | "expired";

/**
 * `superseded` for contract eligibility depends on the unchosen
 * TBD-PO-04A Q2 option; the foundation never emits it yet.
 */
export type ContractEligibility = "not_eligible" | "eligible" | "superseded";

export interface QuotationSummaryDTO {
  id: string;
  reference: string;
  requestId?: string;
  customerId: string;
  customerName?: string;
  title: string;
  currency: string;
  currentRevisionNo: number;
  internalReviewStatus: string;
  deliveryStatus: string;
  customerDecisionOutcome?: "approved" | "rejected";
  decisionEligibility: DecisionEligibility;
  contractEligibility: ContractEligibility;
  totals: MoneyTotalsDTO;
  validUntil?: string;
  updatedAt: string;
  version: number;
}

export type ContractStatus = "draft" | "pending_signature" | "signed";

export interface ContractSummaryDTO {
  id: string;
  reference: string;
  quotationId: string;
  quotationRevisionNo: number;
  customerId: string;
  customerName?: string;
  projectId?: string;
  type: string;
  baseAmountMinor: number;
  /** ro — base + approved change-order deltas (contract §2.5). */
  effectiveAmountMinor: number;
  currency: string;
  status: ContractStatus;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Handover & warranty (contract §2.6 — reads implemented, writes planned)
// ---------------------------------------------------------------------------

export interface HandoverDTO {
  id: string;
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
  version: number;
}

export type WarrantyStatus = "open" | "in_progress" | "resolved";

export interface WarrantyRequestDTO {
  id: string;
  reference: string;
  projectId: string;
  source: "staff" | "portal"; // ro
  title: string;
  detail: string;
  status: WarrantyStatus;
  visitScheduledAt?: string;
  assigneeId?: string;
  resolutionNote?: string;
  resolvedBy?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Documents & file metadata (contract §2.6 — metadata reads; upload planned)
// ---------------------------------------------------------------------------

export interface DocumentVersionDTO {
  versionNo: number;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  uploadedAt: string;
}

export interface DocumentDTO {
  id: string;
  owner: { entityType: string; entityId: string };
  title: string;
  /** Allow-list is TBD-PO-06; values are stored keys, never prose. */
  docType: string;
  visibleToCustomer: boolean;
  currentVersionNo: number;
  /** Storage keys/URLs never appear in DTOs (contract §2.6). */
  versions: DocumentVersionDTO[];
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Audit events (contract §2.7 shape — foundation staff audit reads)
// ---------------------------------------------------------------------------

export interface AuditEventDTO {
  id: string;
  at: string;
  actor: { kind: "user" | "public" | "system" | "provider"; userId?: string; role?: string };
  action: string;
  entity: { type: string; id: string; reference?: string };
  correlationId?: string;
}

// ---------------------------------------------------------------------------
// Finance — FOUNDATION-PROPOSED (not in api-contract v1; reads only).
// Shapes derive from the preview fixtures; amounts converted to integer
// minor units per contract §1.5. Derived balances/status are service
// read-models and are never stored or client-writable. Currency/tax
// policy is TBD-PO-04; allocation/settlement rules need owner approval
// before any write endpoint exists.
// ---------------------------------------------------------------------------

export interface DueDTO {
  id: string;
  customerId: string;
  projectId: string;
  label: LocalizedText;
  dueDate: string;
  amountMinor: number;
  currency: string;
  /** ro read-model: sum of payment allocations against this due. */
  allocatedMinor: number;
  /** ro read-model: amount − allocated, floored at 0. */
  remainingMinor: number;
  /**
   * ro read-model against the server's current date. The frozen preview
   * snapshot date must never be used server-side (contract §2.7 note).
   */
  balanceStatus: "settled" | "overdue" | "due";
  createdAt: string;
  updatedAt: string;
  version: number;
}

/** Payment methods as implemented by the finance board (D1 session UI). */
export type PaymentMethod = "cash" | "instapay" | "fawry" | "bank_transfer";

export interface PaymentDTO {
  id: string;
  customerId: string;
  projectId: string;
  paidAt: string;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  allocations: Array<{ dueId: string; amountMinor: number }>;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface SupplierDTO {
  id: string;
  reference: string;
  name: LocalizedText;
  category?: LocalizedText;
  phoneE164?: string;
  city?: LocalizedText;
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface PurchaseDTO {
  id: string;
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
    /** ro — server-computed line total. */
    lineTotalMinor: number;
  }>;
  discountMinor: number;
  paidAmountMinor: number;
  currency: string;
  /** ro read-model totals (contract-style; computed, never stored). */
  totals: { grossMinor: number; netMinor: number; payableMinor: number };
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ---------------------------------------------------------------------------
// Complaints & messages — FOUNDATION-PROPOSED (reads only).
// Derived from the portal complaint fixtures. Internal-visibility
// replies exist on the staff DTO only; any future portal projection
// must omit them deny-by-default (contract §2.8 rule).
// ---------------------------------------------------------------------------

export interface ComplaintDTO {
  id: string;
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
  createdAt: string;
  updatedAt: string;
  version: number;
}
