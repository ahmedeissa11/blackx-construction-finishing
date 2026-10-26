import { pick, type Locale, type LocalizedText } from "@/lib/i18n";
import type { ScreenView } from "@/config/erp-screen-specs";
const text = (en: string, ar: string): LocalizedText => ({ en, ar });
const templates: Record<
  string,
  { title: LocalizedText; sections: LocalizedText[]; note: LocalizedText }
> = {
  "balance-sheet": {
    title: text("Financial position structure", "هيكل المركز المالي"),
    sections: [
      text("Assets classification", "تصنيف الأصول"),
      text("Liabilities classification", "تصنيف الالتزامات"),
      text("Equity classification", "تصنيف حقوق الملكية"),
    ],
    note: text(
      "Approved account mapping and an as-of date are required. No assets, liabilities, equity or balancing equation is supplied.",
      "يتطلب ربط حسابات معتمداً وتاريخ مركز مالي؛ لا تُعرض قيم أصول أو التزامات أو حقوق ملكية أو معادلة توازن.",
    ),
  },
  "income-statement": {
    title: text("Income statement sections", "أقسام قائمة الدخل"),
    sections: [
      text("Revenue classification", "تصنيف الإيرادات"),
      text("Direct costs and operating expenses", "التكاليف المباشرة والمصروفات التشغيلية"),
      text("Result of operations — unknown", "نتيجة العمليات — غير معروفة"),
    ],
    note: text(
      "Period and approved account mapping are prerequisites; there is no computed profit, loss or fabricated revenue.",
      "الفترة وربط الحسابات المعتمد متطلبان أساسيان؛ لا يُحسب ربح أو خسارة ولا تُختلق إيرادات.",
    ),
  },
  "general-budget": {
    title: text(
      "Budget comparison structure — not a balance sheet",
      "هيكل مقارنة الموازنة — ليست ميزانية عمومية",
    ),
    sections: [
      text("Approved budget source", "مصدر الموازنة المعتمد"),
      text("Actual ledger source", "مصدر القيم الفعلية من الدفتر"),
      text("Variance mapping and period", "ربط الانحرافات والفترة"),
    ],
    note: text(
      "Budget versions and actuals are unavailable. No variance, remaining allowance or spending authorization is calculated.",
      "إصدارات الموازنة والقيم الفعلية غير متاحة؛ لا يُحسب انحراف أو مخصص متبقٍ أو تفويض إنفاق.",
    ),
  },
  "trial-balance": {
    title: text("Trial-balance column groups", "مجموعات أعمدة ميزان المراجعة"),
    sections: [
      text("Opening debit / credit", "المدين / الدائن الافتتاحي"),
      text("Period debit / credit movement", "حركة مدين / دائن الفترة"),
      text("Closing debit / credit", "المدين / الدائن الختامي"),
    ],
    note: text(
      "A connected ledger is required for all six amount columns. Equal columns, no movement and zero balances are not inferred.",
      "يتطلب كل عمود من الأعمدة الستة مصدراً دفترياً متصلاً؛ لا يُستنتج تساوي الأعمدة أو انعدام الحركة أو أرصدة صفرية.",
    ),
  },
  "account-statement": {
    title: text("Single-account statement structure", "هيكل كشف حساب واحد"),
    sections: [
      text("Opening position — unknown", "المركز الافتتاحي — غير معروف"),
      text("Dated debit/credit entries", "حركات مدين ودائن مؤرخة"),
      text("Closing position — unknown", "المركز الختامي — غير معروف"),
    ],
    note: text(
      "Select an authorized account and period once a source exists. Running balances and counterparties are unavailable.",
      "يُحدد حساب مفوض وفترة عند توفر المصدر؛ الأرصدة المتحركة والأطراف المقابلة غير متاحة.",
    ),
  },
  "general-ledger": {
    title: text("Account-grouped ledger structure", "هيكل دفتر أستاذ مجمع بالحساب"),
    sections: [
      text("Account grouping", "التجميع بالحساب"),
      text("Document-level movement", "الحركة على مستوى المستند"),
      text("Per-account carry-forward", "الرصيد المنقول لكل حساب"),
    ],
    note: text(
      "Account groups and document provenance are not connected. This is not an aggregated customer or supplier fixture ledger.",
      "مجموعات الحسابات ومصادر المستندات غير متصلة؛ هذا ليس تجميعاً لعينات العملاء أو الموردين في دفتر.",
    ),
  },
  "tax-reports": {
    title: text("Tax classification review structure", "هيكل مراجعة التصنيف الضريبي"),
    sections: [
      text("Jurisdiction and approved rules", "الاختصاص والقواعد المعتمدة"),
      text("Classified source documents", "المستندات المصدرية المصنفة"),
      text("Filing period and evidence", "فترة الإقرار والأدلة"),
    ],
    note: text(
      "No rate, taxable base, liability, filing or jurisdiction is assumed or calculated.",
      "لا تُفترض أو تُحسب نسبة أو وعاء ضريبي أو التزام أو إقرار أو اختصاص ضريبي.",
    ),
  },
};
export function ErpReportTemplate({ view, locale }: { view: ScreenView; locale: Locale }) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const template = templates[view.id];
  const sections =
    template?.sections ??
    (view.id.startsWith("cost-center")
      ? [
          text("Cost-center grouping", "التجميع بمركز التكلفة"),
          text("Authorized project/account allocation", "توزيع المشروع / الحساب المفوض"),
        ]
      : [
          view.title,
          text("Source documents and scope", "المستندات المصدرية والنطاق"),
          text("Period and approval evidence", "الفترة ودليل الاعتماد"),
        ]);
  return (
    <aside
      className="erp-report-template"
      data-report-template={view.id}
      aria-label={`${pick(view.title, locale)} — ${t("report structure", "هيكل التقرير")}`}
    >
      <h4>
        {template
          ? pick(template.title, locale)
          : t("Purpose-specific report scope", "نطاق التقرير المتخصص")}
      </h4>
      <div className="erp-readiness">
        {sections.map((section) => (
          <section key={section.en}>
            <h5>{pick(section, locale)}</h5>
            <p>
              {t(
                "Not supplied — requires authorized source and mapping",
                "غير مقدم — يتطلب مصدراً وربطاً مفوضين",
              )}
            </p>
          </section>
        ))}
      </div>
      <p>
        {template
          ? pick(template.note, locale)
          : t(
              "Only the columns and parameter checks below are available. Scope does not combine unrelated fixtures or imply financial, stock or quality totals.",
              "المتاح هو الأعمدة وفحص المعلمات أدناه فقط؛ لا يجمع النطاق عينات غير مرتبطة ولا يوحي بإجماليات مالية أو مخزنية أو جودة.",
            )}
      </p>
    </aside>
  );
}
