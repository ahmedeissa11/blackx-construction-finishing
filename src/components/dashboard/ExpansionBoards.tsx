"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { dashboardHref } from "@/config/navigation";
import { previewProjects, previewRequests } from "@/content/preview-data";
import { previewContactMessages, previewDues } from "@/content/preview-expansion";
import {
  customerVisibleReplies,
  getAgingBuckets,
  getAllDuesWithBalance,
  getAllEngineerAssignments,
  getAllSupplierBalances,
  getAssignmentHistoryForEngineer,
  getCustomerFinance,
  getPreviewPhase,
  getProjectFinance,
  internalReplies,
  purchaseTotals,
} from "@/lib/preview-expansion";
import { previewComplaints, previewExpenses } from "@/content/preview-expansion";
import { previewCertificates, previewInvoices } from "@/content/preview-expansion";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";
import {
  PriorityBadge,
  ProgressMeter,
  RecordCard,
  RecordEmptyState,
  RecordListItem,
  RecordMetaList,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";

export type ExpansionModuleKey = "engineers" | "finance" | "purchases" | "complaints" | "messages";

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
}

function customerName(customerId: string): LocalizedText {
  return (
    previewRequests.find((request) => request.customerId === customerId)?.customerName ?? {
      ar: customerId,
      en: customerId,
    }
  );
}

function projectTitle(projectId: string): LocalizedText {
  return (
    previewProjects.find((project) => project.id === projectId)?.title ?? {
      ar: projectId,
      en: projectId,
    }
  );
}

function customerHref(locale: Locale, customerId: string): string {
  return dashboardHref(locale, `customers/${customerId}`);
}

function projectHref(locale: Locale, projectId: string): string {
  return dashboardHref(locale, `projects/${projectId}`);
}

function phaseLabel(
  appDict: AppDictionary,
  locale: Locale,
  phaseId: string | undefined,
): string | undefined {
  const phase = getPreviewPhase(phaseId);
  if (!phase) return undefined;
  const type = appDict.dashboard.expansion.phaseTypes[phase.type] ?? phase.type;
  return `${type} — ${pick(phase.title, locale)}`;
}

function phaseProgress(phaseId: string | undefined) {
  return getPreviewPhase(phaseId)?.progress;
}

type BoardProps = { locale: Locale; appDict: AppDictionary };

function BoardShell({
  locale,
  title,
  intro,
  stats,
  controls,
  children,
  layout = "grid",
  variant = "directory",
}: BoardProps & {
  title: string;
  intro: string;
  stats: Array<{ label: string; value: ReactNode }>;
  controls?: ReactNode;
  children: ReactNode;
  layout?: "grid" | "list";
  variant?: string;
}) {
  void locale;
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
              <strong>{stat.value}</strong>
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

function Controls({
  idPrefix,
  locale,
  appDict,
  query,
  onQueryChange,
  resultCount,
  children,
  onClear,
  hasFilters,
}: BoardProps & {
  idPrefix: string;
  query: string;
  onQueryChange: (value: string) => void;
  resultCount: number;
  children?: ReactNode;
  onClear: () => void;
  hasFilters: boolean;
}) {
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
        {children}
        {hasFilters ? (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
            {appDict.clearFilters}
          </button>
        ) : null}
      </div>
      <p className="domain-result-count" aria-live="polite">
        {formatNumber(resultCount, locale)} {appDict.showingResults}
      </p>
    </div>
  );
}

function StatusSelect({
  id,
  appDict,
  value,
  onChange,
  statuses,
}: {
  id: string;
  appDict: AppDictionary;
  value: string;
  onChange: (value: string) => void;
  statuses: string[];
}) {
  return (
    <div className="filter-field">
      <label className="filter-label" htmlFor={id}>
        {appDict.dashboard.cols.status}
      </label>
      <select
        id={id}
        className="form-select"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{appDict.allStatuses}</option>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {appDict.status[status] ?? status}
          </option>
        ))}
      </select>
    </div>
  );
}

function TabsRow<T extends string>({
  tabs,
  active,
  onChange,
  ariaLabel,
}: {
  tabs: Array<{ key: T; label: string }>;
  active: T;
  onChange: (key: T) => void;
  ariaLabel: string;
}) {
  return (
    <div className="expansion-tabs" role="tablist" aria-label={ariaLabel}>
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          role="tab"
          aria-selected={active === tab.key}
          className={`expansion-tab${active === tab.key ? " is-active" : ""}`}
          onClick={() => onChange(tab.key)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

function matchesQuery(query: string, values: Array<string | undefined>): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return values.some((value) => value?.toLowerCase().includes(normalized));
}

function NoticeDialog({
  appDict,
  notice,
  onClose,
}: {
  appDict: AppDictionary;
  notice: string | null;
  onClose: () => void;
}) {
  return (
    <InfoDialog
      open={notice !== null}
      title={appDict.previewUnavailableTitle}
      closeLabel={appDict.close}
      onClose={onClose}
    >
      <p>{notice}</p>
    </InfoDialog>
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

function cardLabels(appDict: AppDictionary) {
  return {
    showDetailsLabel: appDict.showDetails,
    hideDetailsLabel: appDict.hideDetails,
    detailsTitle: appDict.recordMoreDetails,
    relationshipsLabel: appDict.dashboard.linkedRecords,
  };
}

/* ---------------- Engineers ---------------- */

function EngineersBoard({ locale, appDict }: BoardProps) {
  const [query, setQuery] = useState("");
  const x = appDict.dashboard.expansion;
  const assignments = useMemo(() => getAllEngineerAssignments(), []);
  const filtered = assignments.filter((item) =>
    matchesQuery(query, [
      item.engineer.id,
      item.engineer.name.ar,
      item.engineer.name.en,
      x.engineerRoles[item.engineer.role],
    ]),
  );

  return (
    <BoardShell
      locale={locale}
      appDict={appDict}
      title={x.engineers.title}
      intro={x.engineers.intro}
      variant="directory"
      stats={[
        { label: x.engineers.title, value: formatNumber(assignments.length, locale) },
        {
          label: x.engineers.assignedRequests,
          value: formatNumber(
            assignments.reduce((total, item) => total + item.requests.length, 0),
            locale,
          ),
        },
        {
          label: x.engineers.assignedStages,
          value: formatNumber(
            assignments.reduce((total, item) => total + item.phases.length, 0),
            locale,
          ),
        },
        {
          label: x.engineers.openIssues,
          value: formatNumber(
            assignments.reduce((total, item) => total + item.issues.length, 0),
            locale,
          ),
        },
      ]}
      controls={
        <Controls
          idPrefix="engineers"
          locale={locale}
          appDict={appDict}
          query={query}
          onQueryChange={setQuery}
          resultCount={filtered.length}
          hasFilters={query !== ""}
          onClear={() => setQuery("")}
        />
      }
    >
      {filtered.length === 0 ? (
        <RecordEmptyState
          action={
            <button type="button" className="btn btn-outline btn-sm" onClick={() => setQuery("")}>
              {appDict.clearFilters}
            </button>
          }
        >
          {appDict.noResults}
        </RecordEmptyState>
      ) : (
        filtered.map((item) => {
          const hasAssignments = item.requests.length + item.phases.length + item.issues.length > 0;
          return (
            <RecordCard
              key={item.engineer.id}
              {...cardLabels(appDict)}
              kind={x.engineerRoles[item.engineer.role] ?? item.engineer.role}
              title={pick(item.engineer.name, locale)}
              reference={<span dir="ltr">{item.engineer.id}</span>}
              summaryItems={[
                meta(appDict.dashboard.cols.phone, item.engineer.phone, { dir: "ltr" }),
                meta(x.engineers.assignedRequests, formatNumber(item.requests.length, locale)),
                meta(x.engineers.assignedStages, formatNumber(item.phases.length, locale)),
                meta(x.engineers.openIssues, formatNumber(item.issues.length, locale)),
              ]}
              detailItems={[]}
              detailChildren={
                <>
                  {hasAssignments ? (
                    <div className="expansion-assignment-groups">
                      {item.requests.length > 0 ? (
                        <div>
                          <h4>{x.engineers.assignedRequests}</h4>
                          <div className="record-relationship-links">
                            {item.requests.map((request) => (
                              <Link
                                key={request.id}
                                className="record-chip-link"
                                href={dashboardHref(locale, `requests?focus=${request.id}`)}
                              >
                                <span dir="ltr">{request.id}</span> ·{" "}
                                {appDict.status[request.status] ?? request.status}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {item.phases.length > 0 ? (
                        <div>
                          <h4>{x.engineers.assignedStages}</h4>
                          <div className="record-relationship-links">
                            {item.phases.map((phase) => (
                              <Link
                                key={phase.id}
                                className="record-chip-link"
                                href={projectHref(locale, phase.rootProjectId)}
                              >
                                {phaseLabel(appDict, locale, phase.id)} ·{" "}
                                {formatPercent(phase.progress, locale)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {item.issues.length > 0 ? (
                        <div>
                          <h4>{x.engineers.openIssues}</h4>
                          <div className="record-relationship-links">
                            {item.issues.map((issue) => (
                              <Link
                                key={issue.id}
                                className="record-chip-link"
                                href={dashboardHref(locale, "issues")}
                              >
                                {pick(issue.title, locale)}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <p>{x.engineers.noAssignments}</p>
                  )}
                  {getAssignmentHistoryForEngineer(item.engineer.id).length > 0 ? (
                    <div className="wf-detail-group">
                      <h4>{x.workflow.assignmentHistoryTitle}</h4>
                      <RecordMetaList
                        variant="detail"
                        items={getAssignmentHistoryForEngineer(item.engineer.id).map((record) =>
                          meta(
                            phaseLabel(appDict, locale, record.phaseId ?? "") ?? record.projectId,
                            <>
                              {x.engineerRoles[record.role] ?? record.role} ·{" "}
                              {x.workflow.periodFrom} {formatDate(record.from, locale)}
                              {record.to
                                ? ` ${x.workflow.periodTo} ${formatDate(record.to, locale)}`
                                : ` · ${x.workflow.currentAssignment}`}
                            </>,
                            { wide: true },
                          ),
                        )}
                      />
                    </div>
                  ) : null}
                </>
              }
            />
          );
        })
      )}
    </BoardShell>
  );
}

/* ---------------- Finance ---------------- */

type FinanceTab = "dues" | "payments" | "expenses" | "documents" | "balances";
type DocumentTab = "invoices" | "certificates" | "receipts";

function FinanceBoard({ locale, appDict }: BoardProps) {
  const [tab, setTab] = useState<FinanceTab>("dues");
  const [docTab, setDocTab] = useState<DocumentTab>("invoices");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;

  const dues = useMemo(() => getAllDuesWithBalance(), []);
  const totals = useMemo(
    () => ({
      dues: dues.reduce((total, item) => total + item.due.amount, 0),
      collected: dues.reduce((total, item) => total + item.allocated, 0),
      remaining: dues.reduce((total, item) => total + item.remaining, 0),
      expenses: previewExpenses.reduce((total, expense) => total + expense.amount, 0),
    }),
    [dues],
  );

  const filteredDues = dues.filter(
    (item) =>
      (!statusFilter || item.status === statusFilter) &&
      matchesQuery(query, [
        item.due.id,
        item.due.label.ar,
        item.due.label.en,
        customerName(item.due.customerId).ar,
        customerName(item.due.customerId).en,
        item.due.projectId,
      ]),
  );

  const customerIds = [...new Set(previewDues.map((due) => due.customerId))].sort();
  const aging = getAgingBuckets();
  const allPayments = customerIds
    .flatMap((id) => getCustomerFinance(id).payments)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const filteredPayments = allPayments.filter((payment) =>
    matchesQuery(query, [
      payment.id,
      customerName(payment.customerId).ar,
      customerName(payment.customerId).en,
      payment.projectId,
      x.paymentMethods[payment.method],
    ]),
  );
  const filteredExpenses = previewExpenses.filter((expense) =>
    matchesQuery(query, [
      expense.id,
      expense.category.ar,
      expense.category.en,
      expense.projectId,
      expense.note.ar,
      expense.note.en,
    ]),
  );
  const activeResultCount =
    tab === "dues"
      ? filteredDues.length
      : tab === "payments"
        ? filteredPayments.length
        : filteredExpenses.length;

  const tabs: Array<{ key: FinanceTab; label: string }> = [
    { key: "dues", label: x.finance.tabs.dues },
    { key: "payments", label: x.finance.tabs.payments },
    { key: "expenses", label: x.finance.tabs.expenses },
    { key: "documents", label: x.finance.tabs.documents },
    { key: "balances", label: x.finance.tabs.balances },
  ];

  let content: ReactNode = null;

  if (tab === "dues") {
    content =
      filteredDues.length === 0 ? (
        <RecordEmptyState>{x.finance.noDues}</RecordEmptyState>
      ) : (
        filteredDues.map((item) => (
          <RecordListItem
            key={item.due.id}
            {...cardLabels(appDict)}
            title={pick(item.due.label, locale)}
            reference={<span dir="ltr">{item.due.id}</span>}
            badges={<StatusBadge appDict={appDict} status={item.status} />}
            summaryItems={[
              meta(
                cols.customer,
                <Link className="record-chip-link" href={customerHref(locale, item.due.customerId)}>
                  {pick(customerName(item.due.customerId), locale)}
                </Link>,
              ),
              meta(
                x.linkedProject,
                <Link className="record-chip-link" href={projectHref(locale, item.due.projectId)}>
                  {pick(projectTitle(item.due.projectId), locale)}
                </Link>,
              ),
              meta(cols.dueDate, formatDate(item.due.dueDate, locale)),
              meta(cols.amount, formatMoney(item.due.amount, locale), { dir: "ltr" }),
              meta(x.finance.allocatedLabel, formatMoney(item.allocated, locale), { dir: "ltr" }),
              meta(x.finance.remainingLabel, formatMoney(item.remaining, locale), { dir: "ltr" }),
            ]}
            detailItems={[
              meta(
                x.linkedPhase,
                phaseLabel(appDict, locale, item.due.phaseId) ??
                  appDict.dashboard.operations.notRecorded,
                { wide: true },
              ),
            ]}
            actions={
              <UnavailableButton
                label={x.finance.recordPayment}
                message={x.finance.postingUnavailable}
                onUnavailable={setNotice}
              />
            }
          />
        ))
      );
  } else if (tab === "payments") {
    const filtered = filteredPayments;
    content =
      filtered.length === 0 ? (
        <RecordEmptyState>{x.finance.noPayments}</RecordEmptyState>
      ) : (
        filtered.map((payment) => (
          <RecordListItem
            key={payment.id}
            {...cardLabels(appDict)}
            title={formatMoney(payment.amount, locale)}
            reference={<span dir="ltr">{payment.id}</span>}
            badges={<StatusBadge appDict={appDict} status="recorded" />}
            summaryItems={[
              meta(
                cols.customer,
                <Link className="record-chip-link" href={customerHref(locale, payment.customerId)}>
                  {pick(customerName(payment.customerId), locale)}
                </Link>,
              ),
              meta(
                x.linkedProject,
                <Link className="record-chip-link" href={projectHref(locale, payment.projectId)}>
                  {pick(projectTitle(payment.projectId), locale)}
                </Link>,
              ),
              meta(cols.date, formatDate(payment.paidAt, locale)),
              meta(cols.method, x.paymentMethods[payment.method] ?? payment.method),
            ]}
            detailItems={payment.allocations.map((allocation) =>
              meta(
                x.finance.allocationTo,
                <>
                  <span dir="ltr">{allocation.dueId}</span> ·{" "}
                  {formatMoney(allocation.amount, locale)}
                </>,
                { wide: true },
              ),
            )}
          />
        ))
      );
  } else if (tab === "expenses") {
    const filtered = filteredExpenses;
    content =
      filtered.length === 0 ? (
        <RecordEmptyState>{x.finance.noExpenses}</RecordEmptyState>
      ) : (
        filtered.map((expense) => (
          <RecordListItem
            key={expense.id}
            {...cardLabels(appDict)}
            title={pick(expense.category, locale)}
            reference={<span dir="ltr">{expense.id}</span>}
            summaryItems={[
              meta(
                x.linkedProject,
                <Link className="record-chip-link" href={projectHref(locale, expense.projectId)}>
                  {pick(projectTitle(expense.projectId), locale)}
                </Link>,
              ),
              meta(
                x.linkedPhase,
                phaseLabel(appDict, locale, expense.phaseId) ??
                  appDict.dashboard.operations.notRecorded,
              ),
              meta(cols.date, formatDate(expense.date, locale)),
              meta(cols.amount, formatMoney(expense.amount, locale), { dir: "ltr" }),
            ]}
            detailItems={[meta(appDict.recordSummary, pick(expense.note, locale), { wide: true })]}
          />
        ))
      );
  } else if (tab === "documents") {
    const docs = x.finance.documents;
    const docTabs: Array<{ key: DocumentTab; label: string }> = [
      { key: "invoices", label: docs.invoices },
      { key: "certificates", label: docs.certificates },
      { key: "receipts", label: docs.receipts },
    ];
    let docContent: ReactNode = null;
    if (docTab === "invoices") {
      docContent =
        previewInvoices.length === 0 ? (
          <RecordEmptyState>{docs.noInvoices}</RecordEmptyState>
        ) : (
          previewInvoices.map((invoice) => (
            <RecordListItem
              key={invoice.id}
              {...cardLabels(appDict)}
              title={pick(invoice.label, locale)}
              reference={<span dir="ltr">{invoice.id}</span>}
              badges={<StatusBadge appDict={appDict} status={invoice.status} />}
              summaryItems={[
                meta(
                  cols.customer,
                  <Link
                    className="record-chip-link"
                    href={customerHref(locale, invoice.customerId)}
                  >
                    {pick(customerName(invoice.customerId), locale)}
                  </Link>,
                ),
                meta(cols.date, formatDate(invoice.issuedAt, locale)),
                meta(cols.amount, formatMoney(invoice.amount, locale), { dir: "ltr" }),
              ]}
              detailItems={[
                meta(
                  docs.linkedDue,
                  invoice.dueId ? (
                    <span dir="ltr">{invoice.dueId}</span>
                  ) : (
                    appDict.dashboard.operations.notRecorded
                  ),
                  { wide: true },
                ),
              ]}
              actions={
                <UnavailableButton
                  label={docs.download}
                  message={docs.downloadUnavailable}
                  onUnavailable={setNotice}
                />
              }
            />
          ))
        );
    } else if (docTab === "certificates") {
      docContent =
        previewCertificates.length === 0 ? (
          <RecordEmptyState>{docs.noCertificates}</RecordEmptyState>
        ) : (
          previewCertificates.map((certificate) => (
            <RecordListItem
              key={certificate.id}
              {...cardLabels(appDict)}
              title={pick(certificate.label, locale)}
              reference={<span dir="ltr">{certificate.id}</span>}
              badges={<StatusBadge appDict={appDict} status={certificate.status} />}
              summaryItems={[
                meta(
                  x.linkedProject,
                  <Link
                    className="record-chip-link"
                    href={projectHref(locale, certificate.projectId)}
                  >
                    {pick(projectTitle(certificate.projectId), locale)}
                  </Link>,
                ),
                meta(
                  docs.period,
                  `${formatDate(certificate.periodFrom, locale)} – ${formatDate(certificate.periodTo, locale)}`,
                ),
                meta(docs.completion, formatPercent(certificate.completionPercent, locale)),
                meta(cols.amount, formatMoney(certificate.amount, locale), { dir: "ltr" }),
              ]}
              detailItems={[
                meta(
                  x.linkedPhase,
                  phaseLabel(appDict, locale, certificate.phaseId) ??
                    appDict.dashboard.operations.notRecorded,
                  { wide: true },
                ),
              ]}
              actions={
                <UnavailableButton
                  label={docs.download}
                  message={docs.downloadUnavailable}
                  onUnavailable={setNotice}
                />
              }
            />
          ))
        );
    } else {
      const receipts = customerIds.flatMap((id) => getCustomerFinance(id).receipts);
      docContent =
        receipts.length === 0 ? (
          <RecordEmptyState>{docs.noReceipts}</RecordEmptyState>
        ) : (
          receipts.map(({ receipt, payment }) => (
            <RecordListItem
              key={receipt.id}
              {...cardLabels(appDict)}
              title={payment ? formatMoney(payment.amount, locale) : receipt.id}
              reference={<span dir="ltr">{receipt.id}</span>}
              badges={<StatusBadge appDict={appDict} status={receipt.status} />}
              summaryItems={[
                meta(cols.date, formatDate(receipt.issuedAt, locale)),
                meta(docs.linkedPayment, <span dir="ltr">{receipt.paymentId}</span>),
                meta(
                  cols.method,
                  payment ? (x.paymentMethods[payment.method] ?? payment.method) : "—",
                ),
              ]}
              actions={
                <UnavailableButton
                  label={docs.download}
                  message={docs.downloadUnavailable}
                  onUnavailable={setNotice}
                />
              }
            />
          ))
        );
    }
    content = (
      <div className="expansion-documents">
        <p className="expansion-note">{docs.distinctNote}</p>
        <TabsRow tabs={docTabs} active={docTab} onChange={setDocTab} ariaLabel={docs.invoices} />
        <div className="domain-record-list">{docContent}</div>
      </div>
    );
  } else {
    const balances = x.finance.balances;
    content = (
      <div className="expansion-balances">
        <section aria-label={x.finance.aging.title}>
          <h3>{x.finance.aging.title}</h3>
          <div className="domain-record-list">
            {aging.map((bucket) => (
              <RecordListItem
                key={bucket.key}
                {...cardLabels(appDict)}
                title={x.finance.aging[bucket.key]}
                summaryItems={[
                  meta(cols.amount, formatMoney(bucket.amount, locale), { dir: "ltr" }),
                  meta(appDict.showingResults, formatNumber(bucket.count, locale)),
                ]}
              />
            ))}
          </div>
          <p className="expansion-note">{x.finance.aging.asOfNote}</p>
        </section>
        <section aria-label={balances.byCustomer}>
          <h3>{balances.byCustomer}</h3>
          <div className="domain-record-list">
            {customerIds.map((customerId) => {
              const finance = getCustomerFinance(customerId);
              return (
                <RecordListItem
                  key={customerId}
                  {...cardLabels(appDict)}
                  title={
                    <Link className="record-chip-link" href={customerHref(locale, customerId)}>
                      {pick(customerName(customerId), locale)}
                    </Link>
                  }
                  reference={<span dir="ltr">{customerId}</span>}
                  summaryItems={[
                    meta(x.finance.totalDues, formatMoney(finance.duesTotal, locale), {
                      dir: "ltr",
                    }),
                    meta(x.finance.totalCollected, formatMoney(finance.collected, locale), {
                      dir: "ltr",
                    }),
                    meta(x.finance.totalRemaining, formatMoney(finance.remaining, locale), {
                      dir: "ltr",
                    }),
                  ]}
                />
              );
            })}
          </div>
        </section>
        <section aria-label={balances.byProjectPhase}>
          <h3>{balances.byProjectPhase}</h3>
          <div className="domain-record-list">
            {previewProjects
              .map((project) => ({ project, finance: getProjectFinance(project.id) }))
              .filter(
                ({ finance }) =>
                  finance.duesTotal > 0 || finance.expensesTotal > 0 || finance.purchasesTotal > 0,
              )
              .map(({ project, finance }) => (
                <RecordListItem
                  key={project.id}
                  {...cardLabels(appDict)}
                  title={pick(project.title, locale)}
                  reference={<span dir="ltr">{project.id}</span>}
                  summaryItems={[
                    meta(x.finance.totalDues, formatMoney(finance.duesTotal, locale), {
                      dir: "ltr",
                    }),
                    meta(x.finance.totalCollected, formatMoney(finance.collected, locale), {
                      dir: "ltr",
                    }),
                    meta(x.finance.totalRemaining, formatMoney(finance.remaining, locale), {
                      dir: "ltr",
                    }),
                    meta(x.finance.totalExpenses, formatMoney(finance.expensesTotal, locale), {
                      dir: "ltr",
                    }),
                  ]}
                  detailItems={[]}
                  detailChildren={
                    <div className="domain-record-list">
                      {finance.byPhase
                        .filter(
                          (row) =>
                            row.duesTotal > 0 || row.expensesTotal > 0 || row.purchasesTotal > 0,
                        )
                        .map((row) => (
                          <RecordListItem
                            key={row.phase.id}
                            {...cardLabels(appDict)}
                            title={phaseLabel(appDict, locale, row.phase.id) ?? row.phase.id}
                            badges={<StatusBadge appDict={appDict} status={row.phase.status} />}
                            summaryItems={[
                              meta(balances.phaseDues, formatMoney(row.duesTotal, locale), {
                                dir: "ltr",
                              }),
                              meta(balances.phaseCollected, formatMoney(row.collected, locale), {
                                dir: "ltr",
                              }),
                              meta(balances.phaseExpenses, formatMoney(row.expensesTotal, locale), {
                                dir: "ltr",
                              }),
                              meta(
                                balances.phasePurchases,
                                formatMoney(row.purchasesTotal, locale),
                                { dir: "ltr" },
                              ),
                            ]}
                          >
                            <ProgressMeter
                              appDict={appDict}
                              locale={locale}
                              value={row.phase.progress}
                              label={`${phaseLabel(appDict, locale, row.phase.id)} — ${formatPercent(row.phase.progress, locale)}`}
                            />
                          </RecordListItem>
                        ))}
                    </div>
                  }
                />
              ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <>
      <BoardShell
        locale={locale}
        appDict={appDict}
        title={x.finance.title}
        intro={x.finance.intro}
        variant="finance"
        layout="list"
        stats={[
          { label: x.finance.totalDues, value: formatMoney(totals.dues, locale) },
          { label: x.finance.totalCollected, value: formatMoney(totals.collected, locale) },
          { label: x.finance.totalRemaining, value: formatMoney(totals.remaining, locale) },
          { label: x.finance.totalExpenses, value: formatMoney(totals.expenses, locale) },
        ]}
        controls={
          <>
            <TabsRow tabs={tabs} active={tab} onChange={setTab} ariaLabel={x.finance.title} />
            {tab !== "balances" && tab !== "documents" ? (
              <Controls
                idPrefix="finance"
                locale={locale}
                appDict={appDict}
                query={query}
                onQueryChange={setQuery}
                resultCount={activeResultCount}
                hasFilters={query !== "" || statusFilter !== ""}
                onClear={() => {
                  setQuery("");
                  setStatusFilter("");
                }}
              >
                {tab === "dues" ? (
                  <StatusSelect
                    id="finance-status"
                    appDict={appDict}
                    value={statusFilter}
                    onChange={setStatusFilter}
                    statuses={["settled", "due", "overdue"]}
                  />
                ) : null}
                <UnavailableButton
                  label={tab === "payments" ? x.finance.recordPayment : x.finance.createDue}
                  message={x.finance.postingUnavailable}
                  onUnavailable={setNotice}
                />
              </Controls>
            ) : null}
          </>
        }
      >
        {content}
      </BoardShell>
      <NoticeDialog appDict={appDict} notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}

/* ---------------- Purchases ---------------- */

function PurchasesBoard({ locale, appDict }: BoardProps) {
  const [query, setQuery] = useState("");
  const [supplierFilter, setSupplierFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;
  const balances = useMemo(() => getAllSupplierBalances(), []);
  const allPurchases = balances.flatMap((balance) => balance.purchases);
  const filtered = allPurchases.filter(
    (purchase) =>
      (!supplierFilter || purchase.supplierId === supplierFilter) &&
      matchesQuery(query, [
        purchase.id,
        purchase.supplierInvoiceRef,
        purchase.projectId,
        ...purchase.lines.flatMap((line) => [line.label.ar, line.label.en]),
      ]),
  );
  const totalPayable = balances.reduce((total, balance) => total + balance.payable, 0);

  return (
    <>
      <BoardShell
        locale={locale}
        appDict={appDict}
        title={x.purchases.suppliersTitle}
        intro={x.purchases.intro}
        variant="directory"
        stats={[
          { label: x.purchases.suppliersTitle, value: formatNumber(balances.length, locale) },
          {
            label: x.purchases.purchasesTitle,
            value: formatNumber(allPurchases.length, locale),
          },
          { label: x.purchases.payable, value: formatMoney(totalPayable, locale) },
        ]}
      >
        {balances.map(({ supplier, purchases, purchasesTotal, paid, payable }) =>
          supplier ? (
            <RecordCard
              key={supplier.id}
              {...cardLabels(appDict)}
              kind={pick(supplier.category, locale)}
              title={pick(supplier.name, locale)}
              reference={<span dir="ltr">{supplier.id}</span>}
              summaryItems={[
                meta(cols.phone, supplier.phone, { dir: "ltr" }),
                meta(cols.city, pick(supplier.city, locale)),
                meta(x.purchases.purchasesTotal, formatMoney(purchasesTotal, locale), {
                  dir: "ltr",
                }),
                meta(cols.paid, formatMoney(paid, locale), { dir: "ltr" }),
                meta(x.purchases.payable, formatMoney(payable, locale), { dir: "ltr" }),
              ]}
              detailItems={[]}
              detailChildren={
                purchases.length > 0 ? (
                  <div className="record-relationship-links">
                    {purchases.map((purchase) => (
                      <span key={purchase.id} className="record-chip-link" dir="ltr">
                        {purchase.id}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p>{x.purchases.noPurchases}</p>
                )
              }
              actions={
                <UnavailableButton
                  label={x.purchases.paySupplier}
                  message={x.purchases.postingUnavailable}
                  onUnavailable={setNotice}
                />
              }
            />
          ) : null,
        )}
      </BoardShell>
      <BoardShell
        locale={locale}
        appDict={appDict}
        title={x.purchases.purchasesTitle}
        intro={x.purchases.inventoryNote}
        variant="finance"
        layout="list"
        stats={[
          {
            label: x.purchases.purchasesTotal,
            value: formatMoney(
              balances.reduce((total, balance) => total + balance.purchasesTotal, 0),
              locale,
            ),
          },
          {
            label: cols.paid,
            value: formatMoney(
              balances.reduce((total, balance) => total + balance.paid, 0),
              locale,
            ),
          },
        ]}
        controls={
          <Controls
            idPrefix="purchases"
            locale={locale}
            appDict={appDict}
            query={query}
            onQueryChange={setQuery}
            resultCount={filtered.length}
            hasFilters={query !== "" || supplierFilter !== ""}
            onClear={() => {
              setQuery("");
              setSupplierFilter("");
            }}
          >
            <div className="filter-field">
              <label className="filter-label" htmlFor="purchases-supplier">
                {cols.supplier}
              </label>
              <select
                id="purchases-supplier"
                className="form-select"
                value={supplierFilter}
                onChange={(event) => setSupplierFilter(event.target.value)}
              >
                <option value="">{appDict.allStatuses}</option>
                {balances.map(({ supplier }) =>
                  supplier ? (
                    <option key={supplier.id} value={supplier.id}>
                      {pick(supplier.name, locale)}
                    </option>
                  ) : null,
                )}
              </select>
            </div>
            <UnavailableButton
              label={x.purchases.recordPurchase}
              message={x.purchases.postingUnavailable}
              onUnavailable={setNotice}
            />
          </Controls>
        }
      >
        {filtered.length === 0 ? (
          <RecordEmptyState>{appDict.noResults}</RecordEmptyState>
        ) : (
          filtered.map((purchase) => {
            const totals = purchaseTotals(purchase);
            const supplier = balances.find((b) => b.supplier?.id === purchase.supplierId)?.supplier;
            return (
              <RecordListItem
                key={purchase.id}
                {...cardLabels(appDict)}
                title={supplier ? pick(supplier.name, locale) : purchase.supplierId}
                reference={
                  <span dir="ltr">
                    {purchase.id} · {purchase.supplierInvoiceRef}
                  </span>
                }
                summaryItems={[
                  meta(
                    x.linkedProject,
                    <Link
                      className="record-chip-link"
                      href={projectHref(locale, purchase.projectId)}
                    >
                      {pick(projectTitle(purchase.projectId), locale)}
                    </Link>,
                  ),
                  meta(
                    x.linkedPhase,
                    phaseLabel(appDict, locale, purchase.phaseId) ??
                      appDict.dashboard.operations.notRecorded,
                  ),
                  meta(cols.date, formatDate(purchase.date, locale)),
                  meta(cols.total, formatMoney(totals.net, locale), { dir: "ltr" }),
                  meta(cols.paid, formatMoney(purchase.paidAmount, locale), { dir: "ltr" }),
                  meta(x.purchases.payable, formatMoney(totals.payable, locale), { dir: "ltr" }),
                ]}
                detailItems={[
                  meta(cols.total, formatMoney(totals.gross, locale), { dir: "ltr" }),
                  meta(cols.discount, formatMoney(purchase.discount, locale), { dir: "ltr" }),
                ]}
                detailChildren={
                  <div>
                    <h4>{x.purchases.linesTitle}</h4>
                    <RecordMetaList
                      variant="detail"
                      items={purchase.lines.map((line) =>
                        meta(
                          pick(line.label, locale),
                          <>
                            {formatNumber(line.quantity, locale)} {pick(line.unit, locale)} ×{" "}
                            {formatMoney(line.unitPrice, locale)} ={" "}
                            {formatMoney(line.quantity * line.unitPrice, locale)}
                          </>,
                          { wide: true },
                        ),
                      )}
                    />
                  </div>
                }
              />
            );
          })
        )}
      </BoardShell>
      <NoticeDialog appDict={appDict} notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}

/* ---------------- Complaints ---------------- */

function ComplaintsBoard({ locale, appDict }: BoardProps) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;
  const filtered = previewComplaints.filter(
    (complaint) =>
      (!kindFilter || complaint.kind === kindFilter) &&
      (!statusFilter || complaint.status === statusFilter) &&
      matchesQuery(query, [
        complaint.id,
        complaint.title.ar,
        complaint.title.en,
        complaint.category.ar,
        complaint.category.en,
        customerName(complaint.customerId).ar,
        customerName(complaint.customerId).en,
      ]),
  );

  return (
    <>
      <BoardShell
        locale={locale}
        appDict={appDict}
        title={x.complaints.title}
        intro={x.complaints.intro}
        variant="quality"
        stats={[
          {
            label: x.complaints.allKinds,
            value: formatNumber(previewComplaints.length, locale),
          },
          {
            label: x.complaints.kindComplaint,
            value: formatNumber(
              previewComplaints.filter((item) => item.kind === "complaint").length,
              locale,
            ),
          },
          {
            label: x.complaints.kindSuggestion,
            value: formatNumber(
              previewComplaints.filter((item) => item.kind === "suggestion").length,
              locale,
            ),
          },
          {
            label: appDict.status["open"] ?? "open",
            value: formatNumber(
              previewComplaints.filter((item) => item.status !== "resolved").length,
              locale,
            ),
          },
        ]}
        controls={
          <Controls
            idPrefix="complaints"
            locale={locale}
            appDict={appDict}
            query={query}
            onQueryChange={setQuery}
            resultCount={filtered.length}
            hasFilters={query !== "" || kindFilter !== "" || statusFilter !== ""}
            onClear={() => {
              setQuery("");
              setKindFilter("");
              setStatusFilter("");
            }}
          >
            <TabsRow
              ariaLabel={cols.type}
              active={kindFilter}
              onChange={setKindFilter}
              tabs={[
                { key: "", label: x.complaints.allKinds },
                { key: "complaint", label: x.complaints.kindComplaint },
                { key: "suggestion", label: x.complaints.kindSuggestion },
              ]}
            />
            <StatusSelect
              id="complaints-status"
              appDict={appDict}
              value={statusFilter}
              onChange={setStatusFilter}
              statuses={["open", "in_progress", "resolved"]}
            />
          </Controls>
        }
      >
        {filtered.length === 0 ? (
          <RecordEmptyState>{appDict.noResults}</RecordEmptyState>
        ) : (
          filtered.map((complaint) => {
            const visible = customerVisibleReplies(complaint);
            const internal = internalReplies(complaint);
            return (
              <RecordCard
                key={complaint.id}
                {...cardLabels(appDict)}
                kind={
                  complaint.kind === "complaint"
                    ? x.complaints.kindComplaint
                    : x.complaints.kindSuggestion
                }
                title={pick(complaint.title, locale)}
                reference={
                  <span dir="ltr">
                    {x.complaints.trackingRef}: {complaint.id}
                  </span>
                }
                badges={
                  <>
                    <StatusBadge appDict={appDict} status={complaint.status} />
                    <PriorityBadge appDict={appDict} priority={complaint.priority} />
                  </>
                }
                summaryItems={[
                  meta(
                    cols.customer,
                    <Link
                      className="record-chip-link"
                      href={customerHref(locale, complaint.customerId)}
                    >
                      {pick(customerName(complaint.customerId), locale)}
                    </Link>,
                  ),
                  meta(
                    x.linkedProject,
                    complaint.projectId ? (
                      <Link
                        className="record-chip-link"
                        href={projectHref(locale, complaint.projectId)}
                      >
                        {pick(projectTitle(complaint.projectId), locale)}
                      </Link>
                    ) : (
                      appDict.dashboard.operations.notRecorded
                    ),
                  ),
                  meta(cols.category, pick(complaint.category, locale)),
                  meta(cols.date, formatDate(complaint.createdAt, locale)),
                  meta(
                    cols.assignee,
                    complaint.assignee
                      ? pick(complaint.assignee, locale)
                      : appDict.dashboard.unassigned,
                  ),
                ]}
                detailItems={[
                  meta(
                    x.linkedPhase,
                    phaseLabel(appDict, locale, complaint.phaseId) ??
                      appDict.dashboard.operations.notRecorded,
                    { wide: true },
                  ),
                  meta(appDict.recordSummary, pick(complaint.detail, locale), { wide: true }),
                  ...(complaint.resolutionSummary
                    ? [
                        meta(x.complaints.resolution, pick(complaint.resolutionSummary, locale), {
                          wide: true,
                        }),
                      ]
                    : []),
                ]}
                detailChildren={
                  <div className="expansion-replies">
                    <section
                      className="reply-block reply-block--customer"
                      aria-label={x.complaints.customerReplies}
                    >
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
                    <section
                      className="reply-block reply-block--internal"
                      aria-label={x.complaints.internalNotes}
                    >
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
                    {complaint.attachments.length > 0 ? (
                      <div>
                        <h4>{x.complaints.attachments}</h4>
                        <div className="record-relationship-links">
                          {complaint.attachments.map((attachment) => (
                            <span key={pick(attachment.label, locale)} className="record-chip-link">
                              {pick(attachment.label, locale)} · {attachment.kind}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                }
                actions={
                  <>
                    <UnavailableButton
                      label={x.complaints.replyAction}
                      message={x.complaints.actionUnavailable}
                      onUnavailable={setNotice}
                    />
                    <UnavailableButton
                      label={x.complaints.assignAction}
                      message={x.complaints.actionUnavailable}
                      onUnavailable={setNotice}
                    />
                    <UnavailableButton
                      label={x.complaints.resolveAction}
                      message={x.complaints.actionUnavailable}
                      onUnavailable={setNotice}
                    />
                  </>
                }
              />
            );
          })
        )}
      </BoardShell>
      <NoticeDialog appDict={appDict} notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}

/* ---------------- Messages ---------------- */

function MessagesBoard({ locale, appDict }: BoardProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;
  const filtered = previewContactMessages.filter(
    (message) =>
      (!statusFilter || message.status === statusFilter) &&
      matchesQuery(query, [
        message.id,
        message.name.ar,
        message.name.en,
        message.phone,
        message.subject.ar,
        message.subject.en,
      ]),
  );

  return (
    <>
      <BoardShell
        locale={locale}
        appDict={appDict}
        title={x.messages.title}
        intro={x.messages.intro}
        variant="directory"
        stats={[
          {
            label: x.messages.title,
            value: formatNumber(previewContactMessages.length, locale),
          },
          {
            label: appDict.status["new"] ?? "new",
            value: formatNumber(
              previewContactMessages.filter((message) => message.status === "new").length,
              locale,
            ),
          },
        ]}
        controls={
          <Controls
            idPrefix="messages"
            locale={locale}
            appDict={appDict}
            query={query}
            onQueryChange={setQuery}
            resultCount={filtered.length}
            hasFilters={query !== "" || statusFilter !== ""}
            onClear={() => {
              setQuery("");
              setStatusFilter("");
            }}
          >
            <StatusSelect
              id="messages-status"
              appDict={appDict}
              value={statusFilter}
              onChange={setStatusFilter}
              statuses={["new", "contacted"]}
            />
          </Controls>
        }
      >
        {filtered.length === 0 ? (
          <RecordEmptyState>{x.messages.noMessages}</RecordEmptyState>
        ) : (
          filtered.map((message) => (
            <RecordCard
              key={message.id}
              {...cardLabels(appDict)}
              title={pick(message.subject, locale)}
              reference={<span dir="ltr">{message.id}</span>}
              badges={<StatusBadge appDict={appDict} status={message.status} />}
              summaryItems={[
                meta(cols.name, pick(message.name, locale)),
                meta(cols.phone, message.phone, { dir: "ltr" }),
                meta(x.messages.receivedAt, formatDate(message.receivedAt, locale)),
                meta(x.messages.consentContact, message.consentContact ? x.yes : x.no),
                meta(x.messages.consentWhatsapp, message.consentWhatsapp ? x.yes : x.no),
              ]}
              detailItems={[
                meta(appDict.recordSummary, pick(message.message, locale), { wide: true }),
              ]}
              actions={
                <>
                  <UnavailableButton
                    label={x.messages.contactAction}
                    message={x.messages.actionUnavailable}
                    onUnavailable={setNotice}
                  />
                  <UnavailableButton
                    label={x.messages.convertAction}
                    message={x.messages.actionUnavailable}
                    onUnavailable={setNotice}
                  />
                </>
              }
            />
          ))
        )}
      </BoardShell>
      <NoticeDialog appDict={appDict} notice={notice} onClose={() => setNotice(null)} />
    </>
  );
}

/* ---------------- Dispatch ---------------- */

export function ExpansionBoard({
  locale,
  appDict,
  moduleKey,
}: BoardProps & { moduleKey: ExpansionModuleKey }) {
  switch (moduleKey) {
    case "engineers":
      return <EngineersBoard locale={locale} appDict={appDict} />;
    case "finance":
      return <FinanceBoard locale={locale} appDict={appDict} />;
    case "purchases":
      return <PurchasesBoard locale={locale} appDict={appDict} />;
    case "complaints":
      return <ComplaintsBoard locale={locale} appDict={appDict} />;
    case "messages":
      return <MessagesBoard locale={locale} appDict={appDict} />;
  }
}

export { phaseLabel, phaseProgress };
