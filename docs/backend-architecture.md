# BLACK X — Backend architecture & database-agnostic foundation

**Status:** implemented foundation (wave 1) on branch
`arena/b04f8c7e-blackx-construction-finishing`, pending QA review.
**Not merged to Production** — a separate release decision is required
after QA and (for real persistence) database-adapter integration.

This document is the architecture assessment + design record for the
backend foundation task. The colleague-facing integration contract is
[`database-integration-contract.md`](./database-integration-contract.md);
the normative API proposal remains
[`api-contract-v1.md`](./api-contract-v1.md); the machine-readable
contract is [`openapi.json`](./openapi.json) (generated, drift-tested).

## 1. Assessment of what already existed (inspected, kept)

| Area | Found | Decision |
|---|---|---|
| Framework | Next.js 15 App Router (Node runtime routes), React 19, TypeScript strict | Keep — server capabilities are sufficient; no separate backend service needed for the foundation |
| Auth | NextAuth credentials, single owner account (scrypt hash in env), `__Secure-` HttpOnly session cookie, login rate-limit, middleware-protected dashboard | Keep untouched; foundation reuses the same server-side session gate (401/403) provisionally until TBD-PO-03 |
| First backend slice | `src/server/intake/`: DTO-only ports, `UnitOfWork`, governed in-memory fake (`DATA_ADAPTER`), idempotency, §1.7 envelope, CT-PORT suite | Keep untouched; **generalize the pattern**, don't replace it |
| API proposal | `docs/api-contract-v1.md` (DTOs §2, endpoints §3, ports §5.3, decision register §9) | Foundation follows it; open TBD-PO/DB/TECH items are honored as blockers, never invented around |
| Domain models | Preview fixtures (`src/lib/admin-preview.ts`, `preview-expansion.ts`, `src/content/preview-*`) are UI read-models over isolated sample data | Server records/DTOs derive from contract §2 (already distilled from the fixtures); finance/complaints derive from fixtures and are marked foundation-proposed |
| Tests | Vitest; 178 passing at baseline `9b84ec8` | Extend in the same style (contract harness reuse) |
| Dependencies | Minimal (next, next-auth, react) | **Zero new dependencies** — validation/logging/OpenAPI are hand-rolled to match repo conventions |
| Deployment | Vercel (prod `blackx-construction-finishing`, QA `blackx-frontend-qa`), GitHub PR workflow | Foundation validates on QA only; Production untouched |

## 2. Architecture

```
Route handlers (src/app/api/v1/**)
  auth gate + transport only (src/server/foundation/admin-http.ts, http.ts)
        │
Application services (src/server/foundation/services.ts)
  validation · workspace scoping · idempotency · version checks ·
  audit decisions · DTO projection — NO database/ORM imports
        │
Repository ports (src/server/foundation/ports.ts)
  records + typed queries only — never ORM entities or vendor syntax
        │
Adapters
  ├─ fake (in-memory, dev/test only, REFUSED in production)
  └─ colleague's real adapter (future; must pass the contract suite)
```

- **Versioning:** everything new lives under the existing `/api/v1`
  (contract §1.1). Breaking changes would be `/api/v2`; additive
  fields/endpoints stay in v1.
- **Errors:** one envelope everywhere (§1.7) — stable `code` +
  localization `messageKey`, optional `fieldErrors`/`details`; no
  prose, no internals. Foundation adds `CONFLICT_STATE`,
  `CONFLICT_VERSION`, `NOT_IMPLEMENTED` (501) to the intake code set.
- **Lists:** §1.6 everywhere — `Page<T>`, allow-listed sort with `-`
  prefix (default desc), strict unknown-param rejection (400),
  deterministic ordering (sort field + `id` tiebreak).
- **Writes:** strict DTO validation (unknown ⇒ 422 `unknownField`,
  server-owned ⇒ 422 `readOnly` — mass-assignment defense),
  `Idempotency-Key` required on creates (§1.8), optimistic
  `version` on PATCH, audit append inside the same `UnitOfWork`
  transaction as the business write.
- **Workspace scoping:** every record carries `workspaceId`; the
  workspace is resolved server-side (single workspace today,
  `BLACKX_WORKSPACE_ID` env name, default `blackx`). Cross-workspace
  records are indistinguishable from missing ones. Multi-company is
  **prepared, not enabled** — no tenant switching, theming, or
  per-tenant config exists or is claimed.
- **Logging:** structured JSON lines (`foundation/logger.ts`) with
  correlation IDs and secret-key redaction. Request bodies, PII,
  credentials, cookies, hashes, and connection data are never logged.
- **Health/readiness:** `GET /api/v1/health` (liveness, minimal),
  `GET /api/v1/ready` (auth configured ⇒ ready to serve; adapter
  state is deliberately excluded because the site and fail-closed API
  operate without it), `GET /api/v1/admin/system/status`
  (owner-gated detail: booleans/names only).

## 3. Adapter implementation status (honest)

| Adapter | Where | Status |
|---|---|---|
| `fake` (in-memory) | `src/server/foundation/fake-adapter.ts` (+ intake's) | Dev/test reference implementation. Per-process, lost on restart, **refused when `NODE_ENV=production`** (verified live on a production build: 503, no writes) |
| Real database adapter | — | **Does not exist.** Awaiting the database colleague's engine/schema (TBD-DB-01…10). Ports + contract suite are ready for it |
| **Supported production databases** | — | **None yet.** No vendor is assumed, selected, or claimed |

Governance: `DATA_ADAPTER` unset/unknown/refused ⇒ no services
assembled ⇒ business endpoints return `503 DEPENDENCY_UNAVAILABLE`.
There is no silent fallback to fixtures or memory in production
(tested at config, HTTP, and live production-build level).

**Migrations:** none exist — there is no real adapter to migrate.
Migration ownership/workflow is specified in the integration contract
(§5 there): the colleague's tool, versioned, applicable from empty in
CI, never destructive against production data without a separate gate.

## 4. Domain & endpoint status (wave 1)

Implemented writes: **customers only** (contract §2.4/§3.3) — create
(idempotent), list, get, patch (version-checked), each audited.
Reads over ports: users, projects (+ milestones, progress, diary,
weekly reports, handover), findings, inspections, quotations,
contracts, warranty, documents, dues, payments, suppliers, purchases,
complaints, audit events — all return honest empty pages until a real
adapter/import provides data. Everything else returns `501` naming
its blocking decisions (e.g. project create → TBD-PO-05/03; document
upload → TBD-DB-09/TECH-05/PO-06; engineers → TBD-PO-03, since
engineers are staff-role users, not a separate table). The full matrix
is `DOMAIN_STATUS` in `src/server/foundation/config.ts`, surfaced on
`/admin/system/status` and mirrored per-operation in OpenAPI
(`x-implementation-status` / `x-blocked-by`).

Provisional engineering defaults introduced (all marked in code,
pending TBD-TECH-03/PO decisions): 32 KB body cap, idempotency
retention 7 d (authenticated) / lease 30 s, fake reference formats
(`CU-000001`, …), project `progressPercent` = contract §2.6's proposed
PO-18 default (latest measurement, else 0), quotation
`contractEligibility` never emits `superseded` until TBD-PO-04A Q2 is
chosen. Customer duplicate phones are neither merged nor rejected
(TBD-PO-12) and `derivedStatus` is omitted until its inputs exist.

## 5. Frontend integration status

- **Typed client:** `src/lib/api-client.ts` + shared wire types
  `src/lib/api-types.ts` — implemented and unit-tested (relative URLs,
  envelope→`ApiClientError`, idempotency keys on create).
- **Boards: intentionally NOT rewired.** The admin UI still reads the
  isolated preview fixtures. With no production-capable adapter,
  endpoints correctly fail closed (503); wiring boards now would break
  a working frontend and misrepresent persistence. Cutover is
  per-module, after the real adapter passes the contract suites,
  under a separate release decision — exactly like the intake forms.
- **Nothing user-visible changed:** no UI files were modified; the
  production site behaves identically (verified by build + live
  checks of home/login/dashboard-redirect/intake-503).

## 6. Tests and verification (actual results)

- **254/254 unit/integration tests pass** (178 baseline + 76 new):
  config governance, customer service (validation/idempotency/
  concurrency/scoping/search/audit), HTTP handlers (401/403/503/501
  matrix, persistence across requests, envelope), repository contract
  suites (38 contract tests incl. intake), API client, OpenAPI
  coverage/drift, cross-bundle error mapping.
- **Contract-alignment follow-up (2026-10-25):** customer detail now
  returns the §3.3 `summary` block (projects + unresolved-finding
  count; `requests` empty until PO-12 linking exists); input naming
  frozen as `phone` (contract §1.5); domain-status lists disjoint;
  contract suites select adapters via per-suite env vars
  (`FOUNDATION_CONTRACT_ADAPTER` / `INTAKE_CONTRACT_ADAPTER` /
  `CONTRACT_ADAPTER`) and pass together and independently; over-cap
  declared request bodies are refused before buffering.
- `format:check`, `lint`, `typecheck`, production `build`: green.
- **Live local verification (dev, fake):** sign-in → create customer
  201 → idempotent replay 201 (one record) → search/patch → stale
  patch 409 `CONFLICT_VERSION` → mass-assignment 422 `readOnly` →
  planned write 501 with blockers → audit shows both events →
  OpenAPI serves 49 paths. (This caught and fixed a real dev-only
  bug: duplicate module instances broke `instanceof` error mapping;
  mapping is now structural with a regression test.)
- **Live local verification (production build, `DATA_ADAPTER=fake`):**
  customers read/write → 503 (fake refused), system status reports
  `configured:false`, `/me` still 200, intake POST still 503,
  public site/login/dashboard redirect intact.

## 7. Limitations & risks

1. **No durable persistence exists.** All foundation data behavior is
   proven against the in-memory fake only. Production remains exactly
   as before this task (fixtures in UI; intake fail-closed).
2. **Authorization is single-owner provisional** (TBD-PO-03). No staff
   roles, predicates, or portal API are implemented or implied.
3. **Two audit read surfaces** exist (`/admin/audit-logs` intake,
   `/admin/audit-events` foundation) over conceptually one trail; the
   real adapter must unify storage (integration contract §4).
4. **Service read-model composition** (project progress, due
   balances) pages through repository lists; at real scale the
   colleague may propose aggregate port methods via contract change.
5. **Wave-1 port granularity** is aggregate-record CRUD; contract
   §5.3's workflow-specific methods arrive with their services.
6. The fake cannot demonstrate cross-process sharing, true isolation,
   or backup/restore — those are real-adapter acceptance items.
7. Known pre-existing observation (not changed here): intake's error
   mapping uses bare `instanceof`; production bundles share instances
   (verified behavior in prod), but dev duplicates could theoretically
   affect intake the same way the foundation bug manifested. Worth a
   small follow-up to apply the same structural mapping there.
8. **CSRF posture (reviewed 2026-10-25; decision = TBD-TECH-02).**
   State-changing foundation routes (today: customer POST/PATCH; the
   rest are 501) are cookie-authenticated. Current compensating
   controls: session cookie is httpOnly, `__Secure-` in production,
   `SameSite=Lax`; mutations require `Content-Type: application/json`
   (a non-simple type, so cross-origin browser requests preflight and
   fail — no CORS allowlist exists); no GET performs a mutation;
   NextAuth's own auth POSTs carry built-in CSRF tokens. **What is
   missing:** explicit server-side origin verification. **Residual
   risk:** SameSite is enforced by the browser, not verified by the
   server — a malicious page on a *same-site* subdomain could still
   ride the session (Lax permits same-site POST cookies), older
   browsers may not enforce SameSite, and any future form-encoded
   endpoint would bypass the content-type mitigation. The API
   contract (§1.2) requires CSRF protection on cookie-auth mutations,
   so today this is mitigations-only, not compliance.
   **Recommended control (implement before any production write
   expansion, as an explicitly authorized change):** in the shared
   guards (`src/server/foundation/admin-http.ts`, and the intake
   guard if staff writes arrive there), verify on every
   state-changing request that `Origin` (falling back to `Referer`)
   matches the expected application origin (`Host`/`AUTH_URL`), or
   that Fetch Metadata `Sec-Fetch-Site` is `same-origin`; requests
   with a mismatched Origin ⇒ 403; requests with no Origin and no
   Fetch Metadata (non-browser clients) stay allowed but are logged.
   Add guard tests (mismatched Origin ⇒ 403; same-origin unaffected).
   A synchronizer-token scheme is heavier than needed for this
   same-origin admin. **No behavior was changed for this item in the
   alignment batch** — this entry is the documented risk + proposal
   for the TECH-02 decision. Related observation: credential login
   has no application-level attempt throttling today (thresholds are
   TBD-TECH-03) — consider deciding both together.

## 8. Recommended next steps (in order)

1. **Owner/colleague:** answer TBD-DB-01…10 (engine, hosting, access
   layer, migrations, test-DB procedure) per the integration contract.
2. **Colleague:** implement the adapter behind the intake + foundation
   ports; run both contract suites against a disposable test DB.
3. **Owner:** decide the next PO blockers by slice (PO-03 roles before
   staff writes; PO-12 before customer-link flows; PO-13 inspections;
   PO-04/04A/05 commercial; PO-18 progress; DB-09/PO-06 documents).
4. **Engineering (separate authorized tasks):** register the adapter
   in `runtime.ts`, enable on QA, end-to-end verification, then bring
   the Production merge/cutover decision to the owner. This branch
   must not be merged to Production before that gate.
