# BLACK X — Contract & implementation status (reconciliation)

**Status:** proposed status summary — **nothing here is approved.** This
document reconciles the existing drafts into one place so the owner and
the database colleague can see what is implemented, what is proposed,
and what remains blocked on decisions. It cross-references the single
live registers (it does not duplicate them, per
`docs/README.md` §4 "one live register per kind").

## Source documents (single registers, not copied here)

| Kind | Where it lives | What it records |
|------|---------------|-----------------|
| Project-owner decisions | `docs/api-contract-v1.md` §9.1 (`PO-01`–`PO-19`, incl. `PO-04A`) | Unresolved management decisions; each authorizes nothing until decided |
| Database-colleague inputs | `docs/api-contract-v1.md` §9.2 (`DB-01`–`DB-10`) + §10 checklist | Engine, ORM, schema, migrations, test DB, backups, storage — colleague-owned |
| Engineering choices | `docs/api-contract-v1.md` §9.3 (`TECH-01`–`TECH-08`) | Proposed by engineering, recorded once chosen at kickoff |
| Decision-record structure | `docs/decisions/README.md` + `docs/decisions/0000-template.md` | How a resolved item becomes a permanent decision record (none recorded yet) |
| Open pre-implementation questions | `docs/requirements-and-implementation-plan.md` §10 + §12 checklist | Urgency-grouped questions; sign-off checklist unchecked |
| Contract-test harness | `tests/contract/README.md` (BX-104) | Adapter-agnostic mechanics; CT-PORT subset for intake ports |

## Contract version

| Item | Value |
|------|-------|
| Proposed contract | `docs/api-contract-v1.md`, document version **0.3** |
| Contract state | **PROPOSED — for project-owner approval. Nothing in it is implemented.** |
| Baseline commit | `ahmedeissa11/blackx-construction-finishing` @ `ff000b6` (current `main`, production-deployed) |
| Production (unchanged) | https://blackx-construction-finishing.vercel.app |

## Implemented vs. unimplemented behavior

### ✅ Implemented (on `main`, current production codebase)

| Area | What exists | Where |
|------|-------------|-------|
| Database-independent intake foundation | Ports, DTOs, typed errors, application service, validation (Appendix A), idempotency, rate-limit store, atomic UnitOfWork, outbox/audit, governed in-memory fake adapter, owner-gated admin reads | `src/server/intake/` |
| Contract-test harness + CT-PORT subset | Adapter-agnostic harness; intake port contract run against the governed fake | `tests/contract/`, `tests/contract/intake-ports.contract.test.ts` |
| Intake HTTP/authorization tests | CT-API subset (validation, idempotency, rollback, SEC-08); admin API tests (401/403/503, query validation, READ-no-audit) | `tests/intake-api.test.ts`, `tests/intake-admin-api.test.ts` |
| Intake fail-closed governance | Routes return 503 when no adapter is registered; fake refused in production | `src/server/intake/runtime.ts`, `src/server/intake/http.ts` |
| Preview-article publication gate (P0 fix) | Public articles listing/detail render from `publishedArticles` only; no preview URLs generated | `src/app/[locale]/(site)/articles/page.tsx`, `.../[slug]/page.tsx` |
| Login password hashing | scrypt, `__Secure-…`-style session cookie via NextAuth JWT | `src/lib/admin-auth.ts` |
| Dashboard/portal authz middleware | Protects `/(ar|en)/(dashboard|portal)` | `src/middleware.ts` |
| SEO/publication correctness | `site-url.ts` prod fallback; `robots.ts` disallows dashboard/portal; `sitemap.ts` uses `publishedArticles` | `src/config/site-url.ts`, `src/app/robots.ts`, `src/app/sitemap.ts` |

### ⬜ Proposed / unimplemented (blocked on owner or database decisions)

| Area | What is proposed | Blocked on |
|------|-----------------|------------|
| Full API contract v1 endpoints (§3) | All staff/admin/portal/customer endpoints listed in `api-contract-v1.md` §3 | `TBD-PO-03` role matrix + resource predicates; `TBD-DB-*` real adapter |
| Identity & accounts (users, invitations, password reset) | §3.2 endpoints | `TBD-PO-03`, `TBD-TECH-01` session revocation/KDF |
| Customers, requests, inspections (CRUD + lifecycle) | §3.3–§3.4 | `TBD-PO-03`, `TBD-PO-12` customer dedup/merge, `TBD-PO-13` inspection schema |
| Quotations & contracts | §2.5, §3.5 | `TBD-PO-04` commercial rules, `TBD-PO-04A` post-approval policy (Q1/Q2/Q3), `TBD-PO-05` signing evidence |
| Projects & operations | §2.6, §3.6 | `TBD-PO-03` project-assignment source, `TBD-PO-18` progress derivation |
| Documents & files | §2.6/§3.7 | `TBD-PO-06` file policy, `TBD-TECH-05` storage handshake |
| Notifications / WhatsApp | §3.9, §7 | `TBD-PO-01` Meta number/templates/BSP, `TBD-TECH-06` outbox worker |
| Customer portal | §3.10 | `TBD-PO-08` customer-visible fields, `TBD-PO-17` account cardinality |
| Audit exports | §3.9 | `TBD-PO-03` export authority, `TBD-TECH-04` format/retention |
| Durable production database | None | `TBD-DB-01`–`DB-10` (database colleague) |

### 🔒 Security findings (open)

| ID | Finding | Required fix | Status |
|----|---------|--------------|--------|
| SEC-LOGIN-THROTTLE-IN-MEMORY (P0) | `src/lib/admin-auth.ts` login attempts kept in a per-process `Map`, reset on serverless cold starts → ineffective brute-force throttle across instances | Migrate to the shared `RateLimitPort` in `src/lib/rate-limit-port.ts` backed by shared storage before production login traffic | **Open** — documented, interface prepared, not wired |

## What must NOT be inferred from this document

- No endpoint, role, workflow, database choice, or approval listed above is approved.
- The presence of a `TBD-PO-*`/`TBD-DB-*`/`TBD-TECH-*` item authorizes nothing.
- The governed in-memory fake adapter is dev/test only and is refused in production (`DATA_ADAPTER=fake` + `NODE_ENV=production` → 503).
- Implementation requires a separate explicit authorization naming the task(s) in scope (per `docs/README.md` §2).

## Next action required from the owner

Review and sign off the requirements document §12 checklist and the `TBD-PO-01`–`TBD-PO-04A` decisions in `api-contract-v1.md` §9.1 before any implementation batch begins. No decision record exists yet in `docs/decisions/`.
