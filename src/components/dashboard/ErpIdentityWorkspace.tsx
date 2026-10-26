"use client";

import { useEffect, useId, useRef, useState } from "react";
import { pick, type Locale } from "@/lib/i18n";
import { erpModules } from "@/config/erp";
import { previewUiRoles, previewUiUsers, type PreviewUser } from "@/content/erp-identity-preview";
import { cleanUiSelection, uiPermissions } from "@/lib/erp-ui-permissions";
import { ErpPreviewUserForm } from "./ErpPreviewUserForm";
import { previewUserIssues } from "@/lib/erp-preview-users";
import { ErpPermissionPicker } from "./ErpPermissionPicker";

type Mode = "users" | "roles" | "assignments";
export function ErpIdentityWorkspace({
  locale,
  initialMode = "users",
}: {
  locale: Locale;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const instanceId = useId();
  const [users, setUsers] = useState(() =>
    previewUiUsers.map((u) => ({ ...u, name: { ...u.name }, roles: [...u.roles] })),
  );
  const [roles, setRoles] = useState(() =>
    previewUiRoles.map((r) => ({ ...r, permissions: cleanUiSelection(r.permissions) })),
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [moduleFilter, setModuleFilter] = useState("");
  const [sort, setSort] = useState("name-asc");
  const [page, setPage] = useState(0);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [statusDraft, setStatusDraft] = useState<PreviewUser["status"]>("active");
  const [roleDraft, setRoleDraft] = useState<string[]>([]);
  const [error, setError] = useState(false);
  const [pickerRoleId, setPickerRoleId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const addButton = useRef<HTMLButtonElement>(null);
  const [loginDraft, setLoginDraft] = useState("");
  const [emailDraft, setEmailDraft] = useState("");
  const [contactErrors, setContactErrors] = useState<string[]>([]);
  const detailRef = useRef<HTMLElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const t = (en: string, ar: string) => (locale === "ar" ? ar : en);
  const q = query.trim().toLocaleLowerCase();
  const statusLabel = (value: PreviewUser["status"]) =>
    value === "active"
      ? t("Active preview", "نشط تجريبياً")
      : value === "inactive"
        ? t("Inactive preview", "غير نشط تجريبياً")
        : value === "suspended"
          ? t("Suspended preview", "موقوف تجريبياً")
          : t("Invited example — no invitation sent", "مثال دعوة — لم تُرسل دعوة");
  const selectedUser = mode !== "roles" ? users.find((u) => u.id === detailId) : undefined;
  const selectedRole = mode === "roles" ? roles.find((r) => r.id === detailId) : undefined;
  const pickerRole = roles.find((r) => r.id === pickerRoleId);
  useEffect(() => {
    setMode(initialMode);
    setAddOpen(false);
    setDetailId(null);
    setPage(0);
  }, [initialMode]);
  useEffect(() => {
    if (detailId) detailRef.current?.focus();
  }, [detailId, mode]);
  useEffect(() => {
    if (error || contactErrors.length)
      detailRef.current?.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
  }, [error, contactErrors]);
  const matchingUsers = users
    .filter(
      (u) =>
        (!status || u.status === status) &&
        (!roleFilter || u.roles.includes(roleFilter)) &&
        `${u.login} ${u.name.ar} ${u.name.en} ${u.email} ${u.status} ${statusLabel(u.status)} ${u.roles
          .map((id) => {
            const r = roles.find((r) => r.id === id);
            return r ? `${r.name.ar} ${r.name.en}` : "";
          })
          .join(" ")}`
          .toLocaleLowerCase()
          .includes(q),
    )
    .sort((a, b) => {
      const aValue = sort === "login" ? a.login : pick(a.name, locale);
      const bValue = sort === "login" ? b.login : pick(b.name, locale);
      return (sort === "name-desc" ? -1 : 1) * aValue.localeCompare(bValue, locale);
    });
  const matchingRoles = roles
    .filter(
      (r) =>
        (!moduleFilter || r.permissions.some((p) => p.startsWith(`ui.${moduleFilter}.`))) &&
        `${r.name.ar} ${r.name.en} ${r.description.ar} ${r.description.en} ${r.id} ${r.permissions.join(" ")}`
          .toLocaleLowerCase()
          .includes(q),
    )
    .sort(
      (a, b) =>
        (sort === "name-desc" ? -1 : 1) *
        (sort === "login"
          ? a.id.localeCompare(b.id)
          : pick(a.name, locale).localeCompare(pick(b.name, locale), locale)),
    );
  const total = mode === "roles" ? matchingRoles.length : matchingUsers.length;
  const lastPage = Math.max(0, Math.ceil(total / 5) - 1);
  const currentPage = Math.min(page, lastPage);
  const changed = () =>
    setNotice(
      t(
        "Temporary preview changed only. No account, session, real role or access was changed. Remounting or refreshing resets this workspace.",
        "تغيرت المعاينة المؤقتة فقط؛ لم يُغير حساب أو جلسة أو دور حقيقي أو وصول. تُعاد العينات عند إعادة فتح المكون أو تحديث الصفحة.",
      ),
    );
  function openUser(user: PreviewUser, button: HTMLElement) {
    opener.current = button;
    setDetailId(user.id);
    setNameDraft(pick(user.name, locale));
    setLoginDraft(user.login);
    setEmailDraft(user.email);
    setContactErrors([]);
    setStatusDraft(user.status);
    setRoleDraft([...user.roles]);
    setError(false);
  }
  function closeDetail() {
    setDetailId(null);
    if (opener.current?.isConnected) opener.current.focus();
    else
      detailRef.current
        ?.closest("[data-identity-preview]")
        ?.querySelector<HTMLInputElement>('input[type="search"]')
        ?.focus();
  }
  function switchMode(next: Mode) {
    setMode(next);
    setAddOpen(false);
    setQuery("");
    setStatus("");
    setRoleFilter("");
    setModuleFilter("");
    setPage(0);
    setDetailId(null);
    setError(false);
  }
  return (
    <div
      className="erp-identity-workspace"
      data-identity-preview
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <header>
        <span className="badge badge-neutral">
          {t("Synthetic fixtures · frontend simulation", "عينات اصطناعية · محاكاة واجهة")}
        </span>
        <h3>{t("Users, roles and UI permissions", "المستخدمون والأدوار وصلاحيات الواجهة")}</h3>
        <p className="erp-boundary">
          {t(
            "Not connected to accounts or authorization. Edits stay only in this mounted workspace, not across routes, refreshes or other users. Status and role choices never control access. Use synthetic values only.",
            "غير متصل بالحسابات أو التفويض. التعديلات داخل هذه المعاينة المفتوحة فقط ولا تنتقل للمسارات أو التحديثات أو المستخدمين الآخرين. لا تتحكم الحالة والأدوار في الوصول. استخدم قيماً اصطناعية فقط.",
          )}
        </p>
      </header>
      <div
        className="erp-screen-tabs"
        role="group"
        aria-label={t("Identity preview views", "عروض معاينة الهوية")}
      >
        {(["users", "roles", "assignments"] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`btn btn-sm ${mode === key ? "btn-primary" : "btn-outline"}`}
            aria-pressed={mode === key}
            onClick={() => switchMode(key)}
          >
            {key === "users"
              ? t("User directory", "دليل المستخدمين")
              : key === "roles"
                ? t("Role directory", "دليل الأدوار")
                : t("User-to-role assignment", "تعيين الأدوار للمستخدمين")}
          </button>
        ))}
      </div>
      <div className="erp-identity-stats">
        <span>
          {users.length} {t("synthetic users", "مستخدمين اصطناعيين")}
        </span>
        <span>
          {roles.length} {t("synthetic roles", "أدوار اصطناعية")}
        </span>
        <span>{t("No live grants", "لا توجد منح فعلية")}</span>
      </div>
      {mode !== "roles" ? (
        <>
          <button
            ref={addButton}
            type="button"
            className="btn btn-outline btn-sm"
            aria-expanded={addOpen}
            aria-controls={`${instanceId}-new-user`}
            onClick={() => {
              setAddOpen((open) => !open);
              setDetailId(null);
            }}
          >
            {t("Add synthetic user", "إضافة مستخدم اصطناعي")}
          </button>
          <div id={`${instanceId}-new-user`} hidden={!addOpen}>
            {addOpen ? (
              <ErpPreviewUserForm
                locale={locale}
                users={users}
                roles={roles}
                onCancel={() => {
                  setAddOpen(false);
                  addButton.current?.focus();
                }}
                onConfirm={(input) => {
                  setUsers((current) => [
                    ...current,
                    {
                      id: `preview-user-local-${current.length + 1}`,
                      login: input.login,
                      email: input.email,
                      name: { en: input.name, ar: input.name },
                      status: input.status,
                      roles: input.roles,
                    },
                  ]);
                  setAddOpen(false);
                  setQuery(input.login);
                  setStatus("");
                  setRoleFilter("");
                  setPage(0);
                  changed();
                  addButton.current?.focus();
                }}
              />
            ) : null}
          </div>
        </>
      ) : null}
      <div className="erp-filterbar">
        <label>
          {mode === "roles"
            ? t("Search roles or permission identifiers", "بحث في الأدوار أو معرفات الصلاحيات")
            : t("Search synthetic users", "بحث في المستخدمين الاصطناعيين")}
          <input
            type="search"
            className="form-input"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(0);
            }}
          />
        </label>
        {mode !== "roles" ? (
          <>
            <label>
              {t("Preview user status", "حالة المستخدم التجريبية")}
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("All statuses", "كل الحالات")}</option>
                {(["active", "inactive", "suspended", "invited"] as const).map((value) => (
                  <option key={value} value={value}>
                    {statusLabel(value)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              {t("Preview role", "الدور التجريبي")}
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">{t("All roles", "كل الأدوار")}</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {pick(r.name, locale)}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <label>
            {t("Permission module", "وحدة الصلاحية")}
            <select
              className="form-select"
              value={moduleFilter}
              onChange={(e) => {
                setModuleFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">{t("All modules", "كل الوحدات")}</option>
              {erpModules.map((m) => (
                <option key={m.id} value={m.id}>
                  {pick(m.title, locale)}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          {t("Sort preview rows", "ترتيب صفوف المعاينة")}
          <select
            className="form-select"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
          >
            <option value="name-asc">{t("Name ascending", "الاسم تصاعدياً")}</option>
            <option value="name-desc">{t("Name descending", "الاسم تنازلياً")}</option>
            <option value="login">
              {mode === "roles"
                ? t("Role identifier", "معرّف الدور")
                : t("Login identifier", "معرّف الدخول")}
            </option>
          </select>
        </label>
        <button
          type="button"
          className="btn btn-ghost btn-sm"
          onClick={() => {
            setQuery("");
            setStatus("");
            setRoleFilter("");
            setModuleFilter("");
            setPage(0);
          }}
        >
          {t("Clear directory filters", "مسح مرشحات الدليل")}
        </button>
      </div>
      <p role="status">
        {total} {t("matching synthetic rows", "صفوف اصطناعية مطابقة")}
      </p>
      <div
        className="erp-table-scroll"
        role="region"
        tabIndex={0}
        aria-label={
          mode === "roles"
            ? t("Synthetic role directory", "دليل أدوار اصطناعي")
            : t("Synthetic user directory", "دليل مستخدمين اصطناعي")
        }
      >
        <table>
          <caption>
            {mode === "roles"
              ? t(
                  "Preview roles — not company access policies",
                  "أدوار تجريبية — ليست سياسات وصول الشركة",
                )
              : t("Preview users — not real accounts", "مستخدمون تجريبيون — ليسوا حسابات حقيقية")}
          </caption>
          <thead>
            <tr>
              {(mode === "roles"
                ? [
                    t("Role", "الدور"),
                    t("Description", "الوصف"),
                    t("Selected UI definitions", "تعريفات الواجهة المختارة"),
                    t("Synthetic members", "أعضاء اصطناعيون"),
                    t("Preview details", "تفاصيل المعاينة"),
                  ]
                : [
                    t("Login identifier", "معرّف الدخول"),
                    t("Display name", "الاسم الظاهر"),
                    t("Email", "البريد الإلكتروني"),
                    t("Preview status", "الحالة التجريبية"),
                    t("Assigned preview roles", "الأدوار التجريبية المعينة"),
                    t("Last activity — source unavailable", "آخر نشاط — المصدر غير متاح"),
                    t("Preview details", "تفاصيل المعاينة"),
                  ]
              ).map((title) => (
                <th key={title} scope="col">
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mode === "roles"
              ? matchingRoles.slice(currentPage * 5, currentPage * 5 + 5).map((role) => (
                  <tr key={role.id}>
                    <th scope="row">
                      {pick(role.name, locale)}
                      <small className="erp-secondary">
                        <bdi dir="ltr">{role.id}</bdi>
                      </small>
                    </th>
                    <td>{pick(role.description, locale)}</td>
                    <td>{role.permissions.length}</td>
                    <td>{users.filter((u) => u.roles.includes(role.id)).length}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          opener.current = e.currentTarget;
                          setDetailId(role.id);
                        }}
                      >
                        {t("Inspect preview role", "فحص الدور التجريبي")} —{" "}
                        {pick(role.name, locale)}
                      </button>
                    </td>
                  </tr>
                ))
              : matchingUsers.slice(currentPage * 5, currentPage * 5 + 5).map((user) => (
                  <tr key={user.id}>
                    <th scope="row">
                      <bdi dir="ltr">{user.login}</bdi>
                    </th>
                    <td>{pick(user.name, locale)}</td>
                    <td>
                      <bdi dir="ltr">{user.email}</bdi>
                    </td>
                    <td>
                      <span className={`badge erp-preview-status erp-status-${user.status}`}>
                        {statusLabel(user.status)}
                      </span>
                    </td>
                    <td>
                      {user.roles.length
                        ? user.roles.map((id) => (
                            <span className="badge badge-neutral" key={id}>
                              {pick(roles.find((r) => r.id === id)!.name, locale)}
                            </span>
                          ))
                        : t("No preview role", "لا يوجد دور تجريبي")}
                    </td>
                    <td>{t("Unavailable — no activity source", "غير متاح — لا يوجد مصدر نشاط")}</td>
                    <td>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={(e) => openUser(user, e.currentTarget)}
                      >
                        {mode === "assignments"
                          ? t("Preview role assignment", "معاينة تعيين الأدوار")
                          : t("Inspect preview user", "فحص المستخدم التجريبي")}{" "}
                        — <bdi>{user.login}</bdi>
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
        {!total ? (
          <p className="empty-state">
            {t(
              "No synthetic rows match these filters. Clear the filters to return to the preview directory; this is not a live account lookup.",
              "لا تطابق صفوف اصطناعية هذه المرشحات. امسحها للعودة للدليل التجريبي؛ هذا ليس بحث حسابات فعلياً.",
            )}
          </p>
        ) : null}
      </div>
      <nav
        className="erp-pagination"
        aria-label={t("Preview directory pagination", "صفحات الدليل التجريبي")}
      >
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage === 0}
          onClick={() => setPage(currentPage - 1)}
        >
          {t("Previous preview page", "صفحة المعاينة السابقة")}
        </button>
        <span>
          {currentPage + 1} / {lastPage + 1}
        </span>
        <button
          type="button"
          className="btn btn-outline btn-sm"
          disabled={currentPage === lastPage}
          onClick={() => setPage(currentPage + 1)}
        >
          {t("Next preview page", "صفحة المعاينة التالية")}
        </button>
      </nav>
      {selectedUser || selectedRole ? (
        <aside
          ref={detailRef}
          tabIndex={-1}
          className="erp-identity-detail"
          aria-label={
            selectedUser
              ? t("Synthetic user details", "تفاصيل المستخدم الاصطناعي")
              : t("Synthetic role details", "تفاصيل الدور الاصطناعي")
          }
        >
          <div className="erp-actions">
            <h4>
              {selectedUser
                ? pick(selectedUser.name, locale)
                : selectedRole
                  ? pick(selectedRole.name, locale)
                  : ""}
            </h4>
            <button type="button" className="btn btn-ghost btn-sm" onClick={closeDetail}>
              {t("Close preview details", "إغلاق تفاصيل المعاينة")}
            </button>
          </div>
          {selectedUser ? (
            <>
              <dl className="erp-detail-list">
                <div>
                  <dt>{t("Login identifier", "معرّف الدخول")}</dt>
                  <dd>
                    <bdi>{selectedUser.login}</bdi>
                  </dd>
                </div>
                <div>
                  <dt>{t("Email — fixture only", "البريد — عينة فقط")}</dt>
                  <dd>
                    <bdi>{selectedUser.email}</bdi>
                  </dd>
                </div>
                <div>
                  <dt>{t("Status — never session state", "الحالة — ليست حالة جلسة")}</dt>
                  <dd>{statusLabel(selectedUser.status)}</dd>
                </div>
              </dl>
              <form
                noValidate
                aria-label={t("Edit synthetic display only", "تعديل العرض الاصطناعي فقط")}
                onSubmit={(e) => {
                  e.preventDefault();
                  const name = nameDraft.trim();
                  const issues = previewUserIssues(
                    { name, login: loginDraft, email: emailDraft },
                    users,
                    selectedUser.id,
                  );
                  setError(issues.includes("name"));
                  setContactErrors(issues.filter((key) => key !== "name"));
                  if (issues.length) return;
                  setUsers((current) =>
                    current.map((u) =>
                      u.id === selectedUser.id
                        ? {
                            ...u,
                            login: loginDraft.trim(),
                            email: emailDraft.trim(),
                            name: { ...u.name, [locale]: name },
                            status: statusDraft,
                          }
                        : u,
                    ),
                  );
                  setError(false);
                  changed();
                }}
              >
                <label>
                  {t("Preview display name", "الاسم الظاهر التجريبي")} *
                  <input
                    className="form-input"
                    value={nameDraft}
                    required
                    minLength={2}
                    maxLength={80}
                    aria-invalid={error || undefined}
                    aria-describedby={error ? `${instanceId}-display-error` : undefined}
                    onChange={(e) => {
                      setNameDraft(e.target.value);
                      setError(false);
                    }}
                  />
                </label>
                {(["login", "email"] as const).map((key) => (
                  <label key={key}>
                    {key === "login"
                      ? t("Preview login — synthetic namespace", "معرف تجريبي — نطاق اصطناعي")
                      : t(
                          "Preview email — example.invalid only",
                          "بريد تجريبي — example.invalid فقط",
                        )}
                    <input
                      className="form-input"
                      type={key === "email" ? "email" : "text"}
                      autoComplete="off"
                      maxLength={100}
                      value={key === "login" ? loginDraft : emailDraft}
                      aria-invalid={contactErrors.includes(key) || undefined}
                      aria-describedby={
                        contactErrors.includes(key) ? `${instanceId}-contact-error` : undefined
                      }
                      onChange={(e) => {
                        (key === "login" ? setLoginDraft : setEmailDraft)(e.target.value);
                        setContactErrors([]);
                      }}
                    />
                  </label>
                ))}
                {contactErrors.length ? (
                  <p role="alert" id={`${instanceId}-contact-error`} className="erp-screen-error">
                    {t(
                      "Use a unique preview. identifier (at least 2 suffix characters) and a unique @example.invalid address. No changes applied.",
                      "استخدم معرفاً فريداً يبدأ بـ preview. مع حرفين لاحقين على الأقل وبريداً فريداً ينتهي بـ @example.invalid. لم تُطبق تعديلات.",
                    )}
                  </p>
                ) : null}
                <label>
                  {t("Simulated status — not activation", "حالة محاكاة — ليست تفعيل حساب")}
                  <select
                    className="form-select"
                    value={statusDraft}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (
                        value === "active" ||
                        value === "inactive" ||
                        value === "invited" ||
                        value === "suspended"
                      )
                        setStatusDraft(value);
                    }}
                  >
                    {(["active", "inactive", "suspended", "invited"] as const).map((value) => (
                      <option key={value} value={value}>
                        {statusLabel(value)}
                      </option>
                    ))}
                  </select>
                </label>
                {error ? (
                  <p role="alert" id={`${instanceId}-display-error`} className="erp-screen-error">
                    {t(
                      "Use a synthetic display name of 2–80 characters. Nothing has changed.",
                      "استخدم اسماً اصطناعياً من حرفين إلى 80 حرفاً. لم يتغير شيء.",
                    )}
                  </p>
                ) : null}
                <button type="submit" className="btn btn-outline btn-sm">
                  {t("Apply display simulation", "تطبيق محاكاة العرض")}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => {
                    setNameDraft(pick(selectedUser.name, locale));
                    setLoginDraft(selectedUser.login);
                    setEmailDraft(selectedUser.email);
                    setStatusDraft(selectedUser.status);
                    setError(false);
                    setContactErrors([]);
                  }}
                >
                  {t("Cancel unconfirmed display edits", "إلغاء تعديلات العرض غير المؤكدة")}
                </button>
                <p>
                  {t(
                    "Unconfirmed form edits do not change the directory. Apply affects only this mounted synthetic workspace.",
                    "تعديلات النموذج غير المؤكدة لا تغير الدليل؛ التطبيق يؤثر فقط في مساحة المعاينة الاصطناعية المفتوحة.",
                  )}
                </p>
              </form>
              <details className="erp-module-access-summary">
                <summary>
                  {t(
                    "Selected-role module definition summary — not access grants",
                    "ملخص تعريفات الوحدات للأدوار المختارة — ليس منح وصول",
                  )}
                </summary>
                <p>
                  {t(
                    "Union of confirmed synthetic-role UI definitions, deduplicated. Module-view selections never imply page, record or security permissions; unconfirmed role choices below are excluded.",
                    "اتحاد تعريفات الواجهة للأدوار الاصطناعية المؤكدة دون تكرار. اختيار عرض الوحدة لا يعني صلاحيات صفحات أو سجلات أو أمان؛ تُستبعد اختيارات الأدوار غير المؤكدة أدناه.",
                  )}
                </p>
                <ul>
                  {erpModules.map((area) => {
                    const ids = new Set(
                      roles
                        .filter((role) => selectedUser.roles.includes(role.id))
                        .flatMap((role) => role.permissions),
                    );
                    const definitions = uiPermissions.filter(
                      (permission) => permission.group === area.id && ids.has(permission.id),
                    );
                    return definitions.length ? (
                      <li key={area.id}>
                        {pick(area.title, locale)} — {definitions.length}{" "}
                        {t("selected UI definitions", "تعريفات واجهة مختارة")}
                        <ul>
                          {definitions.map((permission) => (
                            <li key={permission.id}>
                              {pick(permission.label, locale)} <bdi dir="ltr">{permission.id}</bdi>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ) : null;
                  })}
                </ul>
                {!selectedUser.roles.length ? (
                  <p>
                    {t(
                      "No confirmed synthetic roles or definitions.",
                      "لا توجد أدوار أو تعريفات اصطناعية مؤكدة.",
                    )}
                  </p>
                ) : null}
                <p>
                  {t(
                    "Last activity is unavailable. Display/status edits and role simulations are not login events.",
                    "آخر نشاط غير متاح؛ تعديلات العرض والحالة ومحاكاة الأدوار ليست أحداث دخول.",
                  )}
                </p>
              </details>
              <fieldset className="erp-role-assignment">
                <legend>
                  {t(
                    "Temporary role selection — synthetic user only",
                    "اختيار أدوار مؤقت — مستخدم اصطناعي فقط",
                  )}
                </legend>
                {roles.map((role) => (
                  <label key={role.id}>
                    <input
                      type="checkbox"
                      checked={roleDraft.includes(role.id)}
                      onChange={(e) =>
                        setRoleDraft((current) =>
                          e.target.checked
                            ? [...current, role.id]
                            : current.filter((id) => id !== role.id),
                        )
                      }
                    />
                    {pick(role.name, locale)}
                  </label>
                ))}
                <p>
                  {t("Preview role summary", "ملخص الأدوار التجريبي")}:{" "}
                  {roleDraft.length
                    ? roleDraft
                        .map((id) => pick(roles.find((r) => r.id === id)!.name, locale))
                        .join(" · ")
                    : t(
                        "No roles — preview list will be empty",
                        "لا أدوار — ستصبح القائمة التجريبية فارغة",
                      )}
                </p>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => {
                    setUsers((current) =>
                      current.map((u) =>
                        u.id === selectedUser.id
                          ? {
                              ...u,
                              roles: roleDraft.filter((id) => roles.some((r) => r.id === id)),
                            }
                          : u,
                      ),
                    );
                    changed();
                  }}
                >
                  {t("Confirm temporary role list", "تأكيد قائمة الأدوار المؤقتة")}
                </button>
              </fieldset>
            </>
          ) : selectedRole ? (
            <>
              <p>{pick(selectedRole.description, locale)}</p>
              <p>
                {users
                  .filter((u) => u.roles.includes(selectedRole.id))
                  .map((u) => u.login)
                  .join(" · ") || t("No synthetic members", "لا يوجد أعضاء اصطناعيون")}
              </p>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => setPickerRoleId(selectedRole.id)}
              >
                {t("Choose UI permissions — preview", "اختيار صلاحيات الواجهة — معاينة")}
              </button>
              <ul className="erp-permission-summary">
                {uiPermissions
                  .filter((p) => selectedRole.permissions.includes(p.id))
                  .map((permission) => (
                    <li key={permission.id}>
                      {pick(permission.label, locale)}
                      <bdi dir="ltr">{permission.id}</bdi>
                    </li>
                  ))}
              </ul>
            </>
          ) : null}
        </aside>
      ) : null}
      <p className="erp-footnote">
        {t(
          "Account creation, password changes, invitations, session revocation, real activation and live grants are unavailable. Preview roles do not map to backend role codes.",
          "إنشاء الحسابات وتغيير كلمات المرور والدعوات وإلغاء الجلسات والتفعيل والمنح الفعلية غير متاحة. لا تطابق الأدوار التجريبية رموز أدوار الخادم.",
        )}
      </p>
      {notice ? (
        <p role="status" className="erp-boundary">
          {notice}
        </p>
      ) : null}
      {pickerRole ? (
        <ErpPermissionPicker
          locale={locale}
          initialSelected={pickerRole.permissions}
          context={pick(pickerRole.name, locale)}
          onCancel={() => setPickerRoleId(null)}
          onConfirm={(ids) => {
            setRoles((current) =>
              current.map((r) => (r.id === pickerRole.id ? { ...r, permissions: ids } : r)),
            );
            setPickerRoleId(null);
            changed();
          }}
        />
      ) : null}
    </div>
  );
}
