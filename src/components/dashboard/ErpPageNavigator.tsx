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
          <Link href={erpHref(locale, module.id, previous.id)} rel="prev">
            {t("Previous", "السابق")}: {pick(previous.title, locale)}
          </Link>
        ) : null}
        <Link href={erpHref(locale, module.id)}>{t("Module directory", "دليل الوحدة")}</Link>
        {next ? (
          <Link href={erpHref(locale, module.id, next.id)} rel="next">
            {t("Next", "التالي")}: {pick(next.title, locale)}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
