"use client";

import { useMemo, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import { previewPortalClient, previewSnapshotDate } from "@/content/preview-data";
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
type ReportFormErrors = Partial<Record<"amount" | "date" | "method" | "reference", string>>;

const PORTAL_PAYMENT_METHODS = ["cash", "instapay", "fawry", "bank_transfer"] as const;

export function PortalFinancePanel({ locale, appDict }: PanelProps) {
  const [docTab, setDocTab] = useState<"invoices" | "certificates" | "receipts">("invoices");
  const [reportMethod, setReportMethod] = useState("");
  const [reportAmount, setReportAmount] = useState("");
  const [reportDate, setReportDate] = useState(previewSnapshotDate);
  const [reportReference, setReportReference] = useState("");
  const [reportErrors, setReportErrors] = useState<ReportFormErrors>({});
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const f = appDict.portal.finance;
  const v = appDict.validation;
  const cols = appDict.dashboard.cols;
  const paymentMethods = appDict.dashboard.expansion.paymentMethods;
  const finance = useMemo(() => getPortalFinance(previewPortalClient.id), []);

  function onReportSubmit(event: React.FormEvent) {
    event.preventDefault();
    const errors: ReportFormErrors = {};
    const amount = Number(reportAmount);
    if (!reportMethod) errors.method = v.required;
    if (!reportAmount.trim() || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = v.amountInvalid;
    } else if (amount > finance.remaining) {
      errors.amount = v.amountExceedsRemaining;
    }
    if (!reportDate || Number.isNaN(Date.parse(reportDate)) || reportDate > previewSnapshotDate) {
      errors.date = v.dateInvalid;
    }
    if (reportMethod && reportMethod !== "cash" && reportReference.trim().length < 4) {
      errors.reference = v.referenceRequired;
    }
    setReportErrors(errors);
    if (Object.keys(errors).length > 0) return;
    // Same honesty rule as portal complaints: portal submission is not
    // enabled by the current architecture, so nothing is sent or saved
    // and the balance never changes from a customer-side report.
    setReportDialogOpen(true);
  }

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

        <section aria-label={f.paymentsTitle}>
          <h3>{f.paymentsTitle}</h3>
          {finance.payments.length === 0 ? (
            <p>{f.noPayments}</p>
          ) : (
            <div className="list-rows">
              {finance.payments.map((payment) => (
                <div className="list-row" key={payment.id}>
                  <div className="lr-main">
                    <div className="lr-title">
                      <span dir="ltr">{formatMoney(payment.amount, locale)}</span>
                    </div>
                    <div className="lr-sub">
                      <span dir="ltr">{payment.id}</span> · {formatDate(payment.paidAt, locale)} ·{" "}
                      {paymentMethods[payment.method] ?? payment.method}
                    </div>
                  </div>
                  <span className={statusBadgeClass("confirmed")}>{appDict.status.confirmed}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section aria-label={f.methodsTitle}>
          <h3>{f.methodsTitle}</h3>
          <p style={{ color: "var(--color-muted)", maxWidth: 900 }}>{f.methodsIntro}</p>
          <div className="payment-method-grid">
            {PORTAL_PAYMENT_METHODS.map((method) => (
              <div className="payment-method-card" key={method}>
                <strong>{paymentMethods[method] ?? method}</strong>
                <p>{f.methodGuides[method]}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label={f.reportTitle}>
          <h3>{f.reportTitle}</h3>
          <p style={{ color: "var(--color-muted)", maxWidth: 900 }}>{f.reportNote}</p>
          <form
            className="payment-record-form portal-report-form"
            onSubmit={onReportSubmit}
            noValidate
          >
            <div className="payment-record-grid">
              <div className="filter-field">
                <label className="filter-label" htmlFor="portal-report-method">
                  {appDict.dashboard.expansion.finance.recordForm.methodLabel}
                </label>
                <select
                  id="portal-report-method"
                  className="form-select"
                  value={reportMethod}
                  onChange={(event) => setReportMethod(event.target.value)}
                >
                  <option value="">
                    {appDict.dashboard.expansion.finance.recordForm.selectMethod}
                  </option>
                  {PORTAL_PAYMENT_METHODS.map((method) => (
                    <option key={method} value={method}>
                      {paymentMethods[method] ?? method}
                    </option>
                  ))}
                </select>
                {reportErrors.method ? (
                  <p className="form-error" role="alert">
                    {reportErrors.method}
                  </p>
                ) : null}
              </div>
              <div className="filter-field">
                <label className="filter-label" htmlFor="portal-report-amount">
                  {cols.amount}
                </label>
                <input
                  id="portal-report-amount"
                  className="form-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="any"
                  dir="ltr"
                  value={reportAmount}
                  onChange={(event) => setReportAmount(event.target.value)}
                />
                {reportErrors.amount ? (
                  <p className="form-error" role="alert">
                    {reportErrors.amount}
                  </p>
                ) : null}
              </div>
              <div className="filter-field">
                <label className="filter-label" htmlFor="portal-report-date">
                  {cols.date}
                </label>
                <input
                  id="portal-report-date"
                  className="form-input"
                  type="date"
                  dir="ltr"
                  max={previewSnapshotDate}
                  value={reportDate}
                  onChange={(event) => setReportDate(event.target.value)}
                />
                {reportErrors.date ? (
                  <p className="form-error" role="alert">
                    {reportErrors.date}
                  </p>
                ) : null}
              </div>
              <div className="filter-field">
                <label className="filter-label" htmlFor="portal-report-reference">
                  {appDict.dashboard.expansion.finance.recordForm.referenceLabel}
                </label>
                <input
                  id="portal-report-reference"
                  className="form-input"
                  type="text"
                  dir="ltr"
                  value={reportReference}
                  onChange={(event) => setReportReference(event.target.value)}
                />
                {reportErrors.reference ? (
                  <p className="form-error" role="alert">
                    {reportErrors.reference}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="payment-record-actions">
              <button type="submit" className="btn btn-primary btn-sm">
                {f.reportSubmit}
              </button>
            </div>
          </form>
          <InfoDialog
            open={reportDialogOpen}
            onClose={() => setReportDialogOpen(false)}
            title={f.reportTitle}
            closeLabel={appDict.close}
          >
            <p>{f.reportUnavailable}</p>
          </InfoDialog>
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
