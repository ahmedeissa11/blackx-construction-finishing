# Backend foundation — database-agnostic business API

**What this is:** the shared backend foundation for the whole BLACK X
business API, generalizing the proven intake slice (`../intake/`) to
every domain: environment-based adapter governance, repository ports
for all entities, application services, strict validation, the §1.7
error envelope, structured logging, health/readiness, and the OpenAPI
contract. It selects **no** database engine, ORM, schema, or migration
approach — those belong to the database colleague behind the ports
(`docs/database-integration-contract.md`).

**What this is not (yet):** durable production persistence. The only
registered adapter is the in-memory fake (dev/test, refused in
production). Until the colleague's adapter passes the foundation
contract suite, every foundation business endpoint fails closed with
`503 DEPENDENCY_UNAVAILABLE` in production — nothing falls back to
fixtures or memory, and the current frontend is completely unaffected.

## Implementation status (wave 1)

| Surface | Status |
|---|---|
| Customers create/list/get/patch | **Implemented** (idempotent create, version-checked patch, audit) |
| Users, projects, milestones, progress, diary, findings, reports, inspections, quotations, contracts, handover, warranty, documents, dues, payments, suppliers, purchases, complaints, audit events | **Reads implemented** over ports (empty until real adapter/import); writes return `501 NOT_IMPLEMENTED` naming the blocking TBD decisions |
| Engineers, user administration, invitations, uploads, notification sending, portal API | **Planned** (ports/DTOs where defined; 501 at HTTP) |
| Health / readiness / system status / OpenAPI | **Implemented** (`/api/v1/health`, `/ready`, owner-gated `/admin/system/status`, `/admin/openapi.json`) |

Authorization is provisional until TBD-PO-03: the existing owner
session only (401 anonymous / 403 other roles), checked **before**
adapter state, exactly like the intake guard. Multi-company is
prepared (every record is `workspaceId`-scoped, one server-resolved
workspace today) but not enabled.

## Files

| File | Role |
|---|---|
| `ports.ts` | Stored records + repository interfaces for all domains, UnitOfWork, generic idempotency. DTO-only boundary — no ORM types. |
| `fake-adapter.ts` | Governed in-memory reference implementation of the observable port behavior (snapshot transactions, workspace scoping, folded search). |
| `services.ts` | Business rules: validation → idempotency → UnitOfWork writes + audit; read services + derived read-models. No DB imports. |
| `dto.ts` | Explicit record → DTO projections (workspaceId/passwordHash/storageRef never cross). |
| `validation.ts` | Strict input validation (unknown ⇒ 422, read-only ⇒ 422; mass-assignment defense). |
| `query.ts` | §1.6 list-query parsing (unknown params ⇒ 400). |
| `errors.ts` | §1.7 error codes + `VersionConflictError` port error. |
| `logger.ts` | Structured JSON logs with secret-key redaction. Never log bodies/PII/secrets. |
| `config.ts` | `DATA_ADAPTER` governance, workspace resolution, safe system status (names/booleans only). |
| `runtime.ts` | Adapter assembly (globalThis-anchored fake singleton in dev/test). |
| `http.ts` / `admin-http.ts` | Transport + owner-session guard (401/403 → 503 → handler; planned ⇒ 501). |
| `openapi.ts` | OpenAPI 3.1 spec object (served owner-gated; rendered to `docs/openapi.json`, drift-tested). |

Shared wire types live in `src/lib/api-types.ts`; the typed frontend
client is `src/lib/api-client.ts` (no board is wired to it yet — see
its header for why).

## Tests

- `tests/contract/foundation-ports.contract.test.ts` — adapter
  conformance suite (must pass unchanged against the real adapter;
  select via `FOUNDATION_CONTRACT_ADAPTER`).
- `tests/foundation-customers.test.ts` — service behavior without HTTP.
- `tests/foundation-api.test.ts` — HTTP handlers: auth matrix,
  fail-closed governance, persistence across requests, 501 markers.
- `tests/foundation-config.test.ts` — adapter selection/governance.
- `tests/api-client.test.ts`, `tests/openapi.test.ts` — client + spec
  coverage/drift.

Run locally with the fake: `DATA_ADAPTER=fake npm run dev`, sign in,
then `POST /api/v1/admin/customers` with an `Idempotency-Key` header.

Regenerate `docs/openapi.json` after editing `openapi.ts` (the drift
test fails otherwise):

```sh
node --experimental-strip-types -e "import('./src/server/foundation/openapi.ts').then(async (m) => { const fs = await import('node:fs'); fs.writeFileSync('docs/openapi.json', JSON.stringify(m.openApiSpec, null, 2) + '\n'); })"
```
