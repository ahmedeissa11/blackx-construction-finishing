import type { LocalizedText } from "@/lib/i18n";

/**
 * Isolated presentation fixtures for the frontend-expansion modules
 * (phases, team directory, finance, purchases, complaints, contact
 * messages). These are synthetic identifiers (PV-*) used only by the
 * current frontend review build; they are not real customers, staff,
 * transactions, balances, or published data, and nothing here is
 * persisted. All money values are EGP major units presented with the
 * shared `formatMoney` helper. Dates are anchored to the same review
 * snapshot date used by `preview-data.ts` (2026-10-21).
 */

/* ---------------- Project phases (contracting / finishing / furnishing) ---------------- */

export type PreviewPhaseType = "contracting" | "finishing" | "furnishing";

export type PreviewPhaseStatus =
  "not_started" | "in_progress" | "on_hold" | "stopped" | "cancelled" | "completed";

export type PreviewPhase = {
  id: string;
  rootProjectId: string;
  type: PreviewPhaseType;
  title: LocalizedText;
  status: PreviewPhaseStatus;
  progress: number;
  engineerId: string | null;
  predecessorPhaseId?: string;
  startedAt?: string;
  updatedAt: string;
  statusReason?: LocalizedText;
};

export const previewPhases: PreviewPhase[] = [
  {
    id: "PV-PH-201-1",
    rootProjectId: "PV-PR-201",
    type: "contracting",
    title: { ar: "أعمال المقاولة والتأسيس", en: "Contracting and base works" },
    status: "completed",
    progress: 100,
    engineerId: "PV-EN-03",
    startedAt: "2026-06-01",
    updatedAt: "2026-08-15",
  },
  {
    id: "PV-PH-201-2",
    rootProjectId: "PV-PR-201",
    type: "finishing",
    title: { ar: "أعمال التشطيب", en: "Finishing works" },
    status: "in_progress",
    progress: 62,
    engineerId: "PV-EN-04",
    predecessorPhaseId: "PV-PH-201-1",
    startedAt: "2026-08-18",
    updatedAt: "2026-10-20",
  },
  {
    id: "PV-PH-201-3",
    rootProjectId: "PV-PR-201",
    type: "furnishing",
    title: { ar: "أعمال الفرش الاختيارية", en: "Optional furnishing works" },
    status: "not_started",
    progress: 0,
    engineerId: null,
    predecessorPhaseId: "PV-PH-201-2",
    updatedAt: "2026-10-18",
  },
  {
    id: "PV-PH-202-1",
    rootProjectId: "PV-PR-202",
    type: "finishing",
    title: { ar: "أعمال تشطيب المطبخ", en: "Kitchen finishing works" },
    status: "in_progress",
    progress: 35,
    engineerId: "PV-EN-04",
    startedAt: "2026-09-10",
    updatedAt: "2026-10-19",
  },
  {
    id: "PV-PH-202-2",
    rootProjectId: "PV-PR-202",
    type: "furnishing",
    title: { ar: "فرش الأجهزة والمعدات", en: "Appliances and fittings furnishing" },
    status: "stopped",
    progress: 0,
    engineerId: null,
    predecessorPhaseId: "PV-PH-202-1",
    updatedAt: "2026-10-12",
    statusReason: {
      ar: "متوقفة بانتظار اعتماد العميل للأجهزة النهائية.",
      en: "Stopped pending the customer's final appliance selection.",
    },
  },
  {
    id: "PV-PH-203-1",
    rootProjectId: "PV-PR-203",
    type: "contracting",
    title: { ar: "أعمال المقاولة والتأسيس", en: "Contracting and base works" },
    status: "completed",
    progress: 100,
    engineerId: "PV-EN-03",
    startedAt: "2026-05-11",
    updatedAt: "2026-07-20",
  },
  {
    id: "PV-PH-203-2",
    rootProjectId: "PV-PR-203",
    type: "finishing",
    title: { ar: "أعمال التشطيب", en: "Finishing works" },
    status: "in_progress",
    progress: 85,
    engineerId: "PV-EN-04",
    predecessorPhaseId: "PV-PH-203-1",
    startedAt: "2026-07-24",
    updatedAt: "2026-10-21",
  },
  {
    id: "PV-PH-203-3",
    rootProjectId: "PV-PR-203",
    type: "furnishing",
    title: { ar: "أعمال الفرش الاختيارية", en: "Optional furnishing works" },
    status: "on_hold",
    progress: 0,
    engineerId: null,
    predecessorPhaseId: "PV-PH-203-2",
    updatedAt: "2026-10-05",
    statusReason: {
      ar: "معلّقة بطلب العميل لحين الانتهاء من التشطيب.",
      en: "On hold at the customer's request until finishing is complete.",
    },
  },
  {
    id: "PV-PH-204-1",
    rootProjectId: "PV-PR-204",
    type: "contracting",
    title: { ar: "أعمال المقاولة والتأسيس", en: "Contracting and base works" },
    status: "completed",
    progress: 100,
    engineerId: "PV-EN-03",
    startedAt: "2026-02-16",
    updatedAt: "2026-04-12",
  },
  {
    id: "PV-PH-204-2",
    rootProjectId: "PV-PR-204",
    type: "finishing",
    title: { ar: "أعمال التشطيب", en: "Finishing works" },
    status: "completed",
    progress: 100,
    engineerId: "PV-EN-04",
    predecessorPhaseId: "PV-PH-204-1",
    startedAt: "2026-04-15",
    updatedAt: "2026-08-02",
  },
  {
    id: "PV-PH-204-3",
    rootProjectId: "PV-PR-204",
    type: "furnishing",
    title: { ar: "أعمال الفرش الاختيارية", en: "Optional furnishing works" },
    status: "cancelled",
    progress: 0,
    engineerId: null,
    predecessorPhaseId: "PV-PH-204-2",
    updatedAt: "2026-07-28",
    statusReason: {
      ar: "أُلغيت بالاتفاق قبل البدء ولم تُنفذ.",
      en: "Cancelled by agreement before starting and never executed.",
    },
  },
];

/* ---------------- Team directory (names already used as assignees) ---------------- */

export type PreviewEngineerRole =
  "coordinator" | "inspection_engineer" | "project_manager" | "site_supervisor";

export type PreviewEngineer = {
  id: string;
  name: LocalizedText;
  role: PreviewEngineerRole;
  phone: string;
};

export const previewEngineers: PreviewEngineer[] = [
  {
    id: "PV-EN-01",
    name: { ar: "منسّق أ", en: "Coordinator A" },
    role: "coordinator",
    phone: "0100 000 2001",
  },
  {
    id: "PV-EN-02",
    name: { ar: "مهندس معاينات ب", en: "Inspection Engineer B" },
    role: "inspection_engineer",
    phone: "0100 000 2002",
  },
  {
    id: "PV-EN-03",
    name: { ar: "مدير مشاريع ج", en: "Project Manager C" },
    role: "project_manager",
    phone: "0100 000 2003",
  },
  {
    id: "PV-EN-04",
    name: { ar: "مشرف موقع أ", en: "Site Supervisor A" },
    role: "site_supervisor",
    phone: "0100 000 2004",
  },
];

/* ---------------- Finance: dues, payments, allocations, expenses ---------------- */

export type PreviewPaymentMethod =
  "cash" | "instapay" | "fawry" | "bank_transfer" | "vodafone_cash";

export type PreviewDue = {
  id: string;
  customerId: string;
  projectId: string;
  phaseId?: string;
  label: LocalizedText;
  dueDate: string;
  amount: number;
};

export type PreviewPayment = {
  id: string;
  customerId: string;
  projectId: string;
  paidAt: string;
  method: PreviewPaymentMethod;
  amount: number;
  allocations: Array<{ dueId: string; amount: number }>;
};

export type PreviewExpense = {
  id: string;
  projectId: string;
  phaseId?: string;
  category: LocalizedText;
  date: string;
  amount: number;
  note: LocalizedText;
};

export const previewDues: PreviewDue[] = [
  {
    id: "PV-DU-201-1",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-1",
    label: { ar: "دفعة بدء أعمال المقاولة", en: "Contracting works start installment" },
    dueDate: "2026-06-05",
    amount: 450000,
  },
  {
    id: "PV-DU-201-2",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    label: { ar: "دفعة تقدم أعمال التشطيب", en: "Finishing works progress installment" },
    dueDate: "2026-10-01",
    amount: 380000,
  },
  {
    id: "PV-DU-201-3",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    label: { ar: "دفعة ما قبل التسليم", en: "Pre-handover installment" },
    dueDate: "2026-11-15",
    amount: 320000,
  },
  {
    id: "PV-DU-201-4",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    label: { ar: "الدفعة النهائية عند التسليم", en: "Final installment at handover" },
    dueDate: "2026-12-20",
    amount: 150000,
  },
  {
    id: "PV-DU-202-1",
    customerId: "PV-CU-02",
    projectId: "PV-PR-202",
    phaseId: "PV-PH-202-1",
    label: { ar: "دفعة بدء تشطيب المطبخ", en: "Kitchen finishing start installment" },
    dueDate: "2026-09-15",
    amount: 180000,
  },
  {
    id: "PV-DU-203-1",
    customerId: "PV-CU-04",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-1",
    label: { ar: "دفعة بدء أعمال المقاولة", en: "Contracting works start installment" },
    dueDate: "2026-05-20",
    amount: 600000,
  },
  {
    id: "PV-DU-203-2",
    customerId: "PV-CU-04",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-2",
    label: { ar: "دفعة إتمام أعمال التشطيب", en: "Finishing completion installment" },
    dueDate: "2026-11-30",
    amount: 250000,
  },
];

export const previewPayments: PreviewPayment[] = [
  {
    id: "PV-PA-9001",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    paidAt: "2026-06-04",
    method: "bank_transfer",
    amount: 450000,
    allocations: [{ dueId: "PV-DU-201-1", amount: 450000 }],
  },
  {
    id: "PV-PA-9002",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    paidAt: "2026-10-10",
    method: "instapay",
    amount: 200000,
    allocations: [{ dueId: "PV-DU-201-2", amount: 200000 }],
  },
  {
    id: "PV-PA-9003",
    customerId: "PV-CU-04",
    projectId: "PV-PR-203",
    paidAt: "2026-05-19",
    method: "cash",
    amount: 600000,
    allocations: [{ dueId: "PV-DU-203-1", amount: 600000 }],
  },
];

export const previewExpenses: PreviewExpense[] = [
  {
    id: "PV-EX-801",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    category: { ar: "خامات", en: "Materials" },
    date: "2026-09-12",
    amount: 210000,
    note: { ar: "خامات تشطيب أساسية للوحدة.", en: "Core finishing materials for the unit." },
  },
  {
    id: "PV-EX-802",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    category: { ar: "مصنعيات", en: "Labor" },
    date: "2026-10-03",
    amount: 165000,
    note: { ar: "مصنعيات بنود التشطيب المنفذة.", en: "Labor for executed finishing items." },
  },
  {
    id: "PV-EX-803",
    projectId: "PV-PR-201",
    category: { ar: "مصروفات موقع", en: "Site expenses" },
    date: "2026-10-15",
    amount: 42000,
    note: { ar: "مصروفات تشغيل ونقل بالموقع.", en: "Site running and transport costs." },
  },
  {
    id: "PV-EX-804",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-2",
    category: { ar: "خامات", en: "Materials" },
    date: "2026-09-28",
    amount: 340000,
    note: { ar: "خامات تشطيب للفيلا.", en: "Villa finishing materials." },
  },
];

/* ---------------- Finance documents: invoices / مستخلصات / receipts (distinct) ---------------- */

export type PreviewInvoice = {
  id: string;
  customerId: string;
  projectId: string;
  dueId?: string;
  label: LocalizedText;
  issuedAt: string;
  amount: number;
  status: "issued";
};

export type PreviewCertificate = {
  id: string;
  projectId: string;
  phaseId?: string;
  label: LocalizedText;
  periodFrom: string;
  periodTo: string;
  completionPercent: number;
  amount: number;
  status: "pending" | "approved";
};

export type PreviewReceipt = {
  id: string;
  paymentId: string;
  issuedAt: string;
  status: "recorded";
};

export const previewInvoices: PreviewInvoice[] = [
  {
    id: "PV-INV-7001",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    dueId: "PV-DU-201-1",
    label: { ar: "فاتورة دفعة بدء أعمال المقاولة", en: "Contracting start installment invoice" },
    issuedAt: "2026-06-03",
    amount: 450000,
    status: "issued",
  },
  {
    id: "PV-INV-7002",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    dueId: "PV-DU-201-2",
    label: { ar: "فاتورة دفعة تقدم التشطيب", en: "Finishing progress installment invoice" },
    issuedAt: "2026-09-29",
    amount: 380000,
    status: "issued",
  },
  {
    id: "PV-INV-7003",
    customerId: "PV-CU-04",
    projectId: "PV-PR-203",
    dueId: "PV-DU-203-1",
    label: { ar: "فاتورة دفعة بدء أعمال المقاولة", en: "Contracting start installment invoice" },
    issuedAt: "2026-05-18",
    amount: 600000,
    status: "issued",
  },
];

export const previewCertificates: PreviewCertificate[] = [
  {
    id: "PV-CERT-501",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    label: { ar: "مستخلص أعمال مرحلي — تشطيب", en: "Stage work certificate — finishing" },
    periodFrom: "2026-08-18",
    periodTo: "2026-09-30",
    completionPercent: 45,
    amount: 520000,
    status: "approved",
  },
  {
    id: "PV-CERT-502",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    label: { ar: "مستخلص أعمال مرحلي — تشطيب", en: "Stage work certificate — finishing" },
    periodFrom: "2026-10-01",
    periodTo: "2026-10-20",
    completionPercent: 62,
    amount: 310000,
    status: "pending",
  },
  {
    id: "PV-CERT-503",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-2",
    label: { ar: "مستخلص أعمال مرحلي — تشطيب", en: "Stage work certificate — finishing" },
    periodFrom: "2026-09-01",
    periodTo: "2026-10-10",
    completionPercent: 85,
    amount: 640000,
    status: "approved",
  },
];

export const previewReceipts: PreviewReceipt[] = [
  { id: "PV-RC-6001", paymentId: "PV-PA-9001", issuedAt: "2026-06-04", status: "recorded" },
  { id: "PV-RC-6002", paymentId: "PV-PA-9002", issuedAt: "2026-10-10", status: "recorded" },
  { id: "PV-RC-6003", paymentId: "PV-PA-9003", issuedAt: "2026-05-19", status: "recorded" },
];

/* ---------------- Suppliers and purchases ---------------- */

export type PreviewSupplier = {
  id: string;
  name: LocalizedText;
  category: LocalizedText;
  phone: string;
  city: LocalizedText;
};

export type PreviewPurchaseLine = {
  label: LocalizedText;
  quantity: number;
  unit: LocalizedText;
  unitPrice: number;
};

export type PreviewPurchase = {
  id: string;
  supplierId: string;
  projectId: string;
  phaseId?: string;
  date: string;
  supplierInvoiceRef: string;
  lines: PreviewPurchaseLine[];
  discount: number;
  paidAmount: number;
};

export const previewSuppliers: PreviewSupplier[] = [
  {
    id: "PV-SU-01",
    name: { ar: "مورّد أحجار ورخام أ", en: "Stone and marble supplier A" },
    category: { ar: "أحجار ورخام", en: "Stone and marble" },
    phone: "0100 000 3001",
    city: { ar: "القاهرة", en: "Cairo" },
  },
  {
    id: "PV-SU-02",
    name: { ar: "مورّد سيراميك وبورسلين أ", en: "Ceramics and porcelain supplier A" },
    category: { ar: "سيراميك وبورسلين", en: "Ceramics and porcelain" },
    phone: "0100 000 3002",
    city: { ar: "القاهرة الجديدة", en: "New Cairo" },
  },
  {
    id: "PV-SU-03",
    name: { ar: "مورّد دهانات أ", en: "Paints supplier A" },
    category: { ar: "دهانات", en: "Paints" },
    phone: "0100 000 3003",
    city: { ar: "الإسكندرية", en: "Alexandria" },
  },
];

export const previewPurchases: PreviewPurchase[] = [
  {
    id: "PV-PU-401",
    supplierId: "PV-SU-01",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    date: "2026-09-14",
    supplierInvoiceRef: "PV-SINV-101",
    lines: [
      {
        label: { ar: "رخام أرضيات", en: "Floor marble" },
        quantity: 120,
        unit: { ar: "م²", en: "m²" },
        unitPrice: 1400,
      },
    ],
    discount: 8000,
    paidAmount: 100000,
  },
  {
    id: "PV-PU-402",
    supplierId: "PV-SU-02",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    date: "2026-09-26",
    supplierInvoiceRef: "PV-SINV-102",
    lines: [
      {
        label: { ar: "بورسلين أرضيات", en: "Floor porcelain" },
        quantity: 200,
        unit: { ar: "م²", en: "m²" },
        unitPrice: 650,
      },
      {
        label: { ar: "سيراميك حمامات", en: "Bathroom ceramics" },
        quantity: 80,
        unit: { ar: "م²", en: "m²" },
        unitPrice: 420,
      },
    ],
    discount: 3600,
    paidAmount: 160000,
  },
  {
    id: "PV-PU-403",
    supplierId: "PV-SU-03",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-2",
    date: "2026-10-02",
    supplierInvoiceRef: "PV-SINV-103",
    lines: [
      {
        label: { ar: "دهانات داخلية", en: "Interior paints" },
        quantity: 90,
        unit: { ar: "شيكارة", en: "Bucket" },
        unitPrice: 1150,
      },
    ],
    discount: 3500,
    paidAmount: 50000,
  },
  {
    id: "PV-PU-404",
    supplierId: "PV-SU-02",
    projectId: "PV-PR-202",
    phaseId: "PV-PH-202-1",
    date: "2026-09-20",
    supplierInvoiceRef: "PV-SINV-104",
    lines: [
      {
        label: { ar: "سيراميك مطبخ", en: "Kitchen ceramics" },
        quantity: 45,
        unit: { ar: "م²", en: "m²" },
        unitPrice: 480,
      },
    ],
    discount: 0,
    paidAmount: 21600,
  },
];

/* ---------------- Complaints and suggestions ---------------- */

export type PreviewComplaintReply = {
  id: string;
  visibility: "customer" | "internal";
  author: LocalizedText;
  at: string;
  text: LocalizedText;
};

export type PreviewComplaint = {
  id: string;
  kind: "complaint" | "suggestion";
  customerId: string;
  projectId?: string;
  phaseId?: string;
  category: LocalizedText;
  title: LocalizedText;
  detail: LocalizedText;
  status: "open" | "in_progress" | "resolved";
  priority: "normal" | "high";
  createdAt: string;
  assignee: LocalizedText | null;
  replies: PreviewComplaintReply[];
  attachments: Array<{ label: LocalizedText; kind: string }>;
  resolutionSummary?: LocalizedText;
};

export const previewComplaints: PreviewComplaint[] = [
  {
    id: "PV-CMP-301",
    kind: "complaint",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    category: { ar: "إزعاج وبيئة الموقع", en: "Site disturbance and environment" },
    title: { ar: "ضوضاء وأتربة أثناء أعمال التكسير", en: "Noise and dust during demolition works" },
    detail: {
      ar: "وصلت ملاحظات من الجيران بشأن ضوضاء وأتربة أعمال التكسير، ونرجو تقليلها وإخطارنا مسبقًا بمواعيد الأعمال المزعجة.",
      en: "Neighbors reported noise and dust from demolition works; please reduce them and notify us in advance of disruptive work times.",
    },
    status: "in_progress",
    priority: "high",
    createdAt: "2026-10-14",
    assignee: { ar: "منسّق أ", en: "Coordinator A" },
    replies: [
      {
        id: "PV-CMR-1",
        visibility: "customer",
        author: { ar: "منسّق أ", en: "Coordinator A" },
        at: "2026-10-15",
        text: {
          ar: "شكرًا لتواصلكم؛ تم تسجيل الملاحظة وإحالتها للفريق المختص، وسنشارككم التحديثات هنا.",
          en: "Thank you for contacting us; the note has been recorded and referred to the responsible team, and we will share updates here.",
        },
      },
      {
        id: "PV-CMR-2",
        visibility: "internal",
        author: { ar: "مشرف موقع أ", en: "Site Supervisor A" },
        at: "2026-10-16",
        text: {
          ar: "تمت مراجعة مواعيد التكسير بالموقع وتوجيه فريق العمل بتركيزها في الساعات الصباحية المتفق عليها.",
          en: "Demolition times on site were reviewed and the crew was directed to keep them within the agreed morning hours.",
        },
      },
    ],
    attachments: [{ label: { ar: "صورة من العميل", en: "Customer photo" }, kind: "image" }],
  },
  {
    id: "PV-CMP-302",
    kind: "suggestion",
    customerId: "PV-CU-06",
    projectId: "PV-PR-201",
    category: { ar: "تحسين التواصل", en: "Communication improvement" },
    title: { ar: "ملخص تقدم أسبوعي عبر واتساب", en: "Weekly progress summary over WhatsApp" },
    detail: {
      ar: "أقترح إرسال ملخص تقدم أسبوعي قصير عبر واتساب بجانب التقارير الدورية.",
      en: "I suggest sending a short weekly progress summary over WhatsApp alongside the periodic reports.",
    },
    status: "resolved",
    priority: "normal",
    createdAt: "2026-09-30",
    assignee: { ar: "منسّق أ", en: "Coordinator A" },
    replies: [
      {
        id: "PV-CMR-3",
        visibility: "customer",
        author: { ar: "منسّق أ", en: "Coordinator A" },
        at: "2026-10-02",
        text: {
          ar: "شكرًا لاقتراحكم؛ تم تسجيله وإحالته للفريق المختص للدراسة ضمن خطة التواصل.",
          en: "Thank you for the suggestion; it has been recorded and referred to the responsible team for review within the communication plan.",
        },
      },
    ],
    attachments: [],
    resolutionSummary: {
      ar: "سُجّل الاقتراح وأُحيل للفريق المختص للدراسة.",
      en: "The suggestion was recorded and referred to the responsible team for review.",
    },
  },
  {
    id: "PV-CMP-303",
    kind: "complaint",
    customerId: "PV-CU-02",
    projectId: "PV-PR-202",
    phaseId: "PV-PH-202-1",
    category: { ar: "مواعيد التنفيذ", en: "Execution scheduling" },
    title: { ar: "تأخر موعد بدء بند السيراميك", en: "Ceramics item start date delay" },
    detail: {
      ar: "تأخر بدء بند السيراميك عن الموعد الذي تم إبلاغنا به، ونرجو تحديد موعد محدث.",
      en: "The ceramics item started later than the date we were told; please provide an updated date.",
    },
    status: "open",
    priority: "normal",
    createdAt: "2026-10-19",
    assignee: null,
    replies: [],
    attachments: [],
  },
];

/* ---------------- Contact messages ---------------- */

export type PreviewContactMessage = {
  id: string;
  name: LocalizedText;
  phone: string;
  subject: LocalizedText;
  message: LocalizedText;
  consentContact: boolean;
  consentWhatsapp: boolean;
  receivedAt: string;
  status: "new" | "contacted";
};

export const previewContactMessages: PreviewContactMessage[] = [
  {
    id: "PV-MSG-201",
    name: { ar: "زائر ٠١", en: "Visitor 01" },
    phone: "0100 000 4001",
    subject: { ar: "استفسار عن خدمات التشطيب", en: "Finishing services enquiry" },
    message: {
      ar: "أود معرفة خطوات بدء مشروع تشطيب شقة والمدد التقريبية لكل مرحلة.",
      en: "I would like to know the steps to start an apartment finishing project and the approximate duration of each phase.",
    },
    consentContact: true,
    consentWhatsapp: true,
    receivedAt: "2026-10-20",
    status: "new",
  },
  {
    id: "PV-MSG-202",
    name: { ar: "زائر ٠٢", en: "Visitor 02" },
    phone: "0100 000 4002",
    subject: { ar: "سؤال عن إمكانية التقسيط", en: "Installment option question" },
    message: {
      ar: "هل توجد إمكانية لسداد قيمة التشطيب على دفعات مرتبطة بتقدم العمل؟",
      en: "Is it possible to pay the finishing cost in installments tied to work progress?",
    },
    consentContact: true,
    consentWhatsapp: false,
    receivedAt: "2026-10-18",
    status: "contacted",
  },
  {
    id: "PV-MSG-203",
    name: { ar: "زائر ٠٣", en: "Visitor 03" },
    phone: "0100 000 4003",
    subject: { ar: "طلب معلومات عن الضمان", en: "Warranty information request" },
    message: {
      ar: "ما هي بنود الضمان بعد التسليم وكيف يتم تقديم طلب صيانة؟",
      en: "What does the warranty cover after handover and how is a maintenance request submitted?",
    },
    consentContact: true,
    consentWhatsapp: true,
    receivedAt: "2026-10-16",
    status: "new",
  },
];

/** Review snapshot date shared with preview-data.ts, used for aging. */
export const expansionSnapshotDate = "2026-10-21";

/* ---------------- Inspection details (joined to PV-IN-* module rows) ---------------- */

export type PreviewInspectionHistoryEvent = {
  at: string;
  event: "scheduled" | "rescheduled" | "assigned" | "completed";
  by: LocalizedText;
  note: LocalizedText;
};

export type PreviewInspectionDetail = {
  ref: string;
  requestId: string;
  customerId: string;
  engineerId: string;
  scheduledAt: string;
  timeLabel: string;
  result?: {
    summary: LocalizedText;
    measuredArea: string;
    conditionNotes: LocalizedText[];
    recommendedScope: LocalizedText;
  };
  evidence: Array<{ label: LocalizedText; kind: string }>;
  fee?: { amount: number; state: "settled" | "due" };
  history: PreviewInspectionHistoryEvent[];
};

export const previewInspectionDetails: PreviewInspectionDetail[] = [
  {
    ref: "PV-IN-41",
    requestId: "PV-RQ-1003",
    customerId: "PV-CU-03",
    engineerId: "PV-EN-02",
    scheduledAt: "2026-10-23",
    timeLabel: "11:00",
    evidence: [],
    history: [
      {
        at: "2026-10-20",
        event: "scheduled",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: {
          ar: "حُدد موعد المعاينة بعد التواصل الأول مع العميل.",
          en: "Visit scheduled after first contact with the customer.",
        },
      },
      {
        at: "2026-10-20",
        event: "assigned",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: {
          ar: "أُسندت المعاينة إلى مهندس المعاينات.",
          en: "Assigned to the inspection engineer.",
        },
      },
    ],
  },
  {
    ref: "PV-IN-40",
    requestId: "PV-RQ-1002",
    customerId: "PV-CU-02",
    engineerId: "PV-EN-01",
    scheduledAt: "2026-10-24",
    timeLabel: "13:30",
    evidence: [],
    history: [
      {
        at: "2026-10-19",
        event: "scheduled",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: { ar: "حُدد الموعد الأول للمعاينة.", en: "Initial visit scheduled." },
      },
      {
        at: "2026-10-21",
        event: "rescheduled",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: {
          ar: "أُعيدت جدولة الموعد من ٢٢ إلى ٢٤ أكتوبر بطلب العميلة.",
          en: "Rescheduled from 22 to 24 October at the customer's request.",
        },
      },
    ],
  },
  {
    ref: "PV-IN-39",
    requestId: "PV-RQ-1004",
    customerId: "PV-CU-04",
    engineerId: "PV-EN-02",
    scheduledAt: "2026-10-16",
    timeLabel: "10:00",
    result: {
      summary: {
        ar: "الواجهة جاهزة لأعمال الحجر بعد استكمال طبقة الأساس؛ لا توجد عوائق إنشائية ظاهرة.",
        en: "The facade is ready for stone works after completing the base coat; no visible structural obstacles.",
      },
      measuredArea: "180 m²",
      conditionNotes: [
        { ar: "طبقة الأساس مكتملة ومستوية.", en: "Base coat complete and level." },
        {
          ar: "توجد رطوبة موضعية أسفل الواجهة الجنوبية تحتاج معالجة قبل التركيب.",
          en: "Localised damp at the base of the south facade needs treatment before fixing.",
        },
      ],
      recommendedScope: {
        ar: "توريد وتركيب حجر واجهة مع معالجة الرطوبة وعزل الفواصل.",
        en: "Supply and fix facade stone with damp treatment and joint sealing.",
      },
    },
    evidence: [
      { label: { ar: "صور الواجهة الأربع", en: "Four facade elevations photos" }, kind: "image" },
      { label: { ar: "محضر رفع مقاسات", en: "Measurement record" }, kind: "document" },
    ],
    fee: { amount: 1500, state: "settled" },
    history: [
      {
        at: "2026-10-12",
        event: "scheduled",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: { ar: "حُدد موعد المعاينة.", en: "Visit scheduled." },
      },
      {
        at: "2026-10-16",
        event: "completed",
        by: { ar: "مهندس معاينات ب", en: "Inspection Engineer B" },
        note: {
          ar: "أُنجزت المعاينة وسُجلت النتيجة والمقاسات.",
          en: "Visit completed; result and measurements recorded.",
        },
      },
    ],
  },
  {
    ref: "PV-IN-38",
    requestId: "PV-RQ-1005",
    customerId: "PV-CU-05",
    engineerId: "PV-EN-01",
    scheduledAt: "2026-10-13",
    timeLabel: "12:00",
    result: {
      summary: {
        ar: "وحدة دوبلكس نصف تشطيب؛ التأسيسات القائمة جزئية وتحتاج استكمالًا قبل التشطيب النهائي.",
        en: "Semi-finished duplex; existing rough-ins are partial and need completion before final finishing.",
      },
      measuredArea: "265 m²",
      conditionNotes: [
        {
          ar: "سباكة الأساسيات منفذة بالدور الأرضي فقط.",
          en: "Plumbing rough-ins done on the ground floor only.",
        },
        { ar: "لا توجد أسقف معلقة حاليًا.", en: "No suspended ceilings at present." },
      ],
      recommendedScope: {
        ar: "استكمال التأسيسات ثم تنفيذ بنود التشطيب الداخلي كاملة.",
        en: "Complete the rough-ins, then execute the full interior finishing scope.",
      },
    },
    evidence: [
      { label: { ar: "صور الحالة الراهنة", en: "Current-state photos" }, kind: "image" },
      { label: { ar: "رسم كروكي للمساحات", en: "Area sketch" }, kind: "document" },
    ],
    fee: { amount: 1500, state: "settled" },
    history: [
      {
        at: "2026-10-10",
        event: "scheduled",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: { ar: "حُدد موعد المعاينة.", en: "Visit scheduled." },
      },
      {
        at: "2026-10-13",
        event: "completed",
        by: { ar: "منسّق أ", en: "Coordinator A" },
        note: { ar: "أُنجزت المعاينة وسُجلت النتيجة.", en: "Visit completed; result recorded." },
      },
    ],
  },
];

/* ---------------- Quotation details: BOQ, revisions, customer decision ---------------- */

export type PreviewBoqLine = {
  label: LocalizedText;
  quantity: number;
  unit: LocalizedText;
  unitPrice: number;
};

export type PreviewQuotationDetail = {
  ref: string;
  boqLines: PreviewBoqLine[];
  discount: number;
  scopeNotes: LocalizedText[];
  revisions: Array<{ version: string; date: string; total: number; note: LocalizedText }>;
  decision?: {
    state: "pending" | "approved" | "review_requested";
    at?: string;
    note?: LocalizedText;
  };
};

const lot: LocalizedText = { ar: "مقطوعية", en: "Lot" };
const sqm: LocalizedText = { ar: "م²", en: "m²" };
const lm: LocalizedText = { ar: "م.ط", en: "LM" };
const piece: LocalizedText = { ar: "عدد", en: "pcs" };

export const previewQuotationDetails: PreviewQuotationDetail[] = [
  {
    ref: "PV-QT-74",
    boqLines: [
      {
        label: { ar: "تأسيسات سباكة وكهرباء", en: "Plumbing and electrical rough-ins" },
        quantity: 1,
        unit: lot,
        unitPrice: 85000,
      },
      {
        label: { ar: "أرضيات بورسلين توريد وتركيب", en: "Porcelain flooring supply and fixing" },
        quantity: 140,
        unit: sqm,
        unitPrice: 750,
      },
      {
        label: { ar: "دهانات داخلية", en: "Interior paints" },
        quantity: 320,
        unit: sqm,
        unitPrice: 140,
      },
      {
        label: { ar: "أسقف جبسية", en: "Gypsum ceilings" },
        quantity: 120,
        unit: sqm,
        unitPrice: 380,
      },
      {
        label: { ar: "أبواب خشبية", en: "Wooden doors" },
        quantity: 6,
        unit: piece,
        unitPrice: 9500,
      },
      {
        label: { ar: "أعمال صحية نهائية", en: "Final sanitary works" },
        quantity: 1,
        unit: lot,
        unitPrice: 72600,
      },
    ],
    discount: 15000,
    scopeNotes: [
      {
        ar: "يشمل النطاق التشطيب الداخلي الكامل للوحدة.",
        en: "Scope covers the full interior finishing of the unit.",
      },
      {
        ar: "لا يشمل الأثاث أو الأجهزة الكهربائية.",
        en: "Furniture and electrical appliances are excluded.",
      },
    ],
    revisions: [
      {
        version: "1",
        date: "2026-10-03",
        total: 410000,
        note: {
          ar: "الإصدار الأول المرسل إلى العميل.",
          en: "First issued version sent to the customer.",
        },
      },
      {
        version: "2",
        date: "2026-10-06",
        total: 395000,
        note: {
          ar: "مراجعة نطاق الأبواب وتسجيل خصم على الإجمالي.",
          en: "Doors scope revised and a discount recorded on the total.",
        },
      },
    ],
    decision: { state: "approved", at: "2026-10-06" },
  },
  {
    ref: "PV-QT-75",
    boqLines: [
      {
        label: { ar: "وحدات مطبخ علوية وسفلية", en: "Kitchen upper and base units" },
        quantity: 9,
        unit: lm,
        unitPrice: 11000,
      },
      {
        label: { ar: "سطح عمل رخام", en: "Marble worktop" },
        quantity: 6,
        unit: lm,
        unitPrice: 4250,
      },
      {
        label: { ar: "سباكة وكهرباء المطبخ", en: "Kitchen plumbing and electrics" },
        quantity: 1,
        unit: lot,
        unitPrice: 28000,
      },
      {
        label: { ar: "سيراميك حوائط", en: "Wall ceramics" },
        quantity: 20,
        unit: sqm,
        unitPrice: 800,
      },
    ],
    discount: 0,
    scopeNotes: [
      {
        ar: "مسودة داخلية قيد الإعداد ولم تُرسل إلى العميلة.",
        en: "Internal draft in preparation; not sent to the customer yet.",
      },
    ],
    revisions: [
      {
        version: "1",
        date: "2026-10-19",
        total: 168500,
        note: { ar: "مسودة أولى لبنود المطبخ.", en: "First draft of the kitchen items." },
      },
    ],
  },
  {
    ref: "PV-QT-76",
    boqLines: [
      {
        label: { ar: "توريد حجر واجهة", en: "Facade stone supply" },
        quantity: 180,
        unit: sqm,
        unitPrice: 1200,
      },
      {
        label: { ar: "تركيب ومصنعية", en: "Fixing and labor" },
        quantity: 180,
        unit: sqm,
        unitPrice: 350,
      },
      {
        label: { ar: "معالجة رطوبة وعزل فواصل", en: "Damp treatment and joint sealing" },
        quantity: 1,
        unit: lot,
        unitPrice: 33000,
      },
    ],
    discount: 0,
    scopeNotes: [
      {
        ar: "الكميات وفق رفع مقاسات المعاينة PV-IN-39.",
        en: "Quantities follow inspection PV-IN-39 measurements.",
      },
    ],
    revisions: [
      {
        version: "1",
        date: "2026-10-10",
        total: 320000,
        note: {
          ar: "إصدار أول بكمية حجر تقديرية.",
          en: "First issue with estimated stone quantity.",
        },
      },
      {
        version: "2",
        date: "2026-10-12",
        total: 312000,
        note: {
          ar: "تعديل الكمية بعد رفع المقاسات الفعلية.",
          en: "Quantity adjusted after actual measurements.",
        },
      },
    ],
    decision: { state: "approved", at: "2026-10-12" },
  },
  {
    ref: "PV-QT-77",
    boqLines: [
      { label: { ar: "أرضيات", en: "Flooring" }, quantity: 220, unit: sqm, unitPrice: 800 },
      { label: { ar: "دهانات", en: "Paints" }, quantity: 540, unit: sqm, unitPrice: 140 },
      {
        label: { ar: "استكمال سباكة وكهرباء", en: "Plumbing and electrics completion" },
        quantity: 1,
        unit: lot,
        unitPrice: 120000,
      },
      {
        label: { ar: "نجارة وأبواب", en: "Carpentry and doors" },
        quantity: 9,
        unit: piece,
        unitPrice: 9300,
      },
      {
        label: { ar: "أسقف جبسية", en: "Gypsum ceilings" },
        quantity: 70,
        unit: sqm,
        unitPrice: 400,
      },
      {
        label: { ar: "أعمال ألوميتال", en: "Aluminum works" },
        quantity: 1,
        unit: lot,
        unitPrice: 16700,
      },
    ],
    discount: 15000,
    scopeNotes: [
      {
        ar: "النطاق وفق نتيجة المعاينة PV-IN-38.",
        en: "Scope follows inspection PV-IN-38 findings.",
      },
    ],
    revisions: [
      {
        version: "1",
        date: "2026-10-15",
        total: 485000,
        note: {
          ar: "الإصدار المرسل إلى العميلة وبانتظار قرارها.",
          en: "Issued to the customer; awaiting her decision.",
        },
      },
    ],
    decision: { state: "pending" },
  },
];

/* ---------------- Contract details: scope, documents, change orders ---------------- */

export type PreviewContractDetail = {
  ref: string;
  quotationRef?: string;
  scopeSummary: LocalizedText;
  startBasis: LocalizedText;
  documents: Array<{ label: LocalizedText; kind: string }>;
  changeOrderRefs: string[];
};

export type PreviewChangeOrderDetail = {
  ref: string;
  contractRef: string;
  description: LocalizedText;
  amountDelta: number;
  decision: { state: "pending" | "approved" | "review_requested"; at?: string };
};

export const previewContractDetails: PreviewContractDetail[] = [
  {
    ref: "PV-CT-12",
    quotationRef: "PV-QT-74",
    scopeSummary: {
      ar: "تنفيذ التشطيب الداخلي للوحدة وفق بنود عرض السعر المعتمد PV-QT-74.",
      en: "Execute the unit's interior finishing per approved quotation PV-QT-74 items.",
    },
    startBasis: {
      ar: "بدء العمل بعد استلام الموقع وتسجيل دفعة البدء.",
      en: "Works start after site handover to the team and recording the start installment.",
    },
    documents: [
      { label: { ar: "نسخة العقد المسجلة", en: "Recorded contract copy" }, kind: "document" },
      { label: { ar: "جدول كميات العرض المعتمد", en: "Approved quotation BOQ" }, kind: "document" },
    ],
    changeOrderRefs: ["PV-CO-03"],
  },
  {
    ref: "PV-CT-11",
    quotationRef: "PV-QT-76",
    scopeSummary: {
      ar: "توريد وتركيب حجر الواجهة وفق عرض السعر المعتمد PV-QT-76.",
      en: "Supply and fix facade stone per approved quotation PV-QT-76.",
    },
    startBasis: {
      ar: "بدء العمل بعد معالجة الرطوبة وتسجيل دفعة البدء.",
      en: "Works start after damp treatment and recording the start installment.",
    },
    documents: [
      { label: { ar: "نسخة العقد المسجلة", en: "Recorded contract copy" }, kind: "document" },
      {
        label: { ar: "محضر رفع مقاسات الواجهة", en: "Facade measurement record" },
        kind: "document",
      },
    ],
    changeOrderRefs: [],
  },
];

export const previewChangeOrderDetails: PreviewChangeOrderDetail[] = [
  {
    ref: "PV-CO-03",
    contractRef: "PV-CT-12",
    description: {
      ar: "إضافة حجر طبيعي لمدخل الوحدة خارج بنود العقد الأصلي.",
      en: "Add natural stone to the unit entrance, outside the original contract items.",
    },
    amountDelta: 24000,
    decision: { state: "pending" },
  },
];

/* ---------------- Project work items, assignment & status history ---------------- */

export type PreviewWorkItem = {
  id: string;
  phaseId: string;
  label: LocalizedText;
  unit: LocalizedText;
  plannedQty: number;
  completedQty: number;
  evidence: Array<{ label: LocalizedText; kind: string }>;
};

export const previewWorkItems: PreviewWorkItem[] = [
  {
    id: "PV-WI-101",
    phaseId: "PV-PH-201-1",
    label: { ar: "تأسيس سباكة", en: "Plumbing rough-ins" },
    unit: lot,
    plannedQty: 1,
    completedQty: 1,
    evidence: [{ label: { ar: "صور قبل الإغلاق", en: "Pre-closing photos" }, kind: "image" }],
  },
  {
    id: "PV-WI-102",
    phaseId: "PV-PH-201-1",
    label: { ar: "تأسيس كهرباء", en: "Electrical rough-ins" },
    unit: lot,
    plannedQty: 1,
    completedQty: 1,
    evidence: [{ label: { ar: "صور قبل الإغلاق", en: "Pre-closing photos" }, kind: "image" }],
  },
  {
    id: "PV-WI-103",
    phaseId: "PV-PH-201-1",
    label: { ar: "محارة", en: "Plastering" },
    unit: sqm,
    plannedQty: 320,
    completedQty: 320,
    evidence: [],
  },
  {
    id: "PV-WI-111",
    phaseId: "PV-PH-201-2",
    label: { ar: "أسقف جبسية", en: "Gypsum ceilings" },
    unit: sqm,
    plannedQty: 120,
    completedQty: 120,
    evidence: [
      { label: { ar: "صور الأسقف بعد التنفيذ", en: "Finished ceilings photos" }, kind: "image" },
    ],
  },
  {
    id: "PV-WI-112",
    phaseId: "PV-PH-201-2",
    label: { ar: "أرضيات بورسلين", en: "Porcelain flooring" },
    unit: sqm,
    plannedQty: 140,
    completedQty: 110,
    evidence: [
      { label: { ar: "صور تقدم الأرضيات", en: "Flooring progress photos" }, kind: "image" },
    ],
  },
  {
    id: "PV-WI-113",
    phaseId: "PV-PH-201-2",
    label: { ar: "دهانات", en: "Paints" },
    unit: sqm,
    plannedQty: 320,
    completedQty: 150,
    evidence: [],
  },
  {
    id: "PV-WI-114",
    phaseId: "PV-PH-201-2",
    label: { ar: "تركيب أبواب خشبية", en: "Wooden doors installation" },
    unit: piece,
    plannedQty: 6,
    completedQty: 2,
    evidence: [],
  },
  {
    id: "PV-WI-121",
    phaseId: "PV-PH-202-1",
    label: { ar: "سيراميك مطبخ", en: "Kitchen ceramics" },
    unit: sqm,
    plannedQty: 45,
    completedQty: 18,
    evidence: [{ label: { ar: "صورة بداية البند", en: "Item start photo" }, kind: "image" }],
  },
  {
    id: "PV-WI-131",
    phaseId: "PV-PH-203-2",
    label: { ar: "تركيب حجر الواجهة", en: "Facade stone fixing" },
    unit: sqm,
    plannedQty: 180,
    completedQty: 171,
    evidence: [
      { label: { ar: "صور الواجهة أسبوعيًا", en: "Weekly facade photos" }, kind: "image" },
    ],
  },
  {
    id: "PV-WI-132",
    phaseId: "PV-PH-203-2",
    label: { ar: "معالجة وعزل فواصل نهائي", en: "Final joint sealing" },
    unit: lot,
    plannedQty: 1,
    completedQty: 0,
    evidence: [],
  },
];

export type PreviewAssignmentRecord = {
  engineerId: string;
  projectId: string;
  phaseId?: string;
  role: string;
  from: string;
  to?: string;
};

export const previewAssignmentHistory: PreviewAssignmentRecord[] = [
  {
    engineerId: "PV-EN-03",
    projectId: "PV-PR-204",
    phaseId: "PV-PH-204-1",
    role: "project_manager",
    from: "2026-02-16",
    to: "2026-04-12",
  },
  {
    engineerId: "PV-EN-04",
    projectId: "PV-PR-204",
    phaseId: "PV-PH-204-2",
    role: "site_supervisor",
    from: "2026-04-15",
    to: "2026-08-02",
  },
  {
    engineerId: "PV-EN-03",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-1",
    role: "project_manager",
    from: "2026-05-11",
    to: "2026-07-20",
  },
  {
    engineerId: "PV-EN-03",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-1",
    role: "project_manager",
    from: "2026-06-01",
    to: "2026-08-15",
  },
  {
    engineerId: "PV-EN-04",
    projectId: "PV-PR-203",
    phaseId: "PV-PH-203-2",
    role: "site_supervisor",
    from: "2026-07-24",
  },
  {
    engineerId: "PV-EN-04",
    projectId: "PV-PR-201",
    phaseId: "PV-PH-201-2",
    role: "site_supervisor",
    from: "2026-08-18",
  },
  {
    engineerId: "PV-EN-04",
    projectId: "PV-PR-202",
    phaseId: "PV-PH-202-1",
    role: "site_supervisor",
    from: "2026-09-10",
  },
];

export type PreviewProjectStatusRecord = {
  projectId: string;
  status: string;
  at: string;
  note: LocalizedText;
};

export const previewProjectStatusHistory: PreviewProjectStatusRecord[] = [
  {
    projectId: "PV-PR-201",
    status: "in_progress",
    at: "2026-06-01",
    note: { ar: "بدأت أعمال المقاولة والتأسيس.", en: "Contracting and base works started." },
  },
  {
    projectId: "PV-PR-201",
    status: "in_progress",
    at: "2026-08-18",
    note: { ar: "انتقل التنفيذ إلى مرحلة التشطيب.", en: "Execution moved to the finishing stage." },
  },
  {
    projectId: "PV-PR-202",
    status: "in_progress",
    at: "2026-09-10",
    note: { ar: "بدأت أعمال تشطيب المطبخ.", en: "Kitchen finishing works started." },
  },
  {
    projectId: "PV-PR-203",
    status: "in_progress",
    at: "2026-05-11",
    note: { ar: "بدأت أعمال المقاولة والتأسيس.", en: "Contracting and base works started." },
  },
  {
    projectId: "PV-PR-203",
    status: "in_progress",
    at: "2026-07-24",
    note: {
      ar: "انتقل التنفيذ إلى أعمال الواجهة والتشطيب.",
      en: "Execution moved to facade and finishing works.",
    },
  },
  {
    projectId: "PV-PR-204",
    status: "in_progress",
    at: "2026-02-16",
    note: { ar: "بدأت أعمال المشروع.", en: "Project works started." },
  },
  {
    projectId: "PV-PR-204",
    status: "in_progress",
    at: "2026-08-02",
    note: {
      ar: "اكتملت أعمال التشطيب وبدأت مراجعة التحفظات قبل التسليم.",
      en: "Finishing works completed; pre-handover snag review started.",
    },
  },
  {
    projectId: "PV-PR-204",
    status: "handed_over",
    at: "2026-10-02",
    note: { ar: "سُلمت الوحدة إلى العميل", en: "The unit was handed over to the customer." },
  },
];

/* ---------------- Notification delivery details (joined to notification rows) ---------------- */

export type PreviewNotificationDelivery = {
  rowId: string;
  channel: "whatsapp" | "staff_internal";
  recipient: "customer" | "staff";
  attempts: number;
  stateNote: LocalizedText;
};

export const previewNotificationDeliveries: PreviewNotificationDelivery[] = [
  {
    rowId: "n1",
    channel: "staff_internal",
    recipient: "staff",
    attempts: 0,
    stateNote: {
      ar: "تنبيه داخلي للفريق بانتظار أول تواصل مع العميل؛ لم يُرسل إشعار خارجي.",
      en: "Internal staff alert pending first customer contact; no external notification was sent.",
    },
  },
  {
    rowId: "n2",
    channel: "whatsapp",
    recipient: "customer",
    attempts: 0,
    stateNote: {
      ar: "الحالة مسجلة كمُرسلة في السجلات الحالية؛ قناة الإرسال الفعلية غير مفعلة بعد فلا يوجد تأكيد تسليم من مقدّم الخدمة.",
      en: "Recorded as sent in current records; the actual sending channel is not enabled yet, so there is no provider delivery confirmation.",
    },
  },
  {
    rowId: "n3",
    channel: "whatsapp",
    recipient: "customer",
    attempts: 0,
    stateNote: {
      ar: "الحالة مسجلة كمُرسلة في السجلات الحالية؛ قناة الإرسال الفعلية غير مفعلة بعد فلا يوجد تأكيد تسليم من مقدّم الخدمة.",
      en: "Recorded as sent in current records; the actual sending channel is not enabled yet, so there is no provider delivery confirmation.",
    },
  },
];

/* ---------------- Handover & warranty details ---------------- */

export type PreviewHandoverDetail = {
  ref: string;
  projectId: string;
  customerId: string;
  plannedDate: string;
  actualDate?: string;
  checklist: Array<{ label: LocalizedText; state: "done" | "pending" }>;
  notes: LocalizedText[];
  snagsNote: LocalizedText;
  documents: Array<{ label: LocalizedText; kind: string }>;
};

const handoverChecklistTemplate: LocalizedText[] = [
  {
    ar: "مراجعة بنود التشطيب المنفذة مقابل نطاق العمل المعتمد",
    en: "Review executed finishing items against the approved scope",
  },
  {
    ar: "فحص تشغيل نقاط المياه والصرف والكهرباء المرتبطة بالأعمال",
    en: "Test water, drainage and electrical points tied to the works",
  },
  {
    ar: "تسجيل أي ملاحظات بقائمة التحفظات والاتفاق على مواعيد معالجتها",
    en: "Record any snags and agree correction timelines",
  },
  {
    ar: "استلام مستندات الاعتمادات والتقارير الخاصة بالمشروع",
    en: "Receive approval records and project reports",
  },
  {
    ar: "توضيح قنوات طلبات الصيانة بعد التسليم",
    en: "Clarify post-handover maintenance request channels",
  },
];

export const previewHandoverDetails: PreviewHandoverDetail[] = [
  {
    ref: "PV-HO-04",
    projectId: "PV-PR-204",
    customerId: "PV-CU-03",
    plannedDate: "2026-09-28",
    actualDate: "2026-10-02",
    checklist: handoverChecklistTemplate.map((label) => ({ label, state: "done" as const })),
    notes: [
      {
        ar: "سُجل التسليم بعد إنهاء بنود قائمة التحفظات الناتجة عن المعاينة المشتركة.",
        en: "Handover was recorded after closing the snag-list items from the joint inspection.",
      },
    ],
    snagsNote: {
      ar: "لا توجد تحفظات مفتوحة وقت التسليم؛ الملاحظات المسجلة عولجت قبل الاستلام.",
      en: "No open snags at handover; recorded notes were corrected before sign-off.",
    },
    documents: [
      { label: { ar: "محضر تسليم مسجل", en: "Recorded handover record" }, kind: "document" },
      { label: { ar: "نسخة اعتمادات الخامات", en: "Material approvals copy" }, kind: "document" },
    ],
  },
  {
    ref: "PV-HO-05",
    projectId: "PV-PR-203",
    customerId: "PV-CU-04",
    plannedDate: "2026-11-02",
    checklist: handoverChecklistTemplate.map((label) => ({ label, state: "pending" as const })),
    notes: [
      {
        ar: "التسليم مجدول بعد اكتمال أعمال واجهة الحجر ومراجعة التحفظات مع العميل.",
        en: "Handover is scheduled after the stone facade works complete and snags are reviewed with the customer.",
      },
    ],
    snagsNote: {
      ar: "ستُعدّ قائمة التحفظات خلال المعاينة المشتركة قبل التسليم.",
      en: "The snag list will be prepared during the joint pre-handover inspection.",
    },
    documents: [],
  },
];

export type PreviewWarrantyVisit = {
  date: string;
  engineerId: string;
  findings: LocalizedText;
  actionTaken: LocalizedText;
  evidence: Array<{ label: LocalizedText; kind: string }>;
};

export type PreviewWarrantyDetail = {
  ref: string;
  projectId: string;
  customerId: string;
  phaseId?: string;
  engineerId: string;
  source: "customer_request" | "scheduled_followup";
  openedAt: string;
  nextVisit?: string;
  visits: PreviewWarrantyVisit[];
  customerSummary: LocalizedText;
  internalNotes: Array<{ date: string; by: LocalizedText; text: LocalizedText }>;
};

export const previewWarrantyDetails: PreviewWarrantyDetail[] = [
  {
    ref: "PV-WR-02",
    projectId: "PV-PR-204",
    customerId: "PV-CU-03",
    phaseId: "PV-PH-204-2",
    engineerId: "PV-EN-04",
    source: "customer_request",
    openedAt: "2026-10-16",
    nextVisit: "2026-10-25",
    visits: [
      {
        date: "2026-10-18",
        engineerId: "PV-EN-04",
        findings: {
          ar: "إغلاق باب خشبي يتطلب ضبط المفصلات واستبدال برغي تثبيت تالف.",
          en: "A wooden door needs hinge adjustment and a damaged fixing screw replaced.",
        },
        actionTaken: {
          ar: "ضُبط الإغلاق مؤقتًا وطُلبت قطعة الاستبدال؛ الإغلاق النهائي في الزيارة التالية.",
          en: "Closing was temporarily adjusted and the replacement part ordered; final fix at the next visit.",
        },
        evidence: [
          {
            label: { ar: "صورة الباب قبل الضبط", en: "Door photo before adjustment" },
            kind: "image",
          },
        ],
      },
    ],
    customerSummary: {
      ar: "جارٍ استكمال ضبط إغلاق الباب، وزيارة المتابعة مجدولة يوم ٢٥ أكتوبر.",
      en: "Door-closing adjustment is in progress; the follow-up visit is scheduled for 25 October.",
    },
    internalNotes: [
      {
        date: "2026-10-18",
        by: { ar: "مشرف موقع أ", en: "Site Supervisor A" },
        text: {
          ar: "عند الزيارة التالية: التحقق أيضًا من مفصلات باب غرفة النوم الثانية (ملاحظة داخلية).",
          en: "At the next visit, also check the second bedroom door hinges (internal note).",
        },
      },
    ],
  },
  {
    ref: "PV-WR-01",
    projectId: "PV-PR-204",
    customerId: "PV-CU-03",
    phaseId: "PV-PH-204-2",
    engineerId: "PV-EN-04",
    source: "scheduled_followup",
    openedAt: "2026-10-09",
    visits: [
      {
        date: "2026-10-09",
        engineerId: "PV-EN-04",
        findings: {
          ar: "لا توجد عيوب ظاهرة في بنود التشطيب التي رُوجعت خلال زيارة المتابعة.",
          en: "No visible defects in the finishing items reviewed during the follow-up visit.",
        },
        actionTaken: {
          ar: "أُغلقت المتابعة دون الحاجة إلى أعمال إضافية.",
          en: "The follow-up was closed with no additional works needed.",
        },
        evidence: [
          {
            label: { ar: "صور متابعة ما بعد التسليم", en: "Post-handover follow-up photos" },
            kind: "image",
          },
        ],
      },
    ],
    customerSummary: {
      ar: "اكتملت زيارة المتابعة بعد التسليم دون ملاحظات مفتوحة.",
      en: "The post-handover follow-up visit completed with no open notes.",
    },
    internalNotes: [],
  },
];

/* ---------------- Document categories for module/portal document rows ---------------- */

export type PreviewDocumentCategory =
  | "boq"
  | "contracts"
  | "change_orders"
  | "reports_evidence"
  | "invoices"
  | "certificates"
  | "receipts"
  | "handover"
  | "warranty"
  | "approvals_drawings";

export const previewDocumentCategoryOrder: PreviewDocumentCategory[] = [
  "boq",
  "contracts",
  "change_orders",
  "reports_evidence",
  "invoices",
  "certificates",
  "receipts",
  "handover",
  "warranty",
  "approvals_drawings",
];

export const previewDocumentRowCategories: Record<string, PreviewDocumentCategory> = {
  dc1: "boq",
  dc2: "reports_evidence",
  dc3: "approvals_drawings",
  dc4: "approvals_drawings",
  dc5: "approvals_drawings",
};
