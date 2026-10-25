import Link from "next/link";
import type { ReactNode } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
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
import {
  getAssignmentHistoryForProject,
  getHandoverForProject,
  getProjectDocuments,
  getWarrantyForProject,
  getPreviewEngineer,
  getProjectFinance,
  getProjectPhases,
  getProjectStatusHistory,
  getProjectWorkItems,
  workItemProgress,
} from "@/lib/preview-expansion";
import {
  DocumentCatalogGroups,
  EvidenceChips,
  HandoverDetailBlock,
  Timeline,
  WarrantyDetailBlock,
} from "@/components/dashboard/RecordDetails";
import { Arrow } from "@/components/ui/Pieces";
import {
  PriorityBadge,
  ProgressMeter,
  RecordEmptyState,
  RecordListItem,
  RecordMetaList,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";
import { Donut } from "@/components/ui/Viz";

function localizedValue(value: LocalizedText | string, locale: Locale): string {
  return typeof value === "string" ? value : pick(value, locale);
}

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
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

  const summaryPriority = [
    "date",
    "dueDate",
    "due",
    "assignee",
    "actor",
    "customer",
    "amount",
    "progress",
    "type",
    "week",
    "updated",
    "size",
  ];

  return (
    <div className="record-list">
      {rows.map((row) => {
        const status = getPreviewRowStatus(row);
        const title = rowTitle(row, locale, appDict);
        const reference = getPreviewRowReference(row);
        const allItems = (table?.columns ?? [])
          .filter((column) => !["title", "project", "status", "ref", "entity"].includes(column.id))
          .flatMap((column) => {
            const cell = row.cells[column.id];
            if (!cell) return [];
            return [
              {
                id: column.id,
                item: meta(
                  cols[column.labelKey] ?? column.labelKey,
                  formatCell(cell, locale, appDict),
                  { wide: ["milestone", "service", "customer"].includes(column.id) },
                ),
              },
            ];
          })
          .sort((a, b) => {
            const aPriority = summaryPriority.indexOf(a.id);
            const bPriority = summaryPriority.indexOf(b.id);
            return (
              (aPriority === -1 ? summaryPriority.length : aPriority) -
              (bPriority === -1 ? summaryPriority.length : bPriority)
            );
          });
        const summaryItems = allItems.slice(0, 3).map((entry) => entry.item);
        const detailItems = allItems.slice(3).map((entry) => entry.item);
        return (
          <RecordListItem
            key={row.id}
            title={title}
            reference={
              reference && reference !== title ? <span dir="ltr">{reference}</span> : undefined
            }
            summaryItems={summaryItems}
            detailItems={detailItems}
            badges={<StatusBadge appDict={appDict} status={status} />}
            showDetailsLabel={appDict.showDetails}
            hideDetailsLabel={appDict.hideDetails}
            detailsTitle={appDict.recordMoreDetails}
          />
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
  const expansion = d.expansion;
  const projectPhases = getProjectPhases(project.id);
  const projectFinance = getProjectFinance(project.id);
  const hasProjectFinance =
    projectFinance.duesTotal > 0 ||
    projectFinance.expensesTotal > 0 ||
    projectFinance.purchasesTotal > 0;
  const handoverStateLabel =
    operations.handoverState === "handed_over"
      ? actionLabels.handedOver
      : operations.handoverState === "pending"
        ? actionLabels.handoverPending
        : actionLabels.handoverNotScheduled;

  return (
    <>
      <header className="project-command-header">
        <div className="project-command-main">
          <Link href={dashboardHref(locale, "projects")} className="btn btn-ghost btn-sm">
            <Arrow back /> {d.backToProjects}
          </Link>
          <div className="project-command-title-row">
            <h2>{pick(project.title, locale)}</h2>
            <StatusBadge appDict={appDict} status={project.status} />
          </div>
          <div className="project-detail-kicker">
            <span dir="ltr">{project.id}</span>
            <span aria-hidden="true">·</span>
            <span>{pick(project.customer, locale)}</span>
            <span aria-hidden="true">·</span>
            <span>{pick(project.serviceLabel, locale)}</span>
          </div>
          <p className="project-command-lead">{d.projectWorkspaceLead}</p>
          <div className="project-command-progress viz-hero-progress">
            <Donut value={progress} locale={locale} label={d.cols.progress} size={92} />
            <div className="viz-hero-progress-main">
              <span>
                {d.cols.progress} · {formatPercent(progress, locale)}
              </span>
              <ProgressMeter
                appDict={appDict}
                locale={locale}
                value={progress}
                label={`${pick(project.title, locale)} · ${d.cols.progress}`}
              />
            </div>
          </div>
        </div>
        <dl className="project-command-metrics" aria-label={d.projectOverview}>
          <div>
            <dt>{actionLabels.nextMilestone}</dt>
            <dd>
              {nextMilestone ? localizedValue(nextMilestone.title, locale) : d.noProjectRecords}
            </dd>
            {nextMilestone?.date ? <dd>{formatDate(nextMilestone.date, locale)}</dd> : null}
          </div>
          <div>
            <dt>{actionLabels.blockers}</dt>
            <dd>{formatNumber(operations.blockerRows.length, locale)}</dd>
          </div>
          <div>
            <dt>{actionLabels.pendingReports}</dt>
            <dd>{formatNumber(operations.pendingReports, locale)}</dd>
          </div>
          <div>
            <dt>{actionLabels.handoverState}</dt>
            <dd>{handoverStateLabel}</dd>
          </div>
        </dl>
      </header>

      <nav className="workspace-anchor-nav" aria-label={d.projectOverview}>
        <Link className="btn btn-ghost btn-sm" href="#project-overview">
          {d.projectOverview}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-phases">
          {expansion.phases.title}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-work-items">
          {expansion.workflow.workItemsTitle}
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
        <Link className="btn btn-ghost btn-sm" href="#project-quality">
          {d.projectQuality}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-documents">
          {d.projectDocuments}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-reports">
          {d.projectReports}
        </Link>
        <Link className="btn btn-ghost btn-sm" href="#project-handover">
          {d.projectHandover}
        </Link>
      </nav>

      <div className="project-command-grid">
        <WorkspacePanel id="project-overview" title={d.projectOverview}>
          <div className="panel-body">
            <div className="record-detail-groups">
              <section aria-labelledby="project-overview-basics-title">
                <h4 id="project-overview-basics-title">{d.recordSections.overview}</h4>
                <RecordMetaList
                  variant="detail"
                  items={[
                    meta(d.cols.project, project.id, { dir: "ltr" }),
                    meta(
                      d.cols.customer,
                      <>
                        {pick(project.customer, locale)} ·{" "}
                        <span dir="ltr">{project.customerId}</span>
                      </>,
                    ),
                    meta(d.cols.service, pick(project.serviceLabel, locale), { wide: true }),
                    meta(d.cols.milestone, pick(project.currentMilestone, locale), { wide: true }),
                  ]}
                />
              </section>
              <section aria-labelledby="project-overview-status-title">
                <h4 id="project-overview-status-title">{d.recordSections.statusResponsibility}</h4>
                <RecordMetaList
                  variant="detail"
                  items={[
                    meta(d.cols.status, <StatusBadge appDict={appDict} status={project.status} />),
                    meta(d.cols.updated, formatDate(project.updatedAt, locale)),
                    meta(
                      d.statUnresolvedFindings,
                      formatNumber(operations.unresolvedFindings, locale),
                    ),
                    meta(d.statPendingReports, formatNumber(operations.pendingReports, locale)),
                  ]}
                />
              </section>
            </div>
            <div className="project-overview-progress">
              <span>{d.cols.progress}</span>
              <ProgressMeter appDict={appDict} locale={locale} value={progress} />
            </div>
          </div>
        </WorkspacePanel>

        <WorkspacePanel
          id="project-phases"
          title={expansion.phases.title}
          href={hasProjectFinance ? dashboardHref(locale, "finance") : undefined}
          linkLabel={hasProjectFinance ? d.modules.finance : undefined}
        >
          <p style={{ padding: "0 20px" }}>{expansion.phases.intro}</p>
          {projectPhases.length === 0 ? (
            <RecordEmptyState>{expansion.phases.noPhases}</RecordEmptyState>
          ) : (
            <div className="domain-record-list" style={{ padding: "0 20px 16px" }}>
              {projectPhases.map((phase) => {
                const engineer = getPreviewEngineer(phase.engineerId);
                const predecessor = phase.predecessorPhaseId
                  ? projectPhases.find((item) => item.id === phase.predecessorPhaseId)
                  : undefined;
                const phaseFinance = projectFinance.byPhase.find(
                  (row) => row.phase.id === phase.id,
                );
                return (
                  <RecordListItem
                    key={phase.id}
                    title={`${expansion.phaseTypes[phase.type] ?? phase.type} — ${pick(phase.title, locale)}`}
                    reference={<span dir="ltr">{phase.id}</span>}
                    badges={<StatusBadge appDict={appDict} status={phase.status} />}
                    summaryItems={[
                      meta(d.cols.assignee, engineer ? pick(engineer.name, locale) : d.unassigned),
                      meta(d.cols.updated, formatDate(phase.updatedAt, locale)),
                      ...(predecessor
                        ? [
                            meta(
                              expansion.phases.predecessor,
                              `${expansion.phaseTypes[predecessor.type] ?? predecessor.type} — ${pick(predecessor.title, locale)}`,
                            ),
                          ]
                        : []),
                      ...(phaseFinance && phaseFinance.duesTotal > 0
                        ? [
                            meta(
                              expansion.finance.balances.phaseDues,
                              formatMoney(phaseFinance.duesTotal, locale),
                              { dir: "ltr" as const },
                            ),
                            meta(
                              expansion.finance.balances.phaseCollected,
                              formatMoney(phaseFinance.collected, locale),
                              { dir: "ltr" as const },
                            ),
                          ]
                        : []),
                      ...(phase.statusReason
                        ? [
                            meta(expansion.phases.statusReason, pick(phase.statusReason, locale), {
                              wide: true as const,
                            }),
                          ]
                        : []),
                    ]}
                    showDetailsLabel={appDict.showDetails}
                    hideDetailsLabel={appDict.hideDetails}
                    detailsTitle={appDict.recordMoreDetails}
                  >
                    <ProgressMeter
                      appDict={appDict}
                      locale={locale}
                      value={clampPercent(phase.progress)}
                      label={`${pick(phase.title, locale)} — ${formatPercent(phase.progress, locale)}`}
                    />
                  </RecordListItem>
                );
              })}
            </div>
          )}
          {hasProjectFinance ? (
            <div style={{ padding: "0 20px 16px" }}>
              <RecordMetaList
                variant="detail"
                items={[
                  meta(expansion.finance.totalDues, formatMoney(projectFinance.duesTotal, locale), {
                    dir: "ltr",
                  }),
                  meta(
                    expansion.finance.totalCollected,
                    formatMoney(projectFinance.collected, locale),
                    { dir: "ltr" },
                  ),
                  meta(
                    expansion.finance.totalRemaining,
                    formatMoney(projectFinance.remaining, locale),
                    { dir: "ltr" },
                  ),
                  meta(
                    expansion.finance.totalExpenses,
                    formatMoney(projectFinance.expensesTotal, locale),
                    { dir: "ltr" },
                  ),
                ]}
              />
            </div>
          ) : null}
        </WorkspacePanel>

        <WorkspacePanel id="project-work-items" title={expansion.workflow.workItemsTitle}>
          <p style={{ padding: "0 20px" }}>{expansion.workflow.workItemsIntro}</p>
          {getProjectWorkItems(project.id).length === 0 ? (
            <RecordEmptyState>{expansion.workflow.noWorkItems}</RecordEmptyState>
          ) : (
            getProjectWorkItems(project.id).map((group) => (
              <div key={group.phase.id} style={{ padding: "0 20px 12px" }}>
                <h4>
                  {`${expansion.phaseTypes[group.phase.type] ?? group.phase.type} — ${pick(group.phase.title, locale)}`}
                </h4>
                <div>
                  {group.items.map((item) => (
                    <div key={item.id} className="wf-work-item">
                      <div className="wf-work-item-head">
                        <strong>{pick(item.label, locale)}</strong>
                        <span className="wf-work-item-qty">
                          {expansion.workflow.completedQty} {item.completedQty}/{item.plannedQty}{" "}
                          {pick(item.unit, locale)} ·{" "}
                          {formatPercent(workItemProgress(item), locale)}
                        </span>
                      </div>
                      <ProgressMeter
                        appDict={appDict}
                        locale={locale}
                        value={workItemProgress(item)}
                        label={pick(item.label, locale)}
                      />
                    </div>
                  ))}
                </div>
                {group.items
                  .filter((item) => item.evidence.length > 0)
                  .map((item) => (
                    <div key={item.id} className="wf-evidence-row">
                      <span>{pick(item.label, locale)}:</span>
                      <EvidenceChips locale={locale} items={item.evidence} />
                    </div>
                  ))}
              </div>
            ))
          )}
        </WorkspacePanel>

        <WorkspacePanel id="project-history" title={expansion.workflow.statusHistoryTitle}>
          <div style={{ padding: "0 20px 8px" }}>
            <Timeline
              locale={locale}
              entries={getProjectStatusHistory(project.id).map((record) => ({
                at: record.at,
                title: <StatusBadge appDict={appDict} status={record.status} />,
                note: pick(record.note, locale),
              }))}
            />
          </div>
          <h4 style={{ padding: "8px 20px 0" }}>{expansion.workflow.assignmentHistoryTitle}</h4>
          <div style={{ padding: "0 20px 16px" }}>
            <Timeline
              locale={locale}
              entries={getAssignmentHistoryForProject(project.id).map((record) => {
                const engineer = getPreviewEngineer(record.engineerId);
                return {
                  at: record.from,
                  title: engineer ? pick(engineer.name, locale) : record.engineerId,
                  by: expansion.engineerRoles[record.role] ?? record.role,
                  note: record.to
                    ? `${expansion.workflow.periodFrom} ${formatDate(record.from, locale)} ${expansion.workflow.periodTo} ${formatDate(record.to, locale)}`
                    : expansion.workflow.currentAssignment,
                };
              })}
            />
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
      </div>

      <div className="two-col project-workspace-columns">
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
              <div className="record-list">
                {operations.canonicalIssues.map((issue) => (
                  <RecordListItem
                    key={issue.id}
                    title={pick(issue.title, locale)}
                    reference={<span dir="ltr">{issue.id}</span>}
                    summaryItems={[
                      meta(d.cols.phase, pick(issue.phase, locale)),
                      meta(d.cols.location, pick(issue.location, locale)),
                      meta(d.cols.reported, formatDate(issue.reportedAt, locale)),
                    ]}
                    detailItems={[
                      meta(d.cols.correctiveAction, pick(issue.correctiveAction, locale), {
                        wide: true,
                      }),
                      meta(d.cols.assignee, pick(issue.assignee, locale), { wide: true }),
                    ]}
                    badges={
                      <>
                        <PriorityBadge appDict={appDict} priority={issue.severity} />
                        <StatusBadge appDict={appDict} status={issue.status} />
                      </>
                    }
                    showDetailsLabel={appDict.showDetails}
                    hideDetailsLabel={appDict.hideDetails}
                    detailsTitle={appDict.recordMoreDetails}
                  >
                    <p className="record-list-note">{pick(issue.detail, locale)}</p>
                  </RecordListItem>
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
              <div className="record-list">
                {operations.customerRequests.map((request) => (
                  <RecordListItem
                    key={request.id}
                    title={pick(request.serviceLabel, locale)}
                    reference={<span dir="ltr">{request.id}</span>}
                    summaryItems={[
                      meta(d.cols.date, formatDate(request.submittedAt, locale)),
                      meta(d.cols.city, pick(request.city, locale)),
                      meta(
                        d.cols.assignee,
                        request.assignee ? pick(request.assignee, locale) : d.unassigned,
                      ),
                    ]}
                    badges={<StatusBadge appDict={appDict} status={request.status} />}
                    showDetailsLabel={appDict.showDetails}
                    hideDetailsLabel={appDict.hideDetails}
                    detailsTitle={appDict.recordMoreDetails}
                  />
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
            {getHandoverForProject(project.id) ? (
              <div style={{ padding: "0 20px 12px" }}>
                <HandoverDetailBlock
                  locale={locale}
                  appDict={appDict}
                  reference={getHandoverForProject(project.id)?.ref}
                />
              </div>
            ) : null}
            <SubsectionTitle>{d.modules.warranty}</SubsectionTitle>
            <ModuleRowsList
              rows={operations.warrantyRows}
              module="warranty"
              locale={locale}
              appDict={appDict}
            />
            {getWarrantyForProject(project.id).map((detail) => (
              <div key={detail.ref} style={{ padding: "0 20px 12px" }}>
                <h4>
                  <span dir="ltr">{detail.ref}</span>
                </h4>
                <WarrantyDetailBlock locale={locale} appDict={appDict} reference={detail.ref} />
              </div>
            ))}
          </WorkspacePanel>

          <WorkspacePanel
            id="project-document-catalog"
            title={d.modules.documents}
            href={dashboardHref(locale, "documents")}
            linkLabel={d.modules.documents}
          >
            <div style={{ padding: "0 20px 16px" }}>
              <DocumentCatalogGroups
                locale={locale}
                appDict={appDict}
                items={getProjectDocuments(project.id)}
              />
            </div>
          </WorkspacePanel>
        </div>
      </div>
    </>
  );
}
