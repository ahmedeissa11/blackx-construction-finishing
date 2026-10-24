# Database integration handoff — public-intake adapter (Batch 3)

**For:** the database colleague. **From:** application team (Arena/ChatGPT).
**Scope:** exactly what a real adapter must implement so the already-built
public-intake feature becomes durable — nothing more. This document
selects **no** database engine, ORM/driver, physical schema, naming
convention, or migration strategy. Those remain entirely yours
(API contract `docs/api-contract-v1.md` §5, §10; open items TBD-DB-01…10).
Conformance is **behavioral**: your adapter is integrated when the shared
contract suites pass against it unchanged.

No secrets belong in this document or in chat. Env-var **names** only.

## 1. What exists today (so you integrate, not rebuild)

- Endpoints live and tested against an in-memory fake:
  `POST /api/v1/public/inspection-requests`,
  `POST /api/v1/public/contact-messages`,
  `GET /api/v1/admin/requests[/{id}]`, `GET /api/v1/admin/contact-messages[/{id}]`,
  `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/notifications`,
  `GET /api/v1/admin/overview` (owner-gated operational reads).
- Application services depend only on TypeScript port interfaces
  (`src/server/intake/ports.ts`). The fake adapter
  (`src/server/intake/fake-adapter.ts`) is a reference implementation of
  the required *observable behavior* — copy its semantics, not its storage.
- Adapter selection is env-gated in `src/server/intake/runtime.ts`
  (`DATA_ADAPTER`); `fake` is refused in production and the routes fail
  closed (503) until your adapter is registered there under a new name
  we agree on.

## 2. Ports to implement (intake subset of contract §5.3)

All signatures/DTOs: `src/server/intake/ports.ts`. Summary:

| Port | Methods (today) | Records exchanged |
|---|---|---|
| `UnitOfWork` | `run(work)` | — (transaction boundary, §3 below) |
| `RequestRepository` | `create(record, historyEntry)`, `byId`, `list(query)`, `count` | `IntakeRequestRecord`, `RequestHistoryEntry` |
| `ContactMessageRepository` | `create`, `byId`, `list(query)`, `count` | `ContactMessageRecord` |
| `AuditLogRepository` | `append`, `query(AuditLogQuery)` → `Page<AuditEntry>` (filters: actorId/action/entityType/entityId/from/to; sort `at` + id tiebreak) — **append-only; no update/delete may exist** | `AuditEntry` |
| `NotificationOutboxRepository` | `enqueue`, `listByEntity`, `list(query)` → `Page<OutboxIntent>` (worker-side claim/mark methods arrive with the sender slice) | `OutboxIntent` |
| `ReferenceSequence` | `next(kind)` → unique human reference (`request`→`RQ-…`, `contact_message`→`MSG-…`; exact format TBD-PO-11) | string |
| `IdempotencyStore` | `claim`, `complete`, `releaseRetryable` (§4 below) | `IdempotencyClaim/Result`, `IntakeReceipt` |
| `RateLimitStore` | `hit(key, limit, windowSec)` → `{allowed, retryAfterSec}` — must be **shared across instances** (§1.9) | — |
| `Clock`, `IdGenerator` | `now()` ISO-8601 UTC, `newId()` opaque non-sequential (your format, TBD-DB-04) | — |

Record shapes map 1:1 to the DTO dictionary (§2.1–2.2, §2.4). `version`
starts at 1 on requests; optimistic-concurrency use arrives with staff
mutations. `customerId` is always `null` at intake (linking is a later
staff workflow, TBD-PO-12) — please do not build customer dedup/merge into
intake writes.

## 3. Transaction requirements (contract §5.2, §1.10)

Each public submission commits **atomically in one `UnitOfWork.run`**:

- inspection request: `request + history('new') + audit('request.created')
  + outbox(staff_alert [+ customer_confirmation if WhatsApp consent])`
- contact message: `message + audit('contact_message.created') + outbox(staff_alert)`

Observable guarantees the suites assert: all-or-nothing on throw (fault
injection mid-transaction leaves zero partial business/audit/outbox
rows), read-your-own-writes inside `run`, success returned only after
commit. How you achieve this (native transaction, isolation level) is
TBD-DB-05 — please document it for us (§6).

## 4. Idempotency semantics (contract §1.8, §5.2)

- Uniqueness tuple: `(actorScope, method, routeTemplate, key)` — scope is
  the reserved `public` partition for intake; the raw key is never unique
  globally. Store: payload **hash** (SHA-256, computed by the service),
  state, lease, HTTP status, minimal safe receipt (`{id, reference,
  receivedAt}`), timestamps. **Never** raw bodies or PII.
- `claim` is atomic before any business effect: concurrent duplicate ⇒
  `in_progress` (never executes); same key + different hash ⇒
  `payload_mismatch`; completed + same hash ⇒ replay stored receipt with
  **no** second business/audit/outbox write.
- `complete` must be consistent with the business commit (inside the same
  transaction or your equivalent mechanism) so a committed effect and its
  replay record cannot diverge. On rollback/retryable failure the claim
  is released via `releaseRetryable`.
- Retention: completed public-intake records ≥ 24 h; expired ⇒ same key is
  a new intent. Cleanup mechanics are yours (TBD-TECH-03 bounds).

## 5. Lists, audit, outbox specifics (§1.6, §7, SEC-08/09)

- Lists return `Page<T>`; ordering deterministic: requests by
  `submittedAt`, contacts by `receivedAt`, audit by `at`, outbox by
  `createdAt`, always with an `id` tiebreak. Request search must also
  match a pasted formatted phone ("100 777 6666") against the stored
  separator-free value (fake behavior, covered in CT-PORT);
  filters and `search` as in `RequestListQuery`/`ContactMessageListQuery`.
  The fake folds search text by case + Arabic-Indic/Persian digits; your
  text-search folding behavior (TBD-DB-04) must be **documented** so we
  can assert it in the suite rather than guess.
- Audit entries carry reference-only metadata — keep PII out of the audit
  payload columns you design.
- Outbox `params` contain **only** `{ reference }` (SEC-08); recipient
  destinations resolve at send time. Outbox `idempotencyKey` is unique per
  committed occurrence+recipient — enforce uniqueness so retries dedupe.

## 6. What we need back from you (TBD-DB-01…10, contract §10)

1. Engine+version/hosting/region; serverless access story from Vercel
   (pooler/HTTP driver) + connection limits. 2. ORM/driver + where your
   access layer will live (repo/branch/path) or "greenfield". 3. Migration
   tool + locations; current DDL if tables exist. 4. Conventions: PK
   format, enum/status storage, timestamps/timezones, search folding.
   5. How `UnitOfWork` + the atomic idempotency claim map onto your
   transaction mechanism. 6. Env-var **names** per environment (dev/test/
   staging/prod), pooled vs direct, SSL. 7. **Disposable test-DB
   procedure** (below). 8. Backups/PITR + documented restore steps and
   drill owner. 9. Whether object storage is yours or ours (later slices).
   10. Schema-change request/review process + turnaround.

## 7. Disposable test database — expectations

- One documented command/procedure creates a fresh empty test DB, applies
  migrations from empty, and can be re-run idempotently in CI (§8.2.2).
- `reset` between suites = your documented fast path (truncate/recreate)
  returning every intake store to empty.
- Contains synthetic data only; never production dumps or real customer PII.
- Test env-var names distinct from production names; values provisioned
  out-of-band, never committed.

## 8. Acceptance — "ready to integrate" (contract §5.5, §8.2)

1. `tests/contract/intake-ports.contract.test.ts` passes **unchanged**
   against your adapter on a disposable test DB, selected via
   `INTAKE_CONTRACT_ADAPTER=<your-adapter-name> npm run test:contract`
   (we will add your registration together; suite edits = contract change,
   discussed first). This covers atomicity fault-injection, idempotency
   scope/expiry/concurrency, reference uniqueness, pagination stability,
   filters/search, append-only audit surface, and reset.
2. `tests/intake-api.test.ts` + `tests/intake-admin-api.test.ts` pass with
   your adapter wired in `runtime.ts` (service/HTTP behavior incl. rollback
   freeing the idempotency key and 503 governance with the fake off).
3. Uniqueness enforced in storage for: entity `id`, human `reference` per
   kind, scoped idempotency tuple, outbox `idempotencyKey`.
4. A timed backup→restore into a scratch environment is demonstrated once
   (you run it, we witness) **before** any production form cutover.
5. Only then: register the adapter name in `runtime.ts`, set
   `DATA_ADAPTER` in staging, run end-to-end verification, and bring the
   cutover decision (public forms + production) to the owner as a separate
   gate. Fake-adapter-green alone is never integration evidence.

## 9. Explicitly not in this handoff

Customers/linking (TBD-PO-12), inspections (TBD-PO-13), staff roles/
authorization predicates (TBD-PO-03 — admin reads today accept only the
existing owner session), quotations/contracts/finance, file storage
(TBD-DB-09), notification *sending* (PO-01/TECH-06; outbox worker-side
port methods will be added to this handoff when that slice is authorized).
