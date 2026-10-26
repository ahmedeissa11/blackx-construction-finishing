"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import type { PreviewRequest } from "@/content/preview-data";
import type { PreviewCell, PreviewModuleRow } from "@/content/preview-modules";
import { dashboardHref, dashboardModules, type DashboardModuleKey } from "@/config/navigation";
import {
  getAllowedPreviewRequestStatusTransitions,
  getPreviewRequestContext,
  getPreviewRequestWorkflow,
  getPreviewRowDate,
  getPreviewRowReference,
  getPreviewRowStatus,
} from "@/lib/admin-preview";
import { formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import {
  hasAdminRequestDraftChanges,
  hasErrors,
  requiresAdminRequestConfirmation,
  validateAdminRequestAssignment,
  type AdminRequestAssignmentErrors,
} from "@/lib/validation";
import { ConfirmDialog, Toast } from "@/components/ui/ConfirmDialog";
import {
  PriorityBadge,
  RecordCard,
  RecordDetailSection,
  RecordEmptyState,
  RecordListItem,
  RecordMetaList,
  StatusBadge,
  type RecordMetaItem,
} from "@/components/dashboard/RecordUI";

const STATUS_FLOW = [
  "new",
  "contacted",
  "inspection_scheduled",
  "inspection_done",
  "quotation_sent",
  "approved",
  "on_hold",
  "cancelled",
] as const;

const ASSIGNEES = [
  { ar: "منسّق أ", en: "Coordinator A" },
  { ar: "مهندس معاينات ب", en: "Inspection Engineer B" },
  { ar: "مدير مشاريع ج", en: "Project Manager C" },
];

function moduleHref(locale: Locale, moduleKey: DashboardModuleKey): string {
  return dashboardHref(
    locale,
    dashboardModules.find((module) => module.key === moduleKey)?.segment ?? "",
  );
}

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
}

function formatLinkedCell(
  cell: PreviewCell | undefined,
  locale: Locale,
  appDict: AppDictionary,
): string {
  if (!cell) return "";
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

function LinkedModuleRows({
  rows,
  locale,
  appDict,
  href,
}: {
  rows: PreviewModuleRow[];
  locale: Locale;
  appDict: AppDictionary;
  href: string;
}) {
  return (
    <div className="record-list">
      {rows.map((row) => {
        const status = getPreviewRowStatus(row);
        const title =
          formatLinkedCell(row.cells.title, locale, appDict) ||
          formatLinkedCell(row.cells.service, locale, appDict) ||
          formatLinkedCell(row.cells.type, locale, appDict) ||
          getPreviewRowReference(row) ||
          row.id;
        const reference = getPreviewRowReference(row);
        const summaryItems = [
          getPreviewRowDate(row)
            ? meta(appDict.dashboard.cols.date, formatDate(getPreviewRowDate(row)!, locale))
            : null,
          formatLinkedCell(row.cells.assignee, locale, appDict)
            ? meta(
                appDict.dashboard.cols.assignee,
                formatLinkedCell(row.cells.assignee, locale, appDict),
              )
            : null,
          formatLinkedCell(row.cells.amount, locale, appDict)
            ? meta(
                appDict.dashboard.operations.domain.amount,
                formatLinkedCell(row.cells.amount, locale, appDict),
              )
            : null,
        ].filter((item): item is RecordMetaItem => Boolean(item));
        const detailItems = [
          formatLinkedCell(row.cells.customer, locale, appDict)
            ? meta(
                appDict.dashboard.cols.customer,
                formatLinkedCell(row.cells.customer, locale, appDict),
                { wide: true },
              )
            : null,
        ].filter((item): item is RecordMetaItem => Boolean(item));
        return (
          <RecordListItem
            key={row.id}
            title={title}
            reference={reference ? <span dir="ltr">{reference}</span> : undefined}
            summaryItems={summaryItems}
            detailItems={detailItems}
            badges={<StatusBadge appDict={appDict} status={status} />}
            actions={
              <Link
                className="btn btn-ghost btn-sm"
                href={href}
                aria-label={`${appDict.view}: ${reference ?? row.id}`}
              >
                {appDict.view}
              </Link>
            }
            showDetailsLabel={appDict.showDetails}
            hideDetailsLabel={appDict.hideDetails}
            detailsTitle={appDict.recordMoreDetails}
          />
        );
      })}
    </div>
  );
}

export function RequestsBoard({
  locale,
  appDict,
  initialRequests,
  initialFocusId,
  focusUnavailable = false,
}: {
  locale: Locale;
  appDict: AppDictionary;
  initialRequests: PreviewRequest[];
  initialFocusId?: string;
  focusUnavailable?: boolean;
}) {
  const [requests, setRequests] = useState<PreviewRequest[]>(initialRequests);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const focusedRequest = initialRequests.find((request) => request.id === initialFocusId);
  const [selected, setSelected] = useState<PreviewRequest | null>(focusedRequest ?? null);
  const [draftStatus, setDraftStatus] = useState(focusedRequest?.status ?? "");
  const [draftAssignee, setDraftAssignee] = useState(
    focusedRequest?.assignee ? pick(focusedRequest.assignee, locale) : "",
  );
  const [draftErrors, setDraftErrors] = useState<AdminRequestAssignmentErrors>({});
  const [confirmStatusChange, setConfirmStatusChange] = useState(false);
  const [toast, setToast] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (selected && !dialog.open) dialog.showModal();
    if (!selected && dialog.open) dialog.close();
  }, [selected]);

  const cols = appDict.dashboard.cols;

  const servicesPresent = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of requests) map.set(r.serviceSlug, pick(r.serviceLabel, locale));
    return [...map.entries()];
  }, [requests, locale]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter && r.status !== statusFilter) return false;
      if (serviceFilter && r.serviceSlug !== serviceFilter) return false;
      if (!q) return true;
      const hay = `${r.id} ${r.customerId} ${pick(r.customerName, locale)} ${r.customerName.en} ${pick(r.serviceLabel, locale)} ${pick(r.city, locale)} ${r.phone}`;
      return hay.toLowerCase().includes(q);
    });
  }, [requests, query, statusFilter, serviceFilter, locale]);

  const selectedContext = useMemo(
    () => (selected ? getPreviewRequestContext(selected) : null),
    [selected],
  );
  const selectedWorkflow = useMemo(
    () => (selected ? getPreviewRequestWorkflow(selected) : null),
    [selected],
  );
  const allowedDraftStatuses = useMemo(
    () => (selected ? getAllowedPreviewRequestStatusTransitions(selected) : STATUS_FLOW),
    [selected],
  );
  const currentAssigneeLabel = selected?.assignee ? pick(selected.assignee, locale) : "";
  const hasDraftChanges = selected
    ? hasAdminRequestDraftChanges({
        currentStatus: selected.status,
        currentAssignee: currentAssigneeLabel,
        draftStatus,
        draftAssignee,
      })
    : false;
  const assigneeError = draftErrors.assignee ? appDict.validation[draftErrors.assignee] : undefined;
  const assigneeRequired = ["inspection_scheduled", "inspection_done"].includes(draftStatus);

  function closeDetail() {
    setSelected(null);
    setDraftErrors({});
    setConfirmStatusChange(false);
  }

  function openDetail(r: PreviewRequest) {
    setSelected(r);
    setDraftStatus(r.status);
    setDraftAssignee(r.assignee ? pick(r.assignee, locale) : "");
    setDraftErrors({});
    setConfirmStatusChange(false);
  }

  function updateDraftStatus(value: string) {
    setDraftStatus(value);
    if (!["inspection_scheduled", "inspection_done"].includes(value)) {
      setDraftErrors((prev) => ({ ...prev, assignee: undefined }));
    }
  }

  function updateDraftAssignee(value: string) {
    setDraftAssignee(value);
    if (value) setDraftErrors((prev) => ({ ...prev, assignee: undefined }));
  }

  function applyPreviewChange() {
    if (!selected) return;
    const assignee = ASSIGNEES.find((a) => a[locale] === draftAssignee) ?? null;
    setRequests((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              status: draftStatus,
              assignee,
              history:
                draftStatus !== r.status
                  ? [
                      ...r.history,
                      {
                        status: draftStatus,
                        at: new Date().toISOString().slice(0, 10),
                        note: {
                          ar: "تم تحديث حالة الطلب",
                          en: "Request status updated",
                        },
                      },
                    ]
                  : r.history,
            }
          : r,
      ),
    );
    closeDetail();
    setToast(true);
  }

  function requestSavePreview() {
    if (!selected || !hasDraftChanges) return;
    const nextErrors = validateAdminRequestAssignment({
      status: draftStatus,
      assignee: draftAssignee,
    });
    setDraftErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      document.getElementById("req-assignee-select")?.focus();
      return;
    }
    if (draftStatus !== selected.status && requiresAdminRequestConfirmation(draftStatus)) {
      setConfirmStatusChange(true);
      return;
    }
    applyPreviewChange();
  }

  const hasFilters = query !== "" || statusFilter !== "" || serviceFilter !== "";
  const requestSummary = [
    {
      label: appDict.dashboard.operations.domain.summary,
      value: requests.length,
    },
    {
      label: appDict.status.new ?? "new",
      value: requests.filter((request) => request.status === "new").length,
    },
    {
      label: appDict.status.inspection_scheduled ?? "inspection_scheduled",
      value: requests.filter((request) => request.status === "inspection_scheduled").length,
    },
    {
      label: appDict.status.on_hold ?? "on_hold",
      value: requests.filter((request) => request.status === "on_hold").length,
    },
  ];

  return (
    <section className="panel requests-board">
      {focusUnavailable || (initialFocusId && !focusedRequest) ? (
        <p role="status" className="erp-boundary">
          {locale === "ar"
            ? "الطلب المشار إليه غير موجود في بيانات المعاينة المصرح بها. اختر طلباً من القائمة؛ لم تُفتح أو تُعدل أي سجلات أخرى."
            : "The referenced request is unavailable in the authorized preview data. Choose a request from the list; no other record was opened or changed."}
        </p>
      ) : null}
      <div className="requests-board-head">
        <div className="requests-board-copy">
          <p className="requests-board-eyebrow">{appDict.dashboard.modules.requests}</p>
          <h2>{appDict.dashboard.requestsTitle}</h2>
          <p>{appDict.dashboard.requestsLead}</p>
        </div>
        <dl className="requests-summary" aria-label={appDict.dashboard.requestsTitle}>
          {requestSummary.map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{formatNumber(item.value, locale)}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="panel-head requests-toolbar-shell">
        <div className="toolbar" style={{ flex: 1 }}>
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <label className="sr-only" htmlFor="rq-search">
              {appDict.searchShort}
            </label>
            <input
              id="rq-search"
              className="form-input"
              type="search"
              placeholder={appDict.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="rq-status">
              {appDict.dashboard.cols.status}
            </label>
            <select
              id="rq-status"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{appDict.allStatuses}</option>
              {STATUS_FLOW.map((s) => (
                <option key={s} value={s}>
                  {appDict.status[s]}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-field">
            <label className="filter-label" htmlFor="rq-service">
              {appDict.dashboard.cols.service}
            </label>
            <select
              id="rq-service"
              className="form-select"
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
            >
              <option value="">{appDict.allServicesFilter}</option>
              {servicesPresent.map(([slug, label]) => (
                <option key={slug} value={slug}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          {hasFilters ? (
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setQuery("");
                setStatusFilter("");
                setServiceFilter("");
              }}
            >
              {appDict.clearFilters}
            </button>
          ) : null}
        </div>
      </div>
      <p
        style={{ padding: "12px 20px 0", color: "var(--color-muted)", fontSize: "0.88rem" }}
        aria-live="polite"
      >
        {formatNumber(filtered.length, locale)} {appDict.showingResults}
      </p>
      <div className="table-wrap requests-table-wrap">
        <table className="data data-card-table requests-data-table">
          <caption className="sr-only">{appDict.dashboard.requestsTitle}</caption>
          <thead>
            <tr>
              <th scope="col">{cols.reference}</th>
              <th scope="col">{cols.customer}</th>
              <th scope="col">{cols.service}</th>
              <th scope="col">{cols.city}</th>
              <th scope="col">{cols.date}</th>
              <th scope="col">{cols.priority}</th>
              <th scope="col">{cols.status}</th>
              <th scope="col">{appDict.dashboard.operations.nextStep}</th>
              <th scope="col">{cols.assignee}</th>
              <th scope="col">{appDict.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td data-label={cols.reference}>
                  <span dir="ltr" style={{ fontWeight: 700 }}>
                    {r.id}
                  </span>
                </td>
                <td data-label={cols.customer} data-wide="true">
                  <div style={{ fontWeight: 600 }}>{pick(r.customerName, locale)}</div>
                  <div dir="ltr" style={{ color: "var(--color-muted)", fontSize: "0.82rem" }}>
                    {r.customerId}
                  </div>
                  <div
                    dir="ltr"
                    style={{ color: "var(--color-muted)", fontSize: "0.82rem", textAlign: "end" }}
                  >
                    {r.phone}
                  </div>
                </td>
                <td data-label={cols.service}>{pick(r.serviceLabel, locale)}</td>
                <td data-label={cols.city}>{pick(r.city, locale)}</td>
                <td data-label={cols.date}>{formatDate(r.submittedAt, locale)}</td>
                <td data-label={cols.priority}>
                  <PriorityBadge appDict={appDict} priority={r.priority} />
                </td>
                <td data-label={cols.status}>
                  <StatusBadge appDict={appDict} status={r.status} />
                </td>
                <td data-label={appDict.dashboard.operations.nextStep} data-wide="true">
                  <span style={{ display: "block" }}>
                    {
                      appDict.dashboard.operations.nextActions[
                        getPreviewRequestWorkflow(r).nextAction
                      ]
                    }
                  </span>
                  {getPreviewRequestWorkflow(r).blockers.length > 0 ? (
                    <span style={{ color: "var(--color-urgent, #b45309)", fontSize: "0.82rem" }}>
                      {appDict.dashboard.operations.needsAttention}:{" "}
                      {formatNumber(getPreviewRequestWorkflow(r).blockers.length, locale)}
                    </span>
                  ) : null}
                </td>
                <td data-label={cols.assignee}>
                  {r.assignee ? (
                    pick(r.assignee, locale)
                  ) : (
                    <span style={{ color: "var(--color-muted)" }}>
                      {appDict.dashboard.unassigned}
                    </span>
                  )}
                </td>
                <td data-label={appDict.actions} data-wide="true">
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => openDetail(r)}
                    aria-haspopup="dialog"
                    aria-label={`${appDict.view}: ${r.id}`}
                  >
                    {appDict.view}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="requests-mobile-list" aria-label={appDict.dashboard.requestsTitle}>
        {filtered.map((r) => {
          const workflow = getPreviewRequestWorkflow(r);
          return (
            <RecordCard
              key={r.id}
              title={pick(r.customerName, locale)}
              reference={<span dir="ltr">{r.id}</span>}
              badges={
                <>
                  <PriorityBadge appDict={appDict} priority={r.priority} />
                  <StatusBadge appDict={appDict} status={r.status} />
                </>
              }
              summaryItems={[
                meta(cols.service, pick(r.serviceLabel, locale), { wide: true }),
                meta(cols.date, formatDate(r.submittedAt, locale)),
                meta(cols.city, pick(r.city, locale)),
                meta(
                  cols.assignee,
                  r.assignee ? pick(r.assignee, locale) : appDict.dashboard.unassigned,
                ),
                meta(
                  appDict.dashboard.operations.nextStep,
                  appDict.dashboard.operations.nextActions[workflow.nextAction],
                  { wide: true },
                ),
              ]}
              detailItems={[
                meta(cols.customer, r.customerId, { dir: "ltr" }),
                meta(cols.phone, r.phone, { dir: "ltr" }),
                meta(
                  appDict.dashboard.operations.needsAttention,
                  workflow.blockers.length > 0
                    ? formatNumber(workflow.blockers.length, locale)
                    : appDict.dashboard.operations.noBlockers,
                  { wide: true },
                ),
              ]}
              actions={
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => openDetail(r)}
                  aria-haspopup="dialog"
                  aria-label={`${appDict.view}: ${r.id}`}
                >
                  {appDict.view}
                </button>
              }
              showDetailsLabel={appDict.showDetails}
              hideDetailsLabel={appDict.hideDetails}
              detailsTitle={appDict.recordMoreDetails}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="requests-empty-wrap">
          <RecordEmptyState
            action={
              hasFilters ? (
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setQuery("");
                    setStatusFilter("");
                    setServiceFilter("");
                  }}
                >
                  {appDict.clearFilters}
                </button>
              ) : undefined
            }
          >
            {appDict.noResults}
          </RecordEmptyState>
        </div>
      ) : null}

      <dialog
        ref={dialogRef}
        className="app-dialog"
        style={{ maxWidth: 760 }}
        onClose={closeDetail}
        aria-labelledby={selected ? "req-dialog-title" : undefined}
      >
        {selected ? (
          <>
            <div className="dialog-head">
              <div>
                <h2 id="req-dialog-title">
                  {appDict.dashboard.requestDetailTitle} · <span dir="ltr">{selected.id}</span>
                </h2>
                <div
                  className="record-card-badges"
                  style={{ justifyContent: "flex-start", marginBlockStart: 8, maxWidth: "none" }}
                >
                  <StatusBadge appDict={appDict} status={selected.status} />
                  <PriorityBadge appDict={appDict} priority={selected.priority} />
                </div>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label={appDict.close}
                onClick={closeDetail}
              >
                ✕
              </button>
            </div>
            <div
              className="dialog-body"
              style={{ display: "flex", flexDirection: "column", gap: 20 }}
            >
              <RecordDetailSection
                title={appDict.dashboard.recordSections.overview}
                labelledBy="request-overview-title"
              >
                <RecordMetaList
                  variant="detail"
                  items={[
                    meta(
                      cols.customer,
                      <>
                        {pick(selected.customerName, locale)} ·{" "}
                        <span dir="ltr">{selected.customerId}</span>
                      </>,
                      { wide: true },
                    ),
                    meta(cols.phone, selected.phone, { dir: "ltr" }),
                    meta(cols.city, pick(selected.city, locale)),
                    meta(cols.service, pick(selected.serviceLabel, locale), { wide: true }),
                    meta(cols.date, formatDate(selected.submittedAt, locale)),
                    meta(
                      cols.assignee,
                      selected.assignee
                        ? pick(selected.assignee, locale)
                        : appDict.dashboard.unassigned,
                    ),
                  ]}
                />
              </RecordDetailSection>

              <RecordDetailSection
                title={appDict.dashboard.recordSections.requestDescription}
                labelledBy="request-description-title"
              >
                <p style={{ color: "var(--color-ink)" }}>{pick(selected.description, locale)}</p>
              </RecordDetailSection>

              <RecordDetailSection
                title={appDict.dashboard.detailLabels.history}
                labelledBy="request-history-title"
              >
                <div className="timeline">
                  {selected.history.map((h, i) => (
                    <div className="timeline-item done" key={`${h.at}-${i}`}>
                      <span className="timeline-dot" aria-hidden="true">
                        ✓
                      </span>
                      <div>
                        <h3>{appDict.status[h.status] ?? h.status}</h3>
                        <p>
                          {formatDate(h.at, locale)} — {pick(h.note, locale)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </RecordDetailSection>
              {selectedWorkflow ? (
                <RecordDetailSection
                  title={appDict.dashboard.operations.workflowTitle}
                  labelledBy="request-workflow-title"
                  className="request-workflow-section"
                >
                  <ol className="request-workflow-steps">
                    {selectedWorkflow.stages.map((stage) => (
                      <li key={stage.key} data-state={stage.state}>
                        <strong>{appDict.dashboard.operations.stages[stage.key]}</strong>
                        <span>{appDict.dashboard.operations.stageStates[stage.state]}</span>
                        {stage.evidenceRefs.length > 0 ? (
                          <span dir="ltr">{stage.evidenceRefs.join(" · ")}</span>
                        ) : null}
                        {stage.statusOnly ? (
                          <span>{appDict.dashboard.operations.statusOnly}</span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                  <p>
                    <strong>{appDict.dashboard.operations.nextStep}: </strong>
                    {appDict.dashboard.operations.nextActions[selectedWorkflow.nextAction]}{" "}
                    {selectedWorkflow.nextActionModule !== "requests" ? (
                      <Link
                        className="btn btn-ghost btn-sm"
                        href={moduleHref(locale, selectedWorkflow.nextActionModule)}
                      >
                        {appDict.dashboard.operations.openRelated}
                      </Link>
                    ) : null}
                  </p>
                  <h4 style={{ fontSize: "0.9rem", marginBlock: "12px 6px" }}>
                    {appDict.dashboard.operations.needsAttention}
                  </h4>
                  {selectedWorkflow.blockers.length > 0 ? (
                    <ul style={{ margin: 0, paddingInlineStart: 20 }}>
                      {selectedWorkflow.blockers.map((blocker) => (
                        <li key={blocker}>{appDict.dashboard.operations.blockers[blocker]}</li>
                      ))}
                    </ul>
                  ) : (
                    <p style={{ color: "var(--color-muted)" }}>
                      {appDict.dashboard.operations.noBlockers}
                    </p>
                  )}
                </RecordDetailSection>
              ) : null}
              {selectedContext ? (
                <>
                  <RecordDetailSection
                    title={appDict.dashboard.linkedRequestRecords}
                    labelledBy="request-linked-records-title"
                  >
                    {selectedContext.inspections.length > 0 ? (
                      <>
                        <h4 style={{ fontSize: "0.9rem", marginBlock: "10px 4px" }}>
                          {appDict.dashboard.modules.inspections}
                        </h4>
                        <LinkedModuleRows
                          rows={selectedContext.inspections}
                          locale={locale}
                          appDict={appDict}
                          href={dashboardHref(locale, "inspections")}
                        />
                      </>
                    ) : null}
                    {selectedContext.quotations.length > 0 ? (
                      <>
                        <h4 style={{ fontSize: "0.9rem", marginBlock: "10px 4px" }}>
                          {appDict.dashboard.modules.quotations}
                        </h4>
                        <LinkedModuleRows
                          rows={selectedContext.quotations}
                          locale={locale}
                          appDict={appDict}
                          href={dashboardHref(locale, "quotations")}
                        />
                      </>
                    ) : null}
                    {selectedContext.inspections.length === 0 &&
                    selectedContext.quotations.length === 0 ? (
                      <p style={{ color: "var(--color-muted)" }}>
                        {appDict.dashboard.noLinkedRequestRecords}
                      </p>
                    ) : null}
                  </RecordDetailSection>

                  <RecordDetailSection
                    title={appDict.dashboard.sameCustomerRecords}
                    description={appDict.dashboard.sameCustomerRecordsNote}
                    labelledBy="request-customer-records-title"
                  >
                    {selectedContext.customerProjects.length > 0 ? (
                      <div className="record-list">
                        {selectedContext.customerProjects.map((project) => (
                          <RecordListItem
                            key={project.id}
                            title={pick(project.title, locale)}
                            reference={<span dir="ltr">{project.id}</span>}
                            summaryItems={[
                              meta(cols.milestone, pick(project.currentMilestone, locale)),
                              meta(cols.updated, formatDate(project.updatedAt, locale)),
                            ]}
                            badges={<StatusBadge appDict={appDict} status={project.status} />}
                            actions={
                              <Link
                                className="btn btn-outline btn-sm"
                                href={dashboardHref(
                                  locale,
                                  `projects/${encodeURIComponent(project.id)}`,
                                )}
                              >
                                {appDict.dashboard.openProjectWorkspace}
                              </Link>
                            }
                            showDetailsLabel={appDict.showDetails}
                            hideDetailsLabel={appDict.hideDetails}
                            detailsTitle={appDict.recordMoreDetails}
                          />
                        ))}
                      </div>
                    ) : null}
                    {selectedContext.customerContracts.length > 0 ? (
                      <>
                        <h4 style={{ fontSize: "0.9rem", marginBlock: "10px 4px" }}>
                          {appDict.dashboard.modules.contracts}
                        </h4>
                        <LinkedModuleRows
                          rows={selectedContext.customerContracts}
                          locale={locale}
                          appDict={appDict}
                          href={dashboardHref(locale, "contracts")}
                        />
                      </>
                    ) : null}
                    {selectedContext.customerProjects.length === 0 &&
                    selectedContext.customerContracts.length === 0 ? (
                      <p style={{ color: "var(--color-muted)" }}>
                        {appDict.dashboard.noSameCustomerRecords}
                      </p>
                    ) : null}
                  </RecordDetailSection>
                </>
              ) : null}
              <fieldset className="form-section">
                <legend>{appDict.dashboard.recordSections.previewUpdate}</legend>
                <div className="form-grid">
                  <div className="field">
                    <label className="form-label" htmlFor="req-status-select">
                      {appDict.changeStatusPreview}
                      <span className="form-field-note form-field-note-required">
                        {appDict.requiredField}
                      </span>
                    </label>
                    <select
                      id="req-status-select"
                      className="form-select"
                      value={draftStatus}
                      onChange={(e) => updateDraftStatus(e.target.value)}
                      required
                      aria-required="true"
                    >
                      {allowedDraftStatuses.map((s) => (
                        <option key={s} value={s}>
                          {appDict.status[s] ?? s}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label className="form-label" htmlFor="req-assignee-select">
                      {appDict.assignPreview}
                      <span
                        className={
                          assigneeRequired
                            ? "form-field-note form-field-note-required"
                            : "form-field-note"
                        }
                      >
                        {assigneeRequired ? appDict.requiredField : appDict.validation.optional}
                      </span>
                    </label>
                    <select
                      id="req-assignee-select"
                      className="form-select"
                      value={draftAssignee}
                      onChange={(e) => updateDraftAssignee(e.target.value)}
                      required={assigneeRequired}
                      aria-required={assigneeRequired}
                      aria-invalid={assigneeError ? true : undefined}
                      aria-describedby={
                        assigneeError
                          ? "req-assignee-error"
                          : assigneeRequired
                            ? "req-assignee-hint"
                            : undefined
                      }
                    >
                      <option value="">{appDict.dashboard.unassigned}</option>
                      {ASSIGNEES.map((a) => (
                        <option key={a.en} value={a[locale]}>
                          {a[locale]}
                        </option>
                      ))}
                    </select>
                    {assigneeRequired && !assigneeError ? (
                      <p className="field-hint" id="req-assignee-hint">
                        {appDict.validation.assigneeRequired}
                      </p>
                    ) : null}
                    {assigneeError ? (
                      <p className="field-error" id="req-assignee-error" role="alert">
                        {assigneeError}
                      </p>
                    ) : null}
                  </div>
                </div>
              </fieldset>
              {!hasDraftChanges ? (
                <p
                  id="req-save-hint"
                  aria-live="polite"
                  style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}
                >
                  {appDict.dashboard.requestNoChanges}
                </p>
              ) : null}
              <div className="alert alert-warning">
                <span aria-hidden="true">⚠</span>
                <p>{appDict.demoActionText}</p>
              </div>
            </div>
            <div className="dialog-foot">
              <button type="button" className="btn btn-outline btn-sm" onClick={closeDetail}>
                {appDict.cancel}
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={requestSavePreview}
                disabled={!hasDraftChanges}
                aria-describedby={!hasDraftChanges ? "req-save-hint" : undefined}
              >
                {appDict.savePreview}
              </button>
            </div>
          </>
        ) : null}
      </dialog>
      <ConfirmDialog
        open={Boolean(selected && confirmStatusChange)}
        title={appDict.dashboard.requestStatusConfirmTitle}
        body={
          selected
            ? appDict.dashboard.requestStatusConfirmText
                .replace("{request}", selected.id)
                .replace("{status}", appDict.status[draftStatus] ?? draftStatus)
            : ""
        }
        confirmLabel={appDict.confirm}
        cancelLabel={appDict.cancel}
        onConfirm={applyPreviewChange}
        onClose={() => setConfirmStatusChange(false)}
      />
      {toast ? (
        <Toast
          message={appDict.demoSavedToast}
          onDismiss={() => setToast(false)}
          closeLabel={appDict.close}
        />
      ) : null}
    </section>
  );
}
