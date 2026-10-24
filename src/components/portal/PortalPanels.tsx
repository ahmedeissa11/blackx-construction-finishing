"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { previewPortalQuotations } from "@/content/preview-modules";
import {
  previewIssues,
  previewPortalClient,
  previewPortalCurrentProject,
  type PreviewIssue,
} from "@/content/preview-data";
import { formatDate, formatMoney } from "@/lib/format";
import {
  hasErrors,
  validatePortalIssueForm,
  validatePortalProfileForm,
  type PortalIssueFormErrors,
  type PortalProfileFormErrors,
} from "@/lib/validation";
import { ConfirmDialog, InfoDialog, Toast } from "@/components/ui/ConfirmDialog";
import { RecordListItem, StatusBadge } from "@/components/dashboard/RecordUI";

type PanelProps = { locale: Locale; appDict: AppDictionary };

export function QuotationsPanel({ locale, appDict }: PanelProps) {
  const [items, setItems] = useState(previewPortalQuotations);
  const [pending, setPending] = useState<{
    id: string;
    action: "approved" | "review_requested";
  } | null>(null);
  const [toast, setToast] = useState(false);

  return (
    <div className="panel">
      <div className="record-list">
        {items.map((q) => (
          <RecordListItem
            key={q.id}
            title={pick(q.title, locale)}
            reference={<span dir="ltr">{q.id}</span>}
            summaryItems={[
              { label: appDict.dashboard.cols.date, value: formatDate(q.date, locale) },
              {
                label: appDict.dashboard.operations.domain.amount,
                value: formatMoney(q.amount, locale),
              },
            ]}
            badges={<StatusBadge appDict={appDict} status={q.status} />}
            actions={
              q.status === "pending" ? (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    onClick={() => setPending({ id: q.id, action: "approved" })}
                  >
                    {appDict.portal.approvePreview}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => setPending({ id: q.id, action: "review_requested" })}
                  >
                    {appDict.portal.rejectPreview}
                  </button>
                </>
              ) : undefined
            }
            showDetailsLabel={appDict.showDetails}
            hideDetailsLabel={appDict.hideDetails}
            detailsTitle={appDict.recordMoreDetails}
          >
            <p className="record-list-note">{pick(q.note, locale)}</p>
          </RecordListItem>
        ))}
      </div>
      <ConfirmDialog
        open={Boolean(pending)}
        title={appDict.demoActionTitle}
        body={appDict.demoActionText}
        confirmLabel={appDict.confirm}
        cancelLabel={appDict.cancel}
        onConfirm={() => {
          if (pending) {
            setItems((prev) =>
              prev.map((q) => (q.id === pending.id ? { ...q, status: pending.action } : q)),
            );
            setToast(true);
          }
        }}
        onClose={() => setPending(null)}
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

export function IssuesPanel({ locale, appDict }: PanelProps) {
  const [issues, setIssues] = useState<PreviewIssue[]>(previewIssues);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [detail, setDetail] = useState("");
  const [errors, setErrors] = useState<PortalIssueFormErrors>({});
  const [toast, setToast] = useState(false);

  const f = appDict.portal.fields;
  const v = appDict.validation;

  function errFor(key: keyof PortalIssueFormErrors): string | undefined {
    const code = errors[key];
    return code ? v[code] : undefined;
  }

  function updateTitle(value: string) {
    setTitle(value);
    setErrors((prev) => ({ ...prev, title: undefined }));
  }

  function updateLocation(value: string) {
    setLocation(value);
    setErrors((prev) => ({ ...prev, location: undefined }));
  }

  function updateDetail(value: string) {
    setDetail(value);
    setErrors((prev) => ({ ...prev, detail: undefined }));
  }

  function addIssue(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validatePortalIssueForm({ title, location, detail });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const first = nextErrors.title ? "issue-title" : nextErrors.detail ? "issue-detail" : null;
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    const cleanTitle = title.trim();
    const cleanLocation = location.trim();
    const cleanDetail = detail.trim();
    setIssues((prev) => [
      {
        id: `PV-IS-NEW-${prev.length + 1}`,
        projectId: previewPortalCurrentProject.id,
        phase: previewPortalCurrentProject.currentMilestone,
        title: { ar: cleanTitle, en: cleanTitle },
        location: { ar: cleanLocation || "—", en: cleanLocation || "—" },
        detail: { ar: cleanDetail, en: cleanDetail },
        correctiveAction: {
          ar: "بانتظار مراجعة فريق الموقع داخل المعاينة",
          en: "Awaiting site-team review inside the preview",
        },
        assignee: { ar: "غير معيّن", en: "Unassigned" },
        status: "open",
        severity: "normal",
        reportedAt: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
    setTitle("");
    setLocation("");
    setDetail("");
    setToast(true);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <div className="panel">
        <div className="record-list">
          {issues.map((issue) => (
            <RecordListItem
              key={issue.id}
              title={pick(issue.title, locale)}
              reference={<span dir="ltr">{issue.id}</span>}
              summaryItems={[
                {
                  label: appDict.dashboard.cols.location,
                  value: pick(issue.location, locale),
                },
                {
                  label: appDict.dashboard.cols.reported,
                  value: formatDate(issue.reportedAt, locale),
                },
              ]}
              detailItems={[
                {
                  label: appDict.dashboard.cols.phase,
                  value: pick(issue.phase, locale),
                  wide: true,
                },
                {
                  label: appDict.dashboard.cols.correctiveAction,
                  value: pick(issue.correctiveAction, locale),
                  wide: true,
                },
                {
                  label: appDict.dashboard.cols.assignee,
                  value: pick(issue.assignee, locale),
                  wide: true,
                },
              ]}
              badges={<StatusBadge appDict={appDict} status={issue.status} />}
              showDetailsLabel={appDict.showDetails}
              hideDetailsLabel={appDict.hideDetails}
              detailsTitle={appDict.recordMoreDetails}
            >
              <p className="record-list-note">{pick(issue.detail, locale)}</p>
            </RecordListItem>
          ))}
        </div>
      </div>
      <form className="panel" onSubmit={addIssue} noValidate>
        <div className="panel-head">
          <h2>{appDict.portal.addIssuePreview}</h2>
        </div>
        <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="form-grid">
            <div className="field">
              <label className="form-label" htmlFor="issue-title">
                {f.issueTitle}
                <span className="form-field-note form-field-note-required">
                  {appDict.requiredField}
                </span>
              </label>
              <input
                id="issue-title"
                required
                className="form-input"
                type="text"
                value={title}
                onChange={(e) => updateTitle(e.target.value)}
                aria-invalid={Boolean(errors.title)}
                aria-describedby={errors.title ? "issue-title-err" : undefined}
              />
              {errFor("title") ? (
                <p className="field-error" id="issue-title-err" role="alert">
                  <span aria-hidden="true">⚠</span> {errFor("title")}
                </p>
              ) : null}
            </div>
            <div className="field">
              <label className="form-label" htmlFor="issue-location">
                {f.issueLocation}
                <span className="form-field-note">{v.optional}</span>
              </label>
              <input
                id="issue-location"
                className="form-input"
                type="text"
                value={location}
                onChange={(e) => updateLocation(e.target.value)}
              />
            </div>
            <div className="field full">
              <label className="form-label" htmlFor="issue-detail">
                {f.issueDetails}
                <span className="form-field-note form-field-note-required">
                  {appDict.requiredField}
                </span>
              </label>
              <textarea
                id="issue-detail"
                required
                className="form-textarea"
                rows={4}
                value={detail}
                onChange={(e) => updateDetail(e.target.value)}
                aria-invalid={Boolean(errors.detail)}
                aria-describedby={errors.detail ? "issue-detail-err" : "issue-detail-hint"}
              />
              {!errors.detail ? (
                <p className="field-hint" id="issue-detail-hint">
                  {v.issueDetailsShort}
                </p>
              ) : null}
              {errFor("detail") ? (
                <p className="field-error" id="issue-detail-err" role="alert">
                  <span aria-hidden="true">⚠</span> {errFor("detail")}
                </p>
              ) : null}
            </div>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary">
              {appDict.portal.addIssuePreview}
            </button>
          </div>
        </div>
      </form>
      {toast ? (
        <Toast
          message={appDict.portal.issueAddedToast}
          onDismiss={() => setToast(false)}
          closeLabel={appDict.close}
        />
      ) : null}
    </div>
  );
}

export function DemoActionButton({
  appDict,
  label,
  primary = false,
}: PanelProps & { label: string; primary?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`btn btn-sm ${primary ? "btn-primary" : "btn-outline"}`}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
      >
        {label}
      </button>
      <InfoDialog
        open={open}
        title={appDict.previewUnavailableTitle}
        closeLabel={appDict.close}
        onClose={() => setOpen(false)}
      >
        <p>{appDict.previewUnavailableText}</p>
      </InfoDialog>
    </>
  );
}

export function ProfilePanel({ locale, appDict }: PanelProps) {
  const [name, setName] = useState(() => pick(previewPortalClient.name, locale));
  const [phone, setPhone] = useState(previewPortalClient.phone);
  const [email, setEmail] = useState(previewPortalClient.email);
  const [errors, setErrors] = useState<PortalProfileFormErrors>({});
  const [toast, setToast] = useState(false);
  const f = appDict.portal.fields;
  const v = appDict.validation;

  function errFor(key: keyof PortalProfileFormErrors): string | undefined {
    const code = errors[key];
    return code ? v[code] : undefined;
  }

  function updateName(value: string) {
    setName(value);
    setErrors((prev) => ({ ...prev, name: undefined }));
  }

  function updatePhone(value: string) {
    setPhone(value);
    setErrors((prev) => ({ ...prev, phone: undefined }));
  }

  function updateEmail(value: string) {
    setEmail(value);
    setErrors((prev) => ({ ...prev, email: undefined }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const nextErrors = validatePortalProfileForm({ name, phone, email });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const first = nextErrors.name
        ? "pf-name"
        : nextErrors.phone
          ? "pf-phone"
          : nextErrors.email
            ? "pf-email"
            : null;
      if (first) document.getElementById(first)?.focus();
      return;
    }
    setErrors({});
    setToast(true);
  }

  return (
    <form className="panel" onSubmit={onSubmit} noValidate>
      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="alert alert-info">
          <span aria-hidden="true">ℹ</span>
          <p>{appDict.portal.profileNote}</p>
        </div>
        <div className="form-grid">
          <div className="field">
            <label className="form-label" htmlFor="pf-name">
              {f.name}
              <span className="form-field-note form-field-note-required">
                {appDict.requiredField}
              </span>
            </label>
            <input
              id="pf-name"
              required
              className="form-input"
              type="text"
              autoComplete="name"
              value={name}
              onChange={(e) => updateName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "pf-name-err" : undefined}
            />
            {errFor("name") ? (
              <p className="field-error" id="pf-name-err" role="alert">
                <span aria-hidden="true">⚠</span> {errFor("name")}
              </p>
            ) : null}
          </div>
          <div className="field">
            <label className="form-label" htmlFor="pf-phone">
              {f.phone}
              <span className="form-field-note form-field-note-required">
                {appDict.requiredField}
              </span>
            </label>
            <input
              id="pf-phone"
              required
              className="form-input"
              type="tel"
              dir="ltr"
              style={{ textAlign: "end" }}
              autoComplete="tel"
              value={phone}
              onChange={(e) => updatePhone(e.target.value)}
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "pf-phone-err" : undefined}
            />
            {errFor("phone") ? (
              <p className="field-error" id="pf-phone-err" role="alert">
                <span aria-hidden="true">⚠</span> {errFor("phone")}
              </p>
            ) : null}
          </div>
          <div className="field full">
            <label className="form-label" htmlFor="pf-email">
              {f.email}
              <span className="form-field-note form-field-note-required">
                {appDict.requiredField}
              </span>
            </label>
            <input
              id="pf-email"
              required
              className="form-input"
              type="email"
              dir="ltr"
              style={{ textAlign: "end" }}
              autoComplete="email"
              value={email}
              onChange={(e) => updateEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "pf-email-err" : undefined}
            />
            {errFor("email") ? (
              <p className="field-error" id="pf-email-err" role="alert">
                <span aria-hidden="true">⚠</span> {errFor("email")}
              </p>
            ) : null}
          </div>
        </div>
        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {appDict.savePreview}
          </button>
        </div>
      </div>
      {toast ? (
        <Toast
          message={appDict.demoSavedToast}
          onDismiss={() => setToast(false)}
          closeLabel={appDict.close}
        />
      ) : null}
    </form>
  );
}
