"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import type { PreviewModuleRow } from "@/content/preview-modules";
import { dashboardHref, dashboardModules } from "@/config/navigation";
import {
  getPreviewAuditItems,
  getPreviewContractItems,
  getPreviewCustomerItems,
  getPreviewDiaryItems,
  getPreviewDocumentItems,
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
import { clampPercent, formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";

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

function StatusBadge({ appDict, status }: { appDict: AppDictionary; status?: string }) {
  if (!status) return null;
  return <span className={statusBadgeClass(status)}>{appDict.status[status] ?? status}</span>;
}

function PriorityBadge({ appDict, priority }: { appDict: AppDictionary; priority?: string }) {
  if (!priority) return null;
  const className =
    priority === "urgent"
      ? "badge badge-urgent"
      : priority === "high"
        ? "badge badge-progress"
        : "badge badge-neutral";
  return <span className={className}>{appDict.priority[priority] ?? priority}</span>;
}

function ProgressView({
  appDict,
  locale,
  value,
}: {
  appDict: AppDictionary;
  locale: Locale;
  value?: number;
}) {
  if (value === undefined) return null;
  const progress = clampPercent(value);
  const label = `${appDict.dashboard.cols.progress}: ${formatPercent(progress, locale)}`;
  return (
    <span className="progress-row">
      <span
        className="progress"
        role="progressbar"
        aria-label={label}
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <span style={{ width: `${progress}%` }} />
      </span>
      <span style={{ fontWeight: 600 }}>{formatPercent(progress, locale)}</span>
    </span>
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
          className="btn btn-ghost btn-sm"
          href={linkedRecordHref(locale, record)}
          aria-label={`${appDict.dashboard.operations.openRelated}: ${record.id}`}
        >
          {appDict.dashboard.linkedKinds[record.kind]} · <span dir="ltr">{record.id}</span>
        </Link>
      ))}
    </div>
  );
}

function BoardShell({
  locale,
  title,
  intro,
  stats,
  controls,
  children,
}: {
  locale: Locale;
  title: string;
  intro: string;
  stats: Array<{ label: string; value: number }>;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="panel domain-board">
      <div className="panel-head domain-board-head">
        <div>
          <h2>{title}</h2>
          <p>{intro}</p>
        </div>
      </div>
      <div className="domain-stats" role="list">
        {stats.map((stat) => (
          <div className="domain-stat" role="listitem" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{formatNumber(stat.value, locale)}</strong>
          </div>
        ))}
      </div>
      {controls}
      <div className="domain-card-grid">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="domain-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
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
          <>
            <label className="sr-only" htmlFor={`${idPrefix}-status`}>
              {appDict.allStatuses}
            </label>
            <select
              id={`${idPrefix}-status`}
              className="form-select"
              style={{ width: "auto" }}
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
          </>
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
    <div className="domain-empty">
      <p aria-hidden="true">⌕</p>
      <p>{appDict.noResults}</p>
      <button type="button" className="btn btn-outline btn-sm" onClick={onClear}>
        {appDict.clearFilters}
      </button>
    </div>
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
          <article
            className={item.requiresReview ? "domain-card domain-card-blocker" : "domain-card"}
            key={item.row.id}
          >
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.entityReference ?? item.row.id}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
                {item.requiresReview ? (
                  <p className="domain-blocker-label">{operations.needsAttention}</p>
                ) : null}
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.entity}>
                <span dir="ltr">{item.entityReference ?? operations.notRecorded}</span>
              </Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={domain.deliveryChannel}>{operations.notRecorded}</Field>
              <Field label={domain.recipient}>{operations.notRecorded}</Field>
            </dl>
            {item.requiresReview ? (
              <p className="domain-context-note">{domain.notificationReviewNote}</p>
            ) : null}
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
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
            </div>
          </article>
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

  return (
    <BoardShell
      locale={locale}
      title={domain.auditTitle}
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
        filtered.map((item) => (
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.entityReference ?? item.row.id}
                </p>
                <h3>{localized(item.action, locale)}</h3>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.actor}>{localized(item.actor, locale)}</Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.entity}>
                <span dir="ltr">{item.entityReference ?? operations.notRecorded}</span>
              </Field>
              <Field label={appDict.dashboard.linkedRecords}>
                {formatNumber(item.links.length, locale)}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
          </article>
        ))
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
  previewLimit,
}: {
  locale: Locale;
  appDict: AppDictionary;
  moduleKey: DomainBoardModuleKey;
  previewLimit?: string;
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
            <article className="domain-card" key={item.customerId}>
              <header>
                <div>
                  <p className="domain-reference" dir="ltr">
                    {item.customerId}
                  </p>
                  <h3>{rowLabel(item.row, "name", locale)}</h3>
                </div>
                <StatusBadge appDict={appDict} status={item.status} />
              </header>
              <dl className="domain-fields">
                <Field label={cols.phone}>
                  <span dir="ltr">{rowLabel(item.row, "phone", locale)}</span>
                </Field>
                <Field label={cols.city}>{rowLabel(item.row, "city", locale)}</Field>
                <Field label={domain.recordedRequests}>
                  {formatNumber(item.context.requests.length, locale)}
                </Field>
                <Field label={domain.recordedProjects}>
                  {formatNumber(item.context.projects.length, locale)}
                </Field>
                <Field label={domain.latestRequest}>
                  {latestRequest ? (
                    <>
                      <span dir="ltr">{latestRequest.id}</span> ·{" "}
                      {formatDate(latestRequest.submittedAt, locale)}
                    </>
                  ) : (
                    operations.notRecorded
                  )}
                </Field>
                <Field label={domain.customerNextStep}>
                  {latestRequest && latestWorkflow
                    ? operations.nextActions[latestWorkflow.nextAction]
                    : operations.notRecorded}
                </Field>
                <Field label={operations.needsAttention}>
                  {latestWorkflow && latestWorkflow.blockers.length > 0
                    ? formatNumber(latestWorkflow.blockers.length, locale)
                    : operations.noBlockers}
                </Field>
              </dl>
              {latestRequest ? (
                <p className="domain-note">
                  {localized(latestRequest.serviceLabel, locale)} ·{" "}
                  {appDict.status[latestRequest.status] ?? latestRequest.status}
                </p>
              ) : null}
              {item.context.projects.length > 0 ? (
                <>
                  <p className="domain-context-note">{domain.customerContextNote}</p>
                  <div className="domain-inline-list">
                    {item.context.projects.map((project) => (
                      <Link
                        key={project.id}
                        className="btn btn-ghost btn-sm"
                        href={projectWorkspaceHref(locale, project.id)}
                        aria-label={`${appDict.dashboard.openProjectWorkspace}: ${project.id}`}
                      >
                        {appDict.dashboard.openProjectWorkspace} ·{" "}
                        <span dir="ltr">{project.id}</span>
                      </Link>
                    ))}
                  </div>
                </>
              ) : null}
              <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              <div className="domain-actions">
                {unavailableButton(domain.actions.editCustomer, domain.editCustomerUnavailable)}
              </div>
            </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.reference ?? item.row.id}
                </p>
                <h3>{rowLabel(item.row, "service", locale)}</h3>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.customer}>{rowLabel(item.row, "customer", locale)}</Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.assignee}>{rowLabel(item.row, "assignee", locale)}</Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {item.isUpcoming
                ? unavailableButton(domain.actions.completeInspection, domain.completeUnavailable)
                : unavailableButton(domain.actions.scheduleInspection, domain.scheduleUnavailable)}
            </div>
          </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.reference ?? item.row.id}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
                <p className="domain-kind">{item.kind === "boq" ? domain.boq : domain.quotation}</p>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.customer}>{rowLabel(item.row, "customer", locale)}</Field>
              <Field label={domain.amount}>
                {item.amount !== undefined
                  ? formatMoney(item.amount, locale)
                  : operations.notRecorded}
              </Field>
              <Field label={cols.date}>
                {rowLabel(item.row, "date", locale)
                  ? formatDate(rowLabel(item.row, "date", locale), locale)
                  : operations.notRecorded}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {unavailableButton(domain.actions.editBoq, domain.boqEditorUnavailable)}
              {unavailableButton(domain.actions.sendQuotation, domain.sendUnavailable)}
            </div>
          </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.reference ?? item.row.id}
                </p>
                <h3>{rowLabel(item.row, "type", locale)}</h3>
                <p className="domain-kind">
                  {item.kind === "changeOrder" ? domain.changeOrder : domain.contract}
                </p>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>{rowLabel(item.row, "project", locale)}</Field>
              <Field label={domain.amount}>
                {item.amount !== undefined
                  ? formatMoney(item.amount, locale)
                  : operations.notRecorded}
              </Field>
              <Field label={cols.date}>
                {rowLabel(item.row, "date", locale)
                  ? formatDate(rowLabel(item.row, "date", locale), locale)
                  : operations.notRecorded}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {item.kind === "changeOrder"
                ? unavailableButton(domain.actions.approveChangeOrder, domain.approveUnavailable)
                : unavailableButton(domain.actions.manageContract, domain.signUnavailable)}
            </div>
          </article>
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
            <article
              className={
                item.operations.blockerRows.length > 0
                  ? "domain-card domain-card-blocker"
                  : "domain-card"
              }
              key={item.project.id}
            >
              <header>
                <div>
                  <p className="domain-reference" dir="ltr">
                    {item.project.id}
                  </p>
                  <h3>{localized(item.project.title, locale)}</h3>
                  <p className="domain-kind">{localized(item.project.serviceLabel, locale)}</p>
                </div>
                <StatusBadge appDict={appDict} status={item.project.status} />
              </header>
              <dl className="domain-fields">
                <Field label={cols.customer}>{localized(item.project.customer, locale)}</Field>
                <Field label={cols.updated}>{formatDate(item.project.updatedAt, locale)}</Field>
                <Field label={cols.progress}>
                  <ProgressView appDict={appDict} locale={locale} value={item.project.progress} />
                </Field>
                <Field label={cols.milestone}>
                  {localized(item.project.currentMilestone, locale)}
                </Field>
                <Field label={projectActions.nextMilestone}>
                  {item.operations.nextMilestone
                    ? localized(item.operations.nextMilestone.title, locale)
                    : operations.notRecorded}
                </Field>
                <Field label={projectActions.latestProgress}>
                  {item.operations.latestProgressRow
                    ? rowLabel(item.operations.latestProgressRow, "milestone", locale)
                    : operations.notRecorded}
                </Field>
                <Field label={projectActions.blockers}>
                  {formatNumber(item.operations.blockerRows.length, locale)}
                  {blockerReferences.length > 0 ? (
                    <span dir="ltr"> · {blockerReferences.join(" · ")}</span>
                  ) : null}
                </Field>
                <Field label={projectActions.pendingReports}>
                  {formatNumber(item.operations.pendingReports, locale)}
                </Field>
                <Field label={projectActions.handoverState}>{handoverLabel}</Field>
              </dl>
              <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              <div className="domain-actions">
                <Link
                  className="btn btn-primary btn-sm"
                  href={projectWorkspaceHref(locale, item.project.id)}
                >
                  {appDict.dashboard.openProjectWorkspace}
                </Link>
                {unavailableButton(
                  domain.actions.editProjectPlan,
                  domain.editProjectPlanUnavailable,
                )}
              </div>
            </article>
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
          <article
            className={
              item.scheduleState === "overdue" ? "domain-card domain-card-blocker" : "domain-card"
            }
            key={item.row.id}
          >
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.projectId ?? rowLabel(item.row, "project", locale)}
                </p>
                <h3>{localized(item.title, locale)}</h3>
                <p className="domain-kind">{domain.milestoneStates[item.scheduleState]}</p>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.dueDate}>
                {item.due ? formatDate(item.due, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.progress}>
                <ProgressView appDict={appDict} locale={locale} value={item.progress} />
              </Field>
              <Field label={cols.status}>
                {item.status
                  ? (appDict.status[item.status] ?? item.status)
                  : operations.notRecorded}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {item.projectId ? (
                <Link
                  className="btn btn-ghost btn-sm"
                  href={projectWorkspaceHref(locale, item.projectId)}
                >
                  {appDict.dashboard.openProjectWorkspace}
                </Link>
              ) : null}
              {unavailableButton(domain.actions.updateMilestone, domain.updateMilestoneUnavailable)}
            </div>
          </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference">
                  {item.date ? formatDate(item.date, locale) : operations.notRecorded}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.actor}>{rowLabel(item.row, "actor", locale)}</Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {item.row.links?.projectId ? (
                <Link
                  className="btn btn-ghost btn-sm"
                  href={projectWorkspaceHref(locale, item.row.links.projectId)}
                >
                  {appDict.dashboard.openProjectWorkspace}
                </Link>
              ) : null}
              {unavailableButton(domain.actions.editDiaryEntry, domain.editDiaryUnavailable)}
            </div>
          </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {rowLabel(item.row, "project", locale)}
                </p>
                <h3>{rowLabel(item.row, "milestone", locale)}</h3>
                <p className="domain-kind">
                  {item.latestForProject ? domain.latestForProject : domain.earlierRecord}
                </p>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.progress}>
                <ProgressView appDict={appDict} locale={locale} value={item.progress} />
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {item.row.links?.projectId ? (
                <Link
                  className="btn btn-ghost btn-sm"
                  href={projectWorkspaceHref(locale, item.row.links.projectId)}
                >
                  {appDict.dashboard.openProjectWorkspace}
                </Link>
              ) : null}
              {unavailableButton(domain.actions.updateProgress, domain.updateProgressUnavailable)}
            </div>
          </article>
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
            <article
              className={item.blocker ? "domain-card domain-card-blocker" : "domain-card"}
              key={`${item.moduleKey}-${item.row.id}`}
            >
              <header>
                <div>
                  <p className="domain-reference" dir="ltr">
                    {item.reference ?? item.row.id}
                  </p>
                  <h3>{rowLabel(item.row, "title", locale)}</h3>
                  {item.blocker ? <p className="domain-blocker-label">{domain.blocker}</p> : null}
                </div>
                <span className="domain-badges">
                  <PriorityBadge appDict={appDict} priority={item.severity} />
                  <StatusBadge appDict={appDict} status={item.status} />
                </span>
              </header>
              <dl className="domain-fields">
                <Field label={cols.project}>
                  <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
                </Field>
                <Field label={cols.assignee}>{assignee || operations.notRecorded}</Field>
                <Field label={cols.date}>
                  {canonical ? formatDate(canonical.reportedAt, locale) : operations.notRecorded}
                </Field>
                <Field label={domain.correctiveAction}>
                  {canonical
                    ? localized(canonical.correctiveAction, locale)
                    : operations.notRecorded}
                </Field>
                <Field label={domain.reportedBy}>{operations.notRecorded}</Field>
                <Field label={domain.dueDate}>{operations.notRecorded}</Field>
              </dl>
              {canonical ? (
                <p className="domain-note">{localized(canonical.detail, locale)}</p>
              ) : null}
              <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              <div className="domain-actions">
                {unavailableButton(domain.actions.closeFinding, domain.closeUnavailable)}
              </div>
            </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {rowLabel(item.row, "week", locale)}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.progress}>
                <ProgressView
                  appDict={appDict}
                  locale={locale}
                  value={getPreviewRowProgress(item.row)}
                />
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {unavailableButton(domain.actions.approveReport, domain.approveReportUnavailable)}
              {unavailableButton(domain.actions.deliverReport, domain.deliverReportUnavailable)}
            </div>
          </article>
        ))}
      </BoardShell>
    );
  }

  if (moduleKey === "documents") {
    const items = getPreviewDocumentItems();
    const coveredProjects = new Set(items.map((item) => item.row.links?.projectId).filter(Boolean));
    content = (
      <BoardShell
        locale={locale}
        title={domain.documentsTitle}
        intro={domain.documentsIntro}
        stats={[
          { label: domain.summary, value: items.length },
          { label: domain.projectsCovered, value: coveredProjects.size },
          {
            label: "PDF",
            value: items.filter((item) => item.fileFormat === "PDF").length,
          },
        ]}
      >
        {items.map((item) => (
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.fileFormat ?? operations.notRecorded}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
                <p className="domain-kind">{rowLabel(item.row, "type", locale)}</p>
              </div>
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.type}>{rowLabel(item.row, "type", locale)}</Field>
              <Field label={cols.size}>{rowLabel(item.row, "size", locale)}</Field>
              <Field label={cols.updated}>
                {item.updated ? formatDate(item.updated, locale) : operations.notRecorded}
              </Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
              {unavailableButton(domain.actions.uploadDocument, domain.uploadDocumentUnavailable)}
              {unavailableButton(
                domain.actions.downloadDocument,
                domain.downloadDocumentUnavailable,
              )}
            </div>
          </article>
        ))}
      </BoardShell>
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
            <article className="domain-card" key={item.row.id}>
              <header>
                <div>
                  <p className="domain-reference" dir="ltr">
                    {item.reference ?? item.row.id}
                  </p>
                  <h3>
                    {item.project
                      ? localized(item.project.title, locale)
                      : rowLabel(item.row, "project", locale)}
                  </h3>
                </div>
                <StatusBadge appDict={appDict} status={item.status} />
              </header>
              <dl className="domain-fields">
                <Field label={cols.project}>
                  <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
                </Field>
                <Field label={cols.customer}>{rowLabel(item.row, "customer", locale)}</Field>
                <Field label={cols.date}>
                  {item.date ? formatDate(item.date, locale) : operations.notRecorded}
                </Field>
                <Field label={cols.progress}>
                  {item.project ? (
                    <ProgressView appDict={appDict} locale={locale} value={item.project.progress} />
                  ) : (
                    operations.notRecorded
                  )}
                </Field>
              </dl>
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
              <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
              <div className="domain-actions">
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
              </div>
            </article>
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
          <article className="domain-card" key={item.row.id}>
            <header>
              <div>
                <p className="domain-reference" dir="ltr">
                  {item.reference ?? item.row.id}
                </p>
                <h3>{rowLabel(item.row, "title", locale)}</h3>
                {item.active ? <p className="domain-kind">{domain.activeAftercare}</p> : null}
              </div>
              <StatusBadge appDict={appDict} status={item.status} />
            </header>
            <dl className="domain-fields">
              <Field label={cols.project}>
                <span dir="ltr">{rowLabel(item.row, "project", locale)}</span>
              </Field>
              <Field label={cols.date}>
                {item.date ? formatDate(item.date, locale) : operations.notRecorded}
              </Field>
              <Field label={cols.assignee}>{operations.notRecorded}</Field>
              <Field label={domain.dueDate}>{operations.notRecorded}</Field>
            </dl>
            <LinkedRecordLinks appDict={appDict} locale={locale} links={item.links} />
            <div className="domain-actions">
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
              {unavailableButton(domain.actions.closeWarrantyItem, domain.closeWarrantyUnavailable)}
            </div>
          </article>
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
        <p>{notice ?? previewLimit ?? operations.unavailableInPreview}</p>
        {previewLimit && notice !== previewLimit ? <p>{previewLimit}</p> : null}
      </InfoDialog>
    </>
  );
}
