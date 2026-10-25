# BLACK X — Documentation source of truth (BX-001)

This index is the controlled entry point for project documentation. It
records **where** the truth lives, **what state it is in**, and **how it
may change**. It adds structure only: it does not modify, supersede, or
approve anything inside the documents it lists, and it never contains
secrets or credentials.

Last verified against the repository on **25 October 2026** on branch
`arena/b04f8c7e-blackx-construction-finishing` (backend-foundation
task, based on Production merge commit
`9b84ec874ed808f5f6c36ce48c480e9d6f8cba62`, deployed to Production as
`dpl_Efju7iijsfPf1fp2kCUgrqfhnCxv` at last check — re-verify live
state before relying on it; this file describes documentation, not
deployment. The foundation branch itself is **not** merged or deployed
to Production).

## 1. Controlled documents

| Document                                                                               | Role                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | Owner                                                                                                                 | Status (as written in the document itself)                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`requirements-and-implementation-plan.md`](./requirements-and-implementation-plan.md) | Business requirements, first-release scope, phased implementation plan, open questions (§10), pre-implementation approval checklist (§12).                                                                                                                                                                                                                                                                                                                                                                         | Arena/ChatGPT (drafting) · company owner (approval)                                                                   | **Planning draft for management approval — not an implementation authorization.** §12 approval checklist is unchecked.                                                                                                                                                            |
| [`api-contract-v1.md`](./api-contract-v1.md)                                           | Proposed API Contract v1 & database-independent integration specification: DTOs, endpoints, workflow state machines, repository ports, security rules, contract-test suites, unresolved-decision register (§9), DB-colleague integration checklist (§10).                                                                                                                                                                                                                                                          | Arena/ChatGPT (application spec) · database colleague (DB implementation behind the ports) · company owner (approval) | **PROPOSED, document version 0.3 — for project-owner approval.** The intake slice and the wave-1 foundation (below) implement parts of it behind ports on the governed fake for dev/test; there is still **no production database** and its TBD-PO/DB/TECH register remains open. |
| [`backend-architecture.md`](./backend-architecture.md)                                 | Backend foundation assessment + architecture: layering, adapter status, domain/endpoint status matrix, frontend-integration status, test/verification results, limitations, next steps.                                                                                                                                                                                                                                                                                                                            | Arena/ChatGPT                                                                                                         | Implemented wave 1 on the foundation branch (customers writable; other domains read-only/planned 501). Not merged to Production.                                                                                                                                                  |
| [`openapi.json`](./openapi.json)                                                       | OpenAPI 3.1 contract for `/api/v1` (generated from `src/server/foundation/openapi.ts`; served owner-gated; drift- and coverage-tested). Per-operation `x-implementation-status`/`x-blocked-by`.                                                                                                                                                                                                                                                                                                                    | Arena/ChatGPT                                                                                                         | Wave-1 surface: 49 paths (intake + foundation). Frontend-usable without DB knowledge.                                                                                                                                                                                             |
| [`database-integration-contract.md`](./database-integration-contract.md)               | General integration contract for the database colleague: entities/relationships, ID/timestamp/money conventions, required adapter capabilities, migration ownership, connection-config format (names only), import/mapping expectations, acceptance criteria.                                                                                                                                                                                                                                                      | Arena/ChatGPT → database colleague                                                                                    | Selects no DB technology. Awaiting TBD-DB-01…10 answers. Generalizes the intake handoff below.                                                                                                                                                                                    |
| [`database-engineer-handoff.md`](./database-engineer-handoff.md)                       | Front-door handoff for the external database engineer: architecture/boundaries, DTO formats, confirmed vs unresolved entities, conventions, transactions/idempotency, scoping/auth, migrations/deployment, required adapter methods, contract-test runbook, honest portability limits + support policy, verified readiness assessment + mismatch register (M1–M4 fixed; M5/M6/G1 open), and the required-answers checklist.                                                                                        | Arena/ChatGPT → database engineer                                                                                     | Prepared 2026-10-25 against `4d14ccb` + the contract-alignment follow-up on draft PR #8. Awaiting the engineer's §13 answers; persistence work pauses until then.                                                                                                                 |
| [`feature-implementation-matrix.md`](./feature-implementation-matrix.md)               | Living feature-by-feature implementation matrix for the full customer journey (intake → customers → inspections → quotations → contracts → identity → projects/execution → documents → finance → handover/warranty → complaints → portal/notifications): verified status per operation (20 implemented / 27 read-only / 26 planned-501 / 55 contract ops unrouted), missing API operations, required data, dependencies, tests, acceptance criteria; owner/engineer question registers; wave execution plan W0–W8. | Arena/ChatGPT                                                                                                         | Prepared 2026-10-25 against `92657bd` (draft PR #8). Nothing in it is production-operational; every wave ends at QA + a separate owner production gate.                                                                                                                           |
| [`decisions/`](./decisions/)                                                           | Decision-register structure and Architecture Decision Records. See [`decisions/README.md`](./decisions/README.md).                                                                                                                                                                                                                                                                                                                                                                                                 | Shared, per the rules there                                                                                           | One accepted record: [`0001`](./decisions/0001-database-agnostic-backend-foundation.md) (ports-&-adapters foundation; resolves no PO/DB item). No other decision is approved by this structure.                                                                                   |
| [`../tests/contract/README.md`](../tests/contract/README.md)                           | BX-104 contract-test harness and conventions (lives with the tests it governs).                                                                                                                                                                                                                                                                                                                                                                                                                                    | Arena/ChatGPT                                                                                                         | Probe harness plus CT-PORT subsets for the intake ports **and** the foundation ports (`foundation-ports.contract.test.ts`), run against the governed fake; no database adapter is registered.                                                                                     |
| [`../src/server/intake/README.md`](../src/server/intake/README.md)                     | Public-intake business slice (Batch 2): endpoints, adapter governance, open decisions.                                                                                                                                                                                                                                                                                                                                                                                                                             | Arena/ChatGPT                                                                                                         | Implemented on ports + fake adapter for dev/test; production fail-closed (503) until the real adapter integrates. Forms not yet cut over.                                                                                                                                         |
| [`../src/server/foundation/README.md`](../src/server/foundation/README.md)             | Backend foundation module guide: status matrix, file roles, governance, tests.                                                                                                                                                                                                                                                                                                                                                                                                                                     | Arena/ChatGPT                                                                                                         | Wave 1 implemented (branch); production fail-closed until the real adapter integrates.                                                                                                                                                                                            |
| [`db-integration-handoff.md`](./db-integration-handoff.md)                             | Exact handoff for the database colleague: intake ports, transaction/idempotency/audit/outbox behavior, disposable test-DB expectations, acceptance criteria.                                                                                                                                                                                                                                                                                                                                                       | Arena/ChatGPT → database colleague                                                                                    | Intake slice only; selects no DB technology. Awaiting TBD-DB-01…10 answers. Generalized by `database-integration-contract.md` above.                                                                                                                                              |

Repository root [`../README.md`](../README.md) describes the current
(frontend-phase) application as built; where it and the planning
documents differ, the root README reflects _implemented_ reality and
the planning documents reflect _proposed_ future work.

## 2. Precedence and status rules

1. **Implemented reality** (code on `main`, current Production) always
   wins over any proposal when describing what the system _does today_.
2. **Proposals are not approvals.** A requirement, endpoint, role, or
   workflow being specified in a document above does not mean the owner
   approved it or that it may be built. Implementation requires a
   separate, explicit authorization naming the task(s) in scope
   (e.g. "Batch 1: BX-001, BX-104, BX-107 only").
3. Where the requirements document and the API contract differ, both
   remain drafts requiring approval; on API/integration detail the API
   contract is the newer proposal (as its own header states). Conflicts
   are resolved by an owner decision recorded per §4 — never silently.
4. **Database ownership boundary:** the database engine, ORM/driver,
   physical schema, migrations, and data-access implementation belong
   to the database colleague. Database-technology comparisons in the
   requirements document (§5) are advisory input for that colleague,
   not a selection. No document here may impose a database choice.
5. Task identifiers `BX-*` come from the executable implementation
   backlog; decision identifiers `PO-*` (project owner), `DB-*`
   (database colleague), and `TECH-*` (engineering) come from the API
   contract §9 register (plus proposed extensions noted in §3).

## 3. Where decisions and open questions live today

There is deliberately **one** live register per kind — do not create
parallel copies of these tables elsewhere:

- **Already-approved management decisions** (binding inputs):
  requirements document §1 (official WhatsApp integration; Customer
  Portal in the first Production release; no legacy data migration;
  preserve the current site/admin/design except as real functionality
  requires; DB technology decided with the colleague, not imposed).
- **Unresolved project-owner decisions** `PO-01`–`PO-19` (incl.
  `PO-04A`): API contract §9.1.
- **Database-colleague inputs** `DB-01`–`DB-10`: API contract §9.2,
  with the request checklist in §10.
- **Engineering choices to propose at kickoff** `TECH-01`–`TECH-08`:
  API contract §9.3.
- **Open pre-implementation questions** grouped by urgency:
  requirements document §10; sign-off list in §12.
- **Proposed register extensions** (`PO-20`+, `TECH-09`+) were raised in
  the consolidated requirements/backlog reports delivered to the owner.
  They are **not yet merged into §9** and must be incorporated by an
  explicit future revision of the API contract — until then they are
  proposals to review, not register entries to build against.

[`decisions/README.md`](./decisions/README.md) defines how a resolved
item becomes a permanent decision record without rewriting history.

## 4. How these documents may change

- **Additive structure** (new index files, templates, empty registers)
  may be added without touching existing content, as BX-001 does here.
- **Substantive revisions** bump the document's own version, carry a
  dated revision note at the top (following the API contract's existing
  pattern), and preserve an exact pre-edit copy outside the repo for
  diffing. They never silently flip a `TBD-*`/`PO-*`/`DB-*` item to
  "decided" — that flip cites the decision record from §3/`decisions/`.
- **Approvals** are recorded by the approver (owner checklist in the
  requirements document §12, or a decision record), never by editing
  prose to imply approval.
- **Verification:** before relying on a document's currency, check its
  header status and compare content, e.g. `sha256sum docs/*.md`
  against the hash recorded at handoff. Hashes are point-in-time
  evidence, so they belong in handoff reports, not embedded here where
  they would immediately go stale.
- **Git state:** planning documents may sit uncommitted while under
  review. Untracked/unstaged documentation is still user work —
  never reset, clean, overwrite, or discard it; check
  `git status` before any task that touches `docs/`.

## 5. Hard rules for every document in this tree

- No secrets, passwords, tokens, session cookies, connection strings,
  private customer data, or environment-variable **values**. Env-var
  _names_ only, where needed.
- No invented business data: payment/receiving details, prices, tax
  rules, guarantees, approvals, dates, or personnel facts must trace to
  an owner-approved source or be marked as an open decision.
- A page, component, mock, type, or specified endpoint existing is
  never evidence that a feature works. Documents must keep
  implemented / partial / proposed states clearly separated.
- Production deployment of new business functionality and all live
  customer access remain blocked until the security, persistence,
  authorization, audit, backup/restore, and acceptance gates in the
  plans above pass. No document in this tree lifts that block.
