import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary, type AppDictionary } from "@/content/app-dictionary";
import type { PreviewModuleRow } from "@/content/preview-modules";
import {
  getPreviewAdminOverview,
  getPreviewCellText,
  getPreviewRowDate,
  getPreviewRowReference,
  getPreviewRowStatus,
} from "@/lib/admin-preview";
import { clampPercent, formatDate, formatNumber, formatPercent } from "@/lib/format";
import { dashboardHref, dashboardModules, type DashboardModuleKey } from "@/config/navigation";
import { Arrow } from "@/components/ui/Pieces";
import {
  ProgressMeter,
  RecordListItem,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";
import { erpHref } from "@/config/erp";
import { erpText } from "@/content/erp-dictionary";
import { OverviewExpansion } from "@/components/dashboard/OverviewExpansion";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).dashboard.overviewTitle };
}

function moduleHref(locale: Locale, module: DashboardModuleKey): string {
  return dashboardHref(locale, dashboardModules.find((item) => item.key === module)?.segment ?? "");
}

function cellLabel(row: PreviewModuleRow, key: string, locale: Locale): string {
  const value = getPreviewCellText(row.cells[key]);
  if (!value) return "";
  return typeof value === "string" ? value : pick(value, locale);
}

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
}

function Panel({
  title,
  href,
  linkLabel,
  className,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section className={className ? `panel ${className}` : "panel"}>
      <div className="panel-head">
        <h2 style={{ fontSize: "1.05rem" }}>{title}</h2>
        {href && linkLabel ? (
          <Link href={href} className="btn btn-ghost btn-sm">
            {linkLabel} <Arrow />
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function EmptyPanelText({ children }: { children: ReactNode }) {
  return <p style={{ padding: "20px", color: "var(--color-muted)" }}>{children}</p>;
}

type OverviewActionQueueItem = ReturnType<typeof getPreviewAdminOverview>["actionQueue"][number];

function localizedQueueText(value: OverviewActionQueueItem["title"], locale: Locale): string {
  return typeof value === "string" ? value : pick(value, locale);
}

function actionQueueKindLabel(app: AppDictionary, item: OverviewActionQueueItem): string {
  const operations = app.dashboard.operations;
  if (item.kind === "milestone" && item.milestoneState) {
    return operations.domain.milestoneStates[item.milestoneState];
  }
  return operations.actionQueue.kinds[item.kind];
}

export default async function DashboardOverview({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  const d = app.dashboard;
  const overview = getPreviewAdminOverview();
  const metrics = overview.metrics;

  const primaryStats = [
    {
      label: d.statActiveProjects,
      value: metrics.activeProjects,
      note: d.statNotes.projects,
      icon: "⬢",
      href: moduleHref(locale, "projects"),
    },
    {
      label: d.statNewRequests,
      value: metrics.newRequests,
      note: d.statNotes.requests,
      icon: "✉",
      href: moduleHref(locale, "requests"),
    },
    {
      label: d.statQuotationsDecision,
      value: metrics.quotationsAwaitingDecision,
      note: d.statNotes.quotations,
      icon: "▤",
      href: moduleHref(locale, "quotations"),
    },
    {
      label: d.statOverdueMilestones,
      value: metrics.overdueMilestones,
      note: d.statNotes.overdue,
      icon: "⚑",
      href: moduleHref(locale, "milestones"),
    },
  ];

  const secondaryStats = [
    {
      label: d.statInspectionsWeek,
      value: metrics.upcomingInspections,
      href: moduleHref(locale, "inspections"),
    },
    {
      label: d.statPendingContracts,
      value: metrics.pendingContracts,
      href: moduleHref(locale, "contracts"),
    },
    {
      label: d.statUnresolvedFindings,
      value: metrics.unresolvedFindings,
      href: moduleHref(locale, "issues"),
    },
    {
      label: d.statPendingReports,
      value: metrics.pendingReports,
      href: moduleHref(locale, "reports"),
    },
  ];

  const actionQueueItems = overview.actionQueue.slice(0, 8);
  const recentActivityItems = overview.recentActivityRows.slice(0, 5);
  const maxFlowCount = Math.max(1, ...overview.operationalFlow.map((stage) => stage.count));
  const averageActiveProgress =
    overview.activeProjects.length > 0
      ? Math.round(
          overview.activeProjects.reduce(
            (total, project) => total + clampPercent(project.progress),
            0,
          ) / overview.activeProjects.length,
        )
      : null;

  return (
    <div className="executive-dashboard">
      <div className="dashboard-intro">
        <p className="dashboard-snapshot">
          {d.snapshotAsOf} {formatDate(overview.snapshotDate, locale)}
        </p>
        <div className="dashboard-intro-actions">
          <Link className="btn erp-workspace-entry" href={erpHref(locale)}>
            {erpText("workspace", locale)}
          </Link>
          <Link className="btn btn-primary" href={moduleHref(locale, "requests")}>
            {d.ownerActions.reviewRequests}
          </Link>
          <Link className="btn btn-outline" href={moduleHref(locale, "projects")}>
            {d.ownerActions.viewProjects}
          </Link>
          <Link className="btn btn-ghost" href={moduleHref(locale, "notifications")}>
            {d.ownerActions.viewAlerts}
          </Link>
        </div>
      </div>

      <div className="stat-grid executive-kpi-band" aria-label={d.overviewTitle}>
        {primaryStats.map((stat) => (
          <Link
            className="stat-card"
            key={stat.label}
            href={stat.href}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div className="stat-label">
              <span>{stat.label}</span>
            </div>
            <div className="stat-value">{formatNumber(stat.value, locale)}</div>
            <div className="stat-note">{stat.note}</div>
          </Link>
        ))}
      </div>

      <Panel title={d.attentionTitle} className="dashboard-priority">
        <div className="panel-body" style={{ paddingBlockEnd: 0 }}>
          <p style={{ color: "var(--color-muted)" }}>{d.operations.actionQueue.intro}</p>
          <p
            style={{
              color: "var(--color-muted)",
              fontSize: "0.86rem",
              marginBlockStart: 8,
            }}
          >
            {formatNumber(actionQueueItems.length, locale)} {app.showingResults} ·{" "}
            {formatNumber(overview.actionQueue.length, locale)} {d.operations.actionQueue.total}
          </p>
        </div>
        {actionQueueItems.length > 0 ? (
          <div className="list-rows priority-list">
            {actionQueueItems.map((item) => {
              const title = localizedQueueText(item.title, locale);
              return (
                <div className="list-row action-queue-row priority-item" key={item.id}>
                  <div className="lr-main">
                    <div className="lr-title">{title}</div>
                    <div className="lr-sub">
                      {actionQueueKindLabel(app, item)} · <span dir="ltr">{item.reference}</span>
                      {item.date ? ` · ${formatDate(item.date, locale)}` : ""}
                      {item.requestNextAction
                        ? ` · ${d.operations.nextActions[item.requestNextAction]}`
                        : ""}
                    </div>
                  </div>
                  <StatusBadge appDict={app} status={item.status} />
                  <Link
                    href={dashboardHref(locale, item.dashboardSegment)}
                    className="btn btn-ghost btn-sm"
                    aria-label={`${d.operations.actionQueue.reviewRecord}: ${item.reference}`}
                  >
                    {d.operations.actionQueue.reviewRecord}
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyPanelText>{d.noAttentionItems}</EmptyPanelText>
        )}
      </Panel>

      <div className="two-col executive-columns">
        <div
          className="executive-main-column"
          style={{ display: "flex", flexDirection: "column", gap: 22 }}
        >
          <Panel
            title={d.activeProjectsTitle}
            href={moduleHref(locale, "projects")}
            linkLabel={d.viewAll}
          >
            {averageActiveProgress !== null ? (
              <div className="executive-project-summary">
                <span>
                  {d.activeProjectsTitle} · {d.cols.progress}
                </span>
                <ProgressMeter
                  appDict={app}
                  locale={locale}
                  value={averageActiveProgress}
                  label={`${d.activeProjectsTitle} · ${d.cols.progress}`}
                />
              </div>
            ) : null}
            <div className="record-list">
              {overview.activeProjects.map((project) => {
                const progress = clampPercent(project.progress);
                const title = pick(project.title, locale);
                return (
                  <RecordListItem
                    key={project.id}
                    title={title}
                    reference={<span dir="ltr">{project.id}</span>}
                    summaryItems={[
                      meta(d.cols.customer, pick(project.customer, locale)),
                      meta(d.cols.milestone, pick(project.currentMilestone, locale)),
                      meta(d.cols.updated, formatDate(project.updatedAt, locale)),
                    ]}
                    badges={<StatusBadge appDict={app} status={project.status} />}
                    actions={
                      <Link
                        className="btn btn-outline btn-sm"
                        href={dashboardHref(locale, `projects/${encodeURIComponent(project.id)}`)}
                      >
                        {d.openProjectWorkspace}
                      </Link>
                    }
                    showDetailsLabel={app.showDetails}
                    hideDetailsLabel={app.hideDetails}
                    detailsTitle={app.recordMoreDetails}
                  >
                    <div className="record-list-progress">
                      <span>{d.cols.progress}</span>
                      <ProgressMeter
                        appDict={app}
                        locale={locale}
                        value={progress}
                        label={`${title} · ${d.cols.progress}`}
                      />
                    </div>
                  </RecordListItem>
                );
              })}
            </div>
          </Panel>
          <Panel
            title={d.recentRequestsTitle}
            href={moduleHref(locale, "requests")}
            linkLabel={d.viewAll}
          >
            <div className="record-list">
              {overview.recentRequests.map((request) => (
                <RecordListItem
                  key={request.id}
                  title={pick(request.customerName, locale)}
                  reference={<span dir="ltr">{request.id}</span>}
                  summaryItems={[
                    meta(d.cols.service, pick(request.serviceLabel, locale)),
                    meta(d.cols.date, formatDate(request.submittedAt, locale)),
                  ]}
                  detailItems={[meta(d.cols.customer, request.customerId, { dir: "ltr" })]}
                  badges={<StatusBadge appDict={app} status={request.status} />}
                  showDetailsLabel={app.showDetails}
                  hideDetailsLabel={app.hideDetails}
                  detailsTitle={app.recordMoreDetails}
                />
              ))}
            </div>
          </Panel>
        </div>

        <div
          className="executive-side-column"
          style={{ display: "flex", flexDirection: "column", gap: 22 }}
        >
          <Panel
            title={d.upcomingInspectionsTitle}
            href={moduleHref(locale, "inspections")}
            linkLabel={d.viewAll}
          >
            {overview.upcomingInspectionRows.length > 0 ? (
              <div className="record-list">
                {overview.upcomingInspectionRows.map((row) => (
                  <RecordListItem
                    key={row.id}
                    title={`${cellLabel(row, "customer", locale)} · ${cellLabel(row, "service", locale)}`}
                    reference={<span dir="ltr">{getPreviewRowReference(row)}</span>}
                    summaryItems={[
                      meta(d.cols.date, formatDate(getPreviewRowDate(row) ?? "", locale)),
                      meta(d.cols.assignee, cellLabel(row, "assignee", locale)),
                    ]}
                    badges={<StatusBadge appDict={app} status={getPreviewRowStatus(row)} />}
                    showDetailsLabel={app.showDetails}
                    hideDetailsLabel={app.hideDetails}
                    detailsTitle={app.recordMoreDetails}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanelText>{d.noUpcomingInspections}</EmptyPanelText>
            )}
          </Panel>

          <Panel
            title={d.upcomingMilestonesTitle}
            href={moduleHref(locale, "milestones")}
            linkLabel={d.viewAll}
          >
            {overview.upcomingMilestoneRows.length > 0 ? (
              <div className="record-list">
                {overview.upcomingMilestoneRows.map((row) => {
                  const progressCell = row.cells.progress;
                  const progress = progressCell?.kind === "progress" ? progressCell.value : null;
                  return (
                    <RecordListItem
                      key={row.id}
                      title={cellLabel(row, "milestone", locale)}
                      reference={
                        <>
                          {d.cols.project} ·{" "}
                          <span dir="ltr">{cellLabel(row, "project", locale)}</span>
                        </>
                      }
                      summaryItems={[
                        meta(d.cols.dueDate, formatDate(getPreviewRowDate(row) ?? "", locale)),
                        ...(progress !== null
                          ? [meta(d.cols.progress, formatPercent(progress, locale))]
                          : []),
                      ]}
                      badges={<StatusBadge appDict={app} status={getPreviewRowStatus(row)} />}
                      showDetailsLabel={app.showDetails}
                      hideDetailsLabel={app.hideDetails}
                      detailsTitle={app.recordMoreDetails}
                    />
                  );
                })}
              </div>
            ) : (
              <EmptyPanelText>{d.noUpcomingMilestones}</EmptyPanelText>
            )}
            <div className="panel-body" style={{ paddingBlockStart: 0 }}>
              {overview.overdueMilestoneRows.length === 0 ? (
                <div className="alert alert-success" role="note">
                  <span aria-hidden="true">✓</span>
                  <p>{d.noOverdueMilestones}</p>
                </div>
              ) : (
                <div className="alert alert-warning" role="note">
                  <span aria-hidden="true">⚠</span>
                  <p>
                    {d.statOverdueMilestones}:{" "}
                    {formatNumber(overview.overdueMilestoneRows.length, locale)}
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel title={d.secondaryMetricsTitle}>
            <div className="secondary-metric-list">
              {secondaryStats.map((stat) => (
                <Link className="secondary-metric" key={stat.label} href={stat.href}>
                  <span>{stat.label}</span>
                  <strong>{formatNumber(stat.value, locale)}</strong>
                </Link>
              ))}
            </div>
          </Panel>

          <Panel
            title={d.recentActivityTitle}
            href={moduleHref(locale, "audit")}
            linkLabel={d.viewAll}
          >
            {recentActivityItems.length > 0 ? (
              <div className="record-list">
                {recentActivityItems.map((row) => (
                  <RecordListItem
                    key={row.id}
                    title={cellLabel(row, "action", locale)}
                    reference={
                      <>
                        {d.cols.entity} · <span dir="ltr">{cellLabel(row, "entity", locale)}</span>
                      </>
                    }
                    summaryItems={[
                      meta(d.cols.actor, cellLabel(row, "actor", locale)),
                      meta(d.cols.date, formatDate(getPreviewRowDate(row) ?? "", locale)),
                    ]}
                    badges={<StatusBadge appDict={app} status={getPreviewRowStatus(row)} />}
                    showDetailsLabel={app.showDetails}
                    hideDetailsLabel={app.hideDetails}
                    detailsTitle={app.recordMoreDetails}
                  />
                ))}
              </div>
            ) : (
              <EmptyPanelText>{d.noRecentActivity}</EmptyPanelText>
            )}
          </Panel>
        </div>
      </div>
      <Panel title={d.operationalFlowTitle} className="dashboard-secondary-flow">
        <div className="panel-body" style={{ paddingBlockEnd: 0 }}>
          <p style={{ color: "var(--color-muted)", maxWidth: 980 }}>{d.operationalFlowLead}</p>
        </div>
        <ol className="ops-flow">
          {overview.operationalFlow.map((stage, index) => (
            <li key={stage.key}>
              <Link href={moduleHref(locale, stage.module)}>
                <span className="ops-flow-index" aria-hidden="true">
                  {formatNumber(index + 1, locale)}
                </span>
                <span className="ops-flow-main">
                  <span className="ops-flow-topline">
                    <span className="ops-flow-label">{d.operationalFlowStages[stage.key]}</span>
                    <strong className="ops-flow-count">
                      {formatNumber(stage.count, locale)} {d.operationalFlowCount}
                    </strong>
                  </span>
                  <span className="ops-flow-bar" aria-hidden="true">
                    <span style={{ width: `${(stage.count / maxFlowCount) * 100}%` }} />
                  </span>
                </span>
                <span style={{ marginInlineStart: "auto" }} aria-hidden="true">
                  <Arrow />
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </Panel>
      <OverviewExpansion locale={locale} appDict={app} />
    </div>
  );
}
