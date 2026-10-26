"use client";
import Link from "next/link";
import { ErpPermissionSelectionPreview } from "./ErpPermissionSelectionPreview";
import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { erpModules, erpHref } from "@/config/erp";
import { erpText } from "@/content/erp-dictionary";

export function ErpAccessMatrix({ locale }: { locale: Locale }) {
  const [moduleId, setModuleId] = useState("");
  const [pageId, setPageId] = useState("");
  const [user, setUser] = useState("owner-boundary");
  const [requirement, setRequirement] = useState("view");
  const [query, setQuery] = useState("");
  const id = useId();
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const pages = erpModules
    .filter((module) => !moduleId || module.id === moduleId)
    .flatMap((module) =>
      module.pages.map((page) => ({ module, page, key: `${module.id}/${page.id}` })),
    );
  const matches = pages.filter(
    ({ module, page, key }) =>
      (!pageId || key === pageId) &&
      `${module.title.ar} ${module.title.en} ${page.title.ar} ${page.title.en}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()) &&
      (requirement !== "export" || (page.source === "export" && page.kind === "tool")),
  );
  return (
    <section className="panel erp-tool" data-page-permissions>
      <h3>{erpText("owner", locale)}</h3>
      <p>{erpText("matrix", locale)}</p>
      <ErpPermissionSelectionPreview locale={locale} />
      <div className="erp-screen-grid">
        <label htmlFor={`${id}-user`}>
          {t("User / boundary selection", "اختيار المستخدم / الحدود")}
          <select
            id={`${id}-user`}
            className="form-select"
            value={user}
            onChange={(e) => setUser(e.target.value)}
          >
            <option value="">{t("No identity selected", "لم تُحدد هوية")}</option>
            <option value="owner-boundary">
              {t(
                "Owner review boundary — not a user directory",
                "حدود مراجعة المالك — ليس دليل مستخدمين",
              )}
            </option>
            <option disabled>
              {t("Staff / customer lookup unavailable", "مصدر الموظفين / العملاء غير متاح")}
            </option>
          </select>
        </label>
        <label htmlFor={`${id}-module`}>
          {erpText("modules", locale)}
          <select
            id={`${id}-module`}
            className="form-select"
            value={moduleId}
            onChange={(e) => {
              setModuleId(e.target.value);
              setPageId("");
            }}
          >
            <option value="">{erpText("all", locale)}</option>
            {erpModules.map((module) => (
              <option key={module.id} value={module.id}>
                {pick(module.title, locale)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-page`}>
          {t("Page selection", "اختيار الصفحة")}
          <select
            id={`${id}-page`}
            className="form-select"
            value={pageId}
            onChange={(e) => setPageId(e.target.value)}
          >
            <option value="">{erpText("all", locale)}</option>
            {pages.map(({ module, page, key }) => (
              <option key={key} value={key}>
                {pick(module.title, locale)} / {pick(page.title, locale)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-requirement`}>
          {t("Permission requirement", "متطلب الصلاحية")}
          <select
            id={`${id}-requirement`}
            className="form-select"
            value={requirement}
            onChange={(e) => setRequirement(e.target.value)}
          >
            {(["view", "create", "edit", "approve", "export", "admin"] as const).map((key) => (
              <option key={key} value={key}>
                {erpText(key, locale)}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor={`${id}-search`}>
          {t("Search matching pages", "بحث في الصفحات المطابقة")}
          <input
            id={`${id}-search`}
            type="search"
            className="form-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
      </div>
      <p className="erp-boundary">
        {t(
          "Minimum access: server-validated owner-review session for these UI routes. Numeric access levels, staff grants and resource permissions are not configured. Selection changes only this description, never authorization.",
          "الحد الأدنى للوصول: جلسة مراجعة المالك المتحققة من الخادم لهذه المسارات. المستويات الرقمية ومنح الموظفين وصلاحيات الموارد غير مهيأة. الاختيار يغير الوصف فقط وليس التفويض.",
        )}
      </p>
      <p role="status">
        {matches.length} {t("matching catalogue pages", "صفحات مطابقة في الدليل")} ·{" "}
        {requirement === "export"
          ? t("Navigation metadata only", "بيانات التنقل فقط")
          : requirement !== "view"
            ? t(
                "Requested business permission is unavailable on these interfaces",
                "صلاحية الأعمال المطلوبة غير متاحة في هذه الواجهات",
              )
            : t("Read-only interface boundary", "حدود الواجهة للقراءة فقط")}
      </p>
      <div
        className="erp-table-scroll"
        role="region"
        aria-label={erpText("matrix", locale)}
        tabIndex={0}
      >
        <table>
          <caption>
            {t(
              "Descriptive page requirements — not enforced grants",
              "متطلبات صفحات وصفية — ليست منحاً نافذة",
            )}
          </caption>
          <thead>
            <tr>
              <th scope="col">{erpText("pages", locale)}</th>
              {(["view", "create", "edit", "approve", "export", "admin"] as const).map((key) => (
                <th scope="col" key={key}>
                  {erpText(key, locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map(({ module, page, key }) => (
              <tr key={key}>
                <th scope="row">
                  <Link href={erpHref(locale, module.id, page.id)}>
                    {pick(module.title, locale)} / {pick(page.title, locale)}
                  </Link>
                  <br />
                  <Link href={erpHref(locale, module.id)}>{t("Open module", "فتح الوحدة")}</Link>
                </th>
                <td>
                  {user
                    ? erpText("owner", locale)
                    : t("Not evaluated — no identity", "غير مقيم — لا توجد هوية")}
                </td>
                {["create", "edit", "approve"].map((key) => (
                  <td key={key}>{erpText("blocked", locale)}</td>
                ))}
                <td>
                  {erpText(
                    page.source === "export" && page.kind === "tool" ? "download" : "blocked",
                    locale,
                  )}
                </td>
                <td>{erpText("blocked", locale)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!matches.length ? (
        <p className="empty-state">
          {t(
            "No catalogue pages match these descriptive filters. This is not an authorization decision.",
            "لا تطابق صفحات الدليل هذه المرشحات الوصفية. هذا ليس قرار تفويض.",
          )}
        </p>
      ) : null}
      <p className="erp-boundary">
        {locale === "ar"
          ? "هذه المصفوفة تصف واجهات ERP الجديدة فقط ولا تُغيّر تفويض واجهات API الحالية. إنشاء موظفين أو منح أدوار أو اعتماد معاملات غير متاح هنا."
          : "This matrix describes the new ERP interfaces only; it does not change existing API authorization. Staff creation, role grants and transaction approval are unavailable here."}
      </p>
    </section>
  );
}
