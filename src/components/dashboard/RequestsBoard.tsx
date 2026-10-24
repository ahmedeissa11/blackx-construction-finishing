"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
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
  { ar: "منسق معاينة أ", en: "Preview Coordinator A" },
  { ar: "مهندس معاينات ب", en: "Preview Inspector B" },
  { ar: "مدير مشاريع ج", en: "Preview PM C" },
];

function moduleHref(locale: Locale, moduleKey: DashboardModuleKey): string {
  return dashboardHref(
    locale,
    dashboardModules.find((module) => module.key === moduleKey)?.segment ?? "",
  );
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
    <div className="list-rows">
      {rows.map((row) => {
        const status = getPreviewRowStatus(row);
        const title =
          formatLinkedCell(row.cells.title, locale, appDict) ||
          formatLinkedCell(row.cells.service, locale, appDict) ||
          formatLinkedCell(row.cells.type, locale, appDict) ||
          getPreviewRowReference(row) ||
          row.id;
        const detailParts = [
          getPreviewRowReference(row),
          getPreviewRowDate(row) ? formatDate(getPreviewRowDate(row)!, locale) : "",
          formatLinkedCell(row.cells.assignee, locale, appDict),
          formatLinkedCell(row.cells.amount, locale, appDict),
          formatLinkedCell(row.cells.customer, locale, appDict),
        ].filter(Boolean);
        return (
          <div className="list-row" key={row.id} style={{ paddingInline: 0 }}>
            <div className="lr-main">
              <div className="lr-title">{title}</div>
              {detailParts.length > 0 ? (
                <div className="lr-sub">{detailParts.join(" · ")}</div>
              ) : null}
            </div>
            {status ? (
              <span className={statusBadgeClass(status)}>{appDict.status[status] ?? status}</span>
            ) : null}
            <Link
              className="btn btn-ghost btn-sm"
              href={href}
              aria-label={`${appDict.view}: ${getPreviewRowReference(row) ?? row.id}`}
            >
              {appDict.view}
            </Link>
          </div>
        );
      })}
    </div>
  );
}

export function RequestsBoard({
  locale,
  appDict,
  initialRequests,
}: {
  locale: Locale;
  appDict: AppDictionary;
  initialRequests: PreviewRequest[];
}) {
  const [requests, setRequests] = useState<PreviewRequest[]>(initialRequests);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [serviceFilter, setServiceFilter] = useState("");
  const [selected, setSelected] = useState<PreviewRequest | null>(null);
  const [draftStatus, setDraftStatus] = useState("");
  const [draftAssignee, setDraftAssignee] = useState("");
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
                          ar: "تغيير حالة داخل المعاينة",
                          en: "Status changed inside preview",
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

  return (
    <div className="panel">
      <div className="panel-head">
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
          <label className="sr-only" htmlFor="rq-status">
            {appDict.allStatuses}
          </label>
          <select
            id="rq-status"
            className="form-select"
            style={{ width: "auto" }}
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
          <label className="sr-only" htmlFor="rq-service">
            {appDict.allServicesFilter}
          </label>
          <select
            id="rq-service"
            className="form-select"
            style={{ width: "auto" }}
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
      <div className="table-wrap">
        <table className="data">
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
              <th scope="col">{cols.assignee}</th>
              <th scope="col">{appDict.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td>
                  <span dir="ltr" style={{ fontWeight: 700 }}>
                    {r.id}
                  </span>
                </td>
                <td>
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
                <td>{pick(r.serviceLabel, locale)}</td>
                <td>{pick(r.city, locale)}</td>
                <td>{formatDate(r.submittedAt, locale)}</td>
                <td>
                  <span
                    className={
                      r.priority === "urgent"
                        ? "badge badge-urgent"
                        : r.priority === "high"
                          ? "badge badge-progress"
                          : "badge badge-neutral"
                    }
                  >
                    {appDict.priority[r.priority]}
                  </span>
                </td>
                <td>
                  <span className={statusBadgeClass(r.status)}>
                    {appDict.status[r.status] ?? r.status}
                  </span>
                </td>
                <td>
                  <span style={{ display: "block", minWidth: 170 }}>
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
                <td>
                  {r.assignee ? (
                    pick(r.assignee, locale)
                  ) : (
                    <span style={{ color: "var(--color-muted)" }}>
                      {appDict.dashboard.unassigned}
                    </span>
                  )}
                </td>
                <td>
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
        {filtered.length === 0 ? (
          <div style={{ padding: "44px 24px", textAlign: "center", color: "var(--color-muted)" }}>
            <p style={{ fontSize: "1.6rem", marginBlockEnd: 8 }} aria-hidden="true">
              ⌕
            </p>
            <p>{appDict.noResults}</p>
            {hasFilters ? (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ marginBlockStart: 14 }}
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
        ) : null}
      </div>

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
              <h2 id="req-dialog-title">
                {appDict.dashboard.requestDetailTitle} · <span dir="ltr">{selected.id}</span>
              </h2>
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
              <dl className="kv-grid">
                <div className="kv">
                  <dt>{cols.customer}</dt>
                  <dd>
                    {pick(selected.customerName, locale)} ·{" "}
                    <span dir="ltr">{selected.customerId}</span>
                  </dd>
                </div>
                <div className="kv">
                  <dt>{cols.phone}</dt>
                  <dd dir="ltr" style={{ textAlign: "end" }}>
                    {selected.phone}
                  </dd>
                </div>
                <div className="kv">
                  <dt>{cols.service}</dt>
                  <dd>{pick(selected.serviceLabel, locale)}</dd>
                </div>
                <div className="kv">
                  <dt>{cols.city}</dt>
                  <dd>{pick(selected.city, locale)}</dd>
                </div>
                <div className="kv">
                  <dt>{cols.date}</dt>
                  <dd>{formatDate(selected.submittedAt, locale)}</dd>
                </div>
                <div className="kv">
                  <dt>{cols.priority}</dt>
                  <dd>{appDict.priority[selected.priority]}</dd>
                </div>
              </dl>
              <p style={{ color: "var(--color-ink)" }}>{pick(selected.description, locale)}</p>
              <div>
                <h3 style={{ fontSize: "0.95rem", marginBlockEnd: 12 }}>
                  {appDict.dashboard.detailLabels.history}
                </h3>
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
              </div>
              {selectedWorkflow ? (
                <section
                  className="request-workflow"
                  aria-labelledby="request-workflow-title"
                  style={{ marginBlockStart: 0, paddingBlockStart: 0, borderBlockStart: 0 }}
                >
                  <h3 id="request-workflow-title" style={{ fontSize: "0.95rem" }}>
                    {appDict.dashboard.operations.workflowTitle}
                  </h3>
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
                </section>
              ) : null}
              {selectedContext ? (
                <>
                  <section aria-labelledby="request-linked-records-title">
                    <h3
                      id="request-linked-records-title"
                      style={{ fontSize: "0.95rem", marginBlockEnd: 8 }}
                    >
                      {appDict.dashboard.linkedRequestRecords}
                    </h3>
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
                  </section>

                  <section aria-labelledby="request-customer-records-title">
                    <h3
                      id="request-customer-records-title"
                      style={{ fontSize: "0.95rem", marginBlockEnd: 8 }}
                    >
                      {appDict.dashboard.sameCustomerRecords}
                    </h3>
                    <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
                      {appDict.dashboard.sameCustomerRecordsNote}
                    </p>
                    {selectedContext.customerProjects.length > 0 ? (
                      <div className="list-rows">
                        {selectedContext.customerProjects.map((project) => (
                          <div className="list-row" key={project.id} style={{ paddingInline: 0 }}>
                            <div className="lr-main">
                              <div className="lr-title">{pick(project.title, locale)}</div>
                              <div className="lr-sub">
                                <span dir="ltr">{project.id}</span> ·{" "}
                                {pick(project.currentMilestone, locale)} ·{" "}
                                {formatDate(project.updatedAt, locale)}
                              </div>
                            </div>
                            <span className={statusBadgeClass(project.status)}>
                              {appDict.status[project.status] ?? project.status}
                            </span>
                            <Link
                              className="btn btn-outline btn-sm"
                              href={dashboardHref(
                                locale,
                                `projects/${encodeURIComponent(project.id)}`,
                              )}
                            >
                              {appDict.dashboard.openProjectWorkspace}
                            </Link>
                          </div>
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
                  </section>
                </>
              ) : null}
              <div className="form-grid">
                <div className="field">
                  <label className="form-label" htmlFor="req-status-select">
                    {appDict.changeStatusPreview}
                  </label>
                  <select
                    id="req-status-select"
                    className="form-select"
                    value={draftStatus}
                    onChange={(e) => updateDraftStatus(e.target.value)}
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
                  </label>
                  <select
                    id="req-assignee-select"
                    className="form-select"
                    value={draftAssignee}
                    onChange={(e) => updateDraftAssignee(e.target.value)}
                    aria-invalid={assigneeError ? true : undefined}
                    aria-describedby={assigneeError ? "req-assignee-error" : undefined}
                  >
                    <option value="">{appDict.dashboard.unassigned}</option>
                    {ASSIGNEES.map((a) => (
                      <option key={a.en} value={a[locale]}>
                        {a[locale]}
                      </option>
                    ))}
                  </select>
                  {assigneeError ? (
                    <p className="field-error" id="req-assignee-error" role="alert">
                      {assigneeError}
                    </p>
                  ) : null}
                </div>
              </div>
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
    </div>
  );
}
