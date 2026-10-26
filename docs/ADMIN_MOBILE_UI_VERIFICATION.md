# Existing Admin mobile UI refinement

## Scope

UI-only change on `arena/54de42da-blackx-construction-finishing`, based on
`9690d8c7e974e7cd6cf533ae0bf43dcfcf9aadfd`. No routes, authentication,
backend, database, dependency, environment or deployment configuration changes.
No screenshot attachment was available in this turn; the actual existing
components and their CSS cascade were inspected instead.

- Give the Admin header explicit heading, utility and tools rows. On mobile,
  the menu and title share the first row; language/sign-out occupy their own row.
- Permit Arabic/English titles and breadcrumbs to wrap instead of clipping.
- Put all existing ERP header tools in a native keyboard-operable disclosure,
  closed initially. Its expanded content stays in normal flow, not a floating menu.
- Stop the tall mobile header sticking over content while scrolling.
- Highlight the unchanged localized ERP destinations with green/gold,
  generously padded links in both the overview and existing sidebar.
- Allow dashboard action groups to wrap at intermediate desktop widths;
  use responsive mobile action grids and consistent spacing.
- Keep Admin feedback in document flow rather than floating over records.
  The live-region semantics and dismiss handler are unchanged. Portal toast
  positioning and public-site styles are not changed.

## Quality checks

Executed using Node 22.22.3:

| Check                  | Result                      |
| ---------------------- | --------------------------- |
| `npm test`             | PASS: 1,016 tests, 30 files |
| `npm run lint`         | PASS, zero warnings         |
| `npm run typecheck`    | PASS                        |
| `npm run format:check` | PASS                        |
| `npm run build`        | PASS                        |
| `git diff --check`     | PASS                        |

The full workspace suite includes the existing unrelated, untracked 56-case
commercial test file. It is not included in this commit. The integration suite
now has 17 cases, including two added locale-specific checks for separated
header controls, retained tool actions, density toggle and prominent ERP entries.

## Browser layout evidence

An isolated Chromium harness rendered the **real** `DashboardShell`,
`AppShell`, async Admin overview, header tools, navigation and toast components
with the actual global, site and ERP CSS, Cairo/Inter font assets and logo.
It used Playwright Core 1.61.1 with an npm-packaged Chromium binary.
Only the harness mocked Next navigation/link/session functions; it is not an
application route, is not deployed, and does not change or bypass real guards.
Browser tooling and generated screenshots live outside Git under
`/home/user/.arena/mobile-visual/`.

Arabic RTL and English LTR were exercised at **320, 375, 390, 768, 960, 1024
and 1440px**, with a 900px-high viewport:

- All 14 overview cases: no document horizontal overflow, no clipped title,
  no intersections between header title/menu/utility controls, and no browser
  page errors. Expanded tool controls fit within the viewport and are at least
  44px high. The highlighted overview entry is at least 52px high.
- Native tool disclosure opens; the compact-density button updates its pressed
  state and shell class. Toast dismissal invokes its existing handler.
- Mobile drawer opens, exposes the highlighted localized ERP link and closes
  using Escape. Desktop navigation remains in the existing sidebar.
- Additional Arabic/English 320px and 1440px cases rendered the real long
  administration/session title and breadcrumbs without horizontal overflow or
  title clipping. Only the shell pathname was changed; the body remained the
  overview fixture, so this is a header stress test, not ERP route acceptance.
- Screenshots were visually inspected for narrow Arabic/English overview,
  Arabic long breadcrumbs, expanded tools, mobile drawer, desktop Arabic/English
  layouts and narrow English attention cards. The initial 1024px action-row
  overflow was corrected, and the full 14-case matrix was rerun successfully.

Evidence: `results.json`, `extra-results.json`, screenshots and quality-check
logs in the directory above. These are local test artifacts, not committed app
assets. Browser measurements are not comprehensive accessibility certification.

## Limits and preservation

This verifies layout in an isolated real-component browser fixture, **not an
authenticated Next.js/Preview session**, deployed rendering, real sign-out or
cross-route browser navigation. No authorized live session was available, and
no attempt was made to bypass authentication. The real server layout and
middleware guards remain unchanged; inherited guard behavior and all registered
ERP destinations are covered by the existing integration tests.

No persistent floating dashboard widget was found in the inspected Admin
components beyond the existing toast/drawer controls. External Vercel/Arena
browser overlays are outside this repository and were not modified.

The seven original unrelated untracked reports/test artifacts are preserved
and excluded from staging. No push, merge, Production deployment or Vercel
setting change is part of this UI task.
