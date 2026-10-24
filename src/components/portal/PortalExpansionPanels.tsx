"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import { previewPortalClient } from "@/content/preview-data";
import { getPortalComplaints, getPortalFinance } from "@/lib/preview-expansion";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { InfoDialog } from "@/components/ui/ConfirmDialog";
import { UnavailableActionButton } from "@/components/portal/PortalPanels";

type PanelProps = { locale: Locale; appDict: AppDictionary };

/**
 * Portal finance for the signed-in preview customer only: their dues
 * schedule and settlements, issued invoices, work certificates for
 * their own projects, and receipts for their payments. Internal
 * expenses, supplier purchases and every other customer's records are
 * excluded by the derivation layer.
 */
export function PortalFinancePanel({ locale, appDict }: PanelProps) {
  const [docTab, setDocTab] = useState<"invoices" | "certificates" | "receipts">("invoices");
  const f = appDict.portal.finance;
  const finance = useMemo(() => getPortalFinance(previewPortalClient.id), []);

  const docTabs = [
    { key: "invoices" as const, label: f.invoices },
    { key: "certificates" as const, label: f.certificates },
    { key: "receipts" as const, label: f.receipts },
  ];

  return (
    <div className="panel portal-panel">
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ color: "var(--color-muted)", maxWidth: 900 }}>{f.intro}</p>
        <div className="domain-stats" role="list" aria-label={f.title}>
          <div className="domain-stat" role="listitem">
            <span>{f.totalDues}</span>
            <strong dir="ltr">{formatMoney(finance.duesTotal, locale)}</strong>
          </div>
          <div className="domain-stat" role="listitem">
            <span>{f.totalPaid}</span>
            <strong dir="ltr">{formatMoney(finance.collected, locale)}</strong>
          </div>
          <div className="domain-stat" role="listitem">
            <span>{f.totalRemaining}</span>
            <strong dir="ltr">{formatMoney(finance.remaining, locale)}</strong>
          </div>
        </div>

        <section aria-label={f.duesTitle}>
          <h3>{f.duesTitle}</h3>
          {finance.dues.length === 0 ? (
            <p>{f.noDues}</p>
          ) : (
            <div className="list-rows">
              {finance.dues.map((item) => (
                <div className="list-row" key={item.due.id}>
                  <div className="lr-main">
                    <div className="lr-title">{pick(item.due.label, locale)}</div>
                    <div className="lr-sub">
                      <span dir="ltr">{item.due.id}</span> · {formatDate(item.due.dueDate, locale)}{" "}
                      · <span dir="ltr">{formatMoney(item.due.amount, locale)}</span>
                    </div>
                  </div>
                  <span className={statusBadgeClass(item.status)}>
                    {appDict.status[item.status]}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label={f.invoices}>
          <div className="expansion-tabs" role="tablist" aria-label={f.title}>
            {docTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={docTab === tab.key}
                className={`expansion-tab${docTab === tab.key ? " is-active" : ""}`}
                onClick={() => setDocTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {docTab === "invoices" ? (
            finance.invoices.length === 0 ? (
              <p>{f.noDocuments}</p>
            ) : (
              <div className="list-rows">
                {finance.invoices.map((invoice) => (
                  <div className="list-row" key={invoice.id}>
                    <div className="lr-main">
                      <div className="lr-title">{pick(invoice.label, locale)}</div>
                      <div className="lr-sub">
                        <span dir="ltr">{invoice.id}</span> · {formatDate(invoice.issuedAt, locale)}{" "}
                        · <span dir="ltr">{formatMoney(invoice.amount, locale)}</span>
                      </div>
                    </div>
                    <UnavailableActionButton
                      locale={locale}
                      appDict={appDict}
                      label={appDict.portal.downloadPreview}
                    />
                  </div>
                ))}
              </div>
            )
          ) : docTab === "certificates" ? (
            finance.certificates.length === 0 ? (
              <p>{f.noDocuments}</p>
            ) : (
              <div className="list-rows">
                {finance.certificates.map((certificate) => (
                  <div className="list-row" key={certificate.id}>
                    <div className="lr-main">
                      <div className="lr-title">{pick(certificate.label, locale)}</div>
                      <div className="lr-sub">
                        <span dir="ltr">{certificate.id}</span> ·{" "}
                        {formatPercent(certificate.completionPercent, locale)} ·{" "}
                        <span dir="ltr">{formatMoney(certificate.amount, locale)}</span>
                      </div>
                    </div>
                    <UnavailableActionButton
                      locale={locale}
                      appDict={appDict}
                      label={appDict.portal.downloadPreview}
                    />
                  </div>
                ))}
              </div>
            )
          ) : finance.receipts.length === 0 ? (
            <p>{f.noDocuments}</p>
          ) : (
            <div className="list-rows">
              {finance.receipts.map(({ receipt, payment }) => (
                <div className="list-row" key={receipt.id}>
                  <div className="lr-main">
                    <div className="lr-title">
                      {payment ? (
                        <span dir="ltr">{formatMoney(payment.amount, locale)}</span>
                      ) : (
                        receipt.id
                      )}
                    </div>
                    <div className="lr-sub">
                      <span dir="ltr">{receipt.id}</span> · {formatDate(receipt.issuedAt, locale)}
                    </div>
                  </div>
                  <UnavailableActionButton
                    locale={locale}
                    appDict={appDict}
                    label={appDict.portal.downloadPreview}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

type ComplaintFormErrors = { subject?: string; details?: string };

/**
 * Own complaints and suggestions with company replies addressed to the
 * customer only (internal notes are stripped by the derivation). The
 * submission form validates locally and then explains honestly that
 * portal submission is not enabled yet — nothing is saved or sent.
 */
export function PortalComplaintsPanel({ locale, appDict }: PanelProps) {
  const c = appDict.portal.complaints;
  const v = appDict.validation;
  const complaints = useMemo(() => getPortalComplaints(previewPortalClient.id), []);
  const [kind, setKind] = useState<"complaint" | "suggestion">("complaint");
  const [category, setCategory] = useState("quality");
  const [subject, setSubject] = useState("");
  const [details, setDetails] = useState("");
  const [errors, setErrors] = useState<ComplaintFormErrors>({});
  const [dialogOpen, setDialogOpen] = useState(false);

  const categoryOptions = [
    { value: "quality", label: c.categoryQuality },
    { value: "schedule", label: c.categorySchedule },
    { value: "communication", label: c.categoryCommunication },
    { value: "finance", label: c.categoryFinance },
    { value: "other", label: c.categoryOther },
  ];

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors: ComplaintFormErrors = {};
    const cleanSubject = subject.trim();
    const cleanDetails = details.trim();
    if (!cleanSubject) nextErrors.subject = v.required;
    else if (cleanSubject.length < 4) nextErrors.subject = v.issueTitleShort;
    if (!cleanDetails) nextErrors.details = v.required;
    else if (cleanDetails.length < 10) nextErrors.details = v.issueDetailsShort;
    setErrors(nextErrors);
    if (nextErrors.subject || nextErrors.details) {
      document.getElementById(nextErrors.subject ? "cmp-subject" : "cmp-details")?.focus();
      return;
    }
    setDialogOpen(true);
  }

  return (
    <div className="panel portal-panel">
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <p style={{ color: "var(--color-muted)", maxWidth: 900 }}>{c.intro}</p>

        <section aria-label={c.title}>
          {complaints.length === 0 ? (
            <p>{c.noComplaints}</p>
          ) : (
            <div className="record-list">
              {complaints.map((complaint) => (
                <article key={complaint.id} className="portal-complaint-item">
                  <header
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      flexWrap: "wrap",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <h3 style={{ margin: 0 }}>{pick(complaint.title, locale)}</h3>
                      <p style={{ color: "var(--color-muted)", margin: 0 }}>
                        {complaint.kind === "complaint" ? c.kindComplaint : c.kindSuggestion} ·{" "}
                        {pick(complaint.category, locale)} ·{" "}
                        {formatDate(complaint.createdAt, locale)} · {c.trackingRef}:{" "}
                        <span dir="ltr">{complaint.id}</span>
                      </p>
                    </div>
                    <span className={statusBadgeClass(complaint.status)}>
                      {appDict.status[complaint.status]}
                    </span>
                  </header>
                  <p>{pick(complaint.detail, locale)}</p>
                  <section
                    className="reply-block reply-block--customer"
                    aria-label={c.repliesTitle}
                  >
                    <h4>{c.repliesTitle}</h4>
                    {complaint.replies.length === 0 ? (
                      <p>{c.noRepliesYet}</p>
                    ) : (
                      complaint.replies.map((reply) => (
                        <article key={reply.id} className="reply-item">
                          <header>
                            <strong>{pick(reply.author, locale)}</strong>{" "}
                            <span>{formatDate(reply.at, locale)}</span>
                          </header>
                          <p>{pick(reply.text, locale)}</p>
                        </article>
                      ))
                    )}
                  </section>
                  {complaint.resolutionSummary ? (
                    <p>
                      <strong>{appDict.status.resolved}: </strong>
                      {pick(complaint.resolutionSummary, locale)}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section aria-label={c.newTitle}>
          <h3>{c.newTitle}</h3>
          <form onSubmit={onSubmit} noValidate>
            <div className="form-grid">
              <div className="field">
                <label className="form-label" htmlFor="cmp-kind">
                  {c.kind}
                </label>
                <select
                  id="cmp-kind"
                  className="form-select"
                  value={kind}
                  onChange={(event) => setKind(event.target.value as "complaint" | "suggestion")}
                >
                  <option value="complaint">{c.kindComplaint}</option>
                  <option value="suggestion">{c.kindSuggestion}</option>
                </select>
              </div>
              <div className="field">
                <label className="form-label" htmlFor="cmp-category">
                  {c.category}
                </label>
                <select
                  id="cmp-category"
                  className="form-select"
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  {categoryOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field full">
                <label className="form-label" htmlFor="cmp-subject">
                  {c.subject}
                  <span className="form-field-note form-field-note-required">
                    {appDict.requiredField}
                  </span>
                </label>
                <input
                  id="cmp-subject"
                  className="form-input"
                  type="text"
                  value={subject}
                  onChange={(event) => {
                    setSubject(event.target.value);
                    setErrors((prev) => ({ ...prev, subject: undefined }));
                  }}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={errors.subject ? "cmp-subject-err" : undefined}
                />
                {errors.subject ? (
                  <p className="field-error" id="cmp-subject-err" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.subject}
                  </p>
                ) : null}
              </div>
              <div className="field full">
                <label className="form-label" htmlFor="cmp-details">
                  {c.details}
                  <span className="form-field-note form-field-note-required">
                    {appDict.requiredField}
                  </span>
                </label>
                <textarea
                  id="cmp-details"
                  className="form-input"
                  rows={4}
                  value={details}
                  onChange={(event) => {
                    setDetails(event.target.value);
                    setErrors((prev) => ({ ...prev, details: undefined }));
                  }}
                  aria-invalid={Boolean(errors.details)}
                  aria-describedby={errors.details ? "cmp-details-err" : undefined}
                />
                {errors.details ? (
                  <p className="field-error" id="cmp-details-err" role="alert">
                    <span aria-hidden="true">⚠</span> {errors.details}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn btn-primary">
                {c.submit}
              </button>
            </div>
          </form>
        </section>
      </div>
      <InfoDialog
        open={dialogOpen}
        title={appDict.previewUnavailableTitle}
        closeLabel={appDict.close}
        onClose={() => setDialogOpen(false)}
      >
        <p>{c.submitUnavailable}</p>
      </InfoDialog>
    </div>
  );
}
