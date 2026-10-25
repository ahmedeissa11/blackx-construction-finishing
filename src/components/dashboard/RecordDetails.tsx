"use client";

import type { ReactNode } from "react";
import type { Locale, LocalizedText } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import {
  getChangeOrderDetail,
  getHandoverDetail,
  getPreviewPhase,
  getWarrantyDetail,
  groupDocumentCatalog,
  type PreviewDocumentCatalogItem,
  getChangeOrdersForContract,
  getContractDetail,
  getInspectionDetail,
  getPreviewEngineer,
  getQuotationDetail,
} from "@/lib/preview-expansion";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { RecordMetaList, StatusBadge, type RecordMetaItem } from "@/components/dashboard/RecordUI";

type BlockProps = { locale: Locale; appDict: AppDictionary };

function meta(
  label: string,
  value: ReactNode,
  options?: Pick<RecordMetaItem, "wide" | "dir">,
): RecordMetaItem {
  return { label, value, ...options };
}

function DetailGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="wf-detail-group">
      <h4>{title}</h4>
      {children}
    </div>
  );
}

export function EvidenceChips({
  locale,
  items,
}: {
  locale: Locale;
  items: Array<{ label: LocalizedText; kind: string }>;
}) {
  if (items.length === 0) return null;
  return (
    <div className="record-relationship-links">
      {items.map((item) => (
        <span key={pick(item.label, locale)} className="record-chip-link">
          {pick(item.label, locale)} · {item.kind}
        </span>
      ))}
    </div>
  );
}

export function Timeline({
  locale,
  entries,
}: {
  locale: Locale;
  entries: Array<{ at: string; title: ReactNode; by?: string; note?: ReactNode }>;
}) {
  return (
    <ol className="wf-timeline">
      {entries.map((entry, index) => (
        <li key={`${entry.at}-${index}`} className="wf-timeline-item">
          <header>
            <strong>{entry.title}</strong>
            <span>
              {formatDate(entry.at, locale)}
              {entry.by ? ` · ${entry.by}` : ""}
            </span>
          </header>
          {entry.note ? <p>{entry.note}</p> : null}
        </li>
      ))}
    </ol>
  );
}

/* ---------------- Inspection detail ---------------- */

export function InspectionDetailBlock({
  locale,
  appDict,
  reference,
}: BlockProps & { reference?: string }) {
  const detail = getInspectionDetail(reference);
  if (!detail) return null;
  const wf = appDict.dashboard.expansion.workflow;
  const engineer = getPreviewEngineer(detail.engineerId);
  const notRecorded = appDict.dashboard.operations.notRecorded;

  return (
    <div className="wf-detail">
      <RecordMetaList
        variant="detail"
        items={[
          meta(wf.scheduledTime, <span dir="ltr">{detail.timeLabel}</span>),
          meta(
            appDict.dashboard.cols.assignee,
            engineer ? pick(engineer.name, locale) : notRecorded,
          ),
          meta(appDict.dashboard.cols.reference, <span dir="ltr">{detail.requestId}</span>),
          detail.fee
            ? meta(
                wf.inspectionFee,
                <>
                  {formatMoney(detail.fee.amount, locale)} ·{" "}
                  {appDict.status[detail.fee.state] ?? detail.fee.state}
                </>,
              )
            : meta(wf.inspectionFee, wf.feePendingNote, { wide: true }),
        ]}
      />
      <DetailGroup title={wf.inspectionResult}>
        {detail.result ? (
          <>
            <RecordMetaList
              variant="detail"
              items={[
                meta(wf.measuredArea, <span dir="ltr">{detail.result.measuredArea}</span>),
                meta(appDict.recordSummary, pick(detail.result.summary, locale), { wide: true }),
                ...detail.result.conditionNotes.map((note) =>
                  meta(wf.conditionNotes, pick(note, locale), { wide: true }),
                ),
                meta(wf.recommendedScope, pick(detail.result.recommendedScope, locale), {
                  wide: true,
                }),
              ]}
            />
            <EvidenceChips locale={locale} items={detail.evidence} />
          </>
        ) : (
          <p>{wf.noResultYet}</p>
        )}
      </DetailGroup>
      <DetailGroup title={wf.historyTitle}>
        <Timeline
          locale={locale}
          entries={detail.history.map((entry) => ({
            at: entry.at,
            title: wf.events[entry.event] ?? entry.event,
            by: pick(entry.by, locale),
            note: pick(entry.note, locale),
          }))}
        />
      </DetailGroup>
    </div>
  );
}

/* ---------------- Quotation BOQ / revisions / decision ---------------- */

export function QuotationDetailBlock({
  locale,
  appDict,
  reference,
}: BlockProps & { reference?: string }) {
  const found = getQuotationDetail(reference);
  if (!found) return null;
  const { detail, totals } = found;
  const wf = appDict.dashboard.expansion.workflow;
  const cols = appDict.dashboard.cols;

  return (
    <div className="wf-detail">
      <DetailGroup title={wf.boqTitle}>
        <LinesTable
          locale={locale}
          appDict={appDict}
          lines={detail.boqLines}
          footer={[
            { label: wf.grossTotal, value: totals.gross },
            { label: cols.discount, value: totals.discount },
            { label: wf.netTotal, value: totals.net, strong: true },
          ]}
        />
      </DetailGroup>
      <DetailGroup title={wf.scopeTitle}>
        {detail.scopeNotes.map((note) => (
          <p key={pick(note, locale)}>{pick(note, locale)}</p>
        ))}
      </DetailGroup>
      <DetailGroup title={wf.revisionsTitle}>
        <Timeline
          locale={locale}
          entries={detail.revisions.map((revision) => ({
            at: revision.date,
            title: `${wf.versionLabel} ${revision.version} — ${formatMoney(revision.total, locale)}`,
            note: pick(revision.note, locale),
          }))}
        />
      </DetailGroup>
      <DetailGroup title={wf.decisionTitle}>
        {detail.decision ? (
          <RecordMetaList
            variant="detail"
            items={[
              meta(
                wf.decisionTitle,
                <>
                  <StatusBadge appDict={appDict} status={detail.decision.state} />{" "}
                  {detail.decision.state === "pending" ? wf.decisionPending : ""}
                  {detail.decision.at ? ` · ${formatDate(detail.decision.at, locale)}` : ""}
                </>,
                { wide: true },
              ),
              ...(detail.decision.note
                ? [meta(appDict.recordSummary, pick(detail.decision.note, locale), { wide: true })]
                : []),
            ]}
          />
        ) : (
          <p>{wf.decisionNone}</p>
        )}
      </DetailGroup>
    </div>
  );
}

/* ---------------- Contract / change-order detail ---------------- */

export function ContractDetailBlock({
  locale,
  appDict,
  reference,
  kind,
}: BlockProps & { reference?: string; kind: "contract" | "changeOrder" }) {
  const wf = appDict.dashboard.expansion.workflow;

  if (kind === "changeOrder") {
    const changeOrder = getChangeOrderDetail(reference);
    if (!changeOrder) return null;
    return (
      <div className="wf-detail">
        <RecordMetaList
          variant="detail"
          items={[
            meta(appDict.recordSummary, pick(changeOrder.description, locale), { wide: true }),
            meta(appDict.dashboard.cols.amount, formatMoney(changeOrder.amountDelta, locale), {
              dir: "ltr",
            }),
            meta(wf.contractScope, <span dir="ltr">{changeOrder.contractRef}</span>),
            meta(
              wf.changeOrderDecision,
              <>
                <StatusBadge appDict={appDict} status={changeOrder.decision.state} />{" "}
                {changeOrder.decision.state === "pending" ? wf.decisionPending : ""}
              </>,
              { wide: true },
            ),
          ]}
        />
      </div>
    );
  }

  const detail = getContractDetail(reference);
  if (!detail) return null;
  const changeOrders = getChangeOrdersForContract(detail.ref);

  return (
    <div className="wf-detail">
      <RecordMetaList
        variant="detail"
        items={[
          meta(wf.contractScope, pick(detail.scopeSummary, locale), { wide: true }),
          meta(wf.startBasis, pick(detail.startBasis, locale), { wide: true }),
          ...(detail.quotationRef
            ? [meta(wf.quotationRefLabel, <span dir="ltr">{detail.quotationRef}</span>)]
            : []),
        ]}
      />
      <DetailGroup title={wf.approvedDocuments}>
        <EvidenceChips locale={locale} items={detail.documents} />
      </DetailGroup>
      <DetailGroup title={wf.linkedChangeOrders}>
        {changeOrders.length === 0 ? (
          <p>{wf.noChangeOrders}</p>
        ) : (
          <RecordMetaList
            variant="detail"
            items={changeOrders.map((order) =>
              meta(
                order.ref,
                <>
                  {pick(order.description, locale)} · {formatMoney(order.amountDelta, locale)} ·{" "}
                  {appDict.status[order.decision.state] ?? order.decision.state}
                </>,
                { wide: true },
              ),
            )}
          />
        )}
      </DetailGroup>
    </div>
  );
}

/* ---------------- Line-items table (BOQ / purchase lines) ---------------- */

export type LinesTableLine = {
  label: LocalizedText;
  quantity: number;
  unit: LocalizedText;
  unitPrice: number;
};

export function LinesTable({
  locale,
  appDict,
  lines,
  footer,
}: BlockProps & {
  lines: LinesTableLine[];
  footer?: Array<{ label: string; value: number; strong?: boolean }>;
}) {
  const cols = appDict.dashboard.cols;
  return (
    <div className="wf-table-wrap">
      <table className="wf-table">
        <thead>
          <tr>
            <th>{cols.title}</th>
            <th className="num">{cols.quantity}</th>
            <th>{cols.unit}</th>
            <th className="num">{cols.unitPrice}</th>
            <th className="num">{cols.total}</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={pick(line.label, locale)}>
              <td>{pick(line.label, locale)}</td>
              <td className="num">{formatNumber(line.quantity, locale)}</td>
              <td>{pick(line.unit, locale)}</td>
              <td className="num">{formatMoney(line.unitPrice, locale)}</td>
              <td className="num">{formatMoney(line.quantity * line.unitPrice, locale)}</td>
            </tr>
          ))}
        </tbody>
        {footer && footer.length > 0 ? (
          <tfoot>
            {footer.map((row) => (
              <tr key={row.label} className={row.strong ? "wf-total-net" : undefined}>
                <td colSpan={4}>{row.label}</td>
                <td className="num">{formatMoney(row.value, locale)}</td>
              </tr>
            ))}
          </tfoot>
        ) : null}
      </table>
    </div>
  );
}

/* ---------------- Handover & warranty details ---------------- */

export function HandoverDetailBlock({
  locale,
  appDict,
  reference,
}: BlockProps & { reference?: string }) {
  const detail = getHandoverDetail(reference);
  if (!detail) return null;
  const life = appDict.dashboard.expansion.lifecycle;

  return (
    <div className="wf-detail">
      <RecordMetaList
        variant="detail"
        items={[
          meta(life.plannedDate, formatDate(detail.plannedDate, locale)),
          detail.actualDate
            ? meta(life.actualDate, formatDate(detail.actualDate, locale))
            : meta(life.actualDate, life.notHandedOverYet),
          meta(life.snagsTitle, pick(detail.snagsNote, locale), { wide: true }),
        ]}
      />
      <DetailGroup title={life.checklistTitle}>
        <ul className="wf-checklist">
          {detail.checklist.map((item) => (
            <li key={pick(item.label, locale)} data-state={item.state}>
              <span className="wf-check-icon" aria-hidden="true">
                {item.state === "done" ? "✓" : "•"}
              </span>
              <span className="wf-check-label">{pick(item.label, locale)}</span>
              <span className="wf-check-state">
                {item.state === "done" ? life.checklistDone : life.checklistPending}
              </span>
            </li>
          ))}
        </ul>
      </DetailGroup>
      <DetailGroup title={life.notesTitle}>
        {detail.notes.map((note) => (
          <p key={pick(note, locale)}>{pick(note, locale)}</p>
        ))}
      </DetailGroup>
      <DetailGroup title={life.documentsTitle}>
        {detail.documents.length > 0 ? (
          <EvidenceChips locale={locale} items={detail.documents} />
        ) : (
          <p>{life.noDocumentsYet}</p>
        )}
      </DetailGroup>
      <p className="domain-context-note">
        {appDict.dashboard.operations.domain.downloadDocumentUnavailable}
      </p>
    </div>
  );
}

export function WarrantyDetailBlock({
  locale,
  appDict,
  reference,
}: BlockProps & { reference?: string }) {
  const detail = getWarrantyDetail(reference);
  if (!detail) return null;
  const life = appDict.dashboard.expansion.lifecycle;
  const engineer = getPreviewEngineer(detail.engineerId);
  const phase = getPreviewPhase(detail.phaseId ?? undefined);
  const notRecorded = appDict.dashboard.operations.notRecorded;

  return (
    <div className="wf-detail">
      <RecordMetaList
        variant="detail"
        items={[
          meta(life.warrantySource, life.warrantySources[detail.source] ?? detail.source),
          meta(
            appDict.dashboard.cols.assignee,
            engineer ? pick(engineer.name, locale) : notRecorded,
          ),
          meta(life.openedAt, formatDate(detail.openedAt, locale)),
          ...(detail.nextVisit ? [meta(life.nextVisit, formatDate(detail.nextVisit, locale))] : []),
          ...(phase
            ? [
                meta(
                  appDict.dashboard.modules.milestones,
                  `${appDict.dashboard.expansion.phaseTypes[phase.type] ?? phase.type} — ${pick(phase.title, locale)}`,
                  { wide: true as const },
                ),
              ]
            : []),
          meta(life.customerSummary, pick(detail.customerSummary, locale), { wide: true }),
        ]}
      />
      <DetailGroup title={life.visitsTitle}>
        <Timeline
          locale={locale}
          entries={detail.visits.map((visit) => {
            const visitEngineer = getPreviewEngineer(visit.engineerId);
            return {
              at: visit.date,
              title: visitEngineer ? pick(visitEngineer.name, locale) : life.visitsTitle,
              note: (
                <>
                  {life.findings}: {pick(visit.findings, locale)}
                  <br />
                  {life.actionTaken}: {pick(visit.actionTaken, locale)}
                </>
              ),
            };
          })}
        />
        {detail.visits.map((visit) =>
          visit.evidence.length > 0 ? (
            <div key={visit.date} className="wf-evidence-row">
              <span>{formatDate(visit.date, locale)}:</span>
              <EvidenceChips locale={locale} items={visit.evidence} />
            </div>
          ) : null,
        )}
      </DetailGroup>
      {detail.internalNotes.length > 0 ? (
        <DetailGroup title={life.internalNotesTitle}>
          <Timeline
            locale={locale}
            entries={detail.internalNotes.map((note) => ({
              at: note.date,
              title: pick(note.by, locale),
              note: pick(note.text, locale),
            }))}
          />
          <p>{life.staffOnlyNote}</p>
        </DetailGroup>
      ) : null}
      <p className="domain-context-note">{life.policyNote}</p>
      <p className="domain-context-note">{life.separationNote}</p>
    </div>
  );
}

/* ---------------- Document catalog groups ---------------- */

export function DocumentCatalogGroups({
  locale,
  appDict,
  items,
  showAmount = true,
}: BlockProps & { items: PreviewDocumentCatalogItem[]; showAmount?: boolean }) {
  const x = appDict.dashboard.expansion;
  const cols = appDict.dashboard.cols;
  const groups = groupDocumentCatalog(items);
  if (groups.length === 0) {
    return <p>{x.documentsWorkspace.emptyGroup}</p>;
  }
  return (
    <div className="wf-detail">
      {groups.map((group) => (
        <DetailGroup
          key={group.category}
          title={`${x.documentCategories[group.category] ?? group.category} · ${formatNumber(group.items.length, locale)} ${x.documentsWorkspace.groupCountSuffix}`}
        >
          <RecordMetaList
            variant="detail"
            items={group.items.map((item) =>
              meta(
                pick(item.title, locale),
                <>
                  <span dir="ltr">{item.reference}</span>
                  {item.projectId ? (
                    <>
                      {" · "}
                      {cols.project} <span dir="ltr">{item.projectId}</span>
                    </>
                  ) : null}
                  {item.updatedAt ? ` · ${formatDate(item.updatedAt, locale)}` : ""}
                  {item.format ? ` · ${item.format}` : ""}
                  {showAmount && item.amount !== undefined
                    ? ` · ${formatMoney(item.amount, locale)}`
                    : ""}
                  {item.status ? ` · ${appDict.status[item.status] ?? item.status}` : ""}
                </>,
                { wide: true },
              ),
            )}
          />
        </DetailGroup>
      ))}
    </div>
  );
}
