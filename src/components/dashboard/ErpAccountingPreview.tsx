"use client";
import { useState } from "react";
import { pick, type Locale, type LocalizedText } from "@/lib/i18n";
const text = (en: string, ar: string): LocalizedText => ({ en, ar });
const accounts = [
  {
    id: "DEMO-A",
    parent: "",
    name: text("Illustrative assets group", "مجموعة أصول توضيحية"),
    type: "asset",
    status: "active",
  },
  {
    id: "DEMO-A1",
    parent: "DEMO-A",
    name: text("Illustrative cash account", "حساب نقد توضيحي"),
    type: "asset",
    status: "active",
  },
  {
    id: "DEMO-A2",
    parent: "DEMO-A",
    name: text("Illustrative archived subaccount", "حساب فرعي مؤرشف توضيحي"),
    type: "asset",
    status: "inactive",
  },
  {
    id: "DEMO-L",
    parent: "",
    name: text("Illustrative liabilities group", "مجموعة التزامات توضيحية"),
    type: "liability",
    status: "active",
  },
  {
    id: "DEMO-L1",
    parent: "DEMO-L",
    name: text("Illustrative payable account", "حساب دائن توضيحي"),
    type: "liability",
    status: "active",
  },
  {
    id: "DEMO-E",
    parent: "",
    name: text("Illustrative expense group", "مجموعة مصروفات توضيحية"),
    type: "expense",
    status: "active",
  },
] as const;
export function ErpAccountHierarchy({ locale }: { locale: Locale }) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState("");
  const q = query.trim().toLocaleLowerCase();
  const matches = accounts.filter(
    (a) =>
      (!type || a.type === type) &&
      (!status || a.status === status) &&
      `${a.id} ${a.name.en} ${a.name.ar}`.toLocaleLowerCase().includes(q),
  );
  const visible = new Set(matches.flatMap((a) => [a.id, a.parent]));
  const detail = accounts.find((a) => a.id === selected);
  const typeLabel = (value: string) =>
    value === "asset"
      ? t("Asset", "أصل")
      : value === "liability"
        ? t("Liability", "التزام")
        : t("Expense", "مصروف");
  const statusLabel = (value: string) =>
    value === "active" ? t("Active example", "مثال نشط") : t("Inactive example", "مثال غير نشط");
  function nodes(parent: string) {
    return (
      <ul>
        {accounts
          .filter((a) => a.parent === parent && visible.has(a.id))
          .map((a) => (
            <li key={a.id}>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                aria-pressed={selected === a.id}
                onClick={() => setSelected(a.id)}
              >
                <bdi dir="ltr">{a.id}</bdi> · {pick(a.name, locale)} · {statusLabel(a.status)}
              </button>
              {accounts.some((child) => child.parent === a.id && visible.has(child.id)) ? (
                <details open>
                  <summary>{t("Matching subaccounts", "الحسابات الفرعية المطابقة")}</summary>
                  {nodes(a.id)}
                </details>
              ) : null}
            </li>
          ))}
      </ul>
    );
  }
  return (
    <section
      className="erp-local-workbench"
      data-account-hierarchy
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <h4>
        {t(
          "Illustrative hierarchy explorer — not the company chart",
          "مستعرض شجرة توضيحية — ليست شجرة الشركة",
        )}
      </h4>
      <p className="erp-boundary">
        {t(
          "Six synthetic nodes demonstrate parent/child navigation, filtering and detail inspection. No approved chart, account mapping, balance or posting permission is implied. Matches retain their ancestors; detail remains inspectable if a filter hides its node.",
          "ست عقد اصطناعية لعرض التنقل بين الأصل والفرع والترشيح وفحص التفاصيل. لا يُقصد بها شجرة معتمدة أو ربط حسابات أو أرصدة أو صلاحية ترحيل. تُبقي المطابقات على أصولها؛ تظل التفاصيل قابلة للفحص إذا أخفى المرشح العقدة.",
        )}
      </p>
      <div className="erp-filterbar">
        <label>
          {t("Search example account", "بحث في حساب توضيحي")}
          <input
            className="form-input"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          {t("Example account type", "نوع الحساب التوضيحي")}
          <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">{t("All types", "كل الأنواع")}</option>
            {["asset", "liability", "expense"].map((value) => (
              <option key={value} value={value}>
                {typeLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("Example account status", "حالة الحساب التوضيحي")}
          <select
            className="form-select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">{t("All statuses", "كل الحالات")}</option>
            {["active", "inactive"].map((value) => (
              <option key={value} value={value}>
                {statusLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setQuery("");
            setType("");
            setStatus("");
          }}
        >
          {t("Clear hierarchy filters", "مسح مرشحات الشجرة")}
        </button>
      </div>
      <p role="status">
        {matches.length}{" "}
        {t(
          "matching synthetic nodes (ancestors not counted)",
          "عقد اصطناعية مطابقة (دون احتساب الأصول)",
        )}
      </p>
      {matches.length ? (
        <nav
          className="erp-account-hierarchy"
          aria-label={t("Synthetic account hierarchy", "شجرة حسابات اصطناعية")}
        >
          {nodes("")}
        </nav>
      ) : (
        <p className="empty-state">
          {t(
            "No synthetic nodes match these filters.",
            "لا توجد عقد اصطناعية مطابقة لهذه المرشحات.",
          )}
        </p>
      )}
      {detail ? (
        <aside
          className="erp-workbench-result"
          aria-label={t("Selected illustrative account", "الحساب التوضيحي المحدد")}
        >
          <h5>{pick(detail.name, locale)}</h5>
          <dl className="erp-detail-list">
            {[
              [t("Code", "الكود"), detail.id],
              [t("Parent", "الأصل"), detail.parent || t("Root example", "مثال جذر")],
              [t("Type", "النوع"), typeLabel(detail.type)],
              [t("Level", "المستوى"), detail.parent ? "2" : "1"],
              [t("Status", "الحالة"), statusLabel(detail.status)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={(event) => {
              const host = event.currentTarget.closest("[data-account-hierarchy]");
              const selectedNode = host?.querySelector<HTMLButtonElement>(
                'button[aria-pressed="true"]',
              );
              setSelected("");
              if (selectedNode && !selectedNode.closest("details:not([open])"))
                selectedNode.focus();
              else host?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
            }}
          >
            {t("Close account inspection", "إغلاق فحص الحساب")}
          </button>
        </aside>
      ) : null}
    </section>
  );
}
export function ErpClosingRequirements({ locale }: { locale: Locale }) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  return (
    <aside className="erp-local-workbench" data-closing-prerequisites>
      <h4>
        {t(
          "Read-only closing prerequisites — never a readiness approval",
          "متطلبات إقفال للقراءة فقط — ليست اعتماد جاهزية",
        )}
      </h4>
      <ul>
        {[
          t("Approved year and period calendar", "تقويم سنة وفترات معتمد"),
          t(
            "Authorized unposted/unbalanced journal review",
            "مراجعة مفوضة للقيود غير المرحلة وغير المتوازنة",
          ),
          t("Reconciliations and tax/closing rules", "التسويات وقواعد الضريبة والإقفال"),
          t(
            "Approver identity and immutable audit evidence",
            "هوية المعتمد ودليل تدقيق غير قابل للتعديل",
          ),
          t("Verified close/reopen history and safeguards", "تاريخ إقفال وإعادة فتح وضوابط متحققة"),
        ].map((label) => (
          <li key={label}>
            {label} —{" "}
            <strong>{t("Unknown: source unavailable", "غير معروف: المصدر غير متاح")}</strong>
          </li>
        ))}
      </ul>
      <p>
        {t(
          "No period status, unposted count or closing result can be inferred from this checklist or the local journal exercise.",
          "لا يمكن استنتاج حالة فترة أو عدد قيود غير مرحلة أو نتيجة إقفال من هذه القائمة أو تمرين القيد المحلي.",
        )}
      </p>
    </aside>
  );
}
