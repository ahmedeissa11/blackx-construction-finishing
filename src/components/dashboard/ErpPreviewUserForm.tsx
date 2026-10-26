"use client";
import { ErpFormSection } from "./ErpPrimitives";
import { useEffect, useId, useRef, useState } from "react";
import { pick, type Locale } from "@/lib/i18n";
import type { PreviewRole, PreviewUser } from "@/content/erp-identity-preview";
import { previewUserIssues, type PreviewUserInput } from "@/lib/erp-preview-users";
export function ErpPreviewUserForm({
  locale,
  users,
  roles,
  onConfirm,
  onCancel,
}: {
  locale: Locale;
  users: PreviewUser[];
  roles: PreviewRole[];
  onConfirm: (input: PreviewUserInput & Pick<PreviewUser, "status" | "roles">) => void;
  onCancel: () => void;
}) {
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState<PreviewUserInput>({ name: "", login: "", email: "" });
  const [status, setStatus] = useState<PreviewUser["status"]>("inactive");
  const [role, setRole] = useState("");
  const [errors, setErrors] = useState<(keyof PreviewUserInput)[]>([]);
  useEffect(() => {
    form.current?.querySelector<HTMLInputElement>("input")?.focus();
  }, []);
  useEffect(() => {
    if (errors.length)
      form.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }, [errors]);
  return (
    <form
      ref={form}
      noValidate
      className="erp-local-workbench"
      aria-label={t("Add synthetic user — not an account", "إضافة مستخدم اصطناعي — ليس حساباً")}
      onSubmit={(e) => {
        e.preventDefault();
        const issues = previewUserIssues(input, users);
        setErrors(issues);
        if (!issues.length)
          onConfirm({
            name: input.name.trim(),
            login: input.login.trim(),
            email: input.email.trim(),
            status,
            roles: role ? [role] : [],
          });
      }}
    >
      <h4>{t("Add synthetic user — not an account", "إضافة مستخدم اصطناعي — ليس حساباً")}</h4>
      <p id={`${id}-scope`} className="erp-boundary">
        {t(
          "Only a temporary row in this mounted directory. No invitation, password, sign-in, session, account activation or provisioning. Use a unique preview. login and an @example.invalid email; name 2–80 characters. No real personal data. Created labels are reused in both languages, not automatically translated.",
          "صف مؤقت داخل الدليل المفتوح فقط؛ دون دعوة أو كلمة مرور أو دخول أو جلسة أو تفعيل حساب أو إنشاء هوية. استخدم معرّفاً فريداً يبدأ بـ preview. وبريداً ينتهي بـ @example.invalid واسماً من 2–80 حرفاً. لا تستخدم بيانات شخصية حقيقية. تُستخدم الأسماء المنشأة باللغتين دون ترجمة آلية.",
        )}
      </p>
      <ErpFormSection
        title={t("Synthetic identity · required fields", "الهوية الاصطناعية · حقول مطلوبة")}
      >
        <div className="erp-screen-grid">
          {(["name", "login", "email"] as const).map((key) => (
            <label key={key} htmlFor={`${id}-${key}`}>
              {key === "name"
                ? t("Synthetic display name", "اسم ظاهر اصطناعي")
                : key === "login"
                  ? t("Synthetic login identifier", "معرّف دخول اصطناعي")
                  : t("Synthetic email", "بريد اصطناعي")}{" "}
              *
              <input
                id={`${id}-${key}`}
                className="form-input"
                type={key === "email" ? "email" : "text"}
                autoComplete="off"
                required
                maxLength={key === "name" ? 80 : 100}
                value={input[key]}
                aria-invalid={errors.includes(key) || undefined}
                aria-describedby={`${id}-scope${errors.includes(key) ? ` ${id}-errors` : ""}`}
                onChange={(e) => {
                  setInput((current) => ({ ...current, [key]: e.target.value }));
                  setErrors([]);
                }}
              />
            </label>
          ))}
        </div>
      </ErpFormSection>
      <ErpFormSection title={t("Simulation settings", "إعدادات المحاكاة")}>
        <div className="erp-screen-grid">
          <label>
            {t("Initial simulated status", "حالة المحاكاة الأولية")}
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value as PreviewUser["status"])}
            >
              {(["active", "inactive", "suspended", "invited"] as const).map((value) => (
                <option key={value} value={value}>
                  {value === "active"
                    ? t("Active preview", "نشط تجريبياً")
                    : value === "inactive"
                      ? t("Inactive preview", "غير نشط تجريبياً")
                      : value === "suspended"
                        ? t("Suspended preview", "موقوف تجريبياً")
                        : t("Invitation example — nothing sent", "مثال دعوة — لا إرسال")}
                </option>
              ))}
            </select>
          </label>
          <label>
            {t("Initial synthetic role — optional", "الدور الاصطناعي الأولي — اختياري")}
            <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">{t("Unassigned", "غير معين")}</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {pick(r.name, locale)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </ErpFormSection>
      {errors.length ? (
        <p role="alert" id={`${id}-errors`} className="erp-screen-error">
          {t("Check these fields", "راجع هذه الحقول")}:{" "}
          {errors
            .map((key) =>
              key === "name"
                ? t("Name: 2–80 characters", "الاسم: 2–80 حرفاً")
                : key === "login"
                  ? t(
                      "Login: unique preview. identifier (letters, digits, dot, underscore or hyphen; at least 2 suffix characters)",
                      "المعرف: فريد يبدأ بـ preview. مع حرفين لاحقين على الأقل (أحرف لاتينية أو أرقام أو نقطة أو شرطة)",
                    )
                  : t(
                      "Email: unique synthetic address ending @example.invalid",
                      "البريد: عنوان اصطناعي فريد ينتهي بـ @example.invalid",
                    ),
            )
            .join(" · ")}
          . {t("Nothing created.", "لم يُنشأ شيء.")}
        </p>
      ) : null}
      <div className="erp-actions">
        <button type="submit" className="btn btn-outline btn-sm">
          {t("Add row to local preview only", "إضافة صف للمعاينة المحلية فقط")}
        </button>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
          {t("Cancel synthetic user draft", "إلغاء مسودة المستخدم الاصطناعي")}
        </button>
      </div>
    </form>
  );
}
