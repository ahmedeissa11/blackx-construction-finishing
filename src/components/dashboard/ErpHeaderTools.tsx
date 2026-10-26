"use client";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { erpHref } from "@/config/erp";

export function ErpHeaderTools({
  locale,
  compact,
  onCompactChange,
}: {
  locale: Locale;
  compact: boolean;
  onCompactChange: () => void;
}) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  return (
    <span className="erp-header-tools">
      <Link className="btn btn-ghost btn-sm" href={erpHref(locale, "administration", "session")}>
        {t("Access information", "معلومات الوصول")}
      </Link>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        aria-pressed={compact}
        onClick={onCompactChange}
        title={t("Temporary screen density; not saved", "كثافة عرض مؤقتة؛ لا تُحفظ")}
      >
        {t("Compact layouts", "هياكل مدمجة")}
      </button>
      <Link className="btn btn-ghost btn-sm" href={`${erpHref(locale)}#erp-system-guide`}>
        {t("System guide", "دليل النظام")}
      </Link>
      <button
        type="button"
        className="btn btn-ghost btn-sm"
        disabled
        title={t("No marketplace or add-on purchase service", "لا توجد خدمة متجر أو شراء إضافات")}
      >
        {t("Marketplace — unavailable", "المتجر — غير متاح")}
      </button>
    </span>
  );
}
