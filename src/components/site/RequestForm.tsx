"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionary";
import { services } from "@/content/services";
import {
  hasErrors,
  validateRequestForm,
  type RequestFormErrors,
  type RequestFormValues,
} from "@/lib/validation";
import { submitInspectionRequestPreview } from "@/lib/preview-adapter";

type Phase = "idle" | "submitting" | "success" | "error";

const initial: RequestFormValues = {
  fullName: "",
  phone: "",
  email: "",
  service: "",
  city: "",
  area: "",
  unitType: "",
  description: "",
  consent: false,
};

export function RequestForm({
  locale,
  dict,
  preselectedService = "",
}: {
  locale: Locale;
  dict: Dictionary;
  preselectedService?: string;
}) {
  const [values, setValues] = useState<RequestFormValues>({
    ...initial,
    service: preselectedService,
  });
  const [errors, setErrors] = useState<RequestFormErrors>({});
  const [phase, setPhase] = useState<Phase>("idle");
  const [reference, setReference] = useState("");
  const successRef = useRef<HTMLDivElement>(null);

  const f = dict.request.fields;
  const v = dict.validation as Record<string, string>;

  function set<K extends keyof RequestFormValues>(key: K, value: RequestFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
    if (phase === "error") setPhase("idle");
  }

  useEffect(() => {
    if (phase === "success") successRef.current?.focus();
  }, [phase]);

  function errFor(key: keyof RequestFormValues): string | undefined {
    const code = errors[key];
    return code ? v[code] : undefined;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "submitting") return;
    const nextErrors = validateRequestForm(values);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      const first = (Object.keys(nextErrors) as Array<keyof RequestFormValues>).find(
        (k) => nextErrors[k],
      );
      if (first) {
        document.getElementById(`rq-${first}`)?.focus();
      }
      return;
    }
    setPhase("submitting");
    try {
      const result = await submitInspectionRequestPreview(values);
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
        <div className="alert alert-success" style={{ marginBlockEnd: 18 }}>
          <span aria-hidden="true">✓</span>
          <div>
            <strong>{dict.request.successTitle}</strong>
            <p style={{ marginBlockStart: 6 }}>{dict.request.successText}</p>
            <p style={{ marginBlockStart: 10 }}>
              {dict.request.referenceLabel}: <strong dir="ltr">{reference}</strong>
            </p>
          </div>
        </div>
        <div className="alert alert-warning" style={{ marginBlockEnd: 22 }}>
          <span aria-hidden="true">⚠</span>
          <p>{dict.request.previewNote}</p>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => {
            setValues({ ...initial, service: preselectedService });
            setErrors({});
            setReference("");
            setPhase("idle");
          }}
        >
          {f.reset}
        </button>
      </div>
    );
  }

  const submitting = phase === "submitting";

  return (
    <form className="form-card" onSubmit={onSubmit} noValidate aria-describedby="rq-preview-note">
      <h2 style={{ fontSize: "1.35rem", marginBlockEnd: 6 }}>{dict.request.formTitle}</h2>
      <p style={{ color: "var(--color-muted)", marginBlockEnd: 24 }}>{dict.request.formLead}</p>

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
          <label className="form-label" htmlFor="rq-fullName">
            {f.fullName}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="rq-fullName"
            required
            className="form-input"
            type="text"
            autoComplete="name"
            value={values.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            aria-invalid={Boolean(errors.fullName)}
            aria-describedby={errors.fullName ? "rq-fullName-err" : undefined}
          />
          {errFor("fullName") ? (
            <p className="field-error" id="rq-fullName-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("fullName")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="form-label" htmlFor="rq-phone">
            {f.phone}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="rq-phone"
            required
            className="form-input"
            type="tel"
            dir="ltr"
            style={{ textAlign: "end" }}
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => set("phone", e.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "rq-phone-err" : undefined}
          />
          {errFor("phone") ? (
            <p className="field-error" id="rq-phone-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("phone")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="form-label" htmlFor="rq-email">
            {f.email}
          </label>
          <input
            id="rq-email"
            className="form-input"
            type="email"
            dir="ltr"
            style={{ textAlign: "end" }}
            autoComplete="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "rq-email-err" : undefined}
          />
          {errFor("email") ? (
            <p className="field-error" id="rq-email-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("email")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="form-label" htmlFor="rq-service">
            {f.service}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="rq-service"
            required
            className="form-select"
            value={values.service}
            onChange={(e) => set("service", e.target.value)}
            aria-invalid={Boolean(errors.service)}
            aria-describedby={errors.service ? "rq-service-err" : undefined}
          >
            <option value="">{f.servicePlaceholder}</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {pick(s.title, locale)}
              </option>
            ))}
          </select>
          {errFor("service") ? (
            <p className="field-error" id="rq-service-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("service")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="form-label" htmlFor="rq-unitType">
            {f.unitType}
          </label>
          <select
            id="rq-unitType"
            className="form-select"
            value={values.unitType}
            onChange={(e) => set("unitType", e.target.value)}
          >
            <option value="">{f.unitPlaceholder}</option>
            {dict.request.unitTypes.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label className="form-label" htmlFor="rq-city">
            {f.city}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <input
            id="rq-city"
            required
            className="form-input"
            type="text"
            value={values.city}
            onChange={(e) => set("city", e.target.value)}
            aria-invalid={Boolean(errors.city)}
            aria-describedby={errors.city ? "rq-city-err" : undefined}
          />
          {errFor("city") ? (
            <p className="field-error" id="rq-city-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("city")}
            </p>
          ) : null}
        </div>
        <div className="field">
          <label className="form-label" htmlFor="rq-area">
            {f.area}
          </label>
          <input
            id="rq-area"
            className="form-input"
            type="number"
            min="1"
            inputMode="numeric"
            value={values.area}
            onChange={(e) => set("area", e.target.value)}
            aria-invalid={Boolean(errors.area)}
            aria-describedby={errors.area ? "rq-area-err" : undefined}
          />
          {errFor("area") ? (
            <p className="field-error" id="rq-area-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("area")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="form-label" htmlFor="rq-description">
            {f.description}{" "}
            <span className="req" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="rq-description"
            required
            className="form-textarea"
            rows={5}
            value={values.description}
            onChange={(e) => set("description", e.target.value)}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "rq-description-err" : "rq-description-hint"}
          />
          <p className="field-hint" id="rq-description-hint">
            {f.descriptionHint}
          </p>
          {errFor("description") ? (
            <p className="field-error" id="rq-description-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("description")}
            </p>
          ) : null}
        </div>
        <div className="field full">
          <label className="check-row" htmlFor="rq-consent">
            <input
              id="rq-consent"
              required
              type="checkbox"
              checked={values.consent}
              onChange={(e) => set("consent", e.target.checked)}
              aria-invalid={Boolean(errors.consent)}
              aria-describedby={errors.consent ? "rq-consent-err" : undefined}
            />
            <span>{f.consent}</span>
          </label>
          {errFor("consent") ? (
            <p className="field-error" id="rq-consent-err" role="alert">
              <span aria-hidden="true">⚠</span> {errFor("consent")}
            </p>
          ) : null}
        </div>
      </div>

      <p id="rq-preview-note" className="field-hint" style={{ marginBlock: "18px 16px" }}>
        {dict.request.previewNote}
      </p>
      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={submitting}
        aria-busy={submitting}
      >
        {submitting ? f.submitting : f.submit}
      </button>
    </form>
  );
}
