# BLACK X ERP — UI redesign and functional dark mode

Verification date: 26 October 2026.

Branch: `arena/0ab0121b-blackx-construction-finishing`  
Base: `492f18786bbb5d2a6e613a26c96723e763257d67` (main at task start).

## Scope and implementation

- One scoped Admin/ERP theme boundary: `.admin-theme-root[data-admin-theme]`. The guarded dashboard layout wraps the existing shell **after** `requireReviewAccess`; its authorization call and role forwarding remain intact.
- `src/styles/admin-theme.css` owns semantic light/dark tokens, maps the existing color/Admin/BX/chart/button variables, and adapts historical fixed-color surfaces. No second global theme system or document-wide theme attribute was introduced. Public website and customer Portal styling remain outside this boundary.
- Warm off-white light mode; charcoal and forest dark mode; restrained olive/forest actions and gold accents. Consistent surfaces, borders, focus rings, typography, spacing, card radii, and shadows.
- The actual dashboard keeps its existing data and preview disclosures. Its tracking context and action strip are clearer, the existing BLACK X ERP entry is prominent, and KPI cards are individually defined and responsive rather than one oversized band. No metrics or sources were invented or replaced.
- Navigation retains all existing ERP and website Admin destinations, search, grouping, active states, and the keyboard command dialog. The sidebar uses a stable dark palette in both modes. Mobile drawer, header tools and utility controls retain their existing behavior. The command dialog is portalled into the theme boundary, outside the inert drawer, so it inherits the active theme.
- Forms, native select controls/options, tables and striping, dialogs, notifications, chips, chart tracks/labels, workflow markers, preview statuses, disabled controls and errors use semantic colors. Required/error/status text is retained; colors are not the only indicator. Reduced-motion rules suppress decorative movement within the boundary.
- No application dependencies or lockfiles changed. Browser-only tooling was installed outside the repository for verification, not shipped with the application.

## Preference behavior

`src/lib/admin-theme.ts` and `src/components/dashboard/AdminTheme.tsx` implement the preference:

1. A valid saved `blackx.admin.theme` value (`light` or `dark`) wins.
2. Without a valid explicit choice, use `prefers-color-scheme` and follow OS changes.
3. The localized sun/moon toggle is a native button with a descriptive accessible name, pressed state, focus treatment and a minimum 44px target. Its mobile icon retains the accessible name.
4. A selection applies immediately and persists through refresh and Admin/ERP and locale navigation. Storage events synchronize other tabs. Clearing the preference resumes OS selection.
5. A constant, self-contained script appears before shell markup and sets the boundary's theme during parsing. A layout effect handles hydration/client navigation without changing the public document's theme. This reduces bright first-paint flashes when inline scripts are allowed; script-blocking policies or JavaScript being disabled can leave the light fallback.
6. Blocked/full localStorage does not break the workspace or toggle. In that case the selection lasts for the mounted workspace; durable refresh persistence cannot be guaranteed by a browser that refuses storage.

## Changed files

| File | Purpose |
| --- | --- |
| `src/lib/admin-theme.ts` | Preference validation/resolution and constant early bootstrap |
| `src/components/dashboard/AdminTheme.tsx` | Scoped provider and localized accessible toggle |
| `src/styles/admin-theme.css` | Central tokens, legacy adapters and responsive theme styling |
| `src/app/[locale]/dashboard/layout.tsx` | Add the provider behind the unchanged access guard |
| `src/components/dashboard/DashboardShell.tsx` | Supply the appearance control to the existing shell |
| `src/components/ui/AppShell.tsx` | Optional utility-content slot; existing callers remain compatible |
| `src/components/dashboard/ErpNavigation.tsx` | Keep the command portal within the theme boundary |
| `tests/admin-theme.test.ts` | Preference, persistence, localization, bootstrap, isolation and semantic contrast tests |
| `tests/admin-erp-integration.test.ts` | Retain guard/route assertions with the wrapper; add portal regression coverage |
| `docs/ADMIN_THEME_REDESIGN.md` | Implementation, verification and limitations |

## Automated verification

Final commands:

```sh
npm test
npm run typecheck
npm run lint
npm run format:check
node scripts/generate-erp-route-inventory.mjs --check
npm run build
git diff --check
```

Results:

- Full suite: **974 passing tests in 30 files**.
- Theme-specific tests: **13 passing**; Admin/ERP integration tests: **18 passing**. These are unit/DOM/source checks, not authenticated E2E tests.
- TypeScript: passed.
- ESLint: passed with zero warnings.
- Prettier check: passed.
- Route inventory: matches the unchanged registry, **318 localized routes**.
- Production build: passed.
- Diff whitespace check: passed.

Known non-failing output: the build reports the existing `jose`/NextAuth `CompressionStream` and `DecompressionStream` Edge-runtime warnings; the inventory script reports its existing Node module-type warning. React emits a client-created-script warning in the isolated DOM fixtures: client rendering does not execute script tags. Bootstrap execution is separately checked both directly and in a real parser-driven SSR browser fixture, with hydration intentionally blocked. No warning was suppressed to make a test pass. Authentication/dependency behavior was not modified to address unrelated warnings.

## Actual browser verification — isolated real-component fixture

Chromium ran against an **isolated SSR + hydration fixture**, importing the actual application shell, overview, ERP directory/page components, styles and fonts. Next navigation/link/auth boundaries were test doubles; diagnostic arrays were explicitly test-only, not live service results. The fixture router is not the Next App Router. This is real browser rendering and interaction verification, **not authenticated application/Production acceptance**.

### Layout and visible-text audit: 720 cases

| Coverage | Cases |
| --- | ---: |
| Actual dashboard, AR/RTL and EN/LTR, light and dark, widths 320/375/390/768/1024/1280/1440 | 28 |
| Representative page in all 15 ERP modules, both locales/themes, widths 390 and 1440 | 120 |
| All 143 registered ERP leaf pages, both locales/themes, width 1280 | 572 |
| Total | **720** |

Representative pages: permissions/roles, accounting/overview, treasury/overview, cheques/incoming, sales/boq, purchasing/overview, inventory/overview, projects/portfolio, reporting/overview, settings/general, quality/inspections, crm/customers, communications/overview, administration/overview and data/validation.

Final result: **zero detected page-level horizontal overflows, clipped shell titles, topbar control/title overlaps, visible-text contrast failures, or unexpected browser errors** in this matrix. The computed-color probe accounts for ancestor backgrounds and alpha compositing and uses 4.5:1 for ordinary text / 3:1 for large text; this is not a complete WCAG conformance audit. Native input values, placeholders, disabled text and non-text indicators also received separate token checks/visual inspection; the probe alone does not verify every visual or assistive-technology condition.

### Interactive states: 32 additional cases

Eight states in each locale/theme combination:

- Expanded header tools.
- Open mobile drawer, visible ERP entry, Escape close and updated expanded state.
- Keyboard-opened command dialog, themed portal, search and actual result-link navigation.
- Local JSON validator result (explicitly not an import or saved business record).
- Expanded draft form with local validation errors and disabled lookup/select fields.
- Synthetic identity preview details.
- Native UI-permission picker modal, followed by Escape dismissal (no real grants).
- Desktop navigation keyboard focus and visible outline.

All **32 passed**, with no detected overflow, title clipping, visible-text contrast failures or page errors. Reduced motion was enabled for the browser matrices. OS-dark default, keyboard Enter activation, explicit-choice persistence after reload, locale/module navigation, and pre-hydration saved-dark background were also asserted. The one deliberately aborted hydration resource is recorded separately as an expected blocked request, not hidden among application failures.

### Evidence and limitations

Full JSON results, browser fixture scripts and screenshot evidence are saved outside Git at `/home/user/BLACKX_THEME_REVIEW/`. They are verification artifacts, not application code or a deployment. The browser tooling and fixture must never be used as a production/authentication implementation.

- No authorized authenticated owner session was available. No credentials, fake grants, application auth bypass, session-secret changes or backend setup were introduced to obtain one.
- Authenticated Next App Router navigation, real permission-dependent content, live API workflows, notification delivery and authoritative service-connected data remain unverified in a real owner session. Existing guards and workflow tests remain passing.
- The 143-leaf audit covers default page states at desktop width; it is not every tab/action/filter combination at every width. The specified seven-width matrix covers the dashboard, with all major modules additionally checked on mobile/desktop.
- Chromium only. No Safari/Firefox, real touch-device, screen-reader, forced-colors or complete automated accessibility acceptance claim is made.
- Existing deferred, illustrative, frontend-simulation and disconnected-service labels remain accurate and visible. The theme does not make those features operational.

## Repository and deployment safety

Only the current feature branch is changed and locally committed. No main modification, merge, force-push, push, PR creation or deployment is part of this task. No Vercel Preview or Production deployment was requested or created. The separate `blackx-erp-live` project is untouched. No backend, database, authentication behavior, API contract, credentials, application environment files/variables or Production settings were changed. Existing package/lock files and unrelated files are unchanged.

Wait for explicit approval before pushing or deploying this work.
