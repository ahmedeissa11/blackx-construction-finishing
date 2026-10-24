/**
 * Public intake — DTOs, stored records, ports, and domain errors.
 *
 * Implements the public-intake slice of `docs/api-contract-v1.md` (§2.1,
 * §2.2, §3.1) on the database-independent ports of §5. Ports exchange the
 * DTO/record shapes below only — never ORM entities — so the database
 * colleague's real adapter can replace the dev/test fake adapter behind
 * these interfaces without touching services or routes. Nothing here
 * chooses a database engine, ORM, schema, or migration approach.
 *
 * Slice scope (deliberate): request/contact creation only. Intake never
 * creates, merges, or links a Customer (TBD-PO-12), never schedules an
 * inspection (TBD-PO-13), and enqueues notification *intents* only —
 * sending is the future worker/sender step (TBD-PO-01, TBD-TECH-06).
 */

// ---------------------------------------------------------------------------
// API DTOs (contract §2.1–§2.2)
// ---------------------------------------------------------------------------

export interface ConsentInput {
  /** Must be `true` — contact consent is required to submit. */
  contact: boolean;
  /** WhatsApp opt-in. Declining never rejects the submission itself. */
  whatsapp: boolean;
}

export interface InspectionRequestCreateInput {
  fullName: string;
  phone: string;
  email?: string;
  serviceSlug: string;
  city: string;
  areaM2?: number | string;
  unitType?: string;
  description: string;
  consent: ConsentInput;
  locale: string;
  challengeToken?: string;
}

export interface ContactMessageCreateInput {
  fullName: string;
  phone: string;
  subject: string;
  message: string;
  consent: ConsentInput;
  locale: string;
  challengeToken?: string;
}

/** The only body a successful public submission ever returns (§2.2). */
export interface IntakeReceipt {
  id: string;
  reference: string;
  receivedAt: string;
}

// ---------------------------------------------------------------------------
// Stored records (what repositories persist through the ports)
// ---------------------------------------------------------------------------

export interface ConsentRecord {
  contact: boolean;
  whatsapp: boolean;
  /** Consent copy/version is TBD-PO-01; omitted until approved. */
  textVersion?: string;
  capturedAt: string;
  source: string;
}

export type IntakeRequestStatus = "new";

export interface RequestHistoryEntry {
  status: IntakeRequestStatus;
  at: string;
  actorId: string;
  note?: string;
}

export interface IntakeRequestRecord {
  id: string;
  reference: string;
  /** Always null at intake; staff linking is a separate workflow (§3.4). */
  customerId: null;
  fullName: string;
  /**
   * Digit-folded, separator-stripped, leading `+` preserved. No default
   * country is applied — that policy is TBD-PO-10, so numbers submitted
   * without a country code are stored as submitted, never guessed.
   */
  phoneE164: string;
  email?: string;
  serviceSlug: string;
  city: string;
  areaM2?: number;
  unitType?: string;
  description: string;
  consent: ConsentRecord;
  locale: "ar" | "en";
  status: IntakeRequestStatus;
  /** Staff-triage priority; intake always files as "normal" (PATCH is PO-03). */
  priority: "normal" | "high" | "urgent";
  /** Staff assignee; always null until the PO-03 assignment flow exists. */
  assigneeId: string | null;
  submittedAt: string;
  version: number;
}

export interface ContactMessageRecord {
  id: string;
  reference: string;
  fullName: string;
  phoneE164: string;
  subject: string;
  message: string;
  consent: ConsentRecord;
  locale: "ar" | "en";
  receivedAt: string;
}

export interface AuditEntry {
  id: string;
  event: string;
  actorKind: "public";
  entityType: "request" | "contact_message";
  entityId: string;
  at: string;
  /** Reference only — audit metadata never carries submitted PII. */
  reference: string;
}

export type OutboxEventType = "staff_alert" | "customer_confirmation";
export type OutboxChannel = "whatsapp";

export interface OutboxIntent {
  id: string;
  eventType: OutboxEventType;
  channel: OutboxChannel;
  /** Logical recipient; concrete destinations resolve at send time (PO-01). */
  recipientKind: "staff" | "submitter";
  templateKey: string;
  locale: "ar" | "en";
  /** SEC-08: references only — no names, phones, amounts, or free text. */
  params: { reference: string };
  entityType: "request" | "contact_message";
  entityId: string;
  /** Dedupes retries of one committed occurrence (§7.1). */
  idempotencyKey: string;
  status: "queued";
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Ports (contract §5.3, intake subset — final granularity freezes with §10)
// ---------------------------------------------------------------------------

export interface Clock {
  /** Current time as ISO 8601 UTC. Injected for deterministic tests. */
  now(): string;
}

export interface IdGenerator {
  newId(): string;
}

export interface ReferenceSequence {
  /** `kind` is e.g. "request" / "contact_message". Format: TBD-PO-11. */
  next(kind: string): Promise<string>;
}

/** List envelope for every list endpoint (§1.6). */
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface RequestListQuery {
  page: number;
  pageSize: number;
  /** Sort is always by submittedAt with an `id` tiebreak (§1.6, §3.4). */
  direction: "asc" | "desc";
  status?: string;
  serviceSlug?: string;
  assigneeId?: string;
  search?: string;
}

export interface ContactMessageListQuery {
  page: number;
  pageSize: number;
  /** Sort is always by receivedAt with an `id` tiebreak (§1.6, §3.3). */
  direction: "asc" | "desc";
  subject?: string;
  from?: string;
  to?: string;
  search?: string;
}

export interface RequestRepository {
  create(record: IntakeRequestRecord, historyEntry: RequestHistoryEntry): Promise<void>;
  byId(id: string): Promise<{ record: IntakeRequestRecord; history: RequestHistoryEntry[] } | null>;
  list(query: RequestListQuery): Promise<Page<IntakeRequestRecord>>;
  count(): Promise<number>;
}

export interface ContactMessageRepository {
  create(record: ContactMessageRecord): Promise<void>;
  byId(id: string): Promise<ContactMessageRecord | null>;
  list(query: ContactMessageListQuery): Promise<Page<ContactMessageRecord>>;
  count(): Promise<number>;
}

export interface AuditLogQuery {
  page: number;
  pageSize: number;
  /** Sort is always by `at` with an `id` tiebreak (§1.6). */
  direction: "asc" | "desc";
  /** Matches entries by actor user id; public-actor entries never match. */
  actorId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  from?: string;
  to?: string;
}

export interface AuditLogRepository {
  /** Append-only: no update/delete methods exist on this port (SEC-09). */
  append(entry: AuditEntry): Promise<void>;
  query(query: AuditLogQuery): Promise<Page<AuditEntry>>;
}

export interface NotificationListQuery {
  page: number;
  pageSize: number;
  /** Sort is always by createdAt with an `id` tiebreak (§1.6). */
  direction: "asc" | "desc";
  status?: string;
  channel?: string;
  eventType?: string;
  entityType?: string;
  entityId?: string;
}

export interface NotificationOutboxRepository {
  enqueue(intent: OutboxIntent): Promise<void>;
  listByEntity(entityType: string, entityId: string): Promise<OutboxIntent[]>;
  list(query: NotificationListQuery): Promise<Page<OutboxIntent>>;
}

/** Scoped idempotency claim token (§1.8, §5.2). */
export interface IdempotencyClaim {
  scope: string;
  method: string;
  routeTemplate: string;
  key: string;
}

export type IdempotencyClaimResult =
  | { kind: "claimed"; claim: IdempotencyClaim }
  | { kind: "completed"; httpStatus: number; receipt: IntakeReceipt }
  | { kind: "payload_mismatch" }
  | { kind: "in_progress"; retryAfterSec: number };

export interface IdempotencyStore {
  claim(
    scope: string,
    method: string,
    routeTemplate: string,
    key: string,
    payloadHash: string,
  ): Promise<IdempotencyClaimResult>;
  complete(
    claim: IdempotencyClaim,
    httpStatus: number,
    receipt: IntakeReceipt,
    expiresAt: string,
  ): Promise<void>;
  /** Releases a claim after a rolled-back/retryable failure (§5.2). */
  releaseRetryable(claim: IdempotencyClaim): Promise<void>;
}

export interface RateLimitStore {
  hit(
    key: string,
    limit: number,
    windowSec: number,
  ): Promise<{ allowed: boolean; retryAfterSec: number }>;
}

export interface IntakeRepositories {
  requests: RequestRepository;
  contactMessages: ContactMessageRepository;
  audit: AuditLogRepository;
  outbox: NotificationOutboxRepository;
  references: ReferenceSequence;
}

/**
 * Transaction boundary (§5.2): every repository write inside `work` —
 * business, audit, and outbox rows included — commits or rolls back
 * atomically, with read-your-own-writes inside the transaction. The
 * mechanism (native DB transaction, isolation level) belongs to the
 * adapter owner (TBD-DB-05); this observable behavior is contractual.
 */
export interface UnitOfWork {
  run<T>(work: (repos: IntakeRepositories) => Promise<T>): Promise<T>;
}

/** Everything the intake service needs, supplied by an adapter bundle. */
export interface IntakePorts {
  unitOfWork: UnitOfWork;
  /** Read-side access outside a transaction (tests, future staff reads). */
  repositories: IntakeRepositories;
  idempotency: IdempotencyStore;
  rateLimits: RateLimitStore;
  clock: Clock;
  ids: IdGenerator;
}

// ---------------------------------------------------------------------------
// Domain errors (mapped to the §1.7 envelope at the HTTP boundary)
// ---------------------------------------------------------------------------

export type IntakeErrorCode =
  | "MALFORMED_BODY"
  | "INVALID_QUERY"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_FAILED"
  | "IDEMPOTENCY_KEY_REQUIRED"
  | "IDEMPOTENCY_PAYLOAD_MISMATCH"
  | "IDEMPOTENCY_IN_PROGRESS"
  | "RATE_LIMITED"
  | "DEPENDENCY_UNAVAILABLE"
  | "INTERNAL";

const HTTP_STATUS: Record<IntakeErrorCode, number> = {
  MALFORMED_BODY: 400,
  INVALID_QUERY: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 422,
  IDEMPOTENCY_KEY_REQUIRED: 400,
  IDEMPOTENCY_PAYLOAD_MISMATCH: 409,
  IDEMPOTENCY_IN_PROGRESS: 409,
  RATE_LIMITED: 429,
  DEPENDENCY_UNAVAILABLE: 503,
  INTERNAL: 500,
};

export class IntakeError extends Error {
  readonly code: IntakeErrorCode;
  readonly httpStatus: number;
  readonly messageKey: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly retryAfterSec?: number;

  constructor(
    code: IntakeErrorCode,
    options?: {
      messageKey?: string;
      fieldErrors?: Record<string, string[]>;
      retryAfterSec?: number;
      cause?: unknown;
    },
  ) {
    super(code);
    this.name = "IntakeError";
    this.code = code;
    this.httpStatus = HTTP_STATUS[code];
    this.messageKey = options?.messageKey ?? DEFAULT_MESSAGE_KEYS[code];
    this.fieldErrors = options?.fieldErrors;
    this.retryAfterSec = options?.retryAfterSec;
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

/**
 * Stable localization keys (§1.7: the API never returns prose). Field
 * error *values* reuse the existing dictionary validation keys; these
 * top-level keys join the dictionaries when the forms are cut over.
 */
const DEFAULT_MESSAGE_KEYS: Record<IntakeErrorCode, string> = {
  MALFORMED_BODY: "errors.malformedBody",
  INVALID_QUERY: "errors.invalidQuery",
  UNAUTHENTICATED: "errors.unauthenticated",
  FORBIDDEN: "errors.forbidden",
  NOT_FOUND: "errors.notFound",
  VALIDATION_FAILED: "errors.validationFailed",
  IDEMPOTENCY_KEY_REQUIRED: "errors.idempotencyKeyRequired",
  IDEMPOTENCY_PAYLOAD_MISMATCH: "errors.idempotencyPayloadMismatch",
  IDEMPOTENCY_IN_PROGRESS: "errors.idempotencyInProgress",
  RATE_LIMITED: "errors.rateLimited",
  DEPENDENCY_UNAVAILABLE: "errors.dependencyUnavailable",
  INTERNAL: "errors.internal",
};
