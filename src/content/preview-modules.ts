/**
 * Generic workspace datasets for dashboard modules (see preview-data.ts header).
 * Records are maintained in the local workspace model. Columns reference `cols.*` keys in app-dictionary.
 */
import type { LocalizedText } from "@/lib/i18n";
import type { DashboardModuleKey } from "@/config/navigation";
import { previewProjects, previewRequests } from "@/content/preview-data";
import {
  previewComplaints,
  previewContactMessages,
  previewEngineers,
  previewPurchases,
} from "@/content/preview-expansion";
import { getAllDuesWithBalance, purchaseTotals } from "@/lib/preview-expansion";

const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export type PreviewCell =
  | { kind: "text"; value: LocalizedText }
  | { kind: "status"; value: string }
  | { kind: "priority"; value: string }
  | { kind: "progress"; value: number }
  | { kind: "money"; value: number }
  | { kind: "date"; value: string }
  | { kind: "plain"; value: string };

export type PreviewRecordLinks = {
  customerId?: string;
  requestId?: string;
  projectId?: string;
  quotationId?: string;
  contractId?: string;
};

export type PreviewModuleTable = {
  columns: Array<{ id: string; labelKey: string }>;
  rows: Array<{ id: string; links?: PreviewRecordLinks; cells: Record<string, PreviewCell> }>;
};

export type PreviewModuleRow = PreviewModuleTable["rows"][number];

const tx = (ar: string, en: string): PreviewCell => ({ kind: "text", value: t(ar, en) });
const st = (value: string): PreviewCell => ({ kind: "status", value });
const pr = (value: string): PreviewCell => ({ kind: "priority", value });
const pg = (value: number): PreviewCell => ({ kind: "progress", value });
const mn = (value: number): PreviewCell => ({ kind: "money", value });
const dt = (value: string): PreviewCell => ({ kind: "date", value });
const pl = (value: string): PreviewCell => ({ kind: "plain", value });

function customerPreviewStatus(customerId: string): string {
  const projects = previewProjects.filter((project) => project.customerId === customerId);
  if (projects.some((project) => project.status === "in_progress")) return "in_progress";
  const latestRequest = previewRequests
    .filter((request) => request.customerId === customerId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (latestRequest && latestRequest.status !== "cancelled") return latestRequest.status;
  if (projects.some((project) => project.status === "handed_over")) return "handed_over";
  return latestRequest?.status ?? "new";
}

const previewCustomerRows: PreviewModuleRow[] = [
  ...new Map(previewRequests.map((request) => [request.customerId, request])).values(),
]
  .sort((a, b) => a.customerId.localeCompare(b.customerId))
  .map((request) => {
    const projects = previewProjects.filter((project) => project.customerId === request.customerId);
    return {
      id: request.customerId,
      links: {
        customerId: request.customerId,
        requestId: request.id,
        projectId: projects.length === 1 ? projects[0]!.id : undefined,
      },
      cells: {
        ref: pl(request.customerId),
        name: { kind: "text", value: request.customerName },
        phone: pl(request.phone),
        city: { kind: "text", value: request.city },
        projects: pl(String(projects.length)),
        status: st(customerPreviewStatus(request.customerId)),
      },
    };
  });

const previewProjectRows: PreviewModuleRow[] = previewProjects.map((project) => ({
  id: project.id,
  links: {
    customerId: project.customerId,
    projectId: project.id,
    quotationId: project.quotationId,
    contractId: project.contractId,
  },
  cells: {
    ref: pl(project.id),
    project: { kind: "text", value: project.title },
    customer: { kind: "text", value: project.customer },
    progress: pg(Math.min(100, Math.max(0, Math.round(project.progress)))),
    milestone: { kind: "text", value: project.currentMilestone },
    status: st(project.status),
  },
}));

const previewEngineerRoleText: Record<string, LocalizedText> = {
  coordinator: t("منسّق", "Coordinator"),
  inspection_engineer: t("مهندس معاينات", "Inspection engineer"),
  project_manager: t("مدير مشاريع", "Project manager"),
  site_supervisor: t("مشرف موقع", "Site supervisor"),
};

function expansionCustomerName(customerId: string): LocalizedText {
  const request = previewRequests.find((item) => item.customerId === customerId);
  return request?.customerName ?? t(customerId, customerId);
}

const previewEngineerRows: PreviewModuleRow[] = previewEngineers.map((engineer) => ({
  id: engineer.id,
  cells: {
    ref: pl(engineer.id),
    name: { kind: "text", value: engineer.name },
    type: { kind: "text", value: previewEngineerRoleText[engineer.role] ?? t("", "") },
    phone: pl(engineer.phone),
  },
}));

const previewFinanceRows: PreviewModuleRow[] = getAllDuesWithBalance().map((item) => ({
  id: item.due.id,
  links: { customerId: item.due.customerId, projectId: item.due.projectId },
  cells: {
    ref: pl(item.due.id),
    title: { kind: "text", value: item.due.label },
    customer: { kind: "text", value: expansionCustomerName(item.due.customerId) },
    date: dt(item.due.dueDate),
    amount: mn(item.due.amount),
    status: st(item.status),
  },
}));

const previewPurchaseRows: PreviewModuleRow[] = previewPurchases.map((purchase) => ({
  id: purchase.id,
  links: { projectId: purchase.projectId },
  cells: {
    ref: pl(purchase.id),
    supplier: pl(purchase.supplierId),
    project: pl(purchase.projectId),
    date: dt(purchase.date),
    amount: mn(purchaseTotals(purchase).net),
    status: st("recorded"),
  },
}));

const previewComplaintRows: PreviewModuleRow[] = previewComplaints.map((complaint) => ({
  id: complaint.id,
  links: { customerId: complaint.customerId, projectId: complaint.projectId },
  cells: {
    ref: pl(complaint.id),
    title: { kind: "text", value: complaint.title },
    customer: { kind: "text", value: expansionCustomerName(complaint.customerId) },
    date: dt(complaint.createdAt),
    priority: pr(complaint.priority),
    status: st(complaint.status),
  },
}));

const previewMessageRows: PreviewModuleRow[] = previewContactMessages.map((message) => ({
  id: message.id,
  cells: {
    ref: pl(message.id),
    title: { kind: "text", value: message.subject },
    name: { kind: "text", value: message.name },
    date: dt(message.receivedAt),
    status: st(message.status),
  },
}));

const basePreviewModuleTables: Partial<Record<DashboardModuleKey, PreviewModuleTable>> = {
  customers: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "name", labelKey: "name" },
      { id: "phone", labelKey: "phone" },
      { id: "city", labelKey: "city" },
      { id: "projects", labelKey: "projects" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewCustomerRows,
  },
  engineers: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "name", labelKey: "name" },
      { id: "type", labelKey: "type" },
      { id: "phone", labelKey: "phone" },
    ],
    rows: previewEngineerRows,
  },
  finance: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "title", labelKey: "title" },
      { id: "customer", labelKey: "customer" },
      { id: "date", labelKey: "dueDate" },
      { id: "amount", labelKey: "amount" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewFinanceRows,
  },
  purchases: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "supplier", labelKey: "supplier" },
      { id: "project", labelKey: "project" },
      { id: "date", labelKey: "date" },
      { id: "amount", labelKey: "amount" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewPurchaseRows,
  },
  complaints: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "title", labelKey: "title" },
      { id: "customer", labelKey: "customer" },
      { id: "date", labelKey: "date" },
      { id: "priority", labelKey: "priority" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewComplaintRows,
  },
  messages: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "title", labelKey: "title" },
      { id: "name", labelKey: "name" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewMessageRows,
  },
  inspections: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "customer", labelKey: "customer" },
      { id: "service", labelKey: "service" },
      { id: "date", labelKey: "date" },
      { id: "assignee", labelKey: "assignee" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "i1",
        cells: {
          ref: pl("PV-IN-41"),
          customer: tx("العميل ٠٣", "Client 03"),
          service: tx("السباكة والحمامات", "Plumbing & Bathrooms"),
          date: dt("2026-10-23"),
          assignee: tx("مهندس معاينات ب", "Inspection Engineer B"),
          status: st("inspection_scheduled"),
        },
      },
      {
        id: "i2",
        cells: {
          ref: pl("PV-IN-40"),
          customer: tx("العميلة ٠٢", "Client 02"),
          service: tx("المطابخ", "Kitchens"),
          date: dt("2026-10-24"),
          assignee: tx("منسّق أ", "Coordinator A"),
          status: st("inspection_scheduled"),
        },
      },
      {
        id: "i3",
        cells: {
          ref: pl("PV-IN-39"),
          customer: tx("العميل ٠٤", "Client 04"),
          service: tx("الواجهات", "Facades"),
          date: dt("2026-10-16"),
          assignee: tx("مهندس معاينات ب", "Inspection Engineer B"),
          status: st("inspection_done"),
        },
      },
      {
        id: "i4",
        cells: {
          ref: pl("PV-IN-38"),
          customer: tx("العميلة ٠٥", "Client 05"),
          service: tx("التشطيبات الداخلية", "Interior Finishing"),
          date: dt("2026-10-13"),
          assignee: tx("منسّق أ", "Coordinator A"),
          status: st("inspection_done"),
        },
      },
    ],
  },
  quotations: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "customer", labelKey: "customer" },
      { id: "title", labelKey: "title" },
      { id: "amount", labelKey: "amount" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "q1",
        cells: {
          ref: pl("PV-QT-77"),
          customer: tx("العميلة ٠٥", "Client 05"),
          title: tx("عرض سعر — تشطيب دوبلكس", "Quotation — duplex finishing"),
          amount: mn(485000),
          date: dt("2026-10-15"),
          status: st("sent"),
        },
      },
      {
        id: "q2",
        cells: {
          ref: pl("PV-QT-76"),
          customer: tx("العميل ٠٤", "Client 04"),
          title: tx("عرض سعر — واجهة حجر", "Quotation — stone facade"),
          amount: mn(312000),
          date: dt("2026-10-12"),
          status: st("approved"),
        },
      },
      {
        id: "q3",
        cells: {
          ref: pl("PV-QT-75"),
          customer: tx("العميلة ٠٢", "Client 02"),
          title: tx("مسودة BOQ — مطبخ", "Draft BOQ — kitchen"),
          amount: mn(168500),
          date: dt("2026-10-19"),
          status: st("draft"),
        },
      },
      {
        id: "q4",
        cells: {
          ref: pl("PV-QT-74"),
          customer: tx("العميل ٠٦", "Client 06"),
          title: tx("عرض سعر معتمد — تشطيب داخلي", "Approved quotation — interior"),
          amount: mn(395000),
          date: dt("2026-10-06"),
          status: st("approved"),
        },
      },
    ],
  },
  contracts: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "type", labelKey: "type" },
      { id: "amount", labelKey: "amount" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "ct1",
        cells: {
          ref: pl("PV-CT-12"),
          project: tx("مشروع — تشطيب شقة", "Apartment finishing project"),
          type: tx("عقد تنفيذ", "Execution contract"),
          amount: mn(395000),
          date: dt("2026-10-07"),
          status: st("signed"),
        },
      },
      {
        id: "ct2",
        cells: {
          ref: pl("PV-CO-03"),
          project: tx("مشروع — تشطيب شقة", "Apartment finishing project"),
          type: tx("أمر تغيير: إضافة حجر للمدخل", "Change order: entrance stone"),
          amount: mn(24000),
          date: dt("2026-10-17"),
          status: st("pending"),
        },
      },
      {
        id: "ct3",
        cells: {
          ref: pl("PV-CT-11"),
          project: tx("مشروع — واجهة فيلا", "Villa facade project"),
          type: tx("عقد تنفيذ", "Execution contract"),
          amount: mn(312000),
          date: dt("2026-10-13"),
          status: st("signed"),
        },
      },
    ],
  },
  projects: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "customer", labelKey: "customer" },
      { id: "progress", labelKey: "progress" },
      { id: "milestone", labelKey: "milestone" },
      { id: "status", labelKey: "status" },
    ],
    rows: previewProjectRows,
  },
  milestones: {
    columns: [
      { id: "project", labelKey: "project" },
      { id: "milestone", labelKey: "milestone" },
      { id: "progress", labelKey: "progress" },
      { id: "due", labelKey: "dueDate" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "ms1",
        cells: {
          project: pl("PV-PR-201"),
          milestone: tx("الدهانات والتشطيب النهائي", "Paints & final finishing"),
          progress: pg(45),
          due: dt("2026-10-27"),
          status: st("in_progress"),
        },
      },
      {
        id: "ms2",
        cells: {
          project: pl("PV-PR-201"),
          milestone: tx("الأرضيات والحجر", "Flooring & stone"),
          progress: pg(100),
          due: dt("2026-10-13"),
          status: st("completed"),
        },
      },
      {
        id: "ms3",
        cells: {
          project: pl("PV-PR-202"),
          milestone: tx("تأسيسات سباكة وكهرباء", "Rough-ins"),
          progress: pg(70),
          due: dt("2026-10-25"),
          status: st("in_progress"),
        },
      },
      {
        id: "ms4",
        cells: {
          project: pl("PV-PR-203"),
          milestone: tx("تشطيب المدخل والسور", "Entrance & boundary"),
          progress: pg(80),
          due: dt("2026-10-26"),
          status: st("in_progress"),
        },
      },
    ],
  },
  diary: {
    columns: [
      { id: "date", labelKey: "date" },
      { id: "project", labelKey: "project" },
      { id: "title", labelKey: "title" },
      { id: "actor", labelKey: "actor" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "d1",
        cells: {
          date: dt("2026-10-21"),
          project: pl("PV-PR-201"),
          title: tx(
            "بدء طبقة دهان أولى — معيشة وممر",
            "First paint coat started — living & corridor",
          ),
          actor: tx("مشرف موقع أ", "Site Supervisor A"),
          status: st("completed"),
        },
      },
      {
        id: "d2",
        cells: {
          date: dt("2026-10-20"),
          project: pl("PV-PR-202"),
          title: tx("اختبار شبكة تغذية المطبخ بنجاح", "Kitchen supply network test passed"),
          actor: tx("مشرف موقع ب", "Site Supervisor B"),
          status: st("completed"),
        },
      },
      {
        id: "d3",
        cells: {
          date: dt("2026-10-20"),
          project: pl("PV-PR-203"),
          title: tx("توريد دفعة حجر مدخل", "Entrance stone batch delivered"),
          actor: tx("مشرف موقع أ", "Site Supervisor A"),
          status: st("completed"),
        },
      },
    ],
  },
  progress: {
    columns: [
      { id: "date", labelKey: "date" },
      { id: "project", labelKey: "project" },
      { id: "milestone", labelKey: "milestone" },
      { id: "progress", labelKey: "progress" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "pg1",
        cells: {
          date: dt("2026-10-21"),
          project: pl("PV-PR-201"),
          milestone: tx("الدهانات والتشطيب النهائي", "Paints & final finishing"),
          progress: pg(45),
          status: st("in_progress"),
        },
      },
      {
        id: "pg2",
        cells: {
          date: dt("2026-10-14"),
          project: pl("PV-PR-201"),
          milestone: tx("الأرضيات والحجر", "Flooring & stone"),
          progress: pg(100),
          status: st("completed"),
        },
      },
      {
        id: "pg3",
        cells: {
          date: dt("2026-10-20"),
          project: pl("PV-PR-203"),
          milestone: tx("تشطيب المدخل", "Entrance finishing"),
          progress: pg(80),
          status: st("in_progress"),
        },
      },
    ],
  },
  issues: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "title", labelKey: "title" },
      { id: "severity", labelKey: "severity" },
      { id: "assignee", labelKey: "assignee" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "is1",
        cells: {
          ref: pl("PV-IS-32"),
          project: pl("PV-PR-201"),
          title: tx("ضبط منسوب غطاء صرف الحمام", "Adjust drain cover level"),
          severity: pr("high"),
          assignee: tx("مشرف موقع أ", "Site Supervisor A"),
          status: st("in_progress"),
        },
      },
      {
        id: "is2",
        cells: {
          ref: pl("PV-IS-31"),
          project: pl("PV-PR-201"),
          title: tx("خدش بسطح حجر المدخل", "Entrance stone scratch"),
          severity: pr("normal"),
          assignee: tx("مشرف موقع أ", "Site Supervisor A"),
          status: st("open"),
        },
      },
      {
        id: "is3",
        cells: {
          ref: pl("PV-IS-28"),
          project: pl("PV-PR-203"),
          title: tx("معالجة فاصل حجر عند السور", "Treat stone joint at boundary"),
          severity: pr("normal"),
          assignee: tx("مشرف موقع ب", "Site Supervisor B"),
          status: st("open"),
        },
      },
      {
        id: "is4",
        cells: {
          ref: pl("PV-IS-33"),
          project: pl("PV-PR-201"),
          title: tx("دهان بقعة خلف وحدة تخزين", "Paint patch behind storage"),
          severity: pr("normal"),
          assignee: tx("مشرف موقع أ", "Site Supervisor A"),
          status: st("resolved"),
        },
      },
    ],
  },
  documents: {
    columns: [
      { id: "title", labelKey: "title" },
      { id: "project", labelKey: "project" },
      { id: "type", labelKey: "type" },
      { id: "size", labelKey: "size" },
      { id: "updated", labelKey: "updated" },
    ],
    rows: [
      {
        id: "dc1",
        cells: {
          title: tx("BOQ تشطيب داخلي — نسخة معتمدة", "Approved interior BOQ"),
          project: pl("PV-PR-201"),
          type: tx("مقايسة", "BOQ"),
          size: pl("PDF · 1.2 MB"),
          updated: dt("2026-10-06"),
        },
      },
      {
        id: "dc2",
        cells: {
          title: tx("صور توثيق تأسيسات قبل الإغلاق", "Pre-closing rough-in photos"),
          project: pl("PV-PR-201"),
          type: tx("توثيق مصوّر", "Photo record"),
          size: pl("ZIP · 18 MB"),
          updated: dt("2026-09-28"),
        },
      },
      {
        id: "dc3",
        cells: {
          title: tx("اعتماد خامة حجر المدخل", "Entrance stone approval"),
          project: pl("PV-PR-203"),
          type: tx("محضر اعتماد", "Approval"),
          size: pl("PDF · 340 KB"),
          updated: dt("2026-10-10"),
        },
      },
      {
        id: "dc4",
        cells: {
          title: tx("مخطط توزيع مطبخ معتمد", "Approved kitchen layout"),
          project: pl("PV-PR-202"),
          type: tx("مخطط", "Drawing"),
          size: pl("PDF · 860 KB"),
          updated: dt("2026-10-15"),
        },
      },
    ],
  },
  reports: {
    columns: [
      { id: "week", labelKey: "week" },
      { id: "project", labelKey: "project" },
      { id: "title", labelKey: "title" },
      { id: "progress", labelKey: "progress" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "r1",
        cells: {
          week: pl("W42"),
          project: pl("PV-PR-201"),
          title: tx("تقرير أسبوعي — بدء الدهانات", "Weekly report — paints started"),
          progress: pg(62),
          date: dt("2026-10-18"),
          status: st("sent"),
        },
      },
      {
        id: "r2",
        cells: {
          week: pl("W41"),
          project: pl("PV-PR-201"),
          title: tx("تقرير أسبوعي — إنهاء الأرضيات", "Weekly report — flooring complete"),
          progress: pg(55),
          date: dt("2026-10-11"),
          status: st("sent"),
        },
      },
      {
        id: "r3",
        cells: {
          week: pl("W42"),
          project: pl("PV-PR-203"),
          title: tx("تقرير أسبوعي — أعمال المدخل", "Weekly report — entrance works"),
          progress: pg(85),
          date: dt("2026-10-19"),
          status: st("pending"),
        },
      },
    ],
  },
  quality: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "title", labelKey: "title" },
      { id: "severity", labelKey: "severity" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "ql1",
        cells: {
          ref: pl("PV-SN-09"),
          project: pl("PV-PR-201"),
          title: tx("استواء زاوية حائط الممر", "Corridor wall corner straightness"),
          severity: pr("normal"),
          status: st("open"),
        },
      },
      {
        id: "ql2",
        cells: {
          ref: pl("PV-SN-08"),
          project: pl("PV-PR-201"),
          title: tx("ميول أرضية الحمام نحو الصرف", "Bathroom floor slope to drain"),
          severity: pr("high"),
          status: st("in_progress"),
        },
      },
      {
        id: "ql3",
        cells: {
          ref: pl("PV-SN-07"),
          project: pl("PV-PR-203"),
          title: tx("توحيد سماكة فواصل الحجر", "Uniform stone joint widths"),
          severity: pr("normal"),
          status: st("resolved"),
        },
      },
    ],
  },
  handover: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "customer", labelKey: "customer" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "h1",
        cells: {
          ref: pl("PV-HO-04"),
          project: pl("PV-PR-204"),
          customer: tx("العميل ٠٣", "Client 03"),
          date: dt("2026-10-02"),
          status: st("handed_over"),
        },
      },
      {
        id: "h2",
        cells: {
          ref: pl("PV-HO-05"),
          project: pl("PV-PR-203"),
          customer: tx("العميل ٠٤", "Client 04"),
          date: dt("2026-11-02"),
          status: st("pending"),
        },
      },
    ],
  },
  warranty: {
    columns: [
      { id: "ref", labelKey: "reference" },
      { id: "project", labelKey: "project" },
      { id: "title", labelKey: "title" },
      { id: "date", labelKey: "date" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "w1",
        cells: {
          ref: pl("PV-WR-02"),
          project: pl("PV-PR-204"),
          title: tx("طلب صيانة: ضبط إغلاق باب خشبي", "Maintenance: wooden door closing"),
          date: dt("2026-10-16"),
          status: st("in_progress"),
        },
      },
      {
        id: "w2",
        cells: {
          ref: pl("PV-WR-01"),
          project: pl("PV-PR-204"),
          title: tx("متابعة ما بعد التسليم — ٣٠ يومًا", "30-day post-handover follow-up"),
          date: dt("2026-10-09"),
          status: st("resolved"),
        },
      },
    ],
  },
  notifications: {
    columns: [
      { id: "date", labelKey: "date" },
      { id: "title", labelKey: "title" },
      { id: "entity", labelKey: "entity" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "n1",
        cells: {
          date: dt("2026-10-21"),
          title: tx(
            "طلب خدمة جديد بانتظار أول تواصل",
            "New service request awaiting first contact",
          ),
          entity: pl("PV-RQ-1001"),
          status: st("new"),
        },
      },
      {
        id: "n2",
        cells: {
          date: dt("2026-10-20"),
          title: tx("تحديث نسبة تقدم مشروع", "Project progress updated"),
          entity: pl("PV-PR-201"),
          status: st("sent"),
        },
      },
      {
        id: "n3",
        cells: {
          date: dt("2026-10-19"),
          title: tx("ملاحظة جودة جديدة بسجل التحفظات", "New snag item recorded"),
          entity: pl("PV-SN-09"),
          status: st("sent"),
        },
      },
    ],
  },
  audit: {
    columns: [
      { id: "date", labelKey: "date" },
      { id: "actor", labelKey: "actor" },
      { id: "action", labelKey: "action" },
      { id: "entity", labelKey: "entity" },
      { id: "status", labelKey: "status" },
    ],
    rows: [
      {
        id: "a1",
        cells: {
          date: dt("2026-10-21"),
          actor: tx("مشرف موقع أ", "Site Supervisor A"),
          action: tx("تحديث نسبة إنجاز مرحلة الدهانات", "Updated paint-milestone progress"),
          entity: pl("PV-PR-201"),
          status: st("completed"),
        },
      },
      {
        id: "a2",
        cells: {
          date: dt("2026-10-20"),
          actor: tx("منسّق أ", "Coordinator A"),
          action: tx("تغيير حالة طلب إلى: تم التواصل", "Changed request status to Contacted"),
          entity: pl("PV-RQ-1002"),
          status: st("completed"),
        },
      },
      {
        id: "a3",
        cells: {
          date: dt("2026-10-19"),
          actor: tx("مدير مشاريع ج", "Project Manager C"),
          action: tx("اعتماد تقرير أسبوعي", "Approved weekly report"),
          entity: pl("PV-PR-201 · W42"),
          status: st("completed"),
        },
      },
      {
        id: "a4",
        cells: {
          date: dt("2026-10-18"),
          actor: tx("مهندس معاينات ب", "Inspection Engineer B"),
          action: tx("جدولة معاينة جديدة", "Scheduled a new inspection"),
          entity: pl("PV-IN-41"),
          status: st("completed"),
        },
      },
    ],
  },
};

/**
 * Explicit relational index for the generic preview tables. Only links already
 * supported by a record reference, project reference, named preview client, or
 * matching existing quotation/contract record are declared here.
 */
const previewRecordLinksByModule: Partial<
  Record<DashboardModuleKey, Record<string, PreviewRecordLinks>>
> = {
  inspections: {
    i1: { customerId: "PV-CU-03", requestId: "PV-RQ-1003" },
    i2: { customerId: "PV-CU-02", requestId: "PV-RQ-1002" },
    i3: { customerId: "PV-CU-04", requestId: "PV-RQ-1004" },
    i4: { customerId: "PV-CU-05", requestId: "PV-RQ-1005" },
  },
  quotations: {
    q1: { customerId: "PV-CU-05", requestId: "PV-RQ-1005" },
    q2: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
    q3: { customerId: "PV-CU-02", requestId: "PV-RQ-1002" },
    q4: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
  },
  contracts: {
    ct1: {
      customerId: "PV-CU-06",
      projectId: "PV-PR-201",
      quotationId: "PV-QT-74",
      contractId: "PV-CT-12",
    },
    ct2: {
      customerId: "PV-CU-06",
      projectId: "PV-PR-201",
      quotationId: "PV-QT-74",
      contractId: "PV-CT-12",
    },
    ct3: {
      customerId: "PV-CU-04",
      projectId: "PV-PR-203",
      quotationId: "PV-QT-76",
      contractId: "PV-CT-11",
    },
  },
  milestones: {
    ms1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    ms2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    ms3: { customerId: "PV-CU-02", projectId: "PV-PR-202" },
    ms4: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
  },
  diary: {
    d1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    d2: { customerId: "PV-CU-02", projectId: "PV-PR-202" },
    d3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
  },
  progress: {
    pg1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    pg2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    pg3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
  },
  issues: {
    is1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    is2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    is3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
    is4: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
  },
  documents: {
    dc1: { customerId: "PV-CU-06", projectId: "PV-PR-201", quotationId: "PV-QT-74" },
    dc2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    dc3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
    dc4: { customerId: "PV-CU-02", projectId: "PV-PR-202" },
  },
  reports: {
    r1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    r2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    r3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
  },
  quality: {
    ql1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    ql2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    ql3: { customerId: "PV-CU-04", projectId: "PV-PR-203" },
  },
  handover: {
    h1: { customerId: "PV-CU-03", projectId: "PV-PR-204" },
    h2: { customerId: "PV-CU-04", projectId: "PV-PR-203", contractId: "PV-CT-11" },
  },
  warranty: {
    w1: { customerId: "PV-CU-03", projectId: "PV-PR-204" },
    w2: { customerId: "PV-CU-03", projectId: "PV-PR-204" },
  },
  notifications: {
    n1: { customerId: "PV-CU-01", requestId: "PV-RQ-1001" },
    n2: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    n3: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
  },
  audit: {
    a1: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    a2: { customerId: "PV-CU-02", requestId: "PV-RQ-1002" },
    a3: { customerId: "PV-CU-06", projectId: "PV-PR-201" },
    a4: { customerId: "PV-CU-03", requestId: "PV-RQ-1003" },
  },
};

export const previewModuleTables: Partial<Record<DashboardModuleKey, PreviewModuleTable>> =
  Object.fromEntries(
    Object.entries(basePreviewModuleTables).map(([moduleKey, table]) => [
      moduleKey,
      table
        ? {
            ...table,
            rows: table.rows.map((row) => ({
              ...row,
              links:
                row.links ?? previewRecordLinksByModule[moduleKey as DashboardModuleKey]?.[row.id],
            })),
          }
        : table,
    ]),
  ) as Partial<Record<DashboardModuleKey, PreviewModuleTable>>;

export function countPreviewModuleStatus(module: DashboardModuleKey, status: string): number {
  return (
    previewModuleTables[module]?.rows.filter((row) =>
      Object.values(row.cells).some((cell) => cell.kind === "status" && cell.value === status),
    ).length ?? 0
  );
}

/** Portal list datasets. */
export const previewPortalQuotations = [
  {
    id: "PV-QT-74",
    title: t("عرض سعر التشطيب الداخلي المعتمد", "Approved interior finishing quotation"),
    amount: 395000,
    date: "2026-10-06",
    status: "approved",
    note: t("معتمد منك بتاريخ التوثيق الموضح بالمستندات", "Approved by you as documented"),
  },
  {
    id: "PV-CO-03",
    title: t("أمر تغيير: إضافة حجر للمدخل", "Change order: entrance stone addition"),
    amount: 24000,
    date: "2026-10-17",
    status: "pending",
    note: t("بانتظار اعتمادك قبل التنفيذ", "Awaiting your approval before execution"),
  },
];

export const previewPortalReports = [
  {
    id: "PV-RP-42",
    week: "W42",
    title: t("بدء أعمال الدهانات — تقدم ٦٢٪", "Paint works started — 62% progress"),
    date: "2026-10-18",
    status: "sent",
  },
  {
    id: "PV-RP-41",
    week: "W41",
    title: t("اكتمال الأرضيات ومراجعة المناسيب", "Flooring complete and levels reviewed"),
    date: "2026-10-11",
    status: "sent",
  },
  {
    id: "PV-RP-40",
    week: "W40",
    title: t("انتهاء المحارة والأسقف", "Plastering and ceilings finished"),
    date: "2026-10-04",
    status: "sent",
  },
];

export const previewPortalDocuments = [
  {
    id: "dc1",
    title: t("BOQ التشطيب الداخلي المعتمد", "Approved interior BOQ"),
    type: "PDF",
    meta: "1.2 MB",
    date: "2026-10-06",
  },
  {
    id: "dc2",
    title: t("صور توثيق التأسيسات قبل الإغلاق", "Rough-in documentation photos"),
    type: "ZIP",
    meta: "18 MB",
    date: "2026-09-28",
  },
  {
    id: "dc5",
    title: t("محضر اعتماد خامات الدهانات", "Paint materials approval record"),
    type: "PDF",
    meta: "210 KB",
    date: "2026-10-09",
  },
];
