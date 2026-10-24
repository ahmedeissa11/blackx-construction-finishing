import type { ReactNode } from "react";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import type { Locale } from "@/lib/i18n";
import { clampPercent, formatPercent } from "@/lib/format";

export type RecordMetaItem = {
  label: string;
  value: ReactNode;
  wide?: boolean;
  dir?: "ltr" | "rtl" | "auto";
};

export function StatusBadge({ appDict, status }: { appDict: AppDictionary; status?: string }) {
  if (!status) return null;
  return <span className={statusBadgeClass(status)}>{appDict.status[status] ?? status}</span>;
}

export function PriorityBadge({
  appDict,
  priority,
}: {
  appDict: AppDictionary;
  priority?: string;
}) {
  if (!priority) return null;
  const className =
    priority === "urgent"
      ? "badge badge-urgent"
      : priority === "high"
        ? "badge badge-progress"
        : "badge badge-neutral";
  return <span className={className}>{appDict.priority[priority] ?? priority}</span>;
}

export function ProgressMeter({
  appDict,
  locale,
  value,
  label,
}: {
  appDict: AppDictionary;
  locale: Locale;
  value?: number;
  label?: string;
}) {
  if (value === undefined) return null;
  const progress = clampPercent(value);
  const accessibleLabel = `${label ?? appDict.dashboard.cols.progress}: ${formatPercent(progress, locale)}`;
  return (
    <span className="progress-row record-progress">
      <span
        className="progress"
        role="progressbar"
        aria-label={accessibleLabel}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </span>
      <span className="record-progress-value">{formatPercent(progress, locale)}</span>
    </span>
  );
}

export function RecordMetaList({
  items,
  variant = "summary",
  ariaLabel,
}: {
  items: RecordMetaItem[];
  variant?: "summary" | "detail" | "inline";
  ariaLabel?: string;
}) {
  const visibleItems = items.filter(
    (item) => item.value !== null && item.value !== undefined && item.value !== "",
  );
  if (visibleItems.length === 0) return null;

  return (
    <dl className={`record-meta record-meta-${variant}`} aria-label={ariaLabel}>
      {visibleItems.map((item, index) => (
        <div
          className={item.wide ? "record-meta-item record-meta-item-wide" : "record-meta-item"}
          key={`${item.label}-${index}`}
        >
          <dt>{item.label}</dt>
          <dd dir={item.dir}>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function RecordDetailsDisclosure({
  title,
  showLabel,
  hideLabel,
  items,
  children,
}: {
  title: string;
  showLabel: string;
  hideLabel: string;
  items?: RecordMetaItem[];
  children?: ReactNode;
}) {
  const hasItems = Boolean(items?.length);
  if (!hasItems && !children) return null;

  return (
    <details className="record-details">
      <summary aria-label={`${showLabel}: ${title}`}>
        <span className="record-details-show">{showLabel}</span>
        <span className="record-details-hide">{hideLabel}</span>
        <span className="record-details-chevron" aria-hidden="true" />
      </summary>
      <div className="record-details-body">
        <p className="record-details-title">{title}</p>
        {hasItems ? <RecordMetaList items={items ?? []} variant="detail" /> : null}
        {children}
      </div>
    </details>
  );
}

export function RecordCard({
  title,
  reference,
  kind,
  badges,
  summaryItems = [],
  summaryVariant = "summary",
  detailItems = [],
  detailChildren,
  relationships,
  relationshipsLabel,
  actions,
  children,
  className,
  showDetailsLabel,
  hideDetailsLabel,
  detailsTitle,
}: {
  title: ReactNode;
  reference?: ReactNode;
  kind?: ReactNode;
  badges?: ReactNode;
  summaryItems?: RecordMetaItem[];
  summaryVariant?: "summary" | "inline";
  detailItems?: RecordMetaItem[];
  detailChildren?: ReactNode;
  relationships?: ReactNode;
  relationshipsLabel?: string;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
  detailsTitle: string;
}) {
  return (
    <article
      className={className ? `record-card domain-card ${className}` : "record-card domain-card"}
    >
      <header className="record-card-head">
        <div className="record-card-heading">
          {kind ? <p className="record-kind">{kind}</p> : null}
          <h3>{title}</h3>
          {reference ? <p className="record-reference">{reference}</p> : null}
        </div>
        {badges ? <div className="record-card-badges">{badges}</div> : null}
      </header>

      <RecordMetaList items={summaryItems} variant={summaryVariant} />
      {children}

      {relationships ? (
        <section className="record-relationships" aria-label={relationshipsLabel}>
          {relationshipsLabel ? <h4>{relationshipsLabel}</h4> : null}
          <div className="record-relationship-links">{relationships}</div>
        </section>
      ) : null}

      <RecordDetailsDisclosure
        title={detailsTitle}
        showLabel={showDetailsLabel}
        hideLabel={hideDetailsLabel}
        items={detailItems}
      >
        {detailChildren}
      </RecordDetailsDisclosure>

      {actions ? <footer className="record-card-actions">{actions}</footer> : null}
    </article>
  );
}

export function RecordListItem({
  title,
  reference,
  badges,
  summaryItems = [],
  detailItems = [],
  detailChildren,
  actions,
  children,
  className,
  showDetailsLabel,
  hideDetailsLabel,
  detailsTitle,
}: {
  title: ReactNode;
  reference?: ReactNode;
  badges?: ReactNode;
  summaryItems?: RecordMetaItem[];
  detailItems?: RecordMetaItem[];
  detailChildren?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
  className?: string;
  showDetailsLabel: string;
  hideDetailsLabel: string;
  detailsTitle: string;
}) {
  return (
    <article className={className ? `record-list-item ${className}` : "record-list-item"}>
      <div className="record-list-main">
        <div className="record-list-heading">
          <h4>{title}</h4>
          {reference ? <p className="record-reference">{reference}</p> : null}
        </div>
        <RecordMetaList items={summaryItems} variant="inline" />
        {children}
        <RecordDetailsDisclosure
          title={detailsTitle}
          showLabel={showDetailsLabel}
          hideLabel={hideDetailsLabel}
          items={detailItems}
        >
          {detailChildren}
        </RecordDetailsDisclosure>
      </div>
      {badges || actions ? (
        <div className="record-list-side">
          {badges ? <div className="record-card-badges">{badges}</div> : null}
          {actions ? <div className="record-list-actions">{actions}</div> : null}
        </div>
      ) : null}
    </article>
  );
}

export function RecordDetailSection({
  title,
  description,
  children,
  className,
  labelledBy,
}: {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}) {
  return (
    <section
      className={className ? `record-detail-section ${className}` : "record-detail-section"}
      aria-labelledby={labelledBy}
    >
      {title ? (
        <div className="record-detail-section-head">
          <h3 id={labelledBy}>{title}</h3>
          {description ? <p>{description}</p> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function RecordEmptyState({
  title,
  children,
  action,
}: {
  title?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="record-empty-state">
      <span className="record-empty-icon" aria-hidden="true">
        ⌕
      </span>
      {title ? <h3>{title}</h3> : null}
      <p>{children}</p>
      {action}
    </div>
  );
}
