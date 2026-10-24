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
import { dashboardModules, dashboardNavGroups, getDashboardNavGroupKey } from "@/config/navigation";
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
import sitemap from "@/app/sitemap";

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

  it("keeps the admin shell responsive with a logical drawer, wrapped header, and card tables", () => {
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
    expect(urls).toContain("https://blackx-construction.example/ar/projects");
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
