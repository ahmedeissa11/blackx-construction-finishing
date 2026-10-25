/**
 * Pure workflow transition types — database-independent.
 *
 * Implements the lifecycle state machines already defined in
 * `docs/api-contract-v1.md` §4 (and the §2.6 project-phase vocabulary)
 * as pure functions: given a current state and a proposed transition,
 * return the accepted next state (with a server-set history entry) or
 * a typed rejection.
 *
 * Layering rules:
 * - No database, ORM, driver, or SQL import. Clock is injected for
 *   deterministic tests.
 * - Authorization predicates (who may trigger which transition) are
 *   deliberately NOT decided here — they are TBD-PO-03/TBD-PO-04/TBD-PO-05
 *   and belong to the caller/service layer. This module only enforces
 *   state-machine legality.
 * - Nothing here enables fake persistence in production. No database
 *   engine, schema, or migration is chosen.
 */

export interface Clock {
  /** Current time as ISO 8601 UTC. The only clock authority for status-recording timestamps. */
  now(): string;
}

export interface ActorContext {
  actorId: string;
  actorKind: "staff" | "customer" | "public";
}

/* ------------------------------------------------------------------ */
/* State vocabularies (already defined in contract §4 / §2.6)         */
/* ------------------------------------------------------------------ */

export type RequestStatus =
  | "new"
  | "contacted"
  | "inspection_scheduled"
  | "inspection_done"
  | "quotation_sent"
  | "approved"
  | "on_hold"
  | "cancelled";

export type ProjectStatus = "in_progress" | "on_hold" | "handed_over" | "cancelled";

export type MilestoneStatus = "pending" | "in_progress" | "completed";

export type FindingStatus = "open" | "in_progress" | "resolved";

export type ReportStatus = "draft" | "pending" | "approved" | "sent";

export type HandoverStatus = "pending" | "handed_over";

export type WarrantyStatus = "open" | "in_progress" | "resolved";

export type ContractStatus = "draft" | "pending_signature" | "signed";

/* ------------------------------------------------------------------ */
/* Transition results                                                 */
/* ------------------------------------------------------------------ */

export interface TransitionAccept<TState extends string> {
  readonly kind: "accepted";
  readonly nextState: TState;
  /** Server-set recording timestamp. */
  readonly recordedAt: string;
  /** History entry to append when the transition creates one. */
  readonly historyEntry?: {
    readonly status: TState;
    readonly at: string;
    readonly actorId: string;
    readonly note?: string;
  };
}

export interface TransitionReject {
  readonly kind: "rejected";
  readonly reasonCode: string;
  readonly reason: string;
}

export type TransitionResult<TState extends string> = TransitionAccept<TState> | TransitionReject;

/* ------------------------------------------------------------------ */
/* Reason codes (stable, localizable keys — never raw prose)          */
/* ------------------------------------------------------------------ */

export const WorkflowReason = {
  ILLEGAL_TRANSITION: "workflow.illegalTransition",
  TERMINAL_STATE: "workflow.terminalState",
  REQUIRES_ASSIGNEE: "workflow.requiresAssignee",
  REQUIRES_RESULT: "workflow.requiresResult",
  REQUIRES_CORRECTIVE_ACTION: "workflow.requiresCorrectiveAction",
  REQUIRES_CANCELLATION_NOTE: "workflow.requiresCancellationNote",
  OWNER_DECISION_PENDING: "workflow.ownerDecisionPending",
  EMPTY_PATCH: "workflow.emptyPatch",
  PRECONDITION_FAILED: "workflow.preconditionFailed",
} as const;

/* ------------------------------------------------------------------ */
/* Transition inputs                                                  */
/* ------------------------------------------------------------------ */

export interface RequestTransitionInput {
  readonly from: RequestStatus;
  readonly to: RequestStatus;
  /** Manual transitions only: contacted | on_hold | resume-to-last-non-hold | cancelled. */
  readonly note?: string;
  readonly actor: ActorContext;
  /** True when the transition is the server side-effect of a linked
   *  inspection create/complete or quotation send/customer decision
   *  (evidence-backed, not generic PATCH). */
  readonly evidenceBacked?: boolean;
  /** The last non-hold status to resume to when resuming from on_hold. */
  readonly resumeTo?: RequestStatus;
}

export interface ProjectTransitionInput {
  readonly from: ProjectStatus;
  readonly to: ProjectStatus;
  readonly note?: string;
  readonly actor: ActorContext;
  readonly cancellationNote?: string;
}

export interface MilestoneTransitionInput {
  readonly from: MilestoneStatus;
  readonly to: MilestoneStatus;
  readonly progressPercent?: number;
  readonly actor: ActorContext;
}

export interface FindingTransitionInput {
  readonly from: FindingStatus;
  readonly to: FindingStatus;
  readonly correctiveAction?: string;
  readonly actor: ActorContext;
}

export interface ReportTransitionInput {
  readonly from: ReportStatus;
  readonly to: ReportStatus;
  readonly actor: ActorContext;
}

export interface HandoverTransitionInput {
  readonly from: HandoverStatus;
  readonly to: HandoverStatus;
  readonly allMandatoryChecklistItemsChecked: boolean;
  /** Customer acknowledgement/signature evidence required by TBD-PO-05. */
  readonly customerAcknowledgement?: boolean;
  readonly actor: ActorContext;
}

export interface WarrantyTransitionInput {
  readonly from: WarrantyStatus;
  readonly to: WarrantyStatus;
  readonly resolutionNote?: string;
  readonly actor: ActorContext;
}

export interface ContractTransitionInput {
  readonly from: ContractStatus;
  readonly to: ContractStatus;
  readonly actor: ActorContext;
}

/* ------------------------------------------------------------------ */
/* Service shape                                                      */
/* ------------------------------------------------------------------ */

export interface WorkflowService {
  request(input: RequestTransitionInput): TransitionResult<RequestStatus>;
  project(input: ProjectTransitionInput): TransitionResult<ProjectStatus>;
  milestone(input: MilestoneTransitionInput): TransitionResult<MilestoneStatus>;
  finding(input: FindingTransitionInput): TransitionResult<FindingStatus>;
  report(input: ReportTransitionInput): TransitionResult<ReportStatus>;
  handover(input: HandoverTransitionInput): TransitionResult<HandoverStatus>;
  warranty(input: WarrantyTransitionInput): TransitionResult<WarrantyStatus>;
  contract(input: ContractTransitionInput): TransitionResult<ContractStatus>;
}
