import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { dashboardHref } from "@/config/navigation";
import { getExpansionOverview } from "@/lib/preview-expansion";
import { formatMoney, formatNumber } from "@/lib/format";

/**
 * Finance and customer-service summary on the Admin overview. Figures
 * are computed from the records currently shown in the workspace
 * (isolated presentation fixtures anchored to the review snapshot
 * date) and each one links to its responsible module; they are not
 * presented as current company performance.
 */
export function OverviewExpansion({ locale, appDict }: { locale: Locale; appDict: AppDictionary }) {
  const cards = appDict.dashboard.expansion.overviewCards;
  const summary = getExpansionOverview();

  const items: Array<{ label: string; value: string; href: string }> = [
    {
      label: cards.outstanding,
      value: formatMoney(summary.outstandingTotal, locale),
      href: dashboardHref(locale, "finance"),
    },
    {
      label: cards.overdue,
      value: formatMoney(summary.overdueTotal, locale),
      href: dashboardHref(locale, "finance"),
    },
    {
      label: cards.collected,
      value: formatMoney(summary.collectedTotal, locale),
      href: dashboardHref(locale, "finance"),
    },
    {
      label: cards.expenses,
      value: formatMoney(summary.expensesTotal, locale),
      href: dashboardHref(locale, "finance"),
    },
    {
      label: cards.purchasesPayable,
      value: formatMoney(summary.purchasesPayable, locale),
      href: dashboardHref(locale, "purchases"),
    },
    {
      label: cards.openComplaints,
      value: formatNumber(summary.openComplaints, locale),
      href: dashboardHref(locale, "complaints"),
    },
    {
      label: cards.newMessages,
      value: formatNumber(summary.newMessages, locale),
      href: dashboardHref(locale, "messages"),
    },
    {
      label: cards.activePhases,
      value: formatNumber(summary.activePhases, locale),
      href: dashboardHref(locale, "projects"),
    },
  ];

  return (
    <section className="panel overview-expansion" aria-labelledby="overview-expansion-title">
      <div className="panel-head">
        <h3 id="overview-expansion-title" style={{ fontSize: "1.05rem" }}>
          {cards.title}
        </h3>
      </div>
      <div className="panel-body">
        <p style={{ color: "var(--color-muted)", maxWidth: 980 }}>{cards.asOfNote}</p>
        <div className="domain-stats overview-expansion-stats" role="list">
          {items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="domain-stat overview-expansion-stat"
              role="listitem"
            >
              <span>{item.label}</span>
              <strong dir="ltr">{item.value}</strong>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
