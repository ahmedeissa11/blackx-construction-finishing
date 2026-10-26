# Evidence-based verification — BLACK X ERP Admin

> **Final acceptance audit:** [§16: Final frontend acceptance and scoped closure](#16-final-frontend-acceptance-and-scoped-closure--2026-10-26) independently rechecks **15 hubs / 143 leaf IDs**, **999 passing tests / 29 files**, fixes account-inspection focus restoration and recommends closure **only for the documented preview-only frontend scope**. Native browser/device/assistive-technology acceptance remains **unverified**, not silently passed. §§1–15 are preserved phase history.

> **Previous frontend-only delivery:** [§15: Comprehensive coverage and quality pass](#15-comprehensive-frontend-coverage-and-quality-pass--2026-10-26) records **999 passing tests / 29 files**, **76 profiled routes / 109 layout placements / 93 unique view IDs**, local user creation/editing, accounting and construction exercises. All **15 hubs / 143 leaf IDs** remain. Operational completeness and native browser acceptance are **not** claimed. §§1–14 are retained phase history.

> **Previous frontend-only delivery:** [§14: Frontend-only permissions, users and roles](#14-frontend-only-permissions-users-and-roles--current-delivery) records the current interactive previews and **878 passing tests**. The catalogue remains **15 hubs / 143 leaf IDs**. No backend, auth/session/security, database or deployment behavior changed. Earlier sections are phase history; §14 supersedes the disconnected user/role layout descriptions only where identified below.

> **Previous screen delivery:** [§13: Second-recording screen-specification expansion](#13-second-recording-screen-specification-expansion--current-screen-delivery) records the new layouts, unchanged 15/143 catalogue, all route mappings, classifications and **833 passing tests**. §§1–12 remain phase history; §13 supersedes earlier no-layout-control descriptions only where explicitly mapped. No operational backend was enabled.

> **Phase 2 update:** §§1–10 below are the historical pre-correction review. Current titles, presentation counts, corrections, tests and limitations are recorded in **[§11: Phase 2 defect resolutions](#11-phase-2-defect-resolutions--current-implementation)**. Original line anchors/classifications describe the reviewed baseline, not the corrected code. All original URLs remain valid.

> **Phase 3 persistence-gate update:** [§12](#12-phase-3-commercial-workflow-persistence-gate) records the current blocked integration status and safety tests. The detailed workflow/interface audit is in [PHASE3_COMMERCIAL_WORKFLOW_AUDIT.md](./PHASE3_COMMERCIAL_WORKFLOW_AUDIT.md). Phase 2 UI corrections remain complete; a durable commercial workflow is not implemented.

**Review date:** 2026-10-26. **Branch verified:** `arena/54de42da-blackx-construction-finishing`. Review of the current working tree, not a new release or a production acceptance certificate. The branch/PR was not changed. Existing uncommitted implementation/auth/CSRF work was left in place. This review adds this report only; no application feature, test, auth, environment, database or deployment configuration was edited, and nothing was pushed or merged.

## Executive verdict

**The delivered route inventory is real; operational ERP completeness is not.** The registry contains 15 module hubs and 143 leaf definitions. All 318 localized ERP destinations (directory + hubs + leaves in Arabic and English) are linked in the reviewed render graph, and registered page components render without throwing in component-level checks. However, **59 leaves are the same generic unavailable/schema template**, 41 leaves reuse an existing preview board or source link, and the rest are fixture registers, repeated local tools or read-only information. No new ERP business mutation screen is connected to a durable backend. [REG, CONTENT, DATA, CONFIG]

The delivery report is broadly candid about those limits, but “UI ready” is too strong for generic headings/columns, “source/tool-backed” is not “feature implemented”, and some route titles imply more than their actual source supplies. **The requirement “no blank or misleading pages” is not fully satisfied:** no literally blank registered page was found at component-render level, but there are link-only, semantically duplicated, thin placeholder and misleadingly scoped pages. See §§4–7. [COPY, CONTENT, DELIVERY]

**Authenticated visual/browser acceptance: NOT PERFORMED / NOT VERIFIED.** No authenticated browser session was created or tested in this review. Passing component/DOM tests and production compilation are not browser acceptance. [TESTS, DELIVERY]

## Evidence key (exact repository paths and symbols)

References in the tables apply to every row using that renderer/source. Registry module line anchors are also supplied beside each hub.

- **REG:** `src/config/erp.ts` — `erpModules`, `legacyReference` (line 27), `erpHref` (2045), `findErpPage` (2049), `canAccessErp` (2055), `erpPageCount`. Registry values are route/evidence metadata, not backend capabilities.
- **CONTENT:** `src/components/dashboard/ErpPageContent.tsx` — `ErpPageContent` (132), `ExistingView` (60), `Configuration` (82), `Dependencies` (48), `domainKeys`, `expansionKeys`; the source dispatch and final generic fallback define what a route actually renders.
- **DATA:** `src/lib/erp-data.ts` — `getErpDataset` (39), `erpDatasetNames` (22), `validateErpImport` (264). `src/components/dashboard/ErpRegister.tsx` — `ErpRegister` (9), local search/filter/reference-sort/pagination/selected state.
- **TOOLS:** `src/components/dashboard/ErpTools.tsx` — `ErpImportValidator` (9), `readFile`, `ErpExport` (112), `download`; `src/components/dashboard/ErpAccessMatrix.tsx` — `ErpAccessMatrix` (7).
- **NAV:** `src/components/dashboard/ErpNavigation.tsx` — `searchErpPages`, `ModuleGroup`, `ErpNavigation`; `src/components/dashboard/ErpDirectory.tsx` — `ErpDirectory`; `src/components/dashboard/DashboardShell.tsx` — `DashboardShell`; `src/config/navigation.ts` — `dashboardModules`, `dashboardHref`, `portalNav`, `portalHref`.
- **SHELL:** `src/components/ui/AppShell.tsx` — `AppShell`, optional `navigationContent`, `isActive`, `closeDrawer`, `buildLocaleSwitchHref` call; `src/components/portal/PortalShell.tsx` — `PortalShell`; `src/styles/erp.css` — `.erp-*` rules.
- **DOMAIN:** `src/components/dashboard/DomainBoards.tsx` — `DomainBoard` (936), `DocumentsBoard` (334), `NotificationsBoard` (641), `AuditBoard` (793), `UnavailableButton` (199), `unavailableButton` (950), `LinkedRecordLinks`.
- **EXPANSION:** `src/components/dashboard/ExpansionBoards.tsx` — `FinanceBoard` (521), `submitRecordForm`, `confirmSessionPayment`, `PurchasesBoard` (1543), `EngineersBoard` (321), `ComplaintsBoard` (1745), `MessagesBoard` (2000), `UnavailableButton` (289), `ExpansionBoard` (2109).
- **REQUESTS:** `src/components/dashboard/RequestsBoard.tsx` — `RequestsBoard`, `applyPreviewChange`, `requestSavePreview`, local `requests`/draft/selected state; `src/app/[locale]/dashboard/requests/page.tsx` — `DashboardRequests`.
- **AUTH/ROUTES:** `src/auth.ts` — `requireReviewAccess`; `src/middleware.ts` — `middleware`, `isReviewProtectedPath` call; `src/lib/review-auth-shared.ts` — `OWNER_REVIEW_ROLE`, `isReviewProtectedPath`; `src/app/[locale]/dashboard/layout.tsx` — `DashboardLayout`, `dynamic`; `src/app/[locale]/dashboard/erp/page.tsx` — `ErpIndex`; `src/app/[locale]/dashboard/erp/[area]/page.tsx` — `ErpModule`; `src/app/[locale]/dashboard/erp/[area]/[page]/page.tsx` — `ErpLeaf`; `src/lib/locale-params.ts` — `resolveLocale`.
- **CONFIG:** `src/server/foundation/config.ts` — `REGISTERED_ADAPTERS`, `getAdapterSelection`, `DOMAIN_STATUS`; `src/server/foundation/runtime.ts` — `getFoundationServices` service assembly/adapter selection; `src/server/foundation/ports.ts` — repository/domain interfaces; `src/server/foundation/services.ts` — `createFoundationServices`. Contracts/fake-adapter tests are not evidence of a durable production integration.
- **COPY:** `src/content/erp-dictionary.ts` — `erpCopy.pending`, `linked`, `previewNote`, `fields`, `settings`, `health`, `matrix`, `importHelp`, `exportHelp`; `src/content/app-dictionary.ts` — `dashboard.operations.domain.actions`, `dashboard.expansion.finance.recordForm.sessionOnlyNote`, `dashboard.expansion.purchases`, messages/complaints labels.
- **TESTS:** `tests/erp-registry.test.ts`, `tests/erp-routes.test.ts`, `tests/erp-render.test.ts`, `tests/erp-ui.test.ts`; `tests/unit.test.ts` (preview/workflow/Portal isolation checks), `tests/contract/`, `tests/workflow/transitions.test.ts`; `vitest.config.ts` — node default, jsdom per UI file, JSX transform.
- **DELIVERY:** `docs/ERP_IMPLEMENTATION_DELIVERY.md` — coverage table, verification and remaining blockers; `docs/ERP_IMPLEMENTATION_INVENTORY.md` — scope/evidence, reference-category mapping, exact route appendix.

## 1. Complete route inventory and per-leaf classification

`[locale]` below is exactly `ar` or `en`; each printed route therefore identifies two actual localized URLs. The directory is `/[locale]/dashboard/erp` and is not counted as a hub or leaf. All hub links, leaf IDs and titles below were read from `erpModules`, not inferred from labels. [REG]

### Classification rules

Each leaf gets **one primary class describing its delivered surface**, not a claim of real business readiness:

| Code | Requested class | Precise meaning in this report | Count |
|---|---|---|---:|
| E | Existing functional screen reused | Embedded existing UI, all preview/demo-based. **Not a live ERP service.** The one source-link-only route is classified D instead. | 40 |
| P | Read-only preview/fixture screen | `ErpRegister` over static fixture mappings; no writes. | 20 |
| T | Working client-side tool | Filterable owner capability matrix (5), local JSON validator (4), metadata-only exporter (2). Matrix is informational, not RBAC administration. | 11 |
| D | Deferred/readiness workspace | Generic report/overview/history placeholder, read-only configuration note, bounded diagnostics catalogue or source-link-only workspace. Not a working report/configuration/monitoring product. | 46 |
| B | Backend-dependent operation | Transaction/entity-management destination with no implemented operation; currently the **same generic deferred renderer**, not a backend caller. | 26 |
| | **Total** | Classes are disjoint; backend dependencies also affect future persistence of E/P/T screens. | **143** |

B is a purpose-based subset of the 59 no-source placeholders: entity setup, transaction processing, reconciliation/correction, lifecycle, checklist, follow-up or preference maintenance. Other no-source placeholders are D. Thus **33 generic D + 26 B = 59 generic fallbacks**, plus **7 settings + 5 diagnostics + 1 source-link-only page = 13 other D**, yielding **46 D** overall. This reconciles the classification with the delivery report's renderer counts. [CONTENT, REG]

**Renderer/source column:** `link:x` identifies `ExistingView` → existing board `x` (or dashboard link); `data:x` identifies `getErpDataset(x)` → `ErpRegister`; `permissions`, `import`, `export`, `settings`, `diagnostics` are exact source-dispatch values; `generic` is the final fallback with an unavailable state and proposed field headings. No B row has an enabled business-operation handler. [CONTENT, DATA, TOOLS]

### 1.1. System & permissions — 6 leaves

**Hub:** `/[locale]/dashboard/erp/permissions`. Evidence: `src/config/erp.ts:35`, `erpModules` entry `permissions`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/permissions/overview` | Permissions overview | T | `permissions` |
| `/[locale]/dashboard/erp/permissions/roles` | Roles and permission sets | T | `permissions` |
| `/[locale]/dashboard/erp/permissions/matrix` | Module and page access matrix | T | `permissions` |
| `/[locale]/dashboard/erp/permissions/assignments` | User access assignments | T | `permissions` |
| `/[locale]/dashboard/erp/permissions/denied` | Access and authorization diagnostics | T | `permissions` |
| `/[locale]/dashboard/erp/permissions/history` | Permission audit and history | D | `generic` |

### 1.2. General accounting — 13 leaves

**Hub:** `/[locale]/dashboard/erp/accounting`. Evidence: `src/config/erp.ts:126`, `erpModules` entry `accounting`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/accounting/overview` | Accounting overview | D | `generic` |
| `/[locale]/dashboard/erp/accounting/transactions` | Financial transaction overview | B | `generic` |
| `/[locale]/dashboard/erp/accounting/accounts` | Accounts and classifications | B | `generic` |
| `/[locale]/dashboard/erp/accounting/customer-balances` | Customer balances | E | `link:finance` |
| `/[locale]/dashboard/erp/accounting/supplier-balances` | Supplier payables | E | `link:purchases` |
| `/[locale]/dashboard/erp/accounting/project-summaries` | Project and phase summaries | E | `link:finance` |
| `/[locale]/dashboard/erp/accounting/invoices` | Customer invoices | P | `data:invoices` |
| `/[locale]/dashboard/erp/accounting/certificates` | Payment certificates | P | `data:certificates` |
| `/[locale]/dashboard/erp/accounting/payments` | Actual payment records | P | `data:payments` |
| `/[locale]/dashboard/erp/accounting/receipts` | Payment receipts | P | `data:receipts` |
| `/[locale]/dashboard/erp/accounting/expenses` | Expenses | P | `data:expenses` |
| `/[locale]/dashboard/erp/accounting/reports` | Financial reports and exports | D | `generic` |
| `/[locale]/dashboard/erp/accounting/corrections` | Corrections and transaction history | B | `generic` |

### 1.3. Treasury & banks — 8 leaves

**Hub:** `/[locale]/dashboard/erp/treasury`. Evidence: `src/config/erp.ts:304`, `erpModules` entry `treasury`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/treasury/overview` | Treasury overview | D | `generic` |
| `/[locale]/dashboard/erp/treasury/cash-register` | Cash movement register | P | `data:cash` |
| `/[locale]/dashboard/erp/treasury/bank-accounts` | Bank accounts and summaries | B | `generic` |
| `/[locale]/dashboard/erp/treasury/receipts` | Receipts | P | `data:receipts` |
| `/[locale]/dashboard/erp/treasury/disbursements` | Disbursements | P | `data:expenses` |
| `/[locale]/dashboard/erp/treasury/history` | Cash and bank transaction history | P | `data:payments` |
| `/[locale]/dashboard/erp/treasury/reconciliation` | Reconciliation workspace | B | `generic` |
| `/[locale]/dashboard/erp/treasury/reports` | Treasury reports | D | `generic` |

### 1.4. Cheque management — 8 leaves

**Hub:** `/[locale]/dashboard/erp/cheques`. Evidence: `src/config/erp.ts:418`, `erpModules` entry `cheques`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/cheques/register` | Cheque register | B | `generic` |
| `/[locale]/dashboard/erp/cheques/incoming` | Incoming cheques | B | `generic` |
| `/[locale]/dashboard/erp/cheques/outgoing` | Outgoing cheques | B | `generic` |
| `/[locale]/dashboard/erp/cheques/details` | Cheque details workspace | B | `generic` |
| `/[locale]/dashboard/erp/cheques/maturity` | Due dates and maturities | D | `generic` |
| `/[locale]/dashboard/erp/cheques/history` | Cheque status and history | D | `generic` |
| `/[locale]/dashboard/erp/cheques/exceptions` | Returned, cancelled and settled | B | `generic` |
| `/[locale]/dashboard/erp/cheques/reports` | Cheque reports | D | `generic` |

### 1.5. Sales & commercial — 11 leaves

**Hub:** `/[locale]/dashboard/erp/sales`. Evidence: `src/config/erp.ts:528`, `erpModules` entry `sales`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/sales/overview` | Sales overview | D | `generic` |
| `/[locale]/dashboard/erp/sales/leads` | Leads and inquiries | E | `link:messages` |
| `/[locale]/dashboard/erp/sales/requests` | Customer requests | E | `link:requests` |
| `/[locale]/dashboard/erp/sales/inspections` | Inspection scheduling and results | E | `link:inspections` |
| `/[locale]/dashboard/erp/sales/quotations` | Quotations | E | `link:quotations` |
| `/[locale]/dashboard/erp/sales/boq` | Bill of quantities | P | `data:boq` |
| `/[locale]/dashboard/erp/sales/revisions` | Quotation revisions and approval | E | `link:quotations` |
| `/[locale]/dashboard/erp/sales/decisions` | Customer acceptance and rejection | E | `link:quotations` |
| `/[locale]/dashboard/erp/sales/contracts` | Contracts | E | `link:contracts` |
| `/[locale]/dashboard/erp/sales/change-orders` | Contract revisions and change orders | P | `data:changes` |
| `/[locale]/dashboard/erp/sales/reports` | Commercial reports | D | `generic` |

### 1.6. Purchasing & suppliers — 11 leaves

**Hub:** `/[locale]/dashboard/erp/purchasing`. Evidence: `src/config/erp.ts:683`, `erpModules` entry `purchasing`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/purchasing/overview` | Purchasing overview | D | `generic` |
| `/[locale]/dashboard/erp/purchasing/suppliers` | Supplier directory | P | `data:suppliers` |
| `/[locale]/dashboard/erp/purchasing/supplier-history` | Supplier details and history | P | `data:suppliers` |
| `/[locale]/dashboard/erp/purchasing/purchases` | Purchase records | E | `link:purchases` |
| `/[locale]/dashboard/erp/purchasing/lines` | Purchase lines | P | `data:purchase-lines` |
| `/[locale]/dashboard/erp/purchasing/invoices` | Supplier invoices and attachments | B | `generic` |
| `/[locale]/dashboard/erp/purchasing/payments` | Supplier payment records | B | `generic` |
| `/[locale]/dashboard/erp/purchasing/payables` | Supplier payable balances | E | `link:purchases` |
| `/[locale]/dashboard/erp/purchasing/returns` | Returns and correction history | B | `generic` |
| `/[locale]/dashboard/erp/purchasing/allocations` | Project and phase allocations | P | `data:purchase-allocations` |
| `/[locale]/dashboard/erp/purchasing/reports` | Purchasing reports | D | `generic` |

### 1.7. Inventory & warehouses — 11 leaves

**Hub:** `/[locale]/dashboard/erp/inventory`. Evidence: `src/config/erp.ts:835`, `erpModules` entry `inventory`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/inventory/overview` | Inventory overview | D | `generic` |
| `/[locale]/dashboard/erp/inventory/items` | Item catalogue | B | `generic` |
| `/[locale]/dashboard/erp/inventory/warehouses` | Warehouse and location directory | B | `generic` |
| `/[locale]/dashboard/erp/inventory/receipts` | Stock receipts | B | `generic` |
| `/[locale]/dashboard/erp/inventory/balances` | Stock balances | D | `generic` |
| `/[locale]/dashboard/erp/inventory/issues` | Issues to projects and phases | B | `generic` |
| `/[locale]/dashboard/erp/inventory/transfers` | Stock transfers | B | `generic` |
| `/[locale]/dashboard/erp/inventory/returns` | Stock returns | B | `generic` |
| `/[locale]/dashboard/erp/inventory/adjustments` | Adjustments and damage | B | `generic` |
| `/[locale]/dashboard/erp/inventory/history` | Movement history | D | `generic` |
| `/[locale]/dashboard/erp/inventory/reports` | Inventory reports | D | `generic` |

### 1.8. Project management — 16 leaves

**Hub:** `/[locale]/dashboard/erp/projects`. Evidence: `src/config/erp.ts:981`, `erpModules` entry `projects`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/projects/portfolio` | Project portfolio | E | `link:projects` |
| `/[locale]/dashboard/erp/projects/workspaces` | Project details and workspaces | P | `data:projects` |
| `/[locale]/dashboard/erp/projects/phases` | Project phases | P | `data:phases` |
| `/[locale]/dashboard/erp/projects/milestones` | Project milestones | E | `link:milestones` |
| `/[locale]/dashboard/erp/projects/schedule` | Schedules and upcoming activities | E | `link:milestones` |
| `/[locale]/dashboard/erp/projects/assignments` | Engineer and staff assignments | E | `link:engineers` |
| `/[locale]/dashboard/erp/projects/diary` | Site diary | E | `link:diary` |
| `/[locale]/dashboard/erp/projects/progress` | Progress records and evidence | E | `link:progress` |
| `/[locale]/dashboard/erp/projects/issues` | Issues and corrective actions | E | `link:issues` |
| `/[locale]/dashboard/erp/projects/quality` | Quality inspections and findings | E | `link:quality` |
| `/[locale]/dashboard/erp/projects/weekly-reports` | Weekly reports and approval | E | `link:reports` |
| `/[locale]/dashboard/erp/projects/documents` | Project documents | E | `link:documents` |
| `/[locale]/dashboard/erp/projects/handover` | Handover | E | `link:handover` |
| `/[locale]/dashboard/erp/projects/warranty` | Warranty | E | `link:warranty` |
| `/[locale]/dashboard/erp/projects/history` | Project and phase history | P | `data:project-history` |
| `/[locale]/dashboard/erp/projects/reports` | Project operational reports | D | `generic` |

### 1.9. General reports — 12 leaves

**Hub:** `/[locale]/dashboard/erp/reporting`. Evidence: `src/config/erp.ts:1202`, `erpModules` entry `reporting`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/reporting/overview` | Management overview | D | `link:overview — source link only` |
| `/[locale]/dashboard/erp/reporting/projects` | Project reports | E | `link:reports` |
| `/[locale]/dashboard/erp/reporting/commercial` | Commercial reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/purchasing` | Purchasing reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/suppliers` | Supplier reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/inventory` | Inventory reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/treasury` | Treasury reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/financial` | Financial reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/customers` | Customer reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/operations` | Operational performance reports | D | `generic` |
| `/[locale]/dashboard/erp/reporting/audit` | Audit and activity reports | E | `link:audit` |
| `/[locale]/dashboard/erp/reporting/exports` | Report export workspace | T | `export` |

### 1.10. Technical settings — 8 leaves

**Hub:** `/[locale]/dashboard/erp/settings`. Evidence: `src/config/erp.ts:1364`, `erpModules` entry `settings`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/settings/general` | General settings | D | `settings` |
| `/[locale]/dashboard/erp/settings/localization` | Localization and display preferences | D | `settings` |
| `/[locale]/dashboard/erp/settings/modules` | Module configuration | D | `settings` |
| `/[locale]/dashboard/erp/settings/notifications` | Notification configuration | D | `settings` |
| `/[locale]/dashboard/erp/settings/documents` | Document and attachment settings | D | `settings` |
| `/[locale]/dashboard/erp/settings/operations` | Operational configuration | D | `settings` |
| `/[locale]/dashboard/erp/settings/health` | Service health and diagnostics | D | `diagnostics` |
| `/[locale]/dashboard/erp/settings/history` | Configuration history | D | `generic` |

### 1.11. Construction quality — 7 leaves

**Hub:** `/[locale]/dashboard/erp/quality`. Evidence: `src/config/erp.ts:1481`, `erpModules` entry `quality`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/quality/overview` | Quality overview | D | `generic` |
| `/[locale]/dashboard/erp/quality/inspections` | Quality inspection records | E | `link:quality` |
| `/[locale]/dashboard/erp/quality/findings` | Findings and defects | E | `link:issues` |
| `/[locale]/dashboard/erp/quality/corrective-actions` | Corrective actions | E | `link:issues` |
| `/[locale]/dashboard/erp/quality/checklists` | Inspection checklists | B | `generic` |
| `/[locale]/dashboard/erp/quality/materials` | Material and workmanship quality | B | `generic` |
| `/[locale]/dashboard/erp/quality/reports` | Quality reports | D | `generic` |

### 1.12. Customer relations — 11 leaves

**Hub:** `/[locale]/dashboard/erp/crm`. Evidence: `src/config/erp.ts:1582`, `erpModules` entry `crm`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/crm/customers` | Customer directory | E | `link:customers` |
| `/[locale]/dashboard/erp/crm/profiles` | Customer profiles | P | `data:customers` |
| `/[locale]/dashboard/erp/crm/contacts` | Contacts and preferences | B | `generic` |
| `/[locale]/dashboard/erp/crm/requests` | Customer request history | E | `link:requests` |
| `/[locale]/dashboard/erp/crm/inspections` | Inspection history | E | `link:inspections` |
| `/[locale]/dashboard/erp/crm/commercial` | Quotations and contracts | E | `link:quotations` |
| `/[locale]/dashboard/erp/crm/projects` | Related projects and phases | P | `data:projects` |
| `/[locale]/dashboard/erp/crm/communications` | Customer communications history | E | `link:messages` |
| `/[locale]/dashboard/erp/crm/complaints` | Complaints and suggestions | E | `link:complaints` |
| `/[locale]/dashboard/erp/crm/follow-up` | Customer follow-up workspace | B | `generic` |
| `/[locale]/dashboard/erp/crm/reports` | Customer reports | D | `generic` |

### 1.13. Communications & notifications — 7 leaves

**Hub:** `/[locale]/dashboard/erp/communications`. Evidence: `src/config/erp.ts:1736`, `erpModules` entry `communications`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/communications/overview` | Notification overview | E | `link:notifications` |
| `/[locale]/dashboard/erp/communications/history` | Notification history | E | `link:notifications` |
| `/[locale]/dashboard/erp/communications/delivery` | Delivery status workspace | D | `generic` |
| `/[locale]/dashboard/erp/communications/templates` | Templates and event catalogue | B | `generic` |
| `/[locale]/dashboard/erp/communications/preferences` | Communication preferences | B | `generic` |
| `/[locale]/dashboard/erp/communications/pending` | Failed and pending delivery | D | `generic` |
| `/[locale]/dashboard/erp/communications/follow-up` | Customer follow-up history | E | `link:messages` |

### 1.14. System administration — 8 leaves

**Hub:** `/[locale]/dashboard/erp/administration`. Evidence: `src/config/erp.ts:1837`, `erpModules` entry `administration`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/administration/overview` | Administrative overview | D | `diagnostics` |
| `/[locale]/dashboard/erp/administration/session` | Authenticated access information | D | `diagnostics` |
| `/[locale]/dashboard/erp/administration/operations` | Operational diagnostics | D | `diagnostics` |
| `/[locale]/dashboard/erp/administration/security` | Security events | D | `generic` |
| `/[locale]/dashboard/erp/administration/audit` | Audit history | E | `link:audit` |
| `/[locale]/dashboard/erp/administration/health` | Application health | D | `diagnostics` |
| `/[locale]/dashboard/erp/administration/maintenance` | Maintenance and configuration | D | `settings` |
| `/[locale]/dashboard/erp/administration/activity` | Administrative activity reports | E | `link:audit` |

### 1.15. Data import & export — 6 leaves

**Hub:** `/[locale]/dashboard/erp/data`. Evidence: `src/config/erp.ts:1954`, `erpModules` entry `data`; renderer evidence CONTENT/DATA/TOOLS above.

| Full leaf route | Registry label | Class | Actual renderer/source |
|---|---|:---:|---|
| `/[locale]/dashboard/erp/data/import` | Import workspace | T | `import` |
| `/[locale]/dashboard/erp/data/formats` | Import format and instructions | T | `import` |
| `/[locale]/dashboard/erp/data/validation` | Validation preview | T | `import` |
| `/[locale]/dashboard/erp/data/results` | Validation results and errors | T | `import` |
| `/[locale]/dashboard/erp/data/export` | Export workspace | T | `export` |
| `/[locale]/dashboard/erp/data/history` | Export history | D | `generic` |

## 2. Working interactions versus visual-only / notice-only behavior, by module

All 15 hubs have working local text search and a source/no-source filter; links navigate to defined registry destinations. Common shell controls include module collapse, active-route marking, quick search, breadcrumbs and a language-switch URL. These are UI behaviors, not transaction capabilities. A source filter classifies any truthy `page.source` as “Available source”, including policy notes and duplicated tools; it does **not** test backend availability. [NAV, SHELL, CONTENT, COPY]

In the table below, “register controls” means search, applicable status/type filter, reference sort, 10-row pagination and inspect/close dialog; a project/customer detail link exists only if the mapped row supplies `href`. “Record details” on reused boards generally expand/collapse local fixture cards; that is not a server read of a live record. Not every DomainBoard has a search/filter control—documents, notifications and audit do, while many other DomainBoard branches are static fixture-card collections. [DATA, DOMAIN]

| Module | Actual working interactions | Visual / notice-only / absent business behavior | Evidence |
|---|---|---|---|
| System & permissions | Filter the same owner-only page matrix by module; inspect 143 static capability rows. | No roles editor, users directory, user-role assignments, permission grants, authorization simulation or permission-history retrieval. Five route labels point to the same matrix. | TOOLS `ErpAccessMatrix`; REG `permissions`; CONTENT |
| General accounting | Five financial fixture registers; embedded FinanceBoard tabs/search/due-status filtering/details; PurchasesBoard search/supplier filtering/details; existing customer/project links. FinanceBoard also validates a temporary payment form and can confirm a session-only allocation/receipt. | No chart of accounts, journal/posting, financial transaction ledger, correction/reversal workflow or accounting reports. Create-due, supplier-pay and document-download buttons display unavailable notices. Session payments do not update the static ERP payment/receipt registers and disappear on unmount/reload. | DATA; EXPANSION `FinanceBoard`, `submitRecordForm`, `confirmSessionPayment`, `PurchasesBoard`; CONFIG |
| Treasury & banks | Read/search/sort/inspect payment, receipt and expense fixtures. | Cash register is cash-method customer payments only; no outgoing cash register or cash position. Expenses are not proof of disbursement. No bank account maintenance, bank feed, treasury posting, reconciliation or treasury reporting. | DATA `getErpDataset` cases `cash`, `payments`, `receipts`, `expenses`; CONTENT |
| Cheques | Hub navigation and related catalogue links only. | All eight leaves are generic unavailable schemas. No cheque entry, item selection, maturity calculation, settlement/return/cancellation, banking confirmation or cheque report. “Details” is not a cheque-ID detail route. | REG `cheques`; CONTENT fallback and `Dependencies` |
| Sales & commercial | MessagesBoard text/channel filtering and record details; RequestsBoard search/status/service filters, detail modal, validated local status/assignee draft and confirmation; BOQ/change-order register controls; inspection/quotation/contract fixture details and linked workspaces. | No persisted lead conversion, scheduling/completion, BOQ editing, quotation sending/internal approval/customer decision or contract signing. Those reused action buttons open explanations; revision/decision leaves are not separate workflows. | REQUESTS; DOMAIN `DomainBoard`; EXPANSION `MessagesBoard`; DATA |
| Purchasing & suppliers | Supplier, line and allocation fixture registers; PurchasesBoard supplier/purchase detail expansion, query/supplier filter and related project links. | No supplier-history view distinct from directory; no supplier invoice/payment entry, supplier ledger, returns/corrections or purchase persistence. “Record a purchase” / “Pay supplier” are notice-only. | DATA; EXPANSION `PurchasesBoard`, `UnavailableButton`; `src/lib/preview-expansion.ts` `getSupplierBalance`, `purchaseTotals` |
| Inventory & warehouses | Hub/catalogue navigation only. | All eleven leaves are generic schemas. No item/location maintenance, stock receipt/issue/transfer/return/adjustment, quantity-on-hand, valuation or movement report. Purchase lines are correctly not reused as stock movements. | REG `inventory`; CONTENT fallback; DATA absence of inventory source |
| Projects | Portfolio/details links; project/phase/history register controls; existing project workspaces; milestone/diary/progress/issues/quality/report/handover/warranty fixture detail expansion; EngineersBoard query/details; document query/category/project filtering, sort, clear and pagination. | No operational scheduling editor, staff assignment write, progress/evidence write, corrective-action closure, report approval/delivery, document upload/download, completed handover or warranty visit closure. Schedule reuses milestones. Engineer→request focus query is ignored by the target. | DOMAIN; EXPANSION `EngineersBoard`; DATA; `src/components/dashboard/ProjectWorkspace.tsx` `ProjectWorkspace`; REQUESTS |
| General reports | Management-overview source link; weekly-report fixture cards; audit search/status filter/date grouping; metadata download. | Eight report categories are generic schemas; no report engine, parameterized output, live aggregations or business export. Management overview is **link-only**. Audit export on the old board is unavailable; “Report export workspace” downloads menu metadata. | CONTENT `ExistingView`; DOMAIN `AuditBoard`; TOOLS `ErpExport`; REG `reporting` |
| Technical settings | Read policy notes and safe role/adapter/domain-readiness information; shared header language navigation. | No page-local settings editor, module enable/disable switch, persisted display preferences, notification/doc policy changes, configuration history or live connectivity probe. | CONTENT `Configuration`, diagnostics branch; COPY `settings`, `health`; CONFIG |
| Construction quality | Existing quality/issues fixture details and project links. | Findings and corrective actions both show the same issues board. No checklist editor, material testing workflow, finding closure, evidence capture or quality-report generation. Not manufacturing execution. | DOMAIN `DomainBoard` quality/issues branches; REG `quality`; CONTENT |
| CRM | Customer fixture directory, thin profile register with existing customer-workspace links, request preview interactions, inspection/quotation cards, all-project register, complaint/message filtering/details and related links. | No contact/preferences management, saved follow-up, complaint reply/assign/resolve or customer-specific live related-record query. CRM “projects” is all projects, not scoped to a selected customer; CRM “commercial” embeds quotations, not a contracts board. | DATA; REQUESTS; DOMAIN; EXPANSION `ComplaintsBoard`, `MessagesBoard`; REG `crm` |
| Communications | NotificationsBoard search/status filter/clear/details and message-channel/search/details through MessagesBoard. | No send/retry/mark-reviewed mutation, provider delivery status, event/template editor, preference persistence, pending delivery queue or actual follow-up history. Notification overview/history are the same board; follow-up is the contact-message inbox. | DOMAIN `NotificationsBoard`; EXPANSION `MessagesBoard`; REG `communications`; CONTENT |
| System administration | Bounded diagnostics display; reused audit search/filter/details; policy note and navigation. | No separate session inspector, live operational health probe, security event retrieval, maintenance execution or new admin reporting. Four administration pages plus settings health reuse one diagnostics body; two administration audit leaves reuse audit. | CONTENT diagnostics / `Configuration`; DOMAIN `AuditBoard`; CONFIG; REG `administration` |
| Data import/export | Read a JSON file/paste text; local validation with bounded row/size/schema checks; safe error list; reset/stale-file cancellation; static menu JSON download. | Four import routes are independent copies of one tool, not a wizard or stored results/history. No CSV mapping, domain-specific import, business-record export, durable jobs/history, transaction or audit write. | TOOLS `ErpImportValidator`, `readFile`, `ErpExport.download`; DATA `validateErpImport`; REG `data` |

**Important state isolation:** `ExistingView` supplies only a board module key, not the leaf ID or a route-specific filter. Reused request/payment state is local to each mounted instance. A successful preview change in `sales/requests` does not become a durable fact in `crm/requests`, and an in-memory payment in `accounting/customer-balances` does not appear in `accounting/payments`. `ErpRegister` always remaps the original fixture arrays. This is a demo-state coherence limitation, not a lost database write. [CONTENT, REQUESTS, EXPANSION, DATA]

## 3. Route, navigation and blank-page verification

### What was independently checked during this review

A temporary **component-level audit harness outside the repository** transpiled the existing TypeScript with ES2022/automatic JSX, read the actual registry, rendered the existing components and collected their hrefs. Navigation pathname was stubbed for component rendering; **no running-app authentication or route guard was bypassed**. This is not an HTTP crawler or browser session.

- **320 render invocations:** 286 localized leaf components + 30 localized hubs + 2 directories + 2 sidebar components. **Zero render exceptions.** [REG, CONTENT, NAV]
- **404 distinct href strings** found across those renders and mapped register detail links; **zero unresolved path/ID targets** against the ERP registry, `dashboardModules`, existing request route and preview project/customer ID sets. Query/fragment intent is separately qualified below. [REG, NAV, DATA; existing `generateStaticParams` functions in `src/app/[locale]/dashboard/projects/[id]/page.tsx` and `src/app/[locale]/dashboard/customers/[id]/page.tsx`]
- The graph contains **all 318 localized ERP destinations**, including every one of the 143 leaves in both languages; **no orphan registered leaf/hub** was found. Sidebar and directory enumerate the registry; related links use registered page IDs. There are no duplicate full ERP leaf URLs. [NAV `ModuleGroup`, `ErpDirectory`; REG `erpHref`, `findErpPage`; `tests/erp-registry.test.ts`]
- The 11-step construction-chain links resolve to registry leaves. This verifies discoverability, **not** completion of those workflows. [NAV `ErpDirectory`; `tests/erp-registry.test.ts` construction workflow test]
- Directory, hub and leaf server functions call `requireReviewAccess`; unknown area/page IDs reach `notFound` only after the page guard; layout and middleware remain protective layers. The explicit `erp` segment coexists with the old dynamic `[module]` segment and appears in the successful Next build route table. [AUTH/ROUTES; `src/app/[locale]/dashboard/[module]/page.tsx` `generateStaticParams`, `dynamicParams`; `tests/erp-routes.test.ts`]
- Registered leaf wrappers always supply a heading, module/section, boundary and catalogue link. Generic leaves supply a proposed-fields table, explicit unavailable state and dependency list. Empty record filters show a no-results state. The `link:overview` route has only a source-link panel instead of the dashboard body. **No literally empty registered leaf was found in component rendering**, but “nonblank” is not “purposefully implemented”. [CONTENT; DATA `ErpRegister`; `tests/erp-render.test.ts`]
- Loading and error boundaries exist at `src/app/[locale]/dashboard/erp/loading.tsx` (`ErpLoading`) and `error.tsx` (`ErpError`, reset button). Error recovery, hydration and native focus behavior were **not** exercised in an authenticated browser. Invalid route 404 presentation also was not browser-accepted. [AUTH/ROUTES, TESTS]

### Navigation/semantic defects and limitations

1. **Ignored contextual focus:** six request IDs produce twelve localized `requests?focus=...` links from `EngineersBoard`. The target `DashboardRequests` accepts only params, and `RequestsBoard` does not read the URL query/searchParams. The path exists, but clicking the engineer's request link does not automatically select the referenced request. This is a broken navigation intent, not a 404. [EXPANSION `EngineersBoard`, line 418; REQUESTS]
2. **Handover fragments do have a target:** observed `#project-handover` links map to `ProjectWorkspace`'s `<WorkspacePanel id="project-handover">` (line 889). Static target existence was verified, not browser scroll/focus. [`src/components/dashboard/ProjectWorkspace.tsx` `ProjectWorkspace`; DOMAIN handover/warranty branches]
3. **Related links are generic:** `ErpPageContent` selects the first six source-bearing siblings, not semantically related entities or record-specific next actions. A related-source panel does not establish a workflow transition or contextual record linkage. [CONTENT `related` at line 144]
4. **Hub counters are global:** `ErpDirectory({moduleId})` restricts cards, but still renders global `erpModules.length`/`erpPageCount` (15/143) and a generic catalogue H2. DashboardShell supplies the module title above it, so it is not blank; nevertheless there are no selected-module counts. [NAV `ErpDirectory`, `DashboardShell`]
5. **Search/active-state limits:** module titles/sections/pages are bilingual in `searchErpPages`, but the old-workspaces fallback searches only the current-locale label plus English key, is initially collapsed, and does not auto-expand for the active old route. Full drawer layout/focus/tab order and language-switch behavior are not certified by link existence. [NAV `ErpNavigation`, `ModuleGroup`; SHELL]

**Conclusion for requirement 4:** registry/link integrity passes at code/component level; “every route works in the real authenticated browser” remains unverified; “no misleading page” fails for the scope/label findings below. These statements must not be conflated.

## 4. Existing BLACK X Admin and Portal preservation

**Preserved structurally and in source, with an untested shared-shell runtime regression surface.** No existing Admin page or Portal route was removed. Tracked diff inspection shows no changes to the original Admin page implementations, Portal pages, PortalShell, `src/config/navigation.ts`, original DomainBoards/ExpansionBoards/RequestsBoard, fixture selectors, `src/auth.ts` or `src/middleware.ts`. The existing dashboard layout and shared shell **were** changed for the ERP UI; the Portal is not wholly unaffected because it still consumes AppShell. [SHELL, AUTH/ROUTES, DOMAIN, EXPANSION, REQUESTS]

### Existing Admin destinations still defined

`/[locale]/dashboard` plus these **22** named destinations from `dashboardModules`:

`notifications`, `customers`, `requests`, `inspections`, `quotations`, `contracts`, `projects`, `milestones`, `diary`, `progress`, `issues`, `quality`, `handover`, `warranty`, `reports`, `documents`, `audit`, `engineers`, `finance`, `purchases`, `complaints`, `messages`.

These remain served by `src/app/[locale]/dashboard/page.tsx`, `[module]/page.tsx` (`DashboardModulePage`), `requests/page.tsx` (`DashboardRequests`) and the unchanged customer/project detail routes. Each original detail route still has `generateStaticParams`, fixture-ID checks and `notFound` behavior. All old module navigation targets remain in the ERP sidebar's existing-review-workspaces group. [NAV, AUTH/ROUTES]

### Portal destinations still defined

`/[locale]/portal`, and `projects`, `milestones`, `reports`, `documents`, `quotations`, `issues`, `handover`, `finance`, `complaints`, `profile`, plus `projects/[id]`. These are unchanged files under `src/app/[locale]/portal/`; `src/components/portal/PortalShell.tsx` passes no `navigationContent`, so AppShell's old navigation branch remains in use. AppShell's shared active matcher changed from raw prefix matching to segment-safe matching; that is a real shared change, not proof of regression-free browser behavior. [SHELL, NAV]

Existing preview isolation helpers remain intact: `src/content/preview-data.ts` — `previewPortalProjects`, `getPreviewPortalProject`; `src/lib/preview-expansion.ts` — `getPortalFinance`, `getPortalComplaints`, `customerVisibleReplies`; `tests/unit.test.ts` retains customer/finance/complaint/internal-note isolation checks. The Portal still uses owner-review authentication and a fixed preview-customer scope; this review does **not** certify a production multi-customer Portal identity system. [`src/app/[locale]/portal/layout.tsx` `PortalLayout`; CONFIG `DOMAIN_STATUS.planned` includes `customer-portal-api`]

**Preservation verdict:** route/source preservation confirmed; existing isolation unit checks passed again; full authenticated regression acceptance of Admin and Portal remains outstanding.

## 5. Duplicates, placeholders and generic fallbacks — exhaustive inventory

### 5.1 Same source / same core body under multiple URLs

The following groups exhaust the registry sources used by more than one leaf. Wrapper heading, boundary and sibling links can differ. A “same source” group is **not** a set of independent specialized screens, and shared `settings` rendering is not necessarily byte-identical because its policy note changes with the page ID. [REG, CONTENT]

| Shared core source | All member leaves (relative to `/[locale]/dashboard/erp/`) | Consequence |
|---|---|---|
| `permissions` | `permissions/overview`, `permissions/roles`, `permissions/matrix`, `permissions/assignments`, `permissions/denied` | Five identical matrix tools, not roles/assignments/denial workflows. |
| `link:finance` | `accounting/customer-balances`, `accounting/project-summaries` | Same full FinanceBoard/default dues tab; no leaf-specific starting context. |
| `link:purchases` | `accounting/supplier-balances`, `purchasing/purchases`, `purchasing/payables` | Same supplier/purchase board. |
| `data:payments` | `accounting/payments`, `treasury/history` | Same incoming payment rows. |
| `data:receipts` | `accounting/receipts`, `treasury/receipts` | Same receipt rows. |
| `data:expenses` | `accounting/expenses`, `treasury/disbursements` | Same expense rows; no verified outgoing-payment ledger. |
| `link:messages` | `sales/leads`, `crm/communications`, `communications/follow-up` | Same contact-message inbox. |
| `link:requests` | `sales/requests`, `crm/requests` | Same local preview board; independent mounted draft state. |
| `link:inspections` | `sales/inspections`, `crm/inspections` | Same inspection fixture board. |
| `link:quotations` | `sales/quotations`, `sales/revisions`, `sales/decisions`, `crm/commercial` | Same quotations board; no separate revisions/decisions/contract composite screen. |
| `data:suppliers` | `purchasing/suppliers`, `purchasing/supplier-history` | Same directory, no additional history data. |
| `data:projects` | `projects/workspaces`, `crm/projects` | Same unfiltered project register. |
| `link:milestones` | `projects/milestones`, `projects/schedule` | Same milestones, no schedule editor. |
| `link:issues` | `projects/issues`, `quality/findings`, `quality/corrective-actions` | Same issues, no independent corrective-action workflow. |
| `link:quality` | `projects/quality`, `quality/inspections` | Same quality fixture board. |
| `link:reports` | `projects/weekly-reports`, `reporting/projects` | Same weekly-report board. |
| `link:audit` | `reporting/audit`, `administration/audit`, `administration/activity` | Same fixture audit chronology. |
| `link:notifications` | `communications/overview`, `communications/history` | Same notification list. |
| `diagnostics` | `settings/health`, `administration/overview`, `administration/session`, `administration/operations`, `administration/health` | Same role/adapter/catalogue display. |
| `settings` | `settings/general`, `settings/localization`, `settings/modules`, `settings/notifications`, `settings/documents`, `settings/operations`, `administration/maintenance` | Shared read-only policy template; no editor. |
| `import` | `data/import`, `data/formats`, `data/validation`, `data/results` | Same independent validator, no multi-step workflow or shared results. |
| `export` | `reporting/exports`, `data/export` | Same navigation-metadata JSON, not distinct report/data exports. |

All **59** leaves marked `generic` in §1 are placeholders/fallback pages; they have no service-specific renderer. B-class placeholders are included, not additional pages. The fallback only varies its registry-driven heading, module boundary, field headers and related sources; every one uses the same unavailable/dependency text. [CONTENT fallback, `Dependencies`; REG]

Within those 59, the following field-schema groups occur more than once; these are all repeated generic field signatures:

| Shared proposed fields | All member leaves |
|---|---|
| `ref,project,date,status` (22) | `accounting/overview`; `treasury/overview`, `treasury/reports`; `cheques/reports`; `sales/overview`, `sales/reports`; `purchasing/overview`, `purchasing/reports`; `inventory/overview`, `inventory/reports`; `projects/reports`; `reporting/commercial`, `reporting/purchasing`, `reporting/suppliers`, `reporting/inventory`, `reporting/treasury`, `reporting/financial`, `reporting/customers`, `reporting/operations`; `quality/overview`, `quality/reports`; `crm/reports` |
| `ref,type,actor,date,status` (4) | `accounting/corrections`, `settings/history`, `administration/security`, `data/history` |
| `ref,party,due,amount,status` (2) | `cheques/incoming`, `cheques/outgoing` |
| `ref,supplier,date,amount,status` (2) | `purchasing/invoices`, `purchasing/payments` |
| `ref,item,location,quantity,date` (2) | `inventory/receipts`, `inventory/transfers` |

These are **generic proposed UI fields**, not approved domain contracts. In particular, an inventory-transfer schema with one `location` column is not a validated source/destination transfer contract. Likewise, a generic report table cannot establish report filters, financial calculations or business completeness. [REG `ErpPage.fields`; CONTENT fallback; COPY `fields`; `src/server/foundation/ports.ts`]

### 5.2 Link-only / thin informational pages

- `reporting/overview`: `ExistingView` recognizes `overview` as a dashboard module but it is absent from `domainKeys`/`expansionKeys` and is not `requests`; the body is just the source note/link, no management dashboard. It is classified D here: navigation to a source is not an embedded functional screen. [CONTENT `ExistingView`]
- All five diagnostics pages: useful safe readiness information but the same static `DOMAIN_STATUS` list plus current role/adapter kind, not security/health monitoring. [CONTENT diagnostics; CONFIG]
- All seven settings pages: policy prose and owner/edit-unavailable information, no configuration form. [CONTENT `Configuration`]
- `crm/profiles`: register of reference/name/city derived from deduplicated requests; actual richer profile requires following the old customer-workspace link. [DATA `getErpDataset('customers')`]

## 6. Dead business actions and overstated labels

### Notice-only actions, not operational handlers

No new ERP component was found with an empty business-success handler that secretly persists data. However, the reused boards contain many enabled-looking buttons whose **only** action is opening an unavailable explanation. These are working feedback controls but operationally dead business actions. They should not be counted as implemented business features. [DOMAIN/EXPANSION `UnavailableButton`, DOMAIN local `unavailableButton`]

Exhaustive action families found in those reused boards:

| Board | Notice-only business action labels/keys | Exact evidence |
|---|---|---|
| Customer/inspection/quotation/contract | `editCustomer`; `scheduleInspection`, `completeInspection`; `editBoq`, `sendQuotation`; `approveChangeOrder`, `manageContract` | `src/components/dashboard/DomainBoards.tsx` `DomainBoard` customers/inspections/quotations/contracts branches; `src/content/app-dictionary.ts` `dashboard.operations.domain.actions` |
| Projects/execution | `editProjectPlan`, `updateMilestone`, `editDiaryEntry`, `updateProgress`, `closeFinding`, `approveReport`, `deliverReport` | Same file, projects/milestones/diary/progress/issues/quality/reports branches |
| Document/oversight | `uploadDocument`, `downloadDocument`, `markNotificationReviewed`, `resendNotification`, `exportAuditLog` | Same file `DocumentsBoard`, `NotificationsBoard`, `AuditBoard` |
| Handover/warranty | `completeHandover`, `scheduleHandover`, `scheduleWarrantyVisit`, `closeWarrantyItem` | Same file handover/warranty branches |
| Finance | Create due/posting; invoice/certificate/receipt download | `src/components/dashboard/ExpansionBoards.tsx` `FinanceBoard`; `dashboard.expansion.finance.createDue`, `.postingUnavailable`, document labels |
| Purchasing | Record a purchase; Pay supplier | Same file `PurchasesBoard`, `UnavailableButton`; `dashboard.expansion.purchases.recordPurchase`, `.paySupplier`, `.postingUnavailable` |
| Complaints | Reply, assign, resolve | Same file `ComplaintsBoard`; `dashboard.expansion.complaints` action labels |
| Messages | Contact customer, convert to request | Same file `MessagesBoard`; `dashboard.expansion.messages.contactAction`, `.convertAction` |

**Not notice-only:** RequestsBoard preview save/confirm and FinanceBoard session payment record/confirm really update local React state. They are nevertheless **not durable authorized transactions**, and their local state is not shared across ERP leaves. The existing finance confirmation uses `planSessionAllocations` and assigns a session receipt ID; this inherited demo behavior must not be mistaken for bank verification or an issued accounting receipt. [REQUESTS; EXPANSION `submitRecordForm`, `confirmSessionPayment`; `src/lib/preview-expansion.ts` `planSessionAllocations`; COPY session-only note]

### Labels whose scope exceeds the actual delivered function

| Leaf/group | What the label suggests | What is actually delivered / why misleading | Evidence |
|---|---|---|---|
| `permissions/roles`, `assignments`, `denied` | Role/assignment/authorization-diagnostics screens | Same owner-only matrix; no editable grants, assigned users or denial event records. Explicit matrix note mitigates, does not supply the feature. | REG; TOOLS `ErpAccessMatrix` |
| `treasury/cash-register` | Cash movements | One cash-method incoming payment fixture; no cash expenses, outgoing cash, opening/closing position or reconciliation. | DATA `cash` aliases `payments` with method filter |
| `treasury/disbursements` | Actual outgoing money | Expense fixtures have date/category/amount, not proof of a separate disbursement/payment transaction. | DATA `expenses`; REG |
| `treasury/history` | Cash and bank history | Same three incoming payment fixtures as accounting/payments; no bank ledger. | DATA `payments`; REG |
| `accounting/supplier-balances`, `purchasing/payables` | Authoritative supplier liabilities | Purchase-summary arithmetic over fixtures (`purchase.paidAmount`), not separate invoice/payment/payables services. | EXPANSION `PurchasesBoard`; `src/lib/preview-expansion.ts` `getSupplierBalance`, `purchaseTotals` |
| `sales/leads` | Sales pipeline | Contact messages, not a lead entity/pipeline. | CONTENT `link:messages`; EXPANSION `MessagesBoard` |
| `sales/revisions`, `sales/decisions` | Revision/approval/customer-decision workflows | Same quotation fixture board; no separate editable workflow. Fixture revision details may be visible, but no persisted transition occurs. | CONTENT `ExistingView`; DOMAIN quotations branch |
| `purchasing/supplier-history` | Chronological supplier history | Identical directory rows/fields as suppliers. | DATA `suppliers` |
| `purchasing/allocations` | Quantity/cost allocations | Purchase-to-project/phase associations only; no allocation amount/quantity ledger or allocation form. | DATA `purchase-allocations` |
| `projects/schedule` | Operational scheduling | Milestone cards; no schedule editing or dependency management. | CONTENT `link:milestones`; DOMAIN milestones branch |
| `projects/assignments` | Staff assignment management | Engineer overview/detail fixtures; no assignment write controls/service. | EXPANSION `EngineersBoard` |
| `projects/history` | Project and phase history | Maps only `previewProjectStatusHistory`; no phase-status history dataset. | DATA `project-history` |
| `crm/projects` | Customer-related projects and phases | Global project rows, no selected-customer scope and no phase rows. | DATA `projects`; CONTENT no customer context |
| `crm/commercial` | Quotations and contracts | Quotations board only; contract may be reached through links, not a combined contracts view. | REG `link:quotations`; CONTENT |
| `communications/follow-up`, `crm/communications` | Follow-up/communications chronology | Contact-message inbox, not outbound/inbound threaded history or follow-up records. | EXPANSION `MessagesBoard` |
| `reporting/exports` | Report export | Static navigation metadata identical to `data/export`, explicitly `businessRecords:false`. | TOOLS `ErpExport.download` |
| `data/formats`, `data/results` | Format catalogue / prior validation results | Same proposed JSON schema and fresh local validator. Results are not transferred between routes or stored. | TOOLS `ErpImportValidator`; CONTENT import key |
| All generic leaves | “UI ready — service integration required” | Many are only headings/columns/unavailable text; bespoke forms, field rules, filters/detail states and final contracts are not ready. No-source pages need design/business rules, not just plugging in a backend. | COPY `pending`; CONTENT fallback; REG fields |

The global fixture banner, module boundaries and explicit tool disclaimers are valuable and reduce deception. They **do not** make unrelated/missing data semantically equivalent to the feature title. [COPY, NAV `DashboardShell`]
## 7. Legacy-reference comparison (no invented inventory)

Available project evidence consists of the user-supplied **21 modules / 337 pages** metadata, the fifteen named reference categories recorded in the requirements inventory, and an account that the public legacy URL exposed only an ESTC login. No protected legacy page inventory/video-derived complete list is present in the inspected project evidence. Thus neither registry names nor BLACK X pages establish a one-to-one reproduction of unseen legacy screens. [REG `legacyReference`; DELIVERY inventory Scope and evidence / reference-category mapping]

| Named reference category | BLACK X hub | Actual leaves | Verified comparison |
|---|---|---:|---|
| System & Permissions | `permissions` | 6 | Category represented; owner matrix, not legacy RBAC reproduction. |
| General Accounting | `accounting` | 13 | Category represented; fixtures/deferred schemas, no accounting engine. |
| Treasury & Banks | `treasury` | 8 | Category represented; payment/receipt/expense views, not a bank subsystem. |
| Cheques | `cheques` | 8 | Category represented as schemas only. |
| Sales & Commercial | `sales` | 11 | Existing commercial review screens reused; not verified legacy names/workflows. |
| Purchasing & Suppliers | `purchasing` | 11 | Existing supplier/purchase previews; missing separate payable lifecycle. |
| Inventory & Warehouses | `inventory` | 11 | Category represented as schemas only. |
| Projects | `projects` | 16 | Existing construction workspaces reused. |
| General Reports | `reporting` | 12 | Report/source catalogue, largely placeholders; not 12 working report products. |
| Technical Settings | `settings` | 8 | Policy/readiness notes; no settings administration. |
| Manufacturing & Quality | `quality` | 7 | **Explicit construction-quality adaptation**; no manufacturing claims. |
| CRM | `crm` | 11 | Existing customer/request/message views; not a new live CRM. |
| Communications | `communications` | 7 | Notification/message previews; delivery operations absent. |
| System Administration | `administration` | 8 | Safe diagnostics/audit previews, not platform administration. |
| Data Import/Export | `data` | 6 | Local validator and menu exporter, not business-data integration. |
| Six unspecified reference categories | **None invented** | — | Names and internal pages remain unknown. |

Evidence for every mapping: `docs/ERP_IMPLEMENTATION_INVENTORY.md` reference-category table and `src/config/erp.ts` `erpModules`/`provenance`. **143 is a count of current leaf definitions, not verified parity with 337 legacy pages, not 143 complete operations, and not a demonstrated percentage of legacy functionality.** Zero independently verified legacy internal pages remains the accurate evidence claim in the registry.

## 8. Verification results and review of delivery-report claims

### Re-run in this review

| Verification layer | Actual result | What it does / does not prove |
|---|---|---|
| Full unit/component/DOM/contract suite: `npm test` | **422 passed, 19 files** | Existing suite passes; not a browser login or live backend acceptance. |
| ERP tests within full suite | **47 tests, 4 files** | Registry, mocked server-route composition, static rendering and jsdom UI controls. Not 47 authenticated end-to-end scenarios. |
| `npm run test:contract` | **38 passed, 3 files** | Subset of the full suite, not 38 additional independent production checks. |
| `npm run typecheck` | Passed | Type consistency, not correctness of business labels/data scope. |
| `npm run lint` | Passed, max warnings 0 | Lint rules, not functional completeness. |
| `npm run format:check` | Passed | Formatting only. |
| `npm run build` | Passed; 131 static-page generation entries plus dynamic templates | Production compilation/type/lint/build routing succeeds; no live-user workflow proof. |
| `git diff --check` | Passed | Whitespace check only. |
| Additional render/link graph | 320 renders; 404 unique hrefs; 318 localized ERP targets covered; zero render exceptions/unresolved path targets | Static/component evidence with fixture-ID resolution, not authenticated HTTP or browser navigation. |
| Authenticated browser session | **Not tested** | No acceptance claim. |
| Live backend operations / durable persistence | **Not tested / unavailable in new ERP UI** | Fake adapters and fixtures are not an operational integration. |

Commands were run against the reviewed working tree without changing auth/env/database/deployment configuration. No browser executable, authenticated owner session or real provider connection was used. [TESTS, CONFIG]

### Test strengths and blind spots

- `tests/erp-registry.test.ts` checks uniqueness, names, source/field mappings and protected-path shape; that is not a request through Next middleware or a live data authorization test.
- `tests/erp-routes.test.ts` **mocks `requireReviewAccess` and the page-content/directory components**. The all-module/leaf loop invokes the guard **316 times**, representing 30 hubs + 286 leaves. The separate first test covers the English directory. The delivery wording “all 318 localized destinations compose” is broader than that single loop; this review's additional render/link graph supplies structural coverage for both directories, but still not authenticated HTTP coverage.
- `tests/erp-render.test.ts` renders all leaf/hub content and checks headings, wrappers and no `#`/`javascript:` hrefs. It does not validate every destination, specialized functionality, real records or semantic adequacy. The extra link graph in §3 addresses destination existence, not business semantics.
- `tests/erp-ui.test.ts` uses **jsdom**, stubs `next/navigation`, polyfills `HTMLDialogElement.showModal/close`, and prevents navigation when clicking command results. It verifies dialog state/portal placement, not native focus trapping, mobile inert behavior, visual clipping or actual Next navigation. Its fixture “sorts” test does not assert descending order; `.erp-filterbar select:last-child` can match the first status-filter select because both selects are last children of their labels. Paging beyond ten records is not exercised in this file. BOQ (19 rows) and phases (11 rows) do have enough fixtures for paging, but that behavior lacks a targeted UI assertion.
- Error/reset, loading, mobile drawer focus/keyboard behavior, real language-switch navigation, signed-in sign-out, browser back/forward state, and every reused notice-only action are not covered by authenticated browser acceptance. [TESTS, NAV, SHELL]

### Delivery-report assessment

| Delivery claim | Review assessment |
|---|---|
| 15 hubs / 143 leaves / 159 per locale | **Confirmed as registry/route inventory**, not distinct business screens. |
| 41 existing source/view, 20 fixture registers, 5 matrix, 5 diagnostics, 7 settings, 4 validator, 2 exporter, 59 generic | **Counts confirmed.** “Source/tool-backed” includes substantial duplication and informational notes. |
| No blank routes | **Qualified:** all registered components render a nonempty wrapper, but reporting overview is source-link-only and 59 are generic placeholders. No authenticated render acceptance. |
| Purposeful full-page structures / UI ready | **Overstated for generic leaves:** table headers and dependencies are not completed forms, scoped datasets, final contracts or report layouts. |
| Existing routes preserved | **Confirmed structurally/source-wise;** shared-shell browser regressions remain untested. |
| Import/export | **Narrow functions confirmed:** proposed JSON validation and static menu JSON. Not business import/export. |
| Authenticated visual testing unverified | **Correct and still true.** |
| Production-mode local HTTP smoke | Prior report says it observed localized unauthenticated 307s and public/login 200s, with local Auth.js MissingSecret. **Not re-run as authenticated HTTP in this review and not successful-login evidence.** |
| Completed UI foundation, not operational ERP | **Directionally accurate, with the semantic/placeholder/duplication qualifications in this report.** |

The latest review build emitted no warning text in its captured output. That does not invalidate the delivery report's historical cold-build jose/Edge warning or prove every Edge dependency path is compatible. Build generation's 131 entries are whole-application static-generation statistics, not 131 or 143 authenticated ERP pages exercised with a user. [DELIVERY, build output; AUTH/ROUTES]

## 9. Highest-impact gaps, ranked by module and business impact

### Cross-cutting gate before any operational pilot — critical

The new ERP screens read fixtures or render readiness information; none is a durable new business-write integration. Only `fake` is registered, and it is refused in production. Existing foundation contracts, pure workflow transitions and limited customer/intake services do not automatically wire the new UI. **Persisted identity/scoped data, server authorization, validation, audit, concurrency/idempotency and truthful failure handling must precede using any of these pages as a system of record.** This is a gap finding, **not permission to change auth/configuration or start database work in this review**. [CONFIG; CONTENT; DATA; `docs/api-contract-v1.md`; `tests/workflow/transitions.test.ts`]

### Module-specific priority ranking

Ranks reflect impact on a construction/finishing company's ability to operate safely, not how many leaf URLs exist. Related modules share dependencies.

| Rank | Module | Highest-impact missing capability | Business impact / priority rationale | Evidence |
|---:|---|---|---|---|
| 1 | Sales & commercial | Durable request→inspection→versioned BOQ/quotation→authorized decision→issued/signed contract flow, with audit and immutable revisions. | Without an agreed commercial baseline, staff cannot reliably commit scope, price or contract obligations. Current approvals/sends are unavailable notices/local preview. | REQUESTS; DOMAIN quotation/contract/inspection branches; CONFIG `DOMAIN_STATUS.planned`; `tests/workflow/transitions.test.ts` |
| 2 | Projects | Persisted project/phases/milestones/assignments, evidence-backed progress, issues, reports, handover and warranty transitions. | Core execution cannot be updated or trusted; work/completion/acceptance cannot be reconciled between roles. | DOMAIN; EXPANSION `EngineersBoard`; DATA; CONFIG |
| 3 | General accounting | Separate durable invoice/certificate/payment/receipt/expense records, reconciliation and approved correction/posting rules; only then any ledger/statutory scope. | Customer collections, revenue obligations and costs cannot be controlled using isolated session state or fixture totals. No general ledger exists. | DATA; EXPANSION `FinanceBoard`; CONFIG; REG `accounting` |
| 4 | System & permissions | Approved staff identity/capability policy and server-enforced create/edit/approve/export boundaries with reviewable grants and audit. | Single owner-review access cannot support safe multi-person operations or separation of duties. Five matrix aliases do not administer permissions. | TOOLS `ErpAccessMatrix`; REG `canAccessErp`; AUTH/ROUTES; CONFIG |
| 5 | Purchasing & suppliers | Distinct supplier invoice, payment, payable, return/correction and allocation lifecycles. | Prevents unpaid/duplicate liabilities, incorrect supplier settlement and missing project cost attribution. Purchase summaries do not replace an AP ledger. | EXPANSION `PurchasesBoard`; DATA; `src/lib/preview-expansion.ts` `getSupplierBalance`; REG |
| 6 | Treasury & banks | Real cash/bank accounts, actual receipt/disbursement distinction, reconciliation and bank/receipt evidence. | No reliable cash position; expense rows can be mistaken for money paid. | DATA `cash`, `payments`, `expenses`; REG `treasury`; CONTENT |
| 7 | Inventory & warehouses | Approved item/unit/location model and controlled stock receipt→issue/transfer/return/adjustment with auditable balances. | Material availability, wastage, custody and project consumption cannot be managed; all eleven leaves are placeholders. | REG `inventory`; CONTENT fallback; DATA absence of inventory sources |
| 8 | Construction quality | Persisted checklists/findings/corrective action ownership, evidence and acceptance closure linked to progress/handover. | Defects and rework cannot be reliably resolved/accepted; current lists show fixtures, no closure. | DOMAIN issues/quality branches; REG `quality`; CONFIG |
| 9 | CRM | Customer-scoped record joins, maintained contacts/consents, saved follow-ups and complaints/replies with private-note separation. | Missed follow-ups, incorrect context and privacy risk when turning previews into live records. | DATA `customers`, `projects`; EXPANSION `ComplaintsBoard`, `MessagesBoard`; `src/lib/preview-expansion.ts` Portal helpers |
| 10 | General reports | Parameterized reports over authoritative records, clear report semantics, authorized business exports. | Management cannot make decisions from static fixtures or menu exports. Eight report leaves are generic placeholders. | REG `reporting`; DOMAIN `AuditBoard`; TOOLS `ErpExport`; CONTENT |
| 11 | Cheques | Approved cheque lifecycle, due-date/status rules, evidence and cash/party reconciliation. | High financial risk if cheques are used; no workflow exists at all. **Escalate above rank 6 if cheques are material to actual payments.** | REG `cheques`; CONTENT fallback |
| 12 | Communications | Authorized send/retry, durable provider delivery events, template/event rules and consent enforcement. | Follow-up promises/delivery status are not real; no retry/receipt channel integration. | DOMAIN `NotificationsBoard`; EXPANSION `MessagesBoard`; CONFIG `notification-sending` |
| 13 | Data import/export | Domain-specific schemas/mapping, preview/dry run, authorized atomic/idempotent jobs, error/audit history and business exports. | Data onboarding/recovery/report distribution cannot use the current generic validator/menu download. | TOOLS; DATA `validateErpImport`; REG `data`; CONFIG `audit-exports` |
| 14 | System administration | Real scoped security/audit event sources, operational observability and approved maintenance/runbook controls. | Problems/security events cannot be investigated through the duplicated readiness catalogue. | CONTENT diagnostics; DOMAIN `AuditBoard`; CONFIG |
| 15 | Technical settings | Validated, versioned, permissioned and audited operational configuration with effective rules. | Settings labels cannot change operation; configuration-dependent features remain nonfunctional. No approval exists to make such changes now. | CONTENT `Configuration`; COPY `settings`; REG `settings` |

Authenticated visual acceptance is a **separate release gate** for all modules: owner login, localized routing, layout/RTL, narrow screens, keyboard/focus, command menu, forms, notice-only states, sign-out, and unchanged Portal isolation must be exercised with an approved test session. No secrets should be disclosed or authentication weakened to achieve that. [AUTH/ROUTES, SHELL, TESTS]

## 10. Recommended next phase — recommendation only, not started

**Recommend a truthfulness-and-one-vertical-slice phase, not another expansion of page count.**

1. **UI truthfulness first:** decide which aliases are intentional entry points versus actual separate features; make source scope explicit in titles (incoming cash payments, expense register, supplier directory, metadata export); replace “UI ready” with accurate schema/readiness language where forms/contracts do not exist. Correct the ignored request-focus navigation and distinguish selected-module versus global counts. These are review recommendations; no such changes were made here. [§§3, 5, 6]
2. **Select one bounded operating workflow for implementation:** request/customer→inspection→quotation revision and decision→contract→project. Confirm business rules, actor permissions, transitions, evidence and audit using the existing contract/state-machine work. Define a narrow acceptance matrix before coding; do not infer a general ledger, banking, stock valuation or staff RBAC policy from existing page labels. [CONFIG; `docs/api-contract-v1.md`; `tests/workflow/transitions.test.ts`]
3. **Obtain separate authorization for the required integration scope.** The durable adapter/database and identity gaps cannot be solved merely by connecting these JSX components. Any future persistence, auth, provisioning or environment work must use a separately approved plan and preserve current fail-closed controls. This review does not authorize it.
4. **Implement only the approved slice, with actual loading/error/conflict/authorization states.** Use service-backed reads/writes, not more local simulation; keep illustrative fixtures out of live data paths. Share authoritative state across entry points so duplicate screens cannot disagree. Gate approvals and audit changes server-side. [CONFIG; DATA; CONTENT; AUTH/ROUTES]
5. **Prove the slice in an authenticated test environment:** create/read/update/reload continuity; revision immutability; permitted/denied transitions; correct customer/project scope; audit; no internal-note leakage; error/idempotency/conflict behavior; Arabic/English desktop/mobile and Portal regression. Retain the passing unit/build baseline, but add true browser acceptance rather than treating jsdom as a substitute.
6. **Only then expand into collections/AP/treasury and materials**, with explicit financial/stock document distinctions and independently approved rules. Do not prioritize filling the six unknown legacy categories or increasing the 143-page count.

**Review outcome:** registry integrity and current automated checks pass; semantic completeness and authenticated visual acceptance do not. Treat this as an ERP navigation/preview/readiness foundation, not a usable operational ERP release. No implementation phase was started by this review.

## 11. Phase 2 defect resolutions — current implementation

**Status:** Semantic corrections completed on the current feature branch; no persistence workflow started. Final full tests/typecheck/lint/format/build and route/link regressions were rerun successfully after all application edits. Existing 15 hubs / 143 leaf IDs and directory remain unchanged. `tests/fixtures/erp-route-ids.json` freezes all original leaf IDs; no pages were added to raise counts. Arabic/English labels and logical-direction layout remain in place. `src/styles/erp.css` adds workspace-scoped wrapping for long limitation labels and JSON instructions; no public/Portal styling was redesigned.

### 11.1 Actual code change and current semantics

Current authoritative symbols (earlier line numbers are historical):

- **REG2:** `src/config/erp.ts` — `ErpPageKind`, `ErpRouteRef`, `ErpPage.title`, `.subject`, `.summary`, `.kind`, `.sharedWith`, `.related`, `erpModules`. `subject` retains the original requested topic only for requirements context/search; visible `title` states the implemented scope. `legacyReference` still separates 21/337 historical metadata from 15/143 current route definitions.
- **VIEW2:** `src/components/dashboard/ErpPageContent.tsx` — `ErpPageContent`, `ExistingView`, `Configuration`, `Dependencies`. Explicit shared-entry/instructions/deferred branches; source summaries before content; only explicitly curated `related` links, no first-six sibling heuristic. Shared entries link directly to a canonical non-shared resource rather than embedding another copy or redirecting silently.
- **LABEL2:** `src/content/erp-dictionary.ts` — `erpKindLabel`, `erpCopy.pending`; no claim that a deferred note is a completed UI. Kind labels distinguish preview, fixture, shared entry, local tool, deferred, readiness, source-link and instructions.
- **NAV2:** `src/components/dashboard/ErpDirectory.tsx` — `ErpDirectory`, `matches`, `selectedModule`; `src/components/dashboard/ErpNavigation.tsx` — `ErpNavigation`, `oldWorkspaceActive`, `oldExpanded`. Module-scoped title/counts; an “embedded previews & local tools only” filter does not present policy/shared entries as live services; old Admin group expands when active and searches both locales.
- **TOOLS2:** `src/components/dashboard/ErpTools.tsx` — `ErpExport`, `download`, `ErpImportValidator`; `src/components/dashboard/ErpAccessMatrix.tsx` — `ErpAccessMatrix`. Export explicitly names navigation metadata; matrix only marks the canonical metadata-download tool as a direct export surface. No business export endpoint was added.
- **ACTIONS2:** `src/components/dashboard/DomainBoards.tsx` — both `UnavailableButton` and local `unavailableButton`; `src/components/dashboard/ExpansionBoards.tsx` — `UnavailableButton`. Their visible labels now append localized `previewUnavailableTitle` before any click; explanations remain accessible via the dialog/tooltip. `src/content/app-dictionary.ts` — `dashboard.expansion.finance.recordPayment` and `.recordForm` now explicitly label payment entry, submission and confirmation as screen-only simulation and explain loss on leaving/unmount and no sharing with other registers.
- **FOCUS2:** `src/app/[locale]/dashboard/requests/page.tsx` — `DashboardRequests` validates `searchParams.focus` against existing preview IDs **after** `requireReviewAccess`; `src/components/dashboard/RequestsBoard.tsx` — `initialFocusId`, `focusUnavailable`, initial selected/draft state. Valid focus opens only that fixture; unknown/ambiguous focus opens none and displays a localized unavailable explanation. A React key remounts only when target context changes. No data mutation, auth rule or new detail route was introduced.

| Current presentation | Leaf count | Capability boundary |
|---|---:|---|
| Canonical embedded review previews | 22 | Existing fixture boards; temporary request/payment simulations remain local. |
| Canonical fixture registers | 15 | One register per distinct existing dataset mapping, no duplicated operational registers. |
| Explicit shared entry points | 34 | Title/scope/notice + link to canonical resource; no duplicate board/tool body. |
| Deferred requirements notes | 59 | Page-specific missing capability, explicit unavailability, proposed field **list** and dependencies; no faux operational table/actions. |
| Read-only readiness/policy notes | 8 | Seven existing policy explanations and one canonical safe diagnostics display. |
| Canonical local tools | 3 | Owner boundary matrix, local JSON validator, navigation metadata download. |
| Existing-dashboard link only | 1 | Explicit source-link kind; not counted as an embedded screen. |
| JSON format instructions | 1 | Schema/example guidance and validator link, not another import tool instance. |
| **Total retained leaf URLs** | **143** | **No live ERP operations or new backend integration added.** |

The original 26 B-class operational placeholders remain among the 59 deferred notes: their **false readiness/transaction claim** is corrected, not their absent backend operation. Shared routes retain the source ID as provenance metadata, but `ErpPageContent` dispatches `kind === "shared"` before the source renderer; they do not create independent local draft/payment state. Canonical local simulations still are not a system of record.

### 11.2 Defect-by-defect resolution summary

All paths below are under `/[locale]/dashboard/erp/` unless stated otherwise. `[locale]` is `ar` or `en`.

| Route/module or affected family | Original defect | Actual code change | Regression added/run | Remaining limitation |
|---|---|---|---|---|
| `treasury/cash-register` | Cash movement claim covered incoming cash payments only. | REG2 title **Incoming cash-payment fixtures**, summary explicitly excludes outgoing cash, positions and reconciliation; dataset unchanged. | `tests/erp-semantics.test.ts` cash test + bilingual per-route case. | Incoming fixture subset only; no cash ledger. |
| `purchasing/supplier-history` | Supplier-history page repeated directory rows. | Explicit shared entry named **Supplier directory entry — history unavailable**, links to canonical suppliers; no duplicate table. | Same file supplier-history test + route case. | No supplier history was created. |
| `reporting/exports`, `data/export` | Report-export title downloaded menu metadata. | Reporting route is an explicit shared entry **no report export**; one canonical tool **Download navigation metadata only**; button/payload remain metadata-only and owner-gated. | Same file export test; `tests/erp-ui.test.ts` actual Blob payload test; owner-disabled test. | Business/report export unavailable. |
| All 59 no-source leaves, including all original 26 B-class leaves | Generic empty tables and “UI ready” labels implied finished screens awaiting a plug-in. | REG2 gives each its own bilingual missing-capability summary and `Deferred —` title; VIEW2 renders requirements notes/field lists, no operational table/form/button. | Same file parameterized case for **every leaf** in both languages; distinct-59-summary/count tests. | All 59 capabilities remain unimplemented, explicitly so. |
| `reporting/overview` | Link-only body counted as an embedded reused screen. | `kind:source-link`, title **Open management dashboard preview — link only**, scoped explanation and existing dashboard link. | Same file link-only test; current presentation counts. | Still intentionally a link, not another dashboard implementation. |
| All 34 repeated-source entries, including roles/assignments/decisions/quality/schedule/notification/audit aliases | Same board/tool was presented as a distinct screen; local instances could disagree. | REG2 `sharedWith` and truthful entry titles; VIEW2 shared branch links to exactly one canonical same-source resource, no second form/table/board. | Every shared route tested bilingual for canonical target, same source, no chains/cycles and no duplicate body; direct source uniqueness test. | Separate operational workflows are not provided; canonical data remains preview/local. |
| `treasury/disbursements`, `treasury/history` | Expenses equated with disbursements; incoming payments called cash/bank history. | Expense-not-disbursement entry and incoming-payment/no-bank-history entry; canonical fixture links and explicit scope. | Same file treasury semantic test + route cases. | No bank feed or outgoing payment proof. |
| `accounting/supplier-balances`, `purchasing/payables`, `accounting/project-summaries` | Purchase/finance summaries appeared as independent authoritative ledgers/reports. | Shared-entry titles and scope explain purchase-summary arithmetic / screen-only finance review, not ledgers. | Same file financial-scope checks, alias cases; original dataset tests retained. | No new accounting/AP or project-report services. |
| `sales/leads`, `crm/communications`, `communications/follow-up` | Contact inbox presented as pipeline or communications/follow-up chronology. | Contact-inbox/no-pipeline/no-history titles, one canonical inbox preview with truthful summary. | Bilingual per-route semantic cases and shared-target validation. | No CRM pipeline or message transport/history. |
| `crm/projects`, `crm/commercial`, `crm/profiles` | Global projects implied selected-customer scope; quotations implied a contracts register; thin references implied full profiles. | Explicit all-project/non-customer-scoped entry; quotation/not-contract entry with curated contracts link; reference-fixture title directs to existing fuller profile preview. | Same file context-scope test + all three route cases + link graph. | No new customer filter, contract composite or live profiles. |
| `projects/history`, `purchasing/allocations` | Project-only history implied phase history; associations implied allocation accounting. | Project-status/no-phase-history title and purchase/project-association/not-allocation-accounting title/summary. | All affected bilingual route cases; context-scope test. | Datasets intentionally unchanged. |
| `sales/revisions`, `sales/decisions`, `projects/schedule`, `projects/assignments`, `quality/corrective-actions` | Review fixtures implied editable revisions, decisions, schedules, assignments or corrective workflow. | Explicit unavailable-operation titles/scopes; duplicated reviews become shared entries; engineer overview remains fixture review only. | Bilingual route/alias tests and context-scope tests. | No write workflow introduced. |
| `data/import`, `formats`, `results`, `validation` | Four independent validators appeared to be an import wizard and saved-result flow. | Single validator at validation; import/results shared entries with no-import/no-saved-results titles; formats is instructions/example/link, not a duplicate form. | Same file instructions/results tests; UI local validation/reset/stale-read tests retained. | JSON reference/name/email validation only; no actual import or results persistence. |
| Settings and administration notes/diagnostics | Policy prose/readiness appeared to administer settings or monitor live events. | Read-only note titles and explicit summaries; duplicate diagnostics link to the one canonical display; security/history remain deferred. | Every route semantic test and canonical-source checks. | No settings changes, monitoring or new security-event retrieval. |
| All leaf `related` panels | First-six siblings could be unrelated or imply a workflow. | VIEW2 uses only explicit REG2 `related` targets; no arbitrary fallback panel. | Every explicit target resolves; full link graph. | Curated review links do not execute transitions. |
| All module hubs | Global 15/143 counters and generic H2 on a selected hub. | NAV2 displays selected-module heading, one module and its actual leaf count; filter now names actual presentation categories. | Module count/title test; directory filter UI tests. | Counts describe retained destinations, not completed features. |
| Existing Admin links in sidebar | Old active group stayed collapsed; search only current locale. | NAV2 old active group expands and searches AR/EN labels. | `tests/erp-ui.test.ts` old active finance group + Arabic query in English shell. | Physical drawer/focus layout not authenticated-browser accepted. |
| `/[locale]/dashboard/requests?focus=…` from engineers | URL target existed but ignored the referenced request. | FOCUS2 validates query, opens exact permitted fixture, localizes invalid focus; preserves guard order. | `tests/erp-request-focus.test.ts` (7 cases, all existing IDs/both locales); UI modal/detail/no-mutation/invalid-target tests. | Preview IDs only; no durable request edits or live authorization integration added. |
| Domain/Expansion notice-only buttons | Action labels looked executable until a failure notice appeared. | ACTIONS2 visible **Not available yet** suffix/tooltip, existing explanatory dialog retained. | `tests/erp-action-labels.test.ts`: 16 DomainBoard + 4 ExpansionBoard variants in both languages. | Actions remain unavailable; no fake success. |
| Finance payment record/confirm actions | Temporary allocations/receipts could imply real staff verification and saved records. | Localized titles/buttons/notes call them **simulation**, clarify no funds verified, no authoritative receipt and no sharing/persistence. | Same file payment-simulation copy checks in AR/EN; original finance math tests retained. | Existing simulation logic is unchanged; it is not a payment operation. |
| Fixture sort/paging tests | Test named sorting without asserting order; paging not exercised. | Corrected last-select targeting; asserted descending reference order; added next/previous BOQ paging assertions. | `tests/erp-ui.test.ts` sorting and paging cases. | jsdom tests, not native-browser visual checks. |

### 11.3 Per-route resolution register — all 143 retained leaves

Each row identifies module/route, the original defect, actual changed visible title and renderer behavior, regression reference and remaining limit. **SEM** means `tests/erp-semantics.test.ts`, parameterized `every retained leaf advertises only its delivered scope` for that exact route in both locales. **GRAPH** is the same file's Arabic/English complete link graph. **ACTION** is `tests/erp-action-labels.test.ts`. These tests assert actual rendered scope/kind, not just presence in configuration. REG2/VIEW2/LABEL2 above give the exact source paths/symbols for the changes.

| Module / retained route | Original defect | Actual code change (REG2 / VIEW2 / LABEL2) | Test added/run | Remaining limitation |
|---|---|---|---|---|
| `permissions` — `/[locale]/dashboard/erp/permissions/overview` | Repeated source presented as Permissions overview | **Owner boundary matrix entry**; explicit shared entry linking to `permissions/matrix`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational permissions overview. |
| `permissions` — `/[locale]/dashboard/erp/permissions/roles` | Repeated source presented as Roles and permission sets | **Owner matrix entry — role editor unavailable**; explicit shared entry linking to `permissions/matrix`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational roles and permission sets. |
| `permissions` — `/[locale]/dashboard/erp/permissions/matrix` | Tool scope/duplication or business-operation ambiguity: Module and page access matrix | **Owner boundary matrix — read only**; one canonical local tool with explicit scope. | SEM; GRAPH | Read-only owner-boundary matrix with a module filter. No role editor, staff grants, assignments or denial-event records. |
| `permissions` — `/[locale]/dashboard/erp/permissions/assignments` | Repeated source presented as User access assignments | **Owner matrix entry — user grants unavailable**; explicit shared entry linking to `permissions/matrix`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational user access assignments. |
| `permissions` — `/[locale]/dashboard/erp/permissions/denied` | Repeated source presented as Access and authorization diagnostics | **Owner matrix entry — denial diagnostics unavailable**; explicit shared entry linking to `permissions/matrix`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational access and authorization diagnostics. |
| `permissions` — `/[locale]/dashboard/erp/permissions/history` | Generic unavailable register / false UI-readiness claim for Permission audit and history | **Deferred — Permission audit and history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Permission-change auditing and authorized history retrieval are not implemented. |
| `accounting` — `/[locale]/dashboard/erp/accounting/overview` | Generic unavailable register / false UI-readiness claim for Accounting overview | **Deferred — Accounting overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No accounting overview based on authoritative balances exists. |
| `accounting` — `/[locale]/dashboard/erp/accounting/transactions` | Generic unavailable register / false UI-readiness claim for Financial transaction overview | **Deferred — Financial transaction overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No unified transaction ledger or posting service exists. |
| `accounting` — `/[locale]/dashboard/erp/accounting/accounts` | Generic unavailable register / false UI-readiness claim for Accounts and classifications | **Deferred — Accounts and classifications**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Chart-of-accounts setup and classification rules are not approved or editable. |
| `accounting` — `/[locale]/dashboard/erp/accounting/customer-balances` | Unqualified business-screen/action wording: Customer balances | **Finance review preview — session simulation only**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Existing finance preview with tabs and temporary session-payment simulation. No durable posting, accounting ledger or shared payment state. |
| `accounting` — `/[locale]/dashboard/erp/accounting/supplier-balances` | Repeated source presented as Supplier payables | **Purchase-summary preview entry — no supplier ledger**; explicit shared entry linking to `purchasing/purchases`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational supplier payables. |
| `accounting` — `/[locale]/dashboard/erp/accounting/project-summaries` | Repeated source presented as Project and phase summaries | **Finance preview entry — not a separate project report**; explicit shared entry linking to `accounting/customer-balances`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational project and phase summaries. |
| `accounting` — `/[locale]/dashboard/erp/accounting/invoices` | Register title did not fully identify fixture/source scope: Customer invoices | **Customer invoices — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative customer invoices; no issuing, posting or download. |
| `accounting` — `/[locale]/dashboard/erp/accounting/certificates` | Register title did not fully identify fixture/source scope: Payment certificates | **Payment certificates — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative payment certificates, separate from invoices and receipts; no certification or approval. |
| `accounting` — `/[locale]/dashboard/erp/accounting/payments` | Register title did not fully identify fixture/source scope: Actual payment records | **Actual payment records — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Incoming customer-payment fixtures only; not a cash/bank ledger or bank verification. |
| `accounting` — `/[locale]/dashboard/erp/accounting/receipts` | Register title did not fully identify fixture/source scope: Payment receipts | **Payment receipts — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative receipt references linked to sample payments; no actual receipt issuance. |
| `accounting` — `/[locale]/dashboard/erp/accounting/expenses` | Register title did not fully identify fixture/source scope: Expenses | **Expenses — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Expense fixtures only. An expense is not evidence of an actual outgoing payment. |
| `accounting` — `/[locale]/dashboard/erp/accounting/reports` | Generic unavailable register / false UI-readiness claim for Financial reports and exports | **Deferred — Financial reports and exports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Financial report calculations, parameters and business exports are unavailable. |
| `accounting` — `/[locale]/dashboard/erp/accounting/corrections` | Generic unavailable register / false UI-readiness claim for Corrections and transaction history | **Deferred — Corrections and transaction history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Corrections require reversal policy, authorization and immutable transaction history. |
| `treasury` — `/[locale]/dashboard/erp/treasury/overview` | Generic unavailable register / false UI-readiness claim for Treasury overview | **Deferred — Treasury overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No authoritative cash position or bank balance source is connected. |
| `treasury` — `/[locale]/dashboard/erp/treasury/cash-register` | Register title did not fully identify fixture/source scope: Cash movement register | **Incoming cash-payment fixtures**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Cash-method incoming customer payments only. Outgoing cash, opening/closing balances and reconciliation are not provided. |
| `treasury` — `/[locale]/dashboard/erp/treasury/bank-accounts` | Generic unavailable register / false UI-readiness claim for Bank accounts and summaries | **Deferred — Bank accounts and summaries**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Bank account maintenance, account balances and bank feeds are unavailable. |
| `treasury` — `/[locale]/dashboard/erp/treasury/receipts` | Repeated source presented as Receipts | **Shared review entry — Receipts**; explicit shared entry linking to `accounting/receipts`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational receipts. |
| `treasury` — `/[locale]/dashboard/erp/treasury/disbursements` | Repeated source presented as Disbursements | **Expense fixtures — not disbursements**; explicit shared entry linking to `accounting/expenses`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational disbursements. |
| `treasury` — `/[locale]/dashboard/erp/treasury/history` | Repeated source presented as Cash and bank transaction history | **Incoming-payment preview entry — no bank history**; explicit shared entry linking to `accounting/payments`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational cash and bank transaction history. |
| `treasury` — `/[locale]/dashboard/erp/treasury/reconciliation` | Generic unavailable register / false UI-readiness claim for Reconciliation workspace | **Deferred — Reconciliation workspace**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No statement matching, reconciliation evidence or approval workflow exists. |
| `treasury` — `/[locale]/dashboard/erp/treasury/reports` | Generic unavailable register / false UI-readiness claim for Treasury reports | **Deferred — Treasury reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Treasury reports require actual receipt/disbursement and account ledgers. |
| `cheques` — `/[locale]/dashboard/erp/cheques/register` | Generic unavailable register / false UI-readiness claim for Cheque register | **Deferred — Cheque register**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Cheque entry and a durable cheque register do not exist. |
| `cheques` — `/[locale]/dashboard/erp/cheques/incoming` | Generic unavailable register / false UI-readiness claim for Incoming cheques | **Deferred — Incoming cheques**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No incoming-cheque records or collection/clearance operation exists. |
| `cheques` — `/[locale]/dashboard/erp/cheques/outgoing` | Generic unavailable register / false UI-readiness claim for Outgoing cheques | **Deferred — Outgoing cheques**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No outgoing-cheque issue or beneficiary settlement operation exists. |
| `cheques` — `/[locale]/dashboard/erp/cheques/details` | Generic unavailable register / false UI-readiness claim for Cheque details workspace | **Deferred — Cheque details workspace**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No cheque ID is selected and no cheque-detail source exists. |
| `cheques` — `/[locale]/dashboard/erp/cheques/maturity` | Generic unavailable register / false UI-readiness claim for Due dates and maturities | **Deferred — Due dates and maturities**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No cheque due-date dataset, maturity calculation or alerts exist. |
| `cheques` — `/[locale]/dashboard/erp/cheques/history` | Generic unavailable register / false UI-readiness claim for Cheque status and history | **Deferred — Cheque status and history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Cheque lifecycle events and audited status transitions are unavailable. |
| `cheques` — `/[locale]/dashboard/erp/cheques/exceptions` | Generic unavailable register / false UI-readiness claim for Returned, cancelled and settled | **Deferred — Returned, cancelled and settled**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Return, cancellation and settlement require approved cheque rules and evidence. |
| `cheques` — `/[locale]/dashboard/erp/cheques/reports` | Generic unavailable register / false UI-readiness claim for Cheque reports | **Deferred — Cheque reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No cheque report or bank-confirmed totals can be generated. |
| `sales` — `/[locale]/dashboard/erp/sales/overview` | Generic unavailable register / false UI-readiness claim for Sales overview | **Deferred — Sales overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No live sales funnel, committed revenue or sales overview is connected. |
| `sales` — `/[locale]/dashboard/erp/sales/leads` | Unqualified business-screen/action wording: Leads and inquiries | **Contact inbox preview — not a lead pipeline**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Contact-message inbox fixtures only; no sales pipeline, outbound conversation history, contact action or lead conversion. |
| `sales` — `/[locale]/dashboard/erp/sales/requests` | Unqualified business-screen/action wording: Customer requests | **Customer requests — review preview**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Existing request preview; status/assignee edits affect this mounted view only and disappear when it closes or reloads. |
| `sales` — `/[locale]/dashboard/erp/sales/inspections` | Unqualified business-screen/action wording: Inspection scheduling and results | **Inspection record fixtures — scheduling unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Inspection record fixtures only; scheduling and completion actions explain unavailability, not save changes. |
| `sales` — `/[locale]/dashboard/erp/sales/quotations` | Unqualified business-screen/action wording: Quotations | **Quotation review fixtures — no editing, sending or decisions**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Quotation review fixtures and related links only; editing BOQ, sending, approval and customer decisions are unavailable. |
| `sales` — `/[locale]/dashboard/erp/sales/boq` | Register title did not fully identify fixture/source scope: Bill of quantities | **Bill of quantities — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Read-only quotation BOQ line fixtures; no pricing editor or approved commercial quantities. |
| `sales` — `/[locale]/dashboard/erp/sales/revisions` | Repeated source presented as Quotation revisions and approval | **Quotation preview entry — revision editing unavailable**; explicit shared entry linking to `sales/quotations`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational quotation revisions and approval. |
| `sales` — `/[locale]/dashboard/erp/sales/decisions` | Repeated source presented as Customer acceptance and rejection | **Quotation preview entry — decisions unavailable**; explicit shared entry linking to `sales/quotations`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational customer acceptance and rejection. |
| `sales` — `/[locale]/dashboard/erp/sales/contracts` | Unqualified business-screen/action wording: Contracts | **Contract record fixtures — signing unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Contract review fixtures only; contract issuance/signature and change-order approval are unavailable. |
| `sales` — `/[locale]/dashboard/erp/sales/change-orders` | Register title did not fully identify fixture/source scope: Contract revisions and change orders | **Contract change-record fixtures — no revision editor**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative contract change records; no change-order approval or contract revision write. |
| `sales` — `/[locale]/dashboard/erp/sales/reports` | Generic unavailable register / false UI-readiness claim for Commercial reports | **Deferred — Commercial reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No commercial report calculations or authorized business exports are implemented. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/overview` | Generic unavailable register / false UI-readiness claim for Purchasing overview | **Deferred — Purchasing overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No authoritative purchasing overview is connected. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/suppliers` | Register title did not fully identify fixture/source scope: Supplier directory | **Supplier directory — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Supplier contact/category fixtures only; no chronological supplier history or payable ledger. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/supplier-history` | Repeated source presented as Supplier details and history | **Supplier directory entry — history unavailable**; explicit shared entry linking to `purchasing/suppliers`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational supplier details and history. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/purchases` | Unqualified business-screen/action wording: Purchase records | **Purchase-summary fixtures — recording and settlement unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Existing supplier/purchase preview. Payables are illustrative arithmetic over purchase summaries, not a supplier invoice/payment ledger. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/lines` | Register title did not fully identify fixture/source scope: Purchase lines | **Purchase lines — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative purchase lines, quantities and unit prices; not stock movements. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/invoices` | Generic unavailable register / false UI-readiness claim for Supplier invoices and attachments | **Deferred — Supplier invoices and attachments**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Separate supplier invoice entry, attachment storage and approval are unavailable. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/payments` | Generic unavailable register / false UI-readiness claim for Supplier payment records | **Deferred — Supplier payment records**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No supplier-payment ledger, settlement or payment verification service exists. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/payables` | Repeated source presented as Supplier payable balances | **Purchase-summary preview entry — no payable ledger**; explicit shared entry linking to `purchasing/purchases`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational supplier payable balances. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/returns` | Generic unavailable register / false UI-readiness claim for Returns and correction history | **Deferred — Returns and correction history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Purchase returns/corrections require distinct records and approved rules. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/allocations` | Register title did not fully identify fixture/source scope: Project and phase allocations | **Purchase/project association fixtures — not allocation accounting**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Purchase-to-project/phase associations only; no quantity/cost allocation ledger or allocation editor. |
| `purchasing` — `/[locale]/dashboard/erp/purchasing/reports` | Generic unavailable register / false UI-readiness claim for Purchasing reports | **Deferred — Purchasing reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Purchasing reports need authorized invoice/payment/return datasets. |
| `inventory` — `/[locale]/dashboard/erp/inventory/overview` | Generic unavailable register / false UI-readiness claim for Inventory overview | **Deferred — Inventory overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No stock ledger or authoritative inventory position exists. |
| `inventory` — `/[locale]/dashboard/erp/inventory/items` | Generic unavailable register / false UI-readiness claim for Item catalogue | **Deferred — Item catalogue**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Item codes, units and catalogue maintenance are not implemented. |
| `inventory` — `/[locale]/dashboard/erp/inventory/warehouses` | Generic unavailable register / false UI-readiness claim for Warehouse and location directory | **Deferred — Warehouse and location directory**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Warehouse/location records and custody permissions are unavailable. |
| `inventory` — `/[locale]/dashboard/erp/inventory/receipts` | Generic unavailable register / false UI-readiness claim for Stock receipts | **Deferred — Stock receipts**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Stock-receipt recording and quantity evidence are unavailable. Purchases are not stock receipts. |
| `inventory` — `/[locale]/dashboard/erp/inventory/balances` | Generic unavailable register / false UI-readiness claim for Stock balances | **Deferred — Stock balances**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No quantity-on-hand or valuation engine exists; no zero balances are implied. |
| `inventory` — `/[locale]/dashboard/erp/inventory/issues` | Generic unavailable register / false UI-readiness claim for Issues to projects and phases | **Deferred — Issues to projects and phases**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Issues require a stock source, project/phase destination and authorized movement rules. |
| `inventory` — `/[locale]/dashboard/erp/inventory/transfers` | Generic unavailable register / false UI-readiness claim for Stock transfers | **Deferred — Stock transfers**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Transfers require separate source/destination locations and auditable movement records. |
| `inventory` — `/[locale]/dashboard/erp/inventory/returns` | Generic unavailable register / false UI-readiness claim for Stock returns | **Deferred — Stock returns**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No stock-return entry or reconciliation with original issues is implemented. |
| `inventory` — `/[locale]/dashboard/erp/inventory/adjustments` | Generic unavailable register / false UI-readiness claim for Adjustments and damage | **Deferred — Adjustments and damage**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Adjustments/damage require approved reasons, quantity evidence and approval. |
| `inventory` — `/[locale]/dashboard/erp/inventory/history` | Generic unavailable register / false UI-readiness claim for Movement history | **Deferred — Movement history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No durable stock movement chronology exists. |
| `inventory` — `/[locale]/dashboard/erp/inventory/reports` | Generic unavailable register / false UI-readiness claim for Inventory reports | **Deferred — Inventory reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Inventory reports need verified movement/balance datasets; none are connected. |
| `projects` — `/[locale]/dashboard/erp/projects/portfolio` | Unqualified business-screen/action wording: Project portfolio | **Project portfolio — review preview**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Existing project portfolio fixtures and workspace links; project plan edits are unavailable. |
| `projects` — `/[locale]/dashboard/erp/projects/workspaces` | Register title did not fully identify fixture/source scope: Project details and workspaces | **Project directory fixtures — open existing workspaces**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | All illustrative projects in this preview, not scoped to a selected customer. Open an existing workspace for context. |
| `projects` — `/[locale]/dashboard/erp/projects/phases` | Register title did not fully identify fixture/source scope: Project phases | **Project phases — fixture preview**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Illustrative phase rows and project links; no phase edits or schedule execution. |
| `projects` — `/[locale]/dashboard/erp/projects/milestones` | Unqualified business-screen/action wording: Project milestones | **Milestone review fixtures — updates unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Milestone review fixtures, not an editable schedule or dependency-planning tool. |
| `projects` — `/[locale]/dashboard/erp/projects/schedule` | Repeated source presented as Schedules and upcoming activities | **Milestone preview entry — schedule editor unavailable**; explicit shared entry linking to `projects/milestones`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational schedules and upcoming activities. |
| `projects` — `/[locale]/dashboard/erp/projects/assignments` | Unqualified business-screen/action wording: Engineer and staff assignments | **Engineer workload preview — assignments unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Engineer workload/assignment fixtures and contextual request links; no assignment management or staff changes. |
| `projects` — `/[locale]/dashboard/erp/projects/diary` | Unqualified business-screen/action wording: Site diary | **Site-diary fixtures — editing unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Site diary review fixtures only; diary edits and evidence uploads are unavailable. |
| `projects` — `/[locale]/dashboard/erp/projects/progress` | Unqualified business-screen/action wording: Progress records and evidence | **Progress and evidence fixtures — updates unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Progress and evidence review fixtures only; no progress updates or evidence uploads. |
| `projects` — `/[locale]/dashboard/erp/projects/issues` | Unqualified business-screen/action wording: Issues and corrective actions | **Issue and finding fixtures — closure unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Issue/finding review fixtures only; no independent corrective-action workflow or closure operation. |
| `projects` — `/[locale]/dashboard/erp/projects/quality` | Unqualified business-screen/action wording: Quality inspections and findings | **Quality inspections and findings — review preview**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Construction-quality review fixtures only; no checklist editing, material testing or acceptance operation. |
| `projects` — `/[locale]/dashboard/erp/projects/weekly-reports` | Unqualified business-screen/action wording: Weekly reports and approval | **Weekly-report fixtures — approval and delivery unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Weekly-report review fixtures only; approving and publishing/delivering reports are unavailable. |
| `projects` — `/[locale]/dashboard/erp/projects/documents` | Unqualified business-screen/action wording: Project documents | **Document metadata fixtures — upload and download unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Document metadata preview only; upload and file download are unavailable. |
| `projects` — `/[locale]/dashboard/erp/projects/handover` | Unqualified business-screen/action wording: Handover | **Handover review fixtures — completion unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Handover review fixtures and workspace links only; no scheduling or completion operation. |
| `projects` — `/[locale]/dashboard/erp/projects/warranty` | Unqualified business-screen/action wording: Warranty | **Warranty fixtures — scheduling and closure unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Warranty review fixtures only; no visit scheduling or warranty-item closure. |
| `projects` — `/[locale]/dashboard/erp/projects/history` | Register title did not fully identify fixture/source scope: Project and phase history | **Project-status history fixtures — no phase history**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Project-status history fixtures only; phase-status history is not provided. |
| `projects` — `/[locale]/dashboard/erp/projects/reports` | Generic unavailable register / false UI-readiness claim for Project operational reports | **Deferred — Project operational reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No operational project report builder or business export is implemented. |
| `reporting` — `/[locale]/dashboard/erp/reporting/overview` | Link-only source counted as an embedded screen. | **Open management dashboard preview — link only**; explicit source-link kind, not an embedded report. | SEM; GRAPH | Existing illustrative dashboard link only. |
| `reporting` — `/[locale]/dashboard/erp/reporting/projects` | Repeated source presented as Project reports | **Shared review entry — Project reports**; explicit shared entry linking to `projects/weekly-reports`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational project reports. |
| `reporting` — `/[locale]/dashboard/erp/reporting/commercial` | Generic unavailable register / false UI-readiness claim for Commercial reports | **Deferred — Commercial reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Commercial reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/purchasing` | Generic unavailable register / false UI-readiness claim for Purchasing reports | **Deferred — Purchasing reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Purchasing reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/suppliers` | Generic unavailable register / false UI-readiness claim for Supplier reports | **Deferred — Supplier reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Supplier reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/inventory` | Generic unavailable register / false UI-readiness claim for Inventory reports | **Deferred — Inventory reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Inventory reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/treasury` | Generic unavailable register / false UI-readiness claim for Treasury reports | **Deferred — Treasury reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Treasury reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/financial` | Generic unavailable register / false UI-readiness claim for Financial reports | **Deferred — Financial reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Financial reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/customers` | Generic unavailable register / false UI-readiness claim for Customer reports | **Deferred — Customer reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Customer reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/operations` | Generic unavailable register / false UI-readiness claim for Operational performance reports | **Deferred — Operational performance reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Operational performance reports generation and business-data export are unavailable; no report dataset or calculations are connected. |
| `reporting` — `/[locale]/dashboard/erp/reporting/audit` | Repeated source presented as Audit and activity reports | **Shared review entry — Audit and activity reports**; explicit shared entry linking to `administration/audit`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational audit and activity reports. |
| `reporting` — `/[locale]/dashboard/erp/reporting/exports` | Repeated source presented as Report export workspace | **Navigation metadata download entry — no report export**; explicit shared entry linking to `data/export`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational report export workspace. |
| `settings` — `/[locale]/dashboard/erp/settings/general` | Informational note titled as operational General settings | **Read-only note — General settings**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/localization` | Informational note titled as operational Localization and display preferences | **Read-only note — Localization and display preferences**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/modules` | Informational note titled as operational Module configuration | **Read-only note — Module configuration**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/notifications` | Informational note titled as operational Notification configuration | **Read-only note — Notification configuration**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/documents` | Informational note titled as operational Document and attachment settings | **Read-only note — Document and attachment settings**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/operations` | Informational note titled as operational Operational configuration | **Read-only note — Operational configuration**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `settings` — `/[locale]/dashboard/erp/settings/health` | Informational note titled as operational Service health and diagnostics | **Read-only note — Service health and diagnostics**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only role/adapter boundary and implementation catalogue, not a live health probe or session/security-event inspector. |
| `settings` — `/[locale]/dashboard/erp/settings/history` | Generic unavailable register / false UI-readiness claim for Configuration history | **Deferred — Configuration history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No versioned configuration change log is connected. |
| `quality` — `/[locale]/dashboard/erp/quality/overview` | Generic unavailable register / false UI-readiness claim for Quality overview | **Deferred — Quality overview**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No authoritative construction-quality overview is connected. |
| `quality` — `/[locale]/dashboard/erp/quality/inspections` | Repeated source presented as Quality inspection records | **Shared review entry — Quality inspection records**; explicit shared entry linking to `projects/quality`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational quality inspection records. |
| `quality` — `/[locale]/dashboard/erp/quality/findings` | Repeated source presented as Findings and defects | **Shared review entry — Findings and defects**; explicit shared entry linking to `projects/issues`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational findings and defects. |
| `quality` — `/[locale]/dashboard/erp/quality/corrective-actions` | Repeated source presented as Corrective actions | **Issue preview entry — corrective workflow unavailable**; explicit shared entry linking to `projects/issues`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational corrective actions. |
| `quality` — `/[locale]/dashboard/erp/quality/checklists` | Generic unavailable register / false UI-readiness claim for Inspection checklists | **Deferred — Inspection checklists**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Checklist editing, acceptance criteria and inspection completion are unavailable. |
| `quality` — `/[locale]/dashboard/erp/quality/materials` | Generic unavailable register / false UI-readiness claim for Material and workmanship quality | **Deferred — Material and workmanship quality**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Material/workmanship test records, evidence and approval are unavailable. |
| `quality` — `/[locale]/dashboard/erp/quality/reports` | Generic unavailable register / false UI-readiness claim for Quality reports | **Deferred — Quality reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No quality-report generator or accepted defect metrics are implemented. |
| `crm` — `/[locale]/dashboard/erp/crm/customers` | Unqualified business-screen/action wording: Customer directory | **Customer directory fixtures — editing unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Existing customer-directory fixtures and contextual workspace links; no customer editing here. |
| `crm` — `/[locale]/dashboard/erp/crm/profiles` | Register title did not fully identify fixture/source scope: Customer profiles | **Customer reference fixtures — open full preview profiles**; read-only fixture status and dataset-specific scope. | SEM; GRAPH | Name/city references derived from request fixtures; open the existing customer workspace for a fuller preview profile. |
| `crm` — `/[locale]/dashboard/erp/crm/contacts` | Generic unavailable register / false UI-readiness claim for Contacts and preferences | **Deferred — Contacts and preferences**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | Customer contact/preference records and consent updates are unavailable. |
| `crm` — `/[locale]/dashboard/erp/crm/requests` | Repeated source presented as Customer request history | **Shared review entry — Customer request history**; explicit shared entry linking to `sales/requests`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational customer request history. |
| `crm` — `/[locale]/dashboard/erp/crm/inspections` | Repeated source presented as Inspection history | **Shared review entry — Inspection history**; explicit shared entry linking to `sales/inspections`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational inspection history. |
| `crm` — `/[locale]/dashboard/erp/crm/commercial` | Repeated source presented as Quotations and contracts | **Quotation preview entry — not a contract register**; explicit shared entry linking to `sales/quotations`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational quotations and contracts. |
| `crm` — `/[locale]/dashboard/erp/crm/projects` | Repeated source presented as Related projects and phases | **All-project preview entry — not customer scoped**; explicit shared entry linking to `projects/workspaces`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational related projects and phases. |
| `crm` — `/[locale]/dashboard/erp/crm/communications` | Repeated source presented as Customer communications history | **Contact inbox preview entry — no conversation history**; explicit shared entry linking to `sales/leads`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational customer communications history. |
| `crm` — `/[locale]/dashboard/erp/crm/complaints` | Unqualified business-screen/action wording: Complaints and suggestions | **Complaint review fixtures — replies and resolution unavailable**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Complaint review fixtures only; replies, assignment and resolution actions are unavailable. |
| `crm` — `/[locale]/dashboard/erp/crm/follow-up` | Generic unavailable register / false UI-readiness claim for Customer follow-up workspace | **Deferred — Customer follow-up workspace**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No saved follow-up tasks, ownership or due-date history exists. |
| `crm` — `/[locale]/dashboard/erp/crm/reports` | Generic unavailable register / false UI-readiness claim for Customer reports | **Deferred — Customer reports**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No customer-scoped report generator is connected. |
| `communications` — `/[locale]/dashboard/erp/communications/overview` | Unqualified business-screen/action wording: Notification overview | **Notification overview — review preview**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Notification fixtures including illustrative delivery details; no actual send, retry or mark-reviewed operation. |
| `communications` — `/[locale]/dashboard/erp/communications/history` | Repeated source presented as Notification history | **Shared review entry — Notification history**; explicit shared entry linking to `communications/overview`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational notification history. |
| `communications` — `/[locale]/dashboard/erp/communications/delivery` | Generic unavailable register / false UI-readiness claim for Delivery status workspace | **Deferred — Delivery status workspace**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No provider delivery events or transport receipts are connected. |
| `communications` — `/[locale]/dashboard/erp/communications/templates` | Generic unavailable register / false UI-readiness claim for Templates and event catalogue | **Deferred — Templates and event catalogue**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No event/template editor, approved content or provider integration exists. |
| `communications` — `/[locale]/dashboard/erp/communications/preferences` | Generic unavailable register / false UI-readiness claim for Communication preferences | **Deferred — Communication preferences**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No communication consent/preference persistence or enforcement exists here. |
| `communications` — `/[locale]/dashboard/erp/communications/pending` | Generic unavailable register / false UI-readiness claim for Failed and pending delivery | **Deferred — Failed and pending delivery**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No real pending/failed delivery queue or retry operation exists. |
| `communications` — `/[locale]/dashboard/erp/communications/follow-up` | Repeated source presented as Customer follow-up history | **Contact inbox preview entry — no follow-up history**; explicit shared entry linking to `sales/leads`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational customer follow-up history. |
| `administration` — `/[locale]/dashboard/erp/administration/overview` | Repeated source presented as Administrative overview | **Shared review entry — Administrative overview**; explicit shared entry linking to `settings/health`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational administrative overview. |
| `administration` — `/[locale]/dashboard/erp/administration/session` | Repeated source presented as Authenticated access information | **Shared review entry — Authenticated access information**; explicit shared entry linking to `settings/health`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational authenticated access information. |
| `administration` — `/[locale]/dashboard/erp/administration/operations` | Repeated source presented as Operational diagnostics | **Shared review entry — Operational diagnostics**; explicit shared entry linking to `settings/health`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational operational diagnostics. |
| `administration` — `/[locale]/dashboard/erp/administration/security` | Generic unavailable register / false UI-readiness claim for Security events | **Deferred — Security events**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No security-event source is connected; illustrative audit rows are not security telemetry. |
| `administration` — `/[locale]/dashboard/erp/administration/audit` | Unqualified business-screen/action wording: Audit history | **Audit history — review preview**; explicit source scope and preview status; ACTIONS2 marks unavailable business controls. | SEM; GRAPH; ACTION | Illustrative audit chronology only; not security-event monitoring or a business-data export service. |
| `administration` — `/[locale]/dashboard/erp/administration/health` | Repeated source presented as Application health | **Shared review entry — Application health**; explicit shared entry linking to `settings/health`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational application health. |
| `administration` — `/[locale]/dashboard/erp/administration/maintenance` | Informational note titled as operational Maintenance and configuration | **Read-only note — Maintenance and configuration**; read-only readiness scope; no setting write or live probe. | SEM; GRAPH | Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed. |
| `administration` — `/[locale]/dashboard/erp/administration/activity` | Repeated source presented as Administrative activity reports | **Shared review entry — Administrative activity reports**; explicit shared entry linking to `administration/audit`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational administrative activity reports. |
| `data` — `/[locale]/dashboard/erp/data/import` | Repeated source presented as Import workspace | **Local validator entry — no import**; explicit shared entry linking to `data/validation`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational import workspace. |
| `data` — `/[locale]/dashboard/erp/data/formats` | Format page duplicated the validator. | **Local JSON format instructions**; instructions/example and validator link, no form. | SEM; GRAPH | Proposed local JSON format only; no domain import. |
| `data` — `/[locale]/dashboard/erp/data/validation` | Tool scope/duplication or business-operation ambiguity: Validation preview | **Local JSON validation tool — no import**; one canonical local tool with explicit scope. | SEM; GRAPH | Local JSON validation only for reference/name/optional email. No domain import, saved results, wizard state or durable jobs. |
| `data` — `/[locale]/dashboard/erp/data/results` | Repeated source presented as Validation results and errors | **Local validator entry — no saved results**; explicit shared entry linking to `data/validation`, no duplicated body. | SEM; GRAPH | Canonical resource only; no distinct operational validation results and errors. |
| `data` — `/[locale]/dashboard/erp/data/export` | Tool scope/duplication or business-operation ambiguity: Export workspace | **Download navigation metadata only**; one canonical local tool with explicit scope. | SEM; GRAPH | Downloads static navigation names and routes only, never reports or business records. |
| `data` — `/[locale]/dashboard/erp/data/history` | Generic unavailable register / false UI-readiness claim for Export history | **Deferred — Export history**; page-specific missing-capability explanation and proposed-field list, no table/form/action. | SEM; GRAPH | No durable export jobs or export history exist. Menu downloads are not logged as business exports. |

### 11.4 Verification performed on Phase 2 code

| Check | Actual result |
|---|---|
| `npm test` | **630 passed / 22 files** on the final code, including the final title refinements and scoped wrapping styles. |
| ERP-specific files included in full suite | **255 tests / 7 files** (`erp-registry`, `erp-routes`, `erp-render`, `erp-ui`, `erp-semantics`, `erp-request-focus`, `erp-action-labels`). |
| `npm run test:contract` | **38 passed / 3 files**, a subset of the full suite. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, max warnings 0. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed compilation, type/lint, generation (131 whole-app static entries) and tracing; not an ERP feature count. |
| `git diff --check` | Passed. |
| Route/link checks | `tests/erp-semantics.test.ts` tests all AR/EN directory/hub/leaf/sidebar hrefs and mapped row detail links; every registered ERP destination is linked, shared targets are non-shared/same-source, no unresolved path/fixture-ID target. |
| Authenticated browser / visual acceptance | **Not performed.** No successful authenticated browser session or production/provider workflow was tested. |

The new route-specific tests complement, not replace, the old mocked guard composition and jsdom tests. `tests/fixtures/erp-route-ids.json` pins all 143 pre-correction IDs. Sort ordering and paging now have actual DOM assertions. Focus tests retain guard rejection and avoid opening any fallback record for invalid focus. Unavailable action tests examine visible labels in both locales before activation.

**Preservation:** no routes were deleted, and no public-site or Customer Portal route/selector was changed. Existing Admin workspaces and notice dialogs remain available. Only the request page gains validated focus behavior; shared boards gain honest action labels, not new business rules. Existing layout/middleware/owner guards, customer isolation helpers and private-note filtering remain intact. Unit tests/build checks still do not establish authenticated Portal regression acceptance.

**Explicitly out of scope / unchanged by this phase:** authentication configuration, auth secrets, environment variables, database/configuration, production, deployment settings, PR status, push and merge. Pre-existing working-tree changes to `.env.example`, CSRF/auth-related tests/scripts and audit files were not rewritten as part of these corrections. No business records, financial values or provider integrations were invented. No localStorage persistence, import/send/payment success or business export was added. The commercial-to-project persistence workflow was **not** started.


## 12. Phase 3 commercial-workflow persistence gate

**2026-10-26 — BLOCKED, not operational.** The persistence-first audit found no suitable real adapter in this checkout. Both runtime assemblies construct only development/test fakes; production refuses them. No database infrastructure, migrations, adapter registration or workflow mutation implementation was introduced. Existing routes and previous dirty-branch work are preserved.

The detailed [Phase 3 audit](./PHASE3_COMMERCIAL_WORKFLOW_AUDIT.md) contains the requested workflow diagram, state-transition/transaction table, exact existing-versus-missing interfaces, persistence/infrastructure handoff, owner-policy decisions, authorization evidence, end-to-end acceptance matrix, and changed-file inventory.

Critical gaps are not just configuration: the intake request port is create/read-only (`status: "new"`, `customerId: null`); no transactional interface spans intake request/history/outbox and foundation inspections/commercial/project records; commercial command validation/services/actions, real customer identity and Portal serializers, document storage/authorization, and approved staff/review/signature/multiplicity policies are missing. Reusing the pure engine and generic repositories does not provide these guarantees. Database engine/migration work requires an explicitly approved persistence scope or the engineer's real adapter/integration answers.

**Changes in Phase 3 only:** added `docs/PHASE3_COMMERCIAL_WORKFLOW_AUDIT.md` and `tests/workflow/commercial-gate.test.ts`; appended this section and its top-of-report pointer. No application source/UI/package/auth/CSRF/env/deployment/financial behavior was changed in this phase. No push, merge or PR-status change was made.

| Check | Phase 3 actual result |
|---|---|
| `npm test` | **686 passed / 23 files**; includes all Phase 2 regressions. |
| Focused workflow tests | **89 passed / 2 files**: 56 new persistence-gate tests + 33 existing pure transitions; subset, not extra tests. |
| `npm run test:contract` | **38 passed / 3 files**, fake/dummy only; subset of the full suite, not real database conformance. |
| Typecheck / lint / format check | Passed; lint max warnings 0. |
| Production build | Passed compilation, validation, static generation (131 whole-app entries) and tracing. |
| `git diff --check` | Passed. |
| Real-adapter full commercial chain / authenticated browser | **BLOCKED / NOT RUN.** |

**Authorization tested:** 16 anonymous calls return 401 and 16 customer-role calls return 403 before runtime access across the tested reads/planned mutations; four additional unprovisioned roles cannot create a project. Eight owner planned-write cases remain 501 for repeated/stale payloads, without consuming bodies or assembling services. Eight unavailable-runtime owner reads return 503; four explicit-input configuration tests verify fail-closed adapter selection. Mocked sessions/runtimes verify guard behavior, not login, actual customer A/B ownership, assignment-scoped service authorization, document grants or customer response-shape acceptance.

**Duplicate/stale and E2E limits:** the new repeated/stale attempts are intentionally refused as unavailable (501), not processed as idempotent replay/409-version checks. No successful BOQ/revision/customer-decision/signature/project creation transaction was executed. Real concurrent duplicate/stale handling, immutable stored histories, rollback, restart/multi-instance durability and full authorized end-to-end acceptance remain blocked. Do not call this workflow operational.


## 13. Second-recording screen-specification expansion — current screen delivery

**Date: 2026-10-26. Outcome: safe screen-level improvements implemented and verified locally; not an operational ERP release.** This phase is separate from the blocked Phase 3 durable workflow (§12). No adapter, database, migration, financial posting, supplier liability, auth/secret/env change or deployment was introduced. The previous Phase 2 catalogue/semantic corrections remain in place.

### 13.1 Reference and evidence boundaries

The second recording is approximately **246 seconds**, available to the user but **not uploaded or independently watched here**. The user's detailed extraction is the specification. Nothing in this delivery claims independent verification of the original screens, backend results, or unseen functionality. The first recording's **21 modules / 337 pages** remains historical reference metadata; BLACK X still has exactly **15 module hubs / 143 leaf IDs** (318 localized directory/hub/leaf destinations). Named layout views and query values are not additional catalogue pages.

The incorporated patterns are: account/language/appearance/guide/marketplace header hierarchy; searchable collapsible RTL/LTR navigation with identifiers/counts/active state; existing landing summary and page links; required-field forms and instructions; purpose-specific registers and report parameters; dedicated administration/access/organization/accounting/treasury/purchasing/commercial/CRM structures.

| Classification | How presented / limits |
|---|---|
| **1. Directly visible in the recording (user-supplied extraction), R** | Module concepts, user-table fields/actions, page-permission selectors, branch/company concepts, account debit/credit structures, years/closing/history, report filters, cash/bank and purchasing navigation. UI explicitly says “described as visible” and “not independently viewed.” This is not an assertion that every BLACK X field/label/grouping or original operation was seen or exercised. |
| **2. BLACK X construction-specific adaptation, A** | Construction orders/commitments and sales-stage pipeline, project cost-center context, quotation revision/decision structures, supplier-payment requirements, response metrics, communication preferences. Existing request→inspection→BOQ→decision→contract→project previews remain canonical and do not become a retail workflow. English labels, route grouping, local validation and scope explanations are design adaptations even on R-class concepts. |
| **3. UI-only / preview** | Every new detailed structure is a disconnected layout with local parameters/drafts, bounded deep links and an explicit empty schema table. Existing populated fixture boards/registers remain separately labeled and unchanged as business data. Local validation is not domain approval. |
| **4. Backend-dependent** | All real lookups, business reads/writes, user provisioning/grants/revocation, company/branch activation/archive/isolation, accounting/posting/closing/reopening, reports/exports, bank/treasury actions, purchasing receipts/liabilities/payments, decisions/signing/projects, message delivery/distribution/metrics, backups/restores and persistent settings remain unavailable. |
| **5. Unverified legacy behavior, U** | Conditional currency exchange/revaluation and quota/add-on entitlement behavior; exact definitions/formulas for the supplied “public/general budget” label; original action execution, success, accounting rules, history semantics, and all unseen screens. The original recording's application backend, quotas and multi-company isolation are not verified. |

Schema evidence is in `src/config/erp-screen-specs.ts`: 43 existing route hosts, **74 layout placements / 59 distinct layout IDs**. Reuse (for example the financial-report structures in accounting and reporting, and audit structures in related sections) is visual metadata reuse only, not independent operational ledgers. Placement evidence tags are 61 R / 11 A / 2 U; these are not counts of verified legacy screens. All new layout controls are UI-only and backend-dependent regardless of R/A/U.

### 13.2 What changed, and what actually works

- **Persistent Admin header:** retains existing account, language and sign-out behavior. Adds an access-information link, guide link to an in-app usage/boundary disclosure, a temporary compact-layout toggle, and an explicitly disabled marketplace entry. Density affects only new Admin layout spacing, is not saved, and is not a theme or preference service. No add-on purchase/quota is fabricated. Optional AppShell slots leave Portal defaults intact.
- **Navigation / landing:** retains the right-side Arabic and left-side English shell pattern, search, grouping and active state. The rail now shows stable module IDs and matching/total page counts. Bilingual search includes named layout views. A matching view can be linked by `?view=...` on an existing route; hubs expose explicit layout links. The directory retains module/page summary cards and adds the system guide. No count inflation or new route ID.
- **Page permissions:** adds boundary/user selection (not a live user directory), module/page selectors, permission requirement and bilingual search. Matching rows link to the page and module; numeric minimum levels are explicitly unconfigured and the current server owner-review boundary is stated. Create/edit/approve/admin remain unavailable. Export filtering identifies only the existing navigation-metadata tool, never business reports. No permission grant, role assignment, enforcement policy or authorization layer is changed.
- **Users / roles:** detailed login, name, email, level/role, status, assigned roles and organization columns plus local draft structures. Edit, role/branch assignment, activation/deactivation and session revocation are named as unavailable. There are no password, hash, token or secret inputs, and no real user records. User-management layouts are hosted in existing administrative overview/permission assignment routes, not a new user route.
- **Companies / branches / settings:** company/branch search structure, disabled status/data lookups, unknown-state cards and required name draft; add/edit/archive controls unavailable. General, print, navigation/quota and notification layouts are separate views on existing settings routes. This does not enable multi-company isolation or persistent settings.
- **Accounting:** separate chart, opening balances, cost centers, daily/non-posted/unbalanced journals, financial-year and closing/history views. Nine named accounting report layouts include trial balance, account statement, ledger, journals, income, general budget, tax and cost-center summary/detail. Trial balance and chart show opening debit/credit, period debit/credit and closing debit/credit column structures. Report parameters are purpose-specific: tax/cost-center reports do not inherit unrelated subaccount filters; account-level/subaccount controls occur only where applicable. Financial entity/branch/account sources remain disabled, not invented. Closing summaries, open-period and unposted counts are **unknown**, not zero or synthetic profit/loss. A working disclosure inspects closing/audit prerequisites; no close/reopen is performed.
- **Treasury:** distinct cash versus bank receipts and disbursements, bank-account/treasury structures, transfers, voucher history, conditional revaluation and financial position. Each has a scope description and relevant columns. Existing incoming-payment fixtures are not bank history; existing expense fixtures are not outgoing cash vouchers. The older shared source links remain explicitly separate previews.
- **Purchasing:** purchase invoice, order and receipt-tool views coexist as separate named layouts under the existing invoices route; returns have original-document/reason columns. Supplier, dated reference, lines, quantities, units, cost, status, attachment, payment and project/phase structures are explicit. Document scope descriptions distinguish invoice/order/receipt/return and state that none posts stock, liabilities or payment. Existing purchase/line/allocation/supplier fixtures are not relabeled as these transactions.
- **Sales / CRM / communications:** construction orders and stage reports, contact search/status reports, revision/decision history structures, channels/delivery, staff distribution and response-metric requirements. Existing inbox/customers/requests/inspection/BOQ/contract/project boards are retained. Distribution means incoming-message staff assignment, **not a marketing/broadcast system**. No campaign, retail checkout or provider transport is added.
- **Actual read-only fixture filtering:** `ErpRegister` adds customer/supplier/project selectors only when those columns exist, ISO-date range controls only on dated datasets, and clear-filter behavior. The seven date-metadata sources are invoices, payments, cash, receipts, expenses, purchase allocations and project-status history; existing values are reused, not parsed from localized display dates. Invalid reverse ranges show an error. Undated BOQ rows receive no date/company selectors. Existing search, status/type filter, sorting, paging and real preview-detail links remain.
- **Local draft/parameter checks:** required fields, email syntax, finite non-negative numbers, real ISO dates and date ordering are checked locally. Required lookup fields always remain unavailable even if a forged value is passed to the validator. Checks never submit, persist, calculate business totals or validate business eligibility; stale validation feedback clears on edits and transient draft/parameters clear on layout switch/discard. Instructions require synthetic values only. No localStorage, network write, upload, report printing or misleading success toast.
- **Actions/history:** layout-only primary actions are disabled and suffixed “unavailable”; row-action requirements are a disclosure, not active row menus against nonexistent rows. Sensitive layouts show server-authorization/version/impact/confirmation/atomic-history prerequisites. No destructive/financial action is enabled, so no fake confirmation-to-success flow is added. Empty tables explicitly mean disconnected data, not zero balances or empty operational ledgers. Report print/CSV/Excel unavailability is explanatory text, **not dead export buttons**; existing navigation-metadata export stays separate.

These changes supersede §11's “no table/form/control” presentation description **only for the newly authorized disconnected layout panels**. The deferred business bodies and shared canonical workspace boundaries retain their Phase 2 semantics. Kind counts are intentionally unchanged: 59 deferred / 34 shared / 22 preview / 15 fixture / 8 readiness / 3 tool / 1 source-link / 1 instructions. Backend “deferred” is not promoted to operational merely because a form structure now exists.

### 13.3 Components and changed-file inventory (this phase only)

| File / component | Existing vs new | Change |
|---|---|---|
| `src/config/erp-screen-specs.ts` | New | Typed bilingual view metadata, evidence/purpose/dependency labels, route/view resolver, local-only validation. No business records or adapter. |
| `src/components/dashboard/ErpScreenPreview.tsx` | New | Shared disconnected layout renderer: views, field/parameter controls, column schema/empty state, unavailable action/row-action requirements, local drafts and history prerequisites. |
| `src/components/dashboard/ErpHeaderTools.tsx` | New | Admin-only access/guide/local density/unavailable marketplace controls. |
| `src/components/dashboard/ErpPageContent.tsx` | Existing, extended | Composes the new separately labeled panel while retaining shared links/canonical boards/deferred business boundaries; avoids obsolete generic field list alongside a detailed layout. |
| `src/components/dashboard/ErpAccessMatrix.tsx` | Existing, extended | Descriptive selector/search/matching-page interface; no grants or enforcement changes. |
| `src/components/dashboard/ErpDirectory.tsx` | Existing, extended | Guide, alias-aware bilingual search and bounded layout links under existing pages. |
| `src/components/dashboard/ErpNavigation.tsx` | Existing, extended | Module identifiers/counts; bilingual layout search and matching-view links; active base-page state retained. |
| `src/components/dashboard/ErpRegister.tsx` | Existing, extended | Real local filtering of existing fixture rows by date/entity where supported; clear filters and range error. |
| `src/lib/erp-data.ts` | Existing, extended | Optional ISO `filterDate` metadata from existing fixtures; no fixture values or totals changed. |
| `src/components/dashboard/DashboardShell.tsx` | Existing, extended | Local density state and optional Admin header controls; same role boundary. |
| `src/components/ui/AppShell.tsx` | Existing, extended | Optional topbar/class slots; Portal default navigation/header preserved. No login/session change. |
| `src/styles/erp.css` | Existing, extended | Scoped logical-direction grids, wrapping, table scroll, disclosure/field errors, header responsiveness and temporary compact layout. |
| `src/app/[locale]/dashboard/erp/[area]/[page]/page.tsx` | Existing, extended | Server guard still first; exact allow-list resolution of single `view` query after auth; repeated/unknown/cross-page values ignored; no mutation. |
| `tests/erp-screen-specs.test.ts` | New | 130 metadata/field-validation/bilingual layout regressions. |
| `tests/erp-screen-ui.test.ts` | New | 15 local behavior, matrix, navigation/header, fixture-filter and Portal-slot-default tests. |
| `tests/erp-routes.test.ts` | Existing, extended | Two query/guard-order regressions; seven cases total. |
| `tests/erp-semantics.test.ts` | Existing, adapted | Old no-operation assertions now distinguish the authorized layout panel from the deferred/shared business body. Original route IDs, business-kind/source invariants and full link-graph tests retained. |
| `tests/erp-ui.test.ts` | Existing, adapted | Matrix selectors target the actual module control and allow the new descriptive search input; still prohibits grant buttons. |
| `docs/ERP_VERIFICATION_REPORT.md` | Existing, appended | This current evidence/mapping/results section and latest-status pointer. Previous phase history retained. |

The 15/143 registry in `src/config/erp.ts` and route-ID fixture were **not edited**. No existing DomainBoard/ExpansionBoard/RequestsBoard/customer/project/public/Portal content or fixture source was rewritten. Pre-existing dirty `.env.example`, CSRF/auth tests/scripts, and all earlier branch changes were left in place, not reset.

### 13.4 Route-by-route audit and mapping

Every retained leaf is listed below. **58 existing leaves have route-specific layout/matrix/register refinements**; all others retain their own existing body while gaining the global navigation/guide/header patterns. R/A/U apply only to the new view concept's evidence, not its availability. Every new view is UI-only/backend-dependent. Existing preview/fixture rows remain illustrative; deferred operations remain absent. Subview IDs use `?view=<id>` on the same guarded route.

| Existing route suffix `/[locale]/dashboard/erp/…` | Retained business kind | New layout mapping / refinement versus prior implementation |
|---|---|---|
| `permissions/overview` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `permissions/roles` | shared | **Layout preview:** `roles` — Role definitions (R) |
| `permissions/matrix` | tool | **Descriptive matrix refined:** boundary/user, module, page, requirement and search selection; matching page/module links; minimum owner-review requirement; no grants. |
| `permissions/assignments` | shared | **Layout preview:** `users` — User administration (R) |
| `permissions/denied` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `permissions/history` | deferred | **Layout preview:** `audit` — Activity and audit history (R) |
| `accounting/overview` | deferred | **Layout preview:** `financial-years` — Financial years (R) |
| `accounting/transactions` | deferred | **Layout preview:** `daily-journals` — Daily journal entries (R); `unposted-journals` — Non-posted journals (R); `unbalanced-journals` — Unbalanced journals (R) |
| `accounting/accounts` | deferred | **Layout preview:** `chart-of-accounts` — Chart of accounts (R); `opening-balances` — Opening account balances (R); `cost-centers` — Cost centers (A) |
| `accounting/customer-balances` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `accounting/supplier-balances` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `accounting/project-summaries` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `accounting/invoices` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `accounting/certificates` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `accounting/payments` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `accounting/receipts` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `accounting/expenses` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `accounting/reports` | deferred | **Layout preview:** `trial-balance` — Trial balance (R); `account-statement` — Account statement (R); `general-ledger` — General ledger (R); `journal-report` — Journal report (R); `income-statement` — Income statement (R); `general-budget` — Public / general budget report (R); `tax-reports` — Tax reports (R); `cost-center-summary` — Cost-center summary (R); `cost-center-detail` — Cost-center detail (R) |
| `accounting/corrections` | deferred | **Layout preview:** `period-closing` — Fiscal-period closing prerequisites (R); `closing-history` — Closing / reopening history (R) |
| `treasury/overview` | deferred | **Layout preview:** `treasuries` — Treasuries / cash registers (R) |
| `treasury/cash-register` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `treasury/bank-accounts` | deferred | **Layout preview:** `bank-accounts` — Bank accounts (R) |
| `treasury/receipts` | shared | **Layout preview:** `cash-receipts` — Incoming cash receipts (R); `bank-receipts` — Incoming bank receipts (R) |
| `treasury/disbursements` | shared | **Layout preview:** `cash-disbursements` — Cash disbursements (R); `bank-disbursements` — Bank disbursements (R) |
| `treasury/history` | shared | **Layout preview:** `voucher-history` — Treasury voucher history (R); `transfers` — Transfers between accounts / treasuries (R); `currency-revaluation` — Currency exchange / revaluation — unsupported (U) |
| `treasury/reconciliation` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `treasury/reports` | deferred | **Layout preview:** `financial-position` — Financial-position report (R) |
| `cheques/register` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/incoming` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/outgoing` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/details` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/maturity` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/history` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/exceptions` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `cheques/reports` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/overview` | deferred | **Layout preview:** `sales-orders` — Construction sales orders / commitments (A) |
| `sales/leads` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/requests` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/inspections` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/quotations` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/boq` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `sales/revisions` | shared | **Layout preview:** `quotation-revisions` — Quotation revision structure (A) |
| `sales/decisions` | shared | **Layout preview:** `customer-decisions` — Customer decision history (A) |
| `sales/contracts` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `sales/change-orders` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `sales/reports` | deferred | **Layout preview:** `sales-stages` — Construction sales-stage report (A) |
| `purchasing/overview` | deferred | **Layout preview:** `purchasing-overview` — Purchasing document overview (R) |
| `purchasing/suppliers` | fixture | **Layout preview:** `supplier-details` — Supplier directory structure (R)<br>**Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `purchasing/supplier-history` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `purchasing/purchases` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `purchasing/lines` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `purchasing/invoices` | deferred | **Layout preview:** `purchase-invoices` — Purchase invoices (R); `purchase-orders` — Purchase orders (R); `purchase-receipts` — Purchase receipt tools (R) |
| `purchasing/payments` | deferred | **Layout preview:** `supplier-payments` — Supplier payment register — unavailable (A) |
| `purchasing/payables` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `purchasing/returns` | deferred | **Layout preview:** `purchase-returns` — Purchase returns (R) |
| `purchasing/allocations` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `purchasing/reports` | deferred | **Layout preview:** `purchase-reports` — Purchasing reports (A) |
| `inventory/overview` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/items` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/warehouses` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/receipts` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/balances` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/issues` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/transfers` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/returns` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/adjustments` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/history` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `inventory/reports` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/portfolio` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/workspaces` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `projects/phases` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `projects/milestones` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/schedule` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/assignments` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/diary` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/progress` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/issues` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/quality` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/weekly-reports` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/documents` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/handover` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/warranty` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `projects/history` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `projects/reports` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/overview` | source-link | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/projects` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/commercial` | deferred | **Layout preview:** `commercial-pipeline` — Inquiry to project pipeline report (A) |
| `reporting/purchasing` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/suppliers` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/inventory` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/treasury` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/financial` | deferred | **Layout preview:** `trial-balance` — Trial balance (R); `account-statement` — Account statement (R); `general-ledger` — General ledger (R); `journal-report` — Journal report (R); `income-statement` — Income statement (R); `general-budget` — Public / general budget report (R); `tax-reports` — Tax reports (R); `cost-center-summary` — Cost-center summary (R); `cost-center-detail` — Cost-center detail (R) |
| `reporting/customers` | deferred | **Layout preview:** `customer-report` — Customer-related report (R) |
| `reporting/operations` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/audit` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `reporting/exports` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `settings/general` | readiness | **Layout preview:** `branches` — Companies and branches (R); `general-settings` — General settings (R); `print-settings` — Print settings (R) |
| `settings/localization` | readiness | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `settings/modules` | readiness | **Layout preview:** `navigation` — Sidebar / navigation configuration (R); `quotas-addons` — User and module quotas / add-ons (U) |
| `settings/notifications` | readiness | **Layout preview:** `notification-settings` — Notification settings (R) |
| `settings/documents` | readiness | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `settings/operations` | readiness | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `settings/health` | readiness | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `settings/history` | deferred | **Layout preview:** `audit` — Activity and audit history (R) |
| `quality/overview` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/inspections` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/findings` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/corrective-actions` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/checklists` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/materials` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `quality/reports` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/customers` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/profiles` | fixture | **Existing fixture register refined:** relevant customer/supplier/project filters derived from actual columns; ISO-date range only if fixture date metadata exists; clear filters. No new records. |
| `crm/contacts` | deferred | **Layout preview:** `customer-search` — Customer search and contact structure (R) |
| `crm/requests` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/inspections` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/commercial` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/projects` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/communications` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/complaints` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `crm/follow-up` | deferred | **Layout preview:** `response-metrics` — Response metrics (A) |
| `crm/reports` | deferred | **Layout preview:** `customer-status` — Customer status report (R) |
| `communications/overview` | preview | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `communications/history` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `communications/delivery` | deferred | **Layout preview:** `channels` — Message channels and delivery (R) |
| `communications/templates` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `communications/preferences` | deferred | **Layout preview:** `communication-preferences` — Communication consent and preferences (A) |
| `communications/pending` | deferred | **Layout preview:** `distribution` — Message distribution / staff assignment (R) |
| `communications/follow-up` | shared | **Layout preview:** `response-metrics` — Response metrics (A) |
| `administration/overview` | shared | **Layout preview:** `users` — User administration (R); `roles` — Role definitions (R) |
| `administration/session` | shared | **Layout preview:** `access-information` — Administrative access information (R) |
| `administration/operations` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `administration/security` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `administration/audit` | preview | **Layout preview:** `audit` — Activity and audit history (R) |
| `administration/health` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `administration/maintenance` | readiness | **Layout preview:** `backups` — Backup administration (R) |
| `administration/activity` | shared | **Layout preview:** `audit` — Activity and audit history (R) |
| `data/import` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `data/formats` | instructions | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `data/validation` | tool | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `data/results` | shared | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `data/export` | tool | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |
| `data/history` | deferred | Existing route-specific content retained; no new layout/data/service. Global guide/header/navigation improvements only. |

### 13.5 Deferred services and unverified details

- Identity/user directory, approved role/resource predicates, provisioning/revocation and audit services are still required. The matrix and metadata are never authorization enforcement; existing server owner guards and API refusal behavior remain unchanged.
- Company/branch records, hierarchy, archive policies and isolation are absent. Single-workspace server resolution remains; no tenant model or multi-company claims.
- Accounting requires an approved chart, opening/posting/tax/rounding rules, accounting periods/closing and immutable history. No ledger, balances, trial-balance calculation, profit/loss, closing or reopening service was added.
- Treasury requires source-specific vouchers, authorized bank/cash accounts, reconciliation, atomic transfer and currency policy. Cash-in/expense fixtures cannot substitute for bank history/disbursements.
- Purchasing requires separate orders/invoices/receipts/returns, actual supplier liabilities/payment services, inventory rules and durable allocation/audit. None is implemented by the layout or existing fixture links.
- Construction commercial orchestration remains blocked by the exact adapter/port/policy gaps in [Phase 3 audit](./PHASE3_COMMERCIAL_WORKFLOW_AUDIT.md). No customer decision/signature/project creation service was started in this screen phase.
- Message transport/consent/assignment and correlated timestamp events are needed for distribution/response reports. No broadcast system or inferred metric.
- Private document storage, print/report generation and authorized business export are absent. Attachment columns are structures only; no upload or download grant. Backups require an approved provider, job/retention service and tested restore procedure; no backup record/job/archive is fabricated.
- Exact legacy form options, state catalogs, min-level numbering, report formulas, original button outcomes, actual backup/restore/isolation behavior, quota/add-on entitlements and unseen screens remain unverified. Disabled status/organization/account selectors do not invent options or real entities. “Public/general budget” is retained as a supplied label, not silently translated into a verified statutory statement.

### 13.6 Verification actually performed

| Check | Latest result |
|---|---|
| `npm test` | **833 passed / 25 files** on final application/test code. |
| `npx vitest run tests/erp*.test.ts` | **402 passed / 9 files**, subset of the full suite. Includes retained 143-ID/15-hub checks and all AR/EN directory/hub/leaf/sidebar/fixture links, plus new layout/query links. |
| New metadata/layout validation suite | **130 tests**, included above; all 43 mapped routes and 74 placements, both locales, exact columns and unavailable actions, evidence labels, bounded view IDs, purpose-specific filters and local input rejection. |
| New DOM behavior suite | **15 tests**, included above; required/lookup/error/reset/no-network/storage/print, layout switch clearing, closing prerequisites, matrix selectors/search, fixture date/entity filtering in AR/EN, undated BOQ, alias links/counts and temporary header controls. Portal default-slot behavior uses mocked desktop `matchMedia`, not a real browser/identity. |
| Guarded ERP route suite | **7 tests**, included above; guard rejection precedes query inspection; valid/invalid/ambiguous/cross-page view values; all retained localized routes compose. |
| `npm run test:contract` | **38 passed / 3 files**, subset; fake/dummy adapters only, not durable integration evidence. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, max warnings 0. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed compilation, lint/type validation, static generation (131 whole-app entries, not ERP feature count) and tracing. |
| `git diff --check` | Passed. |
| Authenticated browser / physical RTL/LTR responsive/a11y acceptance | **Not performed.** Component/DOM render, logical CSS and build are not a successful login or visual acceptance. |
| Durable operations / real-adapter E2E / provider actions | **Not run / not enabled.** No business-operation success claim. |

Initial regressions correctly flagged the old phase's blanket “no forms/tables” assertion and the old matrix first-select assumption; tests were adapted to the newly requested, explicitly disconnected layout scope without weakening source/route/auth assertions. A jsdom-only Portal fixture needed a mocked `matchMedia`; final tests pass. No test failure was “fixed” by changing fixtures, enabling an adapter or weakening authorization.

**Preservation and completion boundary:** safe screen-level improvements are complete for this specification. Existing 15 hubs / 143 route IDs, Admin/Portal functionality, server guards and AR/EN composition are preserved by the local checks. No authentication, secrets, environment variables/files, database/configuration, production/deployment/PR-status change, push or merge was performed. No database work, fake persistence, financial posting, supplier liabilities or marketing broadcast was added. This is a refined ERP screen/preview delivery, not production or legacy-backend acceptance.


## 14. Frontend-only permissions, users and roles — current delivery

**Date: 2026-10-26. Scope: FRONTEND ONLY.** Implemented the requested permission-selection interaction and synthetic identity workspaces on the current branch, `arena/54de42da-blackx-construction-finishing`. This is not implementation of identity provisioning, authorization policy, session administration or a durable commercial workflow. §12's persistence gate remains blocked and untouched. Previous frontend, auth/CSRF and other dirty-branch work was preserved.

### 14.1 Inputs, evidence and scope lock

Read/reused the verification report (§§11–13), implementation delivery/addendum and Phase 3 commercial-workflow audit, and inspected the 15/143 registry, existing matrix/layout previews, Admin/Portal shell composition, navigation, native dialogs, design tokens, bilingual content and frontend tests. The supplied reference describes a large Arabic permissions dialog with grouping, checkboxes, technical identifiers and scrolling. **No recording was uploaded or independently viewed.** Grouped interaction patterns come from the user; BLACK X labels, technical keys, fixture records and grouping choices are frontend adaptations, not verified original ESTC permissions or backend policies.

No API, contract, server action, backend service/port/adapter, authorization enforcement, session handling, auth helper, secret, environment/configuration, database, hosting/deployment or PR-status change was made. No push/merge/deploy operation occurred. A start/end comparison verified **89 existing protected files unchanged byte-for-byte**: server foundation/intake/workflow trees, API routes, auth/middleware/account helpers, existing types/scripts/workflows, environment files, dependencies/lockfile and the previously extended server leaf-route handler. Only presentation components/content/configuration, frontend tests, scoped CSS and this report changed. This check establishes this phase's preservation; it does not erase or reattribute earlier dirty changes.

### 14.2 Permission catalogue — bounded and mapped, not security enforcement

`src/lib/erp-ui-permissions.ts` defines **165 UI descriptions**:

- **15 module-view definitions**, exactly one per existing hub.
- **143 page-view definitions**, exactly one per retained leaf ID. Page visibility is a UI concept, not permission to read the page's business data.
- **7 curated action definitions**, listed below. No create/edit/delete/approve/export keys were blindly multiplied across every page.

| Technical UI identifier | Existing frontend destination / action | Status |
|---|---|---|
| `ui.data.validation.check_local` | `data/validation`: existing local JSON validation; not an import | Selectable local action description |
| `ui.data.export.download_metadata` | `data/export`: existing navigation-metadata download; not report/business export | Selectable local action description |
| `ui.administration.overview.edit_preview_user` | Synthetic display-name/status simulation in the new directory | Selectable local simulation description |
| `ui.permissions.assignments.assign_preview_roles` | Synthetic user-to-role selection/summary | Selectable local simulation description |
| `ui.permissions.roles.assign_preview_permissions` | Synthetic role's UI selection picker | Selectable local simulation description |
| `ui.sales.requests.edit_preview_draft` | Existing screen-only request assignment/status draft; no new workflow or saved request | Selectable existing preview-action description |
| `ui.purchasing.invoices.create_document` | Existing unavailable purchase-document action requirement | **Disabled / backend-dependent**, not selectable |

Thus **164 descriptions are selectable**, not 164 real grants. Audit/history concepts use their existing mapped view definitions. No archive/delete, dedicated approve/reject or print keys are invented for operations without a corresponding supported frontend action. The existing request status draft is represented as a draft-edit concept, not as independent approval authority. Technical IDs start with `ui.`; they are not backend permission names, legacy IDs, role codes or secrets. Every target resolves to the actual module/page catalogue. Selecting a module definition does not silently select its pages.

Selection normalizes unknown, duplicate and unavailable IDs. This normalization is a UI integrity check only and **is not an authorization control**. Neither the selected definitions nor synthetic user/role state is passed to server guards, APIs, session/auth providers, sidebar visibility predicates or real domain operations.

### 14.3 Implemented permissions interaction

The new `ErpPermissionPicker` is a named/described native `<dialog>` with the existing BLACK X dialog/button/token visual language:

- Wide desktop layout, bounded viewport height, scrollable content and wrapping mobile footer. Arabic RTL / English LTR and LTR-isolated technical identifiers.
- Fifteen module-based groups with keyboard-native controls, expand/collapse, and selected/available totals. Checkboxes represent unchecked, checked and partial states using native `indeterminate` plus descriptive ARIA state.
- Search matches Arabic/English labels and public technical identifiers. Search expands matching groups; users can still collapse them. Empty results explain that hidden selections are retained.
- Individual selection, group-level select/clear and global matching select/clear. **Bulk actions affect only matching selectable definitions**, not hidden groups or unavailable requirements. Group checkbox state concerns the current match set; the selected/total count concerns the full available group. Unavailable requirements stay disabled and excluded from selectable totals.
- A selected count remains visible. The picker never infers inherited grants from a module or role.
- A two-step review: selection → complete readable summary (including hidden search selections) → **Confirm preview selection**. A UI-only empty-selection check is announced adjacent to the footer and explains it is not an access policy. Back returns to the draft. Cancel/Escape discards the draft and leaves any prior confirmed preview unchanged.
- Escape/cancel, explicit Tab/Shift+Tab boundary wrapping, initial search focus, review-heading focus, opener focus restoration and previous body-scroll restoration. Native controls provide checkbox/button keyboard semantics; native modal behavior and physical mobile scrolling still require real-browser acceptance.

`ErpPermissionSelectionPreview` integrates this with the existing descriptive matrix. Confirm changes only a temporary, unassigned summary on that mounted screen. It grants no user or role anything. The old matrix's module/page/search/requirement controls, minimum owner-review boundary and navigation links remain intact, with no editable real-grant controls.

### 14.4 User / role workspaces and preview-only state

`ErpIdentityWorkspace` replaces only the previously disconnected `users` / `roles` layout views with a genuine **frontend fixture interaction**, not fake backend integration:

- **8 synthetic users / 6 synthetic roles**; `preview-*` IDs, clearly artificial bilingual display names, and reserved `@example.invalid` addresses. No real account, phone, password, credential, numeric security level, token or backend role code is invented.
- Three related views: **User directory**, **Role directory**, **User-to-role assignment**. All share the same local state within one mounted workspace, so switching these tabs preserves that workspace's temporary edits. Other route instances do not become a shared account store.
- User rows show login, display name, fixture email, explicit preview status, assigned preview-role chips and contextual inspect/assignment actions. Active/inactive/invited labels explicitly refer to examples; invited examples send no invitation.
- User detail panels show the selected fixture, local-only display-name validation (2–80 characters), simulated status selection and a temporary role-checkbox list. The role list has a readable summary before **Confirm temporary role list**, including the empty-list case. Close/reopen resets unconfirmed fields to the current local fixture. No account creation, activation/deactivation, password change or session revocation operation exists.
- Role rows have role identifier/name, description, selected UI-definition count, synthetic member count and role-specific details. Details list the selected definitions and open the shared permission picker. Counts/summary update only after confirming the local selection, never on cancellation. They do not represent effective permissions.
- Search is bilingual and includes login/email/role labels or technical IDs as appropriate. User status and role filters apply only to user views; role module filters apply only to role definitions. Name ascending/descending and identifier sorting, five-row pagination, clear filters and contextual empty states operate on actual fixture arrays.
- Feedback is a neutral “temporary preview changed” explanation, **not an API success toast**. Fixture seeds are copied, not mutated. No fetch, upload, localStorage/sessionStorage, cookies, session mutation, account provisioning or persistent audit event is used. State resets when the workspace unmounts/remounts or the page refreshes; it is not durable or cross-user/cross-route state.

The new controls are not a resurrection of backend role management: live grants, provisioning and session revocation remain unavailable. Financial and commercial records are neither changed nor “saved.”

### 14.5 Route mapping, titles and catalogue-wide polish

Exactly **15 hubs / 143 leaf IDs** remain, with the same sources, shared canonical targets, kind classifications and existing Admin/Portal routes. No new route ID, API or query contract was added.

| Existing route | Current frontend presentation / change |
|---|---|
| `permissions/matrix` | Descriptive page requirements plus the new grouped UI permission selection sandbox. Title/scope explicitly identify UI selection rather than effective grants. |
| `permissions/roles` | Synthetic role directory/details/permission assignment, with the original shared matrix-reference link retained separately. |
| `permissions/assignments` | Synthetic user-to-role assignment view, with user/role tabs and the original matrix reference retained. |
| `administration/overview` | Synthetic user and role directories, details, assignments and local permission previews; original diagnostics reference remains separately linked. Existing `?view=users` / `?view=roles` layouts remain frontend-compatible; no server handler was changed. |
| `permissions/overview`, `permissions/denied` | Explicit canonical entry links remain; no duplicate grant editor or fabricated denial records. The richer matrix is available through its existing canonical destination. |
| All 143 leaf pages, all 15 hubs | Reviewed through existing bilingual registry/render/navigation tests. Every leaf now has a module-relative page-position/previous/next/directory context bar. No cross-module leap, invalid edge link or route inflation. Existing hub/rail search/counts, breadcrumbs, guide and collapsed/active navigation are retained. |
| Existing fixture and layout tables/forms across ERP | Scoped sticky headers/scroll regions, consistent captions, technical-ID wrapping, directional spacing, status readability, focus styles, responsive detail/filter controls and modal layouts. Existing page-specific columns/filters remain; no unrelated module is replaced with the identity table. |
| Remaining deferred/backend-dependent pages | Keep page-specific requirements, empty/disconnected layouts and unavailable action labels. They are not populated with invented operational data merely to appear complete. Prior financial/treasury/purchasing/report and construction adaptations remain explicit previews or deferred services. |

Only four catalogue title/summary pairs changed (the four primary routes above), to match their now-interactive frontend contents. Source IDs, route IDs, type counts and authorization helpers in the registry are untouched. Shared-entry copy on the identity host routes now explicitly separates the local synthetic directory from the canonical reference link; temporary state is not presented as shared durable state. Existing Public/Portal content and shared native dialog implementation were not edited.

### 14.6 Component/file inventory — this phase only

| File / component | Change |
|---|---|
| `src/lib/erp-ui-permissions.ts` | **New:** bounded frontend catalogue and pure selection/search/group-state utilities; no enforcement. |
| `src/content/erp-identity-preview.ts` | **New:** synthetic bilingual users/roles, separate from real identity and all existing business fixtures. |
| `src/components/dashboard/ErpPermissionPicker.tsx` | **New:** large grouped selection/review native modal, local validation, keyboard/focus/scroll handling. |
| `src/components/dashboard/ErpPermissionSelectionPreview.tsx` | **New:** unassigned local selection sandbox and summary. |
| `src/components/dashboard/ErpIdentityWorkspace.tsx` | **New:** user/role/assignment directories/details and mounted-only simulations. |
| `src/components/dashboard/ErpPageNavigator.tsx` | **New:** pure presentation links/position across original module pages. |
| `src/components/dashboard/ErpAccessMatrix.tsx` | Adds the selection sandbox; existing descriptive matrix retained. |
| `src/components/dashboard/ErpScreenPreview.tsx` | Uses the identity workspace only for `users` / `roles` views. All other layout schemas/validation remain intact. |
| `src/components/dashboard/ErpPageContent.tsx` | Composes the page navigator and makes synthetic/shared-reference separation explicit. No service/auth/route-handler change. |
| `src/config/erp.ts` | Four bilingual presentation title/summary refinements only. |
| `src/styles/erp.css` | Scoped preview/directory/modal/responsive/readability polish; reused BLACK X variables/classes. |
| `tests/erp-ui-permissions.test.ts` | **New, 26 tests:** exact mappings, all groups/pages, aliases/normalization/selection states, fixture safety and every leaf's AR/EN context links. |
| `tests/erp-permission-workspace.test.ts` | **New, 19 tests:** actual DOM interaction, cancellation, focus/keyboard, group matching/partial states, summaries, directory/details/filter/sort/paging and mounted-only simulations. |
| `tests/erp-screen-specs.test.ts` | Updates only the former empty user/role-layout assumptions to assert the explicitly authorized synthetic directory. Other layouts still assert disconnected/disabled behavior. |
| `tests/erp-screen-ui.test.ts` | Updates user-layout and matrix expectations for the new frontend-only controls; keeps no-business-operation/Portal defaults/regressions. |
| `tests/erp-ui.test.ts` | Allows the explicitly labeled selection-preview trigger, still no operational grant buttons in matrix rows. |
| `docs/ERP_VERIFICATION_REPORT.md` | Appends this current phase report and latest-status pointer. |

Reuse: the route catalogue, existing matrix and `ErpScreenPreview` composition, BLACK X dialog/fieldset/button/badge/table/filter patterns, logical CSS, `pick`/locale types, existing canonical links and frontend test harnesses. The new modal uses the existing native-dialog design language without modifying the shared `ConfirmDialog`/`InfoDialog`, shell guard, auth context or security controls.

### 14.7 Tests actually run and remaining acceptance limits

| Check | Final actual result |
|---|---|
| `npm test` | **878 passed / 27 files** on the final application/test code. |
| `npx vitest run tests/erp*.test.ts` | **447 passed / 11 files**, subset of the full suite. |
| New frontend catalogue/fixture/navigation suite | **26 passed**, included above. Confirms exactly 165 bounded definitions, all original module/page mappings, disabled requirements, no implicit descendant selection and valid edge/context links for every AR/EN leaf. |
| New permission/directory DOM suite | **19 passed**, included above. Arabic/English modal names/directions, label/ID search, empty results, individual/group/global matching selection/clear, partial states, expand/collapse, unavailable checks, review/confirmation/cancel, Escape, Tab wrapping, focus and scroll restoration, user/role details, filters/sort/paging and no-network/storage/print fixture changes. |
| Existing route/render/semantic regressions | Passed within ERP/full suites. All retained IDs, source/kind/canonical-link invariants, server guard composition, AR/EN route graph and Portal default slots retained. Existing server-route tests were run unchanged, not rewritten or bypassed. |
| `npm run test:contract` | **38 passed / 3 files**, subset of the full suite. Existing fake/dummy adapters only; no new backend test/service/adapter was implemented. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, max warnings 0. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed compilation, validation, generation (131 whole-app static entries, not ERP feature count), tracing. Final build has no warning text. Initial CSS flex-alignment compatibility warning was corrected in scoped frontend CSS. |
| `git diff --check` | Passed. |
| Protected-file start/end comparison | **89 existing protected files unchanged**; no backend/auth/API/env/dependency/server-route write in this phase. |
| Native browser / authenticated responsive and accessibility acceptance | **Not performed / not verified.** jsdom uses a native-dialog opening/closing polyfill; explicit key/focus handlers and DOM states are tested, not the browser's native modal inertness, Space activation, physical focus ring, touch scrolling, screen-reader output or device layout. |
| Real identity/provisioning/authorization/durable workflow/provider operations | **Not implemented or tested by this phase.** Frontend definitions, simulated status/roles and a green build never establish those capabilities. |

No false persistence or API-success claim was introduced. No financial/commercial record save, backup/restore, account creation, session revocation, real grant, posting or supplier liability is performed. The frontend enhancement is delivered on the existing feature branch; Production, secrets, backend/security controls, database/deployment configuration and PR status remain untouched. Nothing was pushed or merged.


## 15. Comprehensive frontend coverage and quality pass — 2026-10-26

### 15.1 Scope, baseline and evidence boundary

Implemented on `arena/54de42da-blackx-construction-finishing`, in the existing dirty working tree. The new-task baseline was freshly run: **878 tests / 27 files passed**. The preceding delivery is §14; its counts and descriptions remain historical, not this pass's final results. Inspected the registry, all leaf/profile placements, screen renderer, identity/permission components, dictionary/styles, existing register/domain/expansion boards, route/render/semantic tests and prior verification report before extending the existing presentation patterns.

Evidence categories remain separate:

- **Repository-supported / source-observed:** the existing 15-module/143-leaf registry, source/canonical relationships, fixture models, shared boards, local tools, guards and previous permission-selection behavior. Recording descriptions came from the user and were **not independently viewed**. No claim to reproduce 21/337 legacy screens.
- **BLACK X expert adaptations:** all 33 added route profiles, the balance-sheet structure and budget comparison interpretation, the six-node illustrative chart explorer, local journal/cost arithmetic, synthetic user forms and report/closing review sections. These are not verified legacy screen replicas, ledger rules, tax policy, security policy or backend contracts.
- **Backend-dependent / unavailable:** authorized accounts and periods, real identity/activity/grants, operational registers, stock, settlements, reconciliation, accounting/report totals, document persistence, communication/provider delivery, immutable histories and dangerous administrative actions. Empty bodies mean **no connected source**, not zero balances, no activity or empty company registers.

**This is a substantial frontend completion/quality pass, not a certificate that every operational frontend or backend feature is complete.** Every deferred route now has a purpose-specific disconnected structure, but many are still empty layouts rather than end-to-end document editors. Native authenticated browser, mobile/device and screen-reader acceptance remain unverified.

### 15.2 Implemented work and preserved behavior

| Family | Actual frontend delivery in this pass |
|---|---|
| Users / administration / role assignments | Added inline, cancellable synthetic-user form with name/login/email/status/optional initial role. Names 2–80 characters; unique `preview.` login namespace and unique `@example.invalid` email, case-insensitive. First invalid input receives focus; Cancel restores the trigger and discards the draft. Creation adds only a temporary directory row and brings it into the directory's search results. Existing edit form now validates login/email too; added explicit cancel of unconfirmed edits, suspended simulation/filter and status-label search. Last activity is explicitly **unavailable**, with no timestamps or invented sign-ins. Closing details returns focus to the directory search if edits/filters removed the original row. |
| Roles / permissions | Preserved the existing picker, scoped matching-only bulk selection, partial states, review/confirm/Cancel/Escape/focus handling and 165-definition catalogue. Added a deduplicated module/UI-definition summary from **confirmed** synthetic roles. Unconfirmed role choices do not affect it. Module-view definitions never imply descendant page or record/security grants. Existing roles remain synthetic, not backend role codes. |
| Chart of accounts | Added six clearly labeled synthetic parent/child nodes with native disclosures, code/name search, type/status filters, retained matching ancestors, selected detail (code/parent/type/level/status) and clear/close controls. No balances or company account codes; the connected chart table remains honestly unavailable. Existing opening-balance/cost-center layouts are preserved. |
| Journal / financial years | Added blank-input local journal lines, add/remove (20-line UI cap), described synthetic account labels, debit/credit validation, displayed-input totals, signed difference and balanced/unbalanced feedback. Minimum two lines; exactly one positive side per line; opposite blank side means zero **only in this exercise**. No posting, authorized account resolution or fiscal validation. Added five read-only unknown closing prerequisites to financial-year/period-closing views; no fabricated periods, open counts, closing/reopening results or audit. |
| Financial reports | Added a distinct financial-position/balance-sheet layout and retained trial balance as the default. Distinct sections for balance sheet, income statement, trial balance, account statement, account-grouped ledger, tax and budget comparison. Budget columns are approved budget/actual/variance, not a mislabeled ledger balance. All values/mappings remain unknown, with no company totals, tax rates or print/export operation. The existing financial-report shared route reuses exactly these views. |
| Treasury / cheques | Added bank reconciliation with bank account, source document and discrepancy columns; distinct structures for all eight cheque routes (custody register, incoming customer, outgoing supplier, details/evidence, maturity, event history, exceptions and exposure report). Existing separate cash/bank incoming/outgoing layouts are preserved. No reuse of cash-payment fixtures as cheque/reconciliation data; no implied clearing or bank balance. |
| Purchasing / suppliers | Existing directories/fixture details, purchasing boards and source relationships retained. Added local line exercises for purchase invoice/order/receipt/return layouts. Receipt expected/received quantities show signed discrepancy from displayed inputs; return arithmetic requires a synthetic original reference and internal reason. Quantity/unit/price/discount and optional synthetic project/phase allocation are explicit. No saved order/invoice/receipt/return, original-document verification, supplier liability, attachment, inventory or payment claim. |
| Sales / customers / construction | Preserved existing inquiry, inspection, BOQ/revision/decision, contract/change/stage and customer/complaint/communication previews and shared links. Added BOQ/quotation arithmetic on `sales/boq`, separate from its fixture table. Internal exercise notes are explicitly never sent or customer-visible. No new customer/contact/contract provisioning, automatic revision approval or outbound communications. |
| Inventory | All 11 routes now have distinct item/location/custodian, receipt, on-hand/reserved/availability, project issue, inter-warehouse transfer, return, physical-count discrepancy, provenance/history and report structures. No quantities, costs or warehouse availability are fabricated. The item draft checks required local code/name/unit fields but never saves a catalogue or stock record. |
| Projects / operations / quality | Added execution/milestone report and operations report structures; all four previously missing quality profiles (readiness, checklist, material acceptance evidence, findings/report) now distinguish project/phase, severity, inspection evidence, measurement and resolution. Existing project/quality fixture boards and canonical links remain unchanged. No measured progress or quality acceptance is invented. |
| Reports across modules | Added purchasing/allocation, supplier-document coverage (explicitly not payables), inventory allocation, treasury position, operations, stock, cheque, project and quality report structures with their own columns/parameters. Shared sections are reused honestly; bodies remain unavailable, not fabricated totals or fake exports. Available date/text checks validate parameters locally; unavailable entity/project lookups stay disabled and explained. |
| Admin / settings / communications / data | Added consent-aware local template draft structure, security-event review with no incident source, and import/export history with no invented jobs. Existing company/branch, settings, printing, notification, audit, backup, navigation and diagnostics structures/tools retained. Backup/restore, account/session operations, provider transport and security-event creation remain unavailable. Local JSON checks/metadata downloads do not fabricate operation-history rows. |
| Shared usability | Reused existing header/navigation/filter/empty/table/detail/draft patterns, BLACK X tokens and canonical links. Added logical-direction workbench/report/hierarchy CSS, wrapping/min-width rules, fieldset grouping, explicit text statuses, labels, focus/error feedback, narrow-screen stacking and minimum action heights. AR/EN render/DOM behavior is tested; physical layout/contrast/touch/screen-reader acceptance is not inferred. |

**Arithmetic contract, preview only:** quantity supports three decimal places, price two, discount 0–100 with two; `quantity × price × (1 − discount / 100)` rounds half-up per line to two places, then rounded lines are summed. Latin, Arabic and Persian decimal digits/Arabic decimal marks are supported; grouping separators, negatives, exponent notation and excess precision are rejected. Integer-scaled `bigint` math avoids binary-floating-point rounding and silent overflow. Each input has at most nine whole digits. Journal amount precision is two places. Amounts are illustrative units, **not a configured currency**, company balances, valuation or tax calculation. Invalid/blank required inputs produce no totals. No synthetic financial values are prefilled.

### 15.3 Coverage counts and exact retained route classification

- **15 hubs / 143 original leaf IDs**, unchanged; all localized directory/hub/leaf links remain covered by the existing route graph checks.
- **76 existing routes host 109 layout placements / 93 unique view IDs** (was 43 / 74 / 59). Added 33 profiles plus one balance-sheet view reused at two existing routes, not 34 new routes.
- **All 59 deferred leaves now have purpose-specific profiles**, up from 26. They deliberately remain backend-unavailable, not operational editors.
- Registry kinds remain **59 deferred, 34 shared, 22 existing preview, 15 fixture, 8 readiness, 3 tool, 1 source-link, 1 instructions**. Kind/guard/source/canonical semantics are unchanged. Three shared identity hosts have local synthetic workspaces in addition to their separate canonical reference links; the other shared entries are not duplicate source boards.
- **No known unprofiled generic deferred fallback remains.** This does not mean every route has new custom components: existing correct boards, registers, tools and explicit entry/read-only pages were retained instead of rebuilt.

Per-leaf presentation classification below is derived from the inspected registry and rendered composition, not a claim of a visual browser audit. `D` = dedicated disconnected layout, backend unavailable; `I` = synthetic identity workspace + separate shared reference; `S` = explicit shared entry (any local layout remains separate); `P` = existing source preview; `F` = fixture register; `R` = read-only readiness/configuration; `T` = existing local tool; `L` = explicit source link; `N` = read-only instructions. Layout IDs document actual frontend view placements, not services. Source IDs are retained exactly.

#### `permissions` — 6 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `permissions/overview` | S | `permissions` → `permissions/matrix` | Existing presentation retained |
| `permissions/roles` | I | `permissions` → `permissions/matrix` | `roles` |
| `permissions/matrix` | T | `permissions` | Existing presentation retained |
| `permissions/assignments` | I | `permissions` → `permissions/matrix` | `users` |
| `permissions/denied` | S | `permissions` → `permissions/matrix` | Existing presentation retained |
| `permissions/history` | D | No connected source | `audit` |

#### `accounting` — 13 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `accounting/overview` | D | No connected source | `financial-years` |
| `accounting/transactions` | D | No connected source | `daily-journals`, `unposted-journals`, `unbalanced-journals` |
| `accounting/accounts` | D | No connected source | `chart-of-accounts`, `opening-balances`, `cost-centers` |
| `accounting/customer-balances` | P | `link:finance` | Existing presentation retained |
| `accounting/supplier-balances` | S | `link:purchases` → `purchasing/purchases` | Existing presentation retained |
| `accounting/project-summaries` | S | `link:finance` → `accounting/customer-balances` | Existing presentation retained |
| `accounting/invoices` | F | `data:invoices` | Existing presentation retained |
| `accounting/certificates` | F | `data:certificates` | Existing presentation retained |
| `accounting/payments` | F | `data:payments` | Existing presentation retained |
| `accounting/receipts` | F | `data:receipts` | Existing presentation retained |
| `accounting/expenses` | F | `data:expenses` | Existing presentation retained |
| `accounting/reports` | D | No connected source | `trial-balance`, `account-statement`, `general-ledger`, `journal-report`, `income-statement`, `general-budget`, `tax-reports`, `cost-center-summary`, `cost-center-detail`, `balance-sheet` |
| `accounting/corrections` | D | No connected source | `period-closing`, `closing-history` |

#### `treasury` — 8 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `treasury/overview` | D | No connected source | `treasuries` |
| `treasury/cash-register` | F | `data:cash` | Existing presentation retained |
| `treasury/bank-accounts` | D | No connected source | `bank-accounts` |
| `treasury/receipts` | S | `data:receipts` → `accounting/receipts` | `cash-receipts`, `bank-receipts` |
| `treasury/disbursements` | S | `data:expenses` → `accounting/expenses` | `cash-disbursements`, `bank-disbursements` |
| `treasury/history` | S | `data:payments` → `accounting/payments` | `voucher-history`, `transfers`, `currency-revaluation` |
| `treasury/reconciliation` | D | No connected source | `bank-reconciliation` |
| `treasury/reports` | D | No connected source | `financial-position` |

#### `cheques` — 8 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `cheques/register` | D | No connected source | `cheque-register` |
| `cheques/incoming` | D | No connected source | `incoming-cheques` |
| `cheques/outgoing` | D | No connected source | `outgoing-cheques` |
| `cheques/details` | D | No connected source | `cheque-details` |
| `cheques/maturity` | D | No connected source | `cheque-maturity` |
| `cheques/history` | D | No connected source | `cheque-history` |
| `cheques/exceptions` | D | No connected source | `cheque-exceptions` |
| `cheques/reports` | D | No connected source | `cheque-exposure` |

#### `sales` — 11 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `sales/overview` | D | No connected source | `sales-orders` |
| `sales/leads` | P | `link:messages` | Existing presentation retained |
| `sales/requests` | P | `link:requests` | Existing presentation retained |
| `sales/inspections` | P | `link:inspections` | Existing presentation retained |
| `sales/quotations` | P | `link:quotations` | Existing presentation retained |
| `sales/boq` | F | `data:boq` | Existing presentation retained; local BOQ arithmetic |
| `sales/revisions` | S | `link:quotations` → `sales/quotations` | `quotation-revisions` |
| `sales/decisions` | S | `link:quotations` → `sales/quotations` | `customer-decisions` |
| `sales/contracts` | P | `link:contracts` | Existing presentation retained |
| `sales/change-orders` | F | `data:changes` | Existing presentation retained |
| `sales/reports` | D | No connected source | `sales-stages` |

#### `purchasing` — 11 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `purchasing/overview` | D | No connected source | `purchasing-overview` |
| `purchasing/suppliers` | F | `data:suppliers` | `supplier-details` |
| `purchasing/supplier-history` | S | `data:suppliers` → `purchasing/suppliers` | Existing presentation retained |
| `purchasing/purchases` | P | `link:purchases` | Existing presentation retained |
| `purchasing/lines` | F | `data:purchase-lines` | Existing presentation retained |
| `purchasing/invoices` | D | No connected source | `purchase-invoices`, `purchase-orders`, `purchase-receipts` |
| `purchasing/payments` | D | No connected source | `supplier-payments` |
| `purchasing/payables` | S | `link:purchases` → `purchasing/purchases` | Existing presentation retained |
| `purchasing/returns` | D | No connected source | `purchase-returns` |
| `purchasing/allocations` | F | `data:purchase-allocations` | Existing presentation retained |
| `purchasing/reports` | D | No connected source | `purchase-reports` |

#### `inventory` — 11 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `inventory/overview` | D | No connected source | `stock-overview` |
| `inventory/items` | D | No connected source | `item-catalogue` |
| `inventory/warehouses` | D | No connected source | `warehouse-directory` |
| `inventory/receipts` | D | No connected source | `stock-receipts` |
| `inventory/balances` | D | No connected source | `stock-balances` |
| `inventory/issues` | D | No connected source | `stock-issues` |
| `inventory/transfers` | D | No connected source | `stock-transfers` |
| `inventory/returns` | D | No connected source | `stock-returns` |
| `inventory/adjustments` | D | No connected source | `stock-adjustments` |
| `inventory/history` | D | No connected source | `stock-history` |
| `inventory/reports` | D | No connected source | `stock-report` |

#### `projects` — 16 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `projects/portfolio` | P | `link:projects` | Existing presentation retained |
| `projects/workspaces` | F | `data:projects` | Existing presentation retained |
| `projects/phases` | F | `data:phases` | Existing presentation retained |
| `projects/milestones` | P | `link:milestones` | Existing presentation retained |
| `projects/schedule` | S | `link:milestones` → `projects/milestones` | Existing presentation retained |
| `projects/assignments` | P | `link:engineers` | Existing presentation retained |
| `projects/diary` | P | `link:diary` | Existing presentation retained |
| `projects/progress` | P | `link:progress` | Existing presentation retained |
| `projects/issues` | P | `link:issues` | Existing presentation retained |
| `projects/quality` | P | `link:quality` | Existing presentation retained |
| `projects/weekly-reports` | P | `link:reports` | Existing presentation retained |
| `projects/documents` | P | `link:documents` | Existing presentation retained |
| `projects/handover` | P | `link:handover` | Existing presentation retained |
| `projects/warranty` | P | `link:warranty` | Existing presentation retained |
| `projects/history` | F | `data:project-history` | Existing presentation retained |
| `projects/reports` | D | No connected source | `project-execution-report` |

#### `reporting` — 12 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `reporting/overview` | L | `link:overview` | Existing presentation retained |
| `reporting/projects` | S | `link:reports` → `projects/weekly-reports` | Existing presentation retained |
| `reporting/commercial` | D | No connected source | `commercial-pipeline` |
| `reporting/purchasing` | D | No connected source | `purchase-allocation-report` |
| `reporting/suppliers` | D | No connected source | `supplier-document-report` |
| `reporting/inventory` | D | No connected source | `inventory-allocation-report` |
| `reporting/treasury` | D | No connected source | `treasury-position-report` |
| `reporting/financial` | D | No connected source | `trial-balance`, `account-statement`, `general-ledger`, `journal-report`, `income-statement`, `general-budget`, `tax-reports`, `cost-center-summary`, `cost-center-detail`, `balance-sheet` |
| `reporting/customers` | D | No connected source | `customer-report` |
| `reporting/operations` | D | No connected source | `operations-queue-report` |
| `reporting/audit` | S | `link:audit` → `administration/audit` | Existing presentation retained |
| `reporting/exports` | S | `export` → `data/export` | Existing presentation retained |

#### `settings` — 8 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `settings/general` | R | `settings` | `branches`, `general-settings`, `print-settings` |
| `settings/localization` | R | `settings` | Existing presentation retained |
| `settings/modules` | R | `settings` | `navigation`, `quotas-addons` |
| `settings/notifications` | R | `settings` | `notification-settings` |
| `settings/documents` | R | `settings` | Existing presentation retained |
| `settings/operations` | R | `settings` | Existing presentation retained |
| `settings/health` | R | `diagnostics` | Existing presentation retained |
| `settings/history` | D | No connected source | `audit` |

#### `quality` — 7 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `quality/overview` | D | No connected source | `quality-readiness` |
| `quality/inspections` | S | `link:quality` → `projects/quality` | Existing presentation retained |
| `quality/findings` | S | `link:issues` → `projects/issues` | Existing presentation retained |
| `quality/corrective-actions` | S | `link:issues` → `projects/issues` | Existing presentation retained |
| `quality/checklists` | D | No connected source | `inspection-checklists` |
| `quality/materials` | D | No connected source | `material-inspections` |
| `quality/reports` | D | No connected source | `quality-compliance-report` |

#### `crm` — 11 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `crm/customers` | P | `link:customers` | Existing presentation retained |
| `crm/profiles` | F | `data:customers` | Existing presentation retained |
| `crm/contacts` | D | No connected source | `customer-search` |
| `crm/requests` | S | `link:requests` → `sales/requests` | Existing presentation retained |
| `crm/inspections` | S | `link:inspections` → `sales/inspections` | Existing presentation retained |
| `crm/commercial` | S | `link:quotations` → `sales/quotations` | Existing presentation retained |
| `crm/projects` | S | `data:projects` → `projects/workspaces` | Existing presentation retained |
| `crm/communications` | S | `link:messages` → `sales/leads` | Existing presentation retained |
| `crm/complaints` | P | `link:complaints` | Existing presentation retained |
| `crm/follow-up` | D | No connected source | `response-metrics` |
| `crm/reports` | D | No connected source | `customer-status` |

#### `communications` — 7 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `communications/overview` | P | `link:notifications` | Existing presentation retained |
| `communications/history` | S | `link:notifications` → `communications/overview` | Existing presentation retained |
| `communications/delivery` | D | No connected source | `channels` |
| `communications/templates` | D | No connected source | `message-template-structure` |
| `communications/preferences` | D | No connected source | `communication-preferences` |
| `communications/pending` | D | No connected source | `distribution` |
| `communications/follow-up` | S | `link:messages` → `sales/leads` | `response-metrics` |

#### `administration` — 8 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `administration/overview` | I | `diagnostics` → `settings/health` | `users`, `roles` |
| `administration/session` | S | `diagnostics` → `settings/health` | `access-information` |
| `administration/operations` | S | `diagnostics` → `settings/health` | Existing presentation retained |
| `administration/security` | D | No connected source | `security-event-review` |
| `administration/audit` | P | `link:audit` | `audit` |
| `administration/health` | S | `diagnostics` → `settings/health` | Existing presentation retained |
| `administration/maintenance` | R | `settings` | `backups` |
| `administration/activity` | S | `link:audit` → `administration/audit` | `audit` |

#### `data` — 6 retained leaves

| Route | Class | Retained source / canonical entry | Local layout or exercise |
|---|---|---|---|
| `data/import` | S | `import` → `data/validation` | Existing presentation retained |
| `data/formats` | N | `import` | Existing presentation retained |
| `data/validation` | T | `import` | Existing presentation retained |
| `data/results` | S | `import` → `data/validation` | Existing presentation retained |
| `data/export` | T | `export` | Existing presentation retained |
| `data/history` | D | No connected source | `data-operation-history` |

Presentation totals: **D: 59**, **I: 3**, **S: 31**, **P: 22**, **F: 15**, **R: 8**, **T: 3**, **L: 1**, **N: 1**. These presentation classes do not change the registry kinds.

### 15.4 Files and regression protection

New frontend files: `src/config/erp-screen-completion.ts`, `ErpAccountingPreview.tsx`, `ErpReportTemplate.tsx`, `ErpLocalWorkbenches.tsx`, `ErpPreviewUserForm.tsx`, `src/lib/erp-local-calculations.ts`, `src/lib/erp-preview-users.ts`. Extended existing `erp-screen-specs.ts`, `ErpIdentityWorkspace`, `ErpScreenPreview`, `ErpPageContent`, synthetic user status type and scoped `erp.css`. No existing board or permission-picker architecture was replaced.

New tests: `tests/erp-completion.test.ts` (**33**) and `tests/erp-completion-ui.test.ts` (**20**). Expanded metadata/render enumeration adds **68** cases from the new placements/profiles. Net increase **121** tests: 878 → 999. Tests cover all deferred-route mappings, distinct budget/balance-sheet scope, exact decimal/Arabic input/rejection/rounding and journal validation, synthetic namespace/uniqueness, add/edit/cancel/focus, suspended search/filter, confirmed-role summaries, unavailable activity, remount reset, line totals/add/remove/cap/focus, receipt discrepancies, return prerequisites, layout-switch draft reset, hierarchy ancestor retention/detail/empty filters, AR/EN statement/budget/closing scope and new route date checks. New DOM cases assert no fetch, browser storage writes or printing and no mutation of synthetic seed arrays.

`tests/erp-screen-specs.test.ts` keeps the independent 15/143 fixture and all evidence/column/action/unavailable assertions, with new exact profile/placement/view counts. `tests/erp-semantics.test.ts` now parses actual DOM to remove **only** the labeled preview subtree before asserting the deferred/shared business body still contains no duplicate operational table/form/buttons. Its old non-greedy section regex broke on legitimate nested report/workbench sections; fixing that parser preserves and strengthens the boundary assertion rather than removing the test. No test or security check was deleted/disabled.

### 15.5 Fresh final verification and acceptance limits

| Check | Actual final result |
|---|---|
| Fresh pre-change `npm test` | **878 passed / 27 files**. |
| Final `npm test` | **999 passed / 29 files**, rerun after the final focus/copy improvements. |
| Final `npx vitest run tests/erp*.test.ts` | **568 passed / 13 files**, subset of the full suite. |
| Final `npm run test:contract` | **38 passed / 3 files**, unchanged fake/dummy-adapter contract tests, subset of the full suite; not real integration acceptance. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, zero warnings allowed. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed compilation, type/lint validation, generation and tracing; **131 whole-application static entries**, not 131 ERP routes. No warning text in the final log. |
| Existing all-route/link/source/guard/AR/EN/Portal regressions | Passed within the final full and ERP suites. Existing server-route tests and handlers were not changed. |
| `git diff --check` | Passed. |
| Protected-file comparison with this task's starting snapshot | **132 / 132 existing files byte-for-byte unchanged**: backend/server/API/app routes/types/scripts/workflows/auth/session/env/dependencies and lockfiles. Pre-existing dirty changes are preserved, not attributed to this pass. |
| Authenticated browser / device / native modal / screen-reader acceptance | **Not performed / unverified**. Neither `chromium` nor `google-chrome` executable was available; no authenticated browser session was known. jsdom tests are DOM/behavior checks, not visual/mobile/native acceptance. No production login/testing or authentication bypass was attempted. |
| Real persistence/accounting/stock/payments/provider/admin integration | **Unavailable and not tested**; not enabled by a green build or local arithmetic. |

### 15.6 Specific remaining scope — not silently claimed complete

1. Many of the 59 deferred routes are now dedicated disconnected column/parameter/draft/evidence structures, **not full operational document editors**. Cheque custody/clearing, warehouse transactions/counts, bank matching, quality acceptance and operational histories have no authorized source or executable workflow. Blank layouts remain honest until those exist.
2. Reports now distinguish financial statements/ledger/tax/budget and module-specific columns/scope, but have **no populated business results, computed company totals, pagination over real report rows, official print layouts or CSV/Excel report exports**. Non-financial reports reuse common unavailable-source sections; they are not bespoke end-to-end report engines.
3. The chart explorer has six illustrative nodes, not a supplied company chart; journal accounts are synthetic free text. Real account hierarchy validation, fiscal calendars/open counts, account mappings, financial rules, taxes, approvals and posting/closing/reopening are absent. No actual period status is fabricated.
4. Users/roles/permissions are mounted-only simulations. No real provisioning, passwords, invitations, session state, last-activity data, effective grants, account activation or authorization enforcement. New contact identifiers are deliberately restricted to synthetic namespaces. Edits do not survive route remount/refresh or synchronize across viewers. Existing company/branch and settings forms remain disconnected drafts/read-only requirements, not saved configuration.
5. Existing customer/supplier/construction boards and fixture detail/history views were preserved, not converted into live creation/editing workflows for every entity. New cost/receipt/return exercises do not resolve real projects, suppliers, original documents or revisions; no attachment, stock, balance, liability, contract approval, communication consent or provider delivery is established.
6. Responsive logical CSS, labels/focus and AR/EN behavior are implemented/tested in source/DOM, but actual desktop/tablet/mobile layout, contrast, native dialog inertness/default keys, touch scrolling and assistive technology still require browser acceptance. No visual acceptance claim is made from static renders or a production build.

**Safety / delivery status:** frontend-only changes, same branch and unchanged PR status. No backend service/domain logic, database/schema/migration/connection, auth/session/authorization enforcement, API/endpoint/server-action contract, environment/secret, dependency/lockfile, deployment or release change in this pass. No production data/configuration/testing, real business/account action, push, merge or publication. Existing blocked durable-adapter/identity gates remain blocked; this frontend work does not bypass them.


## 16. Final frontend acceptance and scoped closure — 2026-10-26

### 16.1 Acceptance decision and scope

**Decision: closure is recommended for the documented frontend-only preview implementation and automated verification scope.** The catalogue is intact, available checks pass, the reproducible frontend defect found in this pass is fixed, and no known unresolved critical frontend defect remains from this source/DOM/automated review. This is **not** full operational ERP completeness, authenticated visual acceptance or production/release approval. Browser/device/assistive-technology acceptance remains an explicit **open, unverified acceptance item**; visual-only defects cannot be ruled out by this audit.

Verified the existing branch `arena/54de42da-blackx-construction-finishing`, dirty working tree, tracked diff plus untracked ERP implementation files, latest report §15, route/specification registry, renderer/source boundaries, identity/permission interactions, arithmetic and unavailable-action behavior. The tracked diff includes pre-existing environment/dependency/server/auth-related work; none of that was reset, edited or attributed to this pass. No project restart, replacement architecture, new route, dependency, integration or operational fixture was introduced.

The starting claims were treated as reported, not proof: a **fresh baseline `npm test` actually passed 999 tests / 29 files**, followed by final checks after the focused fix. Starting snapshots captured hashes of **279 existing workspace files**, including **132 protected files**, without printing any contents or secret material.

### 16.2 Material defect reproduced and fixed

**Account-inspection keyboard focus:** when a selected illustrative account was hidden by a filter, closing its details removed the focused close button and left focus on the page body. An assertion added to the existing hierarchy behavior case reproduced the failure before the fix (19 passing, 1 failing in the 20-case DOM suite).

`ErpAccountingPreview.tsx` now returns focus to the selected account button when it is visible. If that node is filtered out or inside a collapsed native disclosure, focus returns to the account-search input instead. The existing case now verifies all three paths (visible node, filtered node, collapsed ancestor). The targeted DOM suite and final full suite pass. No account/chart data, accounting logic or permission predicate was changed.

The existing receipt-calculation case was also strengthened to verify shortfall, exact match, excess, zero expected quantity and invalid negative expected quantity. Signed differences are displayed from user inputs only; invalid inputs clear the calculated result and show an alert, not stale totals. No stock movement or acceptance/approval is implied. **No new test cases/files were added just to grow the count: the total remains 999.**

Only three files changed in this acceptance pass:

- `src/components/dashboard/ErpAccountingPreview.tsx` — focus restoration.
- `tests/erp-completion-ui.test.ts` — stronger existing focus/receipt assertions.
- `docs/ERP_VERIFICATION_REPORT.md` — latest pointer and this appended acceptance record; historical section bodies retained.

### 16.3 All-route classification and presentation review

An independent read of the current registry was compared to every row in §15.3 and the retained route-ID fixture: **all 143 classifications match**, all 15 hubs remain, and all 34 shared destinations resolve to non-shared canonical pages with the same source. The existing AR/EN route, render and semantic regression suites also pass on the final code, including links, exact sources, bounded layout deep links, previous/next navigation, guard composition and Portal/public presentation regressions. These are static/component checks, not authenticated browser navigation.

| Inventory / classification | Verified current count and meaning |
|---|---|
| Module hubs / leaf IDs | **15 / 143**, exact retained ID sequence, no inflation or deletion. |
| Existing routes with screen profiles | **76**, hosting **109 placements / 93 unique view IDs**. View IDs are not new route IDs or service capabilities. |
| Deferred leaves | **59 / 59** have purpose-specific disconnected profiles; no unprofiled generic deferred fallback remains. Their business bodies remain unavailable rather than showing duplicate operational tables/forms or invented records. |
| Registry kinds | **59 deferred, 34 shared, 22 preview, 15 fixture, 8 readiness, 3 tool, 1 source-link, 1 instructions**, unchanged. |
| Presentation classes in §15.3 | **D 59, I 3, S 31, P 22, F 15, R 8, T 3, L 1, N 1**; all 143 rows match the implementation. |
| Shared vs duplicated screens | Three shared identity hosts include a separately labeled local simulation plus canonical reference. Other shared entries link to the canonical workspace instead of duplicating its source board. Local disconnected layouts remain explicitly separate from canonical fixture registers. |
| Route-specific context and truthful controls | Titles, module/section context, scope summaries, typed columns and unavailable dependencies are present in AR/EN. Parameter checks/reset and synthetic filters/forms operate locally; unavailable source lookups/actions remain disabled or explain their limitation. Existing useful boards, registers and local tools were preserved. |

“Purpose-specific” does not mean a complete document editor: the 59 deferred operational routes are deliberately still disconnected. §15.6's detailed remaining scope remains valid. No route was relabeled operational simply to meet closure.

### 16.4 Interaction, calculations and unavailable-operation acceptance

| Area | Evidence and verified boundary |
|---|---|
| User add/edit preview | Existing DOM/pure tests pass for bounded names, synthetic `preview.` and `@example.invalid` identifiers, case-insensitive uniqueness, edit exclusion, error focus, cancellation/trigger focus, status/search/filter, suspended simulation, local row creation and remount reset. No account, password, invitation, real status/session or last-activity event is created. Activity remains unavailable. |
| Roles / permission selection | Existing role/detail/assignment tests and grouped picker tests pass: selected-role context, individual/matching-only bulk selection/clear, partial state, exact counts, unavailable definitions, search/hidden selections, review/confirm/Cancel/Escape/Tab/focus handling. Catalogue remains **165 UI definitions**, **164 selectable / 1 unavailable**, not backend grants. Confirmed role summaries exclude unsaved choices; module selection never silently grants descendants. Native browser modal behavior is not established by the jsdom polyfill. |
| Journal preview | Empty/one-line, zero-sided, missing description/account, invalid/negative/excess-precision and double-sided inputs are rejected; balanced and unbalanced exact-cent inputs and signed differences pass. Opposite blank side is zero only for that local exercise. No real chart lookup, opening/company balance, fiscal validation or posting operation. |
| BOQ / purchase arithmetic | Existing tests pass for empty/invalid input, zero quantity rejection, valid zero price/full discount, decimal/Arabic/Persian digits, precision/maximum values and per-line half-up rounding. A separate one-off **120-combination rational-arithmetic cross-check** against Python `Fraction` matched actual frontend outputs for fractional/half-cent and maximum inputs, zero price and 0–100% discounts. This is an audit exercise, not 120 additional test cases or operational transactions. |
| Receipt/return quantities | Negative, equal and positive received-minus-expected discrepancies, zero expected quantity and invalid-negative input are checked. A discrepancy is arithmetic, not permission to receive/approve stock. Returns require a synthetic reference/reason but never verify/reverse an original document, inventory or liability. |
| Financial reports / operational registers | Purpose-specific columns/statement sections and explicit unavailable-source bodies remain. No fixture is substituted for an authorized ledger, company balance, cheque register, reconciliation, stock balance or security event. Existing fixture boards/registers keep illustrative labels; new arithmetic labels inputs/results synthetic and excludes tax, currency configuration and business-report totals. Unknown data is never rendered as an inferred zero balance. |
| Export / print | Actual enabled download is **navigation metadata only**, explicitly not business records/reports. JSON checking is validation only, not import. Official report/CSV/Excel export, document downloading and printing remain unavailable/explained; no fake export/report result is generated. |
| Backup / restore / approval / posting / inventory | Disabled/explanatory controls and unknown prerequisites remain; no successful execution, backup timestamp, approval, journal posting, year/period close, reconciliation or stock operation is claimed. |
| Payments / communications | Existing payment controls describe local simulation, not durable settlement, and state that other registers do not receive it. No real payment/provider confirmation, liability creation, notification/email/SMS/WhatsApp transmission or consent enforcement is claimed. |
| Localization / accessibility | Existing final AR/EN render and behavioral checks pass for labels, directions, route graph, error feedback, picker state and logical navigation. New focus fallback is DOM-tested. CSS uses logical sizing/spacing and narrow-screen rules. Browser layout/contrast, native inertness/default keys, touch and screen-reader acceptance remain unverified. |

The new workbench/identity DOM regression cases continue asserting no fetch, browser storage writes or printing and no mutation of seed arrays. The existing unavailable-business-action label suite passes in both languages. These tests are bounded behavioral evidence, not a general security certification or real integration test.

### 16.5 Actual final command results

All final checks below were executed after the focus fix and strengthened assertions. Documentation was appended afterward; `git diff --check` and protected/scope comparison were checked again after documentation.

| Command / check | Actual result |
|---|---|
| Fresh acceptance baseline `npm test` | **999 passed / 29 files**. |
| Final `npm test` | **999 passed / 29 files**. |
| Final `npx vitest run tests/erp*.test.ts` | **568 passed / 13 files**, subset of full suite. |
| Final `npm run test:contract` | **38 passed / 3 files**, unchanged fake/dummy-adapter contracts, subset of full suite; no real backend integration acceptance. |
| `npm run typecheck` | **Passed**. |
| `npm run lint` | **Passed**, max warnings 0. |
| `npm run format:check` | **Passed**. |
| `npm run build` | **Passed** compilation/validation/generation/tracing; **131 whole-application static entries**, not ERP route count. No warning/error text in the final build log. |
| `git diff --check` | **Passed**, including the final documentation update. |
| All-route classification comparison | **143 / 143** match §15.3 and the independent retained-ID fixture; **34 / 34** canonical shared links valid; **59 / 59** deferred profiles present. |
| Independent arithmetic cross-check | **120 / 120** combinations matched rational half-up results. |
| Protected-file byte comparison | **132 / 132 unchanged** against this acceptance pass's start; existing server/app route/API/auth/session/env/dependency/lockfile/types/scripts/workflow files preserved. |
| Acceptance-pass file scope | Only the two frontend/test files above plus this report changed; no additional files introduced. |

### 16.6 Browser status, closure criteria and remaining items

**Browser visual acceptance: NOT PERFORMED / UNVERIFIED.** PATH checks found no `chromium`, `chromium-browser`, `google-chrome` or `firefox`. A bounded check of standard executable/cache locations also found no usable browser. No authenticated browser session was known. No new dependency/browser installation, auth bypass, invented credentials, environment modification, production login/testing or deployment was attempted. Representative desktop/narrow-screen visual acceptance therefore was not available here; jsdom/static renders/build must not be cited as having performed it.

| Closure criterion | Outcome |
|---|---|
| Catalogue intact | **Verified**: 15 hubs / 143 retained leaf IDs. |
| No known critical frontend defect unresolved | **Met within source/automated audit scope**: discovered focus defect fixed; no other known unresolved critical defect found. Visual-only defects cannot be excluded without a browser. |
| Available automated checks pass | **Verified**, actual final results above. |
| Preview/unavailable behavior accurately disclosed | **Verified in source, bilingual render/behavior tests and all-route classification review**. No operational completion claim introduced. |
| Documentation matches implementation | **Verified**: all 143 §15.3 classifications match; this section records the focused fix and actual reruns without rewriting historical outcomes. |
| Browser acceptance honestly reported | **Met as a disclosure criterion**, **not visually accepted**: desktop/narrow-screen/native/assistive acceptance remains open and unverified. |

**Remaining frontend defects:** no known unresolved critical frontend defect was identified by the available checks after the fix. This is not a guarantee that there are no visual/device/assistive defects: those checks could not run. The precise remaining acceptance gap is authenticated desktop/narrow-screen visual and native/accessibility verification, not a failed automated command.

**Still preview-only:** local users/roles/UI permissions, the illustrative chart, journal and BOQ/purchase/receipt/return exercises, existing fixture registers/boards and session-only simulations. They are not durable or shared business state. **Still unavailable:** real identity/activity/grants, document saving, authorized financial/report data, official report export/printing, stock movement/valuation, bank/cheque clearing/reconciliation, payment settlement, approval/posting/closing, communications/provider operations, audit/security history, backup/restore and saved organization/configuration workflows. These documented limitations are not silently counted as implemented operational features.

**Closure wording:** “The documented frontend-only preview implementation and automated acceptance phase is complete, with browser visual/native/accessibility acceptance explicitly unverified.” Do **not** shorten this to “all ERP features complete,” “browser accepted,” “production ready” or “real integrations verified.” If the desired closure includes visual/device sign-off, that portion remains open pending a suitable browser and authorized session.

**Scope safety:** same feature branch, existing PR status unchanged. No backend services/domain logic, database/schema/migration/connection, auth/authorization enforcement/session infrastructure, API/endpoint/server action, environment/secret, dependency/lockfile, production/configuration, deployment or release edit. No push, merge, publication or production testing. All pre-existing dirty changes were preserved.


## 17. Preview deployment preparation — 2026-10-26

The user explicitly authorized committing/pushing the completed frontend to the existing feature branch and requesting a **Preview-only** deployment. No merge, Production deployment/alias, access-protection relaxation, backend/auth/API/environment/DNS/project-settings change is authorized by this preparation.

### 17.1 Exact commit scope and remote history

The local branch initially pointed to `0490b45dbed366b985d0a7aa657656013a3d9085`, while the existing remote feature branch pointed to `b61dddc5f74960132483da6c465d7129a2855522`. The latter's three existing commits were preserved by a fast-forward of the current branch/index, not a merge, force push or replacement of their contents. Every existing workspace file was byte-compared before/after; all were preserved. Backend/auth/CSRF/environment/script files already matched the remote baseline and are **not changes in this frontend commit**.

The staged scope is the ERP presentation/routes/components/styles/dictionaries and frontend-only request-focus integration; their regression tests and retained route-ID fixture; this verification report; frontend test configuration; and the separately approved existing `jsdom` devDependency/lockfile entries. All pre-existing locked dependency entries and runtime dependency declarations are unchanged. The user approved this narrow test-support exception after the clean-install requirement was explained. No runtime dependency upgrade was introduced.

Excluded and preserved locally: environment files, backend/security modifications, scripts, generated output, unrelated root audit reports, other audit/delivery documents and `tests/workflow/commercial-gate.test.ts`. The six frontend route components reuse the existing authorization guard; they do not change authentication or authorization enforcement. The staged diff was checked for whitespace, allowed paths and credential/private-key patterns; no environment file or generated artifact is included.

### 17.2 Clean staged-snapshot verification (not the broader workspace count)

The exact staged source tree was exported without ignored files or local environment configuration into a scratch directory, installed with `npm ci --ignore-scripts`, and checked independently. This is more precise than attributing the broader working tree's 999 tests to the deployment commit.

| Clean staged-snapshot command | Actual result |
|---|---|
| `npm ci --ignore-scripts` | Passed using the staged lockfile. |
| `npm test` | **943 passed / 28 files**. The broader workspace's **999 / 29** remains historical acceptance evidence; the difference is the **56-case unrelated, uncommitted commercial-gate suite**, deliberately excluded from this frontend-only commit. No frontend test was removed or weakened. |
| `npm run typecheck` | Passed. |
| `npm run lint` | Passed, max warnings 0. |
| `npm run format:check` | Passed. |
| `npm run build` | Passed, 131 whole-application static entries. The clean locked install emitted Edge Runtime compatibility warnings from the existing `jose` authentication dependency (`CompressionStream` / `DecompressionStream`); not a frontend compile failure and not silently described as warning-free. No auth or dependency workaround was applied. |
| Staged scope / `git diff --cached --check` | Passed; frontend, tests, report and explicitly approved test support only. |

The clean install's advisory audit reported **5 existing dependency findings (2 moderate, 1 high, 2 critical)**, including development-tool findings. No automatic audit fix/major upgrade was run; these findings are disclosed for separate dependency/security review, not fixed by a frontend deployment. A passing build does not certify absence of dependency vulnerabilities or verify live login.

### 17.3 Deployment/access safeguards

Vercel project `blackx-construction-finishing` is connected to this repository with Production branch `main`; the inspected Production deployment remains at `0490b45dbed366b985d0a7aa657656013a3d9085`. The prior feature Preview at `b61dddc5f74960132483da6c465d7129a2855522` does not contain the ERP completion. Deployment must explicitly target **Preview and the new frontend commit**, not redeploy that stale source or promote to Production.

Existing Preview access is protected by Vercel Authentication. The ordinary Preview request redirects to Vercel's protected-deployment sign-in, not an application acceptance result. No global protection change or bypass credential is created, read or exposed. The supported first access path is to sign in to Vercel with an account authorized for the owning project/team; after passing platform protection, the application's existing login remains separate. Any access grant beyond existing membership requires the owner, not invented application credentials or weakened controls.

This section records preparation and clean-source validation **before** the deployment request. It is not itself a claim of deployment success: the exact commit/URL/readiness must be confirmed by the Vercel result and reported separately. Preview-only/unavailable ERP limitations in §§15–16 remain intact; native/authenticated visual acceptance is still unverified.
