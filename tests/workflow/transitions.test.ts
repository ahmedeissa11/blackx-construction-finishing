/**
 * Deterministic workflow transition tests (contract §4 / §2.6).
 *
 * Covers the lifecycle rules already defined in the API contract:
 * request (§4.1), project (§4.4), milestone/findings/reports/handover/
 * warranty (§2.6), and contract (§4.3). Rules that require an owner
 * decision (TBD-PO-*) are asserted as explicitly blocked/documented,
 * never invented as behavior.
 *
 * A fixed injected clock makes every timestamp assertion deterministic.
 */

import { describe, expect, it } from "vitest";
import { createWorkflowService, PendingOwnerDecisions } from "@/server/workflow/service";
import { WorkflowReason } from "@/server/workflow/ports";

const NOW = "2026-10-24T10:00:00.000Z";
const clock = { now: () => NOW };

const actor = { actorId: "staff-1", actorKind: "staff" as const };

describe("workflow — request lifecycle (§4.1)", () => {
  const svc = createWorkflowService(clock);

  it("advances through the full forward chain new -> contacted -> inspection_scheduled -> inspection_done -> quotation_sent -> approved", () => {
    expect(svc.request({ from: "new", to: "contacted", actor }).kind).toBe("accepted");
    expect(
      svc.request({
        from: "contacted",
        to: "inspection_scheduled",
        actor,
        assigneeId: "eng-1",
        evidenceBacked: true,
      }).kind,
    ).toBe("accepted");
    expect(
      svc.request({
        from: "inspection_scheduled",
        to: "inspection_done",
        actor,
        assigneeId: "eng-1",
        evidenceBacked: true,
      }).kind,
    ).toBe("accepted");
    expect(
      svc.request({
        from: "inspection_done",
        to: "quotation_sent",
        actor,
        evidenceBacked: true,
      }).kind,
    ).toBe("accepted");
    expect(
      svc.request({
        from: "quotation_sent",
        to: "approved",
        actor,
        evidenceBacked: true,
      }).kind,
    ).toBe("accepted");
  });

  it("records a server-set history entry and timestamp on each forward step", () => {
    const r = svc.request({ from: "new", to: "contacted", actor });
    expect(r.kind).toBe("accepted");
    if (r.kind !== "accepted") throw new Error("expected accepted");
    expect(r.recordedAt).toBe(NOW);
    expect(r.historyEntry).toMatchObject({
      status: "contacted",
      at: NOW,
      actorId: "staff-1",
    });
  });

  it("holds any non-terminal request to on_hold and resumes to the last non-hold status", () => {
    const hold = svc.request({ from: "contacted", to: "on_hold", actor });
    expect(hold.kind).toBe("accepted");
    if (hold.kind !== "accepted") throw new Error("expected accepted");

    // Resume from on_hold back to contacted (new resumes to contacted per §4.1).
    const resumeContacted = svc.request({
      from: "on_hold",
      to: "contacted",
      actor,
    });
    expect(resumeContacted.kind).toBe("accepted");

    // Resume from on_hold to a later last non-hold status (resume is manual).
    const resumeLater = svc.request({
      from: "on_hold",
      to: "inspection_done",
      actor,
      resumeTo: "inspection_done",
    });
    expect(resumeLater.kind).toBe("accepted");
    if (resumeLater.kind === "accepted") {
      expect(resumeLater.historyEntry?.status).toBe("inspection_done");
    }

    // A resume target that does not match the requested status is rejected.
    const resumeMismatch = svc.request({
      from: "on_hold",
      to: "contacted",
      actor,
      resumeTo: "inspection_done",
    });
    expect(resumeMismatch.kind).toBe("rejected");
  });

  it("rejects resume to new (new resumes to contacted per §4.1)", () => {
    const r = svc.request({
      from: "on_hold",
      to: "new",
      actor,
      resumeTo: "new",
    });
    expect(r.kind).toBe("rejected");
    if (r.kind === "rejected") {
      expect(r.reasonCode).toBe(WorkflowReason.ILLEGAL_TRANSITION);
    }
  });

  it("cancels any non-terminal request", () => {
    for (const from of [
      "new",
      "contacted",
      "on_hold",
      "inspection_scheduled",
      "inspection_done",
      "quotation_sent",
    ] as const) {
      const r = svc.request({ from, to: "cancelled", actor });
      expect(r.kind).toBe("accepted");
      if (r.kind === "accepted") {
        expect(r.historyEntry?.status).toBe("cancelled");
      }
    }
  });

  it("rejects any transition out of an approved or cancelled terminal state", () => {
    for (const from of ["approved", "cancelled"] as const) {
      for (const to of [
        "contacted",
        "on_hold",
        "cancelled",
        "quotation_sent",
        "approved",
      ] as const) {
        const r = svc.request({ from, to, actor });
        expect(r.kind).toBe("rejected");
        if (r.kind === "rejected") {
          expect(r.reasonCode).toBe(WorkflowReason.TERMINAL_STATE);
        }
      }
    }
  });

  it("rejects manual generic-PATCH attempts to set evidence-backed statuses", () => {
    for (const to of [
      "inspection_scheduled",
      "inspection_done",
      "quotation_sent",
      "approved",
    ] as const) {
      const r = svc.request({ from: "contacted", to, actor });
      expect(r.kind).toBe("rejected");
      if (r.kind === "rejected") {
        expect(r.reasonCode).toBe(WorkflowReason.ILLEGAL_TRANSITION);
      }
    }
  });

  it("requires an assignee to enter inspection stages (V-ASSIGNEE)", () => {
    for (const to of ["inspection_scheduled", "inspection_done"] as const) {
      const r = svc.request({
        from: to === "inspection_scheduled" ? "contacted" : "inspection_scheduled",
        to,
        actor,
        evidenceBacked: true,
      });
      expect(r.kind).toBe("rejected");
      if (r.kind === "rejected") {
        expect(r.reasonCode).toBe(WorkflowReason.REQUIRES_ASSIGNEE);
      }
    }
  });

  it("treats later pre-approval revision sends as a no-op with no history entry", () => {
    const r = svc.request({
      from: "quotation_sent",
      to: "quotation_sent",
      actor,
      evidenceBacked: true,
    });
    expect(r.kind).toBe("accepted");
    if (r.kind !== "accepted") throw new Error("expected accepted");
    expect(r.nextState).toBe("quotation_sent");
    expect(r.historyEntry).toBeUndefined();
  });

  it("customer approval of an actionable sent revision moves quotation_sent -> approved once", () => {
    const r = svc.request({
      from: "quotation_sent",
      to: "approved",
      actor,
      evidenceBacked: true,
    });
    expect(r.kind).toBe("accepted");
    if (r.kind !== "accepted") throw new Error("expected accepted");
    expect(r.nextState).toBe("approved");
    expect(r.historyEntry?.status).toBe("approved");
  });
});

describe("workflow — project lifecycle (§4.4)", () => {
  const svc = createWorkflowService(clock);

  it("allows manual in_progress <-> on_hold", () => {
    expect(svc.project({ from: "in_progress", to: "on_hold", actor }).kind).toBe("accepted");
    expect(svc.project({ from: "on_hold", to: "in_progress", actor }).kind).toBe("accepted");
  });

  it("requires a cancellation note to cancel in_progress or on_hold", () => {
    const noNote = svc.project({ from: "in_progress", to: "cancelled", actor });
    expect(noNote.kind).toBe("rejected");
    if (noNote.kind === "rejected") {
      expect(noNote.reasonCode).toBe(WorkflowReason.REQUIRES_CANCELLATION_NOTE);
    }

    const withNote = svc.project({
      from: "on_hold",
      to: "cancelled",
      actor,
      cancellationNote: "Scope no longer funded.",
    });
    expect(withNote.kind).toBe("accepted");
    if (withNote.kind === "accepted") {
      expect(withNote.historyEntry?.status).toBe("cancelled");
      expect(withNote.historyEntry?.note).toBe("Scope no longer funded.");
    }
  });

  it("rejects generic PATCH to handed_over (only handover completion reaches it)", () => {
    const r = svc.project({ from: "in_progress", to: "handed_over", actor });
    expect(r.kind).toBe("rejected");
    if (r.kind === "rejected") {
      expect(r.reasonCode).toBe(WorkflowReason.ILLEGAL_TRANSITION);
    }
  });

  it("rejects transitions out of terminal handed_over / cancelled", () => {
    for (const from of ["handed_over", "cancelled"] as const) {
      for (const to of ["in_progress", "on_hold", "cancelled", "handed_over"] as const) {
        const r = svc.project({ from, to, actor });
        expect(r.kind).toBe("rejected");
        if (r.kind === "rejected") {
          expect(r.reasonCode).toBe(WorkflowReason.TERMINAL_STATE);
        }
      }
    }
  });
});

describe("workflow — project-phase records (§2.6)", () => {
  const svc = createWorkflowService(clock);

  describe("milestone: pending -> in_progress -> completed", () => {
    it("advances with correct progress invariants", () => {
      const started = svc.milestone({
        from: "pending",
        to: "in_progress",
        progressPercent: 0,
        actor,
      });
      expect(started.kind).toBe("accepted");

      const finished = svc.milestone({
        from: "in_progress",
        to: "completed",
        progressPercent: 100,
        actor,
      });
      expect(finished.kind).toBe("accepted");
      if (finished.kind === "accepted") {
        expect(finished.historyEntry?.status).toBe("completed");
      }
    });

    it("rejects progressPercent 100 without completed", () => {
      const r = svc.milestone({
        from: "pending",
        to: "in_progress",
        progressPercent: 100,
        actor,
      });
      expect(r.kind).toBe("rejected");
      if (r.kind === "rejected") {
        expect(r.reasonCode).toBe(WorkflowReason.ILLEGAL_TRANSITION);
      }
    });

    it("rejects progress outside 0-99 for in_progress", () => {
      const r = svc.milestone({
        from: "pending",
        to: "in_progress",
        progressPercent: -1,
        actor,
      });
      expect(r.kind).toBe("rejected");
    });

    it("keeps completed milestones immutable", () => {
      const r = svc.milestone({
        from: "completed",
        to: "in_progress",
        progressPercent: 50,
        actor,
      });
      expect(r.kind).toBe("rejected");
      if (r.kind === "rejected") {
        expect(r.reasonCode).toBe(WorkflowReason.TERMINAL_STATE);
      }
    });

    it("rejects skipping in_progress (pending -> completed directly)", () => {
      const r = svc.milestone({
        from: "pending",
        to: "completed",
        progressPercent: 100,
        actor,
      });
      expect(r.kind).toBe("rejected");
    });
  });

  describe("finding: open -> in_progress -> resolved", () => {
    it("advances and requires corrective action at resolution", () => {
      const started = svc.finding({ from: "open", to: "in_progress", actor });
      expect(started.kind).toBe("accepted");

      const noAction = svc.finding({ from: "in_progress", to: "resolved", actor });
      expect(noAction.kind).toBe("rejected");
      if (noAction.kind === "rejected") {
        expect(noAction.reasonCode).toBe(WorkflowReason.REQUIRES_CORRECTIVE_ACTION);
      }

      const resolved = svc.finding({
        from: "in_progress",
        to: "resolved",
        correctiveAction: "Re-sealed the joint.",
        actor,
      });
      expect(resolved.kind).toBe("accepted");
    });

    it("keeps resolved findings immutable (no reopen)", () => {
      const r = svc.finding({ from: "resolved", to: "open", actor });
      expect(r.kind).toBe("rejected");
      if (r.kind === "rejected") {
        expect(r.reasonCode).toBe(WorkflowReason.TERMINAL_STATE);
      }
    });
  });

  describe("report: draft -> pending -> approved -> sent, no return path", () => {
    it("advances forward only", () => {
      expect(svc.report({ from: "draft", to: "pending", actor }).kind).toBe("accepted");
      expect(svc.report({ from: "pending", to: "approved", actor }).kind).toBe("accepted");
      expect(svc.report({ from: "approved", to: "sent", actor }).kind).toBe("accepted");
    });

    it("rejects any backward or skip transition", () => {
      const back = svc.report({ from: "approved", to: "pending", actor });
      expect(back.kind).toBe("rejected");
      const skip = svc.report({ from: "draft", to: "approved", actor });
      expect(skip.kind).toBe("rejected");
    });

    it("keeps sent terminal", () => {
      const r = svc.report({ from: "sent", to: "draft", actor });
      expect(r.kind).toBe("rejected");
    });
  });

  describe("handover: pending -> handed_over only via completion", () => {
    it("requires all mandatory checklist items checked", () => {
      const incomplete = svc.handover({
        from: "pending",
        to: "handed_over",
        allMandatoryChecklistItemsChecked: false,
        actor,
      });
      expect(incomplete.kind).toBe("rejected");
      if (incomplete.kind === "rejected") {
        expect(incomplete.reasonCode).toBe(WorkflowReason.PRECONDITION_FAILED);
      }

      const complete = svc.handover({
        from: "pending",
        to: "handed_over",
        allMandatoryChecklistItemsChecked: true,
        actor,
      });
      expect(complete.kind).toBe("accepted");
    });

    it("keeps handed_over terminal", () => {
      const r = svc.handover({
        from: "handed_over",
        to: "handed_over",
        allMandatoryChecklistItemsChecked: true,
        actor,
      });
      expect(r.kind).toBe("rejected");
    });
  });

  describe("warranty: open -> in_progress -> resolved", () => {
    it("requires resolutionNote at resolution", () => {
      const noNote = svc.warranty({ from: "in_progress", to: "resolved", actor });
      expect(noNote.kind).toBe("rejected");
      if (noNote.kind === "rejected") {
        expect(noNote.reasonCode).toBe(WorkflowReason.REQUIRES_CORRECTIVE_ACTION);
      }

      const resolved = svc.warranty({
        from: "in_progress",
        to: "resolved",
        resolutionNote: "Part replaced and tested.",
        actor,
      });
      expect(resolved.kind).toBe("accepted");
    });

    it("keeps resolved warranty immutable", () => {
      const r = svc.warranty({ from: "resolved", to: "open", actor });
      expect(r.kind).toBe("rejected");
    });
  });
});

describe("workflow — contract lifecycle (§4.3)", () => {
  const svc = createWorkflowService(clock);

  it("advances draft -> pending_signature -> signed", () => {
    expect(svc.contract({ from: "draft", to: "pending_signature", actor }).kind).toBe("accepted");
    expect(svc.contract({ from: "pending_signature", to: "signed", actor }).kind).toBe("accepted");
  });

  it("rejects direct draft -> signed (issuance required)", () => {
    const r = svc.contract({ from: "draft", to: "signed", actor });
    expect(r.kind).toBe("rejected");
    if (r.kind === "rejected") {
      expect(r.reasonCode).toBe(WorkflowReason.ILLEGAL_TRANSITION);
    }
  });

  it("keeps signed terminal", () => {
    const r = svc.contract({ from: "signed", to: "draft", actor });
    expect(r.kind).toBe("rejected");
    if (r.kind === "rejected") {
      expect(r.reasonCode).toBe(WorkflowReason.TERMINAL_STATE);
    }
  });

  it("rejects unknown transitions", () => {
    const r = svc.contract({ from: "pending_signature", to: "draft", actor });
    expect(r.kind).toBe("rejected");
  });
});

describe("workflow — owner-decision rules are documented, not implemented (§9 register)", () => {
  it("exposes the TBD owner decisions that gate transitions (none are approved)", () => {
    expect(PendingOwnerDecisions.AUTHORIZATION_PREDICATES).toBe("TBD-PO-03");
    expect(PendingOwnerDecisions.POST_APPROVAL_QUOTATION_POLICY).toBe("TBD-PO-04A");
    expect(PendingOwnerDecisions.CONTRACT_SIGNING_POLICY).toBe("TBD-PO-05");
    expect(PendingOwnerDecisions.HANDOVER_ACKNOWLEDGEMENT_POLICY).toBe("TBD-PO-05");
  });
});
