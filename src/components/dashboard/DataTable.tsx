"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import type { PreviewCell, PreviewModuleRow, PreviewModuleTable } from "@/content/preview-modules";
import { dashboardHref, dashboardModules, type DashboardModuleKey } from "@/config/navigation";
import { getLinkedPreviewRecords, type PreviewLinkedRecord } from "@/lib/admin-preview";
import { clampPercent, formatDate, formatMoney, formatNumber, formatPercent } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";
import {
  RecordDetailSection,
  RecordEmptyState,
  RecordListItem,
  RecordMetaList,
  StatusBadge,
} from "@/components/dashboard/RecordUI";

const MOBILE_PRIMARY_COLUMNS = new Set([
  "ref",
  "reference",
  "title",
  "name",
  "customer",
  "project",
  "service",
  "date",
  "dueDate",
  "status",
  "priority",
  "progress",
  "amount",
]);

function cellText(cell: PreviewCell, locale: Locale, appDict: AppDictionary): string {
  switch (cell.kind) {
    case "text":
      return pick(cell.value, locale);
    case "status":
      return appDict.status[cell.value] ?? cell.value;
    case "priority":
      return appDict.priority[cell.value] ?? cell.value;
    case "money":
      return formatMoney(cell.value, locale);
    case "date":
      return formatDate(cell.value, locale);
    case "progress":
      return formatPercent(cell.value, locale);
    case "plain":
      return cell.value;
  }
}

function CellView({
  cell,
  locale,
  appDict,
}: {
  cell: PreviewCell;
  locale: Locale;
  appDict: AppDictionary;
}) {
  if (cell.kind === "status") {
    return (
      <span className={statusBadgeClass(cell.value)}>
        {appDict.status[cell.value] ?? cell.value}
      </span>
    );
  }
  if (cell.kind === "priority") {
    const cls =
      cell.value === "urgent"
        ? "badge badge-urgent"
        : cell.value === "high"
          ? "badge badge-progress"
          : "badge badge-neutral";
    return <span className={cls}>{appDict.priority[cell.value] ?? cell.value}</span>;
  }
  if (cell.kind === "progress") {
    const value = clampPercent(cell.value);
    const label = `${appDict.dashboard.cols.progress}: ${formatPercent(value, locale)}`;
    return (
      <span className="progress-row">
        <span
          className="progress"
          role="progressbar"
          aria-label={label}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span style={{ width: `${value}%` }} />
        </span>
        <span style={{ fontWeight: 600 }}>{formatPercent(value, locale)}</span>
      </span>
    );
  }
  if (cell.kind === "plain" && /^PV-/.test(cell.value)) {
    return (
      <span dir="ltr" style={{ fontWeight: 600 }}>
        {cell.value}
      </span>
    );
  }
  return <>{cellText(cell, locale, appDict)}</>;
}

function rowBusinessReference(row: PreviewModuleRow): string {
  const reference = row.cells.ref;
  return reference?.kind === "plain" ? reference.value : row.id;
}

function linkedRecordHref(locale: Locale, record: PreviewLinkedRecord): string {
  if (record.kind === "project") {
    return dashboardHref(locale, `projects/${encodeURIComponent(record.id)}`);
  }
  const segment = dashboardModules.find((module) => module.key === record.module)?.segment ?? "";
  return dashboardHref(locale, segment);
}

function linkedRecordTitle(
  title: PreviewLinkedRecord["title"],
  locale: Locale,
): string | undefined {
  if (!title) return undefined;
  return typeof title === "string" ? title : pick(title as LocalizedText, locale);
}

export function DataTable({
  locale,
  appDict,
  table,
  moduleKey,
  previewLimit,
}: {
  locale: Locale;
  appDict: AppDictionary;
  table: PreviewModuleTable;
  moduleKey: DashboardModuleKey;
  previewLimit?: string;
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedRow, setSelectedRow] = useState<PreviewModuleRow | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const cols = appDict.dashboard.cols as Record<string, string>;
  const linkedRecords = useMemo(
    () => (selectedRow ? getLinkedPreviewRecords(selectedRow.links) : []),
    [selectedRow],
  );

  const statuses = useMemo(() => {
    const set = new Set<string>();
    for (const row of table.rows) {
      for (const cell of Object.values(row.cells)) {
        if (cell.kind === "status") set.add(cell.value);
      }
    }
    return [...set];
  }, [table]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return table.rows.filter((row) => {
      if (statusFilter) {
        const has = Object.values(row.cells).some(
          (c) => c.kind === "status" && c.value === statusFilter,
        );
        if (!has) return false;
      }
      if (!q) return true;
      const searchableLinks = Object.values(row.links ?? {})
        .filter(Boolean)
        .join(" ");
      return (
        row.id.toLowerCase().includes(q) ||
        searchableLinks.toLowerCase().includes(q) ||
        Object.values(row.cells).some(
          (c) =>
            cellText(c, locale, appDict).toLowerCase().includes(q) ||
            (c.kind === "plain" && c.value.toLowerCase().includes(q)),
        )
      );
    });
  }, [table, query, statusFilter, locale, appDict]);

  const hasFilters = query !== "" || statusFilter !== "";

  function clearFilters() {
    setQuery("");
    setStatusFilter("");
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="toolbar" style={{ flex: 1 }}>
          <div className="search-box">
            <span className="search-icon" aria-hidden="true">
              ⌕
            </span>
            <label className="sr-only" htmlFor="dt-search">
              {appDict.searchShort}
            </label>
            <input
              id="dt-search"
              className="form-input"
              type="search"
              placeholder={appDict.search}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          {statuses.length > 0 ? (
            <div className="filter-field">
              <label className="filter-label" htmlFor="dt-status">
                {appDict.dashboard.cols.status}
              </label>
              <select
                id="dt-status"
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">{appDict.allStatuses}</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {appDict.status[s] ?? s}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          {hasFilters ? (
            <button type="button" className="btn btn-ghost btn-sm" onClick={clearFilters}>
              {appDict.clearFilters}
            </button>
          ) : null}
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={() => setAddDialogOpen(true)}
          aria-haspopup="dialog"
        >
          <span aria-hidden="true">+</span> {appDict.addNew}
        </button>
      </div>
      <p
        style={{ padding: "12px 20px 0", color: "var(--color-muted)", fontSize: "0.88rem" }}
        aria-live="polite"
      >
        {formatNumber(filtered.length, locale)} {appDict.showingResults}
      </p>
      <div className="table-wrap">
        <table className="data data-card-table">
          <caption className="sr-only">{appDict.dashboard.modules[moduleKey]}</caption>
          <thead>
            <tr>
              {table.columns.map((col) => (
                <th key={col.id} scope="col">
                  {cols[col.labelKey] ?? col.labelKey}
                </th>
              ))}
              <th scope="col">{appDict.actions}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                {table.columns.map((col) => {
                  const cell = row.cells[col.id];
                  return (
                    <td
                      key={col.id}
                      data-label={cols[col.labelKey] ?? col.labelKey}
                      data-column={col.id}
                      data-mobile-priority={
                        MOBILE_PRIMARY_COLUMNS.has(col.id) ? "primary" : "secondary"
                      }
                    >
                      {cell ? <CellView cell={cell} locale={locale} appDict={appDict} /> : "—"}
                    </td>
                  );
                })}
                <td data-label={appDict.actions} data-wide="true" data-mobile-priority="primary">
                  <span style={{ display: "inline-flex", gap: 8, flexWrap: "wrap" }}>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={() => setSelectedRow(row)}
                      aria-haspopup="dialog"
                      aria-label={`${appDict.view}: ${rowBusinessReference(row)}`}
                    >
                      {appDict.view}
                    </button>
                    {row.links?.projectId ? (
                      <Link
                        className="btn btn-outline btn-sm"
                        href={dashboardHref(
                          locale,
                          `projects/${encodeURIComponent(row.links.projectId)}`,
                        )}
                        aria-label={`${appDict.dashboard.openProjectWorkspace}: ${row.links.projectId}`}
                      >
                        {appDict.dashboard.openProjectWorkspace}
                      </Link>
                    ) : null}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <div className="requests-empty-wrap" style={{ paddingBlockStart: 16 }}>
            <RecordEmptyState
              action={
                table.rows.length > 0 ? (
                  <button type="button" className="btn btn-outline btn-sm" onClick={clearFilters}>
                    {appDict.clearFilters}
                  </button>
                ) : undefined
              }
            >
              {table.rows.length === 0 ? appDict.dashboard.genericEmpty : appDict.noResults}
            </RecordEmptyState>
          </div>
        ) : null}
      </div>
      <InfoDialog
        open={Boolean(selectedRow)}
        title={appDict.recordDetails}
        closeLabel={appDict.close}
        onClose={() => setSelectedRow(null)}
      >
        {selectedRow ? (
          <div className="record-detail-stack">
            <RecordDetailSection
              title={appDict.dashboard.recordSections.overview}
              labelledBy="selected-record-overview-title"
            >
              <RecordMetaList
                variant="detail"
                items={[
                  {
                    label: appDict.recordId,
                    value: rowBusinessReference(selectedRow),
                    dir: "ltr",
                  },
                  ...table.columns
                    .filter((col) => col.id !== "ref")
                    .map((col) => {
                      const cell = selectedRow.cells[col.id];
                      return {
                        label: cols[col.labelKey] ?? col.labelKey,
                        value: cell ? (
                          <CellView cell={cell} locale={locale} appDict={appDict} />
                        ) : (
                          "—"
                        ),
                        wide: ["title", "customer", "project"].includes(col.id),
                      };
                    }),
                ]}
              />
            </RecordDetailSection>

            <RecordDetailSection
              title={appDict.dashboard.linkedRecords}
              description={appDict.dashboard.linkedRecordsNote}
              labelledBy="selected-record-links-title"
            >
              {linkedRecords.length > 0 ? (
                <div className="record-list">
                  {linkedRecords.map((record) => {
                    const title = linkedRecordTitle(record.title, locale);
                    return (
                      <RecordListItem
                        key={`${record.kind}-${record.id}`}
                        title={title ?? appDict.dashboard.linkedKinds[record.kind]}
                        reference={
                          <>
                            {appDict.dashboard.linkedKinds[record.kind]} ·{" "}
                            <span dir="ltr">{record.id}</span>
                          </>
                        }
                        badges={<StatusBadge appDict={appDict} status={record.status} />}
                        actions={
                          <Link
                            className="btn btn-ghost btn-sm"
                            href={linkedRecordHref(locale, record)}
                            aria-label={`${appDict.view}: ${record.id}`}
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
              ) : (
                <p>{appDict.dashboard.noLinkedRecords}</p>
              )}
            </RecordDetailSection>

            {previewLimit ? (
              <RecordDetailSection
                title={appDict.previewUnavailableTitle}
                labelledBy="selected-record-limit-title"
              >
                <p>{previewLimit}</p>
              </RecordDetailSection>
            ) : null}
          </div>
        ) : null}
      </InfoDialog>
      <InfoDialog
        open={addDialogOpen}
        title={appDict.previewUnavailableTitle}
        closeLabel={appDict.close}
        onClose={() => setAddDialogOpen(false)}
      >
        <p>{previewLimit ?? appDict.previewUnavailableText}</p>
      </InfoDialog>
    </div>
  );
}
