"use client";
import { useRef, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { erpModules, erpHref, canAccessErp } from "@/config/erp";
import { erpText } from "@/content/erp-dictionary";
import { validateErpImport, type ImportValidation } from "@/lib/erp-data";

export function ErpImportValidator({ locale }: { locale: Locale }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState<ImportValidation | null>(null);
  const [loading, setLoading] = useState(false);
  const readVersion = useRef(0);
  async function readFile(file: File | undefined) {
    const version = ++readVersion.current;
    setLoading(false);
    setResult(null);
    setText("");
    if (!file) return;
    if (file.size > 256 * 1024) {
      setResult({ valid: false, count: 0, issues: [{ row: 0, field: "file" }] });
      return;
    }
    setLoading(true);
    try {
      const content = await file.text();
      if (version === readVersion.current) setText(content);
    } catch {
      if (version === readVersion.current)
        setResult({ valid: false, count: 0, issues: [{ row: 0, field: "file" }] });
    } finally {
      if (version === readVersion.current) setLoading(false);
    }
  }
  return (
    <section className="panel erp-tool">
      <h3>{erpText("validate", locale)}</h3>
      <p>{erpText("importHelp", locale)}</p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          setResult(validateErpImport(text));
        }}
      >
        <label>
          {erpText("choose", locale)}
          <input
            type="file"
            accept=".json,application/json"
            onChange={(e) => void readFile(e.target.files?.[0])}
          />
        </label>
        <label htmlFor="erp-import-json">JSON</label>
        <textarea
          id="erp-import-json"
          className="form-input"
          dir="ltr"
          value={text}
          maxLength={256 * 1024}
          onChange={(e) => {
            ++readVersion.current;
            setLoading(false);
            setText(e.target.value);
            setResult(null);
          }}
          rows={8}
          spellCheck={false}
        />
        <div className="erp-actions">
          <button className="btn btn-primary" type="submit" disabled={loading || !text.trim()}>
            {erpText("validate", locale)}
          </button>
          <button
            className="btn btn-outline"
            type="reset"
            onClick={() => {
              ++readVersion.current;
              setLoading(false);
              setText("");
              setResult(null);
            }}
          >
            {erpText("reset", locale)}
          </button>
        </div>
      </form>
      {loading ? <p role="status">{erpText("loading", locale)}</p> : null}
      {result ? (
        <div role="status" className={`erp-validation ${result.valid ? "is-valid" : "is-invalid"}`}>
          <strong>{erpText(result.valid ? "valid" : "invalid", locale)}</strong>
          <p>
            {result.count} {locale === "ar" ? "صفوف مرشحة" : "candidate rows"}
          </p>
          <ul>
            {result.issues.slice(0, 50).map((issue, index) => (
              <li key={index}>
                {locale === "ar" ? "الصف" : "Row"} {issue.row}: <code>{issue.field}</code>
              </li>
            ))}
          </ul>
          {result.issues.length > 50 ? (
            <p>
              {locale === "ar" ? "يتم عرض أول 50 خطأ فقط." : "Showing the first 50 issues only."}
            </p>
          ) : null}
        </div>
      ) : null}
      <p className="erp-boundary">{erpText("importUnavailable", locale)}</p>
    </section>
  );
}
export function ErpExport({ locale, role }: { locale: Locale; role: unknown }) {
  function download() {
    if (!canAccessErp(role)) return;
    const payload = {
      scope: "navigation-metadata-only",
      businessRecords: false,
      modules: erpModules.map((module) => ({
        name: pick(module.title, locale),
        pages: module.pages.map((page) => ({
          title: pick(page.title, locale),
          route: erpHref(locale, module.id, page.id),
        })),
      })),
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `blackx-navigation-${locale}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <section className="panel erp-tool">
      <h3>
        {locale === "ar"
          ? "تنزيل بيانات التنقل فقط — لا تقارير أعمال"
          : "Download navigation metadata only — no business reports"}
      </h3>
      <p>{erpText("exportHelp", locale)}</p>
      <button
        className="btn btn-outline"
        type="button"
        disabled={!canAccessErp(role)}
        onClick={download}
      >
        {erpText("download", locale)}
      </button>
    </section>
  );
}
