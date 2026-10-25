# Database-engineer handoff — BLACK X backend integration

**For:** the external database engineer. **From:** application team (Arena/ChatGPT).
**Verified against:** branch `arena/b04f8c7e-blackx-construction-finishing`
(draft PR #8 — **not merged, not in Production**), foundation commit
`4d14ccb` plus the follow-up contract-alignment fixes (M1–M4, §12),
2026-10-25. Test suite: **254/254 passing**, incl. 38 adapter
contract tests.

**Purpose:** everything you need to (a) tell us what you're building
and (b) implement the persistence adapter behind our existing ports —
without us assuming your database technology, schema, or current
progress. **We do not know your technology choice, version, schema, or
implementation status, and this document deliberately does not guess.**

Reading order: this handoff → [`database-integration-contract.md`](./database-integration-contract.md)
(the normative capability/acceptance detail) →
[`api-contract-v1.md`](./api-contract-v1.md) §5/§8/§9/§10 → the port
code (`src/server/foundation/ports.ts`, `src/server/intake/ports.ts`)
→ the fake adapters beside them (reference behavior). No secrets
appear in any of these documents, and none should be sent back —
env-var **names** only.

---

## 1. Existing architecture and repository boundaries

```
Next.js route handlers (src/app/api/v1/**)        auth + transport only
  → application services (src/server/foundation/services.ts,
      src/server/intake/service.ts + admin-reads.ts)
        validation, workspace scoping, idempotency, version checks,
        audit/outbox decisions — NO database/ORM imports anywhere
  → repository ports (src/server/foundation/ports.ts,
      src/server/intake/ports.ts)                 DTO/record shapes only
  → YOUR adapter (does not exist yet)  |  in-memory fake (dev/test only)
```

Rules that keep this database-neutral:

- Services and routes never see ORM entities, SQL, or vendor SDKs.
  Ports exchange the plain record types in the two `ports.ts` files.
- Adapter selection is by env-var **name** `DATA_ADAPTER`
  (`src/server/foundation/config.ts`, intake `runtime.ts`). Only
  `fake` is registered; it is **refused in production**, and with
  anything unset/unknown the business endpoints fail closed (503).
  There is no fallback to sample data, ever.
- Your adapter plugs in by (1) implementing the ports, (2) agreeing
  an adapter name with us, (3) registration in the two runtime files.
  Engine, schema, ORM/driver, and migrations behind the ports are
  entirely yours — conformance is **behavioral**, proven by the
  contract suites in §10.
- The application is a single Next.js app on Vercel (Production +
  a QA project), deployed from GitHub. Privileged DB access is
  server-side only; the browser never receives credentials.

## 2. API DTOs and request/response formats

- Wire types (single TS source): `src/lib/api-types.ts`. Machine
  contract: `docs/openapi.json` (OpenAPI 3.1; 49 paths, 73 operations,
  each marked `implemented` / `read-only` / `planned` with blocking
  decision IDs). Prose contract: `docs/api-contract-v1.md` §2/§3.
- Lists: `Page<T> = {items, total, page, pageSize}`; query `page`,
  `pageSize` (≤100), `sort` (allow-listed, `-` = desc), `search`,
  typed filters. Invalid/unknown params ⇒ `400 INVALID_QUERY`.
- Errors (every endpoint): `{error:{code, messageKey, fieldErrors?,
  details?}}` — stable codes + localization keys, never prose, never
  internals. Unknown input fields ⇒ `422 …["unknownField"]`;
  server-owned fields ⇒ `422 …["readOnly"]`.
- Creates require an `Idempotency-Key` header (§5); PATCHes on
  versioned aggregates require the expected `version`.
- DTOs are **never** your storage rows: services map records → DTOs
  explicitly (`src/server/foundation/dto.ts`); fields like
  `workspaceId`, password hashes, and document `storageRef` never
  reach the wire. Your column layout may differ from both.

## 3. Required entities and relationships

Normative shapes: the two `ports.ts` files. Overview (`→` references):

**Confirmed — needed for the first integration:**

| Entity | Relationships / notes |
|---|---|
| Intake request (+ status history), contact message | `customerId` always `null` at intake; submitted via public API |
| Audit entries (two projections — one trail, see §5) | append-only; reference-only metadata |
| Notification outbox intents | → entity; unique `idempotencyKey`; params carry `{reference}` only |
| Customer | ← projects/quotations/contracts/dues/payments/complaints |
| Project | → customer, contract, quotation (opt.); children below |
| Milestone, diary entry*, progress measurement*, finding (issue/quality), weekly report, handover (+ checklist), warranty request | → project (*immutable: no update/delete) |
| Inspection | → intake request, engineer (a staff **user** — no engineer table) |
| Quotation (aggregate: revisions + priced items), contract (aggregate: + change orders) | quotation → customer/request; contract snapshots an approved revision |
| Document (+ file versions) | → polymorphic owner `{entityType, entityId}`; `visibleToCustomer` default false |
| Due (receivable), payment (allocations → dues), supplier, purchase (+ lines) | finance — **foundation-proposed** shapes (not yet in api-contract v1) |
| Complaint (+ replies with customer/internal visibility) | foundation-proposed |
| User (staff/portal identity) | roles per contract §1.3; password hash never leaves storage |
| Platform stores | reference sequences, scoped idempotency (×2 shapes), rate limits |

**Unresolved — do NOT build storage behavior that presumes these**
(full register in §12): staff role/predicate enforcement (PO-03),
customer duplicate/merge + request→customer linking (PO-12 — so **no
unique constraint on customer phone yet**), inspection result fields
(PO-13), quotation tax/currency/review/decision rules (PO-04/04A),
contract issuance/signature (PO-05), file types/retention (PO-06),
portal visibility (PO-08), warranty coverage (PO-14), one-project-per-
contract (PO-15), portal account cardinality (PO-17), progress
derivation (PO-18), contract multiplicity (PO-19), notification
templates/sending (PO-01). Endpoints gated on these return **501**
today; the records above exist so reads/import have a stable target.

## 4. Identifier, timestamp, nullability, versioning conventions

- `id`: opaque string, immutable, non-sequential. Services currently
  mint IDs via an injected `IdGenerator`; if your store must own ID
  generation, say so in your reply — it's a port conversation.
- `reference`: human code, **unique per entity kind**, minted via
  `ReferenceSequence.next(kind)` (kinds: `request`, `contact_message`,
  `customer`, `project`, `finding`, `inspection`, `quotation`,
  `contract`, `warranty`, `supplier`, `purchase`, `complaint`).
  Formats are provisional (PO-11); uniqueness is contractual now,
  gaplessness is **not** promised.
- Timestamps: ISO-8601 **UTC** strings at the port boundary;
  calendar dates `YYYY-MM-DD`. Store/compare in UTC. The server is
  the only clock authority for created/updated/recorded fields;
  "reported" times (e.g. `measuredAt`) are stored separately.
- Nullability: optional record fields are **absent**, not null, when
  unset — except deliberate nullable fields (`customerId: null` on
  intake requests/inspections, `assigneeId`, PATCH-cleared fields).
  Map absent vs null consciously if your store distinguishes them.
- Versioning: mutable aggregates carry integer `version` starting at
  1. `update(record, expectedVersion)` must compare-and-swap
  atomically and raise `VersionConflictError` on mismatch with **no
  partial write**. Immutable records (diary, progress, audit) have no
  update/delete methods — please don't add any.
- Money: integer **minor units** + per-record ISO-4217 `currency`.
  Never floats. (UI fixtures use major-unit display numbers — they
  are not an import source; see §7 of the integration contract.)
- Enums are stable string keys exactly as typed in the ports.
  Bilingual *catalogue* text uses `{ar, en}` (`LocalizedText`);
  user-generated text is a single string as typed.

## 5. Transaction and idempotency requirements

- **`UnitOfWork.run(work)`** (one per port family): every repository
  write inside — business + audit + outbox — commits or rolls back
  atomically; read-your-own-writes inside; success returned only
  after commit. Suites fault-inject mid-transaction and require zero
  partial rows. Mechanism/isolation are yours (**DB-05 — tell us**).
  This is the single most vendor-sensitive requirement (§11).
- **Scoped idempotency** (public intake + authenticated creates):
  uniqueness tuple `(scope, method, routeTemplate, key)`; store the
  payload **hash** (SHA-256 from the service), state/lease, HTTP
  status, and a minimal safe result (receipt / resource id) — never
  raw bodies or PII. `claim` is atomic **before** any effect:
  concurrent duplicate ⇒ `in_progress` (never executes); same key +
  different hash ⇒ `payload_mismatch`; completed + same hash ⇒ replay
  with no second business/audit/outbox write. `complete` must be
  consistent with the business commit; rollback frees the claim via
  `releaseRetryable`. Retention ≥ 24 h (public) / ≥ 7 d
  (authenticated).
- **Audit is append-only**: no update/delete may exist. Intake
  `AuditEntry` and foundation `AuditEventRecord` are two projections
  of one trail — please store one structure (field union: actor
  kind/id/role, action, entity type/id/reference, correlationId) and
  tell us the mapping.
- **Outbox**: `idempotencyKey` unique per committed occurrence;
  worker-side claim/mark methods arrive with the sending slice
  (not required now).

## 6. Workspace scoping and authorization expectations

- Every record carries `workspaceId`; **every** port operation is
  workspace-scoped (cross-workspace ⇒ null/empty, indistinguishable
  from missing). Suggested index shapes are in the integration
  contract §4.
- Today there is exactly **one** workspace, resolved server-side
  (`BLACKX_WORKSPACE_ID` env name, default `blackx`) — never from
  client input. Multi-company is prepared in the model, **not
  enabled**: no tenant switching exists or is claimed.
- Authorization today: the single company-owner session only
  (provisional until the owner's role matrix, TBD-PO-03). Your
  adapter must never widen access: it receives already-scoped queries
  and must apply them faithfully. Future staff/portal predicates will
  be enforced in services; storage must not bypass them (e.g. no
  unscoped "list everything" backdoors).

## 7. Migration ownership and deployment coordination

- **You own** migrations: tool, location, naming. Requirements:
  versioned, apply **from empty**, re-runnable in CI, plus a
  one-command **disposable test-database** procedure (create →
  migrate → reset-to-empty) with synthetic data only.
- No legacy data migration exists (management decision) and **no
  production seeding**: the app must run correctly on an empty store
  (it does today — reads return empty pages).
- Schema changes that alter port-observable behavior are contract
  changes: discuss first; suites + docs update in the same change.
  **No destructive migration against Production data without a
  separate owner-approved gate.**
- Enablement sequence (later, authorized): register adapter name →
  contract suites on your test DB → API suites → set `DATA_ADAPTER`
  on **QA only** → end-to-end verification → witnessed
  backup→restore drill → owner decision for Production. The app side
  needs no code change beyond registration if the ports hold.

## 8. Connection configuration (no credentials here)

- Selection: `DATA_ADAPTER=<name we agree>`.
- Connection settings: **env-var names you define** — please list
  them per environment (dev/test/staging/prod): pooled vs direct
  endpoints, SSL mode, limits. Values are provisioned out-of-band;
  never commit, print, or log them (our logger redacts
  credential-shaped keys as defense-in-depth only).
- The app runs **serverless on Vercel**: please state the pooling /
  HTTP-driver story and connection limits, and any cold-start or
  idle-timeout behavior we must design around (DB-01/DB-06).

## 9. Required repository adapter methods (complete inventory)

**Foundation (`src/server/foundation/ports.ts`)** — generic aggregate
repository, instantiated per entity:

```
Repository<T>:        create(record) · byId(workspaceId, id) · list(query)
                      update(record, expectedVersion) · count(workspaceId)
ImmutableRepository<T>: create · byId · list · count        (no update)
Entities: users(+byEmail) · customers(+byPhone) · projects · milestones ·
  diary(imm.) · progress(imm.) · findings · reports · inspections ·
  quotations · contracts · handovers · warrantyRequests · documents ·
  dues · payments · suppliers · purchases · complaints
AuditEventRepository: append(entry) · query(AuditEventQuery)   (append-only)
ReferenceSequence:    next(kind)
GenericIdempotencyStore: claim · complete · releaseRetryable
FoundationUnitOfWork: run(work)        Clock.now() · IdGenerator.newId()
```

Each `list` takes its typed query (workspaceId, page, pageSize,
sortField, direction, search?, from/to?, entity filters — see the
`*ListQuery` types) and returns `Page<T>` with deterministic order
(sort field + `id` tiebreak).

**Intake (`src/server/intake/ports.ts`)** — already live behind the fake:

```
RequestRepository: create(record, historyEntry) · byId · list · count
ContactMessageRepository: create · byId · list · count
AuditLogRepository: append · query                       (append-only)
NotificationOutboxRepository: enqueue · listByEntity · list
IdempotencyStore: claim · complete · releaseRetryable
RateLimitStore: hit(key, limit, windowSec)  — must be cross-instance shared
ReferenceSequence · UnitOfWork.run · Clock · IdGenerator (shared shapes)
```

**Not yet ported (do not build yet):** workflow-specific methods from
api-contract §5.3 (request mutations/linking, quotation revision
lifecycle, contract issuance…), `InvitationRepository`, user
session/password lifecycle methods, outbox worker methods,
`AuditExportRepository`, `FileStoragePort`, `NotificationSenderPort`.
They arrive with their decision-gated slices as explicit port
additions (contract amendments).

## 10. Running the contract tests against your implementation

Prereqs: repo checkout (this branch), `npm ci`. Suites are
behavior-only — they must pass **unchanged**; editing a suite to pass
is a contract change (discuss first).

```bash
npm test                    # everything (254 tests) — must stay green
npm run test:contract       # contract suites only (38) on default adapters
```

Per-suite adapter selection (verified — each suite has its own env
var, so all three can be selected in a single run):

| Suite | Env var | Today's fake name | File |
|---|---|---|---|
| Probe (harness self-test) | `CONTRACT_ADAPTER` | `memory-dummy` | `tests/contract/probe.contract.test.ts` |
| Intake ports | `INTAKE_CONTRACT_ADAPTER` | `fake-memory` | `tests/contract/intake-ports.contract.test.ts` |
| Foundation ports | `FOUNDATION_CONTRACT_ADAPTER` | `fake` | `tests/contract/foundation-ports.contract.test.ts` |

```bash
# All suites against your registered adapter, one run:
INTAKE_CONTRACT_ADAPTER=<yours> FOUNDATION_CONTRACT_ADAPTER=<yours> npm run test:contract
```

Note the fake names differ per suite (`fake` vs `fake-memory`) —
registered names are stable; use each suite's own name with its own
variable. Naming an unregistered adapter fails loudly at collection
(never silently falls back).

To register your adapter: implement `ContractAdapter<TPort>`
(`create` = completely empty instance, `reset` = your documented
empty-again path, `dispose` = release connections), add it to each
suite's registry under the agreed stable name, point it at your
**disposable test database**, and run. Acceptance bar: integration
contract §8 (suites unchanged + API suites + migrations-from-empty +
restore drill).

## 11. Portability — honest limits and support policy

**Portable on any mainstream store:** CRUD + typed filters, offset
pagination with deterministic ordering, unique constraints,
append-only audit, workspace scoping, integer money, UTC timestamps,
string enums.

**Needs atomic primitives (concept portable, mechanism yours):**
version compare-and-swap updates; the scoped idempotency claim
(unique tuple + insert-or-conflict); reference sequences (unique —
not gapless); completion-consistent-with-commit.

**Vendor-sensitive (your §13 answers decide feasibility):**
multi-record transactions incl. audit+outbox in one commit (native
on RDBMS; document stores need multi-document transactions or a
redesign conversation); Arabic search folding (the fake folds case +
Arabic-Indic/Persian digits and matches formatted phones — your
collation/extension behavior must be documented, diacritics are an
open question); nested aggregates (quotation revisions, purchase
lines, checklists — JSON columns vs child tables is your mapping
call; ports exchange whole aggregates either way); cross-instance
rate limiting (may be separate infra); serverless connection limits.

**Support policy:** a database is **supported only after** its
adapter passes both contract suites unchanged on a disposable test
DB, the API suites pass with it wired, migrations apply from empty
in CI, a backup→restore drill is witnessed, and QA end-to-end
verification succeeds — then Production is a separate owner gate.
Until then it is *not supported*, regardless of engine reputation.
We will not promise automatic compatibility with every database, and
we are deliberately adding **no ORM/SDK/dependency** before your
choice is known (verified: none exists in the repo today).

## 12. Readiness assessment (verified) and known mismatches

**Ready for first integration:** intake durability; customers (full
write path incl. idempotency + audit); read paths for projects and
all other domains; unified audit storage; references/idempotency/
rate-limit stores. Ports + DTOs are sufficient for this scope.

**Not ready (by design — decisions, not code):** project *writes*
(creation is contract-derived — **please do not invent project write
semantics**), request staff mutations/linking, quotation/contract
workflows, inspection writes, document uploads, identity lifecycle,
notification sending, customer portal.

**Known mismatches** (found in review, 2026-10-25; M1–M4 since fixed
on this branch — kept here as the audit trail; none block your §13
answers or read-path implementation):

| # | Item | Where | Status |
|---|---|---|---|
| M1 | `GET /admin/customers/{id}` lacked the `summary{…}` block api-contract §3.3 describes | `services.ts` `getCustomer` | **Fixed** — summary implemented (`requests: []` until PO-12 linking; `openFindings` = open + in_progress); OpenAPI `CustomerDetail` |
| M2 | Create-input phone field named `phone`; contract §2.4 said `phoneE164` | contract §1.5/§2.4 | **Frozen** — inputs are `phone` (pre-normalization), outputs `phoneE164`; contract aligned |
| M3 | `engineers` listed in both `readOnly` and `planned` domain status | `config.ts` `DOMAIN_STATUS` | **Fixed** — planned only; disjointness regression test added |
| M4 | Contract-test env-var collision (foundation suite shared the probe's `CONTRACT_ADAPTER`) | `tests/contract/*` | **Fixed** — dedicated `FOUNDATION_CONTRACT_ADAPTER` (§10) |
| M5 | Intake list payloads use a placeholder OpenAPI schema; field sets are normative in contract §2.4/§2.7 + `admin-reads.ts` | `openapi.ts` | Open — schematize later |
| M6 | `derivedStatus` customer filter (contract §3.3) rejected `400` rather than silently wrong | `services.ts` | Conscious; documented in contract §3.3; revisit with PO-12 |
| G1 | No explicit CSRF/Origin verification on foundation mutations yet (SameSite=Lax + JSON only) | `admin-http.ts` | Open — risk + recommended control documented in `backend-architecture.md` §7 (TBD-TECH-02, pre-production) |

## 13. Required answers and artifacts — please return these

**First, the five essentials (nothing assumed):**

- [ ] **1. Chosen database technology** (engine/product)
- [ ] **2. Version** (and hosting: provider, region, plan limits)
- [ ] **3. Current schema or API** — ERD/DDL if tables exist, or
      explicit "greenfield"; location of any existing access-layer code
- [ ] **4. Deployment environment** — how dev/staging/prod are
      separated; how our Vercel serverless app connects (pooler/HTTP
      driver, connection limits, SSL)
- [ ] **5. Migration process** — tool, file locations, who reviews/
      runs them per environment, rollback approach

**Then the full register (TBD-DB-01…10 mapped):**

- [ ] DB-02 ORM/driver/query builder + version (or raw driver)
- [ ] DB-04 Conventions: PK/ID strategy, naming, enum storage,
      timestamp/timezone handling, soft-delete (if any), **text-search
      folding behavior** (case/Arabic/digits/diacritics)
- [ ] DB-05 How `UnitOfWork` (atomic business+audit+outbox, §5)
      maps to your transaction mechanism + isolation level; how the
      atomic idempotency claim/completion is made consistent
- [ ] DB-06 Env-var **names** per environment (never values)
- [ ] DB-07 Disposable test-database procedure (one command:
      create → migrate from empty → reset) + seed approach
- [ ] DB-08 Backups/PITR/retention + documented restore steps +
      who runs the pre-production restore drill with us
- [ ] DB-09 Object storage: provided by you (which?) or ours to build
- [ ] DB-10 Schema-change workflow + expected turnaround

Artifacts that unblock fastest: current DDL/ERD (if any), a link/path
to your access-layer code if it exists, and the test-DB procedure —
everything else can follow in writing.

**Unresolved on our side (no action for you; listed so nothing looks
decided):** owner decisions PO-01…PO-19 (+PO-04A) and engineering
choices TECH-01…08 — full register with blockers in
`docs/api-contract-v1.md` §9. Of these, PO-12 (customer phone
uniqueness) most affects your schema choices today: **do not add a
unique constraint on customer phone until it's decided.**

## 14. First integration scope and the exact next step

**First integration (once §13 lands):** your adapter behind the
intake ports + foundation customers/projects-reads/audit — in that
order — proven by the unchanged contract suites on your disposable
test DB. Project **writes** stay out of scope until PO-05/PO-15/PO-03
are decided.

**Exact next implementation step after your reply** (our side,
separately authorized): (1) review your answers against §11 and
record any port amendments as contract changes; (2) register your
adapter name in `foundation/config.ts` + both runtimes + both
contract-suite registries; (3) run both CT-PORT suites + API suites
against your test DB and iterate; (4) enable on **QA only**,
end-to-end verify; (5) restore drill; (6) owner gate for Production.
(The earlier prep items — M1–M4 — are already fixed on this branch,
§12.) **Until your reply arrives, application work on persistence is
paused by design** — the ports, suites, and this handoff are the
stable target.
