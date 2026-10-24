# Public intake — first business slice (API contract §3.1)

**What this is:** the real application logic for accepting website
inspection requests and contact messages — validation, rate limiting,
scoped idempotency, and one atomic save of *record + status history +
audit entry + notification intents* — behind the database-independent
ports of API-contract §5. Endpoints:

- `POST /api/v1/public/inspection-requests` → `201 {id, reference, receivedAt}`
- `POST /api/v1/public/contact-messages` → `201 {id, reference, receivedAt}`
- `GET /api/v1/admin/requests[/{id}]`, `GET /api/v1/admin/contact-messages[/{id}]`
  — staff reads (Batch 3): existing owner session only until TBD-PO-03
  approves the role matrix; anonymous ⇒ 401, any other role ⇒ 403;
  §1.6 pagination/filters/search; list summaries omit phone/description.
- `GET /api/v1/admin/audit-logs`, `GET /api/v1/admin/notifications`,
  `GET /api/v1/admin/overview` — operational reads (Batch 4, §3.9):
  audit trail (viewing appends nothing), outbox visibility (no params/
  keys/phone exposed; review/retry mutations absent until PO-03), and
  honest intake counts + recent activity. All API responses are
  `Cache-Control: no-store`.

**What this is not (yet):** durable production persistence, form
cutover, WhatsApp/email sending, or staff processing. No real database
adapter exists; the website forms still use the preview adapter and
**must not** be pointed at these endpoints in production until the
colleague's adapter passes the CT-PORT suite (§5.5, §8.2).

## Adapter governance (read before enabling)

Selection is by env var **name** `DATA_ADAPTER` (§5.4):

| Setting | Behavior |
|---|---|
| unset / unknown | Routes fail closed: `503 DEPENDENCY_UNAVAILABLE`. Nothing is written; no success is faked. |
| `fake` + `NODE_ENV=production` | **Refused** — same 503. The in-memory fake can never serve production. |
| `fake` + development/test | Routes work against the in-memory fake adapter. State is per-process and **lost on restart**. For development and tests only. |

Run locally: `DATA_ADAPTER=fake npm run dev`, then POST with an
`Idempotency-Key` header (UUID). Replaying the same key + body returns
the original receipt; the same key with a different body returns 409.

## Files

| File | Role |
|---|---|
| `ports.ts` | DTOs (§2.1–2.2), stored records, port interfaces (§5.3 subset), typed errors (§1.7). |
| `validation.ts` | Appendix-A server validation + strict DTOs (unknown ⇒ 422, read-only ⇒ 422). Reuses the dictionaries' field-error keys. |
| `service.ts` | Business rules: key check → validation → rate limits → idempotency claim → one `UnitOfWork` transaction → receipt. No DB/ORM imports (§5.1). |
| `fake-adapter.ts` | Governed in-memory adapter (§5.4): snapshot transactions, scoped idempotency, fixed-window rate limits. Reference implementation for the real adapter. |
| `admin-reads.ts` | §3.3–§3.4 read service: strict §1.6 query validation, summary/detail projection. READ-only (no audit appends). |
| `admin-http.ts` | Owner-session guard (401/403) checked before adapter state (503). Provisional until TBD-PO-03. |
| `runtime.ts` | Adapter selection/gating + allowlists derived from published content (6 service slugs; localized unit-type/subject values). The fake runtime is anchored on `globalThis` so every route shares one dev store. |
| `http.ts` | Transport only: JSON parsing, size cap, error envelope, `Retry-After`. |

Tests: `tests/contract/intake-ports.contract.test.ts` (CT-PORT subset —
must pass unchanged against the real adapter; select via
`INTAKE_CONTRACT_ADAPTER`), `tests/intake-api.test.ts` (CT-API subset
incl. rollback fault injection and governance), and
`tests/intake-admin-api.test.ts` (authorization 401/403/503, query
validation, projection minimization, READ-no-audit). The exact
real-adapter integration contract is `docs/db-integration-handoff.md`.

## Decisions honored / still open

- **No customer is created, merged, or linked** at intake (`customerId`
  stays `null`) — TBD-PO-12 untouched, per §3.1.
- **No notification is sent.** Outbox intents are enqueued with
  reference-only params (SEC-08); channel is `whatsapp` per the approved
  management decision, but template keys are provisional until Meta
  approval (TBD-PO-01). The customer-confirmation intent is enqueued
  only when WhatsApp consent was granted.
- **No default phone country** is applied (TBD-PO-10): digits are
  folded/stripped, a leading `+` is preserved, nothing is guessed.
- Provisional engineering defaults pending TBD-TECH-03/PO-11: rate
  limits (5/hr per IP+phone, 60/hr per IP), 32 KB body cap, reference
  formats `RQ-000001` / `MSG-000001`, 24 h idempotency retention.
- Real-adapter conformance must additionally prove (§5.2/§8.2): claim
  completion atomic with the business commit, shared-storage rate
  limits, and backup/restore — none of which the fake can demonstrate.
