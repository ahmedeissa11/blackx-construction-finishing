# NNNN — <short decision title>

> **TEMPLATE — this file is not a decision.** Copy it to
> `NNNN-short-kebab-slug.md` (next free number) and fill every section.
> Delete this quote block in the copy. See [`README.md`](./README.md)
> for the rules that govern decision records.

| Field | Value |
|---|---|
| Status | proposed |
| Date proposed | YYYY-MM-DD |
| Date decided | — (required before status becomes `accepted`) |
| Decider(s) | — (role, e.g. company owner / database colleague / engineering) |
| Recorded by | — (role; cite how the decision was communicated if recording on another's behalf) |
| Resolves | — (register IDs, e.g. `PO-03`, `DB-07`, `TECH-02`) |
| Unblocks | — (backlog IDs, e.g. `BX-200`) |
| Documents to revise | — (e.g. `docs/api-contract-v1.md` §9.1 — updated in the same change) |
| Supersedes / superseded by | — |

## Context

What question is being decided, why now, and what is blocked without
it. Link the analysis (requirements/API sections, examples supplied by
the owner or accountant) instead of copying it here. State facts only;
mark anything unverified as unverified.

## Decision

The choice, stated unambiguously enough to implement and test against.
Include exact values where the decision *is* a value (thresholds,
formats, retention periods) — or state explicitly which parameter
remains tunable, by whom, and within what bounds.

## Consequences

- What becomes possible / unblocked.
- What becomes impossible, excluded, or deferred as a result.
- New obligations created (tests, migrations owned by the DB colleague,
  documentation revisions, cost or provider commitments).
- Risks accepted, and the signal that would trigger revisiting.

## Alternatives considered

Each serious option, one or two lines on why it was not chosen. "Status
quo / do nothing" counts as an alternative and should be addressed
explicitly.

## Verification

How compliance will be proven: contract-test suite IDs, acceptance
checks, review/approver sign-off, or drills (e.g. restore test). If
verification is impossible until a later task, name that task — an
unverifiable decision is a known risk, not a silent one.

## Links

- Open-register entries resolved: —
- Backlog tasks affected: —
- Source documents/sections: —
