import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import { dashboardHref, type DashboardModuleKey } from "@/config/navigation";
import {
  previewModuleTables,
  type PreviewCell,
  type PreviewModuleRow,
} from "@/content/preview-modules";
import type { PreviewProjectOperations } from "@/lib/admin-preview";
import {
  getPreviewRowDate,
  getPreviewRowProgress,
  getPreviewRowReference,
  getPreviewRowStatus,
} from "@/lib/admin-preview";
import { clampPercent, formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { Arrow } from "@/components/ui/Pieces";

function localizedValue(value: LocalizedText | string, locale: Locale): string {
  return typeof value === "string" ? value : pick(value, locale);
}

function StatusBadge({ appDict, status }: { appDict: AppDictionary; status: string }) {
  return <span className={statusBadgeClass(status)}>{appDict.status[status] ?? status}</span>;
}

function formatCell(cell: PreviewCell, locale: Locale, appDict: AppDictionary): string {
  switch (cell.kind) {
    case "text":
      return pick(cell.value, locale);
    case "status":
      return appDict.status[cell.value] ?? cell.value;
    case "priority":
      return appDict.priority[cell.value] ?? cell.value;
    case "progress":
      return formatPercent(cell.value, locale);
    case "money":
      return formatMoney(cell.value, locale);
    case "date":
      return formatDate(cell.value, locale);
    case "plain":
      return cell.value;
  }
}

function rowTitle(row: PreviewModuleRow, locale: Locale, appDict: AppDictionary): string {
  for (const key of ["title", "milestone", "type", "project", "ref", "entity"] as const) {
    const cell = row.cells[key];
    if (cell) return formatCell(cell, locale, appDict);
  }
  return row.id;
}

function ModuleRowsList({
  rows,
  module,
  locale,
  appDict,
}: {
  rows: PreviewModuleRow[];
  module: DashboardModuleKey;
  locale: Locale;
  appDict: AppDictionary;
}) {
  const d = appDict.dashboard;
  const table = previewModuleTables[module];
  if (rows.length === 0) {
    return (
      <p style={{ padding: "18px 20px", color: "var(--color-muted)" }}>{d.noProjectRecords}</p>
    );
  }

  const cols = d.cols as Record<string, string>;

  return (
    <div className="list-rows">
      {rows.map((row) => {
        const status = getPreviewRowStatus(row);
        const details = (table?.columns ?? [])
          .filter((column) => !["title", "project", "status"].includes(column.id))
          .map((column) => {
            const cell = row.cells[column.id];
            if (!cell) return null;
            return `${cols[column.labelKey] ?? column.labelKey}: ${formatCell(cell, locale, appDict)}`;
          })
          .filter(Boolean)
          .join(" · ");
        return (
          <div className="list-row" key={row.id} style={{ flexWrap: "wrap" }}>
            <div className="lr-main" style={{ flex: "1 1 220px" }}>
              <div className="lr-title">{rowTitle(row, locale, appDict)}</div>
              {details ? <div className="lr-sub">{details}</div> : null}
            </div>
            {status ? <StatusBadge appDict={appDict} status={status} /> : null}
          </div>
        );
      })}
    </div>
  );
}

function WorkspacePanel({
  id,
  title,
  href,
  linkLabel,
  children,
}: {
  id?: string;
  title: string;
  href?: string;
  linkLabel?: string;
  children: ReactNode;
}) {
  return (
    <section className="panel workspace-panel" id={id}>
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

function SubsectionTitle({ children }: { children: ReactNode }) {
  return (
    <h4
      style={{
        padding: "16px 20px 4px",
        fontSize: "0.95rem",
        color: "var(--color-charcoal)",
      }}
    >
      {children}
    </h4>
  );
}

export function ProjectWorkspace({
  locale,
  appDict,
  operations,
}: {
  locale: Locale;
  appDict: AppDictionary;
  operations: PreviewProjectOperations;
}) {
  const d = appDict.dashboard;
  const { project } = operations;
  const progress = clampPercent(project.progress);
  const canonicalIssueRefs = new Set(operations.canonicalIssues.map((issue) => issue.id));
  const additionalIssueRows = operations.issueRows.filter((row) => {
    const reference = row.cells.ref;
    return !(reference?.kind === "plain" && canonicalIssueRefs.has(reference.value));
  });
  const useCanonicalMilestones = operations.milestones.length > 0;
  const actionLabels = d.operations.projectActions;
  const nextMilestone = operations.nextMilestone;
  const latestProgressRow = operations.latestProgressRow;
  const latestProgressDate = latestProgressRow ? getPreviewRowDate(latestProgressRow) : undefined;
  const latestProgressValue = latestProgressRow
    ? getPreviewRowProgress(latestProgressRow)
    : undefined;
  const blockerReferences = operations.blockerRows
    .map((row) => getPreviewRowReference(row))
    .filter((reference): reference is string => Boolean(reference));
  const handoverStateLabel =
    operations.handoverState === "handed_over"
      ? actionLabels.handedOver
      : operations.handoverState === "pending"
        ? actionLabels.handoverPending
        : actionLabels.handoverNotScheduled;

  return (
    <>
      <div>
        <Link href={dashboardHref(locale, "projects")} className="btn btn-ghost btn-sm">
          <Arrow back /> {d.backToProjects}
        </Link>
        <h2 style={{ fontSize: "1.45rem", marginBlockStart: 10 }}>{pick(project.title, locale)}</h2>
        <p style={{ color: "var(--color-muted)", maxWidth: 920 }}>{d.projectWorkspaceLead}</p>
      </div>

      <nav className="workspace-anchor-nav" aria-label={d.projectOverview}>
        <Link className="btn btn-ghost btn-sm" href="#project-overview">
          {d.projectOverview}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-actions">
          {actionLabels.title}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-milestones">
          {d.projectMilestones}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-activity">
          {d.projectActivity}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-findings">
          {d.projectFindings}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-reports">
          {d.projectReports}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-handover">
          {d.projectHandover}
        </Link>
      </nav>

      <WorkspacePanel id="project-overview" title={d.projectOverview}>
        <div className="panel-body">
          <dl className="kv-grid">
            <div className="kv">
              <dt>{d.cols.reference}</dt>
              <dd dir="ltr">{project.id}</dd>
            </div>
            <div className="kv">
              <dt>{d.cols.customer}</dt>
              <dd>
                {pick(project.customer, locale)} · <span dir="ltr">{project.customerId}</span>
              </dd>
            </div>
            <div className="kv">
              <dt>{d.cols.service}</dt>
              <dd>{pick(project.serviceLabel, locale)}</dd>
            </div>
            <div className="kv">
              <dt>{d.cols.status}</dt>
              <dd>
                <StatusBadge appDict={appDict} status={project.status} />
              </dd>
            </div>
            <div className="kv">
              <dt>{d.cols.milestone}</dt>
              <dd>{pick(project.currentMilestone, locale)}</dd>
            </div>
            <div className="kv">
              <dt>{d.cols.updated}</dt>
              <dd>{formatDate(project.updatedAt, locale)}</dd>
            </div>
            <div className="kv">
              <dt>{d.statUnresolvedFindings}</dt>
              <dd>{formatNumber(operations.unresolvedFindings, locale)}</dd>
            </div>
            <div className="kv">
              <dt>{d.statPendingReports}</dt>
              <dd>{formatNumber(operations.pendingReports, locale)}</dd>
            </div>
          </dl>
          <div style={{ marginBlockStart: 20 }}>
            <span className="progress-row">
              <span
                className="progress"
                role="progressbar"
                aria-label={`${d.cols.progress}: ${formatPercent(progress, locale)}`}
                aria-valuenow={progress}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span style={{ width: `${progress}%` }} />
              </span>
              <strong>{formatPercent(progress, locale)}</strong>
            </span>
          </div>
        </div>
      </WorkspacePanel>

      <WorkspacePanel id="project-actions" title={actionLabels.title}>
        <div className="project-action-grid">
          <div className="project-action-item">
            <span>{actionLabels.nextMilestone}</span>
            {nextMilestone ? (
              <>
                <strong>{localizedValue(nextMilestone.title, locale)}</strong>
                <div>
                  {nextMilestone.date ? formatDate(nextMilestone.date, locale) : null}
                  {nextMilestone.progress !== undefined
                    ? ` · ${formatPercent(clampPercent(nextMilestone.progress), locale)}`
                    : null}
                </div>
                {nextMilestone.status ? (
                  <StatusBadge appDict={appDict} status={nextMilestone.status} />
                ) : null}
              </>
            ) : (
              <strong>{d.noProjectRecords}</strong>
            )}
            <div>
              <Link className="btn btn-ghost btn-sm" href="#project-milestones">
                {actionLabels.reviewMilestones}
              </Link>
            </div>
          </div>

          <div className="project-action-item">
            <span>{actionLabels.latestProgress}</span>
            {latestProgressRow ? (
              <>
                <strong>{rowTitle(latestProgressRow, locale, appDict)}</strong>
                <div>
                  {latestProgressDate ? formatDate(latestProgressDate, locale) : null}
                  {latestProgressValue !== undefined
                    ? ` · ${formatPercent(clampPercent(latestProgressValue), locale)}`
                    : null}
                </div>
              </>
            ) : (
              <strong>{d.noProjectRecords}</strong>
            )}
            <div>
              <Link className="btn btn-ghost btn-sm" href="#project-activity">
                {actionLabels.reviewActivity}
              </Link>
            </div>
          </div>

          <div className="project-action-item">
            <span>{actionLabels.blockers}</span>
            <strong>{formatNumber(operations.blockerRows.length, locale)}</strong>
            {blockerReferences.length > 0 ? (
              <div dir="ltr">{blockerReferences.join(" · ")}</div>
            ) : (
              <div>{d.operations.noBlockers}</div>
            )}
            <Link className="btn btn-ghost btn-sm" href="#project-findings">
              {actionLabels.reviewFindings}
            </Link>
          </div>

          <div className="project-action-item">
            <span>{actionLabels.pendingReports}</span>
            <strong>{formatNumber(operations.pendingReports, locale)}</strong>
            <div>
              <Link className="btn btn-ghost btn-sm" href="#project-reports">
                {actionLabels.reviewReports}
              </Link>
            </div>
          </div>

          <div className="project-action-item">
            <span>{actionLabels.handoverState}</span>
            <strong>{handoverStateLabel}</strong>
            <div>
              {formatNumber(operations.handoverRows.length, locale)} {d.modules.handover}
            </div>
            <div>
              <Link className="btn btn-ghost btn-sm" href="#project-handover">
                {actionLabels.reviewHandover}
              </Link>
            </div>
          </div>

          <div className="project-action-item">
            <span>{d.statUnresolvedFindings}</span>
            <strong>{formatNumber(operations.unresolvedFindings, locale)}</strong>
            <div>
              <Link className="btn btn-ghost btn-sm" href="#project-quality">
                {actionLabels.reviewFindings}
              </Link>
            </div>
          </div>
        </div>
      </WorkspacePanel>

      <div className="two-col">
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <WorkspacePanel
            id="project-milestones"
            title={d.projectMilestones}
            href={dashboardHref(locale, "milestones")}
            linkLabel={d.viewAll}
          >
            {useCanonicalMilestones ? (
              <div className="panel-body">
                <div className="timeline">
                  {operations.milestones.map((milestone) => {
                    const milestoneProgress = clampPercent(milestone.progress);
                    const title = pick(milestone.title, locale);
                    return (
                      <div
                        className={`timeline-item${milestone.state === "done" ? " done" : milestone.state === "current" ? " current" : ""}`}
                        key={milestone.id}
                      >
                        <span className="timeline-dot" aria-hidden="true">
                          {milestone.state === "done" ? "✓" : "•"}
                        </span>
                        <div>
                          <h3>{title}</h3>
                          <p>
                            {pick(milestone.detail, locale)} · {d.cols.dueDate}:{" "}
                            {formatDate(milestone.plannedDate, locale)}
                          </p>
                          <span className="progress-row" style={{ marginBlockStart: 8 }}>
                            <span
                              className="progress"
                              role="progressbar"
                              aria-label={`${title}: ${formatPercent(milestoneProgress, locale)}`}
                              aria-valuenow={milestoneProgress}
                              aria-valuemin={0}
                              aria-valuemax={100}
                            >
                              <span style={{ width: `${milestoneProgress}%` }} />
                            </span>
                            <strong>{formatPercent(milestoneProgress, locale)}</strong>
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <ModuleRowsList
                rows={operations.milestoneRows}
                module="milestones"
                locale={locale}
                appDict={appDict}
              />
            )}
          </WorkspacePanel>

          <WorkspacePanel id="project-activity" title={d.projectActivity}>
            <SubsectionTitle>{d.modules.diary}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.diaryRows}
              module="diary"
              locale={locale}
              appDict={appDict}
            />
            <SubsectionTitle>{d.modules.progress}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.progressRows}
              module="progress"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>

          <WorkspacePanel
            id="project-findings"
            title={d.projectFindings}
            href={dashboardHref(locale, "issues")}
            linkLabel={d.viewAll}
          >
            {operations.canonicalIssues.length > 0 ? (
              <div className="list-rows">
                {operations.canonicalIssues.map((issue) => (
                  <article className="list-row" key={issue.id} style={{ alignItems: "flex-start" }}>
                    <span className="file-icon" aria-hidden="true">
                      ⚠
                    </span>
                    <div className="lr-main">
                      <div className="lr-title">
                        {pick(issue.title, locale)} · <span dir="ltr">{issue.id}</span>
                      </div>
                      <div className="lr-sub">
                        {d.cols.phase}: {pick(issue.phase, locale)} · {d.cols.location}:{" "}
                        {pick(issue.location, locale)} · {d.cols.reported}:{" "}
                        {formatDate(issue.reportedAt, locale)}
                      </div>
                      <p style={{ marginBlockStart: 8 }}>{pick(issue.detail, locale)}</p>
                      <p style={{ marginBlockStart: 6 }}>
                        <strong>{d.cols.correctiveAction}:</strong>{" "}
                        {pick(issue.correctiveAction, locale)} · {d.cols.assignee}:{" "}
                        {pick(issue.assignee, locale)}
                      </p>
                    </div>
                    <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                      <span
                        className={
                          issue.severity === "urgent"
                            ? "badge badge-urgent"
                            : issue.severity === "high"
                              ? "badge badge-progress"
                              : "badge badge-neutral"
                        }
                      >
                        {appDict.priority[issue.severity] ?? issue.severity}
                      </span>
                      <StatusBadge appDict={appDict} status={issue.status} />
                    </span>
                  </article>
                ))}
              </div>
            ) : null}
            <ModuleRowsList
              rows={additionalIssueRows}
              module="issues"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>

          <WorkspacePanel
            id="project-quality"
            title={d.projectQuality}
            href={dashboardHref(locale, "quality")}
            linkLabel={d.viewAll}
          >
            <ModuleRowsList
              rows={operations.qualityRows}
              module="quality"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <WorkspacePanel id="project-journey" title={d.projectJourney}>
            <div className="panel-body" style={{ paddingBlockEnd: 6 }}>
              <div className="alert alert-info" role="note">
                <span aria-hidden="true">ⓘ</span>
                <p>{d.sourceRequestNotLinked}</p>
              </div>
            </div>
            <SubsectionTitle>{d.projectCustomerRequests}</SubsectionTitle>
            {operations.customerRequests.length > 0 ? (
              <div className="list-rows">
                {operations.customerRequests.map((request) => (
                  <div className="list-row" key={request.id} style={{ flexWrap: "wrap" }}>
                    <div className="lr-main" style={{ flex: "1 1 200px" }}>
                      <div className="lr-title">
                        <span dir="ltr">{request.id}</span> · {pick(request.serviceLabel, locale)}
                      </div>
                      <div className="lr-sub">
                        {formatDate(request.submittedAt, locale)} · {pick(request.city, locale)} ·{" "}
                        {d.cols.assignee}:{" "}
                        {request.assignee ? pick(request.assignee, locale) : d.unassigned}
                      </div>
                    </div>
                    <StatusBadge appDict={appDict} status={request.status} />
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ padding: "18px 20px", color: "var(--color-muted)" }}>
                {d.noProjectRecords}
              </p>
            )}
            <SubsectionTitle>{d.modules.quotations}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.quotationRows}
              module="quotations"
              locale={locale}
              appDict={appDict}
            />
            <SubsectionTitle>{d.modules.contracts}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.contractRows}
              module="contracts"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>

          <WorkspacePanel
            id="project-documents"
            title={d.projectDocuments}
            href={dashboardHref(locale, "documents")}
            linkLabel={d.viewAll}
          >
            <div className="panel-body" style={{ paddingBlockEnd: 6 }}>
              <p style={{ color: "var(--color-muted)" }}>{d.modulePreviewLimits.documents}</p>
            </div>
            <ModuleRowsList
              rows={operations.documentRows}
              module="documents"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>

          <WorkspacePanel
            id="project-reports"
            title={d.projectReports}
            href={dashboardHref(locale, "reports")}
            linkLabel={d.viewAll}
          >
            <div className="panel-body" style={{ paddingBlockEnd: 6 }}>
              <p style={{ color: "var(--color-muted)" }}>{d.modulePreviewLimits.reports}</p>
            </div>
            <ModuleRowsList
              rows={operations.reportRows}
              module="reports"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>

          <WorkspacePanel id="project-handover" title={d.projectHandover}>
            <SubsectionTitle>{d.modules.handover}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.handoverRows}
              module="handover"
              locale={locale}
              appDict={appDict}
            />
            <SubsectionTitle>{d.modules.warranty}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.warrantyRows}
              module="warranty"
              locale={locale}
              appDict={appDict}
            />
          </WorkspacePanel>
        </div>
      </div>
    </>
  );
}
