"use client";
import { useId, useState } from "react";
import type { Locale } from "@/lib/i18n";
import {
  previewAmount,
  previewDecimal,
  previewJournal,
  previewLineTotal,
  type PreviewCostLine,
  type PreviewJournalLine,
} from "@/lib/erp-local-calculations";

function Boundary({ locale }: { locale: Locale }) {
  return (
    <p className="erp-boundary">
      {locale === "ar"
        ? "تمرين محلي بقيم اصطناعية تدخلها فقط؛ لا يتصل بسجلات أو حسابات فعلية، ولا يحفظ مستنداً أو يرحل قيداً أو يحرك مخزوناً أو ينشئ التزاماً. تختفي المدخلات عند مغادرة المعاينة. استخدم النقطة أو الفاصل العشري العربي دون فواصل آلاف."
        : "Local exercise using only synthetic values you enter. No real records or accounts, document saving, journal posting, stock movement or liability creation. Inputs disappear when leaving the preview. Use a decimal point or Arabic decimal mark, without grouping separators."}
    </p>
  );
}
export function ErpJournalWorkbench({ locale }: { locale: Locale }) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const blank = (): PreviewJournalLine => ({ account: "", description: "", debit: "", credit: "" });
  const [lines, setLines] = useState(() => [blank(), blank()]);
  const [checked, setChecked] = useState(false);
  const id = useId();
  const result = checked ? previewJournal(lines) : null;
  return (
    <section
      className="erp-local-workbench"
      data-local-journal
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <h4>{t("Journal arithmetic — local preview only", "حساب القيد — معاينة محلية فقط")}</h4>
      <Boundary locale={locale} />
      <p>
        {t(
          "Use at least two described lines, one positive debit OR credit per line, up to two decimal places. Blank opposite side means zero for this exercise only. Account labels are free synthetic text, not validated account codes. No opening or company balance is inferred.",
          "أدخل سطرين موصوفين على الأقل، ومديناً أو دائناً موجباً واحداً لكل سطر، بمنزلتين عشريتين كحد أقصى. الطرف المقابل الفارغ يعامل كصفر لهذا التمرين فقط. أسماء الحسابات نصوص اصطناعية وليست أكواداً متحققة. لا يُستنتج رصيد افتتاحي أو رصيد شركة.",
        )}
      </p>
      <form
        noValidate
        aria-label={t("Synthetic journal lines", "سطور قيد اصطناعية")}
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
      >
        <div className="erp-workbench-lines">
          {lines.map((line, index) => (
            <fieldset key={index}>
              <legend>
                {t("Preview line", "سطر تجريبي")} {index + 1}
              </legend>
              <div className="erp-screen-grid">
                {(["account", "description", "debit", "credit"] as const).map((key) => (
                  <label key={key} htmlFor={`${id}-${index}-${key}`}>
                    {
                      {
                        account: t("Synthetic account label", "اسم حساب اصطناعي"),
                        description: t("Line description", "وصف السطر"),
                        debit: t("Preview debit", "مدين تجريبي"),
                        credit: t("Preview credit", "دائن تجريبي"),
                      }[key]
                    }
                    <input
                      id={`${id}-${index}-${key}`}
                      className="form-input"
                      inputMode={key === "debit" || key === "credit" ? "decimal" : "text"}
                      maxLength={key === "description" ? 160 : 80}
                      value={line[key]}
                      onChange={(e) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, [key]: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  setLines((current) => current.filter((_, i) => i !== index));
                  e.currentTarget.form
                    ?.querySelector<HTMLButtonElement>('button[type="submit"]')
                    ?.focus();
                }}
              >
                {t("Remove preview line", "حذف السطر التجريبي")} {index + 1}
              </button>
            </fieldset>
          ))}
        </div>
        <div className="erp-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={lines.length >= 20}
            onClick={() => setLines((current) => [...current, blank()])}
          >
            {t("Add journal line", "إضافة سطر قيد")}
          </button>
          <button type="submit" className="btn btn-outline btn-sm">
            {t("Check displayed-input balance", "فحص توازن المدخلات الظاهرة")}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setLines([blank(), blank()]);
              setChecked(false);
            }}
          >
            {t("Clear journal exercise", "مسح تمرين القيد")}
          </button>
        </div>
        {checked ? (
          <div role={result ? "status" : "alert"} className="erp-workbench-result">
            {result ? (
              <>
                <dl className="erp-detail-list">
                  {[
                    [t("Preview total debit", "إجمالي المدين التجريبي"), result.debit],
                    [t("Preview total credit", "إجمالي الدائن التجريبي"), result.credit],
                    [t("Debit minus credit", "المدين ناقص الدائن"), result.difference],
                  ].map(([label, value]) => (
                    <div key={String(label)}>
                      <dt>{String(label)}</dt>
                      <dd>
                        <bdi dir="ltr">{previewAmount(value as bigint)}</bdi>
                      </dd>
                    </div>
                  ))}
                </dl>
                <strong>
                  {result.balanced
                    ? t(
                        "Balanced arithmetic only — not postable",
                        "توازن حسابي فقط — غير قابل للترحيل",
                      )
                    : t(
                        "Unbalanced preview — revise the displayed lines",
                        "معاينة غير متوازنة — راجع السطور الظاهرة",
                      )}
                </strong>
              </>
            ) : (
              t(
                "Check at least two described account lines. Each needs a positive debit or credit, never both. Non-negative decimals only, maximum nine whole digits and two decimal places. No totals calculated from invalid inputs.",
                "راجع سطرين موصوفين بحسابات على الأقل؛ يتطلب كل سطر مديناً أو دائناً موجباً وليس كليهما. أرقام غير سالبة بحد أقصى تسع خانات صحيحة ومنزلتين عشريتين. لا تُحسب إجماليات للمدخلات غير الصالحة.",
              )
            )}
          </div>
        ) : null}
      </form>
    </section>
  );
}
export function ErpCostWorkbench({
  locale,
  mode,
}: {
  locale: Locale;
  mode: "boq" | "purchase-invoices" | "purchase-orders" | "purchase-receipts" | "purchase-returns";
}) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const blank = (): PreviewCostLine => ({
    description: "",
    quantity: "",
    unit: "",
    price: "",
    discount: "0",
    allocation: "",
    expected: "",
  });
  const [lines, setLines] = useState(() => [blank()]);
  const [checked, setChecked] = useState(false);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const id = useId();
  const receipt = mode === "purchase-receipts";
  const returned = mode === "purchase-returns";
  const results = lines.map(previewLineTotal);
  const discrepancies = lines.map((line) => {
    const expected = previewDecimal(line.expected, 3),
      received = previewDecimal(line.quantity, 3);
    return expected === null || received === null ? null : received - expected;
  });
  const valid =
    lines.length > 0 &&
    results.every((value) => value !== null) &&
    (!receipt || discrepancies.every((value) => value !== null)) &&
    (!returned || Boolean(reference.trim() && note.trim()));
  const total = valid ? results.reduce<bigint>((sum, value) => sum + value!, 0n) : null;
  const title =
    mode === "boq"
      ? t("BOQ / quotation arithmetic — local preview", "حساب المقايسة / العرض — معاينة محلية")
      : mode === "purchase-orders"
        ? t("Purchase-order line exercise", "تمرين بنود أمر الشراء")
        : receipt
          ? t("Receipt quantities and discrepancy exercise", "تمرين كميات الاستلام والفروق")
          : returned
            ? t(
                "Return quantities and original-reference exercise",
                "تمرين كميات المرتجع ومرجع الأصل",
              )
            : t("Purchase-invoice line exercise", "تمرين بنود فاتورة الشراء");
  return (
    <section
      className="erp-local-workbench"
      data-local-cost={mode}
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <h4>{title}</h4>
      <Boundary locale={locale} />
      <p>
        {t(
          "Line total = quantity × unit price × (1 − discount / 100). Quantity: up to 3 decimals; price: 2; discount: 0–100 with 2. Each line rounds half-up to 2 decimals, then totals are summed. Amounts are illustrative units, not a currency or company balance. Tax, fees and stock valuation are excluded. Up to 20 lines.",
          "إجمالي السطر = الكمية × سعر الوحدة × (1 − الخصم / 100). الكمية حتى 3 منازل عشرية، والسعر منزلتان، والخصم 0–100 بمنزلتين. يُقرب كل سطر نصفياً للأعلى إلى منزلتين ثم تُجمع الإجماليات. المبالغ وحدات توضيحية وليست عملة أو رصيد شركة. لا تشمل الضرائب أو الرسوم أو تقييم المخزون. حتى 20 سطراً.",
        )}
      </p>
      <form
        noValidate
        aria-label={title}
        onSubmit={(e) => {
          e.preventDefault();
          setChecked(true);
        }}
      >
        {returned ? (
          <label>
            {t("Synthetic original document reference", "مرجع مستند أصلي اصطناعي")}
            <input
              className="form-input"
              maxLength={80}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
        ) : null}
        <div className="erp-workbench-lines">
          {lines.map((line, index) => (
            <fieldset key={index}>
              <legend>
                {t("Preview line", "سطر تجريبي")} {index + 1}
              </legend>
              <div className="erp-screen-grid">
                {(
                  [
                    "description",
                    "quantity",
                    "unit",
                    "price",
                    "discount",
                    "allocation",
                    ...(receipt ? ["expected" as const] : []),
                  ] as const
                ).map((key) => (
                  <label key={key} htmlFor={`${id}-${index}-${key}`}>
                    {
                      {
                        description: t("Synthetic item description", "وصف بند اصطناعي"),
                        quantity: receipt
                          ? t("Received quantity", "الكمية المستلمة")
                          : returned
                            ? t("Returned quantity", "الكمية المرتجعة")
                            : t("Quantity", "الكمية"),
                        unit: t("Unit", "الوحدة"),
                        price: t("Unit price / cost", "سعر / تكلفة الوحدة"),
                        discount: t("Discount %", "الخصم ٪"),
                        allocation: t(
                          "Synthetic project / phase allocation — optional",
                          "توزيع مشروع / مرحلة اصطناعي — اختياري",
                        ),
                        expected: t("Expected quantity", "الكمية المتوقعة"),
                      }[key]
                    }
                    <input
                      id={`${id}-${index}-${key}`}
                      className="form-input"
                      inputMode={
                        ["quantity", "price", "discount", "expected"].includes(key)
                          ? "decimal"
                          : "text"
                      }
                      maxLength={key === "description" ? 160 : 80}
                      value={line[key]}
                      onChange={(e) =>
                        setLines((current) =>
                          current.map((item, i) =>
                            i === index ? { ...item, [key]: e.target.value } : item,
                          ),
                        )
                      }
                    />
                  </label>
                ))}
              </div>
              {checked && valid ? (
                <p>
                  {t("Calculated preview line total", "إجمالي السطر التجريبي المحسوب")}:{" "}
                  <bdi dir="ltr">{previewAmount(results[index]!)}</bdi>
                  {receipt ? (
                    <>
                      {" "}
                      · {t("Received minus expected", "المستلم ناقص المتوقع")}:{" "}
                      <bdi dir="ltr">{previewAmount(discrepancies[index]!, 3)}</bdi>
                    </>
                  ) : null}
                </p>
              ) : null}
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  setLines((current) => current.filter((_, i) => i !== index));
                  e.currentTarget.form
                    ?.querySelector<HTMLButtonElement>('button[type="submit"]')
                    ?.focus();
                }}
              >
                {t("Remove preview line", "حذف السطر التجريبي")} {index + 1}
              </button>
            </fieldset>
          ))}
        </div>
        <label>
          {returned
            ? t("Return reason — synthetic and internal only", "سبب المرتجع — اصطناعي وداخلي فقط")
            : t(
                "Internal exercise note — never customer-visible or sent",
                "ملاحظة التمرين الداخلية — لا تظهر للعميل ولا تُرسل",
              )}
          <textarea
            className="form-input"
            maxLength={1000}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
        <div className="erp-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            disabled={lines.length >= 20}
            onClick={() => setLines((current) => [...current, blank()])}
          >
            {t("Add cost line", "إضافة بند تكلفة")}
          </button>
          <button type="submit" className="btn btn-outline btn-sm">
            {t("Calculate displayed inputs only", "حساب المدخلات الظاهرة فقط")}
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setLines([blank()]);
              setReference("");
              setNote("");
              setChecked(false);
            }}
          >
            {t("Clear line exercise", "مسح تمرين البنود")}
          </button>
        </div>
        {checked ? (
          <p role={valid ? "status" : "alert"} className="erp-workbench-result">
            {total !== null ? (
              <>
                {t(
                  "Calculated preview total — no tax or posting",
                  "الإجمالي التجريبي المحسوب — دون ضريبة أو ترحيل",
                )}
                : <bdi dir="ltr">{previewAmount(total)}</bdi>
              </>
            ) : (
              t(
                "Use at least one described line with a unit, positive quantity, non-negative price and discount of 0–100. Maximum nine whole digits. Receipts also need expected quantities; returns need an original reference and reason. No total from invalid inputs.",
                "أدخل سطراً موصوفاً ووحدة وكمية موجبة وسعراً غير سالب وخصماً من 0 إلى 100؛ بحد أقصى تسع خانات صحيحة. الاستلام يتطلب الكميات المتوقعة، والمرتجع مرجع الأصل والسبب. لا يُحسب إجمالي لمدخلات غير صالحة.",
              )
            )}
          </p>
        ) : null}
      </form>
    </section>
  );
}
