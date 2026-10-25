"use client";

import Link from "next/link";
import { useMemo, useState, type ComponentProps, type ReactNode } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import type { PreviewModuleRow } from "@/content/preview-modules";
import { dashboardHref, dashboardModules } from "@/config/navigation";
import {
  getPreviewAuditItems,
  getPreviewContractItems,
  getPreviewCustomerItems,
  getPreviewDiaryItems,
  getPreviewFindingItems,
  getPreviewHandoverItems,
  getPreviewInspectionItems,
  getPreviewMilestoneItems,
  getPreviewNotificationItems,
  getPreviewProgressRecordItems,
  getPreviewProjectPortfolioItems,
  getPreviewQuotationItems,
  getPreviewReportItems,
  getPreviewRowProgress,
  getPreviewRowReference,
  getPreviewRowStatus,
  getPreviewRowText,
  getPreviewWarrantyItems,
  type PreviewLinkedRecord,
} from "@/lib/admin-preview";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";
import {
  PriorityBadge,
  ProgressMeter,
  RecordCard,
  RecordEmptyState,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";
import { DocBadge } from "@/components/ui/Viz";
import {
  ContractDetailBlock,
  HandoverDetailBlock,
  InspectionDetailBlock,
  QuotationDetailBlock,
  WarrantyDetailBlock,
} from "@/components/dashboard/RecordDetails";
import {
  getDocumentCatalog,
  getNotificationDelivery,
  groupDocumentCatalog,
} from "@/lib/preview-expansion";

export type DomainBoardModuleKey =
  | "customers"
  | "inspections"
  | "quotations"
  | "contracts"
  | "projects"
  | "milestones"
  | "diary"
  | "progress"
  | "issues"
  | "quality"
  | "reports"
  | "documents"
  | "handover"
  | "warranty"
  | "notifications"
  | "audit";

function localized(value: LocalizedText | string | undefined, locale: Locale): string {
  if (!value) return "";
  return typeof value === "string" ? value : pick(value, locale);
}

function rowLabel(row: PreviewModuleRow, key: string, locale: Locale): string {
  return localized(getPreviewRowText(row, key), locale);
}

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
}

type DomainRecordCardProps = Omit<
  ComponentProps<typeof RecordCard>,
  "showDetailsLabel" | "hideDetailsLabel" | "detailsTitle"
> & {
  appDict: AppDictionary;
};

function DomainRecordCard({ appDict, relationshipsLabel, ...props }: DomainRecordCardProps) {
  return (
    <RecordCard
      {...props}
      relationshipsLabel={relationshipsLabel ?? appDict.dashboard.linkedRecords}
      showDetailsLabel={appDict.showDetails}
      hideDetailsLabel={appDict.hideDetails}
      detailsTitle={appDict.recordMoreDetails}
    />
  );
}

function linkedRecordHref(locale: Locale, record: PreviewLinkedRecord): string {
  if (record.kind === "project") {
    return dashboardHref(locale, `projects/${encodeURIComponent(record.id)}`);
  }
  const segment = dashboardModules.find((module) => module.key === record.module)?.segment ?? "";
  return dashboardHref(locale, segment);
}

function projectWorkspaceHref(locale: Locale, projectId: string): string {
  return dashboardHref(locale, `projects/${encodeURIComponent(projectId)}`);
}

function LinkedRecordLinks({
  appDict,
  locale,
  links,
}: {
  appDict: AppDictionary;
  locale: Locale;
  links: PreviewLinkedRecord[];
}) {
  if (links.length === 0) return null;
  return (
    <div className="domain-links" aria-label={appDict.dashboard.linkedRecords}>
      {links.map((record) => (
        <Link
          key={`${record.kind}-${record.id}`}
          className="record-chip-link"
          href={linkedRecordHref(locale, record)}
          aria-label={`${appDict.dashboard.operations.openRelated}: ${record.id}`}
        >
          {appDict.dashboard.linkedKinds[record.kind]} · <span dir="ltr">{record.id}</span>
        </Link>
      ))}
    </div>
  );
}

type BoardVariant =
  | "directory"
  | "chronology"
  | "finance"
  | "portfolio"
  | "workflow"
  | "analytics"
  | "quality"
  | "library"
  | "lifecycle"
  | "list";

function BoardShell({
  locale,
  title,
  intro,
  stats,
  controls,
  children,
  layout = "grid",
  variant = "directory",
}: {
  locale: Locale;
  title: string;
  intro: string;
  stats: Array<{ label: string; value: number }>;
  controls?: ReactNode;
  children: ReactNode;
  layout?: "grid" | "list";
  variant?: BoardVariant;
}) {
  return (
    <section className={`panel domain-board domain-board--${variant}`}>
      <div className="domain-board-hero">
        <div className="domain-board-head">
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
        <div className="domain-stats" role="list" aria-label={title}>
          {stats.map((stat) => (
            <div className="domain-stat" role="listitem" key={stat.label}>
              <span>{stat.label}</span>
              <strong>{formatNumber(stat.value, locale)}</strong>
            </div>
          ))}
        </div>
      </div>
      {controls ? <div className="domain-toolbar-shell">{controls}</div> : null}
      <div className={layout === "list" ? "domain-record-list" : "domain-card-grid"}>
        {children}
      </div>
    </section>
  );
}

function UnavailableButton({
  label,
  message,
  onUnavailable,
}: {
  label: string;
  message: string;
  onUnavailable: (message: string) => void;
}) {
  return (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => onUnavailable(message)}
      aria-haspopup="dialog"
    >
      {label}
    </button>
  );
}

function oversightRowSearchText(row: PreviewModuleRow): string {
  const cellValues = Object.values(row.cells).flatMap((cell) => {
    switch (cell.kind) {
      case "text":
        return [cell.value.ar, cell.value.en];
      case "plain":
      case "date":
      case "status":
      case "priority":
        return [cell.value];
      case "money":
      case "progress":
        return [String(cell.value)];
    }
  });
  const linkValues = Object.values(row.links ?? {}).flatMap((value) => (value ? [value] : []));

  return [row.id, ...cellValues, ...linkValues].join(" ").toLowerCase();
}

function OversightControls({
  idPrefix,
  locale,
  appDict,
  query,
  onQueryChange,
  statusFilter,
  onStatusFilterChange,
  statuses,
  resultCount,
  onClear,
  children,
}: {
  idPrefix: string;
  locale: Locale;
  appDict: AppDictionary;
  query: string;
  onQueryChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  statuses: string[];
  resultCount: number;
  onClear: () => void;
  children?: ReactNode;
}) {
  const hasFilters = query !== "" || statusFilter !== "";

  return (
    <div className="domain-board-controls">
      <div className="toolbar domain-board-toolbar">
        <div className="search-box">
          <span className="search-icon" aria-hidden="true">
            ⌕
          </span>
          <label className="sr-only" htmlFor={`${idPrefix}-search`}>
            {appDict.searchShort}
          </label>
          <input
            id={`${idPrefix}-search`}
            className="form-input"
            type="search"
            placeholder={appDict.search}
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
          />
        </div>
        {statuses.length > 0 ? (
          <div className="filter-field">
            <label className="filter-label" htmlFor={`${idPrefix}-status`}>
              {appDict.dashboard.cols.status}
            </label>
            <select
              id={`${idPrefix}-status`}
              className="form-select"
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value)}
            >
              <option value="">{appDict.allStatuses}</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {appDict.status[status] ?? status}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        {hasFilters ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            {appDict.clearFilters}
          </button>
        ) : null}
        {children}
      </div>
      <p className="domain-result-count" aria-live="polite">
        {formatNumber(resultCount, locale)} {appDict.showingResults}
      </p>
    </div>
  );
}

function OversightEmpty({ appDict, onClear }: { appDict: AppDictionary; onClear: () => void }) {
  return (
    <RecordEmptyState
      action={
        <button type="button" className="btn btn-outline btn-sm" onClick={onClear}>
          {appDict.clearFilters}
        </button>
      }
    >
      {appDict.noResults}
    </RecordEmptyState>
  );
}

function DocumentsBoard({
  locale,
  appDict,
  onUnavailable,
}: {
  locale: Locale;
  appDict: AppDictionary;
  onUnavailable: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [projectFilter, setProjectFilter] = useState("");
  const [sort, setSort] = useState<"updated" | "title">("updated");
  const [page, setPage] = useState(1);
  const catalog = useMemo(() => getDocumentCatalog(), []);
  const operations = appDict.dashboard.operations;
  const domain = operations.domain;
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;

  const categories = useMemo(
    () => groupDocumentCatalog(catalog).map((group) => group.category),
    [catalog],
  );
  const projects = useMemo(
    () => [...new Set(catalog.flatMap((item) => (item.projectId ? [item.projectId] : [])))],
    [catalog],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (projectFilter && item.projectId !== projectFilter) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        item.title.ar,
        item.title.en,
        item.reference,
        item.projectId ?? "",
        item.customerId ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [catalog, query, categoryFilter, projectFilter]);
  const sorted = useMemo(() => {
    const items = [...filtered];
    if (sort === "title") {
      items.sort((a, b) => pick(a.title, locale).localeCompare(pick(b.title, locale), locale));
    } else {
      items.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
    }
    return items;
  }, [filtered, sort, locale]);
  const PAGE_SIZE = 25;
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const groups = useMemo(() => groupDocumentCatalog(pageItems), [pageItems]);

  function clearFilters() {
    setQuery("");
    setCategoryFilter("");
    setProjectFilter("");
    setPage(1);
  }
  const hasFilters = query !== "" || categoryFilter !== "" || projectFilter !== "";

  return (
    <BoardShell
      locale={locale}
      title={domain.documentsTitle}
      variant="library"
      layout="list"
      intro={domain.documentsIntro}
      stats={[
        { label: x.documentsWorkspace.documentsCount, value: catalog.length },
        { label: x.documentsWorkspace.categoriesCount, value: categories.length },
        { label: domain.projectsCovered, value: projects.length },
      ]}
      controls={
        <div className="domain-board-controls">
          <div className="toolbar domain-board-toolbar">
            <div className="search-box">
              <span className="search-icon" aria-hidden="true">
                ⌕
              </span>
              <label className="sr-only" htmlFor="documents-board-search">
                {appDict.searchShort}
              </label>
              <input
                id="documents-board-search"
                className="form-input"
                type="search"
                placeholder={appDict.search}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPage(1);
                }}
              />
            </div>
            <div className="filter-field">
              <label className="filter-label" htmlFor="documents-board-category">
                {x.documentsWorkspace.categoryLabel}
              </label>
              <select
                id="documents-board-category"
                className="form-select"
                value={categoryFilter}
                onChange={(event) => {
                  setCategoryFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{x.documentsWorkspace.allCategories}</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {x.documentCategories[category] ?? category}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-label" htmlFor="documents-board-project">
                {cols.project}
              </label>
              <select
                id="documents-board-project"
                className="form-select"
                value={projectFilter}
                onChange={(event) => {
                  setProjectFilter(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">{x.documentsWorkspace.allProjects}</option>
                {projects.map((projectId) => (
                  <option key={projectId} value={projectId}>
                    {projectId}
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-field">
              <label className="filter-label" htmlFor="documents-board-sort">
                {appDict.sortLabel}
              </label>
              <select
                id="documents-board-sort"
                className="form-select"
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value as "updated" | "title");
                  setPage(1);
                }}
              >
                <option value="updated">{appDict.sortNewest}</option>
                <option value="title">{appDict.sortTitle}</option>
              </select>
            </div>
            {hasFilters ? (
              <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
                {appDict.clearFilters}
              </button>
            ) : null}
            <UnavailableButton
              label={domain.actions.uploadDocument}
              message={domain.uploadDocumentUnavailable}
              onUnavailable={onUnavailable}
            />
          </div>
          <p className="domain-result-count" aria-live="polite">
            {formatNumber(filtered.length, locale)} {appDict.showingResults}
          </p>
        </div>
      }
    >
      {groups.length === 0 ? (
        <RecordEmptyState
          action={
            <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
              {appDict.clearFilters}
            </button>
          }
        >
          {x.documentsWorkspace.emptyGroup}
        </RecordEmptyState>
      ) : (
        <>
          {groups.map((group) => (
            <section key={group.category} className="wf-doc-group">
              <h3>
                {x.documentCategories[group.category] ?? group.category} ·{" "}
                {formatNumber(group.items.length, locale)} {x.documentsWorkspace.groupCountSuffix}
              </h3>
              <div className="wf-doc-list">
                {group.items.map((item) => (
                  <article className="wf-doc-row" key={item.id}>
                    <DocBadge format={item.format} />
                    <div className="wf-doc-main">
                      <div className="wf-doc-title">{pick(item.title, locale)}</div>
                      <div className="wf-doc-ref">
                        <span dir="ltr">{item.reference}</span>
                      </div>
                    </div>
                    <div className="wf-doc-meta">
                      <span>
                        {cols.project}:{" "}
                        <b>
                          {item.projectId ? (
                            <span dir="ltr">{item.projectId}</span>
                          ) : (
                            operations.notRecorded
                          )}
                        </b>
                      </span>
                      <span>
                        {cols.updated}:{" "}
                        <b>
                          {item.updatedAt
                            ? formatDate(item.updatedAt, locale)
                            : operations.notRecorded}
                        </b>
                      </span>
                      {item.amount !== undefined ? (
                        <span>
                          {cols.amount}: <b dir="ltr">{formatMoney(item.amount, locale)}</b>
                        </span>
                      ) : null}
                      {item.status ? (
                        <span>
                          {cols.status}: <b>{appDict.status[item.status] ?? item.status}</b>
                        </span>
                      ) : null}
                      <span>
                        {domain.fileFormat}:{" "}
                        <b dir="ltr">{item.format ?? operations.notRecorded}</b>
                      </span>
                    </div>
                    <span className="badge badge-neutral">
                      {item.format ?? operations.notRecorded}
                    </span>
                    <div className="wf-doc-actions">
                      {item.projectId ? (
                        <Link
                          className="record-chip-link"
                          href={projectWorkspaceHref(locale, item.projectId)}
                        >
                          {cols.project} · <span dir="ltr">{item.projectId}</span>
                        </Link>
                      ) : null}
                      {item.customerId ? (
                        <Link
                          className="record-chip-link"
                          href={dashboardHref(locale, `customers/${item.customerId}`)}
                        >
                          {cols.customer} · <span dir="ltr">{item.customerId}</span>
                        </Link>
                      ) : null}
                      <UnavailableButton
                        label={domain.actions.downloadDocument}
                        message={domain.downloadDocumentUnavailable}
                        onUnavailable={onUnavailable}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
          {pageCount > 1 ? (
            <nav className="board-pagination" aria-label={appDict.pageLabel}>
              <span className="board-pagination-info">
                {formatNumber(sorted.length, locale)} {appDict.showingResults}
              </span>
              <span className="board-pagination-controls">
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={safePage <= 1}
                  onClick={() => setPage(safePage - 1)}
                >
                  {appDict.pagePrevious}
                </button>
                <span className="board-pagination-current">
                  {appDict.pageLabel} {formatNumber(safePage, locale)} {appDict.pageOf}{" "}
                  {formatNumber(pageCount, locale)}
                </span>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  disabled={safePage >= pageCount}
                  onClick={() => setPage(safePage + 1)}
                >
                  {appDict.pageNext}
                </button>
              </span>
            </nav>
          ) : null}
        </>
      )}
    </BoardShell>
  );
}

function NotificationsBoard({
  locale,
  appDict,
  onUnavailable,
}: {
  locale: Locale;
  appDict: AppDictionary;
  onUnavailable: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const items = useMemo(() => getPreviewNotificationItems(), []);
  const operations = appDict.dashboard.operations;
  const domain = operations.domain;
  const cols = appDict.dashboard.cols;

  const statuses = useMemo(
    () => [...new Set(items.flatMap((item) => (item.status ? [item.status] : [])))],
    [items],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      return !normalizedQuery || oversightRowSearchText(item.row).includes(normalizedQuery);
    });
  }, [items, query, statusFilter]);
  const referencedRecords = new Set(
    items.flatMap((item) => (item.entityReference ? [item.entityReference] : [])),
  );

  function clearFilters() {
    setQuery("");
    setStatusFilter("");
  }

  return (
    <BoardShell
      locale={locale}
      title={domain.notificationsTitle}
      variant="list"
      layout="list"
      intro={domain.notificationsIntro}
      stats={[
        { label: domain.summary, value: items.length },
        {
          label: domain.newNotifications,
          value: items.filter((item) => item.requiresReview).length,
        },
        {
          label: domain.recordedAsSent,
          value: items.filter((item) => item.recordedAsSent).length,
        },
        { label: domain.recordedEntities, value: referencedRecords.size },
      ]}
      controls={
        <OversightControls
          idPrefix="notifications-board"
          locale={locale}
          appDict={appDict}
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statuses={statuses}
          resultCount={filtered.length}
          onClear={clearFilters}
        />
      }
    >
      {filtered.length > 0 ? (
        filtered.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            className={item.requiresReview ? "domain-card-blocker" : undefined}
            key={item.row.id}
            kind={item.requiresReview ? operations.needsAttention : undefined}
            title={rowLabel(item.row, "title", locale)}
            reference={
              item.entityReference ? (
                <>
                  {cols.entity} · <span dir="ltr">{item.entityReference}</span>
                </>
              ) : undefined
            }
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded, {
                wide: !item.entityReference,
              }),
              ...(item.entityReference ? [] : [meta(cols.entity, operations.notRecorded)]),
            ]}
            detailItems={(() => {
              const delivery = getNotificationDelivery(item.row.id);
              const wf = appDict.dashboard.expansion.workflow;
              return [
                meta(
                  domain.deliveryChannel,
                  delivery
                    ? (wf.channels[delivery.channel] ?? delivery.channel)
                    : operations.notRecorded,
                ),
                meta(
                  domain.recipient,
                  delivery
                    ? (wf.recipients[delivery.recipient] ?? delivery.recipient)
                    : operations.notRecorded,
                ),
                ...(delivery
                  ? [
                      meta(wf.attemptsLabel, formatNumber(delivery.attempts, locale), {
                        dir: "ltr" as const,
                      }),
                      meta(wf.deliveryStateNote, pick(delivery.stateNote, locale), {
                        wide: true,
                      }),
                    ]
                  : []),
              ];
            })()}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                <UnavailableButton
                  label={domain.actions.markNotificationReviewed}
                  message={domain.markNotificationReviewedUnavailable}
                  onUnavailable={onUnavailable}
                />
                <UnavailableButton
                  label={domain.actions.resendNotification}
                  message={domain.resendNotificationUnavailable}
                  onUnavailable={onUnavailable}
                />
              </>
            }
          >
            {item.requiresReview ? (
              <p className="domain-context-note">{domain.notificationReviewNote}</p>
            ) : null}
          </DomainRecordCard>
        ))
      ) : (
        <OversightEmpty appDict={appDict} onClear={clearFilters} />
      )}
    </BoardShell>
  );
}

function AuditBoard({
  locale,
  appDict,
  onUnavailable,
}: {
  locale: Locale;
  appDict: AppDictionary;
  onUnavailable: (message: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const items = useMemo(() => getPreviewAuditItems(), []);
  const operations = appDict.dashboard.operations;
  const domain = operations.domain;
  const cols = appDict.dashboard.cols;

  const statuses = useMemo(
    () => [...new Set(items.flatMap((item) => (item.status ? [item.status] : [])))],
    [items],
  );
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return items.filter((item) => {
      if (statusFilter && item.status !== statusFilter) return false;
      return !normalizedQuery || oversightRowSearchText(item.row).includes(normalizedQuery);
    });
  }, [items, query, statusFilter]);
  const recordedActors = new Set(
    items.flatMap((item) => {
      const actor = localized(item.actor, "en");
      return actor ? [actor] : [];
    }),
  );
  const linkedOperationalRecords = new Set(
    items.flatMap((item) =>
      [item.row.links?.projectId, item.row.links?.requestId].flatMap((id) => (id ? [id] : [])),
    ),
  );

  function clearFilters() {
    setQuery("");
    setStatusFilter("");
  }

  const groupedByDate = useMemo(() => {
    const groups = new Map<string, typeof filtered>();
    for (const item of filtered) {
      const key = item.date ?? "not-recorded";
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
  }, [filtered]);

  return (
    <BoardShell
      locale={locale}
      layout="list"
      title={domain.auditTitle}
      variant="chronology"
      intro={domain.auditIntro}
      stats={[
        { label: domain.summary, value: items.length },
        {
          label: domain.completedAuditEntries,
          value: items.filter((item) => item.status === "completed").length,
        },
        { label: domain.recordedActors, value: recordedActors.size },
        { label: domain.linkedOperationalRecords, value: linkedOperationalRecords.size },
      ]}
      controls={
        <OversightControls
          idPrefix="audit-board"
          locale={locale}
          appDict={appDict}
          query={query}
          onQueryChange={setQuery}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          statuses={statuses}
          resultCount={filtered.length}
          onClear={clearFilters}
        >
          <UnavailableButton
            label={domain.actions.exportAuditLog}
            message={domain.exportAuditUnavailable}
            onUnavailable={onUnavailable}
          />
        </OversightControls>
      }
    >
      {filtered.length > 0 ? (
        groupedByDate.map(([dateKey, groupItems]) => {
          const groupLabel =
            dateKey === "not-recorded" ? operations.notRecorded : formatDate(dateKey, locale);
          return (
            <section className="activity-group" key={dateKey} aria-label={groupLabel}>
              <h3 className="activity-group-title">
                <span className="activity-date">{groupLabel}</span>
              </h3>
              <div className="activity-timeline">
                {groupItems.map((item) => (
                  <div className="activity-record" key={item.row.id}>
                    <span className="activity-marker" aria-hidden="true">
                      ✓
                    </span>
                    <DomainRecordCard
                      appDict={appDict}
                      title={localized(item.action, locale)}
                      reference={
                        <>
                          {cols.entity} ·{" "}
                          <span dir="ltr">{item.entityReference ?? item.row.id}</span>
                        </>
                      }
                      badges={<StatusBadge appDict={appDict} status={item.status} />}
                      summaryVariant="inline"
                      summaryItems={[meta(cols.actor, localized(item.actor, locale))]}
                      detailItems={[
                        meta(cols.date, groupLabel),
                        meta(
                          appDict.dashboard.linkedRecords,
                          formatNumber(item.links.length, locale),
                        ),
                      ]}
                      relationships={
                        item.links.length > 0 ? (
                          <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
                        ) : undefined
                      }
                    />
                  </div>
                ))}
              </div>
            </section>
          );
        })
      ) : (
        <OversightEmpty appDict={appDict} onClear={clearFilters} />
      )}
    </BoardShell>
  );
}

export function DomainBoard({
  locale,
  appDict,
  moduleKey,
}: {
  locale: Locale;
  appDict: AppDictionary;
  moduleKey: DomainBoardModuleKey;
}) {
  const [notice, setNotice] = useState<string | null>(null);
  const operations = appDict.dashboard.operations;
  const domain = operations.domain;
  const cols = appDict.dashboard.cols;

  const unavailableButton = (label: string, message: string) => (
    <button
      type="button"
      className="btn btn-outline btn-sm"
      onClick={() => setNotice(message)}
      aria-haspopup="dialog"
    >
      {label}
    </button>
  );

  let content: ReactNode = null;

  if (moduleKey === "customers") {
    const items = getPreviewCustomerItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.customersTitle}
        variant="directory"
        intro={domain.customersIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: domain.recordedRequests,
            value: items.reduce((total, item) => total + item.context.requests.length, 0),
          },
          {
            label: domain.recordedProjects,
            value: items.reduce((total, item) => total + item.context.projects.length, 0),
          },
          {
            label: operations.needsAttention,
            value: items.filter((item) => (item.context.latestWorkflow?.blockers.length ?? 0) > 0)
              .length,
          },
        ]}
      >
        {items.map((item) => {
          const latestRequest = item.context.latestRequest;
          const latestWorkflow = item.context.latestWorkflow;
          return (
            <DomainRecordCard
              appDict={appDict}
              key={item.customerId}
              title={rowLabel(item.row, "name", locale)}
              reference={<span dir="ltr">{item.customerId}</span>}
              badges={<StatusBadge appDict={appDict} status={item.status} />}
              summaryItems={[
                meta(cols.phone, rowLabel(item.row, "phone", locale), { dir: "ltr" }),
                meta(cols.city, rowLabel(item.row, "city", locale)),
                meta(domain.recordedRequests, formatNumber(item.context.requests.length, locale)),
                meta(domain.recordedProjects, formatNumber(item.context.projects.length, locale)),
              ]}
              detailItems={[
                meta(
                  domain.latestRequest,
                  latestRequest ? (
                    <>
                      <span dir="ltr">{latestRequest.id}</span> ·{" "}
                      {formatDate(latestRequest.submittedAt, locale)}
                    </>
                  ) : (
                    operations.notRecorded
                  ),
                  { wide: true },
                ),
                meta(
                  domain.customerNextStep,
                  latestRequest && latestWorkflow
                    ? operations.nextActions[latestWorkflow.nextAction]
                    : operations.notRecorded,
                  { wide: true },
                ),
                meta(
                  operations.needsAttention,
                  latestWorkflow && latestWorkflow.blockers.length > 0
                    ? formatNumber(latestWorkflow.blockers.length, locale)
                    : operations.noBlockers,
                  { wide: true },
                ),
              ]}
              relationships={
                <>
                  <Link
                    className="record-chip-link"
                    href={dashboardHref(locale, `customers/${item.customerId}`)}
                    aria-label={`${appDict.dashboard.openCustomerWorkspace}: ${item.customerId}`}
                  >
                    {appDict.dashboard.openCustomerWorkspace}
                  </Link>
                  {item.context.projects.map((project) => (
                    <Link
                      key={project.id}
                      className="record-chip-link"
                      href={projectWorkspaceHref(locale, project.id)}
                      aria-label={`${appDict.dashboard.openProjectWorkspace}: ${project.id}`}
                    >
                      {appDict.dashboard.linkedKinds.project} · <span dir="ltr">{project.id}</span>
                    </Link>
                  ))}
                  <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
                </>
              }
              actions={unavailableButton(
                domain.actions.editCustomer,
                domain.editCustomerUnavailable,
              )}
            >
              {latestRequest ? (
                <p className="domain-note">
                  {domain.latestRequest}: {localized(latestRequest.serviceLabel, locale)} ·{" "}
                  {appDict.status[latestRequest.status] ?? latestRequest.status}
                </p>
              ) : null}
              {item.context.projects.length > 0 ? (
                <p className="domain-context-note">{domain.customerContextNote}</p>
              ) : null}
            </DomainRecordCard>
          );
        })}
      </BoardShell>
    );
  }

  if (moduleKey === "inspections") {
    const items = getPreviewInspectionItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.inspectionsTitle}
        variant="chronology"
        intro={domain.inspectionsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.upcoming, value: items.filter((item) => item.isUpcoming).length },
          {
            label: appDict.status.inspection_done ?? "inspection_done",
            value: items.filter((item) => item.status === "inspection_done").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            title={rowLabel(item.row, "service", locale)}
            reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.customer, rowLabel(item.row, "customer", locale), { wide: true }),
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
              meta(cols.assignee, rowLabel(item.row, "assignee", locale)),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            detailChildren={
              <InspectionDetailBlock locale={locale} appDict={appDict} reference={item.reference} />
            }
            actions={
              item.isUpcoming
                ? unavailableButton(domain.actions.completeInspection, domain.completeUnavailable)
                : unavailableButton(domain.actions.scheduleInspection, domain.scheduleUnavailable)
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "quotations") {
    const items = getPreviewQuotationItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.quotationsTitle}
        variant="finance"
        intro={domain.quotationsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: appDict.status.sent ?? "sent",
            value: items.filter((item) => item.status === "sent").length,
          },
          {
            label: appDict.status.approved ?? "approved",
            value: items.filter((item) => item.status === "approved").length,
          },
          { label: domain.boq, value: items.filter((item) => item.kind === "boq").length },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={item.kind === "boq" ? domain.boq : domain.quotation}
            title={rowLabel(item.row, "title", locale)}
            reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.customer, rowLabel(item.row, "customer", locale), { wide: true }),
              meta(
                domain.amount,
                item.amount !== undefined
                  ? formatMoney(item.amount, locale)
                  : operations.notRecorded,
              ),
              meta(
                cols.date,
                rowLabel(item.row, "date", locale)
                  ? formatDate(rowLabel(item.row, "date", locale), locale)
                  : operations.notRecorded,
              ),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            detailChildren={
              <QuotationDetailBlock locale={locale} appDict={appDict} reference={item.reference} />
            }
            actions={
              <>
                {unavailableButton(domain.actions.editBoq, domain.boqEditorUnavailable)}
                {unavailableButton(domain.actions.sendQuotation, domain.sendUnavailable)}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "contracts") {
    const items = getPreviewContractItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.contractsTitle}
        variant="finance"
        intro={domain.contractsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: appDict.status.signed ?? "signed",
            value: items.filter((item) => item.status === "signed").length,
          },
          {
            label: domain.changeOrder,
            value: items.filter((item) => item.kind === "changeOrder").length,
          },
          {
            label: appDict.status.pending ?? "pending",
            value: items.filter((item) => item.status === "pending").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={item.kind === "changeOrder" ? domain.changeOrder : domain.contract}
            title={rowLabel(item.row, "type", locale)}
            reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.project, rowLabel(item.row, "project", locale), { dir: "ltr" }),
              meta(
                cols.date,
                rowLabel(item.row, "date", locale)
                  ? formatDate(rowLabel(item.row, "date", locale), locale)
                  : operations.notRecorded,
              ),
              meta(
                domain.amount,
                item.amount !== undefined
                  ? formatMoney(item.amount, locale)
                  : operations.notRecorded,
                { wide: true },
              ),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            detailChildren={
              <ContractDetailBlock
                locale={locale}
                appDict={appDict}
                reference={item.reference}
                kind={item.kind}
              />
            }
            actions={
              item.kind === "changeOrder"
                ? unavailableButton(domain.actions.approveChangeOrder, domain.approveUnavailable)
                : unavailableButton(domain.actions.manageContract, domain.signUnavailable)
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "projects") {
    const items = getPreviewProjectPortfolioItems();
    const projectActions = operations.projectActions;
    content = (
      <BoardShell
        locale={locale}
        title={domain.projectsTitle}
        variant="portfolio"
        intro={domain.projectsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: domain.activeProjects,
            value: items.filter((item) => item.project.status === "in_progress").length,
          },
          {
            label: domain.handedOverProjects,
            value: items.filter((item) => item.project.status === "handed_over").length,
          },
          {
            label: domain.totalBlockers,
            value: items.reduce((total, item) => total + item.operations.blockerRows.length, 0),
          },
        ]}
      >
        {items.map((item) => {
          const blockerReferences = item.operations.blockerRows
            .map((row) => getPreviewRowReference(row))
            .filter((reference): reference is string => Boolean(reference));
          const handoverLabel =
            item.operations.handoverState === "handed_over"
              ? projectActions.handedOver
              : item.operations.handoverState === "pending"
                ? projectActions.handoverPending
                : projectActions.handoverNotScheduled;
          return (
            <DomainRecordCard
              appDict={appDict}
              className={item.operations.blockerRows.length > 0 ? "domain-card-blocker" : undefined}
              key={item.project.id}
              kind={localized(item.project.serviceLabel, locale)}
              title={localized(item.project.title, locale)}
              reference={<span dir="ltr">{item.project.id}</span>}
              badges={<StatusBadge appDict={appDict} status={item.project.status} />}
              summaryItems={[
                meta(cols.customer, localized(item.project.customer, locale)),
                meta(cols.updated, formatDate(item.project.updatedAt, locale)),
                meta(
                  cols.progress,
                  <ProgressMeter appDict={appDict} locale={locale} value={item.project.progress} />,
                  { wide: true },
                ),
                meta(
                  projectActions.blockers,
                  <>
                    {formatNumber(item.operations.blockerRows.length, locale)}
                    {blockerReferences.length > 0 ? (
                      <span dir="ltr"> · {blockerReferences.join(" · ")}</span>
                    ) : null}
                  </>,
                  { wide: blockerReferences.length > 0 },
                ),
                meta(
                  projectActions.pendingReports,
                  formatNumber(item.operations.pendingReports, locale),
                ),
              ]}
              detailItems={[
                meta(cols.milestone, localized(item.project.currentMilestone, locale), {
                  wide: true,
                }),
                meta(
                  projectActions.nextMilestone,
                  item.operations.nextMilestone
                    ? localized(item.operations.nextMilestone.title, locale)
                    : operations.notRecorded,
                  { wide: true },
                ),
                meta(
                  projectActions.latestProgress,
                  item.operations.latestProgressRow
                    ? rowLabel(item.operations.latestProgressRow, "milestone", locale)
                    : operations.notRecorded,
                  { wide: true },
                ),
                meta(projectActions.handoverState, handoverLabel, { wide: true }),
              ]}
              relationships={
                item.links.length > 0 ? (
                  <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
                ) : undefined
              }
              actions={
                <>
                  {unavailableButton(
                    domain.actions.editProjectPlan,
                    domain.editProjectPlanUnavailable,
                  )}
                  <Link
                    className="btn btn-primary btn-sm"
                    href={projectWorkspaceHref(locale, item.project.id)}
                  >
                    {appDict.dashboard.openProjectWorkspace}
                  </Link>
                </>
              }
            />
          );
        })}
      </BoardShell>
    );
  }

  if (moduleKey === "milestones") {
    const items = getPreviewMilestoneItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.milestonesTitle}
        variant="workflow"
        intro={domain.milestonesIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: domain.milestoneStates.dueSoon,
            value: items.filter((item) => item.scheduleState === "dueSoon").length,
          },
          {
            label: domain.milestoneStates.overdue,
            value: items.filter((item) => item.scheduleState === "overdue").length,
          },
          {
            label: domain.milestoneStates.completed,
            value: items.filter((item) => item.scheduleState === "completed").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            className={item.scheduleState === "overdue" ? "domain-card-blocker" : undefined}
            key={item.row.id}
            kind={domain.milestoneStates[item.scheduleState]}
            title={localized(item.title, locale)}
            reference={
              <>
                {cols.project} ·{" "}
                <span dir="ltr">{item.projectId ?? rowLabel(item.row, "project", locale)}</span>
              </>
            }
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.dueDate, item.due ? formatDate(item.due, locale) : operations.notRecorded),
              meta(
                cols.status,
                item.status ? (appDict.status[item.status] ?? item.status) : operations.notRecorded,
              ),
              meta(
                cols.progress,
                <ProgressMeter appDict={appDict} locale={locale} value={item.progress} />,
                { wide: true },
              ),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                {item.projectId ? (
                  <Link
                    className="btn btn-ghost btn-sm"
                    href={projectWorkspaceHref(locale, item.projectId)}
                  >
                    {appDict.dashboard.openProjectWorkspace}
                  </Link>
                ) : null}
                {unavailableButton(
                  domain.actions.updateMilestone,
                  domain.updateMilestoneUnavailable,
                )}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "diary") {
    const items = getPreviewDiaryItems();
    const coveredProjects = new Set(items.map((item) => item.row.links?.projectId).filter(Boolean));
    content = (
      <BoardShell
        locale={locale}
        title={domain.diaryTitle}
        variant="chronology"
        intro={domain.diaryIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.projectsCovered, value: coveredProjects.size },
          {
            label: appDict.status.completed ?? "completed",
            value: items.filter((item) => item.status === "completed").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={item.date ? formatDate(item.date, locale) : operations.notRecorded}
            title={rowLabel(item.row, "title", locale)}
            reference={
              <>
                {cols.project} · <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </>
            }
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.actor, rowLabel(item.row, "actor", locale)),
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                {item.row.links?.projectId ? (
                  <Link
                    className="btn btn-ghost btn-sm"
                    href={projectWorkspaceHref(locale, item.row.links.projectId)}
                  >
                    {appDict.dashboard.openProjectWorkspace}
                  </Link>
                ) : null}
                {unavailableButton(domain.actions.editDiaryEntry, domain.editDiaryUnavailable)}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "progress") {
    const items = getPreviewProgressRecordItems();
    const coveredProjects = new Set(items.map((item) => item.row.links?.projectId).filter(Boolean));
    content = (
      <BoardShell
        locale={locale}
        title={domain.progressTitle}
        variant="analytics"
        intro={domain.progressIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.projectsCovered, value: coveredProjects.size },
          {
            label: domain.latestForProject,
            value: items.filter((item) => item.latestForProject).length,
          },
          {
            label: appDict.status.completed ?? "completed",
            value: items.filter((item) => item.status === "completed").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={item.latestForProject ? domain.latestForProject : domain.earlierRecord}
            title={rowLabel(item.row, "milestone", locale)}
            reference={
              <>
                {cols.project} · <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </>
            }
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
              meta(
                cols.status,
                item.status ? (appDict.status[item.status] ?? item.status) : operations.notRecorded,
              ),
              meta(
                cols.progress,
                <ProgressMeter appDict={appDict} locale={locale} value={item.progress} />,
                { wide: true },
              ),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                {item.row.links?.projectId ? (
                  <Link
                    className="btn btn-ghost btn-sm"
                    href={projectWorkspaceHref(locale, item.row.links.projectId)}
                  >
                    {appDict.dashboard.openProjectWorkspace}
                  </Link>
                ) : null}
                {unavailableButton(domain.actions.updateProgress, domain.updateProgressUnavailable)}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "issues" || moduleKey === "quality") {
    const items = getPreviewFindingItems(moduleKey);
    content = (
      <BoardShell
        locale={locale}
        title={domain.findingsTitle}
        variant="quality"
        intro={domain.findingsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: appDict.dashboard.statUnresolvedFindings,
            value: items.filter((item) => item.unresolved).length,
          },
          { label: domain.blocker, value: items.filter((item) => item.blocker).length },
        ]}
      >
        {items.map((item) => {
          const canonical = item.canonicalIssue;
          const assignee = canonical
            ? localized(canonical.assignee, locale)
            : rowLabel(item.row, "assignee", locale);
          return (
            <DomainRecordCard
              appDict={appDict}
              className={item.blocker ? "domain-card-blocker" : undefined}
              key={`${item.moduleKey}-${item.row.id}`}
              kind={item.blocker ? domain.blocker : undefined}
              title={rowLabel(item.row, "title", locale)}
              reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
              badges={
                <>
                  <PriorityBadge appDict={appDict} priority={item.severity} />
                  <StatusBadge appDict={appDict} status={item.status} />
                </>
              }
              summaryItems={[
                meta(cols.project, rowLabel(item.row, "project", locale), { dir: "ltr" }),
                meta(
                  cols.date,
                  canonical ? formatDate(canonical.reportedAt, locale) : operations.notRecorded,
                ),
                meta(cols.assignee, assignee || operations.notRecorded, { wide: true }),
              ]}
              detailItems={[
                meta(
                  domain.correctiveAction,
                  canonical
                    ? localized(canonical.correctiveAction, locale)
                    : operations.notRecorded,
                  { wide: true },
                ),
                meta(domain.reportedBy, operations.notRecorded),
                meta(domain.dueDate, operations.notRecorded),
              ]}
              detailChildren={
                canonical ? (
                  <p className="domain-note">{localized(canonical.detail, locale)}</p>
                ) : null
              }
              relationships={
                item.links.length > 0 ? (
                  <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
                ) : undefined
              }
              actions={unavailableButton(domain.actions.closeFinding, domain.closeUnavailable)}
            />
          );
        })}
      </BoardShell>
    );
  }

  if (moduleKey === "reports") {
    const items = getPreviewReportItems();
    content = (
      <BoardShell
        locale={locale}
        title={domain.reportsTitle}
        variant="analytics"
        intro={domain.reportsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.pending, value: items.filter((item) => item.pending).length },
          {
            label: appDict.status.sent ?? "sent",
            value: items.filter((item) => item.status === "sent").length,
          },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={<span dir="ltr">{rowLabel(item.row, "week", locale)}</span>}
            title={rowLabel(item.row, "title", locale)}
            reference={
              <>
                {cols.project} · <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </>
            }
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
              meta(
                cols.status,
                item.status ? (appDict.status[item.status] ?? item.status) : operations.notRecorded,
              ),
              meta(
                cols.progress,
                <ProgressMeter
                  appDict={appDict}
                  locale={locale}
                  value={getPreviewRowProgress(item.row)}
                />,
                { wide: true },
              ),
            ]}
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                {unavailableButton(domain.actions.approveReport, domain.approveReportUnavailable)}
                {unavailableButton(domain.actions.deliverReport, domain.deliverReportUnavailable)}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "documents") {
    content = (
      <DocumentsBoard key={moduleKey} locale={locale} appDict={appDict} onUnavailable={setNotice} />
    );
  }

  if (moduleKey === "handover") {
    const items = getPreviewHandoverItems();
    const portfolio = getPreviewProjectPortfolioItems();
    const projectActions = operations.projectActions;
    content = (
      <BoardShell
        locale={locale}
        title={domain.handoverTitle}
        variant="lifecycle"
        intro={domain.handoverIntro}
        stats={[
          { label: domain.summary, value: items.length },
          {
            label: appDict.status.handed_over ?? "handed_over",
            value: items.filter((item) => item.status === "handed_over").length,
          },
          {
            label: appDict.status.pending ?? "pending",
            value: items.filter((item) => item.pending).length,
          },
          {
            label: domain.projectsWithoutHandover,
            value: portfolio.filter((item) => item.operations.handoverState === "not_scheduled")
              .length,
          },
        ]}
      >
        {items.map((item) => {
          const activeWarrantyCount =
            item.operations?.warrantyRows.filter((row) => {
              const status = getPreviewRowStatus(row);
              return status === "open" || status === "in_progress" || status === "pending";
            }).length ?? 0;
          return (
            <DomainRecordCard
              appDict={appDict}
              key={item.row.id}
              title={
                item.project
                  ? localized(item.project.title, locale)
                  : rowLabel(item.row, "project", locale)
              }
              reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
              badges={<StatusBadge appDict={appDict} status={item.status} />}
              summaryItems={[
                meta(cols.customer, rowLabel(item.row, "customer", locale)),
                meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
                meta(cols.project, rowLabel(item.row, "project", locale), { dir: "ltr" }),
                meta(
                  cols.progress,
                  item.project ? (
                    <ProgressMeter
                      appDict={appDict}
                      locale={locale}
                      value={item.project.progress}
                    />
                  ) : (
                    operations.notRecorded
                  ),
                ),
              ]}
              detailChildren={
                <>
                  {item.operations ? (
                    <div className="domain-context-note">
                      <strong>{domain.recordedSignals}</strong>
                      <div>
                        {projectActions.blockers}:{" "}
                        {formatNumber(item.operations.blockerRows.length, locale)} ·{" "}
                        {appDict.dashboard.statUnresolvedFindings}:{" "}
                        {formatNumber(item.operations.unresolvedFindings, locale)} ·{" "}
                        {projectActions.pendingReports}:{" "}
                        {formatNumber(item.operations.pendingReports, locale)} ·{" "}
                        {domain.activeAftercare}: {formatNumber(activeWarrantyCount, locale)}
                      </div>
                    </div>
                  ) : null}
                  <HandoverDetailBlock
                    locale={locale}
                    appDict={appDict}
                    reference={item.reference}
                  />
                </>
              }
              relationships={
                item.links.length > 0 ? (
                  <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
                ) : undefined
              }
              actions={
                <>
                  {item.project ? (
                    <Link
                      className="btn btn-ghost btn-sm"
                      href={`${projectWorkspaceHref(locale, item.project.id)}#project-handover`}
                    >
                      {projectActions.reviewHandover}
                    </Link>
                  ) : null}
                  {item.pending
                    ? unavailableButton(
                        domain.actions.completeHandover,
                        domain.completeHandoverUnavailable,
                      )
                    : unavailableButton(
                        domain.actions.scheduleHandover,
                        domain.scheduleHandoverUnavailable,
                      )}
                </>
              }
            />
          );
        })}
      </BoardShell>
    );
  }

  if (moduleKey === "warranty") {
    const items = getPreviewWarrantyItems();
    const coveredProjects = new Set(items.map((item) => item.row.links?.projectId).filter(Boolean));
    content = (
      <BoardShell
        locale={locale}
        title={domain.warrantyTitle}
        variant="lifecycle"
        intro={domain.warrantyIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.activeAftercare, value: items.filter((item) => item.active).length },
          {
            label: appDict.status.resolved ?? "resolved",
            value: items.filter((item) => item.status === "resolved").length,
          },
          { label: domain.projectsCovered, value: coveredProjects.size },
        ]}
      >
        {items.map((item) => (
          <DomainRecordCard
            appDict={appDict}
            key={item.row.id}
            kind={item.active ? domain.activeAftercare : undefined}
            title={rowLabel(item.row, "title", locale)}
            reference={<span dir="ltr">{item.reference ?? item.row.id}</span>}
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(cols.project, rowLabel(item.row, "project", locale), { dir: "ltr" }),
              meta(cols.date, item.date ? formatDate(item.date, locale) : operations.notRecorded),
            ]}
            detailItems={[]}
            detailChildren={
              <WarrantyDetailBlock locale={locale} appDict={appDict} reference={item.reference} />
            }
            relationships={
              item.links.length > 0 ? (
                <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              ) : undefined
            }
            actions={
              <>
                {item.row.links?.projectId ? (
                  <Link
                    className="btn btn-ghost btn-sm"
                    href={`${projectWorkspaceHref(locale, item.row.links.projectId)}#project-handover`}
                  >
                    {operations.projectActions.reviewHandover}
                  </Link>
                ) : null}
                {unavailableButton(
                  domain.actions.scheduleWarrantyVisit,
                  domain.scheduleWarrantyVisitUnavailable,
                )}
                {unavailableButton(
                  domain.actions.closeWarrantyItem,
                  domain.closeWarrantyUnavailable,
                )}
              </>
            }
          />
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "notifications") {
    content = (
      <NotificationsBoard
        key={moduleKey}
        locale={locale}
        appDict={appDict}
        onUnavailable={setNotice}
      />
    );
  }

  if (moduleKey === "audit") {
    content = (
      <AuditBoard key={moduleKey} locale={locale} appDict={appDict} onUnavailable={setNotice} />
    );
  }

  return (
    <>
      {content}
      <InfoDialog
        open={Boolean(notice)}
        title={appDict.previewUnavailableTitle}
        closeLabel={appDict.close}
        onClose={() => setNotice(null)}
      >
        <p>{notice ?? operations.unavailableInPreview}</p>
      </InfoDialog>
    </>
  );
}
