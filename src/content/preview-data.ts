/**
 * SYNTHETIC PREVIEW DATA — FRONTEND DEVELOPMENT ONLY
 * --------------------------------------------------
 * Every record in this file is fabricated for UI demonstration. Names are
 * explicitly suffixed as preview records, phone numbers are placeholders,
 * and amounts/dates are illustrative. Nothing here is a real Black X
 * customer, project or transaction, and none of it may be shown on the
 * public website as company work. Replace this module with real API/data
 * services in the backend phase.
 */
import type { LocalizedText } from "@/lib/i18n";

const t = (ar: string, en: string): LocalizedText => ({ ar, en });

/** Latest dated activity represented by the synthetic admin snapshot. */
export const previewSnapshotDate = "2026-10-21";

export type PreviewRequest = {
  id: string;
  customerId: string;
  customerName: LocalizedText;
  phone: string;
  serviceSlug: string;
  serviceLabel: LocalizedText;
  city: LocalizedText;
  submittedAt: string;
  status: string;
  priority: "normal" | "high" | "urgent";
  assignee: LocalizedText | null;
  description: LocalizedText;
  history: Array<{ status: string; at: string; note: LocalizedText }>;
};

export const previewRequests: PreviewRequest[] = [
  {
    id: "PV-RQ-1001",
    customerId: "PV-CU-01",
    customerName: t("عميل معاينة ٠١", "Preview Client 01"),
    phone: "0100 000 1001",
    serviceSlug: "interior-finishing",
    serviceLabel: t("التشطيبات الداخلية", "Interior Finishing"),
    city: t("التجمع الخامس (تجريبي)", "Fifth Settlement (preview)"),
    submittedAt: "2026-10-18",
    status: "new",
    priority: "high",
    assignee: null,
    description: t(
      "شقة نصف تشطيب — مطلوب استكمال التشطيبات الداخلية كاملة. (وصف تجريبي)",
      "Semi-finished apartment — full interior finishing requested. (Preview description)",
    ),
    history: [
      {
        status: "new",
        at: "2026-10-18",
        note: t("وصل الطلب عبر نموذج الموقع", "Received via the website form"),
      },
    ],
  },
  {
    id: "PV-RQ-1002",
    customerId: "PV-CU-02",
    customerName: t("عميلة معاينة ٠٢", "Preview Client 02"),
    phone: "0100 000 1002",
    serviceSlug: "kitchens",
    serviceLabel: t("المطابخ", "Kitchens"),
    city: t("مدينة نصر (تجريبي)", "Nasr City (preview)"),
    submittedAt: "2026-10-17",
    status: "contacted",
    priority: "normal",
    assignee: t("منسق معاينة أ", "Preview Coordinator A"),
    description: t(
      "تجديد مطبخ قائم وتغيير الوحدات والسطح. (وصف تجريبي)",
      "Existing-kitchen renewal with new units and worktop. (Preview description)",
    ),
    history: [
      {
        status: "new",
        at: "2026-10-17",
        note: t("وصل الطلب عبر نموذج الموقع", "Received via the website form"),
      },
      {
        status: "contacted",
        at: "2026-10-18",
        note: t("تم الاتصال وتأكيد البيانات الأساسية", "Called and confirmed basic details"),
      },
    ],
  },
  {
    id: "PV-RQ-1003",
    customerId: "PV-CU-03",
    customerName: t("عميل معاينة ٠٣", "Preview Client 03"),
    phone: "0100 000 1003",
    serviceSlug: "plumbing-bathrooms",
    serviceLabel: t("السباكة والحمامات", "Plumbing & Bathrooms"),
    city: t("الشروق (تجريبي)", "El Shorouk (preview)"),
    submittedAt: "2026-10-16",
    status: "inspection_scheduled",
    priority: "urgent",
    assignee: t("مهندس معاينات ب", "Preview Inspector B"),
    description: t(
      "تجديد حمامين مع تغيير شبكة الصرف الداخلية. (وصف تجريبي)",
      "Two bathrooms renewal including internal drainage replacement. (Preview description)",
    ),
    history: [
      {
        status: "new",
        at: "2026-10-16",
        note: t("وصل الطلب عبر نموذج الموقع", "Received via the website form"),
      },
      { status: "contacted", at: "2026-10-16", note: t("تم الاتصال", "Called") },
      {
        status: "inspection_scheduled",
        at: "2026-10-17",
        note: t("مجدولة خلال يومين عمل", "Scheduled within two working days"),
      },
    ],
  },
  {
    id: "PV-RQ-1004",
    customerId: "PV-CU-04",
    customerName: t("عميل معاينة ٠٤", "Preview Client 04"),
    phone: "0100 000 1004",
    serviceSlug: "exterior-facades",
    serviceLabel: t("التشطيبات الخارجية والواجهات", "Exterior & Facades"),
    city: t("أكتوبر (تجريبي)", "6th of October (preview)"),
    submittedAt: "2026-10-14",
    status: "inspection_done",
    priority: "normal",
    assignee: t("مهندس معاينات ب", "Preview Inspector B"),
    description: t(
      "واجهة فيلا — حجر طبيعي مع معالجة أسطح. (وصف تجريبي)",
      "Villa facade — natural stone with surface treatment. (Preview description)",
    ),
    history: [
      { status: "new", at: "2026-10-14", note: t("وصل الطلب", "Received") },
      {
        status: "inspection_done",
        at: "2026-10-16",
        note: t("تمت المعاينة ورفع المقاسات", "Inspection done, measurements taken"),
      },
    ],
  },
  {
    id: "PV-RQ-1005",
    customerId: "PV-CU-05",
    customerName: t("عميلة معاينة ٠٥", "Preview Client 05"),
    phone: "0100 000 1005",
    serviceSlug: "interior-finishing",
    serviceLabel: t("التشطيبات الداخلية", "Interior Finishing"),
    city: t("زايد (تجريبي)", "Zayed (preview)"),
    submittedAt: "2026-10-12",
    status: "quotation_sent",
    priority: "normal",
    assignee: t("منسق معاينة أ", "Preview Coordinator A"),
    description: t(
      "تشطيب دوبلكس — أرضيات وحجر ودهانات. (وصف تجريبي)",
      "Duplex finishing — flooring, stone and paints. (Preview description)",
    ),
    history: [
      { status: "new", at: "2026-10-12", note: t("وصل الطلب", "Received") },
      { status: "inspection_done", at: "2026-10-13", note: t("تمت المعاينة", "Inspection done") },
      {
        status: "quotation_sent",
        at: "2026-10-15",
        note: t("أُرسل المقترح للمراجعة", "Proposal sent for review"),
      },
    ],
  },
  {
    id: "PV-RQ-1006",
    customerId: "PV-CU-06",
    customerName: t("عميل معاينة ٠٦", "Preview Client 06"),
    phone: "0100 000 1006",
    serviceSlug: "building-restoration",
    serviceLabel: t("البناء وإعادة الترميم", "Building & Restoration"),
    city: t("المنصورة (تجريبي)", "Mansoura (preview)"),
    submittedAt: "2026-10-10",
    status: "approved",
    priority: "high",
    assignee: t("مدير مشاريع ج", "Preview PM C"),
    description: t(
      "ترميم وحدة قديمة وإعادة تقسيم جزئي. (وصف تجريبي)",
      "Old-unit restoration with partial re-partitioning. (Preview description)",
    ),
    history: [
      { status: "new", at: "2026-10-10", note: t("وصل الطلب", "Received") },
      {
        status: "approved",
        at: "2026-10-14",
        note: t("اعتمد العميل المقترح", "Client approved the proposal"),
      },
    ],
  },
  {
    id: "PV-RQ-1007",
    customerId: "PV-CU-07",
    customerName: t("عميل معاينة ٠٧", "Preview Client 07"),
    phone: "0100 000 1007",
    serviceSlug: "materials-supply",
    serviceLabel: t("توريد المواد", "Materials Supply"),
    city: t("هليوبوليس (تجريبي)", "Heliopolis (preview)"),
    submittedAt: "2026-10-08",
    status: "on_hold",
    priority: "normal",
    assignee: t("منسق معاينة أ", "Preview Coordinator A"),
    description: t(
      "توريد حجر وبورسلين ضمن مشروع قائم. (وصف تجريبي)",
      "Stone and porcelain supply within an ongoing project. (Preview description)",
    ),
    history: [
      {
        status: "on_hold",
        at: "2026-10-11",
        note: t("بانتظار اعتماد العينة", "Awaiting sample approval"),
      },
    ],
  },
  {
    id: "PV-RQ-1008",
    customerId: "PV-CU-08",
    customerName: t("عميلة معاينة ٠٨", "Preview Client 08"),
    phone: "0100 000 1008",
    serviceSlug: "kitchens",
    serviceLabel: t("المطابخ", "Kitchens"),
    city: t("المعادي (تجريبي)", "Maadi (preview)"),
    submittedAt: "2026-10-05",
    status: "cancelled",
    priority: "normal",
    assignee: null,
    description: t(
      "طلب أُلغي بطلب العميل قبل المعاينة. (سجل تجريبي)",
      "Request cancelled by the client before inspection. (Preview record)",
    ),
    history: [
      {
        status: "cancelled",
        at: "2026-10-06",
        note: t("أُلغي بطلب العميل", "Cancelled at client's request"),
      },
    ],
  },
];

export type PreviewProject = {
  id: string;
  title: LocalizedText;
  customerId: string;
  customer: LocalizedText;
  quotationId?: string;
  contractId?: string;
  serviceLabel: LocalizedText;
  progress: number;
  status: string;
  currentMilestone: LocalizedText;
  updatedAt: string;
  image: string;
};

export const previewProjects: PreviewProject[] = [
  {
    id: "PV-PR-201",
    title: t("مشروع معاينة — تشطيب شقة سكنية", "Preview Project — Apartment Finishing"),
    customerId: "PV-CU-06",
    customer: t("عميل معاينة ٠٦", "Preview Client 06"),
    quotationId: "PV-QT-74",
    contractId: "PV-CT-12",
    serviceLabel: t("التشطيبات الداخلية", "Interior Finishing"),
    progress: 62,
    status: "in_progress",
    currentMilestone: t("أعمال الدهانات — الطبقة الأولى", "Paint works — first coat"),
    updatedAt: "2026-10-20",
    image: "/images/interior-living.jpg",
  },
  {
    id: "PV-PR-202",
    title: t("مشروع معاينة — مطبخ وحمام", "Preview Project — Kitchen & Bathroom"),
    customerId: "PV-CU-02",
    customer: t("عميلة معاينة ٠٢", "Preview Client 02"),
    serviceLabel: t("المطابخ", "Kitchens"),
    progress: 35,
    status: "in_progress",
    currentMilestone: t("تأسيسات سباكة وكهرباء", "Plumbing & electrical rough-ins"),
    updatedAt: "2026-10-19",
    image: "/images/kitchen.jpg",
  },
  {
    id: "PV-PR-203",
    title: t("مشروع معاينة — واجهة فيلا", "Preview Project — Villa Facade"),
    customerId: "PV-CU-04",
    customer: t("عميل معاينة ٠٤", "Preview Client 04"),
    quotationId: "PV-QT-76",
    contractId: "PV-CT-11",
    serviceLabel: t("التشطيبات الخارجية والواجهات", "Exterior & Facades"),
    progress: 85,
    status: "in_progress",
    currentMilestone: t("تشطيب تفاصيل المدخل", "Entrance detail finishing"),
    updatedAt: "2026-10-21",
    image: "/images/facade-detail.jpg",
  },
  {
    id: "PV-PR-204",
    title: t("مشروع معاينة — ترميم وحدة قديمة", "Preview Project — Old Unit Restoration"),
    customerId: "PV-CU-03",
    customer: t("عميل معاينة ٠٣", "Preview Client 03"),
    serviceLabel: t("البناء وإعادة الترميم", "Building & Restoration"),
    progress: 100,
    status: "handed_over",
    currentMilestone: t("تم التسليم ومراجعة الملاحظات", "Handed over, snags reviewed"),
    updatedAt: "2026-10-02",
    image: "/images/staircase.jpg",
  },
];

export type PreviewMilestone = {
  id: string;
  projectId: string;
  title: LocalizedText;
  detail: LocalizedText;
  state: "done" | "current" | "upcoming";
  progress: number;
  plannedDate: string;
};

export const previewMilestones: PreviewMilestone[] = [
  {
    id: "m1",
    projectId: "PV-PR-201",
    title: t("التجهيز والحماية", "Preparation & protection"),
    detail: t(
      "حماية الأسطح القائمة وتجهيز منطقة العمل",
      "Protecting existing surfaces and preparing the work area",
    ),
    state: "done",
    progress: 100,
    plannedDate: "2026-09-14",
  },
  {
    id: "m2",
    projectId: "PV-PR-201",
    title: t("التأسيسات", "Rough-ins"),
    detail: t(
      "سباكة وكهرباء واختبارات قبل الإغلاق",
      "Plumbing and electrical with pre-closing tests",
    ),
    state: "done",
    progress: 100,
    plannedDate: "2026-09-28",
  },
  {
    id: "m3",
    projectId: "PV-PR-201",
    title: t("المحارة والأسقف", "Plastering & ceilings"),
    detail: t("محارة وأسقف ومراجعة المناسيب", "Plastering, ceilings and level checks"),
    state: "done",
    progress: 100,
    plannedDate: "2026-10-06",
  },
  {
    id: "m4",
    projectId: "PV-PR-201",
    title: t("الأرضيات والحجر", "Flooring & stone"),
    detail: t(
      "تركيب الأرضيات وبنود الحجر المتفق عليها",
      "Flooring installation and agreed stone items",
    ),
    state: "done",
    progress: 100,
    plannedDate: "2026-10-13",
  },
  {
    id: "m5",
    projectId: "PV-PR-201",
    title: t("الدهانات والتشطيب النهائي", "Paints & final finishing"),
    detail: t(
      "معجون ودهانات وتشطيبات نهائية بالتوازي مع الحماية",
      "Filler, paints and final finishes with ongoing protection",
    ),
    state: "current",
    progress: 45,
    plannedDate: "2026-10-27",
  },
  {
    id: "m6",
    projectId: "PV-PR-201",
    title: t("مراجعة الجودة والتسليم", "Quality review & handover"),
    detail: t(
      "قائمة تحفظات ومراجعة مشتركة قبل التسليم",
      "Snag list and joint review before handover",
    ),
    state: "upcoming",
    progress: 0,
    plannedDate: "2026-11-03",
  },
];

export const previewPortalClient = {
  id: "PV-CU-06",
  name: t("عميل معاينة ٠٦", "Preview Client 06"),
  phone: "0100 000 1006",
  email: "preview-client@example.com",
  projectId: "PV-PR-201",
};

export const previewPortalProjects: PreviewProject[] = previewProjects.filter(
  (project) => project.customerId === previewPortalClient.id,
);

export const previewPortalCurrentProject: PreviewProject =
  previewPortalProjects.find((project) => project.id === previewPortalClient.projectId) ??
  previewPortalProjects[0]!;

export function getPreviewPortalProject(id: string): PreviewProject | undefined {
  return previewPortalProjects.find((project) => project.id === id);
}

export type PreviewIssue = {
  id: string;
  projectId: string;
  phase: LocalizedText;
  title: LocalizedText;
  location: LocalizedText;
  detail: LocalizedText;
  correctiveAction: LocalizedText;
  assignee: LocalizedText;
  status: string;
  severity: "normal" | "high" | "urgent";
  reportedAt: string;
};

export const previewIssues: PreviewIssue[] = [
  {
    id: "PV-IS-31",
    projectId: "PV-PR-201",
    phase: t("الأرضيات والحجر", "Flooring & stone"),
    title: t("خدش بسطح حجر المدخل", "Scratch on entrance stone surface"),
    location: t("المدخل الرئيسي", "Main entrance"),
    detail: t(
      "خدش سطحي ظهر بعد نقل خامة — مطلوب معالجة وتلميع. (ملاحظة تجريبية)",
      "Surface scratch after moving material — treatment and polishing required. (Preview issue)",
    ),
    correctiveAction: t(
      "معالجة السطح وتلميعه ثم إعادة الفحص",
      "Treat and polish the surface, then re-inspect",
    ),
    assignee: t("مشرف موقع أ", "Preview Supervisor A"),
    status: "open",
    severity: "normal",
    reportedAt: "2026-10-19",
  },
  {
    id: "PV-IS-32",
    projectId: "PV-PR-201",
    phase: t("التأسيسات", "Rough-ins"),
    title: t("ضبط منسوب غطاء صرف الحمام", "Adjust bathroom drain cover level"),
    location: t("حمام رئيسي", "Master bathroom"),
    detail: t(
      "غطاء الصرف أعلى من منسوب الأرضية بشكل بسيط. (ملاحظة تجريبية)",
      "Drain cover sits slightly above floor level. (Preview issue)",
    ),
    correctiveAction: t(
      "إعادة ضبط منسوب الغطاء واختبار تصريف المياه",
      "Reset the cover level and test drainage",
    ),
    assignee: t("مشرف موقع أ", "Preview Supervisor A"),
    status: "in_progress",
    severity: "high",
    reportedAt: "2026-10-18",
  },
  {
    id: "PV-IS-33",
    projectId: "PV-PR-201",
    phase: t("الدهانات والتشطيب النهائي", "Paints & final finishing"),
    title: t("دهان بقعة خلف وحدة التخزين", "Paint patch behind storage unit"),
    location: t("غرفة المعيشة", "Living room"),
    detail: t(
      "اختلاف درجة بسيط في بقعة محدودة — يحتاج إعادة دهان للجزء. (ملاحظة تجريبية)",
      "Slight shade difference in a small patch — repaint of the section needed. (Preview issue)",
    ),
    correctiveAction: t(
      "إعادة دهان الجزء المتأثر ومطابقة الدرجة",
      "Repaint the affected section and match the shade",
    ),
    assignee: t("مشرف موقع أ", "Preview Supervisor A"),
    status: "resolved",
    severity: "normal",
    reportedAt: "2026-10-15",
  },
];

export const previewTodayTasks = [
  {
    id: "tk1",
    title: t("اتصال أول بطلب PV-RQ-1001", "First call for request PV-RQ-1001"),
    sub: t("طلب جديد بانتظار التواصل منذ أمس", "New request waiting since yesterday"),
    meta: t("أولوية عالية", "High priority"),
  },
  {
    id: "tk2",
    title: t("معاينة حمامات — الشروق (تجريبي)", "Bathrooms inspection — Shorouk (preview)"),
    sub: t("مهندس معاينات ب — مراجعة شبكة الصرف", "Preview Inspector B — drainage review"),
    meta: t("اليوم", "Today"),
  },
  {
    id: "tk3",
    title: t("مراجعة ملاحظة غطاء الصرف", "Review drain-cover issue"),
    sub: t("مشروع معاينة PV-PR-201", "Preview project PV-PR-201"),
    meta: t("قيد التنفيذ", "In progress"),
  },
  {
    id: "tk4",
    title: t(
      "اعتماد تقرير الأسبوع قبل إرساله للعميل",
      "Approve weekly report before sending to client",
    ),
    sub: t("تقرير أسبوعي تجريبي", "Preview weekly report"),
    meta: t("اليوم", "Today"),
  },
];
