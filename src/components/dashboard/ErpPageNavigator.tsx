import Link from "next/link";
import { erpHref, type ErpModule } from "@/config/erp";
import { pick, type Locale } from "@/lib/i18n";

/** Presentation-only orientation across the original catalogue. */
export function ErpPageNavigator({
  module,
  pageId,
  locale,
}: {
  module: ErpModule;
  pageId: string;
  locale: Locale;
}) {
  const index = module.pages.findIndex((p) => p.id === pageId);
  const previous = module.pages[index - 1],
    next = module.pages[index + 1];
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  return (
    <nav className="erp-page-context" aria-label={t("Pages in this module", "صفحات هذه الوحدة")}>
      <span>
        <bdi dir="ltr">{module.id}</bdi> · {index + 1} / {module.pages.length}
      </span>
      <div>
        {previous ? (
          <Link
            href={erpHref(locale, module.id, previous.id)}
            rel="prev"
            aria-label={`${t("Previous", "السابق")}: ${pick(previous.title, locale)}`}
            title={pick(previous.title, locale)}
          >
            {t("Previous page", "الصفحة السابقة")}
          </Link>
        ) : null}
        <Link href={erpHref(locale, module.id)}>{t("Module directory", "دليل الوحدة")}</Link>
        {next ? (
          <Link
            href={erpHref(locale, module.id, next.id)}
            rel="next"
            aria-label={`${t("Next", "التالي")}: ${pick(next.title, locale)}`}
            title={pick(next.title, locale)}
          >
            {t("Next page", "الصفحة التالية")}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
