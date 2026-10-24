import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary, statusBadgeClass, type AppDictionary } from "@/content/app-dictionary";
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

function StatusBadge({ app, status }: { app: AppDictionary; status?: string }) {
  if (!status) return null;
  return <span className={statusBadgeClass(status)}>{app.status[status] ?? status}</span>;
}

function Panel({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel">
      <div className="panel-head">
        <h3 style={{ fontSize: "1.05rem" }}>{title}</h3>
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

function actionQueueIcon(item: OverviewActionQueueItem): string {
  switch (item.kind) {
    case "projectBlocker":
      return "⚠";
    case "requestReview":
      return "✉";
    case "milestone":
      return "⚑";
    case "pendingReport":
      return "▥";
    case "pendingHandover":
      return "🔑";
    case "quotationDecision":
      return "▤";
    case "pendingContract":
      return "▣";
    case "activeWarranty":
      return "⛨";
  }
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

  const stats = [
    {
      label: d.statNewRequests,
      value: metrics.newRequests,
      note: d.statNotes.requests,
      icon: "✉",
      href: moduleHref(locale, "requests"),
    },
    {
      label: d.statInspectionsWeek,
      value: metrics.upcomingInspections,
      note: d.statNotes.inspections,
      icon: "◎",
      href: moduleHref(locale, "inspections"),
    },
    {
      label: d.statQuotationsDecision,
      value: metrics.quotationsAwaitingDecision,
      note: d.statNotes.quotations,
      icon: "▤",
      href: moduleHref(locale, "quotations"),
    },
    {
      label: d.statPendingContracts,
      value: metrics.pendingContracts,
      note: d.statNotes.contracts,
      icon: "▣",
      href: moduleHref(locale, "contracts"),
    },
    {
      label: d.statActiveProjects,
      value: metrics.activeProjects,
      note: d.statNotes.projects,
      icon: "⬢",
      href: moduleHref(locale, "projects"),
    },
    {
      label: d.statOverdueMilestones,
      value: metrics.overdueMilestones,
      note: d.statNotes.overdue,
      icon: "⚑",
      href: moduleHref(locale, "milestones"),
    },
    {
      label: d.statUnresolvedFindings,
      value: metrics.unresolvedFindings,
      note: d.statNotes.findings,
      icon: "⚠",
      href: moduleHref(locale, "issues"),
    },
    {
      label: d.statPendingReports,
      value: metrics.pendingReports,
      note: d.statNotes.reports,
      icon: "▥",
      href: moduleHref(locale, "reports"),
    },
  ];

  const actionQueueItems = overview.actionQueue.slice(0, 10);

  return (
    <>
      <div>
        <h2 style={{ fontSize: "1.45rem" }}>{d.overviewTitle}</h2>
        <p style={{ color: "var(--color-muted)" }}>{d.overviewLead}</p>
        <p style={{ color: "var(--color-muted)", fontSize: "0.88rem", marginBlockStart: 6 }}>
          {d.snapshotAsOf} {formatDate(overview.snapshotDate, locale)}
        </p>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <Link
            className="stat-card"
            key={stat.label}
            href={stat.href}
            style={{ color: "inherit", textDecoration: "none" }}
          >
            <div className="stat-label">
              <span>{stat.label}</span>
              <span aria-hidden="true">{stat.icon}</span>
            </div>
            <div className="stat-value">{formatNumber(stat.value, locale)}</div>
            <div className="stat-note">{stat.note}</div>
          </Link>
        ))}
      </div>

      <Panel title={d.operationalFlowTitle}>
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
                <span>
                  <span className="ops-flow-label">{d.operationalFlowStages[stage.key]}</span>
                  <span className="ops-flow-count">
                    {formatNumber(stage.count, locale)} {d.operationalFlowCount}
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

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Panel title={d.attentionTitle}>
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
              <div className="list-rows">
                {actionQueueItems.map((item) => {
                  const title = localizedQueueText(item.title, locale);
                  return (
                    <div className="list-row action-queue-row" key={item.id}>
                      <span className="file-icon" aria-hidden="true">
                        {actionQueueIcon(item)}
                      </span>
                      <div className="lr-main">
                        <div className="lr-title">{title}</div>
                        <div className="lr-sub">
                          {actionQueueKindLabel(app, item)} ·{" "}
                          <span dir="ltr">{item.reference}</span>
                          {item.date ? ` · ${formatDate(item.date, locale)}` : ""}
                          {item.requestNextAction
                            ? ` · ${d.operations.nextActions[item.requestNextAction]}`
                            : ""}
                        </div>
                      </div>
                      <StatusBadge app={app} status={item.status} />
                      <Link
                        href={dashboardHref(locale, item.dashboardSegment)}
                        className="btn btn-ghost btn-sm"
                        aria-label={`${d.operations.actionQueue.reviewRecord}: ${item.reference}`}
                      >
                        {app.view}
                      </Link>
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyPanelText>{d.noAttentionItems}</EmptyPanelText>
            )}
          </Panel>

          <Panel
            title={d.recentRequestsTitle}
            href={moduleHref(locale, "requests")}
            linkLabel={d.viewAll}
          >
            <div className="table-wrap">
              <table className="data" style={{ minWidth: 620 }}>
                <thead>
                  <tr>
                    <th scope="col">{d.cols.reference}</th>
                    <th scope="col">{d.cols.customer}</th>
                    <th scope="col">{d.cols.service}</th>
                    <th scope="col">{d.cols.date}</th>
                    <th scope="col">{d.cols.status}</th>
                  </tr>
                </thead>
                <tbody>
                  {overview.recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td>
                        <span dir="ltr" style={{ fontWeight: 700 }}>
                          {request.id}
                        </span>
                      </td>
                      <td>
                        {pick(request.customerName, locale)}
                        <br />
                        <span
                          dir="ltr"
                          style={{ color: "var(--color-muted)", fontSize: "0.82rem" }}
                        >
                          {request.customerId}
                        </span>
                      </td>
                      <td>{pick(request.serviceLabel, locale)}</td>
                      <td>{formatDate(request.submittedAt, locale)}</td>
                      <td>
                        <StatusBadge app={app} status={request.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <Panel
            title={d.activeProjectsTitle}
            href={moduleHref(locale, "projects")}
            linkLabel={d.viewAll}
          >
            <div className="list-rows">
              {overview.activeProjects.map((project) => {
                const progress = clampPercent(project.progress);
                const title = pick(project.title, locale);
                return (
                  <div className="list-row" key={project.id} style={{ flexWrap: "wrap" }}>
                    <div className="lr-main" style={{ minWidth: 220 }}>
                      <div className="lr-title">{title}</div>
                      <div className="lr-sub">
                        <span dir="ltr">{project.id}</span> ·{" "}
                        {pick(project.currentMilestone, locale)} ·{" "}
                        {formatDate(project.updatedAt, locale)}
                      </div>
                    </div>
                    <span className="progress-row" style={{ flex: "1 1 180px" }}>
                      <span
                        className="progress"
                        role="progressbar"
                        aria-label={`${title}: ${formatPercent(progress, locale)}`}
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </span>
                      <strong>{formatPercent(progress, locale)}</strong>
                    </span>
                    <StatusBadge app={app} status={project.status} />
                    <Link
                      className="btn btn-outline btn-sm"
                      href={dashboardHref(locale, `projects/${encodeURIComponent(project.id)}`)}
                    >
                      {d.openProjectWorkspace}
                    </Link>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Panel
            title={d.upcomingInspectionsTitle}
            href={moduleHref(locale, "inspections")}
            linkLabel={d.viewAll}
          >
            {overview.upcomingInspectionRows.length > 0 ? (
              <div className="list-rows">
                {overview.upcomingInspectionRows.map((row) => (
                  <div className="list-row" key={row.id}>
                    <span className="file-icon" aria-hidden="true">
                      ◎
                    </span>
                    <div className="lr-main">
                      <div className="lr-title">
                        {cellLabel(row, "customer", locale)} · {cellLabel(row, "service", locale)}
                      </div>
                      <div className="lr-sub">
                        <span dir="ltr">{getPreviewRowReference(row)}</span> ·{" "}
                        {formatDate(getPreviewRowDate(row) ?? "", locale)} ·{" "}
                        {cellLabel(row, "assignee", locale)}
                      </div>
                    </div>
                    <StatusBadge app={app} status={getPreviewRowStatus(row)} />
                  </div>
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
              <div className="list-rows">
                {overview.upcomingMilestoneRows.map((row) => {
                  const progressCell = row.cells.progress;
                  const progress = progressCell?.kind === "progress" ? progressCell.value : null;
                  return (
                    <div className="list-row" key={row.id}>
                      <span className="file-icon" aria-hidden="true">
                        ⚑
                      </span>
                      <div className="lr-main">
                        <div className="lr-title">{cellLabel(row, "milestone", locale)}</div>
                        <div className="lr-sub">
                          <span dir="ltr">{cellLabel(row, "project", locale)}</span> ·{" "}
                          {d.cols.dueDate}: {formatDate(getPreviewRowDate(row) ?? "", locale)}
                          {progress !== null ? ` · ${formatPercent(progress, locale)}` : ""}
                        </div>
                      </div>
                      <StatusBadge app={app} status={getPreviewRowStatus(row)} />
                    </div>
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

          <Panel
            title={d.recentActivityTitle}
            href={moduleHref(locale, "audit")}
            linkLabel={d.viewAll}
          >
            {overview.recentActivityRows.length > 0 ? (
              <div className="list-rows">
                {overview.recentActivityRows.map((row) => (
                  <div className="list-row" key={row.id}>
                    <span className="file-icon" aria-hidden="true">
                      ☰
                    </span>
                    <div className="lr-main">
                      <div className="lr-title">{cellLabel(row, "action", locale)}</div>
                      <div className="lr-sub">
                        {cellLabel(row, "actor", locale)} ·{" "}
                        <span dir="ltr">{cellLabel(row, "entity", locale)}</span> ·{" "}
                        {formatDate(getPreviewRowDate(row) ?? "", locale)}
                      </div>
                    </div>
                    <StatusBadge app={app} status={getPreviewRowStatus(row)} />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyPanelText>{d.noRecentActivity}</EmptyPanelText>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
}
