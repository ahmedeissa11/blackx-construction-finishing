# Database integration contract — BLACK X backend foundation

**For:** the database engineer. **From:** application team (Arena/ChatGPT).
**Scope:** exactly what a real database adapter must implement so the
already-built application becomes durable. This document selects **no**
database engine, ORM/driver, physical schema, naming convention, or
migration strategy — those are entirely yours (API contract §5/§10,
TBD-DB-01…10). Conformance is **behavioral**: your adapter is
integrated when the shared contract suites pass against it unchanged.
The intake-specific predecessor is
[`db-integration-handoff.md`](./db-integration-handoff.md); this
document generalizes it to the full foundation and supersedes it where
they overlap (intake details in the handoff remain normative).

No secrets belong in this document or in chat. Env-var **names** only.

## 1. What exists today (integrate, don't rebuild)

- Services/routes depend only on TypeScript port interfaces:
  `src/server/intake/ports.ts` (public intake + staff reads, live) and
  `src/server/foundation/ports.ts` (all other domains). The in-memory
  fakes beside them are reference implementations of the required
  *observable behavior* — copy their semantics, not their storage.
- Adapter selection is env-gated (`DATA_ADAPTER`, name only). `fake`
  is refused in production; routes fail closed (503) until your
  adapter is registered under a name we agree on in
  `src/server/foundation/config.ts` (`REGISTERED_ADAPTERS`) and
  `runtime.ts` (plus intake's `runtime.ts`).
- Wire contract: `docs/openapi.json` + `docs/api-contract-v1.md`.
  Shared TS wire types: `src/lib/api-types.ts`.

## 2. Entities and relationships (logical, not physical)

Record shapes are normative in the two `ports.ts` files. Summary
(`→` = references by ID; your keys/constraints realize them):

| Domain | Records (ports) | Key relationships |
|---|---|---|
| Identity | `UserRecord` (roles §1.3; engineers are staff-role users — no engineer table) | `customerId` set iff role CUST |
| Customers | `CustomerRecord` | ← projects, quotations, contracts, dues, payments, complaints |
| Intake (live) | `IntakeRequestRecord` + history, `ContactMessageRecord`, `AuditEntry`, `OutboxIntent` | request `customerId` always null at intake (linking is a later staff workflow) |
| Projects | `ProjectRecord` | → customer, contract, quotation?; ← milestones/diary/progress/findings/reports/handover/warranty/documents/dues/payments/purchases |
| Operations | `MilestoneRecord`, `DiaryEntryRecord`* , `ProgressMeasurementRecord`*, `FindingRecord`, `WeeklyReportRecord`, `InspectionRecord` | → project (inspection → request + engineer user) |
| Commercial | `QuotationRecord` (aggregate incl. revisions+items), `ContractRecord` (aggregate incl. change orders) | quotation → customer/request?; contract → quotation revision snapshot |
| Handover/warranty | `HandoverRecord` (checklist), `WarrantyRequestRecord` | → project |
| Documents | `DocumentRecord` (versions; per-version opaque `storageRef`) | → owner {entityType, entityId} (polymorphic) |
| Finance (foundation-proposed) | `DueRecord`, `PaymentRecord` (allocations[] → dues), `SupplierRecord`, `PurchaseRecord` (lines[]) | → customer/project/supplier |
| Engagement | `ComplaintRecord` (replies[]) | → customer, project? |
| Audit | `AuditEventRecord` + intake `AuditEntry` | append-only; **unify storage** (§4) |
| Platform | `ReferenceSequence`, `IdempotencyStore` (×2 shapes), `RateLimitStore` (intake) | see §4 |

`*` immutable: their ports expose **no update/delete** — please don't
add one. Aggregates (quotation, contract) cross the port whole;
whether you store revisions/items/lines nested or as related rows is
your mapping decision, isolated inside your adapter.

## 3. Identifiers, timestamps, conventions

- `id`: opaque, server-generated, immutable, non-sequential (format
  yours, TBD-DB-04). Services generate IDs via the injected
  `IdGenerator` today; if your store must own ID generation, tell us —
  that's a port-conversation, not a silent change.
- `reference`: human code, unique per entity kind, minted through
  `ReferenceSequence.next(kind)` (kinds in use: `request`,
  `contact_message`, `customer`, `project`, `finding`, `inspection`,
  `quotation`, `contract`, `warranty`, `supplier`, `purchase`,
  `complaint`). Exact formats are TBD-PO-11; uniqueness is required
  now, format later.
- Timestamps: ISO-8601 UTC strings at the port boundary; dates
  `YYYY-MM-DD`. Store/compare in UTC; the server is the only clock
  authority for created/updated/recorded fields.
- Money: integer **minor units** + ISO-4217 `currency` per record.
  Never floats. (Preview fixtures use major-unit display numbers; any
  import must convert deliberately — §7.)
- Enums: stable string keys exactly as typed in the ports (storage
  representation yours, TBD-DB-04).
- `version` starts at 1 and increments per successful update;
  `update(record, expectedVersion)` must fail atomically with
  `VersionConflictError` on mismatch (no partial write).
- Text search: the fake folds case + Arabic-Indic/Persian digits, and
  phone fields additionally match separator-free. Your folding
  behavior (TBD-DB-04) must be **documented** so suites assert yours
  rather than guess.

## 4. Required adapter capabilities (observable behavior)

1. **Workspace scoping** on every operation: records carry
   `workspaceId`; cross-workspace reads return null/empty.
2. **UnitOfWork atomicity** (intake + foundation): all writes inside
   `run` — business, audit, outbox — commit or roll back together;
   read-your-own-writes inside; success only after commit. Fault
   injection mid-transaction must leave zero partial rows.
3. **Scoped idempotency**: uniqueness tuple `(scope, method,
   routeTemplate, key)`; store payload **hash**, state/lease, HTTP
   status, minimal safe result (intake receipt / resource ref),
   expiry (≥24 h public, ≥7 d authenticated). Atomic claim before any
   effect; concurrent duplicate ⇒ `in_progress`, never executes;
   completion consistent with the business commit; rollback releases
   via `releaseRetryable`. Raw bodies/PII are never stored.
4. **Append-only audit**: no update/delete may exist for audit rows.
   Foundation `AuditEventRecord` and intake `AuditEntry` are two
   projections of one trail — store them in one structure with the
   field union (actor kind incl. `public`, action/event, entity,
   reference, correlationId) and tell us the mapping. Audit payloads
   are reference-only (no PII columns of submitted data).
5. **Deterministic lists**: return `Page<T>`; ordering by the query's
   sort field/direction with an `id` tiebreak; filters/search/date
   bounds as typed in each query interface.
6. **Uniqueness enforced in storage**: entity `id`; `reference` per
   kind; scoped idempotency tuple; outbox `idempotencyKey`; user
   email (when user writes land).
7. **Shared rate limits** (intake `RateLimitStore`): cross-instance —
   an in-process map is explicitly insufficient on serverless.
8. **Defensive behavior**: port methods exchange plain records;
   returned objects must not alias mutable stored state.
9. **Object storage** (documents): not yet ported — a future
   `FileStoragePort` (contract §5.3) lands with the upload slice;
   `storageRef` in document versions is your opaque key meanwhile
   (TBD-DB-09: tell us if storage is yours or ours).

Suggested indexes (validate against your engine): `(workspaceId,
createdAt/id)` style list paths per entity; `(workspaceId, projectId)`
on project children; `(workspaceId, customerId)` on commercial/finance
rows; audit `(workspaceId, at, id)` + entity lookup; idempotency tuple
unique; reference unique per kind.

## 5. Migrations — ownership and workflow

- **Owner:** you (tool, location, naming). The application repo never
  hand-writes DDL for your engine.
- **Requirements:** versioned migrations that apply **from empty**,
  are re-runnable in CI, and come with a one-command disposable
  test-database procedure (create → migrate → reset-to-empty), per
  contract §8.2. Test data is synthetic only — never production dumps
  or real customer PII. Test env-var **names** distinct from prod.
- **Change process:** schema changes that alter port-observable
  behavior are contract changes — discuss first, update suites +
  docs in the same change (TBD-DB-10: tell us your review flow).
- **Production:** no destructive migration runs against Production
  data without a separate, explicit owner-approved gate. This
  foundation task changed no production schema, data, or deployment.

## 6. Connection configuration format

- Selection: `DATA_ADAPTER=<agreed-name>` (already wired).
- Connection details: **env-var names you define** (e.g. your
  `DATABASE_URL`-style pooled/direct variants, SSL modes) — document
  the names per environment (dev/test/staging/prod) and provision
  values out-of-band; values are never committed, printed, or logged
  (the app's logger redacts credential-shaped keys, but treat that as
  defense-in-depth, not permission).
- Serverless reality (Vercel): tell us the pooling/HTTP-driver story
  and connection limits (TBD-DB-01). Privileged DB access stays
  server-side only; the browser never sees credentials.

## 7. Data import and mapping expectations

- There is **no legacy migration** (management decision) and **no
  production seeding**: the app must run correctly on an empty store
  (all reads return empty pages today — that's the expected initial
  state).
- Preview fixtures (`PV-*` IDs) are presentation sample data, **not**
  an import source and never production records. If the owner later
  wants sample data in a *test* DB, map explicitly: fixture amounts
  are major-unit display numbers → minor units need an owner-approved
  currency/scale decision (TBD-PO-04); fixture bilingual display text
  vs. single-string user text follows §1.5/DTO definitions; fixture
  IDs must be reminted, never preserved as real IDs.
- Schema-specific mapping stays inside your adapter. Where your
  existing schema (if any) differs from a record shape, propose the
  mapping on paper first — ports change by contract amendment, not by
  silent adapter coercion.

## 8. Acceptance — "ready to integrate" (contract §5.5/§8.2)

1. `tests/contract/intake-ports.contract.test.ts` **and**
   `tests/contract/foundation-ports.contract.test.ts` pass
   **unchanged** against your adapter on a disposable test DB:
   `CONTRACT_ADAPTER=<your-name> npm run test:contract`
   (we register your adapter name together; suite edits = contract
   change, discussed first).
2. `tests/intake-*.test.ts`, `tests/foundation-*.test.ts` pass with
   your adapter wired in both runtimes (incl. rollback freeing
   idempotency keys and 503 governance with the fake off).
3. Uniqueness (item 6 in §4) enforced in storage, demonstrated by
   test or DDL review.
4. Migrations from empty + reset procedure run clean in CI.
5. A timed backup→restore into a scratch environment is demonstrated
   once (you run it, we witness) **before** any production cutover.
6. Only then: register the adapter name, enable on QA, end-to-end
   verification, and bring the Production decision to the owner as a
   separate gate. Fake-green alone is never integration evidence.

## 9. What we need back from you (TBD-DB-01…10)

Engine+version/hosting/region & serverless access story · ORM/driver
& where your access layer lives · migration tool/locations & current
DDL if tables exist · conventions (PK format, enums, timestamps,
search folding) · how UnitOfWork + atomic idempotency claim map to
your transaction mechanism · env-var **names** per environment ·
disposable test-DB procedure · backups/PITR + restore steps & drill
owner · object-storage ownership · schema-change process/turnaround.

## 10. Explicitly not decided here

Staff roles/predicates (TBD-PO-03), customer duplicate/link policy
(PO-12), inspection result schema (PO-13), quotation tax/currency and
revision-after-approval (PO-04/04A), contract issuance/signature
(PO-05), document types/retention (PO-06), portal visibility (PO-08),
warranty coverage (PO-14), progress derivation (PO-18), notification
templates/sending (PO-01/TECH-06). Endpoints gated on these return
501 today; please don't build storage behavior that presumes them.
