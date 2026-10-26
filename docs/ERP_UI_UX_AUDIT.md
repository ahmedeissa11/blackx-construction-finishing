# BLACK X ERP — application UI/UX audit

Date: 26 October 2026. Implementation baseline: `4c0e0f13ced9e2c1851234137125bd6cd4412596`.

## Evidence and limits

Fetched `origin/main`: `492f18786bbb5d2a6e613a26c96723e763257d67`. Inspected approved theme `1f5b1de…`, workspace `e018367…`, polish `4c0e0f1…` and the clean current branch. The session branch is fixed; work stays on `arena/0ab0121b-blackx-construction-finishing` without rewriting history.

**No 164-second recording was attached or found in the accessible workspace. It was not watched.** The audit below is based on actual source and isolated Chromium rendering of real components, not an invented account of the recording. Please supply the recording for a later reference-specific comparison. No authenticated Preview session is available here and no deployment was authorized.

Baseline browser audit: **136 renders**, all 15 module representatives plus workspace/dashboard, AR/EN, light/dark, 390/1440. No geometry/contrast failures in that existing matrix. This is important: the principal defects are task hierarchy and information density, not merely broken colors or overflow. Evidence: `/home/user/BLACKX_ERP_OVERHAUL_REVIEW/before/`.

## Recurring issues and priorities

| Priority | Observed problem                                                                                                                                                         | Shared cause / planned correction                                                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1       | Title repeated in sticky shell and leaf intro; global warning, module boundary, summary, evidence, layout disclaimer and prerequisites precede actual task               | One content-owned page title; slim global context header; task summary and actions first; explicitly labelled supporting context separated from task content                                                                              |
| P1       | Tables start very far below the fold                                                                                                                                     | At EN/light/1440 first table starts at y=1895 on accounting overview, 2379 on purchasing invoices, 1697 on sales BOQ. Group parameters into fieldsets and consolidate layout orientation; remove repeated framing, not safety disclosures |
| P1       | Sidebar is 288px at desktop and retains expanded modules from earlier routes; long module/page names and internal IDs compete for attention                              | 256px desktop navigation, explicit collapse/restore control, active-route expansion and progressive business-area hierarchy; retain all destinations/search/command palette                                                               |
| P1       | Shared layout preview combines description, layout switcher, parameters, workbench, placeholder table, unavailable actions and local draft in one undifferentiated panel | Reorganize shared page/layout components into named working sections; concise layout heading and separate scope/reference context; preserve distinct identity, financial, cost, reporting and operational tools                           |
| P1       | Forms are flat grids; labels, helper text and actions have no section-level hierarchy                                                                                    | Semantic fieldset/legend primitive; group references, dates and detail fields from existing schema types; use same structure for synthetic identity form; retain handlers, IDs, values, validation and disabled lookup boundaries         |
| P1       | Three table implementations have different wrappers, filters, row sizing, totals and empty handling                                                                      | Shared accessible scroll-region/toolbar primitives; uniform scoped table anatomy and numeric alignment; retain existing data, sort/filter/page/row operations                                                                             |
| P2       | Multiple stacked framed sections make source-linked operational boards feel like separate applications within a page                                                     | Unbox supporting notes, use section separators and spacing, place task/source content before secondary layout reference on source-backed pages                                                                                            |
| P2       | Dashboard KPIs, action queue and summaries compete; long vertical stacks                                                                                                 | Existing data only; compact KPI and two-level dashboard composition, group queue and project/activity work, consistent surface headers and list rows                                                                                      |
| P2       | Primitive sizes mostly exist as literals across several stylesheets                                                                                                      | Add centralized spacing/type/radius/control/layout/elevation tokens to existing theme boundary; one scoped Admin composition stylesheet, no new theme storage/system                                                                      |
| P2       | Arabic long headings need generous line boxes, but paragraphs and tiny metadata become dense                                                                             | Preserve glyph-safe line heights, set readable body/meta scale, reduce duplicated copy instead of shrinking Arabic text                                                                                                                   |
| P2       | Dark surfaces often use the same background through outer panels, forms and tables                                                                                       | Reuse existing charcoal palette with intentional canvas/surface/raised/table-header roles, subtle separators, visible focus; no green-wash or gradients                                                                                   |

## Module/type inspection map

Source coverage includes the registry and the renderer branches reached by all 143 leaf pages. Baseline browser representatives are recorded in `before/representatives.json`:

- Permissions: roles/identity simulation and permission picker.
- Accounting: overview / account hierarchy and journal layout/workbench.
- Treasury: overview / monetary structures.
- Cheques: incoming / deferred register structure.
- Sales: BOQ / local calculation and parameter/draft layouts.
- Purchasing: invoices / cost lines, filters and disconnected table.
- Inventory: items / stock references and disabled lookups.
- Projects: portfolio / existing operational board.
- Reporting: overview / dependency/report references.
- Settings: general / configuration scope.
- Quality: inspections / construction adaptation and existing review source.
- CRM: customers / existing operational customer data.
- Communications: overview / message review source.
- Administration: overview / identity scope and diagnostics.
- Data: validation / local file-format tool, no import.

## Implementation and acceptance plan

1. Preserve registry, route files, security, data sources, public website and persistent theme implementation.
2. Improve shared shell/navigation, content header, table wrappers/toolbars and form fieldsets structurally; scope visual changes to authenticated Admin.
3. Apply to shared directory/leaf/layout/register/identity and existing dashboard components; preserve business-specific workbenches and boards.
4. Render every leaf in both languages/themes and audit all seven widths on representatives. Report automated rendering separately from human screenshot inspection.
5. Capture matching before/after workspace, dashboard, table, form and operational-module views. Add keyboard/collapse/search/filter/sort/pagination/validation/theme regression checks. Run full tests, TypeScript, lint, formatting, inventory and build.
6. Local commit only. No push, merge, credentials/environment edits or deployment.

## Post-implementation disposition

Implemented the shared structural plan; see `docs/ERP_UI_UX_OVERHAUL_REPORT.md` for exact components, file list, module-specific preservation and acceptance limits. Final verification: 999 tests/31 files, TypeScript, ESLint, formatting, 318-route inventory and production build pass. Initial exhaustive browser scan: 4,900 renders / 4,480 unique cases across every localized ERP page, both themes and all seven widths, plus dashboard. Three inherited theme-transition contrast findings were corrected and rechecked in 420 hub cases plus 32 immediate flips; queue composition was corrected after human screenshot review and rechecked in 28 cases. Final coverage has no unresolved measured failures. Keyboard/dialog checks: 36; register/grouped-form checks: 80. This is isolated Chromium evidence, not authenticated application acceptance or full manual review of every route. The unavailable recording and authenticated acceptance remain open. No push or deployment was performed.
