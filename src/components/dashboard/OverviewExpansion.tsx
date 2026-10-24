import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { dashboardHref } from "@/config/navigation";
import { getAgingBuckets, getExpansionOverview } from "@/lib/preview-expansion";
import { formatMoney, formatNumber } from "@/lib/format";
import { BarRows, Donut, StackedBar } from "@/components/ui/Viz";

/**
 * Finance and customer-service summary on the Admin overview. Figures
 * are computed from the records currently shown in the workspace
 * (isolated presentation fixtures anchored to the review snapshot
 * date) and each one links to its responsible module; they are not
 * presented as current company performance.
 */
export function OverviewExpansion({ locale, appDict }: { locale: Locale; appDict: AppDictionary }) {
  const cards = appDict.dashboard.expansion.overviewCards;
  const agingLabels = appDict.dashboard.expansion.finance.aging;
  const summary = getExpansionOverview();
  const aging = getAgingBuckets();

  const duesBasis = summary.collectedTotal + summary.outstandingTotal;
  const collectionRate = duesBasis > 0 ? Math.round((summary.collectedTotal / duesBasis) * 100) : 0;
  const maxAgingAmount = Math.max(1, ...aging.map((bucket) => bucket.amount));
  const agingTones = {
    current: "ok",
    d1_30: "warn",
    d31_60: "warn",
    d61_90: "danger",
    d90plus: "danger",
  } as const;

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
        <div className="viz-finance-grid">
          <div className="viz-finance-donut">
            <Donut value={collectionRate} locale={locale} label={cards.collectionRate} />
            <StackedBar
              ariaLabel={cards.title}
              segments={[
                {
                  key: "collected",
                  label: cards.collected,
                  valueLabel: formatMoney(summary.collectedTotal, locale),
                  ratio: duesBasis > 0 ? summary.collectedTotal / duesBasis : 0,
                  tone: "ok",
                },
                {
                  key: "outstanding",
                  label: cards.outstanding,
                  valueLabel: formatMoney(summary.outstandingTotal, locale),
                  ratio: duesBasis > 0 ? summary.outstandingTotal / duesBasis : 0,
                  tone: "warn",
                },
              ]}
            />
          </div>
          <div className="viz-finance-aging">
            <h4 className="viz-subtitle">{agingLabels.title}</h4>
            <BarRows
              ariaLabel={agingLabels.title}
              items={aging.map((bucket) => ({
                key: bucket.key,
                label: `${agingLabels[bucket.key]} · ${formatNumber(bucket.count, locale)}`,
                valueLabel: formatMoney(bucket.amount, locale),
                ratio: bucket.amount / maxAgingAmount,
                tone: agingTones[bucket.key],
              }))}
            />
            <p className="viz-note">{agingLabels.asOfNote}</p>
          </div>
        </div>
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
