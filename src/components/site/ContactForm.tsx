"use client";

import { useEffect, useRef, useState } from "react";
import type { Dictionary } from "@/content/dictionary";
import {
  hasErrors,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormValues,
} from "@/lib/validation";
import { submitContactMessagePreview } from "@/lib/preview-adapter";

type Phase = "idle" | "submitting" | "success" | "error";

const initial: ContactFormValues = {
  fullName: "",
  phone: "",
  subject: "",
  message: "",
  consent: false,
};

export function ContactForm({ dict }: { dict: Dictionary }) {
  const [values, setValues] = useState<ContactFormValues>(initial);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [reference, setReference] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  const f = dict.contact.fields;
  const v = dict.validation as Record<string, string>;

  function set<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (phase === "error") setPhase("idle");
  }

  useEffect(() => {
    if (phase === "success") successRef.current?.focus();
  }, [phase]);

  function errFor(key: keyof ContactFormValues): string | undefined {
    const code = errors[key];
    return code ? v[code] : undefined;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "submitting") return;
    const nextErrors = validateContactForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const first = (Object.keys(nextErrors) as Array<keyof ContactFormValues>).find(
        (k) => nextErrors[k],
      );
      if (first) document.getElementById(`ct-${first}`)?.focus();
      return;
    }
    setPhase("submitting");
    try {
      const result = await submitContactMessagePreview(values);
      if (result.ok) {
        setReference(result.reference);
        setPhase("success");
      } else {
        setPhase("error");
      }
    } catch {
      setPhase("error");
    }
  }

  if (phase === "success") {
    return (
      <div className="form-card" role="status" ref={successRef} tabIndex={-1}>
        <div className="alert alert-success" style={{ marginBlockEnd: 20 }}>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{dict.contact.successTitle}</strong>
            <p style={{ marginBlockStart: 6 }}>
              {dict.contact.successText} <strong dir="ltr">{reference}</strong>
            </p>
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setValues(initial);
            setErrors({});
            setReference("");
            setPhase("idle");
          }}
        >
          {dict.request.fields.reset}
        </button>
      </div>
    );
  }

  const submitting = phase === "submitting";

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate>
      <h2 style={{ fontSize: "1.35rem", marginBlockEnd: 24 }}>{dict.contact.formTitle}</h2>
      {phase === "error" ? (
        <div className="alert alert-error" role="alert" style={{ marginBlockEnd: 20 }}>
          <span aria-hidden="true">⚠</span>
          <p>
            <strong>{dict.request.errorTitle}</strong> — {dict.request.errorText}
          </p>
        </div>
      ) : null}
      <div className="form-grid">
        <div className="field">
          <label className="form-label" htmlFor="ct-fullName">
            {f.fullName}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ct-fullName"
            required
            className="form-input"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "ct-fullName-err" : undefined}
          />
          {errFor("fullName") ? (
            <p className="field-error" id="ct-fullName-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("fullName")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="form-label" htmlFor="ct-phone">
            {f.phone}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="ct-phone"
            required
            className="form-input"
            type="tel"
            dir="ltr"
            style={{ textAlign: "end" }}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "ct-phone-err" : undefined}
          />
          {errFor("phone") ? (
            <p className="field-error" id="ct-phone-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("phone")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="form-label" htmlFor="ct-subject">
            {f.subject}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="ct-subject"
            required
            className="form-select"
            value={values.subject}
            onChange={(e) => set("subject", e.target.value)}
            aria-invalid={Boolean(errors.subject)}
            aria-describedby={errors.subject ? "ct-subject-err" : undefined}
          >
            <option value="">{f.subjectPlaceholder}</option>
            {dict.contact.subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          {errFor("subject") ? (
            <p className="field-error" id="ct-subject-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("subject")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="form-label" htmlFor="ct-message">
            {f.message}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="ct-message"
            required
            className="form-textarea"
            rows={5}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            aria-invalid={Boolean(errors.message)}
            aria-describedby={errors.message ? "ct-message-err" : undefined}
          />
          {errFor("message") ? (
            <p className="field-error" id="ct-message-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("message")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="check-row" htmlFor="ct-consent">
            <input
              id="ct-consent"
              required
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "ct-consent-err" : undefined}
            />
            <span>{f.consent}</span>
          </label>
          {errFor("consent") ? (
            <p className="field-error" id="ct-consent-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("consent")}
            </p>
          ) : null}
        </div>
      </div>
      <div style={{ marginBlockStart: 20 }}>
        <button
          type="submit"
          className="btn btn-primary btn-block"
          disabled={submitting}
          aria-busy={submitting}
        >
          {submitting ? f.submitting : f.submit}
        </button>
      </div>
    </form>
  );
}
