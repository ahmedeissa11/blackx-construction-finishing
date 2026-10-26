# BLACK X — ERP integration into the existing Admin

Date: 2026-10-26

## Entry points and implementation scope

- Arabic Admin: `/ar/dashboard`; ERP entry: `/ar/dashboard/erp`.
- English Admin: `/en/dashboard`; ERP entry: `/en/dashboard/erp`.
- The existing dashboard now has a direct **BLACK X ERP workspace** action. The same clearly named entry is pinned in the shared sidebar, alongside the Admin overview.
- Existing website administration and ERP use **one** `DashboardShell` / `AppShell`, sidebar, mobile drawer, language switch, breadcrumbs, sign-out and server-guarded dashboard layout. ERP is not a second application or public route tree.
- No ERP page was recreated, deleted, renamed or moved. The existing dynamic directory/hub/leaf routes were already under the Admin layout; this change corrects discoverability and navigation integration rather than pretending those routes were newly built.

## Verified initial repository state

The session branch is `arena/54de42da-blackx-construction-finishing`. Initially local HEAD was `0490b45dbed366b985d0a7aa657656013a3d9085`, while the remote feature tip was the approved `1168d370b09ee5a122667b304fef220e7f8e886e`. All 272 approved files already matched the working tree byte-for-byte; there were no staged changes. The local feature reference/index was fast-forwarded to the approved commit without replacing working files. Existing unrelated untracked work was preserved and excluded from the integration scope. No later remote feature commits were found. Remote `main` remained at `0490b45dbed366b985d0a7aa657656013a3d9085`.

## Navigation corrections

1. Named ERP entry instead of a generic module-directory link; an additional entry on the existing Admin overview.
2. Four presentation groups over the existing 15 ERP modules, retaining their existing section submenus and every leaf destination.
3. Website administration remains in the same sidebar, grouped using the original `dashboardNavGroups`. Its duplicate overview entry was removed; the pinned overview remains.
4. Shared quick navigation now searches both website Admin and ERP destinations in Arabic and English. Sidebar no-results feedback accounts for website Admin matches as well as ERP matches.
5. Changing routes clears the sidebar filter so a previously filtered-out active page becomes discoverable. Active modules expand; nested existing Admin record routes retain their parent module active state.
6. Unsupported presentation roles fall back to the original Admin navigation rather than replacing it with an empty custom sidebar. This is a presentation fallback only: server access guards are unchanged and no role is granted access.
7. Existing ERP breadcrumbs continue to link Admin overview → ERP directory → module → leaf. No duplicate sidebar or additional layout was introduced. The existing mobile drawer closes on links and Escape; RTL/LTR inheritance and logical CSS properties remain intact.

## Authoritative route inventory

**Registry:** `src/config/erp.ts`.
**Presentation groups / derived inventory:** `src/config/erp-navigation.ts`.
**Complete machine-readable inventory:** `docs/ERP_ADMIN_ROUTE_INVENTORY.json`.

Every inventory entry includes its localized path, module/page IDs, navigation group, actual presentation kind, localized title/section/summary, canonical destination where applicable, inherited layout and owner-review access boundary.

Generate or check it using Node >=22.18:

```sh
node scripts/generate-erp-route-inventory.mjs
node scripts/generate-erp-route-inventory.mjs --check
```

The regression suite independently compares the generated entries to the registry, retained route-ID fixture, actual route files and rendered navigation. Query-selected layouts (`?view=...`) are not counted as additional routes.

| Navigation group | Existing module | Leaves |
| --- | --- | ---: |
| Clients, sales & purchasing | crm | 11 |
| Clients, sales & purchasing | sales | 11 |
| Clients, sales & purchasing | purchasing | 11 |
| Clients, sales & purchasing | communications | 7 |
| Project delivery, inventory & quality | projects | 16 |
| Project delivery, inventory & quality | inventory | 11 |
| Project delivery, inventory & quality | quality | 7 |
| Finance, treasury & reporting | accounting | 13 |
| Finance, treasury & reporting | treasury | 8 |
| Finance, treasury & reporting | cheques | 8 |
| Finance, treasury & reporting | reporting | 12 |
| System, administration & data | permissions | 6 |
| System, administration & data | settings | 8 |
| System, administration & data | administration | 8 |
| System, administration & data | data | 6 |
| **Total** | **15 module hubs** | **143 leaves** |

Including the ERP directory, this is **159 routes per locale / 318 localized URLs**, not 318 independent features. All existing ERP routes are integrated into the shared Admin layout. The audit found no missing or duplicate registered destinations requiring new route definitions. Navigation access was corrected for all of them; **zero route paths changed**.

### Actual leaf presentation status

| Registry kind | Count | Meaning |
| --- | ---: | --- |
| preview | 22 | Existing preview component; not a durable backend workflow |
| fixture | 15 | Read-only illustrative data, not authoritative records |
| shared | 34 | Guarded navigation entry pointing to a canonical existing presentation; not a separate implementation |
| deferred | 59 | Explicitly unavailable business capability with preserved page/requirements structure |
| readiness | 8 | Readiness/configuration structure, not activation of a service |
| tool | 3 | Local utilities, not operational imports/exports |
| source-link | 1 | Link to an existing Admin view, not an embedded new feature |
| instructions | 1 | Instructions, not a persisted configuration editor |
| **Total** | **143** | No backend operational status was upgraded by navigation integration |

## Verification evidence and limits

A new integration suite exercises one sidebar/layout, every registered ERP/sidebar destination in both locales, all existing Admin entries without duplicate overview links, a representative leaf in every module in both locales, complete breadcrumbs/active state, command search, filter reset on route changes, fresh direct-route mounts, mobile drawer link/Escape behavior, role fallback and inherited server denial behavior. Existing suites additionally invoke every module/leaf route in both locales behind a mocked successful server guard and reject invalid/unauthorized destinations.

- **Broader working-tree suite:** 1,014 tests / 30 files passed in the initial full integration run. This includes the pre-existing, unrelated 56-case commercial-gate suite; it is not all integration-commit content. A final rerun and isolated staged-tree results are recorded below after execution.
- TypeScript, lint, formatting and production build passed after correcting three scoped lint findings. Node used: **24.15.0**.
- Production build generated **131 whole-application static entries**, not the ERP route count. Existing `jose` Edge `CompressionStream` / `DecompressionStream` compatibility warnings remain; no runtime dependency workaround was introduced.
- Local production-server HTTP checks exercised **318 ERP URLs twice (636 requests)** with no cookies: every request returned the expected **307** localized login redirect with the exact relative callback, including repeat/refresh requests. This proves anonymous fail-closed handling, not authenticated ERP rendering.
- Both public locale roots returned **200**, with correct `rtl` / `ltr` HTML direction and no Admin sidebar.
- The local server intentionally had no owner/session secrets. Auth.js logged the existing **MissingSecret** configuration error; `/api/v1/ready` returned **503**. No credentials, fake account or bypass were created to hide this limitation. The temporary server was stopped after checks.
- Authenticated real-browser page refresh, actual owner login, pixel-level responsive layout, native browser/accessibility and deployed behavior remain **unverified**. DOM/source tests are not reported as visual browser acceptance. The remaining requirement for that acceptance is an existing authorized application session and browser test environment, not a new Vercel setup or authentication-code change.

## Backend and security boundaries preserved

The application still has a single environment-configured `owner_review` identity. Synthetic users, roles and permissions are not staff provisioning or server grants. Local journal/BOQ/purchase/receipt/return exercises and drafts remain temporary, not shared or durable records. No production-capable data adapter is registered; the fake adapter is refused in production. Business APIs remain fail-closed (503) or planned (501), as implemented. No claim is made that accounting, stock, approvals, payments, communications, audit history or backup/restore are operational.

No backend/API/authentication/middleware changes, environment updates, dependency upgrades, security-rule changes, Vercel operations or company-domain operations were performed. `main`, the company Production deployment/settings and `blackx-erp-live` were left untouched. The five pre-existing dependency audit findings were disclosed, not bulk-fixed.

## Final rerun and isolated staged-tree results

The exact staged tree was exported using `git write-tree` / `git archive`, installed separately with `npm ci --ignore-scripts`, and checked under **Node 24.15.0** without local environment files or unrelated untracked tests.

| Final check | Working tree | Isolated staged tree |
| --- | --- | --- |
| Full tests | **1,014 passed / 30 files** | **958 passed / 29 files** |
| TypeScript | Passed | Passed |
| ESLint | Passed, zero warnings | Passed, zero warnings |
| Formatting | Passed | Passed |
| Production build | Passed, existing Edge warnings disclosed above | Passed, existing Edge warnings disclosed above |
| Inventory synchronization | Passed, 318 URLs | Passed, 318 URLs |
| Anonymous route + repeat checks | 636 expected redirects / zero failures | Not repeated; source/server composition checks and clean build passed |

The 56-test difference is exactly the unrelated, pre-existing `tests/workflow/commercial-gate.test.ts`, preserved but deliberately excluded from the integration commit. The 15 new integration cases were retained and pass in both suites. The native TypeScript inventory utility also emits Node's module-type auto-detection warning; no package module-mode change was made to suppress it.

A baseline hash comparison confirmed **252 recorded pre-existing source/test/doc/configuration files outside the five scoped edits remain byte-identical**. Existing unrelated untracked reports and commercial tests were excluded from staging. Only the five frontend modifications and five new integration/configuration/inventory/test/documentation files are in the ten-file integration scope. No existing test was removed or weakened. The final report update after the clean run changes documentation only.
