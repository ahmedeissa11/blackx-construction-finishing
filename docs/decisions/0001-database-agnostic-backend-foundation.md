# 0001 — Database-agnostic backend foundation (ports & adapters)

| Field                      | Value                                                                                                                                                             |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status                     | accepted                                                                                                                                                          |
| Date proposed              | 2026-10-25                                                                                                                                                        |
| Date decided               | 2026-10-25                                                                                                                                                        |
| Decider(s)                 | Company owner (task authorization "BLACK X — Database-Agnostic Backend Foundation", 2026-10-25)                                                                   |
| Recorded by                | Engineering (Arena/ChatGPT), from the owner's written task instruction in the project workspace                                                                   |
| Resolves                   | — (resolves no PO/DB/TECH register item; explicitly leaves TBD-DB-01…10 and all TBD-PO items open)                                                                |
| Unblocks                   | Real-adapter implementation by the database colleague against frozen ports; per-module frontend cutover planning                                                  |
| Documents to revise        | `docs/backend-architecture.md` (new), `docs/database-integration-contract.md` (new), `docs/openapi.json` (new), `docs/README.md` (index) — all in the same change |
| Supersedes / superseded by | —                                                                                                                                                                 |

## Context

The admin application needs a real backend, but the database is owned
by an external database engineer whose technology choice is not yet
known. The repo already contained a proven first slice
(`src/server/intake/`) built on database-independent ports with a
governed in-memory fake, plus a detailed proposed API contract whose
business decisions (TBD-PO-*) are largely still open. Building
vendor-specific persistence now would either guess the colleague's
database or force a rewrite later; doing nothing blocks every
subsequent backend slice.

## Decision

Build the backend as a **ports-and-adapters foundation** inside the
existing Next.js application, generalizing the intake pattern:

- Application services depend only on TypeScript repository ports
  (`src/server/foundation/ports.ts` + intake ports). No ORM, driver,
  SQL, or vendor SDK imports outside an adapter.
- Adapter selection is by env-var name (`DATA_ADAPTER`). The only
  registered adapter is the in-memory `fake` for development/tests,
  **refused in production**; unconfigured ⇒ endpoints fail closed
  (503). No silent fallback to fixtures/memory anywhere.
- **No database is assumed, selected, or claimed as supported** until
  an adapter is implemented and passes the contract suites unchanged
  (`tests/contract/*`) on a disposable test database.
- Writes are implemented only where semantics are already specified
  (customers); reads run over ports for all domains; every other write
  returns `501 NOT_IMPLEMENTED` naming its blocking TBD decisions.
- Records are workspace-scoped (single server-resolved workspace
  today) so multi-company can be enabled later without redesign —
  without claiming multi-tenancy now.
- The frontend gets a typed API client and an OpenAPI contract, but
  no board is rewired until a production-capable adapter exists.
- This work lands on a feature branch + QA only. **No Production
  merge, schema, credential, or data change** is authorized by this
  decision; production release remains a separate explicit gate.

## Consequences

- The database colleague can implement against frozen, behaviorally
  tested ports in any engine; conformance is proven by suites, not by
  re-litigating design.
- Frontend cutover becomes incremental and safe per module.
- Until the real adapter lands, Production behavior is unchanged:
  UI reads fixtures, business endpoints fail closed — honest, but the
  product gains no new user-visible capability from this step alone.
- New obligations: colleague answers TBD-DB-01…10 and provides
  migrations-from-empty + disposable test DB + a witnessed restore
  drill before any production cutover; owner decisions (PO-03 etc.)
  gate each write slice; port changes require suite updates.
- Accepted risk: wave-1 aggregate port granularity may need
  workflow-specific methods later (contract §5.3) — handled as
  explicit contract amendments. Revisit if the colleague's existing
  data layer already exposes repositories we should mirror instead
  (contract §10 answers will tell).

## Alternatives considered

- **Pick a database now (e.g. Postgres/Prisma):** violates the
  owner's database-ownership boundary and risks a rewrite.
- **Universal multi-DB abstraction/ORM-for-everything:** hides real
  vendor differences (transactions, search, IDs) behind unreliable
  lowest-common-denominator behavior; explicitly rejected by the task.
- **Status quo / proposal only:** leaves every backend slice blocked
  and the colleague without an implementable target.
- **Separate backend service:** unnecessary operational surface; the
  existing Next.js server runtime already hosts the intake slice.

## Verification

- 249/249 tests green at implementation (178 baseline preserved),
  incl. `tests/contract/foundation-ports.contract.test.ts` (must pass
  unchanged against the real adapter later — that run is the true
  conformance evidence), governance tests proving production refusal,
  and live dev + production-build verification recorded in
  `docs/backend-architecture.md` §6.
- QA deployment validation on `blackx-frontend-qa` (health/readiness,
  anonymous 401, fail-closed 503, frontend intact) before any merge
  discussion. Full adapter verification is impossible until the
  colleague's adapter exists — named here as a known, accepted gap.

## Links

- Open-register entries resolved: none (by design)
- Source documents: `docs/backend-architecture.md`,
  `docs/database-integration-contract.md`, `docs/api-contract-v1.md`
  §5/§8/§9/§10, `src/server/foundation/README.md`

## Addendum (2026-10-25, commit `92657bd` — status unchanged)

Follow-up alignment on the same draft PR #8: customer-detail `summary`
implemented (contract §3.3), input naming frozen as `phone` (§1.5),
domain-status lists made disjoint, foundation contract suite moved to
a dedicated `FOUNDATION_CONTRACT_ADAPTER` env var, over-cap declared
bodies refused before buffering. Suite: 254/254 green; implemented/
read-only/planned surface otherwise exactly as recorded above. The
feature-by-feature state and the wave plan that operationalizes this
decision live in `docs/feature-implementation-matrix.md`. Still not
merged; still authorizes no Production enablement.
