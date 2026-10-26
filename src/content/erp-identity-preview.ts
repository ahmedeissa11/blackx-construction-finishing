/** Synthetic FRONTEND fixtures. No account, identity, role or backend policy. */
import type { LocalizedText } from "@/lib/i18n";
export type PreviewRole = {
  id: string;
  name: LocalizedText;
  description: LocalizedText;
  permissions: string[];
};
export type PreviewUser = {
  id: string;
  login: string;
  name: LocalizedText;
  email: string;
  status: "active" | "inactive" | "invited" | "suspended";
  roles: string[];
};
const text = (en: string, ar: string): LocalizedText => ({ en, ar });
export const previewUiRoles: PreviewRole[] = [
  {
    id: "preview-reader",
    name: text("Preview reader", "قارئ تجريبي"),
    description: text(
      "Synthetic directory and module-view examples; not a company role.",
      "أمثلة اصطناعية لعرض الدليل والوحدات؛ ليس دوراً للشركة.",
    ),
    permissions: ["ui.crm.view", "ui.crm.customers.view"],
  },
  {
    id: "preview-coordinator",
    name: text("Preview coordinator", "منسق تجريبي"),
    description: text(
      "Construction inquiry interface examples, without workflow authority.",
      "أمثلة واجهة استفسارات البناء دون سلطة على مسار العمل.",
    ),
    permissions: ["ui.sales.view", "ui.sales.requests.view", "ui.sales.inspections.view"],
  },
  {
    id: "preview-project-reader",
    name: text("Preview project reader", "قارئ مشاريع تجريبي"),
    description: text(
      "Project/quality view definitions only, not project assignment.",
      "تعريفات عرض المشاريع والجودة فقط وليس تعييناً للمشروعات.",
    ),
    permissions: ["ui.projects.view", "ui.projects.portfolio.view", "ui.quality.view"],
  },
  {
    id: "preview-purchasing-reader",
    name: text("Preview purchasing reader", "قارئ مشتريات تجريبي"),
    description: text(
      "Supplier and purchasing screen descriptions, no financial authority.",
      "وصف شاشات الموردين والمشتريات دون سلطة مالية.",
    ),
    permissions: ["ui.purchasing.view", "ui.purchasing.suppliers.view"],
  },
  {
    id: "preview-audit-reader",
    name: text("Preview audit reader", "قارئ تدقيق تجريبي"),
    description: text(
      "Illustrates audit/history view concepts, not a live audit grant.",
      "يوضح مفاهيم عرض التدقيق والتاريخ وليس منح تدقيق فعلياً.",
    ),
    permissions: ["ui.administration.audit.view", "ui.permissions.history.view"],
  },
  {
    id: "preview-ui-editor",
    name: text("Preview UI editor", "محرر واجهة تجريبي"),
    description: text(
      "Local-only directory simulation and role-selection actions.",
      "محاكاة دليل محلية وإجراءات اختيار أدوار فقط.",
    ),
    permissions: [
      "ui.permissions.roles.view",
      "ui.permissions.roles.assign_preview_permissions",
      "ui.permissions.assignments.assign_preview_roles",
    ],
  },
];
export const previewUiUsers: PreviewUser[] = [
  {
    id: "preview-user-01",
    login: "preview.reader",
    name: text("Synthetic reader", "قارئ اصطناعي"),
    email: "reader.preview@example.invalid",
    status: "active",
    roles: ["preview-reader"],
  },
  {
    id: "preview-user-02",
    login: "preview.coordinator",
    name: text("Synthetic coordinator", "منسق اصطناعي"),
    email: "coordinator.preview@example.invalid",
    status: "active",
    roles: ["preview-coordinator", "preview-reader"],
  },
  {
    id: "preview-user-03",
    login: "preview.project",
    name: text("Synthetic project reviewer", "مراجع مشاريع اصطناعي"),
    email: "project.preview@example.invalid",
    status: "invited",
    roles: ["preview-project-reader"],
  },
  {
    id: "preview-user-04",
    login: "preview.purchasing",
    name: text("Synthetic purchasing reviewer", "مراجع مشتريات اصطناعي"),
    email: "purchasing.preview@example.invalid",
    status: "inactive",
    roles: ["preview-purchasing-reader"],
  },
  {
    id: "preview-user-05",
    login: "preview.audit",
    name: text("Synthetic audit reviewer", "مراجع تدقيق اصطناعي"),
    email: "audit.preview@example.invalid",
    status: "active",
    roles: ["preview-audit-reader"],
  },
  {
    id: "preview-user-06",
    login: "preview.editor",
    name: text("Synthetic interface editor", "محرر واجهة اصطناعي"),
    email: "editor.preview@example.invalid",
    status: "active",
    roles: ["preview-ui-editor"],
  },
  {
    id: "preview-user-07",
    login: "preview.unassigned",
    name: text("Synthetic unassigned user", "مستخدم اصطناعي بلا دور"),
    email: "unassigned.preview@example.invalid",
    status: "invited",
    roles: [],
  },
  {
    id: "preview-user-08",
    login: "preview.inactive-example",
    name: text("Synthetic inactive reviewer", "مراجع اصطناعي غير نشط"),
    email: "inactive.preview@example.invalid",
    status: "inactive",
    roles: ["preview-reader", "preview-audit-reader"],
  },
];
