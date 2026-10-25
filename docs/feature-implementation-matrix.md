# Feature implementation matrix — BLACK X operational system

**Purpose:** the single, evidence-backed map from today's code to a real
operational construction & finishing management system — per customer-
journey feature: what exists, which API operations are missing, what
data/dependencies they need, how they will be tested, and what
"done" means. **Verified against** repo
`ahmedeissa11/blackx-construction-finishing`, branch
`arena/b04f8c7e-blackx-construction-finishing` @ `92657bd` (draft PR #8,
**not merged**), 2026-10-25. Suite at this commit: **254/254 tests
green**, CI green. Sources: `docs/requirements-and-implementation-plan.md`
(scope + phases 0–7), `docs/api-contract-v1.md` (99 proposed operations),
`docs/openapi.json`, `docs/database-engineer-handoff.md`,
`docs/backend-architecture.md`.

## Status legend (read this first)

| Mark                   | Meaning                                                                                                     |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- |
| ✅ Implemented         | Code + tests exist behind the ports (proven against the in-memory fake)                                     |
| 👁 Read-only            | Real reads over ports; honestly empty until a real adapter/data exists                                      |
| 🚧 501                 | Routed, returns `501 NOT_IMPLEMENTED` naming its blocking decisions                                         |
| ⬜ Absent              | In the API-contract catalog; no route exists yet                                                            |
| 🧩 Foundation-proposed | Routed + documented in OpenAPI, not yet promoted into the api-contract catalog (reconciliation pending, §5) |

**Production reality (no exceptions):** _no business operation is
production-operational today._ Production (`main` @ `9b84ec8`) contains
the public-intake API slice, which correctly fails closed (503 — no
adapter configured); the foundation (`/admin/customers`, finance,
complaints, …) exists only on this branch + QA. The admin/portal UIs
run on isolated preview fixtures and browser-session state; the public
forms still simulate submission locally (`src/lib/preview-adapter.ts`).
Every "✅" below means _implemented and tested in code_, never
_live for the business_.

## 1. Verified operations inventory

- **50 route files** (`src/app/api/**`): 49 business/API-v1 + NextAuth.
- **73 documented operations** in OpenAPI: **20 implemented · 27
  read-only · 26 planned (501)**.
- **55 contract-catalog operations are not routed at all** (all of
  `/portal/*`, `/auth/*` lifecycle, uploads/documents-bytes, request
  mutations, quotation/contract workflow actions, report approvals,
  audit exports, WhatsApp webhook, project workspace aggregate).
- **29 routed operations are foundation-proposed** (finance, complaints,
  audit-events, system surfaces) — documented in OpenAPI with honest
  statuses, pending promotion into the contract catalog (§5).
- **Ports exist for all 14 domain groups** (handoff §9); UI pages exist
  for every board (dashboard module router + customer/project
  workspaces + requests; 12 portal pages) — all fixture-backed,
  none wired to the API client yet (verified: no component imports it).

---

## 2. Feature matrix

### F1 — Public lead & inspection-request intake

- **Today:** ✅ `POST /public/inspection-requests`, `POST
/public/contact-messages` (full server validation, shared-store rate
  limiting, scoped idempotency, one atomic save of
  record+history+audit+outbox intents); ✅ staff reads
  `GET /admin/requests[/{id}]`, `/admin/contact-messages[/{id}]`,
  `/admin/overview`. Public forms **not cut over** (preview adapter);
  intake is 503 on Production by design.
- **Missing API:** none for intake itself. Cutover is a frontend/config
  step, not new API.
- **Required data:** already in intake ports (request+history, contact
  message, audit, outbox, idempotency, rate limits, references).
- **Dependencies:** real adapter (handoff §13 — DB-01…07); PO-10
  (default phone country — local numbers currently stay local);
  PO-07 (published contact details for confirmations); anti-spam
  challenge choice (TECH-03) before public launch volume.
- **Tests:** existing intake API + CT-PORT suites (atomicity,
  idempotency, rate-limit, reset). Add: E2E submit→appears-in-admin on
  the real adapter (CT-E2E); load/rate-limit behavior on serverless.
- **Acceptance:** (1) CT-PORT intake suite green on the real adapter;
  (2) QA: submit both forms → 201 + reference → visible in staff reads,
  replay returns same receipt, duplicate submit creates nothing;
  (3) owner go-live decision before form cutover in Production;
  (4) a submission can never be lost silently (503 ⇒ honest UI error,
  never fake success).

### F2 — Customer records, duplicates & request triage

- **Today:** ✅ customers full write path (`POST` idempotent create,
  list/search/paginate, `GET {id}` + §3.3 `summary`, version-checked
  `PATCH`, audited, workspace-scoped). 👁 request lists are read-only
  summaries. 🚧/⬜ everything that _changes_ a request.
- **Missing API:** ⬜ `PATCH /admin/requests/{id}` (assignment, priority,
  contact/hold/cancel transitions), ⬜ `POST
/admin/requests/{id}/link-customer`; customer duplicate handling =
  _behavior decision_, not an endpoint.
- **Required data:** customers/requests already ported. Request mutation
  methods (`updateManualFields`, `linkCustomer`,
  `transitionFromLinkedRecord`) are contract §5.3 port additions.
- **Dependencies:** **PO-12** (duplicate-phone policy: unique? reject?
  merge flow? who may link, can links change — until decided: no phone
  uniqueness in storage, no silent merge), **PO-03** (who may triage/
  assign/link), adapter.
- **Tests:** existing customer service/API suites. Add: transition
  matrix tests per §4.1 (illegal transitions ⇒ 409), V-ASSIGNEE rule,
  link immutability/history, duplicate-policy behavior once PO-12 lands.
- **Acceptance:** (1) staff can triage a lead end-to-end on QA (assign →
  contacted → hold/resume) with audit + history; (2) linking is
  explicit, permissioned, and visible in customer summary
  (`summary.requests` becomes non-empty only via links); (3) no code
  path auto-creates/merges customers from intake.

### F3 — Inspection scheduling & inspection reports

- **Today:** 👁 `GET /admin/inspections[/{id}]` reads over ports. 🚧
  `POST /admin/inspections`, `PATCH /admin/inspections/{id}` → 501
  (PO-13, PO-03). UI inspection board is fixture-backed.
- **Missing API:** the two 501 writes above (completion is part of the
  PATCH semantics in the contract); scheduling side-effects on the
  parent request (`contacted→inspection_scheduled→inspection_done`).
- **Required data:** inspection record ported (schedule, engineer =
  staff user, status, result `notes` only). **Typed measurement/result
  fields do not exist** — PO-13 must define them (contract amendment;
  no opaque JSON measurements blob).
- **Dependencies:** **PO-13** (result schema, completion-correction
  authority, cancellation semantics), PO-03 (assignment source for
  engineers — needs staff users, F6), F2 triage (request must be
  contactable/assigned first).
- **Tests:** add CT-WF inspection lifecycle (schedule→complete⇒parent
  transitions once, immutability after completion, reschedule rules).
- **Acceptance:** (1) schedule from a real request assigns a real
  engineer and moves the request exactly once; (2) completion stores
  the approved result fields and locks the record; (3) inspection
  report content = the PO-13 fields, printable via F8 documents later
  (PDF = TECH-07).

### F4 — Quotations & revisions (BOQ)

- **Today:** 👁 `GET /admin/quotations` (summaries with server-computed
  totals). 🚧 create/patch/detail → 501 (PO-04/04A[/03]). Record is an
  aggregate port (revisions + priced items) with three independent
  decision dimensions per contract §4.2.
- **Missing API:** ⬜ `POST /admin/quotations/{id}/revisions`,
  `submit-for-review`, `internal-review/decision`, `send`,
  `record-customer-decision` (+ portal decision in F12); revision
  edit semantics on PATCH.
- **Required data:** aggregate ported; workflow methods
  (`replaceUnsentRevision`, transitions) are §5.3 additions. Money is
  integer minor units; line totals server-computed (already in DTO
  layer).
- **Dependencies:** **PO-04** (internal-review gate + thresholds, tax,
  currency, validity/expiry, off-portal decision recording + evidence),
  **PO-04A** (post-approval revision policy Q1/Q2/Q3 — pick one),
  PO-03 (who creates/reviews/sends/records), F2 (customer), F3
  (inspection usually precedes), TECH-07 (PDF) optional.
- **Tests:** add CT-WF-Q from contract §4.2 (edit locks, supersession,
  expiry non-overwrite, decision terminality, request transition
  exactly-once), totals rounding battery.
- **Acceptance:** (1) full draft→(review)→send→decision chain on QA
  with audit at every step; (2) decided revisions immutable forever;
  (3) no path lets a same-customer _unlinked_ record move a request.

### F5 — Contracts & approved changes (change orders)

- **Today:** 👁 `GET /admin/contracts` summaries. 🚧 create/detail/patch
  → 501 (PO-05[/04]). Aggregate port includes change orders; contract
  snapshots the approved quotation revision (proposed rule).
- **Missing API:** ⬜ `POST /admin/contracts/{id}/issue-for-signature`,
  `mark-signed`, `change-orders`, `change-orders/{coId}/decision`.
- **Required data:** ported aggregates; signature evidence fields depend
  on PO-05 (attestation vs scanned paper vs e-signature provider —
  file evidence may pull in F8).
- **Dependencies:** **PO-05** (issuance packet, signing method/evidence,
  authorities; API never asserts legal validity), **PO-19**
  (contracts per approved revision; post-issuance
  correction/void/amend), PO-04 (change-order approval chain), F4.
- **Tests:** add CT-WF-C (create only from eligible approved revision —
  respects PO-04A choice; issue/sign state rules; change-order
  decision authorities; totals impact rules as approved).
- **Acceptance:** (1) contract created only from an eligible approved
  revision, snapshot immutable; (2) signing records method+signer+
  evidence per PO-05; (3) change orders change totals only via the
  approved decision path, fully audited.

### F6 — Identity: staff users/roles + customer accounts & secure activation

- **Today:** ✅ single environment-owner login (scrypt, JWT session,
  rate-limited by platform only) + `GET /me`, `GET /admin/workspace`;
  👁 `GET /admin/users`; 🚧 `POST/PATCH /admin/users` 501 (PO-03,
  TECH-01); 🚧 `GET /admin/engineers` 501 (engineers = staff-role
  users, not a table). No invitations, no customer accounts, no
  password reset, no revocable DB sessions.
- **Missing API:** ⬜ `POST /admin/customers/{customerId}/invitations`,
  `POST /admin/invitations/{id}/revoke`, `POST /admin/users/{id}/
revoke-sessions`, ⬜ `POST /auth/invitations/accept`,
  `/auth/password-reset/request|confirm`, `/auth/change-password`.
  New ports: `InvitationRepository`, user session/password lifecycle
  methods.
- **Required data:** user record ported (hash never leaves storage);
  invitation (subject, channel, expiry, hashed token), session
  generation/revocation state — contract §2.3–2.4 covers DTOs.
- **Dependencies:** **PO-03** (role matrix + sensitive authorities +
  assignment scoping + separation of duties — the single biggest
  blocker in the whole program), **TECH-01** (revocation mechanism,
  KDF policy, email/phone-change verification), TECH-08 (transactional
  email) and/or PO-01 channel for invitation delivery, PO-17 (portal
  users per customer).
- **Tests:** add CT-SEC identity battery (invitation single-use +
  expiry + wrong-subject rejection, reset token lifecycle, disabled
  user ⇒ 401 everywhere, role predicates per endpoint once PO-03
  lands, session revocation actually revokes).
- **Acceptance:** (1) staff created as `invited`, activate via token
  delivered out-of-band, token never returned by any API; (2) customer
  activation creates a portal identity bound to exactly one customer;
  (3) disabling/revoking takes effect immediately; (4) the provisional
  owner-only guard is replaced by the approved matrix with zero
  behavior change for the owner.

### F7 — Projects & execution (creation, phases, assignments, progress)

- **Today:** 👁 project reads incl. milestones, diary, progress
  measurements, findings, weekly reports, handover (all enriched
  read-models; progress uses the _provisional_ PO-18 rule); 🚧
  `POST /admin/projects` 501 (PO-05/03), `PATCH` 501 (PO-03), findings
  create 501. ⬜ `GET /admin/projects/{id}/workspace` aggregate.
- **Missing API:** ⬜ `POST …/milestones`, `PATCH /admin/milestones/{id}`,
  `POST …/diary-entries`, `POST …/progress-measurements`,
  `POST …/reports` + `POST /admin/reports/{id}/submit-for-review|
approve|publish`, `PATCH /admin/reports/{id}`,
  `PATCH /admin/findings/{id}` (create routed as 501).
- **Required data:** all execution records ported (diary/progress
  immutable by port design). Project _creation_ is contract-derived —
  it must not become free-form CRUD.
- **Dependencies:** **PO-15** (one active project per signed contract —
  confirm/relax), PO-05/F5 (signed contract prerequisite), **PO-18**
  (authoritative progress derivation + approval step?), PO-03
  (assignment source PM/QA, finding authorities incl. closing critical
  findings, report submit/approve/publish authorities).
- **Tests:** add CT-WF execution (creation only from signed contract,
  PO-15 cardinality, measurement append-only + derivation battery,
  finding resolved-requires-correctiveAction, report lifecycle).
- **Acceptance:** (1) project appears only via the signed-contract
  path with correct commercial links; (2) progress % reproducible
  from measurements under the approved rule; (3) workspace aggregate
  matches the individual lists (no second source of truth).

### F8 — Documents & files

- **Today:** 👁 `GET /admin/documents[/{id}]` metadata reads
  (`storageRef`/`visibleToCustomer` model exists; default not
  visible). 🚧 create/patch → 501 (DB-09/TECH-05/PO-06, PO-08). No
  file bytes anywhere; no `FileStoragePort` yet.
- **Missing API:** ⬜ `POST /admin/uploads/sign`,
  `POST /admin/documents/{id}/versions[/sign]`,
  `GET /documents/{id}/download`.
- **Required data:** document+versions metadata ported; new
  `FileStoragePort` (signed upload/download, pending-upload GC).
- **Dependencies:** **DB-09** (object storage: colleague-provided or
  ours), **PO-06** (allowed types/sizes/retention + mandatory handover
  checklist template), TECH-05 (handshake + signed-URL TTLs), PO-08
  (customer visibility per document/version).
- **Tests:** add upload handshake conformance (sign→PUT→confirm,
  checksum/size/type enforcement server-side), download authorization
  matrix (staff vs portal vs other-customer ⇒ 404), version
  immutability.
- **Acceptance:** (1) bytes never transit our JSON API; (2) a document
  is invisible to customers until explicitly published (PO-08);
  (3) orphaned pending uploads are garbage-collected.

### F9 — Finance: dues, payments, purchases/expenses, suppliers, certificates

- **Today:** 🧩👁 reads for dues (derived balance/status via payment
  allocations, overdue vs server date), payments, suppliers, purchases
  (server-computed line totals). 🚧 all finance POSTs → 501 (PO-04;
  suppliers PO-03). Shapes are **foundation-proposed** — not yet in
  the api-contract catalog, no finance UI is wired, and no finance
  _rules_ (tax, currency, certificate workflow) are approved.
- **Missing API:** the 501 POSTs (+ future PATCH semantics); anything
  for **payment certificates (مستخلصات)** — _not modeled_: dues today
  are scheduled receivables; invoices/certificates/receipts are
  distinct documents until the owner rules otherwise (new scoping
  question, §3). General (non-purchase) expenses likewise unmodeled.
- **Required data:** dues/payments(+allocations)/suppliers/purchases
  (+lines) ported as 🧩; certificates/expenses need owner scoping
  before any DTO exists.
- **Dependencies:** **PO-04** (currency, tax treatment), PO-03 (who
  records payments/purchases), contract-catalog promotion of the
  finance DTOs (§5), F5/F7 (dues originate from contracts/projects —
  origination workflow undecided), payment _channels_ (gateway =
  separate explicit owner approval; nothing here assumes it).
- **Tests:** add money battery (allocation sums, over-allocation
  rejection, overdue boundary at date change, rounding), audit on
  every money mutation, no float anywhere (lint-level guard).
- **Acceptance:** (1) balances always derivable: due − allocations,
  reproducible in tests; (2) recorded payments immutable except via an
  approved correction path; (3) finance module stays 🧩-labeled until
  catalog promotion + PO-04 land — never presented as approved
  accounting behavior.

### F10 — Handover & warranty

- **Today:** 👁 `GET /admin/projects/{id}/handover` (404 until exists),
  `GET /admin/warranty-requests[/{id}]`. 🚧 handover create/patch 501
  (PO-06/05), warranty create/patch 501 (PO-14[/03]).
- **Missing API:** ⬜ `POST /admin/handovers/{id}/complete` (+ shape
  reconciliation: contract nests handovers top-level; foundation
  routed them under projects — §5).
- **Required data:** handover (+checklist with mandatory/tier flags),
  warranty request ported; completion may require documents (F8) +
  customer acknowledgement (portal, F12).
- **Dependencies:** **PO-06** (mandatory handover checklist template),
  PO-05 (acknowledgement before completion?), **PO-14** (warranty
  periods/scope — API must not assert coverage until set), F7 project
  state rules (`handed_over` transition source).
- **Tests:** add completion-gate tests (mandatory items, required
  documents, acknowledgement ordering), warranty intake from portal
  tied to handed-over projects only.
- **Acceptance:** (1) completion blocked until the PO-06 checklist
  passes — enforced server-side; (2) warranty copy/behavior makes no
  coverage promise beyond PO-14; (3) project status changes only via
  the handover path.

### F11 — Complaints & customer messages

- **Today:** 🧩👁 `GET /admin/complaints[/{id}]` reads (replies carry
  customer/internal visibility); 🚧 create/patch 501 (PO-08[/03]).
  Contact _messages_ are F1 (implemented intake). Portal issue
  reporting exists in UI as session-only fiction — no API.
- **Missing API:** staff reply/visibility transitions (in the 501
  PATCH), ⬜ portal creation is `POST /portal/issues` (F12);
  complaint↔finding relationship undecided (a complaint is not a
  finding until the owner says staff may convert one).
- **Required data:** complaint + replies ported (🧩); promotion to the
  contract catalog pending (§5).
- **Dependencies:** PO-08 (what customers see incl. resolution notes),
  PO-03 (who replies/closes), F12 portal identity for customer-raised
  items, F12 notifications for alerts.
- **Tests:** add visibility battery (internal replies never serialize
  to portal DTOs), status lifecycle, audit on visibility changes.
- **Acceptance:** (1) internal notes provably absent from every
  customer-facing payload (test-asserted); (2) customer sees status +
  approved replies only; (3) no silent conversion into findings.

### F12 — Customer portal & notifications (WhatsApp/email)

- **Today:** portal = 12 UI pages on fixtures behind the _owner_
  login; **zero portal API routes**. Notifications: ✅ outbox intents
  are written atomically by intake + 👁 `GET /admin/notifications`
  (no payloads/phones exposed); **nothing sends**; no sender port, no
  worker, no webhook route. Approved direction (management): official
  WhatsApp + portal in the first production release — assets/accounts
  do not exist yet.
- **Missing API:** ⬜ all 12 `/portal/*` operations (overview, profile
  GET/PATCH, projects[/{id}], quotations + decision, issues GET/POST,
  documents, reports, handover, warranty-requests POST), ⬜
  `POST /admin/notifications/{id}/review|retry`, ⬜
  `POST /webhooks/whatsapp`; new ports: `NotificationSenderPort`,
  outbox worker claim/mark methods.
- **Required data:** §2.8 portal projections defined in the contract
  (deliberately narrower than staff DTOs); outbox intent ported;
  delivery attempts/status extension needed with the worker.
- **Dependencies:** **PO-01** (WhatsApp number strategy — new vs
  coexistence/migration, Meta account owner, alert recipients,
  consent + template approvals, event catalog), **PO-02** (budget +
  payment method + Vercel plan), **PO-08** (field-by-field portal
  visibility), **PO-17** (portal users per customer), PO-07 (company
  details for Meta verification), TECH-06 (worker + retries), TECH-08
  (email provider/fallback), F6 identity (portal accounts), F4/F8/F10
  upstream data. Meta onboarding has external lead time — start
  paperwork in parallel with W0 (plan §6), never block storage on it:
  **a business write must never wait for, or fail because of, a
  notification.**
- **Tests:** add CT-SEC portal IDOR battery (**release gate**:
  cross-customer everything ⇒ 404), CT-NOTIF (outbox atomicity,
  idempotent send attempts, webhook signature + replay handling,
  opt-out honored), projection snapshot tests vs §2.8.
- **Acceptance:** (1) IDOR battery 100% green before any portal data
  is real; (2) every outbound message traceable to a committed outbox
  intent with template params limited to `{reference}`-class data
  (no PII in params beyond approved templates); (3) portal shows only
  PO-08-approved fields — verified by DTO snapshot tests; (4) WhatsApp
  outage changes _nothing_ about business writes.

### F0 — Platform: audit, overview, exports, system

- **Today:** ✅ `GET /admin/audit-logs` (intake) + 🧩 `GET
/admin/audit-events` (foundation) — two read surfaces over one
  conceptual trail, unification is an adapter task (handoff §5); ✅
  overview counts, system status, health/ready, owner-gated OpenAPI.
- **Missing API:** ⬜ `POST /admin/audit-log-exports`,
  `GET /admin/audit-log-exports/{id}`,
  `POST /admin/audit-log-exports/{id}/download-link`.
- **Dependencies:** TECH-04 (export formats/worker/limits/retention),
  PO-03 (who may read/export audit), PO-16 (retention/privacy —
  launch gate), TECH-02 (CSRF — documented recommendation in
  `backend-architecture.md` §7.8, needed before production write
  expansion).
- **Acceptance:** exports are async, capped, expiring, and
  themselves audited; audit storage is one trail behind both
  surfaces (or the surfaces are formally merged by contract change).

---

## 3. Business decisions requiring the company owner

Full register: API contract §9.1 + requirements §10/§12. The
**minimum** that unblocks each slice:

| ID                            | Decision (shortest form)                                                                                                                                                                                                                            | Unblocks                                                                  |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| PO-03                         | Role matrix + sensitive authorities + assignment source/scoping                                                                                                                                                                                     | F2 triage, F3, F6, almost every write — **decide first**                  |
| PO-12                         | Duplicate-customer + request-linking policy                                                                                                                                                                                                         | F2 linking, phone uniqueness in schema                                    |
| PO-13                         | Inspection result fields + correction/cancel rules                                                                                                                                                                                                  | F3                                                                        |
| PO-04                         | Review gate/tax/currency/validity/off-portal decisions                                                                                                                                                                                              | F4, F9                                                                    |
| PO-04A                        | Post-approval revision policy (Q1/Q2/Q3 — one)                                                                                                                                                                                                      | F4→F5 eligibility                                                         |
| PO-05                         | Contract issue/sign method + evidence; handover acknowledgement                                                                                                                                                                                     | F5, F7 creation, F10                                                      |
| PO-19 / PO-15                 | Contracts-per-revision; projects-per-contract                                                                                                                                                                                                       | F5, F7                                                                    |
| PO-18                         | Progress derivation (+ approval step?)                                                                                                                                                                                                              | F7 progress truth                                                         |
| PO-06                         | File types/sizes/retention; mandatory handover checklist                                                                                                                                                                                            | F8, F10                                                                   |
| PO-14                         | Warranty periods/scope                                                                                                                                                                                                                              | F10                                                                       |
| PO-08 / PO-17                 | Portal-visible fields per screen; portal users per customer                                                                                                                                                                                         | F11, F12                                                                  |
| PO-01 / PO-02 / PO-07         | WhatsApp number/Meta owner/templates; budget+payment+Vercel plan; official company details                                                                                                                                                          | F12 (+ launch)                                                            |
| PO-16 / PO-10 / PO-11 / PO-09 | Retention & privacy; default phone country; reference formats; published content                                                                                                                                                                    | launch gate / F1 polish / cosmetic                                        |
| **New (this pass)**           | Finance scoping: are _payment certificates (مستخلصات)_, invoices, and receipts distinct documents with distinct lifecycles (recommended: keep distinct), and are supplier purchases the whole expense ledger or is a general expense record needed? | F9 modeling — candidate register addition (e.g. PO-20) at contract freeze |

Note: the requirements doc's §12 signature checklist (scope, WhatsApp,
budget, roles, templates, sign-off path, alert owner, company details)
is still **unsigned** — PO answers should be recorded against it so
"approved" is provable later.

## 4. Technical questions for the database engineer

The blocking set is unchanged — **handoff §13** (technology, version,
schema/API or greenfield, deployment environment, migration process,
then DB-02/04/05/06/07/08/09/10). Feature-specific storage questions
that ride along (no answers assumed):

1. Aggregates (quotation revisions, contract change orders, purchase
   lines, handover checklist): JSON columns vs child tables — and what
   that means for the "append-only diary/progress" and
   "immutable decided revisions" guarantees.
2. One audit storage behind the two read projections (intake
   `AuditEntry` ↔ foundation `AuditEventRecord` field union) — propose
   the stored shape.
3. Search folding behavior for Arabic + formatted phones (collation/
   extension) vs the fake's semantics the CT-PORT suite asserts.
4. Reference-sequence implementation under concurrency (unique —
   gapless explicitly not required).
5. Rate-limit + idempotency stores: same database or separate shared
   store, given serverless multi-instance execution?
6. Outbox worker claiming (when F12 lands): can your store do an
   atomic claim-with-lease for the sender worker?
7. Object storage (DB-09) and whether signed-URL flows fit your
   platform (F8).

## 5. Engineering decisions & reconciliation (our side, no DB needed)

- **TECH-01…08** (contract §9.3): session revocation + KDF; **TECH-02
  CSRF** (Origin/Fetch-Metadata guard — recommendation written,
  implement with W2 or before first production write expansion);
  TECH-03 rate limits/hash/anti-spam; TECH-04 exports; TECH-05
  uploads; TECH-06 outbox worker; TECH-07 PDF; TECH-08 email.
- **Contract reconciliation (v1.1 amendment at freeze):** promote the
  29 🧩 operations (finance, complaints, audit-events, system) into
  the catalog or explicitly retire them; resolve path-shape deltas
  (handover nesting, `weekly-reports` vs `reports` naming);
  schematize intake list payloads in OpenAPI (handoff M5).
- **Known small follow-ups:** structural error-mapping for intake
  `http.ts` parity; read-model aggregate port methods if list-paging
  composition proves hot at real scale (measure first).

## 6. Prioritized execution plan (after the engineer responds)

Aligned with requirements phases 0–7. Each wave ends with: contract
suites green → QA deployment → witnessed verification → _separate_
owner production decision. **No wave makes anything
"production-operational" by itself.**

| Wave                  | Content                                                                                                                                        | Entry criteria                                        | Exit evidence                                                                                                                                              |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **W0 Adapter**        | Register real adapter (intake + foundation ports); audit unification; env on QA only; start Meta/WhatsApp paperwork in parallel (PO-01 assets) | Handoff §13 answers (DB-01…07 minimum)                | Both CT-PORT suites unchanged-green on disposable test DB; migrations-from-empty in CI; backup→restore drill witnessed; QA intake persists across restarts |
| **W1 Leads core**     | F1 form cutover prep; F2 request triage + linking; customers live on adapter                                                                   | W0; PO-03 (triage authorities), PO-12                 | E2E: submit→triage→link→customer summary on QA; §4.1 transition battery                                                                                    |
| **W2 Identity**       | F6 staff users/invitations/revocable sessions; engineers surface; TECH-02 CSRF guard                                                           | PO-03 full matrix; TECH-01 (+08 channel)              | CT-SEC identity battery; owner flow unchanged; CSRF guard tests                                                                                            |
| **W3 Inspections**    | F3 scheduling + completion (+ parent transitions)                                                                                              | PO-13; W1/W2                                          | CT-WF inspection lifecycle; assignment rules enforced                                                                                                      |
| **W4 Commercial**     | F4 quotations workflow; F5 contracts + change orders; F7 project creation                                                                      | PO-04, PO-04A, PO-05, PO-19, PO-15                    | CT-WF-Q + CT-WF-C; end-to-end lead→signed contract→project on QA                                                                                           |
| **W5 Execution+docs** | F7 writes (milestones/diary/progress/findings/reports); F8 files; workspace aggregate                                                          | PO-18, PO-06, DB-09, TECH-05                          | Derivation battery; upload/download auth matrix                                                                                                            |
| **W6 Finance**        | F9 writes; catalog promotion of finance DTOs; certificates if scoped                                                                           | PO-04 (currency/tax), new finance scoping (§3), PO-03 | Money battery; audited mutations; dues origination from contracts                                                                                          |
| **W7 Portal+notify**  | F12 portal API + UI wiring; F10/F11 completion paths; WhatsApp/email sending + webhooks                                                        | PO-08, PO-17, PO-01, PO-02, PO-14; TECH-06/08         | **IDOR battery = release gate**; CT-NOTIF; template/consent compliance evidence                                                                            |
| **W8 Hardening**      | F0 exports; PO-16 retention jobs; observability; launch checklist + rollback rehearsal                                                         | TECH-04; PO-16                                        | Restore drill re-run; launch gate checklist signed (§12 of requirements)                                                                                   |

**What can proceed before the engineer replies (no DB needed):**
owner decisions (§3 — PO-03 first), Meta/WhatsApp asset paperwork,
contract v1.1 reconciliation prep, CT-WF/CT-SEC suite authoring
against the fake, TECH-02 CSRF guard behind the ports. None of that
requires — or should wait for — a database choice, and none of it
changes Production.
