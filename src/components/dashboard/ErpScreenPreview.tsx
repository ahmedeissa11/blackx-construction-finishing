"use client";

import Link from "next/link";
import { ErpAccountHierarchy, ErpClosingRequirements } from "./ErpAccountingPreview";
import { ErpCostWorkbench, ErpJournalWorkbench } from "./ErpLocalWorkbenches";
import { ErpReportTemplate } from "./ErpReportTemplate";
import { ErpIdentityWorkspace } from "./ErpIdentityWorkspace";
import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { erpHref } from "@/config/erp";
import {
  getScreenViews,
  screenFields,
  screenPurposes,
  validateScreenInputs,
  type ScreenInput,
  type ScreenFieldKey,
} from "@/config/erp-screen-specs";

/** Disconnected layout review, deliberately never reads/writes business data. */
export function ErpScreenPreview({
  area,
  page,
  locale,
  initialView,
}: {
  area: string;
  page: string;
  locale: Locale;
  initialView?: string;
}) {
  const views = getScreenViews(area, page);
  const [viewId, setViewId] = useState(initialView ?? views[0]?.id);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);
  const [filterChecked, setFilterChecked] = useState(false);
  const id = useId();
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const view = views.find((v) => v.id === viewId) ?? views[0];
  if (!view) return null;
  const errors = checked ? validateScreenInputs(view.draft, draft) : {};
  const filterErrors = filterChecked ? validateScreenInputs(view.filters, filters) : {};
  function controls(
    inputs: ScreenInput[],
    values: Record<string, string>,
    setValues: (values: Record<string, string>) => void,
    prefix: string,
    validation: Partial<Record<ScreenFieldKey, string>>,
  ) {
    return inputs.map((input) => {
      const key = `${id}-${prefix}-${input.key}`;
      const label = pick(screenFields[input.key], locale);
      const error = validation[input.key];
      return (
        <div className="erp-screen-field" key={input.key}>
          <label htmlFor={key}>
            {label}
            {input.required ? <span aria-label={t("required", "مطلوب")}> *</span> : null}
          </label>
          {input.type === "lookup" ? (
            <select
              id={key}
              className="form-select"
              disabled
              aria-describedby={error ? `${id}-scope-note ${key}-error` : `${id}-scope-note`}
              aria-invalid={error ? true : undefined}
              aria-required={input.required}
            >
              <option>{t("No authorized source connected", "لا يوجد مصدر مفوض متصل")}</option>
            </select>
          ) : (
            <input
              id={key}
              className="form-input"
              type={input.type}
              value={input.type === "checkbox" ? undefined : (values[input.key] ?? "")}
              checked={input.type === "checkbox" ? values[input.key] === "true" : undefined}
              required={input.required}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${key}-error` : undefined}
              min={input.type === "number" ? 0 : undefined}
              step={input.type === "number" ? "any" : undefined}
              maxLength={input.type === "text" || input.type === "email" ? 200 : undefined}
              onChange={(e) => {
                setValues({
                  ...values,
                  [input.key]:
                    input.type === "checkbox" ? String(e.target.checked) : e.target.value,
                });
                if (prefix === "draft") setChecked(false);
                else setFilterChecked(false);
              }}
            />
          )}
          {error ? (
            <span id={`${key}-error`} className="erp-screen-error">
              {error === "lookup"
                ? t(
                    "Required lookup is unavailable; this draft cannot be submitted.",
                    "المصدر المطلوب غير متاح؛ لا يمكن إرسال هذه المسودة.",
                  )
                : error === "required"
                  ? t(
                      "This field is required for layout validation.",
                      "هذا الحقل مطلوب للتحقق من نموذج الواجهة.",
                    )
                  : t(
                      "Enter a valid value; dates must be in order and numbers non-negative.",
                      "أدخل قيمة صحيحة؛ يجب ترتيب التواريخ وعدم استخدام أرقام سالبة.",
                    )}
            </span>
          ) : null}
        </div>
      );
    });
  }
  if (view.id === "users" || view.id === "roles") {
    return (
      <section
        className="panel erp-tool erp-screen-preview"
        data-screen-preview={`${area}/${page}`}
        dir={locale === "ar" ? "rtl" : "ltr"}
      >
        <span className="badge badge-neutral">
          {t(
            "UI-only layout preview · synthetic directory",
            "معاينة هيكل واجهة فقط · دليل اصطناعي",
          )}
        </span>
        <h4>{pick(view.title, locale)}</h4>
        <p data-screen-evidence={view.evidence}>
          {t(
            "Grouped permissions reference supplied by the user, not independently viewed. Synthetic directory records and labels are BLACK X frontend adaptations.",
            "مرجع الصلاحيات المجمعة مقدم من المستخدم ولم يُشاهد مستقلاً. سجلات الدليل الاصطناعية وتسمياتها تكييفات لواجهة BLACK X.",
          )}
        </p>
        <p className="erp-boundary">{pick(view.dependency, locale)}</p>
        <ErpIdentityWorkspace
          locale={locale}
          initialMode={
            view.id === "roles" ? "roles" : area === "permissions" ? "assignments" : "users"
          }
        />
      </section>
    );
  }
  return (
    <section
      className="panel erp-tool erp-screen-preview"
      data-screen-preview={`${area}/${page}`}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header>
        <span className="badge badge-neutral">
          {t(
            "UI-only layout preview · backend-dependent",
            "معاينة هيكل واجهة فقط · تعتمد على الخادم",
          )}
        </span>
        <h3>{t("Detailed screen structures", "هياكل الشاشات التفصيلية")}</h3>
        <p>
          {t(
            "Repository-supported screen specifications and BLACK X construction adaptations; supplied recording descriptions were not independently viewed. Parameters inspect layout only, never query or save records. Explicitly labeled local exercises and existing fixtures remain separate previews.",
            "مواصفات شاشات يدعمها المستودع وتكييفات BLACK X للبناء؛ أوصاف التسجيل المقدمة لم تُشاهد مستقلاً. المعلمات لفحص الهيكل ولا تستعلم أو تحفظ سجلات. التمارين المحلية الموسومة صراحة والعينات الحالية معاينات منفصلة.",
          )}
        </p>
      </header>
      <div
        className="erp-screen-tabs"
        role="group"
        aria-label={t("Screen layouts within this route", "هياكل الشاشات ضمن هذا المسار")}
      >
        {views.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`btn btn-sm ${item.id === view.id ? "btn-primary" : "btn-outline"}`}
            aria-pressed={item.id === view.id}
            onClick={() => {
              setViewId(item.id);
              setDraft({});
              setFilters({});
              setChecked(false);
              setFilterChecked(false);
            }}
          >
            {pick(item.title, locale)}
          </button>
        ))}
      </div>
      <h4>{pick(view.title, locale)}</h4>
      {screenPurposes[view.id] ? <p>{pick(screenPurposes[view.id]!, locale)}</p> : null}
      <p data-screen-evidence={view.evidence}>
        {view.evidence === "visible"
          ? t(
              "Reference: described as visible in the supplied recording extraction. BLACK X labels, grouping and local validation are adaptations.",
              "المرجع: موصوف كعنصر ظاهر في استخلاص التسجيل المقدم. تسميات BLACK X والتجميع والتحقق المحلي تكييفات.",
            )
          : view.evidence === "adapted"
            ? t(
                "BLACK X construction-specific adaptation; not a claim of an identical legacy screen.",
                "تكييف خاص بالبناء والتشطيب في BLACK X؛ وليس ادعاء بوجود شاشة قديمة مطابقة.",
              )
            : t(
                "Unverified legacy behavior / conditional concept — no enabled BLACK X operation.",
                "سلوك قديم غير متحقق / مفهوم مشروط — لا توجد عملية مفعلة في BLACK X.",
              )}
      </p>
      <Link
        className="btn btn-ghost btn-sm"
        href={`${erpHref(locale, area, page)}?view=${view.id}`}
      >
        {t("Link to this layout", "رابط هذا الهيكل")}
      </Link>
      <p className="erp-boundary" id={`${id}-scope-note`}>
        {pick(view.dependency, locale)}
      </p>
      {view.id === "chart-of-accounts" ? (
        <ErpAccountHierarchy key={view.id} locale={locale} />
      ) : null}
      {view.id === "daily-journals" ? <ErpJournalWorkbench key={view.id} locale={locale} /> : null}
      {(
        ["purchase-invoices", "purchase-orders", "purchase-receipts", "purchase-returns"] as const
      ).map((mode) =>
        view.id === mode ? <ErpCostWorkbench key={mode} locale={locale} mode={mode} /> : null,
      )}
      {view.id === "financial-years" || view.id === "period-closing" ? (
        <ErpClosingRequirements locale={locale} />
      ) : null}
      {view.report ? <ErpReportTemplate view={view} locale={locale} /> : null}
      {view.filters.length ? (
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setFilterChecked(true);
          }}
          aria-label={t("Layout parameters only", "معلمات الهيكل فقط")}
        >
          <h4>
            {t(
              "Search / report parameters — no query execution",
              "معلمات البحث / التقرير — دون تنفيذ استعلام",
            )}
          </h4>
          <div className="erp-screen-grid">
            {controls(view.filters, filters, setFilters, "filter", filterErrors)}
          </div>
          <div className="erp-actions">
            <button type="submit" className="btn btn-outline btn-sm">
              {t("Check parameters locally", "تحقق من المعلمات محلياً")}
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setFilters({});
                setFilterChecked(false);
              }}
            >
              {t("Clear parameters", "مسح المعلمات")}
            </button>
          </div>
          {filterChecked ? (
            <p role="status">
              {Object.keys(filterErrors).length
                ? t(
                    "Parameter issues shown above. No report was generated.",
                    "تظهر مشكلات المعلمات أعلاه. لم يُنشأ تقرير.",
                  )
                : t(
                    "Local parameter check only; no records queried or report generated.",
                    "فحص معلمات محلي فقط؛ لم يُستعلم عن سجلات ولم يُنشأ تقرير.",
                  )}
            </p>
          ) : null}
        </form>
      ) : null}
      {view.summaries ? (
        <div className="erp-readiness">
          {view.summaries.map((key) => (
            <div key={key}>
              <h4>{pick(screenFields[key], locale)}</h4>
              <p>{t("Unknown — no authorized source", "غير معروف — لا يوجد مصدر مفوض")}</p>
            </div>
          ))}
        </div>
      ) : null}
      <div
        className="erp-table-scroll"
        role="region"
        tabIndex={0}
        aria-label={`${pick(view.title, locale)} — ${t("layout only", "هيكل فقط")}`}
      >
        <table>
          <caption>
            {t(
              "Column structure only — no connected register",
              "هيكل أعمدة فقط — لا يوجد سجل متصل",
            )}
          </caption>
          <thead>
            <tr>
              {view.columns.map((key) => (
                <th scope="col" key={key}>
                  {pick(screenFields[key], locale)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={view.columns.length} className="empty-state">
                {pick(view.title, locale)}:{" "}
                {t(
                  "No authorized records are connected. Filters cannot retrieve data. This is not a zero balance or an empty operational register.",
                  "لا توجد سجلات مفوضة متصلة. لا تسترجع المرشحات بيانات. هذا ليس رصيداً صفرياً أو سجلاً تشغيلياً فارغاً.",
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      {view.report ? (
        <p className="erp-boundary">
          {t(
            "Totals are not calculated. Print, CSV and Excel report exports are unavailable until an authorized report service exists. Navigation-metadata download is not a report export.",
            "لا تُحسب إجماليات. الطباعة وتصدير تقارير CSV وExcel غير متاحة حتى توجد خدمة تقارير مفوضة. تنزيل بيانات التنقل ليس تصدير تقرير.",
          )}
        </p>
      ) : null}
      {view.actions.length ? (
        <div
          className="erp-actions"
          aria-label={t("Unavailable primary actions", "الإجراءات الرئيسية غير المتاحة")}
        >
          {view.actions.slice(0, 2).map((label) => (
            <button key={label.en} type="button" className="btn btn-outline btn-sm" disabled>
              {pick(label, locale)} — {t("unavailable", "غير متاح")}
            </button>
          ))}
        </div>
      ) : null}
      {view.actions.length ? (
        <details>
          <summary>
            {t("Planned row actions — unavailable", "إجراءات الصف المقترحة — غير متاحة")}
          </summary>
          <ul>
            {view.actions.map((label) => (
              <li key={label.en}>
                {pick(label, locale)} — {t("no operation connected", "لا توجد عملية متصلة")}
              </li>
            ))}
          </ul>
        </details>
      ) : null}
      {view.draft.length ? (
        <details className="erp-screen-draft">
          <summary>
            {t("Inspect draft fields — local validation only", "فحص حقول المسودة — تحقق محلي فقط")}
          </summary>
          <form
            noValidate
            aria-label={t("Layout draft — not submitted", "مسودة هيكل — لا ترسل")}
            onSubmit={(e) => {
              e.preventDefault();
              setChecked(true);
            }}
          >
            <p>
              {t(
                "Required fields are marked *. Use synthetic values only. No passwords, tokens, bank credentials or real personal data. Lookup-backed fields remain unavailable. Nothing is uploaded, submitted or saved.",
                "الحقول المطلوبة بعلامة *. استخدم قيماً اختبارية فقط؛ دون كلمات مرور أو رموز أو بيانات بنكية سرية أو شخصية حقيقية. الحقول المعتمدة على مصادر غير متاحة. لا تُرفع بيانات ولا ترسل ولا تحفظ.",
              )}
            </p>
            <div className="erp-screen-grid">
              {controls(view.draft, draft, setDraft, "draft", errors)}
            </div>
            <div className="erp-actions">
              <button type="submit" className="btn btn-outline btn-sm">
                {t("Check draft fields locally", "تحقق من حقول المسودة محلياً")}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setDraft({});
                  setChecked(false);
                }}
              >
                {t("Discard local draft", "تجاهل المسودة المحلية")}
              </button>
            </div>
            {checked ? (
              <p role="status">
                {Object.keys(errors).length
                  ? t(
                      "Draft is incomplete or invalid. Nothing submitted or saved.",
                      "المسودة ناقصة أو غير صالحة. لم تُرسل أو تحفظ بيانات.",
                    )
                  : t(
                      "Local field checks only — not business validation, approval or a saved record.",
                      "فحص حقول محلي فقط — ليس تحقق أعمال أو اعتماداً أو سجلاً محفوظاً.",
                    )}
              </p>
            ) : null}
          </form>
        </details>
      ) : null}
      {view.sensitive ? (
        <details className="erp-screen-history">
          <summary>
            {t(
              "Inspect prerequisites and audit/history requirements",
              "فحص المتطلبات ومتطلبات التدقيق والتاريخ",
            )}
          </summary>
          <ul>
            <li>
              {t(
                "Server authorization and current record/version checks are required; UI controls do not grant authority.",
                "يلزم تفويض الخادم وفحص السجل وإصداره؛ عناصر الواجهة لا تمنح سلطة.",
              )}
            </li>
            <li>
              {t(
                "Before any sensitive action: show the exact target and impact, require confirmation, then atomically record approved actor/time/history. None of these operations run here.",
                "قبل أي إجراء حساس: عرض الهدف والأثر بدقة وطلب التأكيد ثم تسجيل المنفذ والوقت والتاريخ ذرياً. لا تُنفذ هذه العمليات هنا.",
              )}
            </li>
            <li>
              {t(
                "Historical records must be retained. No close, reopen, restore, archive, grant, revocation or deletion is performed. No history is fabricated.",
                "يجب الاحتفاظ بالسجلات التاريخية. لا يُنفذ إقفال أو إعادة فتح أو استعادة أو أرشفة أو منح أو إلغاء أو حذف. لا يُختلق تاريخ.",
              )}
            </li>
          </ul>
        </details>
      ) : null}
      <small>
        {t(
          "Unverified: original button execution, backend results, detailed business rules and unseen screens. This preview does not establish any of them.",
          "غير متحقق: تنفيذ الأزرار الأصلية ونتائج الخادم وقواعد الأعمال التفصيلية والشاشات غير المرئية؛ هذه المعاينة لا تثبت أياً منها.",
        )}
      </small>
    </section>
  );
}
