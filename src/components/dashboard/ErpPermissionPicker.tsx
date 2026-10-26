"use client";

import { useEffect, useId, useRef, useState } from "react";
import { erpModules } from "@/config/erp";
import { pick, type Locale } from "@/lib/i18n";
import {
  cleanUiSelection,
  matchUiPermission,
  setUiGroupSelection,
  uiGroupState,
  uiPermissions,
} from "@/lib/erp-ui-permissions";

function GroupCheckbox({
  state,
  label,
  onChange,
  disabled,
}: {
  state: "none" | "partial" | "all";
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = state === "partial";
  }, [state]);
  return (
    <input
      ref={ref}
      type="checkbox"
      disabled={disabled}
      checked={state === "all"}
      aria-checked={state === "partial" ? "mixed" : state === "all"}
      aria-label={label}
      onChange={(e) => onChange(e.target.checked)}
    />
  );
}

/** Native modal and local state only: this NEVER grants an application permission. */
export function ErpPermissionPicker({
  locale,
  initialSelected,
  context,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  initialSelected: readonly string[];
  context: string;
  onConfirm: (ids: string[]) => void;
  onCancel: () => void;
}) {
  const id = useId();
  const ref = useRef<HTMLDialogElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reviewRef = useRef<HTMLHeadingElement>(null);
  const [selected, setSelected] = useState(() => cleanUiSelection(initialSelected));
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(new Set(["permissions"]));
  const [step, setStep] = useState<"pick" | "review">("pick");
  const [error, setError] = useState(false);
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const matches = uiPermissions.filter((permission) => matchUiPermission(permission, query));
  const matchingIds = matches.filter((p) => p.availability !== "unavailable").map((p) => p.id);
  const selectedPermissions = uiPermissions.filter((p) => selected.includes(p.id));
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = ref.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (dialog && !dialog.open) dialog.showModal();
    searchRef.current?.focus();
    return () => {
      if (dialog?.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    if (step === "review") reviewRef.current?.focus();
    else searchRef.current?.focus();
  }, [step]);
  function selectGroup(ids: string[], checked: boolean) {
    setSelected((current) => setUiGroupSelection(current, ids, checked));
    setError(false);
  }
  return (
    <dialog
      ref={ref}
      className="app-dialog erp-permission-dialog"
      dir={locale === "ar" ? "rtl" : "ltr"}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-notice`}
      aria-modal="true"
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          onCancel();
        }
        if (e.key === "Tab") {
          const elements = [
            ...(ref.current?.querySelectorAll<HTMLElement>(
              'button, input, select, a[href], [tabindex="0"]',
            ) ?? []),
          ].filter((element) => !element.hasAttribute("disabled") && !element.closest("[hidden]"));
          const first = elements[0],
            last = elements.at(-1);
          if (
            e.shiftKey &&
            (document.activeElement === first || document.activeElement === reviewRef.current)
          ) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }}
    >
      <div className="dialog-head">
        <div>
          <span className="erp-eyebrow">
            {t("Frontend selection · simulation only", "اختيار واجهة · محاكاة فقط")}
          </span>
          <h2 id={`${id}-title`}>{t("Select UI permissions", "اختيار صلاحيات الواجهة")}</h2>
          <p>{context}</p>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label={t("Cancel permission selection", "إلغاء اختيار الصلاحيات")}
          onClick={onCancel}
        >
          ×
        </button>
      </div>
      <p className="erp-boundary" id={`${id}-notice`}>
        {t(
          "These are BLACK X UI definitions, not legacy or backend permission keys. Nothing grants access, changes a session or persists. View means an interface route, not access to its business data. Unavailable requirements cannot be selected.",
          "هذه تعريفات واجهة BLACK X وليست مفاتيح صلاحيات قديمة أو خلفية. لا تمنح وصولاً أو تغير جلسة أو تحفظ بيانات. العرض يعني مسار واجهة وليس وصولاً لبيانات الأعمال. لا يمكن اختيار المتطلبات غير المتاحة.",
        )}
      </p>
      <p className="erp-selection-count" role="status">
        {selected.length} {t("selected", "محدد")} · {matchingIds.length}{" "}
        {t("selectable matches", "نتائج قابلة للاختيار")}
      </p>
      <div className="erp-permission-body">
        {step === "pick" ? (
          <>
            <label htmlFor={`${id}-search`}>
              {t(
                "Search permission labels or technical identifiers",
                "بحث في مسميات الصلاحيات أو معرفاتها التقنية",
              )}
            </label>
            <input
              ref={searchRef}
              id={`${id}-search`}
              className="form-input"
              type="search"
              value={query}
              onChange={(e) => {
                const value = e.target.value;
                setQuery(value);
                setError(false);
                if (value.trim())
                  setExpanded(
                    new Set(
                      uiPermissions.filter((p) => matchUiPermission(p, value)).map((p) => p.group),
                    ),
                  );
              }}
            />
            <div className="erp-actions erp-selection-toolbar">
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={!matchingIds.length}
                onClick={() => selectGroup(matchingIds, true)}
              >
                {t("Select all matching", "تحديد جميع النتائج")}
              </button>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                disabled={!matchingIds.length}
                onClick={() => selectGroup(matchingIds, false)}
              >
                {t("Clear matching selection", "مسح تحديد النتائج")}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setExpanded(new Set(erpModules.map((m) => m.id)))}
              >
                {t("Expand groups", "توسيع المجموعات")}
              </button>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setExpanded(new Set())}
              >
                {t("Collapse groups", "طي المجموعات")}
              </button>
            </div>
            {matches.length === 0 ? (
              <p className="empty-state">
                {t(
                  "No permissions match. Try another label or identifier; your hidden selections are retained.",
                  "لا توجد صلاحيات مطابقة. جرّب مسمى أو معرفاً آخر؛ اختياراتك المخفية محفوظة مؤقتاً.",
                )}
              </p>
            ) : null}
            {erpModules.map((module) => {
              const items = matches.filter((p) => p.group === module.id);
              if (!items.length) return null;
              const availableIds = items
                .filter((p) => p.availability !== "unavailable")
                .map((p) => p.id);
              const allIds = uiPermissions
                .filter((p) => p.group === module.id && p.availability !== "unavailable")
                .map((p) => p.id);
              const count = allIds.filter((key) => selected.includes(key)).length;
              return (
                <fieldset
                  className="erp-permission-group"
                  key={module.id}
                  data-permission-group={module.id}
                >
                  <legend>{pick(module.title, locale)}</legend>
                  <div className="erp-permission-group-head">
                    <GroupCheckbox
                      state={uiGroupState(selected, availableIds)}
                      disabled={!availableIds.length}
                      label={`${t("Select matching group", "تحديد نتائج مجموعة")}: ${pick(module.title, locale)}`}
                      onChange={(checked) => selectGroup(availableIds, checked)}
                    />
                    <span>
                      {count} / {allIds.length} {t("selected in group", "محدد في المجموعة")} ·{" "}
                      {items.length} {t("matching definitions", "تعريفات مطابقة")}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      aria-expanded={expanded.has(module.id)}
                      aria-controls={`${id}-${module.id}`}
                      onClick={() =>
                        setExpanded((current) => {
                          const next = new Set(current);
                          if (next.has(module.id)) next.delete(module.id);
                          else next.add(module.id);
                          return next;
                        })
                      }
                    >
                      {expanded.has(module.id) ? t("Collapse", "طي") : t("Expand", "توسيع")}{" "}
                      {pick(module.title, locale)}
                    </button>
                  </div>
                  <div id={`${id}-${module.id}`} hidden={!expanded.has(module.id)}>
                    <div className="erp-actions">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!availableIds.length}
                        onClick={() => selectGroup(availableIds, true)}
                      >
                        {t("Select matching in this group", "تحديد النتائج في هذه المجموعة")}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!availableIds.length}
                        onClick={() => selectGroup(availableIds, false)}
                      >
                        {t("Clear matching in this group", "مسح النتائج في هذه المجموعة")}
                      </button>
                    </div>
                    {items.map((permission) => (
                      <label className="erp-permission-option" key={permission.id}>
                        <input
                          type="checkbox"
                          checked={selected.includes(permission.id)}
                          disabled={permission.availability === "unavailable"}
                          onChange={(e) => selectGroup([permission.id], e.target.checked)}
                        />
                        <span>
                          <strong>{pick(permission.label, locale)}</strong>
                          <small>
                            <bdi dir="ltr">{permission.id}</bdi>
                          </small>
                          <small>
                            {permission.availability === "interface"
                              ? t(
                                  "Interface definition only — not data access",
                                  "تعريف واجهة فقط — ليس وصولاً للبيانات",
                                )
                              : permission.availability === "local-action"
                                ? t("Local frontend action only", "إجراء واجهة محلي فقط")
                                : t(
                                    "Backend-dependent / unavailable",
                                    "يعتمد على الخادم / غير متاح",
                                  )}
                          </small>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              );
            })}
            <p className="erp-footnote">
              {t(
                "No archive/delete, approval/rejection or print grants are invented: no corresponding supported frontend operation exists in this catalogue. Audit/history is represented by its mapped view definitions. Selecting a module never silently selects its pages.",
                "لا تُختلق منح أرشفة أو حذف أو اعتماد أو رفض أو طباعة: لا توجد عملية واجهة مدعومة مقابلة في هذا الدليل. يمثل التدقيق والتاريخ تعريف عرض المسار المقابل. تحديد الوحدة لا يحدد صفحاتها تلقائياً.",
              )}
            </p>
          </>
        ) : (
          <div>
            <h3 ref={reviewRef} tabIndex={-1}>
              {t("Review temporary permission summary", "مراجعة ملخص الصلاحيات المؤقت")}
            </h3>
            <p>
              {t(
                "All selected definitions are listed, including those hidden by the previous search. Confirm changes only this mounted preview.",
                "تُعرض جميع التعريفات المحددة، بما فيها المخفية بالبحث السابق. يؤثر التأكيد في هذه المعاينة المفتوحة فقط.",
              )}
            </p>
            <ul className="erp-permission-summary">
              {selectedPermissions.map((permission) => (
                <li key={permission.id}>
                  <strong>{pick(permission.label, locale)}</strong>
                  <bdi dir="ltr">{permission.id}</bdi>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {error ? (
        <p role="alert" id={`${id}-error`} className="erp-screen-error erp-permission-error">
          {t(
            "Choose at least one definition to review a preview assignment, or cancel. This is a UI check, not an access policy.",
            "اختر تعريفاً واحداً على الأقل لمراجعة تعيين تجريبي، أو ألغِ. هذا فحص واجهة وليس سياسة وصول.",
          )}
        </p>
      ) : null}
      <div className="dialog-foot">
        <button type="button" className="btn btn-outline btn-sm" onClick={onCancel}>
          {t("Cancel", "إلغاء")}
        </button>
        {step === "pick" ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            aria-describedby={error ? `${id}-error` : undefined}
            onClick={() => {
              if (!selected.length) setError(true);
              else setStep("review");
            }}
          >
            {t("Review selection", "مراجعة الاختيار")}
          </button>
        ) : (
          <>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setStep("pick")}
            >
              {t("Back to selection", "العودة للاختيار")}
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onConfirm(cleanUiSelection(selected))}
            >
              {t("Confirm preview selection", "تأكيد الاختيار التجريبي")}
            </button>
          </>
        )}
      </div>
    </dialog>
  );
}
