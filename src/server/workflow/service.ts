/**
 * Workflow transition service (contract §4 / §2.6).
 *
 * Pure, database-independent transition engine: given a current state
 * and a proposed transition, return the accepted next state (with a
 * server-set history entry when one is created) or a typed rejection.
 *
 * What this enforces: state-machine legality only — the exact state
 * graphs and progress/integrity invariants already defined in the
 * API contract.
 *
 * What this deliberately does NOT decide (owner decisions, TBD-PO-*):
 * - which roles may trigger a transition (TBD-PO-03);
 * - whether an inspection may be cancelled and what that does to the
 *   parent request (TBD-PO-13);
 * - post-customer-approval quotation revision policy Q1/Q2/Q3
 *   (TBD-PO-04A) — the base contract blocks revision creation/send
 *   from a customer-approved source until one option is selected;
 * - contract issuance/signing evidence and actors (TBD-PO-05);
 * - handover customer-acknowledgement requirement (TBD-PO-05).
 *
 * The caller (service/route layer) enforces authorization and any
 * TBD-gated precondition before invoking these transitions. Nothing
 * here imports a database, enables fake persistence, or chooses a
 * schema.
 */

import type {
  Clock,
  ContractStatus,
  FindingStatus,
  HandoverStatus,
  MilestoneStatus,
  ProjectStatus,
  ReportStatus,
  RequestStatus,
  TransitionReject,
  TransitionResult,
  WarrantyStatus,
} from "./ports";
import { WorkflowReason } from "./ports";

const TERMINAL_REQUEST_STATUSES = new Set(["approved", "cancelled"]);
const NON_HOLD_REQUEST_STATUSES = new Set([
  "new",
  "contacted",
  "inspection_scheduled",
  "inspection_done",
  "quotation_sent",
]);

const reject = (reasonCode: string, reason: string): TransitionReject => ({
  kind: "rejected",
  reasonCode,
  reason,
});

function historyEntry<TState extends string>(
  clock: Clock,
  status: TState,
  actorId: string,
  note?: string,
) {
  return { status, at: clock.now(), actorId, ...(note !== undefined ? { note } : {}) };
}

export function createWorkflowService(clock: Clock) {
  /* ---------------------------------------------------------------- */
  /* Request (§4.1)                                                   */
  /* ---------------------------------------------------------------- */

  function request(input: {
    readonly from: RequestStatus;
    readonly to: RequestStatus;
    readonly note?: string;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
    /** Evidence-backed server side-effect (inspection/quotation/customer decision). */
    readonly evidenceBacked?: boolean;
    /** Last non-hold status to resume to when resuming from on_hold. */
    readonly resumeTo?: RequestStatus;
    /** Assignee id (V-ASSIGNEE: inspection stages require non-null). */
    readonly assigneeId?: string | null;
  }): TransitionResult<RequestStatus> {
    const { from, to, actor, evidenceBacked = false, assigneeId, resumeTo } = input;

    // Terminal states never change and never append history.
    if (TERMINAL_REQUEST_STATUSES.has(from)) {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        `Request is already ${from}; no further transition or history entry is allowed.`,
      );
    }

    // --- Evidence-backed server side-effects (§4.1) -----------------
    if (evidenceBacked) {
      // Linked inspection create: contacted -> inspection_scheduled.
      if (from === "contacted" && to === "inspection_scheduled") {
        if (!assigneeId) {
          return reject(
            WorkflowReason.REQUIRES_ASSIGNEE,
            "A request cannot enter inspection_scheduled without an assignee (V-ASSIGNEE).",
          );
        }
        return {
          kind: "accepted",
          nextState: "inspection_scheduled",
          recordedAt: clock.now(),
          historyEntry: historyEntry(clock, "inspection_scheduled", actor.actorId, input.note),
        };
      }
      // Linked inspection complete: inspection_scheduled -> inspection_done.
      if (from === "inspection_scheduled" && to === "inspection_done") {
        if (!assigneeId) {
          return reject(
            WorkflowReason.REQUIRES_ASSIGNEE,
            "A request cannot enter inspection_done without an assignee (V-ASSIGNEE).",
          );
        }
        return {
          kind: "accepted",
          nextState: "inspection_done",
          recordedAt: clock.now(),
          historyEntry: historyEntry(clock, "inspection_done", actor.actorId, input.note),
        };
      }
      // First quotation send: inspection_done -> quotation_sent.
      if (from === "inspection_done" && to === "quotation_sent") {
        return {
          kind: "accepted",
          nextState: "quotation_sent",
          recordedAt: clock.now(),
          historyEntry: historyEntry(clock, "quotation_sent", actor.actorId, input.note),
        };
      }
      // Customer approval of an actionable sent revision: quotation_sent -> approved (terminal).
      if (from === "quotation_sent" && to === "approved") {
        return {
          kind: "accepted",
          nextState: "approved",
          recordedAt: clock.now(),
          historyEntry: historyEntry(clock, "approved", actor.actorId, input.note),
        };
      }
      // Later pre-approval revision sends leave quotation_sent unchanged: no state change, no history.
      if (from === "quotation_sent" && to === "quotation_sent") {
        return { kind: "accepted", nextState: "quotation_sent", recordedAt: clock.now() };
      }
      return reject(
        WorkflowReason.ILLEGAL_TRANSITION,
        `Evidence-backed request transition ${from} -> ${to} is not a defined server side-effect.`,
      );
    }

    // --- Manual (generic PATCH) transitions -------------------------
    // Manual targets: contacted, on_hold, cancelled, and resume-to-last-non-hold.
    if (to === "on_hold") {
      // From any non-terminal state -> on_hold.
      return {
        kind: "accepted",
        nextState: "on_hold",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "on_hold", actor.actorId, input.note),
      };
    }

    if (to === "cancelled") {
      // From any non-terminal state -> cancelled.
      return {
        kind: "accepted",
        nextState: "cancelled",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "cancelled", actor.actorId, input.note),
      };
    }

    // Resume from on_hold: the requested `to` must equal the declared
    // resumeTo (the last non-hold status). A mismatch is rejected.
    if (from === "on_hold" && resumeTo !== undefined) {
      if (!NON_HOLD_REQUEST_STATUSES.has(resumeTo)) {
        return reject(
          WorkflowReason.ILLEGAL_TRANSITION,
          `Invalid resume target ${resumeTo}.`,
        );
      }
      if (to !== resumeTo) {
        return reject(
          WorkflowReason.ILLEGAL_TRANSITION,
          `Resume target ${resumeTo} does not match requested status ${to}.`,
        );
      }
      return {
        kind: "accepted",
        nextState: resumeTo,
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, resumeTo, actor.actorId, input.note),
      };
    }

    if (to === "contacted") {
      // Manual contact (new -> contacted) or resume from on_hold -> contacted.
      if (from !== "new" && from !== "on_hold") {
        return reject(
          WorkflowReason.ILLEGAL_TRANSITION,
          `Manual contact is only valid from new or on_hold, not ${from}.`,
        );
      }
      return {
        kind: "accepted",
        nextState: "contacted",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "contacted", actor.actorId, input.note),
      };
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Manual request transition ${from} -> ${to} is not allowed.`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Project (§4.4)                                                   */
  /* ---------------------------------------------------------------- */

  function project(input: {
    readonly from: ProjectStatus;
    readonly to: ProjectStatus;
    readonly note?: string;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
    readonly cancellationNote?: string;
  }): TransitionResult<ProjectStatus> {
    const { from, to, actor, cancellationNote } = input;

    const TERMINAL = new Set(["handed_over", "cancelled"]);
    if (TERMINAL.has(from)) {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        `Project is already ${from}; no further transition is allowed.`,
      );
    }

    if (to === "on_hold" || to === "in_progress") {
      // Manual in_progress <-> on_hold.
      return {
        kind: "accepted",
        nextState: to,
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, to, actor.actorId, input.note),
      };
    }

    if (to === "cancelled") {
      // Manual in_progress|on_hold -> cancelled; cancellation note required.
      if (!cancellationNote || !cancellationNote.trim()) {
        return reject(
          WorkflowReason.REQUIRES_CANCELLATION_NOTE,
          "Cancelling a project requires a non-empty cancellation note.",
        );
      }
      return {
        kind: "accepted",
        nextState: "cancelled",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "cancelled", actor.actorId, cancellationNote.trim()),
      };
    }

    if (to === "handed_over") {
      // Only via handover completion (evidence-backed), not generic PATCH.
      return reject(
        WorkflowReason.ILLEGAL_TRANSITION,
        "A project enters handed_over only as the atomic side-effect of handover completion.",
      );
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Project transition ${from} -> ${to} is not allowed.`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Milestone (§2.6)                                                 */
  /* ---------------------------------------------------------------- */

  function milestone(input: {
    readonly from: MilestoneStatus;
    readonly to: MilestoneStatus;
    readonly progressPercent?: number;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<MilestoneStatus> {
    const { from, to, progressPercent, actor } = input;

    if (from === "completed") {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        "Completed milestones are immutable; no transition is allowed.",
      );
    }

    if (to === "in_progress" && from === "pending") {
      // pending -> in_progress: progress must be 0-99 (pending implies 0 baseline).
      const progress = progressPercent ?? 0;
      if (!Number.isFinite(progress) || progress < 0 || progress > 99) {
        return reject(
          WorkflowReason.ILLEGAL_TRANSITION,
          "An in_progress milestone must have progressPercent between 0 and 99.",
        );
      }
      return {
        kind: "accepted",
        nextState: "in_progress",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "in_progress", actor.actorId),
      };
    }

    if (to === "completed" && from === "in_progress") {
      // in_progress -> completed: server sets progress 100 + completedAt.
      return {
        kind: "accepted",
        nextState: "completed",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "completed", actor.actorId),
      };
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Milestone transition ${from} -> ${to} is not allowed (graph is pending -> in_progress -> completed).`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Finding (§2.6)                                                   */
  /* ---------------------------------------------------------------- */

  function finding(input: {
    readonly from: FindingStatus;
    readonly to: FindingStatus;
    readonly correctiveAction?: string;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<FindingStatus> {
    const { from, to, correctiveAction, actor } = input;

    if (from === "resolved") {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        "Resolved findings are immutable; no reopen transition is specified.",
      );
    }

    if (to === "in_progress" && from === "open") {
      return {
        kind: "accepted",
        nextState: "in_progress",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "in_progress", actor.actorId),
      };
    }

    if (to === "resolved" && from === "in_progress") {
      if (!correctiveAction || !correctiveAction.trim()) {
        return reject(
          WorkflowReason.REQUIRES_CORRECTIVE_ACTION,
          "Resolving a finding requires a non-empty corrective action in the same request.",
        );
      }
      return {
        kind: "accepted",
        nextState: "resolved",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "resolved", actor.actorId),
      };
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Finding transition ${from} -> ${to} is not allowed (graph is open -> in_progress -> resolved).`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Report (§2.6)                                                    */
  /* ---------------------------------------------------------------- */

  function report(input: {
    readonly from: ReportStatus;
    readonly to: ReportStatus;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<ReportStatus> {
    const { from, to, actor } = input;

    const FORWARD: Record<ReportStatus, ReportStatus | undefined> = {
      draft: "pending",
      pending: "approved",
      approved: "sent",
      sent: undefined,
    };

    if (FORWARD[from] !== to) {
      return reject(
        WorkflowReason.ILLEGAL_TRANSITION,
        `Report transition ${from} -> ${to} is not allowed (graph is draft -> pending -> approved -> sent; no return/reject path).`,
      );
    }

    return {
      kind: "accepted",
      nextState: to,
      recordedAt: clock.now(),
      historyEntry: historyEntry(clock, to, actor.actorId),
    };
  }

  /* ---------------------------------------------------------------- */
  /* Handover (§2.6 / §4.4)                                           */
  /* ---------------------------------------------------------------- */

  function handover(input: {
    readonly from: HandoverStatus;
    readonly to: HandoverStatus;
    readonly allMandatoryChecklistItemsChecked: boolean;
    readonly customerAcknowledgement?: boolean;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<HandoverStatus> {
    const { from, to, allMandatoryChecklistItemsChecked, customerAcknowledgement, actor } = input;

    if (from === "handed_over") {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        "Handover is already complete; no further transition is allowed.",
      );
    }

    if (to === "handed_over") {
      if (!allMandatoryChecklistItemsChecked) {
        return reject(
          WorkflowReason.PRECONDITION_FAILED,
          "Every mandatory checklist item must be checked before handover completion.",
        );
      }
      // Customer acknowledgement/signature evidence is required by TBD-PO-05.
      // Until PO-05 decides the model, this precondition is recorded but not
      // enforced here; the caller must enforce the approved acknowledgement rule.
      return {
        kind: "accepted",
        nextState: "handed_over",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "handed_over", actor.actorId),
      };
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Handover transition ${from} -> ${to} is not allowed (pending -> handed_over only via completion).`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Warranty (§2.6)                                                  */
  /* ---------------------------------------------------------------- */

  function warranty(input: {
    readonly from: WarrantyStatus;
    readonly to: WarrantyStatus;
    readonly resolutionNote?: string;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<WarrantyStatus> {
    const { from, to, resolutionNote, actor } = input;

    if (from === "resolved") {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        "Resolved warranty requests are immutable; resolutionNote/resolvedBy/closedAt cannot change.",
      );
    }

    if (to === "in_progress" && from === "open") {
      return {
        kind: "accepted",
        nextState: "in_progress",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "in_progress", actor.actorId),
      };
    }

    if (to === "resolved" && from === "in_progress") {
      if (!resolutionNote || !resolutionNote.trim()) {
        return reject(
          WorkflowReason.REQUIRES_CORRECTIVE_ACTION,
          "Resolving a warranty request requires a non-empty resolutionNote in the same request.",
        );
      }
      return {
        kind: "accepted",
        nextState: "resolved",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "resolved", actor.actorId),
      };
    }

    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Warranty transition ${from} -> ${to} is not allowed (graph is open -> in_progress -> resolved).`,
    );
  }

  /* ---------------------------------------------------------------- */
  /* Contract (§4.3)                                                  */
  /* ---------------------------------------------------------------- */

  function contract(input: {
    readonly from: ContractStatus;
    readonly to: ContractStatus;
    readonly actor: { readonly actorId: string; readonly actorKind: "staff" | "customer" | "public" };
  }): TransitionResult<ContractStatus> {
    const { from, to, actor } = input;

    if (from === "signed") {
      return reject(
        WorkflowReason.TERMINAL_STATE,
        "Signed contracts are terminal; no further lifecycle transition is specified.",
      );
    }

    if (from === "draft" && to === "pending_signature") {
      return {
        kind: "accepted",
        nextState: "pending_signature",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "pending_signature", actor.actorId),
      };
    }

    if (from === "pending_signature" && to === "signed") {
      return {
        kind: "accepted",
        nextState: "signed",
        recordedAt: clock.now(),
        historyEntry: historyEntry(clock, "signed", actor.actorId),
      };
    }

    // direct draft -> signed is rejected; any other is illegal.
    return reject(
      WorkflowReason.ILLEGAL_TRANSITION,
      `Contract transition ${from} -> ${to} is not allowed (graph is draft -> pending_signature -> signed).`,
    );
  }

  return { request, project, milestone, finding, report, handover, warranty, contract };
}

export type WorkflowService = ReturnType<typeof createWorkflowService>;

/**
 * Owner-decision register for transitions this module intentionally does
 * NOT implement until the responsible party decides. Nothing here is
 * approved; these are documented so the caller can gate on them.
 */
export const PendingOwnerDecisions = {
  /**
   * Who may trigger each transition (role + resource predicate).
   * Blocks: all staff/mutation transitions.
   */
  AUTHORIZATION_PREDICATES: "TBD-PO-03",
  /**
   * Whether an inspection may be cancelled and its effect on the parent request.
   * Blocks: request cancelled-via-inspection and inspection cancellation.
   */
  INSPECTION_CANCELLATION_POLICY: "TBD-PO-13",
  /**
   * Post-customer-approval quotation revision policy Q1/Q2/Q3.
   * Blocks: revision creation/send from a customer-approved source.
   */
  POST_APPROVAL_QUOTATION_POLICY: "TBD-PO-04A",
  /**
   * Contract issuance/signing evidence, sign method, and actors.
   * Blocks: contract issue-for-signature and mark-signed preconditions.
   */
  CONTRACT_SIGNING_POLICY: "TBD-PO-05",
  /**
   * Handover customer acknowledgement/signature requirement.
   * Blocks: enforcing the customerAcknowledgement precondition above.
   */
  HANDOVER_ACKNOWLEDGEMENT_POLICY: "TBD-PO-05",
} as const;
