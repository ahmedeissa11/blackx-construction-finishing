/** Frontend descriptions only. NEVER import into an authorization predicate. */
import { erpModules, type ErpRouteRef } from "@/config/erp";
import type { LocalizedText } from "@/lib/i18n";

export type UiPermission = {
  id: string;
  group: string;
  label: LocalizedText;
  target: ErpRouteRef;
  availability: "interface" | "local-action" | "unavailable";
  action: "view" | "edit" | "assign" | "validate" | "export" | "create";
};
const label = (en: string, ar: string): LocalizedText => ({ en, ar });
export const uiPermissions: UiPermission[] = erpModules.flatMap((module) => [
  {
    id: `ui.${module.id}.view`,
    group: module.id,
    label: label(`View module: ${module.title.en}`, `عرض الوحدة: ${module.title.ar}`),
    target: { area: module.id, page: "" },
    availability: "interface" as const,
    action: "view" as const,
  },
  ...module.pages.map((page) => ({
    id: `ui.${module.id}.${page.id}.view`,
    group: module.id,
    label: label(`View page: ${page.subject.en}`, `عرض الصفحة: ${page.subject.ar}`),
    target: { area: module.id, page: page.id },
    availability: "interface" as const,
    action: "view" as const,
  })),
]);
const actions: UiPermission[] = [
  {
    id: "ui.data.validation.check_local",
    group: "data",
    label: label("Validate local JSON — no import", "فحص JSON محلي — دون استيراد"),
    target: { area: "data", page: "validation" },
    availability: "local-action",
    action: "validate",
  },
  {
    id: "ui.data.export.download_metadata",
    group: "data",
    label: label(
      "Download navigation metadata — not business reports",
      "تنزيل بيانات التنقل — ليس تقارير أعمال",
    ),
    target: { area: "data", page: "export" },
    availability: "local-action",
    action: "export",
  },
  {
    id: "ui.administration.overview.edit_preview_user",
    group: "administration",
    label: label(
      "Edit synthetic user display/status — local simulation",
      "تعديل اسم وحالة مستخدم اصطناعي — محاكاة محلية",
    ),
    target: { area: "administration", page: "overview" },
    availability: "local-action",
    action: "edit",
  },
  {
    id: "ui.permissions.assignments.assign_preview_roles",
    group: "permissions",
    label: label(
      "Assign roles to synthetic users — local simulation",
      "تعيين أدوار لمستخدمين اصطناعيين — محاكاة محلية",
    ),
    target: { area: "permissions", page: "assignments" },
    availability: "local-action",
    action: "assign",
  },
  {
    id: "ui.permissions.roles.assign_preview_permissions",
    group: "permissions",
    label: label(
      "Select role permissions — local simulation",
      "اختيار صلاحيات الدور — محاكاة محلية",
    ),
    target: { area: "permissions", page: "roles" },
    availability: "local-action",
    action: "assign",
  },
  {
    id: "ui.sales.requests.edit_preview_draft",
    group: "sales",
    label: label(
      "Edit request assignment draft — screen-only preview",
      "تعديل مسودة تعيين الطلب — معاينة شاشة فقط",
    ),
    target: { area: "sales", page: "requests" },
    availability: "local-action",
    action: "edit",
  },
  {
    id: "ui.purchasing.invoices.create_document",
    group: "purchasing",
    label: label(
      "Create purchase document — unavailable requirement",
      "إنشاء مستند شراء — متطلب غير متاح",
    ),
    target: { area: "purchasing", page: "invoices" },
    availability: "unavailable",
    action: "create",
  },
];
uiPermissions.push(...actions);
export const selectableUiPermissionIds = new Set(
  uiPermissions.filter((p) => p.availability !== "unavailable").map((p) => p.id),
);
export function cleanUiSelection(ids: readonly string[]): string[] {
  return [...new Set(ids)].filter((id) => selectableUiPermissionIds.has(id)).sort();
}
export function matchUiPermission(permission: UiPermission, query: string): boolean {
  const q = query.trim().toLocaleLowerCase();
  return `${permission.id} ${permission.label.ar} ${permission.label.en}`
    .toLocaleLowerCase()
    .includes(q);
}
export function setUiGroupSelection(
  selected: readonly string[],
  groupIds: readonly string[],
  checked: boolean,
): string[] {
  const next = new Set(cleanUiSelection(selected));
  for (const id of groupIds)
    if (selectableUiPermissionIds.has(id)) {
      if (checked) next.add(id);
      else next.delete(id);
    }
  return [...next].sort();
}
export function uiGroupState(
  selected: readonly string[],
  ids: readonly string[],
): "none" | "partial" | "all" {
  const allowed = ids.filter((id) => selectableUiPermissionIds.has(id));
  const count = allowed.filter((id) => selected.includes(id)).length;
  return count === 0 ? "none" : count === allowed.length ? "all" : "partial";
}
