"use client";
import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { getScreenViews, screenSearchText } from "@/config/erp-screen-specs";
import { erpHref, erpModules, legacyReference } from "@/config/erp";
import { erpText, erpKindLabel } from "@/content/erp-dictionary";

export function ErpDirectory({ locale, moduleId }: { locale: Locale; moduleId?: string }) {
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState("all");
  const modules = erpModules.filter((module) => !moduleId || module.id === moduleId);
  const q = query.trim().toLowerCase();
  const selectedModule = modules.length === 1 && moduleId ? modules[0] : undefined;
  const matches = (
    page: (typeof erpModules)[number]["pages"][number],
    area: (typeof erpModules)[number],
  ) =>
    (mode === "all" ||
      (mode === "source"
        ? ["preview", "fixture", "tool"].includes(page.kind)
        : page.kind === "deferred")) &&
    `${area.title.ar} ${area.title.en} ${page.title.ar} ${page.title.en} ${page.subject.ar} ${page.subject.en} ${screenSearchText(area.id, page.id)}`
      .toLowerCase()
      .includes(q);
  return (
    <div className="erp-workspace">
      <header className="erp-intro">
        <span className="erp-eyebrow">BLACK X / ERP</span>
        <h2>
          {selectedModule ? pick(selectedModule.title, locale) : erpText("catalogue", locale)}
        </h2>
        <p>{erpText("legacy", locale)}</p>
        <div className="erp-counts">
          <span>
            <strong>{modules.length}</strong> {erpText("modules", locale)}
          </span>
          <span>
            <strong>{modules.reduce((sum, area) => sum + area.pages.length, 0)}</strong>{" "}
            {erpText("pages", locale)}
          </span>
          <span>
            {legacyReference.independentlyVerifiedInternalPages}{" "}
            {locale === "ar"
              ? "صفحات قديمة متحققة مستقلاً"
              : "independently verified legacy internal pages"}
          </span>
        </div>
      </header>
      <details className="panel erp-tool" id="erp-system-guide">
        <summary>
          {locale === "ar" ? "دليل النظام وحدود المعاينة" : "System guide and preview boundaries"}
        </summary>
        <p>
          {locale === "ar"
            ? "ابحث بالعربية أو الإنجليزية وافتح الوحدات ثم الصفحة. هياكل التسجيل الثاني معاينات مستقلة بلا بيانات متصلة؛ المعلمات والمسودات مؤقتة ولا تنفذ عمليات. العينات القديمة منفصلة وليست سجلات معتمدة. تحكم المالك من الخادم باقٍ دون تغيير."
            : "Search in Arabic or English, expand a module and open a page. Second-recording structures are disconnected previews: parameters and drafts are temporary and execute no operation. Existing fixtures remain separate, not authoritative records. Server-side owner access remains unchanged."}
        </p>
      </details>
      {!moduleId ? (
        <section className="panel erp-workflow">
          <h3>{erpText("chain", locale)}</h3>
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
              const areaModule = erpModules.find((x) => x.id === m);
              const page = areaModule?.pages.find((x) => x.id === p);
              return page ? (
                <li key={`${m}/${p}`}>
                  <Link href={erpHref(locale, m, p)}>{pick(page.title, locale)}</Link>
                </li>
              ) : null;
            })}
          </ol>
        </section>
      ) : null}
      <div className="panel erp-filterbar">
        <label>
          {erpText("search", locale)}
          <input
            className="form-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          {erpText("filter", locale)}
          <select className="form-select" value={mode} onChange={(e) => setMode(e.target.value)}>
            <option value="all">{erpText("all", locale)}</option>
            <option value="source">
              {locale === "ar"
                ? "معاينات مدمجة وأدوات محلية فقط"
                : "Embedded previews & local tools only"}
            </option>
            <option value="deferred">{erpText("pending", locale)}</option>
          </select>
        </label>
      </div>
      <div className="erp-module-grid">
        {modules.map((module) => {
          const pages = module.pages.filter((page) => matches(page, module));
          if (!pages.length) return null;
          return (
            <section className="panel erp-module-card" key={module.id}>
              <header>
                <small>
                  {erpText(module.provenance === "adapted" ? "adapted" : "category", locale)}
                </small>
                <h3>
                  <Link href={erpHref(locale, module.id)}>{pick(module.title, locale)}</Link>
                </h3>
                <p>{pick(module.boundary, locale)}</p>
              </header>
              {[...new Set(pages.map((p) => pick(p.section, locale)))].map((section) => (
                <div key={section}>
                  <h4>{section}</h4>
                  <ul>
                    {pages
                      .filter((p) => pick(p.section, locale) === section)
                      .map((page) => (
                        <li key={page.id}>
                          <Link href={erpHref(locale, module.id, page.id)}>
                            <span>{pick(page.title, locale)}</span>
                            <small>{erpKindLabel(page.kind, locale)}</small>
                          </Link>
                          {getScreenViews(module.id, page.id).length ? (
                            <details className="erp-layout-links">
                              <summary>
                                {locale === "ar"
                                  ? "هياكل إضافية — ليست مسارات جديدة"
                                  : "Detailed layouts — not extra routes"}
                              </summary>
                              {getScreenViews(module.id, page.id).map((view) => (
                                <Link
                                  key={view.id}
                                  href={`${erpHref(locale, module.id, page.id)}?view=${view.id}`}
                                >
                                  {pick(view.title, locale)}
                                </Link>
                              ))}
                            </details>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {!modules.some((area) => area.pages.some((page) => matches(page, area))) ? (
        <div className="empty-state">{erpText("noResults", locale)}</div>
      ) : null}
      <p className="erp-footnote">{erpText("future", locale)}</p>
    </div>
  );
}
