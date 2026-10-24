"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { dashboardHref } from "@/config/navigation";
import type { PreviewCell, PreviewModuleRow } from "@/content/preview-modules";
import type { PreviewCustomerContext } from "@/lib/admin-preview";
import type {
  PreviewCertificate,
  PreviewComplaint,
  PreviewPhase,
} from "@/content/preview-expansion";
import type { PreviewCustomerFinance } from "@/lib/preview-expansion";
import { DocumentCatalogGroups } from "@/components/dashboard/RecordDetails";
import {
  customerVisibleReplies,
  getCustomerDocuments,
  internalReplies,
} from "@/lib/preview-expansion";
import { getPreviewEngineer } from "@/lib/preview-expansion";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";
import {
  PriorityBadge,
  ProgressMeter,
  RecordCard,
  RecordDetailSection,
  RecordEmptyState,
  RecordListItem,
  RecordMetaList,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";

type TabKey = "overview" | "requests" | "commercial" | "projectsPhases" | "finance" | "complaints";

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

function RowList({
  rows,
  locale,
  appDict,
  emptyText,
}: {
  rows: PreviewModuleRow[];
  locale: Locale;
  appDict: AppDictionary;
  emptyText: string;
}) {
  if (rows.length === 0) return <RecordEmptyState>{emptyText}</RecordEmptyState>;
  const cols = appDict.dashboard.cols as Record<string, string>;
  return (
    <div className="domain-record-list">
      {rows.map((row) => {
        const statusCell = Object.values(row.cells).find((cell) => cell.kind === "status");
        const refCell = row.cells["ref"];
        const titleCell = row.cells["title"] ?? row.cells["type"] ?? refCell;
        return (
          <RecordListItem
            key={row.id}
            title={titleCell ? formatCell(titleCell, locale, appDict) : row.id}
            reference={
              refCell && refCell !== titleCell ? (
                <span dir="ltr">{formatCell(refCell, locale, appDict)}</span>
              ) : undefined
            }
            badges={
              statusCell?.kind === "status" ? (
                <StatusBadge appDict={appDict} status={statusCell.value} />
              ) : undefined
            }
            summaryItems={Object.entries(row.cells)
              .filter(([key]) => key !== "ref" && key !== "title" && key !== "status")
              .map(([key, cell]) => meta(cols[key] ?? key, formatCell(cell, locale, appDict)))}
            showDetailsLabel={appDict.showDetails}
            hideDetailsLabel={appDict.hideDetails}
            detailsTitle={appDict.recordMoreDetails}
          />
        );
      })}
    </div>
  );
}

export type CustomerWorkspaceData = {
  context: PreviewCustomerContext;
  status?: string;
  finance: PreviewCustomerFinance;
  certificates: PreviewCertificate[];
  complaints: PreviewComplaint[];
  phasesByProject: Record<string, PreviewPhase[]>;
};

export function CustomerWorkspace({
  locale,
  appDict,
  data,
}: {
  locale: Locale;
  appDict: AppDictionary;
  data: CustomerWorkspaceData;
}) {
  const [tab, setTab] = useState<TabKey>("overview");
  const [notice, setNotice] = useState<string | null>(null);
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;
  const { context, finance, certificates, complaints } = data;
  const latest = context.latestRequest;
  const customerName = latest ? pick(latest.customerName, locale) : context.customerId;

  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: "overview", label: x.customer.tabs.overview },
    { key: "requests", label: x.customer.tabs.requests },
    { key: "commercial", label: x.customer.tabs.commercial },
    { key: "projectsPhases", label: x.customer.tabs.projectsPhases },
    { key: "finance", label: x.customer.tabs.finance },
    { key: "complaints", label: x.customer.tabs.complaints },
  ];

  const cardLabels = {
    showDetailsLabel: appDict.showDetails,
    hideDetailsLabel: appDict.hideDetails,
    detailsTitle: appDict.recordMoreDetails,
    relationshipsLabel: appDict.dashboard.linkedRecords,
  };

  let content: ReactNode = null;

  if (tab === "overview") {
    content = (
      <RecordDetailSection title={x.customer.profileTitle}>
        <RecordMetaList
          variant="detail"
          items={[
            meta(x.customerCode, <span dir="ltr">{context.customerId}</span>),
            meta(cols.name, customerName),
            meta(cols.phone, latest?.phone ?? appDict.dashboard.operations.notRecorded, {
              dir: "ltr",
            }),
            meta(
              cols.city,
              latest ? pick(latest.city, locale) : appDict.dashboard.operations.notRecorded,
            ),
            meta(
              x.customer.linkedFromRequest,
              latest ? (
                <>
                  <span dir="ltr">{latest.id}</span> · {formatDate(latest.submittedAt, locale)}
                </>
              ) : (
                appDict.dashboard.operations.notRecorded
              ),
            ),
            meta(x.customer.classification, x.customer.policyPending, { wide: true }),
            meta(x.customer.contactPreferences, x.customer.policyPending, { wide: true }),
          ]}
        />
        <div className="record-card-actions">
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={() => setNotice(x.customer.editUnavailable)}
            aria-haspopup="dialog"
          >
            {x.customer.editCustomer}
          </button>
        </div>
      </RecordDetailSection>
    );
  } else if (tab === "requests") {
    content = (
      <>
        {context.requests.length === 0 ? (
          <RecordEmptyState>{x.customer.noRequests}</RecordEmptyState>
        ) : (
          <div className="domain-card-grid">
            {context.requests.map((request) => (
              <RecordCard
                key={request.id}
                {...cardLabels}
                title={pick(request.serviceLabel, locale)}
                reference={<span dir="ltr">{request.id}</span>}
                badges={
                  <>
                    <StatusBadge appDict={appDict} status={request.status} />
                    <PriorityBadge appDict={appDict} priority={request.priority} />
                  </>
                }
                summaryItems={[
                  meta(cols.date, formatDate(request.submittedAt, locale)),
                  meta(
                    cols.assignee,
                    request.assignee
                      ? pick(request.assignee, locale)
                      : appDict.dashboard.unassigned,
                  ),
                  meta(cols.city, pick(request.city, locale)),
                ]}
                detailItems={[
                  meta(appDict.recordSummary, pick(request.description, locale), { wide: true }),
                ]}
                relationships={
                  <Link
                    className="record-chip-link"
                    href={dashboardHref(locale, `requests?focus=${request.id}`)}
                  >
                    <span dir="ltr">{request.id}</span>
                  </Link>
                }
              />
            ))}
          </div>
        )}
        <RecordDetailSection title={appDict.dashboard.modules.inspections}>
          <RowList
            rows={context.inspectionRows}
            locale={locale}
            appDict={appDict}
            emptyText={appDict.dashboard.genericEmpty}
          />
        </RecordDetailSection>
      </>
    );
  } else if (tab === "commercial") {
    content = (
      <>
        <RecordDetailSection title={appDict.dashboard.modules.quotations}>
          <RowList
            rows={context.quotationRows}
            locale={locale}
            appDict={appDict}
            emptyText={x.customer.noCommercial}
          />
        </RecordDetailSection>
        <RecordDetailSection title={appDict.dashboard.modules.contracts}>
          <RowList
            rows={context.contractRows}
            locale={locale}
            appDict={appDict}
            emptyText={x.customer.noCommercial}
          />
        </RecordDetailSection>
        <RecordDetailSection title={appDict.dashboard.modules.documents}>
          <DocumentCatalogGroups
            locale={locale}
            appDict={appDict}
            items={getCustomerDocuments(context.customerId)}
          />
        </RecordDetailSection>
      </>
    );
  } else if (tab === "projectsPhases") {
    content =
      context.projects.length === 0 ? (
        <RecordEmptyState>{x.customer.noProjects}</RecordEmptyState>
      ) : (
        context.projects.map((project) => (
          <RecordDetailSection key={project.id}>
            <RecordCard
              {...cardLabels}
              title={pick(project.title, locale)}
              reference={<span dir="ltr">{project.id}</span>}
              badges={<StatusBadge appDict={appDict} status={project.status} />}
              summaryItems={[meta(cols.progress, formatPercent(project.progress, locale))]}
              relationships={
                <Link
                  className="record-chip-link"
                  href={dashboardHref(locale, `projects/${project.id}`)}
                >
                  {appDict.dashboard.openProjectWorkspace}
                </Link>
              }
              detailItems={[]}
            >
              <div className="domain-record-list">
                {(data.phasesByProject[project.id] ?? []).length === 0 ? (
                  <p>{x.phases.noPhases}</p>
                ) : (
                  (data.phasesByProject[project.id] ?? []).map((phase) => {
                    const engineer = getPreviewEngineer(phase.engineerId);
                    return (
                      <RecordListItem
                        key={phase.id}
                        title={`${x.phaseTypes[phase.type] ?? phase.type} — ${pick(phase.title, locale)}`}
                        reference={<span dir="ltr">{phase.id}</span>}
                        badges={<StatusBadge appDict={appDict} status={phase.status} />}
                        summaryItems={[
                          meta(
                            cols.assignee,
                            engineer ? pick(engineer.name, locale) : appDict.dashboard.unassigned,
                          ),
                          meta(cols.updated, formatDate(phase.updatedAt, locale)),
                          ...(phase.statusReason
                            ? [
                                meta(x.phases.statusReason, pick(phase.statusReason, locale), {
                                  wide: true,
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
                          value={phase.progress}
                          label={`${pick(phase.title, locale)} — ${formatPercent(phase.progress, locale)}`}
                        />
                      </RecordListItem>
                    );
                  })
                )}
              </div>
            </RecordCard>
          </RecordDetailSection>
        ))
      );
  } else if (tab === "finance") {
    const hasFinance =
      finance.dues.length > 0 || finance.payments.length > 0 || finance.invoices.length > 0;
    content = !hasFinance ? (
      <RecordEmptyState>{x.customer.noFinance}</RecordEmptyState>
    ) : (
      <>
        <RecordDetailSection title={cols.balance}>
          <RecordMetaList
            variant="detail"
            items={[
              meta(x.finance.totalDues, formatMoney(finance.duesTotal, locale), { dir: "ltr" }),
              meta(x.finance.totalCollected, formatMoney(finance.collected, locale), {
                dir: "ltr",
              }),
              meta(x.finance.totalRemaining, formatMoney(finance.remaining, locale), {
                dir: "ltr",
              }),
            ]}
          />
        </RecordDetailSection>
        <RecordDetailSection title={x.finance.tabs.dues}>
          <div className="domain-record-list">
            {finance.dues.map((item) => (
              <RecordListItem
                key={item.due.id}
                title={pick(item.due.label, locale)}
                reference={<span dir="ltr">{item.due.id}</span>}
                badges={<StatusBadge appDict={appDict} status={item.status} />}
                summaryItems={[
                  meta(cols.dueDate, formatDate(item.due.dueDate, locale)),
                  meta(cols.amount, formatMoney(item.due.amount, locale), { dir: "ltr" }),
                  meta(x.finance.allocatedLabel, formatMoney(item.allocated, locale), {
                    dir: "ltr",
                  }),
                  meta(x.finance.remainingLabel, formatMoney(item.remaining, locale), {
                    dir: "ltr",
                  }),
                ]}
                showDetailsLabel={appDict.showDetails}
                hideDetailsLabel={appDict.hideDetails}
                detailsTitle={appDict.recordMoreDetails}
              />
            ))}
          </div>
        </RecordDetailSection>
        <RecordDetailSection title={x.finance.tabs.payments}>
          <div className="domain-record-list">
            {finance.payments.map((payment) => (
              <RecordListItem
                key={payment.id}
                title={formatMoney(payment.amount, locale)}
                reference={<span dir="ltr">{payment.id}</span>}
                summaryItems={[
                  meta(cols.date, formatDate(payment.paidAt, locale)),
                  meta(cols.method, x.paymentMethods[payment.method] ?? payment.method),
                ]}
                showDetailsLabel={appDict.showDetails}
                hideDetailsLabel={appDict.hideDetails}
                detailsTitle={appDict.recordMoreDetails}
              />
            ))}
          </div>
        </RecordDetailSection>
        <RecordDetailSection title={x.finance.documents.certificates}>
          <div className="domain-record-list">
            {certificates.map((certificate) => (
              <RecordListItem
                key={certificate.id}
                title={pick(certificate.label, locale)}
                reference={<span dir="ltr">{certificate.id}</span>}
                badges={<StatusBadge appDict={appDict} status={certificate.status} />}
                summaryItems={[
                  meta(
                    x.finance.documents.completion,
                    formatPercent(certificate.completionPercent, locale),
                  ),
                  meta(cols.amount, formatMoney(certificate.amount, locale), { dir: "ltr" }),
                ]}
                showDetailsLabel={appDict.showDetails}
                hideDetailsLabel={appDict.hideDetails}
                detailsTitle={appDict.recordMoreDetails}
              />
            ))}
          </div>
        </RecordDetailSection>
      </>
    );
  } else {
    content =
      complaints.length === 0 ? (
        <RecordEmptyState>{x.customer.noComplaints}</RecordEmptyState>
      ) : (
        <div className="domain-card-grid">
          {complaints.map((complaint) => {
            const visible = customerVisibleReplies(complaint);
            const internal = internalReplies(complaint);
            return (
              <RecordCard
                key={complaint.id}
                {...cardLabels}
                kind={
                  complaint.kind === "complaint"
                    ? x.complaints.kindComplaint
                    : x.complaints.kindSuggestion
                }
                title={pick(complaint.title, locale)}
                reference={<span dir="ltr">{complaint.id}</span>}
                badges={<StatusBadge appDict={appDict} status={complaint.status} />}
                summaryItems={[
                  meta(cols.category, pick(complaint.category, locale)),
                  meta(cols.date, formatDate(complaint.createdAt, locale)),
                ]}
                detailItems={[
                  meta(appDict.recordSummary, pick(complaint.detail, locale), { wide: true }),
                ]}
                detailChildren={
                  <div className="expansion-replies">
                    <section className="reply-block reply-block--customer">
                      <h4>{x.complaints.customerReplies}</h4>
                      {visible.length === 0 ? (
                        <p>{x.complaints.noCustomerReplies}</p>
                      ) : (
                        visible.map((reply) => (
                          <article key={reply.id} className="reply-item">
                            <header>
                              <strong>{pick(reply.author, locale)}</strong>
                              <span>{formatDate(reply.at, locale)}</span>
                            </header>
                            <p>{pick(reply.text, locale)}</p>
                          </article>
                        ))
                      )}
                    </section>
                    <section className="reply-block reply-block--internal">
                      <h4>
                        <span aria-hidden="true">🔒 </span>
                        {x.complaints.internalNotes}
                      </h4>
                      {internal.length === 0 ? (
                        <p>{x.complaints.noInternalNotes}</p>
                      ) : (
                        internal.map((reply) => (
                          <article key={reply.id} className="reply-item">
                            <header>
                              <strong>{pick(reply.author, locale)}</strong>
                              <span>{formatDate(reply.at, locale)}</span>
                            </header>
                            <p>{pick(reply.text, locale)}</p>
                          </article>
                        ))
                      )}
                    </section>
                  </div>
                }
              />
            );
          })}
        </div>
      );
  }

  return (
    <>
      <div className="module-page-head">
        <p>
          <Link className="record-chip-link" href={dashboardHref(locale, "customers")}>
            {x.customer.backToCustomers}
          </Link>
        </p>
        <h2>
          {x.customer.workspaceTitle} — {customerName}
        </h2>
        <p>
          <span dir="ltr">{context.customerId}</span>
          {data.status ? (
            <>
              {" "}
              · <StatusBadge appDict={appDict} status={data.status} />
            </>
          ) : null}
        </p>
      </div>
      <div className="expansion-tabs" role="tablist" aria-label={x.customer.workspaceTitle}>
        {tabs.map((item) => (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={tab === item.key}
            className={`expansion-tab${tab === item.key ? " is-active" : ""}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <section className="panel customer-workspace-panel">{content}</section>
      <InfoDialog
        open={notice !== null}
        title={appDict.previewUnavailableTitle}
        closeLabel={appDict.close}
        onClose={() => setNotice(null)}
      >
        <p>{notice}</p>
      </InfoDialog>
    </>
  );
}
