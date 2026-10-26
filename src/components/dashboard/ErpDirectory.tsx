"use client";
import Link from "next/link";
import { useId, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { getScreenViews, screenSearchText } from "@/config/erp-screen-specs";
import { erpHref, erpModules, legacyReference, type ErpModule, type ErpPage } from "@/config/erp";
import { erpNavigationGroups } from "@/config/erp-navigation";
import {
  erpWorkspacePresentation,
  normalizeWorkspaceSearch,
  workspaceCount,
} from "@/config/erp-workspace";
import { erpText, erpKindLabel } from "@/content/erp-dictionary";
import { GlyphIcon } from "@/components/ui/GlyphIcon";

/** One shared registered-page renderer for module hubs and on-demand search results. */
function RegisteredPages({
  areaModule,
  pages,
  locale,
  query,
  headingLevel: SectionHeading = "h5",
}: {
  areaModule: ErpModule;
  pages: ErpPage[];
  locale: Locale;
  query: string;
  headingLevel?: "h3" | "h5";
}) {
  const statusId = useId();
  return (
    <div className="workspace-page-groups">
      {[...new Set(pages.map((page) => pick(page.section, locale)))].map(
        (section, sectionIndex) => {
          const sectionPages = pages.filter((page) => pick(page.section, locale) === section);
          // State a shared status once, visibly; mixed sections keep each page's exact status.
          const commonKind =
            sectionPages.length > 1 &&
            sectionPages.every((page) => page.kind === sectionPages[0]?.kind)
              ? sectionPages[0]?.kind
              : undefined;
          return (
            <section className="workspace-page-group" key={section}>
              <SectionHeading>{section}</SectionHeading>
              {commonKind ? (
                <p className="workspace-section-kind" id={`${statusId}-${sectionIndex}`}>
                  {locale === "ar" ? "جميع صفحات هذا القسم: " : "All pages in this section: "}
                  {erpKindLabel(commonKind, locale)}
                </p>
              ) : null}
              <ul>
                {sectionPages.map((page) => {
                  const views = getScreenViews(areaModule.id, page.id);
                  const matchingViews = query
                    ? views.filter((view) =>
                        normalizeWorkspaceSearch(`${view.title.ar} ${view.title.en}`).includes(
                          query,
                        ),
                      )
                    : [];
                  return (
                    <li key={page.id}>
                      <Link
                        className="workspace-page-link"
                        aria-describedby={commonKind ? `${statusId}-${sectionIndex}` : undefined}
                        href={erpHref(locale, areaModule.id, page.id)}
                      >
                        <span>{pick(page.title, locale)}</span>
                        {!commonKind ? <small>{erpKindLabel(page.kind, locale)}</small> : null}
                      </Link>
                      {views.length ? (
                        <details className="erp-layout-links" open={matchingViews.length > 0}>
                          <summary>
                            {locale === "ar"
                              ? "هياكل إضافية — ليست مسارات جديدة"
                              : "Detailed layouts — not extra routes"}
                          </summary>
                          {(matchingViews.length ? matchingViews : views).map((view) => (
                            <Link
                              key={view.id}
                              href={`${erpHref(locale, areaModule.id, page.id)}?view=${encodeURIComponent(view.id)}`}
                            >
                              {pick(view.title, locale)}
                            </Link>
                          ))}
                        </details>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        },
      )}
    </div>
  );
}

export function ErpDirectory({ locale, moduleId }: { locale: Locale; moduleId?: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const searchRef = useRef<HTMLInputElement>(null);
  const id = useId();
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const modules = erpModules.filter((areaModule) => !moduleId || areaModule.id === moduleId);
  const q = normalizeWorkspaceSearch(query);
  const selectedModule = moduleId ? modules[0] : undefined;
  const matches = (page: ErpPage, area: ErpModule) =>
    (mode === "all" ||
      (mode === "source"
        ? ["preview", "fixture", "tool"].includes(page.kind)
        : page.kind === "deferred")) &&
    normalizeWorkspaceSearch(
      `${area.id} ${area.title.ar} ${area.title.en} ${page.title.ar} ${page.title.en} ${page.subject.ar} ${page.subject.en} ${screenSearchText(area.id, page.id)}`,
    ).includes(q);
  const results = modules
    .map((areaModule) => ({
      areaModule,
      pages: areaModule.pages.filter((page) => matches(page, areaModule)),
    }))
    .filter((result) => result.pages.length);
  const searching = Boolean(q) || mode !== "all";
  const totalPages = modules.reduce((sum, areaModule) => sum + areaModule.pages.length, 0);
  const matchedPages = results.reduce((sum, result) => sum + result.pages.length, 0);
  function countSummary(count: number, noun: "module" | "page") {
    const [before, after] = workspaceCount(count, noun, locale).split(String(count));
    return (
      <>
        {before}
        <strong>{count}</strong>
        {after}
      </>
    );
  }
  function resetSearch() {
    setQuery("");
    setMode("all");
    searchRef.current?.focus();
  }

  return (
    <div className="erp-workspace workspace-directory" dir={locale === "ar" ? "rtl" : "ltr"}>
      <header className="erp-intro workspace-intro">
        <span className="erp-eyebrow">
          {t("YOUR BUSINESS, ORGANIZED", "أعمالك في مساحة واحدة")}
        </span>
        <h2>
          {selectedModule
            ? pick(selectedModule.title, locale)
            : t("BLACK X ERP Workspace", "مساحة عمل BLACK X ERP")}
        </h2>
        <p>
          {selectedModule
            ? pick(selectedModule.boundary, locale)
            : t(
                "Choose a business area or search all registered pages.",
                "اختر مجال العمل أو ابحث في جميع الصفحات المسجلة.",
              )}
        </p>
        <div className="erp-counts workspace-counts">
          <span>{countSummary(modules.length, "module")}</span>
          <span>{countSummary(totalPages, "page")}</span>
          {!moduleId ? (
            <span>{workspaceCount(erpNavigationGroups.length, "area", locale)}</span>
          ) : null}
        </div>
        {selectedModule ? (
          <div className="workspace-hub-meta">
            <span className="workspace-provenance">
              {erpText(selectedModule.provenance === "adapted" ? "adapted" : "category", locale)}
            </span>
            {selectedModule.pages.some((page) => page.kind === "deferred") ? (
              <span className="workspace-availability">
                {workspaceCount(
                  selectedModule.pages.filter((page) => page.kind === "deferred").length,
                  "page",
                  locale,
                )}
                {" · "}
                {erpText("pending", locale)}
              </span>
            ) : null}
          </div>
        ) : null}
        {selectedModule ? (
          <Link className="workspace-back" href={erpHref(locale)}>
            {t("All business modules", "جميع وحدات الأعمال")} <span aria-hidden="true">↗</span>
          </Link>
        ) : null}
      </header>

      <section
        className="erp-filterbar workspace-search"
        aria-label={t("Workspace search and filters", "البحث والتصفية في مساحة العمل")}
      >
        <div className="workspace-search-main">
          <label htmlFor={`${id}-search`}>{erpText("search", locale)}</label>
          <div className="workspace-search-field">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="10.5" cy="10.5" r="6.5" />
              <path d="m16 16 5 5" />
            </svg>
            <input
              ref={searchRef}
              id={`${id}-search`}
              className="form-input"
              type="search"
              value={query}
              placeholder={t(
                "Try: projects, quotations, Trial balance…",
                "جرّب: المشروعات، عروض الأسعار، ميزان المراجعة…",
              )}
              aria-describedby={`${id}-search-help`}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && query) {
                  e.preventDefault();
                  e.stopPropagation();
                  setQuery("");
                }
              }}
            />
          </div>
          <p id={`${id}-search-help`}>
            {t(
              "Search module, page or layout names in Arabic or English.",
              "ابحث عن الوحدات والصفحات والهياكل بالعربية أو الإنجليزية.",
            )}
          </p>
        </div>
        <label className="workspace-filter" htmlFor={`${id}-filter`}>
          {erpText("filter", locale)}
          <select
            id={`${id}-filter`}
            className="form-select"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="all">{erpText("all", locale)}</option>
            <option value="source">
              {t("Embedded previews & local tools only", "معاينات مدمجة وأدوات محلية فقط")}
            </option>
            <option value="deferred">{erpText("pending", locale)}</option>
          </select>
        </label>
      </section>

      <div className="workspace-results-bar">
        <p role="status" aria-live="polite" aria-atomic="true">
          {searching
            ? `${workspaceCount(results.length, "module", locale)} · ${workspaceCount(matchedPages, "matching-page", locale)}`
            : selectedModule
              ? t("Choose a page in this module", "اختر صفحة من هذه الوحدة")
              : t("Choose a business area to get started", "اختر مجال العمل للبدء")}
        </p>
        {searching ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={resetSearch}>
            {t("Clear search & filters", "مسح البحث والمرشحات")}
          </button>
        ) : (
          <span>
            {t(
              "Availability is shown with each page or section",
              "حالة الإتاحة موضّحة مع كل صفحة أو قسم",
            )}
          </span>
        )}
      </div>

      {selectedModule
        ? results.map(({ areaModule, pages }) => (
            <section
              className="erp-module-card workspace-hub"
              key={areaModule.id}
              aria-label={pick(areaModule.title, locale)}
            >
              <RegisteredPages
                areaModule={areaModule}
                pages={pages}
                locale={locale}
                query={q}
                headingLevel="h3"
              />
            </section>
          ))
        : erpNavigationGroups.map((group) => {
            const groupResults = group.modules.flatMap((moduleId) =>
              results.filter((result) => result.areaModule.id === moduleId),
            );
            if (!groupResults.length) return null;
            return (
              <section
                className="workspace-category"
                key={group.id}
                aria-labelledby={`${id}-${group.id}`}
              >
                <div className="workspace-category-heading">
                  <h3 id={`${id}-${group.id}`}>{pick(group.title, locale)}</h3>
                  <span>{workspaceCount(groupResults.length, "module", locale)}</span>
                </div>
                <div className="erp-module-grid workspace-module-grid">
                  {groupResults.map(({ areaModule, pages }) => {
                    const presentation = erpWorkspacePresentation[areaModule.id];
                    return (
                      <article className="erp-module-card workspace-module" key={areaModule.id}>
                        <div className="workspace-module-summary">
                          <span className="workspace-module-icon">
                            <GlyphIcon icon={presentation?.icon ?? "▤"} />
                          </span>
                          <h4>
                            <Link href={erpHref(locale, areaModule.id)}>
                              {pick(areaModule.title, locale)}
                            </Link>
                          </h4>
                          <p>
                            {presentation
                              ? pick(presentation.description, locale)
                              : pick(areaModule.boundary, locale)}
                          </p>
                        </div>
                        <div className="workspace-module-action">
                          <span>{workspaceCount(areaModule.pages.length, "page", locale)}</span>
                          <Link
                            href={erpHref(locale, areaModule.id)}
                            aria-label={`${t("Open module", "فتح الوحدة")}: ${pick(areaModule.title, locale)}`}
                          >
                            {t("Open module", "فتح الوحدة")} <span aria-hidden="true">↗</span>
                          </Link>
                        </div>
                        {searching ? (
                          <details
                            className="workspace-matches"
                            open={Boolean(q) && pages.length <= 4}
                          >
                            <summary>
                              {workspaceCount(pages.length, "matching-page", locale)}
                            </summary>
                            <RegisteredPages
                              areaModule={areaModule}
                              pages={pages}
                              locale={locale}
                              query={q}
                            />
                          </details>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}

      {!results.length ? (
        <section className="workspace-empty" aria-labelledby={`${id}-empty`}>
          <GlyphIcon icon="◎" />
          <h3 id={`${id}-empty`}>
            {t("No matching modules or pages", "لا توجد وحدات أو صفحات مطابقة")}
          </h3>
          <p>{erpText("noResults", locale)}</p>
          <button type="button" className="btn btn-outline" onClick={resetSearch}>
            {t("Reset workspace search", "إعادة ضبط البحث")}
          </button>
        </section>
      ) : null}

      <div className="workspace-resources">
        <details className="workspace-guide" id="erp-system-guide">
          <summary>
            {t("System guide and preview boundaries", "دليل النظام وحدود المعاينة")}
          </summary>
          <p>{erpText("legacy", locale)}</p>
          <p>
            {legacyReference.independentlyVerifiedInternalPages}{" "}
            {t("independently verified legacy internal pages", "صفحات قديمة متحققة مستقلاً")}
          </p>
          <p>
            {t(
              "Search in Arabic or English, open a module, then choose a registered page. Detailed layouts are disconnected previews: parameters and drafts are temporary and execute no operation. Existing fixtures are not authoritative business records. Server-side owner access remains unchanged.",
              "ابحث بالعربية أو الإنجليزية، ثم افتح الوحدة واختر صفحة مسجلة. الهياكل التفصيلية معاينات بلا بيانات متصلة؛ المعلمات والمسودات مؤقتة ولا تنفذ عمليات. العينات ليست سجلات أعمال معتمدة. تحكم المالك من الخادم باقٍ دون تغيير.",
            )}
          </p>
          <p className="erp-footnote">{erpText("future", locale)}</p>
        </details>
        {!moduleId ? (
          <details className="workspace-guide erp-workflow">
            <summary>{erpText("chain", locale)}</summary>
            <ol>
              {[
                ["sales", "requests"],
                ["sales", "inspections"],
                ["sales", "quotations"],
                ["sales", "decisions"],
                ["sales", "contracts"],
                ["projects", "phases"],
                ["projects", "progress"],
                ["quality", "inspections"],
                ["projects", "weekly-reports"],
                ["projects", "handover"],
                ["projects", "warranty"],
              ].map(([m, p]) => {
                const areaModule = erpModules.find((item) => item.id === m);
                const page = areaModule?.pages.find((item) => item.id === p);
                return page ? (
                  <li key={`${m}/${p}`}>
                    <Link href={erpHref(locale, m, p)}>{pick(page.title, locale)}</Link>
                  </li>
                ) : null;
              })}
            </ol>
          </details>
        ) : null}
      </div>
    </div>
  );
}
