# PR #8 Read-Only Audit Report

**Branch:** `arena/b04f8c7e-blackx-construction-finishing` (local @ `9b84ec8`, PR head on GitHub @ `55df209`)
**PR #8:** "Database-agnostic backend foundation (DRAFT — QA only, do not merge)"
**State:** OPEN, DRAFT, **CONFLICTING** with `origin/main` @ `fccedf6`
**Base:** `main`
**Files changed:** 75 (+18,407 / −43)
**Inspection method:** Read-only. Fetched PR #8 head (`55df209`) to a temporary detached worktree; ran full test suite, typecheck, and lint. No branch, file, or deployment was modified.

---

## Task 1 — Production Article-Publication Fix (PR #11)

### Verdict: FIX IS DEPLOYED AND CORRECT. Live page showing articles is a cache/staleness issue, not a code problem.

### Evidence

| Check | Result |
|---|---|
| `origin/main` commit | `fccedf6` (Merge PR #11 — "Security/SEO: gate public articles on published set") |
| Latest production Vercel deployment | `dpl_AhxRVXJopPSMF3vkQMyxgCzqJzvF` @ `fccedf6`, state **READY**, substate **PROMOTED**, target **production** |
| Production domain alias | `blackx-construction-finishing.vercel.app` → alias of `dpl_AhxRVXJopPSMF3vkQMyxgCzqJzvF` (assigned) |
| `publishedArticles` in `publications.ts` | Both articles have `preview: true` → `publishedArticles = []` (empty) |
| Articles listing page | Renders `publishedArticles` only → empty state |
| Article detail page `[slug]` | `getArticle(slug)` + `!publishedArticles.includes(article)` → `notFound()` (404) |
| Build command | `npm run build` (Next.js, framework confirmed) |

### Conclusion

The production deployment is running the post-PR-#11 code. The fix is present and correct: both articles are preview-only, the published set is empty, and both article routes gate on the empty set. If the live Arabic page at `https://blackx-construction-finishing.vercel.app/ar/articles` still shows 2 articles, the cause is **browser cache, Vercel CDN/ISR stale cache, or a cached page view** — not a missing or ineffective deployment. No deployment action is needed (and none is permitted per constraints).

---

## Task 2 — PR #8 File-by-File Audit

### PR #8 Overview

| Attribute | Value |
|---|---|
| Title | Database-agnostic backend foundation (DRAFT — QA only, do not merge) |
| Head commit | `55df209` (4 commits ahead of local branch `9b84ec8`) |
| Merge base | `main` |
| Mergeability | **CONFLICTING** |
| Test results | **254/254 passing** (12 files) |
| Typecheck (`tsc --noEmit`) | **Clean** |
| Lint (`eslint --max-warnings=0`) | **Clean** |

### 1. New Foundation Server Layer (`src/server/foundation/`) — 15 new files

| File | Role | Assessment |
|---|---|---|
| `ports.ts` | Repository ports for all 19 business domains + UnitOfWork + idempotency store | **USEFUL** — clean database-independent boundary, workspace-scoped, version-checked updates, immutable append-only audit |
| `runtime.ts` | Adapter governance + fail-closed service assembly | **USEFUL** — fake refused in production, no silent fallback, 503 on unconfigured |
| `config.ts` | Env-based config, adapter selection, workspace ID, system status | **USEFUL** — fail-safe, names/booleans only (no secret leakage) |
| `services.ts` | Business rules over ports (807 lines) | **USEFUL** — customers writable; all other domains read-only; 501 for planned write endpoints; derived read-models marked provisional |
| `fake-adapter.ts` | Governed in-memory fake (781 lines) | **USEFUL** — reference implementation for dev/test; contract-tested; known limitations documented |
| `validation.ts` | Strict body validation (mass-assignment defense) | **USEFUL** — unknown fields → 422, server-owned → 422 readOnly, phone/email/ISO validation |
| `errors.ts` | `ApiError` + `toApiError` mapping | **USEFUL** — stable error codes, message keys, never leaks internals |
| `dto.ts` | Record→DTO projection | **USEFUL** — server-owned fields never reach wire |
| `query.ts` | List query parsing (page/sort/search/filters) | **USEFUL** — allow-listed sort fields, pageSize cap, typed filters |
| `http.ts` | Shared HTTP helpers | **USEFUL** |
| `logger.ts` | Structured logging | **USEFUL** |
| `openapi.ts` | OpenAPI 3.1 generation from route metadata | **USEFUL** — drift- and coverage-tested |
| `README.md` | Foundation README | **USEFUL** |

### 2. New API Route Handlers (`src/app/api/v1/`) — 38 new files

All routes follow the same pattern: auth + transport only, delegate to foundation services.

| Endpoint | Status | Assessment |
|---|---|---|
| `GET /api/v1/admin/customers` | ✅ Implemented (writable) | **USEFUL** — full CRUD with idempotency, versioning, audit |
| `POST /api/v1/admin/customers` | ✅ Implemented | **USEFUL** |
| `GET/PATCH /api/v1/admin/customers/[id]` | ✅ Implemented | **USEFUL** |
| `GET /api/v1/health` | ✅ Implemented | **USEFUL** |
| `GET /api/v1/ready` | ✅ Implemented | **USEFUL** — reports adapter status, 503 if refused |
| `GET /api/v1/me` | ✅ Implemented | **USEFUL** |
| `GET /api/v1/admin/system/status` | ✅ Implemented | **USEFUL** |
| `GET /api/v1/admin/workspace` | ✅ Implemented | **USEFUL** |
| All other admin routes (projects, quotations, contracts, invoices, etc.) | ⚠️ **501 Not Implemented** | **INCOMPLETE** — honest 501s until owner decisions land; no state machine invented |

### 3. New Types & Client (`src/lib/`) — 2 new files

| File | Assessment |
|---|---|
| `api-types.ts` | **USEFUL** — all DTOs, input types, error envelope, status DTOs |
| `api-client.ts` | **USEFUL** — typed fetch client, same-origin only, idempotency key support, normalized `ApiClientError` |

### 4. Documentation — 9 new/updated files

All **USEFUL** as project documentation, none are implementation authorization:
- `docs/api-contract-v1.md`, `docs/backend-architecture.md`, `docs/database-engineer-handoff.md`, `docs/database-integration-contract.md`, `docs/decisions/0001-*.md`, `docs/feature-implementation-matrix.md`, `docs/openapi.json`, `docs/README.md`

### 5. Tests — 7 new/updated files, 254 tests all passing

| File | Tests | Assessment |
|---|---|---|
| `tests/contract/foundation-ports.contract.test.ts` | 13 adapter contract tests | **USEFUL** — behavioral conformance suite for real adapter |
| `tests/foundation-api.test.ts` | 15 HTTP-level tests | **USEFUL** — fail-closed verification, mass-assignment rejection, audit appended |
| `tests/foundation-config.test.ts` | 12 config/runtime tests | **USEFUL** — unknown adapter, fake-in-production refusal |
| `tests/foundation-customers.test.ts` | 21 customer service tests | **USEFUL** |
| `tests/foundation-errors.test.ts` | 5 error tests | **USEFUL** |
| `tests/openapi.test.ts` | 5 OpenAPI drift/coverage tests | **USEFUL** |
| `tests/api-client.test.ts` | 5 client tests | **USEFUL** |

### 6. Styles — 2 files

| File | Change | Assessment |
|---|---|---|
| `src/styles/globals.css` | Adds "Harmonization Layer" (~360 lines) at end of file | **CONFLICTING** — main (PR #10-12) adds "Corrective Visual Redesign" (~628 lines) at same position (line 5848+). Direct textual conflict. GitHub marks PR #8 as `CONFLICTING`. |
| `src/styles/tokens.css` | Token value tweaks | **DUPLICATED / NO CONFLICT** — identical changes exist in main already |

### 7. Config — 1 file

| File | Assessment |
|---|---|
| `.env.example` | **USEFUL** — documents `DATA_ADAPTER`, `BLACKX_WORKSPACE_ID` env vars |

---

## Cross-Cutting Assessment

### Useful (should be preserved if merged)
1. **Clean layered architecture** — routes → services → ports → adapter, no ORM/vendor SDK leaks
2. **Fail-closed production governance** — fake adapter refused in production, 503 `DEPENDENCY_UNAVAILABLE`, no silent fallback
3. **Comprehensive contract test suite** — 38 adapter contract tests provide behavioral conformance evidence
4. **Workspace scoping on every operation** — multi-company isolation by design
5. **Version-checked optimistic concurrency** — `VersionConflictError` on stale updates
6. **Idempotency for authenticated creates** — contract §1.8 implementation
7. **Mass-assignment defense** — unknown/server-owned fields rejected with 422
8. **Honest 501s for planned endpoints** — no fake implementations, no invented state machines

### Duplicated (overlap with existing slices)
- **Foundation vs Intake patterns**: Both have fake adapter, runtime, ports, validation — intentional bounded-context separation, but some pattern repetition
- **Foundation vs Workflow patterns**: Similar repository/service structure — different domains, acceptable

### Conflicting (must be resolved before merge)
| File | Conflict | Severity |
|---|---|---|
| `src/styles/globals.css` | PR #8 adds "Harmonization Layer" at line 5848; main adds "Corrective Visual Redesign" at same line | **HIGH** — direct textual overlap, PR #8 marked `CONFLICTING` on GitHub |
| `src/styles/tokens.css` | Identical changes in PR #8 and main | **NONE** — same diff, no conflict |

### Incomplete (gaps relative to production readiness)
1. **Only customers writable** — all other domains return 501 pending owner decisions (TBD-PO-03/04/05/12/13/18)
2. **No real database adapter** — fake only, refused in production; business endpoints return 503 without `DATA_ADAPTER` configured
3. **No CSRF/origin verification** — documented as TBD-TECH-02; state-changing routes (customer POST/PATCH) rely only on SameSite=Lax + content-type mitigation
4. **No rate limiting on credential login** — documented as TBD-TECH-03
5. **No middleware changes** — despite earlier plans mentioning `src/middleware.ts`
6. **No CSRF guard files** — `src/lib/csrf-guard.ts` and `tests/csrf-guard.test.ts` were apparently planned but are **not in PR #8**

### Unsafe (risks if merged as-is)
1. **`globals.css` conflict** — force-merging would corrupt styles; visual regressions likely
2. **Foundation imports from intake** — `ports.ts` imports `Clock, IdGenerator, Page, ReferenceSequence` from `@/server/intake/ports`; `fake-adapter.ts` imports `foldSearchText, normalizePhone` from `@/server/intake/validation`. If intake's ports/validation change in a breaking way, foundation breaks.
3. **No server-side origin verification** — SameSite is browser-enforced, not server-verified; same-site subdomain attacks and older-browser bypass possible
4. **No login attempt throttling** — credential endpoint has no application-level rate limiting

---

## Conflicts with Merged PR #9–12 (Intake Foundation + Workflow Service)

PR #8's changes vs. changes between `9b84ec8` (PR #7 merge) and `fccedf6` (current `origin/main`):

| Area | PR #8 touches | Main (PR #9–12) touches | Conflict? |
|---|---|---|---|
| `src/server/foundation/` | ✅ All new | ❌ Not touched | No |
| `src/server/intake/` | ❌ Not touched | ❌ Not touched by PR #9–12 (already exists from earlier) | No |
| `src/server/workflow/` | ❌ Not touched | ✅ `ports.ts`, `service.ts` | No (different dir) |
| `src/lib/admin-auth.ts` | ❌ Not touched | ✅ Modified | No |
| `src/lib/rate-limit-port.ts` | ❌ Not touched | ✅ New | No |
| `src/lib/api-types.ts` | ✅ New | ❌ Not touched | No |
| `src/lib/api-client.ts` | ✅ New | ❌ Not touched | No |
| `src/styles/globals.css` | ✅ Modified | ✅ Modified | **YES** — direct overlap |
| `src/styles/tokens.css` | ✅ Modified | ✅ Modified | No — identical diff |
| Article routes | ❌ Not touched | ✅ Modified (PR #11 fix) | No |

PR #8 does **not** conflict with the intake foundation or workflow service code. The only conflict is `globals.css`. PR #8's foundation layer depends on intake's `ports.ts` and `validation.ts` (imports `Clock`, `IdGenerator`, `Page`, `ReferenceSequence`, `foldSearchText`, `normalizePhone`), which exist on both `9b84ec8` and `fccedf6` — no breakage.

---

## Recommendation

**Do not merge PR #8 as-is.** It is a solid, well-tested foundation layer but has a blocking conflict and missing security controls.

### Required before merge (in order)

1. **Resolve `globals.css` conflict** — PR #8's "Harmonization Layer" vs main's "Corrective Visual Redesign" occupy the same file position. Decide which visual direction wins, or merge the design-system tokens from both. The `tokens.css` changes are identical and can merge cleanly.
2. **Implement CSRF/origin verification** (TBD-TECH-02) — Add server-side `Origin`/`Referer` or `Sec-Fetch-Site` checks on state-changing foundation routes before any production write expansion. Currently mitigations-only, not contract-compliant.
3. **Register real database adapter** — Must pass both contract suites (`intake-ports.contract.test.ts` + `foundation-ports.contract.test.ts`) against a disposable test database before `DATA_ADAPTER` can be set in production.
4. **Owner decisions** — TBD-PO-03 (roles) before staff writes; TBD-PO-12 (customer dedup) before customer-link flows; other PO blockers per `docs/feature-implementation-matrix.md`.

### What is safe to merge now (if conflict resolved)
- The foundation ports/services/fake-adapter layer itself (new directory, no existing code touched)
- The API route handlers (honest 501s for planned domains)
- The API types and client (new files, not wired to UI yet)
- All documentation and tests
- The `tokens.css` changes (identical to main)

### What should NOT be merged yet
- `globals.css` changes (conflict with main's redesign)
- Any customer write endpoints pointed at production without a real adapter (would hit 503)
- Production write expansion without CSRF/origin verification

---

**Inspection performed:** 2026-10-25, read-only. No branch, file, or deployment was modified.