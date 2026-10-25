import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { buildLocaleSwitchHref, getDirection, isLocale, switchLocalePath } from "@/lib/i18n";
import {
  validateAdminRequestAssignment,
  validateContactForm,
  validatePortalIssueForm,
  validatePortalProfileForm,
  validateRequestForm,
  hasAdminRequestDraftChanges,
  hasErrors,
  requiresAdminRequestConfirmation,
} from "@/lib/validation";
import { clampPercent, formatMoney, formatPercent, initials } from "@/lib/format";
import { dictionaries } from "@/content/dictionary";
import { appDictionaries } from "@/content/app-dictionary";
import { services } from "@/content/services";
import { articles, publishedArticles, publishedProjects } from "@/content/publications";
import {
  getPreviewPortalProject,
  previewIssues,
  previewMilestones,
  previewPortalClient,
  previewPortalCurrentProject,
  previewPortalProjects,
  previewProjects,
  previewRequests,
  previewSnapshotDate,
} from "@/content/preview-data";
import { countPreviewModuleStatus, previewModuleTables } from "@/content/preview-modules";
import {
  dashboardModules,
  dashboardNavGroups,
  getDashboardNavGroupKey,
  portalNav,
} from "@/config/navigation";
import {
  getAgingBuckets,
  getAllDuesWithBalance,
  getAssignmentHistoryForEngineer,
  getAssignmentHistoryForProject,
  getContractDetail,
  getCustomerDocuments,
  getCustomerFinance,
  getDocumentCatalog,
  getHandoverDetail,
  getHandoverForProject,
  getPortalDocuments,
  getPortalHandover,
  getPortalWarranty,
  getProjectDocuments,
  getWarrantyDetail,
  groupDocumentCatalog,
  getChangeOrdersForContract,
  getEngineerAssignments,
  getExpansionOverview,
  getInspectionDetail,
  getNotificationDelivery,
  getPortalComplaints,
  getPortalFinance,
  getProjectPhases,
  getProjectStatusHistory,
  getProjectWorkItems,
  getQuotationDetail,
  getSupplierBalance,
  internalReplies,
  workItemProgress,
} from "@/lib/preview-expansion";
import {
  previewAssignmentHistory,
  previewHandoverDetails,
  previewWarrantyDetails,
  previewComplaints,
  previewNotificationDeliveries,
  previewPayments,
  previewPhases,
  previewWorkItems,
} from "@/content/preview-expansion";
import {
  getAllowedPreviewRequestStatusTransitions,
  getLinkedPreviewRecords,
  getPreviewAdminOverview,
  getPreviewAuditItems,
  getPreviewContractItems,
  getPreviewCustomerContext,
  getPreviewCustomerItems,
  getPreviewDiaryItems,
  getPreviewDocumentItems,
  getPreviewFindingItems,
  getPreviewHandoverItems,
  getPreviewInspectionItems,
  getPreviewMilestoneItems,
  getPreviewNotificationItems,
  getPreviewProgressRecordItems,
  getPreviewProjectOperations,
  getPreviewProjectPortfolioItems,
  getPreviewQuotationItems,
  getPreviewReportItems,
  getPreviewRequestContext,
  getPreviewRequestWorkflow,
  getPreviewRowReference,
  getPreviewWarrantyItems,
  isPreviewMilestoneOverdue,
} from "@/lib/admin-preview";
import { submitInspectionRequestPreview } from "@/lib/preview-adapter";
import {
  getLoginRateLimitKey,
  hashOwnerPassword,
  isAdminAuthConfigured,
  isLoginRateLimited,
  verifyOwnerCredentials,
  verifyOwnerPassword,
} from "@/lib/admin-auth";
import { isReviewProtectedPath, sanitizeReviewCallbackUrl } from "@/lib/review-auth-shared";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";
import { getSiteUrl, localizedAlternates } from "@/lib/site-url";

const root = path.join(__dirname, "..");

describe("i18n helpers", () => {
  it("validates locales and directions", () => {
    expect(isLocale("ar")).toBe(true);
    expect(isLocale("en")).toBe(true);
    expect(isLocale("fr")).toBe(false);
    expect(getDirection("ar")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });

  it("switches locale while preserving the path", () => {
    expect(switchLocalePath("/ar/services/kitchens", "en")).toBe("/en/services/kitchens");
    expect(switchLocalePath("/en/dashboard/requests", "ar")).toBe("/ar/dashboard/requests");
    expect(switchLocalePath("/ar", "en")).toBe("/en");
  });

  it("preserves query and hash when switching locale", () => {
    expect(buildLocaleSwitchHref("/ar/request", "en", "?service=kitchens#request-form")).toBe(
      "/en/request?service=kitchens#request-form",
    );
    expect(buildLocaleSwitchHref("/en/contact", "ar", "#details")).toBe("/ar/contact#details");
    expect(buildLocaleSwitchHref("/en/contact", "ar", "details")).toBe("/ar/contact");
  });
});

describe("owner review authentication", () => {
  const envKeys = [
    "AUTH_SECRET",
    "NEXTAUTH_SECRET",
    "ADMIN_OWNER_EMAIL",
    "ADMIN_OWNER_PASSWORD_HASH",
  ] as const;

  async function withOwnerEnv<T>(run: () => Promise<T>): Promise<T> {
    const previous = new Map(envKeys.map((key) => [key, process.env[key]]));
    process.env.AUTH_SECRET = "unit-test-secret-that-is-longer-than-thirty-two-characters";
    delete process.env.NEXTAUTH_SECRET;
    process.env.ADMIN_OWNER_EMAIL = "Owner@Example.com ";
    process.env.ADMIN_OWNER_PASSWORD_HASH = await hashOwnerPassword(
      "CorrectHorseBatteryStaple-42!",
    );
    try {
      return await run();
    } finally {
      for (const key of envKeys) {
        const value = previous.get(key);
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
  }

  it("hashes and verifies owner passwords with scrypt", async () => {
    const hash = await hashOwnerPassword("A-strong-review-password-123!");
    expect(hash.startsWith("scrypt$16384$8$1$")).toBe(true);
    await expect(verifyOwnerPassword("A-strong-review-password-123!", hash)).resolves.toBe(true);
    await expect(verifyOwnerPassword("wrong-password", hash)).resolves.toBe(false);
    await expect(verifyOwnerPassword("A-strong-review-password-123!", "invalid")).resolves.toBe(
      false,
    );
  });

  it("authenticates only the environment-configured owner review account", async () => {
    await withOwnerEnv(async () => {
      const headers = new Headers({ "x-forwarded-for": "198.51.100.10" });
      expect(isAdminAuthConfigured()).toBe(true);
      await expect(
        verifyOwnerCredentials({ email: "owner@example.com", password: "wrong", headers }),
      ).resolves.toBeNull();
      await expect(
        verifyOwnerCredentials({
          email: "owner@example.com",
          password: "CorrectHorseBatteryStaple-42!",
          headers,
        }),
      ).resolves.toMatchObject({ email: "owner@example.com", role: "owner_review" });
    });
  });

  it("rate-limits repeated failed sign-in attempts for the same client and email", async () => {
    await withOwnerEnv(async () => {
      const headers = new Headers({ "x-forwarded-for": "198.51.100.20" });
      for (let attempt = 0; attempt < 5; attempt += 1) {
        await verifyOwnerCredentials({ email: "owner@example.com", password: "wrong", headers });
      }
      const key = getLoginRateLimitKey("owner@example.com", headers);
      expect(isLoginRateLimited(key)).toBe(true);
      await expect(
        verifyOwnerCredentials({
          email: "owner@example.com",
          password: "CorrectHorseBatteryStaple-42!",
          headers,
        }),
      ).resolves.toBeNull();
    });
  });

  it("keeps review callbacks internal to protected localized areas", () => {
    expect(isReviewProtectedPath("/ar/dashboard/requests")).toBe(true);
    expect(isReviewProtectedPath("/en/portal/projects")).toBe(true);
    expect(isReviewProtectedPath("/ar/about")).toBe(false);
    expect(sanitizeReviewCallbackUrl("/ar/dashboard/projects?x=1", "ar")).toBe(
      "/ar/dashboard/projects?x=1",
    );
    expect(sanitizeReviewCallbackUrl("https://example.com/ar/dashboard", "ar")).toBe(
      "/ar/dashboard",
    );
    expect(sanitizeReviewCallbackUrl("//example.com/ar/dashboard", "ar")).toBe("/ar/dashboard");
    expect(sanitizeReviewCallbackUrl("/en/dashboard", "ar")).toBe("/ar/dashboard");
  });

  it("enforces review access in server layouts and admin pages, not only middleware", () => {
    const auth = fs.readFileSync(path.join(root, "src/auth.ts"), "utf8");
    const middleware = fs.readFileSync(path.join(root, "src/middleware.ts"), "utf8");
    const dashboardLayout = fs.readFileSync(
      path.join(root, "src/app/[locale]/dashboard/layout.tsx"),
      "utf8",
    );
    const portalLayout = fs.readFileSync(
      path.join(root, "src/app/[locale]/portal/layout.tsx"),
      "utf8",
    );
    const adminPages = [
      "src/app/[locale]/dashboard/page.tsx",
      "src/app/[locale]/dashboard/requests/page.tsx",
      "src/app/[locale]/dashboard/[module]/page.tsx",
      "src/app/[locale]/dashboard/projects/[id]/page.tsx",
      "src/app/[locale]/dashboard/customers/[id]/page.tsx",
    ].map((file) => fs.readFileSync(path.join(root, file), "utf8"));
    const envExample = fs.readFileSync(path.join(root, ".env.example"), "utf8");

    expect(auth).toContain("Credentials({");
    expect(auth).toContain("requireReviewAccess");
    expect(middleware).toContain("isReviewProtectedPath");
    expect(dashboardLayout).toContain('export const dynamic = "force-dynamic"');
    expect(dashboardLayout).toContain("await requireReviewAccess(locale)");
    expect(portalLayout).toContain("await requireReviewAccess(locale)");
    for (const page of adminPages) expect(page).toContain("await requireReviewAccess(locale)");
    expect(envExample).toContain("AUTH_SECRET=");
    expect(envExample).toContain("ADMIN_OWNER_EMAIL=");
    expect(envExample).toContain("ADMIN_OWNER_PASSWORD_HASH=");
    expect(auth).not.toContain("CorrectHorseBatteryStaple");
  });
});

describe("form validation", () => {
  const valid = {
    fullName: "عميل تجريبي",
    phone: "0100 123 4567",
    email: "",
    service: "kitchens",
    city: "القاهرة",
    area: "120",
    unitType: "",
    description: "أريد تجديد المطبخ بالكامل مع تغيير الوحدات والسطح",
    consent: true,
  };

  it("accepts a complete request", () => {
    expect(hasErrors(validateRequestForm(valid))).toBe(false);
  });

  it("flags missing and invalid request fields", () => {
    const errors = validateRequestForm({ ...valid, phone: "abc", service: "", consent: false });
    expect(errors.phone).toBe("phoneInvalid");
    expect(errors.service).toBe("required");
    expect(errors.consent).toBe("consentRequired");
  });

  it("flags short description and bad email", () => {
    const errors = validateRequestForm({ ...valid, description: "قصير", email: "nope" });
    expect(errors.description).toBe("descriptionShort");
    expect(errors.email).toBe("emailInvalid");
  });

  it("validates contact form", () => {
    expect(
      hasErrors(
        validateContactForm({
          fullName: "زائر",
          phone: "01005551234",
          subject: "استفسار",
          message: "رسالة تجريبية طويلة بما يكفي",
          consent: true,
        }),
      ),
    ).toBe(false);
  });

  it("normalizes Arabic-Indic digits and rejects punctuation-only phones", () => {
    expect(hasErrors(validateRequestForm({ ...valid, phone: "٠١٠٠ ١٢٣ ٤٥٦٧" }))).toBe(false);
    expect(validateRequestForm({ ...valid, phone: "--------" }).phone).toBe("phoneInvalid");
  });

  it("rejects non-finite areas and accepts Arabic-Indic numeric input", () => {
    expect(validateRequestForm({ ...valid, area: "Infinity" }).area).toBe("areaInvalid");
    expect(hasErrors(validateRequestForm({ ...valid, area: "١٢٠" }))).toBe(false);
  });

  it("uses the same minimum full-name rule for contact", () => {
    expect(
      validateContactForm({
        fullName: "ab",
        phone: "01005551234",
        subject: "استفسار",
        message: "رسالة تجريبية طويلة بما يكفي",
        consent: true,
      }).fullName,
    ).toBe("nameShort");
  });

  it("validates portal issue and profile forms by field", () => {
    expect(validatePortalIssueForm({ title: "ok", location: "", detail: "short" })).toEqual({
      title: "issueTitleShort",
      detail: "issueDetailsShort",
    });
    expect(validatePortalProfileForm({ name: "", phone: "abc", email: "not-an-email" })).toEqual({
      name: "required",
      phone: "phoneInvalid",
      email: "emailInvalid",
    });
    expect(
      hasErrors(
        validatePortalProfileForm({
          name: "Preview Client",
          phone: "0100 000 1006",
          email: "client06@example.com",
        }),
      ),
    ).toBe(false);
  });
});

describe("dictionaries parity", () => {
  function keysOf(obj: unknown, prefix = ""): string[] {
    if (typeof obj !== "object" || obj === null || Array.isArray(obj)) return [prefix];
    return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
      keysOf(v, prefix ? `${prefix}.${k}` : k),
    );
  }

  it("public dictionary has identical ar/en key trees", () => {
    expect(keysOf(dictionaries.en).sort()).toEqual(keysOf(dictionaries.ar).sort());
  });

  it("app dictionary has identical ar/en key trees", () => {
    expect(keysOf(appDictionaries.en).sort()).toEqual(keysOf(appDictionaries.ar).sort());
  });
});

describe("stylesheet wiring", () => {
  it("loads the public-site stylesheet from the locale root layout", () => {
    const layout = fs.readFileSync(path.join(root, "src/app/[locale]/layout.tsx"), "utf8");
    const siteCss = fs.readFileSync(path.join(root, "src/styles/site.css"), "utf8");

    expect(layout).toContain('import "@/styles/site.css";');
    expect(layout).toContain('import "@fontsource-variable/cairo";');
    expect(layout).toContain('import "@fontsource-variable/inter";');
    expect(layout).not.toContain("fonts.googleapis.com");
    for (const selector of [
      ".site-header",
      ".home-hero",
      ".home-hero-media",
      ".service-card",
      ".btn",
    ]) {
      expect(siteCss, selector).toContain(selector);
    }
  });

  it("keeps shared buttons restrained, defined, and keyboard-visible", () => {
    const tokens = fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8");
    const siteCss = fs.readFileSync(path.join(root, "src/styles/site.css"), "utf8");

    expect(tokens).toContain("--button-radius: 4px;");
    expect(siteCss).toContain("border-radius: var(--button-radius);");
    expect(siteCss).toContain(".btn:focus-visible");
    expect(siteCss).toContain(".btn-danger");
    expect(siteCss).not.toContain("box-shadow: 0 14px 32px");
    expect(siteCss).not.toContain("a:hover .arrow-icon");
  });

  it("keeps public navigation integrated and the half-width glass drawer inaccessible when closed", () => {
    const header = fs.readFileSync(path.join(root, "src/components/site/SiteHeader.tsx"), "utf8");
    const tokens = fs.readFileSync(path.join(root, "src/styles/tokens.css"), "utf8");
    const siteCss = fs.readFileSync(path.join(root, "src/styles/site.css"), "utf8");

    expect(tokens).toContain("--nav-blur: 10px;");
    expect(tokens).toContain("--nav-surface:");
    expect(tokens).toContain("--mobile-nav-bg: #252722;");
    expect(tokens).toContain("--mobile-nav-bg-end: #353a30;");
    expect(tokens).toContain("--mobile-nav-duration: 300ms;");
    expect(tokens).toContain("--public-drawer-bg:");
    expect(tokens).toContain("--public-drawer-blur: 18px;");
    expect(tokens).not.toContain("--nav-glass:");
    expect(tokens).not.toContain("--nav-radius:");
    expect(siteCss).toContain('.site-header[data-scrolled="true"]');
    expect(siteCss).toContain('.site-header[data-menu-open="true"]');
    expect(siteCss).toContain("backdrop-filter: blur(var(--nav-blur))");
    expect(siteCss).toContain(
      "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px)))",
    );
    expect(siteCss).toContain(".mobile-nav-scrim");
    expect(siteCss).toContain(".mobile-panel.open");
    expect(siteCss).toContain("width: clamp(220px, 55vw, 340px);");
    expect(siteCss).toContain("inset-inline-start: 0;");
    expect(siteCss).toContain('html[dir="rtl"] .mobile-panel');
    expect(siteCss).toContain('html[dir="ltr"] .mobile-panel');
    expect(siteCss).toContain('html[dir="rtl"] .mobile-panel.open');
    expect(siteCss).toContain('html[dir="ltr"] .mobile-panel.open');
    expect(siteCss).toContain("backdrop-filter: blur(var(--public-drawer-blur))");
    expect(siteCss).toContain("var(--mobile-nav-duration)");
    expect(siteCss).toContain(".mp-locale-switch");
    expect(siteCss).toContain('.site-header[data-menu-open="true"] .menu-btn');
    expect(siteCss).toContain("@media (prefers-reduced-motion: reduce)");
    expect(header).toContain("data-scrolled={scrolled}");
    expect(header).toContain("data-menu-open={open}");
    expect(header).toContain("aria-expanded={open}");
    expect(header).toContain('aria-controls="mobile-menu"');
    expect(header).toContain("inert={!open}");
    expect(header).toContain("body.style.overflow");
    expect(header).not.toContain(" hidden={!open}");
    expect(header).toContain('className="menu-icon"');
    expect(header).toContain('role="dialog"');
    expect(header).toContain('aria-modal="false"');
    expect(header).toContain('className="mobile-drawer-close"');
    expect(header).toContain("menuButtonRef.current?.focus({ preventScroll: true })");
  });

  it("uses the existing villa image once as the decorative homepage hero background", () => {
    const homePage = fs.readFileSync(path.join(root, "src/app/[locale]/(site)/page.tsx"), "utf8");
    const siteCss = fs.readFileSync(path.join(root, "src/styles/site.css"), "utf8");

    expect(homePage.match(/src="\/images\/hero-villa\.jpg"/g)).toHaveLength(1);
    expect(homePage).toContain('<div className="home-hero-media" aria-hidden="true">');
    expect(homePage).not.toContain('<figure className="hero-media">');
    expect(siteCss).toContain(".home-hero-media img");
    expect(siteCss).toContain("object-fit: cover;");
    expect(siteCss).toContain('html[dir="rtl"] .home-hero-media::after');
  });

  it("keeps the admin shell responsive with a logical drawer, premium compact header, and card tables", () => {
    const appShell = fs.readFileSync(path.join(root, "src/components/ui/AppShell.tsx"), "utf8");
    const globalsCss = fs.readFileSync(path.join(root, "src/styles/globals.css"), "utf8");
    const overviewPage = fs.readFileSync(
      path.join(root, "src/app/[locale]/dashboard/page.tsx"),
      "utf8",
    );
    const requestsBoard = fs.readFileSync(
      path.join(root, "src/components/dashboard/RequestsBoard.tsx"),
      "utf8",
    );
    const dataTable = fs.readFileSync(
      path.join(root, "src/components/dashboard/DataTable.tsx"),
      "utf8",
    );
    const portalProjects = fs.readFileSync(
      path.join(root, "src/app/[locale]/portal/projects/page.tsx"),
      "utf8",
    );

    expect(globalsCss).toContain("@media (max-width: 960px)");
    const sidebarTrack = "grid-template-columns: var(--admin-sidebar-width) minmax(0, 1fr);";
    expect(globalsCss.split(sidebarTrack)).toHaveLength(2);
    expect(globalsCss.indexOf(sidebarTrack)).toBeLessThan(
      globalsCss.indexOf("@media (max-width: 960px)"),
    );
    expect(globalsCss).toContain(".list-rows.priority-list");
    expect(globalsCss).toContain("grid-template-columns: 44px minmax(0, 1fr) auto;");
    expect(globalsCss).toContain("padding: 16px 14px calc(44px + env(safe-area-inset-bottom));");
    expect(globalsCss).toContain(".executive-dashboard > *");
    expect(globalsCss).toContain("html:has(.shell)");
    expect(globalsCss).toContain("scroll-padding-top: calc(80px + env(safe-area-inset-top));");
    expect(globalsCss).toContain("scroll-padding-top: calc(136px + env(safe-area-inset-top));");
    expect(globalsCss).toContain('grid-template-areas: "menu heading actions";');
    expect(globalsCss).toContain("@media (max-width: 374px)");
    expect(globalsCss).toContain('"actions actions";');
    expect(globalsCss).toContain(".shell-topbar .shell-context");
    expect(globalsCss).toContain(".shell-topbar .locale-switch a.current");
    expect(globalsCss).toContain("background: var(--color-sage-deep);");
    expect(globalsCss).toContain(".shell-signout-icon");
    expect(globalsCss).toContain("env(safe-area-inset-left)");
    expect(appShell).toContain("function LogoutIcon");
    expect(appShell).toContain("<LogoutIcon />");
    expect(globalsCss).toContain("width: min(84vw, 300px);");
    expect(globalsCss).toContain('html[dir="rtl"] .shell-sidebar');
    expect(globalsCss).toContain("height: 100dvh;");
    expect(globalsCss).toContain("overscroll-behavior: contain;");
    expect(globalsCss).toContain(".shell-topbar-actions");
    expect(globalsCss).toContain(".shell-topbar .locale-switch a");
    expect(globalsCss).toContain("min-height: 44px;");
    expect(globalsCss).toContain("grid-template-columns: repeat(2, minmax(0, 1fr));");
    expect(globalsCss).toContain("@media (max-width: 359px)");
    expect(globalsCss).not.toContain(
      "@media (max-width: 520px) {\n  .stat-grid {\n    grid-template-columns: 1fr;",
    );
    expect(globalsCss).toContain("table.data.data-card-table");
    expect(globalsCss).toContain("content: attr(data-label);");
    expect(appShell).toContain('if (event.key === "Escape")');
    expect(appShell).toContain('document.body.style.overflow = "hidden";');
    expect(appShell).toContain("onClick={() => closeDrawer(true)}");
    expect(appShell).toContain("onClick={() => setOpen(false)}");
    expect(appShell).toContain('className="shell-topbar-actions"');
    for (const source of [requestsBoard, dataTable]) {
      expect(source).toContain("data-card-table");
      expect(source).toContain("data-label=");
    }
    expect(overviewPage).toContain("RecordListItem");
    expect(overviewPage).not.toContain("data-card-table");
    expect(portalProjects).toContain("minmax(min(100%, 300px), 1fr)");
  });

  it("uses a shared premium record system with progressive details and a timeline activity log", () => {
    const recordUi = fs.readFileSync(
      path.join(root, "src/components/dashboard/RecordUI.tsx"),
      "utf8",
    );
    const domainBoards = fs.readFileSync(
      path.join(root, "src/components/dashboard/DomainBoards.tsx"),
      "utf8",
    );
    const requestsBoard = fs.readFileSync(
      path.join(root, "src/components/dashboard/RequestsBoard.tsx"),
      "utf8",
    );
    const globalsCss = fs.readFileSync(path.join(root, "src/styles/globals.css"), "utf8");

    expect(recordUi).toContain("export function RecordCard");
    expect(recordUi).toContain("export function RecordListItem");
    expect(recordUi).toContain("export function RecordMetaList");
    expect(recordUi).toContain('summaryVariant?: "summary" | "inline"');
    expect(recordUi).toContain("export function RecordDetailSection");
    expect(recordUi).toContain('<details className="record-details">');
    expect(domainBoards).toContain("function DomainRecordCard");
    expect(domainBoards).toContain('layout="list"');
    expect(domainBoards).toContain('className="activity-timeline"');
    expect(domainBoards).toContain('summaryVariant="inline"');
    expect(domainBoards).toContain("groupedByDate");
    expect(domainBoards).not.toContain("domain-fields");
    expect(requestsBoard).toContain('className="requests-mobile-list"');
    expect(requestsBoard).toContain("RecordDetailSection");
    expect(requestsBoard).toContain('className="form-section"');
    expect(globalsCss).toContain(".record-meta-summary");
    expect(globalsCss).toContain(".activity-record");
    expect(globalsCss).toContain(".activity-record .record-meta-inline");
    expect(globalsCss).toContain(".activity-record .record-relationships h4");
    expect(globalsCss).toContain('td[data-mobile-priority="secondary"]');
  });
});

describe("content integrity", () => {
  it("services have unique slugs and existing images", () => {
    const slugs = services.map((s) => s.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const service of services) {
      expect(fs.existsSync(path.join(root, "public", service.image)), service.image).toBe(true);
      for (const img of service.gallery) {
        expect(fs.existsSync(path.join(root, "public", img)), img).toBe(true);
      }
    }
  });

  it("publishes no invented projects", () => {
    expect(publishedProjects).toEqual([]);
  });

  it("keeps preview articles out of published content and the sitemap", () => {
    expect(articles.every((article) => article.preview)).toBe(true);
    expect(publishedArticles).toEqual([]);
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.some((url) => url.includes("/articles"))).toBe(false);
    expect(urls).toContain(`${getSiteUrl()}/ar/projects`);
  });

  it("renders only published articles on the public articles listing page", () => {
    const source = fs.readFileSync(
      path.join(root, "src/app/[locale]/(site)/articles/page.tsx"),
      "utf8",
    );
    expect(source).toContain("publishedArticles.length === 0");
    expect(source).toContain("publishedArticles.map((article)");
    expect(source).not.toContain("{articles.map((article)");
  });

  it("keeps unpublished articles out of the public article detail page", () => {
    const source = fs.readFileSync(
      path.join(root, "src/app/[locale]/(site)/articles/[slug]/page.tsx"),
      "utf8",
    );
    expect(source).toContain("!publishedArticles.includes(article)");
    expect(source).toContain("publishedArticles.map((a)");
    expect(source).not.toContain("if (!article) notFound();");
  });

  it("never publishes the placeholder example origin in the sitemap", () => {
    const urls = sitemap().map((entry) => entry.url);
    expect(urls.length).toBeGreaterThan(0);
    expect(urls.every((url) => !url.includes(".example"))).toBe(true);
    expect(urls.every((url) => url.startsWith(getSiteUrl()))).toBe(true);
  });

  it("respects NEXT_PUBLIC_SITE_URL and falls back to the live production domain", () => {
    const saved = process.env.NEXT_PUBLIC_SITE_URL;
    try {
      delete process.env.NEXT_PUBLIC_SITE_URL;
      expect(getSiteUrl()).toBe("https://blackx-construction-finishing.vercel.app");
      process.env.NEXT_PUBLIC_SITE_URL = "https://www.blackx-eg.com/";
      expect(getSiteUrl()).toBe("https://www.blackx-eg.com");
      process.env.NEXT_PUBLIC_SITE_URL = "not-a-url";
      expect(getSiteUrl()).toBe("https://blackx-construction-finishing.vercel.app");
    } finally {
      if (saved === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
      else process.env.NEXT_PUBLIC_SITE_URL = saved;
    }
  });

  it("builds canonical + hreflang alternates per locale with an ar x-default", () => {
    expect(localizedAlternates("ar")).toEqual({
      canonical: "/ar",
      languages: { ar: "/ar", en: "/en", "x-default": "/ar" },
    });
    expect(localizedAlternates("en", "services/kitchens")).toEqual({
      canonical: "/en/services/kitchens",
      languages: {
        ar: "/ar/services/kitchens",
        en: "/en/services/kitchens",
        "x-default": "/ar/services/kitchens",
      },
    });
  });

  it("cross-links sitemap entries to their other-locale twins", () => {
    const entries = sitemap();
    const kitchensAr = entries.find((e) => e.url === `${getSiteUrl()}/ar/services/kitchens`);
    expect(kitchensAr?.alternates?.languages).toMatchObject({
      ar: `${getSiteUrl()}/ar/services/kitchens`,
      en: `${getSiteUrl()}/en/services/kitchens`,
      "x-default": `${getSiteUrl()}/ar/services/kitchens`,
    });
    expect(
      entries.every((e) => Boolean(e.alternates?.languages?.ar && e.alternates?.languages?.en)),
    ).toBe(true);
  });

  it("advertises the sitemap in robots and keeps app surfaces disallowed", () => {
    const result = robots();
    expect(result.sitemap).toBe(`${getSiteUrl()}/sitemap.xml`);
    const rules = JSON.stringify(result.rules);
    expect(rules).toContain("/ar/dashboard");
    expect(rules).toContain("/en/portal");
  });

  it("wires metadataBase in the locale layout and alternates on every public page", () => {
    const layout = fs.readFileSync(path.join(root, "src/app/[locale]/layout.tsx"), "utf8");
    expect(layout).toContain("metadataBase");
    expect(layout).toContain("getSiteUrl()");
    const publicPages = [
      "src/app/[locale]/(site)/page.tsx",
      "src/app/[locale]/(site)/about/page.tsx",
      "src/app/[locale]/(site)/services/page.tsx",
      "src/app/[locale]/(site)/services/[slug]/page.tsx",
      "src/app/[locale]/(site)/projects/page.tsx",
      "src/app/[locale]/(site)/articles/page.tsx",
      "src/app/[locale]/(site)/faqs/page.tsx",
      "src/app/[locale]/(site)/contact/page.tsx",
      "src/app/[locale]/(site)/request/page.tsx",
    ];
    for (const file of publicPages) {
      const source = fs.readFileSync(path.join(root, file), "utf8");
      expect(source, file).toContain("alternates: localizedAlternates(locale");
    }
  });

  it("keeps the authentic logo asset in place", () => {
    expect(fs.existsSync(path.join(root, "public/brand/blackx-logo.jpg"))).toBe(true);
  });
});

describe("required routes exist", () => {
  const files = [
    "src/app/[locale]/(site)/page.tsx",
    "src/app/[locale]/(site)/about/page.tsx",
    "src/app/[locale]/(site)/services/page.tsx",
    "src/app/[locale]/(site)/services/[slug]/page.tsx",
    "src/app/[locale]/(site)/projects/page.tsx",
    "src/app/[locale]/(site)/projects/[slug]/page.tsx",
    "src/app/[locale]/(site)/request/page.tsx",
    "src/app/[locale]/(site)/articles/page.tsx",
    "src/app/[locale]/(site)/articles/[slug]/page.tsx",
    "src/app/[locale]/(site)/contact/page.tsx",
    "src/app/[locale]/(site)/faqs/page.tsx",
    "src/app/[locale]/login/page.tsx",
    "src/app/api/auth/[...nextauth]/route.ts",
    "src/app/[locale]/dashboard/page.tsx",
    "src/app/[locale]/dashboard/requests/page.tsx",
    "src/app/[locale]/dashboard/[module]/page.tsx",
    "src/app/[locale]/dashboard/projects/[id]/page.tsx",
    "src/app/[locale]/portal/page.tsx",
    "src/app/[locale]/portal/projects/page.tsx",
    "src/app/[locale]/portal/projects/[id]/page.tsx",
    "src/app/[locale]/portal/milestones/page.tsx",
    "src/app/[locale]/portal/reports/page.tsx",
    "src/app/[locale]/portal/documents/page.tsx",
    "src/app/[locale]/portal/quotations/page.tsx",
    "src/app/[locale]/portal/issues/page.tsx",
    "src/app/[locale]/portal/handover/page.tsx",
    "src/app/[locale]/portal/profile/page.tsx",
    "src/app/[locale]/portal/finance/page.tsx",
    "src/app/[locale]/portal/complaints/page.tsx",
    "src/app/[locale]/error.tsx",
    "src/app/[locale]/not-found.tsx",
    "src/app/[locale]/[...rest]/page.tsx",
    "src/app/robots.ts",
    "src/app/sitemap.ts",
  ];
  it.each(files)("has %s", (file) => {
    expect(fs.existsSync(path.join(root, file))).toBe(true);
  });

  it("keeps the locale root free of a streaming boundary that would soft-404 unknown routes", () => {
    expect(fs.existsSync(path.join(root, "src/app/[locale]/loading.tsx"))).toBe(false);
  });
});

describe("preview adapter honesty", () => {
  it("returns a real validation failure for invalid local preview input", async () => {
    const result = await submitInspectionRequestPreview({
      fullName: "x",
      phone: "0100",
      email: "",
      service: "kitchens",
      city: "y",
      area: "",
      unitType: "",
      description: "z",
      consent: true,
    });
    expect(result).toEqual({ ok: false, reason: "validation_failed", mode: "preview" });
  });

  it("labels successful local submissions as preview mode", async () => {
    const result = await submitInspectionRequestPreview({
      fullName: "Preview Visitor",
      phone: "0100 123 4567",
      email: "",
      service: "kitchens",
      city: "Cairo",
      area: "120",
      unitType: "",
      description: "A sufficiently detailed local preview request description.",
      consent: true,
    });
    expect(result.mode).toBe("preview");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.reference).toContain("PREVIEW");
  });
});

describe("preview data integrity", () => {
  it("scopes portal projects to the signed-in preview client", () => {
    expect(previewPortalProjects.map((project) => project.id)).toEqual(["PV-PR-201"]);
    expect(
      previewPortalProjects.every((project) => project.customerId === previewPortalClient.id),
    ).toBe(true);
    expect(previewPortalCurrentProject.id).toBe(previewPortalClient.projectId);
    expect(getPreviewPortalProject("PV-PR-202")).toBeUndefined();
  });

  it("derives preview module counts from the canonical rows", () => {
    expect(countPreviewModuleStatus("inspections", "inspection_scheduled")).toBe(2);
    expect(countPreviewModuleStatus("notifications", "new")).toBe(1);
  });
});

describe("admin preview operations", () => {
  it("places every dashboard module in exactly one operations group", () => {
    const groupedModules = dashboardNavGroups.flatMap((group) => group.modules);
    expect(groupedModules).toEqual(dashboardModules.map((dashboardModule) => dashboardModule.key));
    expect(new Set(groupedModules).size).toBe(groupedModules.length);
    expect(getDashboardNavGroupKey("quality")).toBe("qualityHandover");
    expect(getDashboardNavGroupKey("warranty")).toBe("qualityHandover");
  });

  it("derives customer and project tables from canonical preview records", () => {
    const customers = previewModuleTables.customers!;
    const expectedCustomerIds = [
      ...new Set(previewRequests.map((request) => request.customerId)),
    ].sort();
    expect(customers.rows.map((row) => row.id)).toEqual(expectedCustomerIds);
    expect(customers.rows.find((row) => row.id === "PV-CU-03")?.cells.projects).toEqual({
      kind: "plain",
      value: "1",
    });
    expect(customers.rows.find((row) => row.id === "PV-CU-03")?.cells.status).toEqual({
      kind: "status",
      value: "inspection_scheduled",
    });

    const projects = previewModuleTables.projects!;
    expect(projects.rows.map((row) => row.id)).toEqual(
      previewProjects.map((project) => project.id),
    );
    expect(projects.rows.find((row) => row.id === "PV-PR-201")?.links).toEqual({
      customerId: "PV-CU-06",
      projectId: "PV-PR-201",
      quotationId: "PV-QT-74",
      contractId: "PV-CT-12",
    });
  });

  it("keeps every explicit preview record link resolvable", () => {
    const customerIds = new Set([
      ...previewRequests.map((request) => request.customerId),
      ...previewProjects.map((project) => project.customerId),
    ]);
    const requestIds = new Set(previewRequests.map((request) => request.id));
    const projectIds = new Set(previewProjects.map((project) => project.id));
    const quotationIds = new Set(
      previewModuleTables.quotations!.rows.map((row) => getPreviewRowReference(row)),
    );
    const contractIds = new Set(
      previewModuleTables.contracts!.rows.map((row) => getPreviewRowReference(row)),
    );

    for (const table of Object.values(previewModuleTables)) {
      for (const row of table?.rows ?? []) {
        if (row.links?.customerId) expect(customerIds.has(row.links.customerId), row.id).toBe(true);
        if (row.links?.requestId) expect(requestIds.has(row.links.requestId), row.id).toBe(true);
        if (row.links?.projectId) expect(projectIds.has(row.links.projectId), row.id).toBe(true);
        if (row.links?.quotationId) {
          expect(quotationIds.has(row.links.quotationId), row.id).toBe(true);
        }
        if (row.links?.contractId) expect(contractIds.has(row.links.contractId), row.id).toBe(true);
      }
    }

    expect(previewMilestones.every((milestone) => projectIds.has(milestone.projectId))).toBe(true);
    expect(
      previewIssues.every(
        (issue) =>
          projectIds.has(issue.projectId) &&
          issue.correctiveAction.ar.length > 0 &&
          issue.correctiveAction.en.length > 0 &&
          issue.assignee.ar.length > 0 &&
          issue.assignee.en.length > 0,
      ),
    ).toBe(true);
  });

  it("derives overview metrics and the operational flow from preview records", () => {
    const overview = getPreviewAdminOverview();
    expect(overview.snapshotDate).toBe(previewSnapshotDate);
    expect(overview.metrics).toEqual({
      newRequests: 1,
      upcomingInspections: 2,
      quotationsAwaitingDecision: 1,
      pendingContracts: 1,
      activeProjects: 3,
      overdueMilestones: 0,
      unresolvedFindings: 5,
      pendingReports: 1,
    });
    expect(overview.upcomingInspectionRows.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-IN-41",
      "PV-IN-40",
    ]);
    expect(overview.operationalFlow.map((stage) => [stage.key, stage.count])).toEqual([
      ["requests", 8],
      ["inspections", 4],
      ["quotations", 4],
      ["contracts", 3],
      ["projectSetup", 4],
      ["execution", 4],
      ["qualityReporting", 3],
      ["handover", 2],
      ["warranty", 2],
    ]);
  });

  it("provides typed oversight logs without turning preview entries into live activity", () => {
    const notifications = getPreviewNotificationItems();
    expect(
      notifications.map((item) => [
        item.row.id,
        item.entityReference,
        item.status,
        item.requiresReview,
        item.recordedAsSent,
      ]),
    ).toEqual([
      ["n1", "PV-RQ-1001", "new", true, false],
      ["n2", "PV-PR-201", "sent", false, true],
      ["n3", "PV-SN-09", "sent", false, true],
    ]);
    expect(notifications[0]?.links).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "request", id: "PV-RQ-1001" })]),
    );

    const audit = getPreviewAuditItems();
    expect(audit.map((item) => [item.row.id, item.entityReference, item.date])).toEqual([
      ["a1", "PV-PR-201", "2026-10-21"],
      ["a2", "PV-RQ-1002", "2026-10-20"],
      ["a3", "PV-PR-201 · W42", "2026-10-19"],
      ["a4", "PV-IN-41", "2026-10-18"],
    ]);
    expect(audit.every((item) => item.status === "completed" && item.links.length === 2)).toBe(
      true,
    );
    expect(audit[1]?.actor).toMatchObject({ en: "Coordinator A" });
  });

  it("builds a record-level overview action queue from explicit preview signals", () => {
    const queue = getPreviewAdminOverview().actionQueue;
    expect(queue.map((item) => [item.kind, item.reference])).toEqual([
      ["projectBlocker", "PV-IS-32"],
      ["projectBlocker", "PV-SN-08"],
      ["requestReview", "PV-RQ-1001"],
      ["requestReview", "PV-RQ-1007"],
      ["requestReview", "PV-RQ-1006"],
      ["milestone", "PV-PR-202"],
      ["milestone", "PV-PR-203"],
      ["milestone", "PV-PR-201"],
      ["pendingReport", "PV-PR-203 · W42"],
      ["pendingHandover", "PV-HO-05"],
      ["quotationDecision", "PV-QT-77"],
      ["pendingContract", "PV-CO-03"],
      ["activeWarranty", "PV-WR-02"],
    ]);
    expect(queue.find((item) => item.reference === "PV-RQ-1001")).toMatchObject({
      dashboardSegment: "requests",
      requestNextAction: "firstContact",
    });
    expect(queue.find((item) => item.reference === "PV-RQ-1006")?.requestNextAction).toBe(
      "reviewApprovedContext",
    );
    expect(queue.find((item) => item.reference === "PV-IS-32")?.dashboardSegment).toBe(
      "projects/PV-PR-201#project-findings",
    );
    expect(queue.filter((item) => item.kind === "milestone")).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ milestoneState: "dueSoon", projectId: "PV-PR-203" }),
      ]),
    );
    expect(queue.some((item) => item.reference === "PV-RQ-1008")).toBe(false);
  });

  it("identifies overdue milestones against the preview snapshot date", () => {
    const row = previewModuleTables.milestones!.rows[0]!;
    expect(isPreviewMilestoneOverdue(row)).toBe(false);
    expect(
      isPreviewMilestoneOverdue({
        ...row,
        cells: { ...row.cells, due: { kind: "date", value: "2026-10-20" } },
      }),
    ).toBe(true);
    expect(
      isPreviewMilestoneOverdue({
        ...row,
        cells: {
          ...row.cells,
          due: { kind: "date", value: "2026-10-20" },
          status: { kind: "status", value: "completed" },
        },
      }),
    ).toBe(false);
  });

  it("aggregates only explicitly linked records into project workspaces", () => {
    const apartment = getPreviewProjectOperations("PV-PR-201")!;
    expect(apartment.unresolvedFindings).toBe(4);
    expect(apartment.pendingReports).toBe(0);
    expect(apartment.milestones).toHaveLength(6);
    expect(apartment.canonicalIssues.map((issue) => issue.id)).toEqual([
      "PV-IS-31",
      "PV-IS-32",
      "PV-IS-33",
    ]);
    expect(apartment.quotationRows.map((row) => getPreviewRowReference(row))).toEqual(["PV-QT-74"]);
    expect(apartment.contractRows.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-CT-12",
      "PV-CO-03",
    ]);

    const facade = getPreviewProjectOperations("PV-PR-203")!;
    expect(facade.unresolvedFindings).toBe(1);
    expect(facade.pendingReports).toBe(1);
    expect(facade.milestones).toHaveLength(0);
    expect(facade.milestoneRows).toHaveLength(1);
    expect(facade.handoverRows.map((row) => getPreviewRowReference(row))).toEqual(["PV-HO-05"]);
    expect(getPreviewProjectOperations("PV-PR-999")).toBeUndefined();
  });

  it("distinguishes direct request links from same-customer context", () => {
    const duplex = previewRequests.find((request) => request.id === "PV-RQ-1005")!;
    const duplexContext = getPreviewRequestContext(duplex);
    expect(duplexContext.inspections.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-IN-38",
    ]);
    expect(duplexContext.quotations.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-QT-77",
    ]);
    expect(duplexContext.customerProjects).toEqual([]);

    const restoration = previewRequests.find((request) => request.id === "PV-RQ-1006")!;
    const restorationContext = getPreviewRequestContext(restoration);
    expect(restorationContext.inspections).toEqual([]);
    expect(restorationContext.quotations).toEqual([]);
    expect(restorationContext.customerProjects.map((project) => project.id)).toEqual(["PV-PR-201"]);
  });

  it("resolves linked commercial records with their current preview statuses", () => {
    const contract = previewModuleTables.contracts!.rows.find((row) => row.id === "ct1")!;
    const linked = getLinkedPreviewRecords(contract.links);
    expect(linked.map((record) => [record.kind, record.id, record.status])).toEqual([
      ["customer", "PV-CU-06", "in_progress"],
      ["project", "PV-PR-201", "in_progress"],
      ["quotation", "PV-QT-74", "approved"],
      ["contract", "PV-CT-12", "signed"],
    ]);
  });

  it("requires an owner for inspection-stage request changes", () => {
    expect(
      validateAdminRequestAssignment({ status: "inspection_scheduled", assignee: "" }),
    ).toEqual({
      assignee: "assigneeRequired",
    });
    expect(
      validateAdminRequestAssignment({
        status: "inspection_done",
        assignee: "Inspection Engineer B",
      }),
    ).toEqual({});
    expect(validateAdminRequestAssignment({ status: "new", assignee: "" })).toEqual({});
  });

  it("detects unchanged request drafts and consequential statuses", () => {
    expect(
      hasAdminRequestDraftChanges({
        currentStatus: "new",
        currentAssignee: "",
        draftStatus: "new",
        draftAssignee: "",
      }),
    ).toBe(false);
    expect(
      hasAdminRequestDraftChanges({
        currentStatus: "new",
        currentAssignee: "",
        draftStatus: "new",
        draftAssignee: "Coordinator A",
      }),
    ).toBe(true);
    expect(requiresAdminRequestConfirmation("approved")).toBe(true);
    expect(requiresAdminRequestConfirmation("on_hold")).toBe(true);
    expect(requiresAdminRequestConfirmation("cancelled")).toBe(true);
    expect(requiresAdminRequestConfirmation("contacted")).toBe(false);
  });

  it("provides an explicit preview limitation for every generic dashboard module", () => {
    const tableModules = dashboardModules.filter(
      (dashboardModule) => dashboardModule.key !== "overview" && dashboardModule.key !== "requests",
    );
    for (const locale of ["ar", "en"] as const) {
      for (const dashboardModule of tableModules) {
        expect(
          appDictionaries[locale].dashboard.modulePreviewLimits[dashboardModule.key]?.length,
          `${locale}:${dashboardModule.key}`,
        ).toBeGreaterThan(20);
      }
    }
  });

  it("derives truthful request stages, evidence and next actions", () => {
    const request = (id: string) => previewRequests.find((item) => item.id === id)!;

    const fresh = getPreviewRequestWorkflow(request("PV-RQ-1001"));
    expect(fresh.stages.map((stage) => stage.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
    expect(fresh.nextAction).toBe("firstContact");
    expect(fresh.blockers).toContain("assigneeMissing");

    const duplex = getPreviewRequestWorkflow(request("PV-RQ-1005"));
    expect(duplex.stages.find((stage) => stage.key === "inspection")?.evidenceRefs).toEqual([
      "PV-IN-38",
    ]);
    expect(duplex.stages.find((stage) => stage.key === "decision")).toMatchObject({
      state: "current",
      evidenceRefs: ["PV-QT-77"],
      statusOnly: false,
    });
    expect(duplex.nextAction).toBe("awaitClientDecision");
    expect(duplex.blockers).toEqual([]);

    const approved = getPreviewRequestWorkflow(request("PV-RQ-1006"));
    expect(approved.stages.every((stage) => stage.state === "complete")).toBe(true);
    expect(approved.stages.find((stage) => stage.key === "inspection")?.statusOnly).toBe(true);
    expect(approved.stages.find((stage) => stage.key === "quotation")?.statusOnly).toBe(true);
    expect(approved.blockers).toEqual(
      expect.arrayContaining(["directInspectionMissing", "directQuotationMissing"]),
    );
    expect(approved.nextActionModule).toBe("contracts");

    const cancelled = getPreviewRequestWorkflow(request("PV-RQ-1008"));
    expect(cancelled.nextAction).toBe("noNextAction");
    expect(cancelled.stages.slice(1).every((stage) => stage.state === "terminal")).toBe(true);
  });

  it("limits request status edits to valid lifecycle transitions", () => {
    const request = (id: string) => previewRequests.find((item) => item.id === id)!;

    expect(getAllowedPreviewRequestStatusTransitions(request("PV-RQ-1001"))).toEqual([
      "new",
      "contacted",
      "on_hold",
      "cancelled",
    ]);
    expect(getAllowedPreviewRequestStatusTransitions(request("PV-RQ-1005"))).toEqual([
      "quotation_sent",
      "approved",
      "on_hold",
      "cancelled",
    ]);
    expect(getAllowedPreviewRequestStatusTransitions(request("PV-RQ-1006"))).toEqual(["approved"]);
    expect(getAllowedPreviewRequestStatusTransitions(request("PV-RQ-1007"))).toEqual([
      "on_hold",
      "contacted",
      "cancelled",
    ]);
    expect(getAllowedPreviewRequestStatusTransitions(request("PV-RQ-1008"))).toEqual(["cancelled"]);
  });

  it("provides typed domain queues without inventing unsupported finding fields", () => {
    const inspections = getPreviewInspectionItems();
    expect(inspections.map((item) => item.reference)).toEqual([
      "PV-IN-38",
      "PV-IN-39",
      "PV-IN-41",
      "PV-IN-40",
    ]);
    expect(inspections.filter((item) => item.isUpcoming)).toHaveLength(2);

    const quotations = getPreviewQuotationItems();
    expect(quotations.map((item) => [item.reference, item.kind])).toEqual([
      ["PV-QT-74", "quotation"],
      ["PV-QT-75", "boq"],
      ["PV-QT-76", "quotation"],
      ["PV-QT-77", "quotation"],
    ]);
    expect(quotations.find((item) => item.reference === "PV-QT-77")?.links).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "request", id: "PV-RQ-1005" })]),
    );

    const contracts = getPreviewContractItems();
    expect(contracts.map((item) => [item.reference, item.kind, item.status])).toEqual([
      ["PV-CO-03", "changeOrder", "pending"],
      ["PV-CT-11", "contract", "signed"],
      ["PV-CT-12", "contract", "signed"],
    ]);

    const findings = getPreviewFindingItems();
    expect(findings.filter((item) => item.blocker).map((item) => item.reference)).toEqual(
      expect.arrayContaining(["PV-IS-32", "PV-SN-08"]),
    );
    expect(
      findings.find((item) => item.reference === "PV-IS-32")?.canonicalIssue?.correctiveAction.en,
    ).toBe("Reset the cover level and test drainage");
    expect(findings.find((item) => item.reference === "PV-SN-08")?.canonicalIssue).toBeUndefined();

    const reports = getPreviewReportItems();
    expect(reports.filter((item) => item.pending)).toHaveLength(1);
    expect(reports[0]).toMatchObject({ pending: true, status: "pending" });
    expect(reports[0]?.links).toEqual(
      expect.arrayContaining([expect.objectContaining({ kind: "project", id: "PV-PR-203" })]),
    );
  });

  it("derives project blockers, next work, latest progress and handover state", () => {
    const apartment = getPreviewProjectOperations("PV-PR-201")!;
    expect(apartment.blockerRows.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-IS-32",
      "PV-SN-08",
    ]);
    expect(apartment.nextMilestone).toMatchObject({
      date: "2026-10-27",
      progress: 45,
      status: "current",
      source: "canonical",
    });
    expect(apartment.latestProgressRow?.id).toBe("pg1");
    expect(apartment.handoverState).toBe("not_scheduled");

    const facade = getPreviewProjectOperations("PV-PR-203")!;
    expect(facade.blockerRows).toEqual([]);
    expect(facade.nextMilestone).toMatchObject({
      title: { en: "Entrance & boundary" },
      date: "2026-10-26",
      progress: 80,
      status: "in_progress",
      source: "module",
    });
    expect(facade.latestProgressRow?.id).toBe("pg3");
    expect(facade.handoverState).toBe("pending");

    expect(getPreviewProjectOperations("PV-PR-204")?.handoverState).toBe("handed_over");
  });

  it("keeps customer request follow-up separate from same-customer project context", () => {
    const customers = getPreviewCustomerItems();
    expect(customers.map((item) => item.customerId)).toEqual([
      "PV-CU-01",
      "PV-CU-02",
      "PV-CU-03",
      "PV-CU-04",
      "PV-CU-05",
      "PV-CU-06",
      "PV-CU-07",
      "PV-CU-08",
    ]);

    const first = getPreviewCustomerContext("PV-CU-01");
    expect(first.latestRequest?.id).toBe("PV-RQ-1001");
    expect(first.latestWorkflow?.nextAction).toBe("firstContact");
    expect(first.latestWorkflow?.blockers).toContain("assigneeMissing");
    expect(first.projects).toEqual([]);

    const sixth = getPreviewCustomerContext("PV-CU-06");
    expect(sixth.latestRequest?.id).toBe("PV-RQ-1006");
    expect(sixth.latestWorkflow?.blockers).toEqual(
      expect.arrayContaining(["directInspectionMissing", "directQuotationMissing"]),
    );
    expect(sixth.projects.map((project) => project.id)).toEqual(["PV-PR-201"]);
    expect(sixth.quotationRows.map((row) => getPreviewRowReference(row))).toEqual(["PV-QT-74"]);
    expect(sixth.contractRows.map((row) => getPreviewRowReference(row))).toEqual([
      "PV-CT-12",
      "PV-CO-03",
    ]);
  });

  it("orders the project portfolio by recorded operational attention", () => {
    const portfolio = getPreviewProjectPortfolioItems();
    expect(portfolio.map((item) => item.project.id)).toEqual([
      "PV-PR-201",
      "PV-PR-203",
      "PV-PR-202",
      "PV-PR-204",
    ]);
    expect(portfolio[0]?.operations.blockerRows).toHaveLength(2);
    expect(portfolio[1]?.operations.pendingReports).toBe(1);
    expect(portfolio.at(-1)?.operations.handoverState).toBe("handed_over");
  });

  it("derives milestone schedule states and execution record ordering", () => {
    const milestones = getPreviewMilestoneItems();
    expect(milestones.map((item) => [item.row.id, item.scheduleState, item.daysUntilDue])).toEqual([
      ["ms3", "dueSoon", 4],
      ["ms4", "dueSoon", 5],
      ["ms1", "dueSoon", 6],
      ["ms2", "completed", -8],
    ]);
    expect(milestones.find((item) => item.row.id === "ms4")?.title).toMatchObject({
      en: "Entrance & boundary",
    });

    expect(getPreviewDiaryItems().map((item) => item.row.id)).toEqual(["d1", "d2", "d3"]);
    expect(
      getPreviewProgressRecordItems().map((item) => [item.row.id, item.latestForProject]),
    ).toEqual([
      ["pg1", true],
      ["pg3", true],
      ["pg2", false],
    ]);
  });

  it("provides document, handover and warranty queues from linked preview records", () => {
    expect(
      getPreviewDocumentItems().map((item) => [item.row.id, item.fileFormat, item.updated]),
    ).toEqual([
      ["dc4", "PDF", "2026-10-15"],
      ["dc3", "PDF", "2026-10-10"],
      ["dc1", "PDF", "2026-10-06"],
      ["dc2", "ZIP", "2026-09-28"],
    ]);

    const handovers = getPreviewHandoverItems();
    expect(handovers.map((item) => [item.reference, item.pending])).toEqual([
      ["PV-HO-05", true],
      ["PV-HO-04", false],
    ]);
    expect(handovers[0]?.project?.id).toBe("PV-PR-203");
    expect(handovers[0]?.operations?.pendingReports).toBe(1);
    expect(handovers[0]?.operations?.unresolvedFindings).toBe(1);
    expect(handovers[1]?.operations?.handoverState).toBe("handed_over");

    expect(getPreviewWarrantyItems().map((item) => [item.reference, item.active])).toEqual([
      ["PV-WR-02", true],
      ["PV-WR-01", false],
    ]);
  });

  it("provides localized workflow and domain-board copy in both dictionaries", () => {
    for (const locale of ["ar", "en"] as const) {
      const operations = appDictionaries[locale].dashboard.operations;
      expect(operations.workflowTitle.length).toBeGreaterThan(5);
      expect(operations.nextActions.prepareQuotation.length).toBeGreaterThan(5);
      expect(operations.blockers.directQuotationMissing.length).toBeGreaterThan(20);
      expect(operations.domain.boqEditorUnavailable.length).toBeGreaterThan(20);
      expect(operations.domain.actions.editBoq.length).toBeGreaterThan(3);
      expect(operations.domain.actions.approveReport.length).toBeGreaterThan(5);
      expect(operations.domain.customersIntro.length).toBeGreaterThan(40);
      expect(operations.domain.customerContextNote.length).toBeGreaterThan(40);
      expect(operations.domain.milestoneStates.dueSoon.length).toBeGreaterThan(5);
      expect(operations.domain.downloadDocumentUnavailable.length).toBeGreaterThan(20);
      expect(operations.domain.actions.scheduleWarrantyVisit.length).toBeGreaterThan(10);
      expect(operations.domain.notificationsIntro.length).toBeGreaterThan(50);
      expect(operations.domain.resendNotificationUnavailable.length).toBeGreaterThan(30);
      expect(operations.domain.auditIntro.length).toBeGreaterThan(50);
      expect(operations.domain.actions.exportAuditLog.length).toBeGreaterThan(10);
      expect(operations.actionQueue.intro.length).toBeGreaterThan(50);
      expect(operations.actionQueue.kinds.projectBlocker.length).toBeGreaterThan(5);
      expect(operations.projectActions.nextMilestone.length).toBeGreaterThan(5);
      expect(operations.projectActions.reviewActivity.length).toBeGreaterThan(5);
    }
  });
});

describe("formatting helpers", () => {
  it("formats money and initials", () => {
    expect(formatMoney(1200, "en")).toBe("EGP 1,200");
    expect(initials("Ahmed Samy")).toBe("AS");
    expect(clampPercent(140)).toBe(100);
    expect(clampPercent(-5)).toBe(0);
  });

  it("formats percentages per locale", () => {
    expect(formatPercent(65, "en")).toBe("65%");
    expect(formatPercent(65, "ar")).toContain("65");
    expect(formatPercent(65, "ar")).toContain("٪");
    expect(formatPercent(140, "en")).toBe("100%");
  });
});

describe("frontend expansion derivations", () => {
  it("orders project phases contracting, finishing, furnishing with distinct states", () => {
    const phases = getProjectPhases("PV-PR-201");
    expect(phases.map((phase) => phase.type)).toEqual(["contracting", "finishing", "furnishing"]);
    const statuses = new Set<string>(previewPhases.map((phase) => phase.status));
    for (const status of [
      "not_started",
      "in_progress",
      "on_hold",
      "stopped",
      "cancelled",
      "completed",
    ]) {
      expect(statuses.has(status)).toBe(true);
    }
    // Phases never leave their root project.
    for (const phase of previewPhases) {
      expect(previewProjects.some((project) => project.id === phase.rootProjectId)).toBe(true);
    }
  });

  it("derives due balances and statuses from payment allocations", () => {
    const byId = new Map(getAllDuesWithBalance().map((item) => [item.due.id, item]));
    expect(byId.get("PV-DU-201-1")).toMatchObject({
      allocated: 450000,
      remaining: 0,
      status: "settled",
    });
    expect(byId.get("PV-DU-201-2")).toMatchObject({
      allocated: 200000,
      remaining: 180000,
      status: "overdue",
    });
    expect(byId.get("PV-DU-202-1")).toMatchObject({
      allocated: 0,
      remaining: 180000,
      status: "overdue",
    });
    expect(byId.get("PV-DU-201-3")).toMatchObject({ remaining: 320000, status: "due" });
    // Every payment is fully allocated to dues of the same customer.
    for (const payment of previewPayments) {
      const allocated = payment.allocations.reduce((t, a) => t + a.amount, 0);
      expect(allocated).toBe(payment.amount);
      for (const allocation of payment.allocations) {
        expect(byId.get(allocation.dueId)?.due.customerId).toBe(payment.customerId);
      }
    }
  });

  it("aging buckets reconcile with the overview totals", () => {
    const overview = getExpansionOverview();
    const buckets = getAgingBuckets();
    expect(buckets.reduce((t, b) => t + b.amount, 0)).toBe(overview.outstandingTotal);
    const overdueBuckets = buckets.filter((b) => b.key !== "current");
    expect(overdueBuckets.reduce((t, b) => t + b.amount, 0)).toBe(overview.overdueTotal);
    expect(overview.outstandingTotal).toBe(650000 + 180000 + 250000);
  });

  it("computes customer and supplier balances from recorded lines", () => {
    const finance = getCustomerFinance("PV-CU-06");
    expect(finance).toMatchObject({ duesTotal: 1300000, collected: 650000, remaining: 650000 });
    expect(getSupplierBalance("PV-SU-01")).toMatchObject({
      purchasesTotal: 160000,
      paid: 100000,
      payable: 60000,
    });
    expect(getSupplierBalance("PV-SU-02").payable).toBe(0);
    expect(getSupplierBalance("PV-SU-03").payable).toBe(50000);
  });

  it("keeps portal finance and complaints limited to the own customer", () => {
    const finance = getPortalFinance("PV-CU-06");
    expect(finance.invoices.every((invoice) => invoice.customerId === "PV-CU-06")).toBe(true);
    expect(finance.certificates.every((c) => c.projectId === "PV-PR-201")).toBe(true);
    expect(finance.receipts.every((r) => r.payment?.customerId === "PV-CU-06")).toBe(true);
    const tickets = getPortalComplaints("PV-CU-06");
    expect(tickets.map((ticket) => ticket.id)).toEqual(["PV-CMP-301", "PV-CMP-302"]);
    for (const ticket of tickets) {
      expect(ticket.replies.every((reply) => reply.visibility === "customer")).toBe(true);
    }
    // The admin derivation still sees the internal note separately.
    const adminTicket = getPortalComplaints("PV-CU-06")[0]!;
    expect(adminTicket.replies).toHaveLength(1);
  });

  it("separates internal complaint notes from customer-visible replies for staff", () => {
    const ticket = previewComplaints.find((item) => item.id === "PV-CMP-301")!;
    expect(internalReplies(ticket)).toHaveLength(1);
    expect(internalReplies(ticket)[0]?.visibility).toBe("internal");
    const portalTicket = getPortalComplaints("PV-CU-06").find((item) => item.id === "PV-CMP-301")!;
    expect(portalTicket.replies.some((reply) => reply.visibility === "internal")).toBe(false);
  });

  it("derives team assignments from existing assignee records", () => {
    const supervisor = getEngineerAssignments("PV-EN-04")!;
    expect(supervisor.phases.map((phase) => phase.id)).toContain("PV-PH-201-2");
    const manager = getEngineerAssignments("PV-EN-03")!;
    expect(manager.phases.length).toBeGreaterThanOrEqual(3);
  });

  it("registers the expansion modules in navigation, tables and dictionaries", () => {
    const keys = ["engineers", "finance", "purchases", "complaints", "messages"] as const;
    const grouped = dashboardNavGroups.flatMap((group) => group.modules);
    for (const key of keys) {
      expect(dashboardModules.some((m) => m.key === key)).toBe(true);
      expect(grouped.filter((item) => item === key)).toHaveLength(1);
      expect((previewModuleTables[key]?.rows.length ?? 0) > 0).toBe(true);
      for (const locale of ["ar", "en"] as const) {
        expect(appDictionaries[locale].dashboard.modules[key]?.length).toBeGreaterThan(2);
        expect(appDictionaries[locale].dashboard.moduleLead[key]?.length).toBeGreaterThan(10);
      }
    }
    expect(portalNav.map((item) => item.key)).toContain("finance");
    expect(portalNav.map((item) => item.key)).toContain("complaints");
    for (const locale of ["ar", "en"] as const) {
      expect(appDictionaries[locale].portal.nav.finance.length).toBeGreaterThan(2);
      expect(appDictionaries[locale].portal.nav.complaints.length).toBeGreaterThan(2);
      const x = appDictionaries[locale].dashboard.expansion;
      expect(x.phaseTypes["contracting"]?.length).toBeGreaterThan(0);
      expect(x.phaseTypes["finishing"]?.length).toBeGreaterThan(0);
      expect(x.phaseTypes["furnishing"]?.length).toBeGreaterThan(0);
      for (const method of ["cash", "instapay", "fawry", "bank_transfer", "vodafone_cash"]) {
        expect(x.paymentMethods[method]?.length).toBeGreaterThan(0);
      }
    }
  });
});

describe("workflow detail fixtures", () => {
  function moduleAmount(moduleKey: "quotations" | "contracts", ref: string) {
    const row = previewModuleTables[moduleKey]?.rows.find(
      (item) => item.cells["ref"]?.kind === "plain" && item.cells["ref"]?.value === ref,
    );
    const cell = row?.cells["amount"];
    return cell?.kind === "money" ? cell.value : undefined;
  }

  it("joins inspection details to every recorded inspection row", () => {
    for (const ref of ["PV-IN-41", "PV-IN-40", "PV-IN-39", "PV-IN-38"]) {
      const detail = getInspectionDetail(ref)!;
      expect(detail, ref).toBeDefined();
      expect(detail.history.length).toBeGreaterThan(0);
      expect(detail.scheduledAt).toMatch(/^2026-/);
    }
    // Completed inspections carry a result; upcoming ones do not invent one.
    expect(getInspectionDetail("PV-IN-39")!.result?.measuredArea).toBe("180 m²");
    expect(getInspectionDetail("PV-IN-41")!.result).toBeUndefined();
  });

  it("reconciles BOQ nets with the recorded quotation amounts", () => {
    for (const ref of ["PV-QT-74", "PV-QT-75", "PV-QT-76", "PV-QT-77"]) {
      const found = getQuotationDetail(ref)!;
      expect(found, ref).toBeDefined();
      expect(found.totals.net, ref).toBe(moduleAmount("quotations", ref));
      expect(found.totals.gross - found.totals.discount).toBe(found.totals.net);
      expect(found.detail.revisions.length).toBeGreaterThan(0);
      // Latest revision total always equals the recorded amount.
      const last = found.detail.revisions[found.detail.revisions.length - 1]!;
      expect(last.total, ref).toBe(found.totals.net);
    }
    expect(getQuotationDetail("PV-QT-74")!.detail.decision?.state).toBe("approved");
    expect(getQuotationDetail("PV-QT-77")!.detail.decision?.state).toBe("pending");
    expect(getQuotationDetail("PV-QT-75")!.detail.decision).toBeUndefined();
  });

  it("keeps contract and change-order details consistent with module rows", () => {
    expect(getContractDetail("PV-CT-12")!.quotationRef).toBe("PV-QT-74");
    expect(getContractDetail("PV-CT-11")!.quotationRef).toBe("PV-QT-76");
    const orders = getChangeOrdersForContract("PV-CT-12");
    expect(orders).toHaveLength(1);
    expect(orders[0]?.amountDelta).toBe(moduleAmount("contracts", "PV-CO-03"));
    expect(getChangeOrdersForContract("PV-CT-11")).toHaveLength(0);
  });

  it("groups project work items by phase with bounded progress", () => {
    const groups = getProjectWorkItems("PV-PR-201");
    expect(groups.map((group) => group.phase.id)).toEqual(["PV-PH-201-1", "PV-PH-201-2"]);
    for (const item of previewWorkItems) {
      expect(item.completedQty).toBeLessThanOrEqual(item.plannedQty);
      const progress = workItemProgress(item);
      expect(progress).toBeGreaterThanOrEqual(0);
      expect(progress).toBeLessThanOrEqual(100);
      expect(previewPhases.some((phase) => phase.id === item.phaseId)).toBe(true);
    }
    const flooring = previewWorkItems.find((item) => item.id === "PV-WI-112")!;
    expect(workItemProgress(flooring)).toBe(79);
  });

  it("records assignment history that matches current phase engineers", () => {
    for (const record of previewAssignmentHistory) {
      if (!record.to && record.phaseId) {
        const phase = previewPhases.find((item) => item.id === record.phaseId)!;
        expect(phase.engineerId, record.phaseId).toBe(record.engineerId);
      }
    }
    expect(getAssignmentHistoryForProject("PV-PR-201").length).toBeGreaterThanOrEqual(2);
    expect(getAssignmentHistoryForEngineer("PV-EN-04").some((record) => !record.to)).toBe(true);
    const history = getProjectStatusHistory("PV-PR-204");
    expect(history[history.length - 1]?.status).toBe("handed_over");
  });

  it("covers every notification row with honest delivery details", () => {
    for (const row of previewModuleTables["notifications"]?.rows ?? []) {
      const delivery = getNotificationDelivery(row.id)!;
      expect(delivery, row.id).toBeDefined();
      expect(["whatsapp", "staff_internal"]).toContain(delivery.channel);
      expect(delivery.attempts).toBe(0);
      expect(delivery.stateNote.ar.length).toBeGreaterThan(10);
    }
    expect(previewNotificationDeliveries).toHaveLength(
      previewModuleTables["notifications"]?.rows.length ?? 0,
    );
  });

  it("labels the workflow presentations in both locales", () => {
    for (const locale of ["ar", "en"] as const) {
      const wf = appDictionaries[locale].dashboard.expansion.workflow;
      for (const label of [
        wf.boqTitle,
        wf.inspectionResult,
        wf.contractScope,
        wf.workItemsTitle,
        wf.assignmentHistoryTitle,
        wf.statusHistoryTitle,
        wf.channels["whatsapp"] ?? "",
        wf.channels["staff_internal"] ?? "",
        wf.events["rescheduled"] ?? "",
      ]) {
        expect(label.length).toBeGreaterThan(2);
      }
    }
  });
});

describe("handover, warranty and documents coverage", () => {
  function moduleRefRow(moduleKey: "handover" | "warranty", ref: string) {
    return previewModuleTables[moduleKey]?.rows.find(
      (row) => row.cells["ref"]?.kind === "plain" && row.cells["ref"]?.value === ref,
    );
  }

  it("joins handover details to module rows with coherent dates", () => {
    for (const detail of previewHandoverDetails) {
      const row = moduleRefRow("handover", detail.ref)!;
      expect(row, detail.ref).toBeDefined();
      expect(row.links?.projectId).toBe(detail.projectId);
      expect(row.links?.customerId).toBe(detail.customerId);
      expect(detail.checklist.length).toBe(5);
    }
    const done = getHandoverDetail("PV-HO-04")!;
    expect(done.actualDate).toBe("2026-10-02");
    expect(done.checklist.every((item) => item.state === "done")).toBe(true);
    const pending = getHandoverDetail("PV-HO-05")!;
    expect(pending.actualDate).toBeUndefined();
    expect(pending.checklist.every((item) => item.state === "pending")).toBe(true);
    expect(getHandoverForProject("PV-PR-204")?.ref).toBe("PV-HO-04");
    // Project status history agrees with the recorded handover date.
    const history = getProjectStatusHistory("PV-PR-204");
    expect(history[history.length - 1]?.at).toBe("2026-10-02");
  });

  it("records warranty visits and keeps internal notes staff-only", () => {
    for (const detail of previewWarrantyDetails) {
      const row = moduleRefRow("warranty", detail.ref)!;
      expect(row, detail.ref).toBeDefined();
      expect(row.links?.projectId).toBe(detail.projectId);
      expect(detail.visits.length).toBeGreaterThan(0);
    }
    const open = getWarrantyDetail("PV-WR-02")!;
    expect(open.source).toBe("customer_request");
    expect(open.nextVisit).toBe("2026-10-25");
    expect(open.internalNotes.length).toBe(1);
    // The portal customer for PR-204 sees the cases without internal notes.
    const portal = getPortalWarranty("PV-CU-03");
    expect(portal.map((item) => item.ref).sort()).toEqual(["PV-WR-01", "PV-WR-02"]);
    expect(JSON.stringify(portal)).not.toContain("internalNotes");
    expect(JSON.stringify(portal)).not.toContain("مفصلات باب غرفة النوم الثانية");
    // The signed-in portal customer (PV-CU-06) has no warranty cases.
    expect(getPortalWarranty("PV-CU-06")).toHaveLength(0);
    expect(getPortalHandover("PV-CU-06")).toHaveLength(0);
    expect(getPortalHandover("PV-CU-03")).toHaveLength(1);
  });

  it("builds a grouped document catalog with distinct finance document types", () => {
    const catalog = getDocumentCatalog();
    const groups = groupDocumentCatalog(catalog);
    const byCategory = new Map(groups.map((group) => [group.category, group.items]));
    // Every required category is represented and stays distinct.
    for (const category of [
      "boq",
      "contracts",
      "change_orders",
      "reports_evidence",
      "invoices",
      "certificates",
      "receipts",
      "handover",
      "warranty",
      "approvals_drawings",
    ] as const) {
      expect(byCategory.get(category)?.length ?? 0, category).toBeGreaterThan(0);
    }
    expect(byCategory.get("invoices")?.map((item) => item.id)).toEqual(
      expect.arrayContaining(["PV-INV-7001", "PV-INV-7002", "PV-INV-7003"]),
    );
    expect(byCategory.get("certificates")?.some((item) => item.id === "PV-CERT-501")).toBe(true);
    expect(byCategory.get("receipts")?.some((item) => item.id === "PV-RC-6001")).toBe(true);
    expect(byCategory.get("handover")?.every((item) => item.reference === "PV-HO-04")).toBe(true);
    expect(byCategory.get("warranty")?.length).toBe(2);
    // No fabricated files: every item points at a recorded reference.
    for (const item of catalog) {
      expect(item.reference.length).toBeGreaterThan(2);
      expect(item.title.ar.length).toBeGreaterThan(2);
    }
  });

  it("scopes project, customer and portal document views", () => {
    const pr201 = getProjectDocuments("PV-PR-201");
    expect(pr201.length).toBeGreaterThan(0);
    expect(pr201.every((item) => item.projectId === "PV-PR-201")).toBe(true);
    const cu06 = getCustomerDocuments("PV-CU-06");
    expect(cu06.every((item) => item.customerId === "PV-CU-06")).toBe(true);
    const portal = getPortalDocuments("PV-CU-06");
    // Portal keeps project documents only: no finance docs, no warranty evidence,
    // no other customer's records.
    expect(portal.every((item) => item.customerId === "PV-CU-06")).toBe(true);
    expect(portal.some((item) => item.category === "invoices")).toBe(false);
    expect(portal.some((item) => item.category === "warranty")).toBe(false);
    expect(portal.some((item) => item.id === "dc1")).toBe(true);
    expect(portal.some((item) => item.reference === "PV-CT-12")).toBe(true);
    expect(portal.some((item) => item.reference === "PV-CT-11")).toBe(false);
  });

  it("labels lifecycle and document categories in both locales", () => {
    for (const locale of ["ar", "en"] as const) {
      const x = appDictionaries[locale].dashboard.expansion;
      expect(x.lifecycle.checklistTitle.length).toBeGreaterThan(2);
      expect(x.lifecycle.policyNote.length).toBeGreaterThan(20);
      expect(x.lifecycle.separationNote.length).toBeGreaterThan(20);
      expect(x.lifecycle.warrantySources["customer_request"]?.length).toBeGreaterThan(2);
      for (const category of [
        "boq",
        "contracts",
        "change_orders",
        "invoices",
        "certificates",
        "receipts",
        "handover",
        "warranty",
      ]) {
        expect(x.documentCategories[category]?.length ?? 0, category).toBeGreaterThan(2);
      }
    }
  });
});

describe("D1 session payment allocation helpers", () => {
  it("plans FIFO allocations only against the customer's open dues for the project", async () => {
    const { getAllDuesWithBalance, planSessionAllocations, sessionRemainingFor } =
      await import("@/lib/preview-expansion");
    const dues = getAllDuesWithBalance();
    const remaining = sessionRemainingFor(dues, "PV-CU-06", "PV-PR-201");
    expect(remaining).toBeGreaterThan(0);
    const plan = planSessionAllocations(dues, {
      customerId: "PV-CU-06",
      projectId: "PV-PR-201",
      amount: 10000,
    });
    expect(plan.reduce((t, a) => t + a.amount, 0)).toBe(10000);
    const firstOpen = dues
      .filter(
        (d) =>
          d.due.customerId === "PV-CU-06" && d.due.projectId === "PV-PR-201" && d.remaining > 0,
      )
      .sort((a, b) => a.due.dueDate.localeCompare(b.due.dueDate))[0]!;
    expect(plan[0]?.dueId).toBe(firstOpen.due.id);
    // Never allocates to another customer or beyond what is owed.
    expect(
      planSessionAllocations(dues, {
        customerId: "PV-CU-06",
        projectId: "PV-PR-201",
        amount: remaining + 500000,
      }).reduce((t, a) => t + a.amount, 0),
    ).toBe(remaining);
    expect(
      planSessionAllocations(dues, {
        customerId: "PV-CU-04",
        projectId: "PV-PR-201",
        amount: 1000,
      }),
    ).toEqual([]);
  });

  it("applies confirmed allocations to balances and settles a fully paid due", async () => {
    const { getAllDuesWithBalance, planSessionAllocations, withSessionAllocations } =
      await import("@/lib/preview-expansion");
    const dues = getAllDuesWithBalance();
    const open = dues.find(
      (d) => d.due.customerId === "PV-CU-06" && d.due.projectId === "PV-PR-201" && d.remaining > 0,
    )!;
    const plan = planSessionAllocations(dues, {
      customerId: "PV-CU-06",
      projectId: "PV-PR-201",
      amount: open.remaining,
    });
    const updated = withSessionAllocations(dues, plan);
    const settled = updated.find((d) => d.due.id === open.due.id)!;
    expect(settled.remaining).toBe(0);
    expect(settled.status).toBe("settled");
    expect(settled.allocated).toBe(open.due.amount);
    // Untouched dues are returned unchanged (same reference content).
    const other = dues.find((d) => d.due.id !== open.due.id)!;
    expect(updated.find((d) => d.due.id === other.due.id)?.remaining).toBe(other.remaining);
    expect(withSessionAllocations(dues, [])).toBe(dues);
  });

  it("aging buckets accept session-adjusted dues without changing default totals", async () => {
    const { getAgingBuckets, getAllDuesWithBalance, withSessionAllocations } =
      await import("@/lib/preview-expansion");
    const base = getAgingBuckets();
    const dues = getAllDuesWithBalance();
    const overdue = dues.find((d) => d.status === "overdue" && d.remaining > 0);
    expect(overdue).toBeTruthy();
    const adjusted = withSessionAllocations(dues, [
      { dueId: overdue!.due.id, amount: overdue!.remaining },
    ]);
    const after = getAgingBuckets(adjusted);
    const total = (rows: typeof base) => rows.reduce((t, r) => t + r.amount, 0);
    expect(total(after)).toBe(total(base) - overdue!.remaining);
  });
});
