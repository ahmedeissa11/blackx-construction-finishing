import type { Locale, LocalizedText } from "@/lib/i18n";
import { OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";

/** Categories supplied in the user reference, not independently verified legacy pages. */
export type ErpSource =
  | `link:${string}`
  | `data:${string}`
  | "permissions"
  | "diagnostics"
  | "settings"
  | "import"
  | "export";
export type ErpPageKind =
  | "preview"
  | "fixture"
  | "shared"
  | "tool"
  | "deferred"
  | "readiness"
  | "source-link"
  | "instructions";
export type ErpRouteRef = { area: string; page: string };
export type ErpPage = {
  id: string;
  title: LocalizedText;
  section: LocalizedText;
  source?: ErpSource;
  fields: string[];
  subject: LocalizedText;
  kind: ErpPageKind;
  summary: LocalizedText;
  sharedWith?: ErpRouteRef;
  related?: ErpRouteRef[];
};
export type ErpModule = {
  id: string;
  title: LocalizedText;
  provenance: "reference" | "adapted";
  boundary: LocalizedText;
  pages: ErpPage[];
};
export const legacyReference = {
  reportedModules: 21,
  reportedPages: 337,
  namedCategories: 15,
  independentlyVerifiedInternalPages: 0,
} as const;
export const erpModules: ErpModule[] = [
  {
    id: "permissions",
    title: {
      ar: "النظام والصلاحيات",
      en: "System & permissions",
    },
    provenance: "reference",
    boundary: {
      ar: "هوية مراجعة المالك فقط؛ حسابات الموظفين وتعديل الصلاحيات تتطلب خدمة هوية معتمدة.",
      en: "Owner-only identity; staff accounts and editable grants require an approved identity service.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Owner boundary matrix entry",
          ar: "مدخل مصفوفة حدود المالك",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "permissions",
        subject: {
          ar: "نظرة عامة على الصلاحيات",
          en: "Permissions overview",
        },
        summary: {
          en: "Read-only owner-boundary matrix with a module filter. No role editor, staff grants, assignments or denial-event records.",
          ar: "مصفوفة حدود مراجعة المالك للقراءة فقط بمرشح وحدة؛ لا محرر أدوار أو منح موظفين أو تعيينات أو أحداث رفض وصول.",
        },
        sharedWith: {
          area: "permissions",
          page: "matrix",
        },
        kind: "shared",
      },
      {
        id: "roles",
        title: {
          en: "Roles & UI permission selection — preview",
          ar: "الأدوار واختيار صلاحيات الواجهة — معاينة",
        },
        section: {
          ar: "الوصول",
          en: "Access",
        },
        fields: ["ref", "project", "date", "status"],
        source: "permissions",
        subject: {
          ar: "الأدوار ومجموعات الصلاحيات",
          en: "Roles and permission sets",
        },
        summary: {
          en: "Synthetic role directory and grouped UI permission selection. Local simulation only; no real role editor, live grants or enforcement changes.",
          ar: "دليل أدوار اصطناعي واختيار صلاحيات واجهة مجمعة. محاكاة محلية فقط؛ لا محرر أدوار حقيقي أو منح فعلية أو تغيير تفويض.",
        },
        sharedWith: {
          area: "permissions",
          page: "matrix",
        },
        kind: "shared",
      },
      {
        id: "matrix",
        title: {
          en: "Page requirements & UI permission picker",
          ar: "متطلبات الصفحات واختيار صلاحيات الواجهة",
        },
        section: {
          ar: "الوصول",
          en: "Access",
        },
        fields: ["ref", "project", "date", "status"],
        source: "permissions",
        subject: {
          ar: "مصفوفة الوصول للوحدات والصفحات",
          en: "Module and page access matrix",
        },
        summary: {
          en: "Read-only owner-boundary matrix and local grouped permission selection. Descriptive UI definitions only, not effective grants or authorization enforcement.",
          ar: "مصفوفة حدود المالك للقراءة فقط واختيار صلاحيات محلي مجمع. تعريفات واجهة وصفية فقط وليست منحاً فعلية أو إنفاذ تفويض.",
        },
        kind: "tool",
      },
      {
        id: "assignments",
        title: {
          en: "Preview users & role assignments",
          ar: "مستخدمون وتعيين أدوار — معاينة",
        },
        section: {
          ar: "الوصول",
          en: "Access",
        },
        fields: ["ref", "project", "date", "status"],
        source: "permissions",
        subject: {
          ar: "تعيينات وصول المستخدمين",
          en: "User access assignments",
        },
        summary: {
          en: "Synthetic users and temporary role assignments, reset on remount or refresh. No accounts, sessions or server permissions change.",
          ar: "مستخدمون اصطناعيون وتعيين أدوار مؤقت يعاد عند إعادة فتح المكون أو التحديث؛ لا تتغير حسابات أو جلسات أو صلاحيات خادم.",
        },
        sharedWith: {
          area: "permissions",
          page: "matrix",
        },
        kind: "shared",
      },
      {
        id: "denied",
        title: {
          en: "Owner matrix entry — denial diagnostics unavailable",
          ar: "مدخل مصفوفة المالك — تشخيص الرفض غير متاح",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "permissions",
        subject: {
          ar: "تشخيص الوصول والتفويض",
          en: "Access and authorization diagnostics",
        },
        summary: {
          en: "Read-only owner-boundary matrix with a module filter. No role editor, staff grants, assignments or denial-event records.",
          ar: "مصفوفة حدود مراجعة المالك للقراءة فقط بمرشح وحدة؛ لا محرر أدوار أو منح موظفين أو تعيينات أو أحداث رفض وصول.",
        },
        sharedWith: {
          area: "permissions",
          page: "matrix",
        },
        kind: "shared",
      },
      {
        id: "history",
        title: {
          en: "Deferred — Permission audit and history",
          ar: "مؤجل — سجل تدقيق الصلاحيات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "actor", "action", "date", "status"],
        subject: {
          ar: "سجل تدقيق الصلاحيات",
          en: "Permission audit and history",
        },
        kind: "deferred",
        summary: {
          en: "Permission-change auditing and authorized history retrieval are not implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تدقيق تغييرات الصلاحيات واسترجاع تاريخ مخول غير منفذ. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "accounting",
    title: {
      ar: "الحسابات العامة",
      en: "General accounting",
    },
    provenance: "reference",
    boundary: {
      ar: "المستندات المالية التجريبية ليست دفتر أستاذ؛ الترحيل والأرصدة والتصحيحات والقواعد القانونية تتطلب خدمات معتمدة.",
      en: "Preview financial documents are not a general ledger. Posting, balances, corrections and statutory rules require approved services.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Accounting overview",
          ar: "مؤجل — نظرة عامة على الحسابات",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على الحسابات",
          en: "Accounting overview",
        },
        kind: "deferred",
        summary: {
          en: "No accounting overview based on authoritative balances exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد نظرة حسابات تعتمد على أرصدة معتمدة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "transactions",
        title: {
          en: "Deferred — Financial transaction overview",
          ar: "مؤجل — نظرة عامة على المعاملات المالية",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "type", "project", "date", "amount", "status"],
        subject: {
          ar: "نظرة عامة على المعاملات المالية",
          en: "Financial transaction overview",
        },
        kind: "deferred",
        summary: {
          en: "No unified transaction ledger or posting service exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد دفتر معاملات موحد أو خدمة ترحيل. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "accounts",
        title: {
          en: "Deferred — Accounts and classifications",
          ar: "مؤجل — الحسابات والتصنيفات المالية",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "name", "type", "status"],
        subject: {
          ar: "الحسابات والتصنيفات المالية",
          en: "Accounts and classifications",
        },
        kind: "deferred",
        summary: {
          en: "Chart-of-accounts setup and classification rules are not approved or editable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "إعداد دليل الحسابات وقواعد التصنيف غير معتمد أو قابل للتعديل. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "customer-balances",
        title: {
          en: "Finance review preview — session simulation only",
          ar: "معاينة مراجعة مالية — محاكاة جلسة فقط",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:finance",
        subject: {
          ar: "أرصدة العملاء",
          en: "Customer balances",
        },
        summary: {
          en: "Existing finance preview with tabs and temporary session-payment simulation. No durable posting, accounting ledger or shared payment state.",
          ar: "معاينة مالية حالية بتبويبات ومحاكاة دفعات مؤقتة للجلسة؛ لا ترحيل دائم أو دفتر حسابات أو حالة دفعات مشتركة.",
        },
        kind: "preview",
      },
      {
        id: "supplier-balances",
        title: {
          en: "Purchase-summary preview entry — no supplier ledger",
          ar: "مدخل معاينة ملخص شراء — دون دفتر موردين",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:purchases",
        subject: {
          ar: "مستحقات الموردين",
          en: "Supplier payables",
        },
        summary: {
          en: "Existing supplier/purchase preview. Payables are illustrative arithmetic over purchase summaries, not a supplier invoice/payment ledger.",
          ar: "معاينة الموردين والمشتريات الحالية؛ المديونية حساب توضيحي لملخصات شراء وليست دفتر فواتير ودفعات موردين.",
        },
        sharedWith: {
          area: "purchasing",
          page: "purchases",
        },
        kind: "shared",
      },
      {
        id: "project-summaries",
        title: {
          en: "Finance preview entry — not a separate project report",
          ar: "مدخل معاينة مالية — ليس تقرير مشاريع مستقلاً",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:finance",
        subject: {
          ar: "ملخصات مالية للمشروعات والمراحل",
          en: "Project and phase summaries",
        },
        summary: {
          en: "Existing finance preview with tabs and temporary session-payment simulation. No durable posting, accounting ledger or shared payment state.",
          ar: "معاينة مالية حالية بتبويبات ومحاكاة دفعات مؤقتة للجلسة؛ لا ترحيل دائم أو دفتر حسابات أو حالة دفعات مشتركة.",
        },
        sharedWith: {
          area: "accounting",
          page: "customer-balances",
        },
        kind: "shared",
      },
      {
        id: "invoices",
        title: {
          en: "Customer invoices — fixture preview",
          ar: "فواتير العملاء — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:invoices",
        subject: {
          ar: "فواتير العملاء",
          en: "Customer invoices",
        },
        summary: {
          en: "Illustrative customer invoices; no issuing, posting or download.",
          ar: "فواتير عملاء توضيحية دون إصدار أو ترحيل أو تنزيل.",
        },
        kind: "fixture",
      },
      {
        id: "certificates",
        title: {
          en: "Payment certificates — fixture preview",
          ar: "المستخلصات — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:certificates",
        subject: {
          ar: "المستخلصات",
          en: "Payment certificates",
        },
        summary: {
          en: "Illustrative payment certificates, separate from invoices and receipts; no certification or approval.",
          ar: "مستخلصات توضيحية منفصلة عن الفواتير والإيصالات؛ لا اعتماد أو إصدار.",
        },
        kind: "fixture",
      },
      {
        id: "payments",
        title: {
          en: "Actual payment records — fixture preview",
          ar: "سجلات المدفوعات الفعلية — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:payments",
        subject: {
          ar: "سجلات المدفوعات الفعلية",
          en: "Actual payment records",
        },
        summary: {
          en: "Incoming customer-payment fixtures only; not a cash/bank ledger or bank verification.",
          ar: "عينات دفعات واردة من العملاء فقط؛ ليست دفتر نقدية أو بنك أو تحققاً بنكياً.",
        },
        kind: "fixture",
      },
      {
        id: "receipts",
        title: {
          en: "Payment receipts — fixture preview",
          ar: "إيصالات السداد — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:receipts",
        subject: {
          ar: "إيصالات السداد",
          en: "Payment receipts",
        },
        summary: {
          en: "Illustrative receipt references linked to sample payments; no actual receipt issuance.",
          ar: "مراجع إيصالات توضيحية لدفعات نموذجية دون إصدار إيصالات فعلية.",
        },
        kind: "fixture",
      },
      {
        id: "expenses",
        title: {
          en: "Expenses — fixture preview",
          ar: "المصروفات — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:expenses",
        subject: {
          ar: "المصروفات",
          en: "Expenses",
        },
        summary: {
          en: "Expense fixtures only. An expense is not evidence of an actual outgoing payment.",
          ar: "عينات مصروفات فقط؛ المصروف لا يثبت تنفيذ دفعة نقدية صادرة.",
        },
        kind: "fixture",
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Financial reports and exports",
          ar: "مؤجل — التقارير والتصدير المالي",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "phase", "date", "status"],
        subject: {
          ar: "التقارير والتصدير المالي",
          en: "Financial reports and exports",
        },
        kind: "deferred",
        summary: {
          en: "Financial report calculations, parameters and business exports are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "حسابات التقارير المالية ومرشحاتها وتصدير الأعمال غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "accounting",
            page: "invoices",
          },
          {
            area: "accounting",
            page: "certificates",
          },
          {
            area: "accounting",
            page: "expenses",
          },
        ],
      },
      {
        id: "corrections",
        title: {
          en: "Deferred — Corrections and transaction history",
          ar: "مؤجل — التصحيحات وسجل المعاملات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "type", "actor", "date", "status"],
        subject: {
          ar: "التصحيحات وسجل المعاملات",
          en: "Corrections and transaction history",
        },
        kind: "deferred",
        summary: {
          en: "Corrections require reversal policy, authorization and immutable transaction history. This is a requirements note, not an operational screen or a completed UI.",
          ar: "التصحيح يتطلب سياسة عكس وتفويضاً وتاريخ معاملات غير قابل للتغيير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "treasury",
    title: {
      ar: "الخزينة والبنوك",
      en: "Treasury & banks",
    },
    provenance: "reference",
    boundary: {
      ar: "لا يوجد تكامل بنكي أو رصيد نقدي معتمد؛ الإدخال والمطابقة يتطلبان خدمة خزينة مخولة.",
      en: "No banking integration or authoritative cash position. Entry and reconciliation require an authorized treasury service.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Treasury overview",
          ar: "مؤجل — نظرة عامة على الخزينة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على الخزينة",
          en: "Treasury overview",
        },
        kind: "deferred",
        summary: {
          en: "No authoritative cash position or bank balance source is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد مصدر متصل لموقف نقدي أو رصيد بنك معتمد. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "treasury",
            page: "cash-register",
          },
          {
            area: "treasury",
            page: "disbursements",
          },
        ],
      },
      {
        id: "cash-register",
        title: {
          en: "Incoming cash-payment fixtures",
          ar: "عينات دفعات نقدية واردة",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:cash",
        subject: {
          ar: "سجل الحركة النقدية",
          en: "Cash movement register",
        },
        summary: {
          en: "Cash-method incoming customer payments only. Outgoing cash, opening/closing balances and reconciliation are not provided.",
          ar: "دفعات عملاء واردة بطريقة نقدية فقط؛ لا نقدية صادرة أو أرصدة افتتاحية وختامية أو تسوية.",
        },
        kind: "fixture",
      },
      {
        id: "bank-accounts",
        title: {
          en: "Deferred — Bank accounts and summaries",
          ar: "مؤجل — الحسابات البنكية وملخصاتها",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "name", "currency", "status"],
        subject: {
          ar: "الحسابات البنكية وملخصاتها",
          en: "Bank accounts and summaries",
        },
        kind: "deferred",
        summary: {
          en: "Bank account maintenance, account balances and bank feeds are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "إدارة حسابات البنوك وأرصدتها وتغذية البنك غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "receipts",
        title: {
          en: "Shared review entry — Receipts",
          ar: "مدخل مراجعة مشترك — المقبوضات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:receipts",
        subject: {
          ar: "المقبوضات",
          en: "Receipts",
        },
        summary: {
          en: "Illustrative receipt references linked to sample payments; no actual receipt issuance.",
          ar: "مراجع إيصالات توضيحية لدفعات نموذجية دون إصدار إيصالات فعلية.",
        },
        sharedWith: {
          area: "accounting",
          page: "receipts",
        },
        kind: "shared",
      },
      {
        id: "disbursements",
        title: {
          en: "Expense fixtures — not disbursements",
          ar: "عينات مصروفات — ليست دفعات صادرة",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:expenses",
        subject: {
          ar: "المدفوعات والمصروفات",
          en: "Disbursements",
        },
        summary: {
          en: "Expense fixtures only. An expense is not evidence of an actual outgoing payment.",
          ar: "عينات مصروفات فقط؛ المصروف لا يثبت تنفيذ دفعة نقدية صادرة.",
        },
        sharedWith: {
          area: "accounting",
          page: "expenses",
        },
        kind: "shared",
      },
      {
        id: "history",
        title: {
          en: "Incoming-payment preview entry — no bank history",
          ar: "مدخل معاينة دفعات واردة — دون تاريخ بنك",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:payments",
        subject: {
          ar: "سجل المعاملات النقدية والبنكية",
          en: "Cash and bank transaction history",
        },
        summary: {
          en: "Incoming customer-payment fixtures only; not a cash/bank ledger or bank verification.",
          ar: "عينات دفعات واردة من العملاء فقط؛ ليست دفتر نقدية أو بنك أو تحققاً بنكياً.",
        },
        sharedWith: {
          area: "accounting",
          page: "payments",
        },
        kind: "shared",
      },
      {
        id: "reconciliation",
        title: {
          en: "Deferred — Reconciliation workspace",
          ar: "مؤجل — مساحة المطابقة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "date", "amount", "status"],
        subject: {
          ar: "مساحة المطابقة",
          en: "Reconciliation workspace",
        },
        kind: "deferred",
        summary: {
          en: "No statement matching, reconciliation evidence or approval workflow exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد مطابقة كشوف أو أدلة تسوية أو مسار اعتماد. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Treasury reports",
          ar: "مؤجل — تقارير الخزينة",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الخزينة",
          en: "Treasury reports",
        },
        kind: "deferred",
        summary: {
          en: "Treasury reports require actual receipt/disbursement and account ledgers. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تقارير الخزينة تتطلب دفاتر حسابات وقبض وصرف فعلية. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "cheques",
    title: {
      ar: "إدارة الشيكات",
      en: "Cheque management",
    },
    provenance: "reference",
    boundary: {
      ar: "لا تتوفر سجلات شيكات أو تأكيدات بنكية؛ الإصدار والتحصيل والتسوية مؤجلة.",
      en: "No cheque records or banking confirmations are available. Issuance, clearance and settlement are deferred.",
    },
    pages: [
      {
        id: "register",
        title: {
          en: "Deferred — Cheque register",
          ar: "مؤجل — سجل الشيكات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "type", "party", "due", "amount", "status"],
        subject: {
          ar: "سجل الشيكات",
          en: "Cheque register",
        },
        kind: "deferred",
        summary: {
          en: "Cheque entry and a durable cheque register do not exist. This is a requirements note, not an operational screen or a completed UI.",
          ar: "إدخال الشيكات وسجل شيكات دائم غير موجودين. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "incoming",
        title: {
          en: "Deferred — Incoming cheques",
          ar: "مؤجل — الشيكات الواردة",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "party", "due", "amount", "status"],
        subject: {
          ar: "الشيكات الواردة",
          en: "Incoming cheques",
        },
        kind: "deferred",
        summary: {
          en: "No incoming-cheque records or collection/clearance operation exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد سجلات شيكات واردة أو عملية تحصيل ومقاصة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "outgoing",
        title: {
          en: "Deferred — Outgoing cheques",
          ar: "مؤجل — الشيكات الصادرة",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "party", "due", "amount", "status"],
        subject: {
          ar: "الشيكات الصادرة",
          en: "Outgoing cheques",
        },
        kind: "deferred",
        summary: {
          en: "No outgoing-cheque issue or beneficiary settlement operation exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد عملية إصدار شيكات صادرة أو تسوية مستفيد. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "details",
        title: {
          en: "Deferred — Cheque details workspace",
          ar: "مؤجل — مساحة تفاصيل الشيك",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "party", "date", "due", "amount", "status"],
        subject: {
          ar: "مساحة تفاصيل الشيك",
          en: "Cheque details workspace",
        },
        kind: "deferred",
        summary: {
          en: "No cheque ID is selected and no cheque-detail source exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لم يحدد معرف شيك ولا يوجد مصدر تفاصيل شيكات. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "maturity",
        title: {
          en: "Deferred — Due dates and maturities",
          ar: "مؤجل — تواريخ الاستحقاق",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "due", "party", "status"],
        subject: {
          ar: "تواريخ الاستحقاق",
          en: "Due dates and maturities",
        },
        kind: "deferred",
        summary: {
          en: "No cheque due-date dataset, maturity calculation or alerts exist. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد بيانات استحقاق شيكات أو حساب آجال أو تنبيهات. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "history",
        title: {
          en: "Deferred — Cheque status and history",
          ar: "مؤجل — حالات الشيكات وسجلها",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "actor", "date", "status"],
        subject: {
          ar: "حالات الشيكات وسجلها",
          en: "Cheque status and history",
        },
        kind: "deferred",
        summary: {
          en: "Cheque lifecycle events and audited status transitions are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "أحداث دورة الشيكات وانتقالات حالات مدققة غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "exceptions",
        title: {
          en: "Deferred — Returned, cancelled and settled",
          ar: "مؤجل — المرتجعة والملغاة والمسواة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "type", "date", "status"],
        subject: {
          ar: "المرتجعة والملغاة والمسواة",
          en: "Returned, cancelled and settled",
        },
        kind: "deferred",
        summary: {
          en: "Return, cancellation and settlement require approved cheque rules and evidence. This is a requirements note, not an operational screen or a completed UI.",
          ar: "الارتداد والإلغاء والتسوية تتطلب قواعد شيكات وأدلة معتمدة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Cheque reports",
          ar: "مؤجل — تقارير الشيكات",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الشيكات",
          en: "Cheque reports",
        },
        kind: "deferred",
        summary: {
          en: "No cheque report or bank-confirmed totals can be generated. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يمكن توليد تقرير شيكات أو إجماليات مؤكدة بنكياً. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [],
      },
    ],
  },
  {
    id: "sales",
    title: {
      ar: "المبيعات والعمليات التجارية",
      en: "Sales & commercial",
    },
    provenance: "reference",
    boundary: {
      ar: "تابع سلسلة المراجعة التجارية؛ العينات والمراجعات توضيحية والاعتماد والتسعير يتطلبان خدمات وقواعد.",
      en: "Follow the commercial review chain. Fixtures and revisions are illustrative; approval and pricing authority require services and rules.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Sales overview",
          ar: "مؤجل — نظرة عامة على المبيعات",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على المبيعات",
          en: "Sales overview",
        },
        kind: "deferred",
        summary: {
          en: "No live sales funnel, committed revenue or sales overview is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يتصل مسار مبيعات حي أو إيراد ملتزم أو نظرة مبيعات. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "leads",
        title: {
          en: "Contact inbox preview — not a lead pipeline",
          ar: "معاينة صندوق الاتصال — ليست مسار فرص بيع",
        },
        section: {
          ar: "الاستقبال",
          en: "Intake",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:messages",
        subject: {
          ar: "العملاء المحتملون والاستفسارات",
          en: "Leads and inquiries",
        },
        summary: {
          en: "Contact-message inbox fixtures only; no sales pipeline, outbound conversation history, contact action or lead conversion.",
          ar: "عينات صندوق رسائل الاتصال فقط؛ لا مسار فرص بيع أو تاريخ محادثات صادرة أو اتصال أو تحويل لطلب.",
        },
        kind: "preview",
      },
      {
        id: "requests",
        title: {
          en: "Customer requests — review preview",
          ar: "طلبات العملاء — معاينة مراجعة",
        },
        section: {
          ar: "الاستقبال",
          en: "Intake",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:requests",
        subject: {
          ar: "طلبات العملاء",
          en: "Customer requests",
        },
        summary: {
          en: "Existing request preview; status/assignee edits affect this mounted view only and disappear when it closes or reloads.",
          ar: "معاينة الطلبات الحالية؛ تعديلات الحالة والمسؤول تخص هذه الشاشة فقط وتزول عند مغادرتها أو إعادة تحميلها.",
        },
        kind: "preview",
      },
      {
        id: "inspections",
        title: {
          en: "Inspection record fixtures — scheduling unavailable",
          ar: "عينات سجلات معاينات — الجدولة غير متاحة",
        },
        section: {
          ar: "الاستقبال",
          en: "Intake",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:inspections",
        subject: {
          ar: "جدولة المعاينات ونتائجها",
          en: "Inspection scheduling and results",
        },
        summary: {
          en: "Inspection record fixtures only; scheduling and completion actions explain unavailability, not save changes.",
          ar: "عينات سجلات معاينات فقط؛ إجراءات الجدولة والإكمال تشرح عدم التوفر ولا تحفظ تغييرات.",
        },
        kind: "preview",
      },
      {
        id: "quotations",
        title: {
          en: "Quotation review fixtures — no editing, sending or decisions",
          ar: "عينات مراجعة عروض — دون تحرير أو إرسال أو قرارات",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quotations",
        subject: {
          ar: "عروض الأسعار",
          en: "Quotations",
        },
        summary: {
          en: "Quotation review fixtures and related links only; editing BOQ, sending, approval and customer decisions are unavailable.",
          ar: "عينات مراجعة عروض وروابط فقط؛ تحرير المقايسة والإرسال والاعتماد وقرارات العميل غير متاحة.",
        },
        kind: "preview",
      },
      {
        id: "boq",
        title: {
          en: "Bill of quantities — fixture preview",
          ar: "جدول الكميات — معاينة عينات",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:boq",
        subject: {
          ar: "جدول الكميات",
          en: "Bill of quantities",
        },
        summary: {
          en: "Read-only quotation BOQ line fixtures; no pricing editor or approved commercial quantities.",
          ar: "عينات بنود مقايسة عروض أسعار للقراءة فقط دون محرر تسعير أو كميات تجارية معتمدة.",
        },
        kind: "fixture",
      },
      {
        id: "revisions",
        title: {
          en: "Quotation preview entry — revision editing unavailable",
          ar: "مدخل معاينة عروض — تحرير الإصدارات غير متاح",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quotations",
        subject: {
          ar: "مراجعات العروض واعتمادها",
          en: "Quotation revisions and approval",
        },
        summary: {
          en: "Quotation review fixtures and related links only; editing BOQ, sending, approval and customer decisions are unavailable.",
          ar: "عينات مراجعة عروض وروابط فقط؛ تحرير المقايسة والإرسال والاعتماد وقرارات العميل غير متاحة.",
        },
        sharedWith: {
          area: "sales",
          page: "quotations",
        },
        kind: "shared",
        related: [
          {
            area: "sales",
            page: "quotations",
          },
        ],
      },
      {
        id: "decisions",
        title: {
          en: "Quotation preview entry — decisions unavailable",
          ar: "مدخل معاينة عروض — القرارات غير متاحة",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quotations",
        subject: {
          ar: "قبول العميل ورفضه",
          en: "Customer acceptance and rejection",
        },
        summary: {
          en: "Quotation review fixtures and related links only; editing BOQ, sending, approval and customer decisions are unavailable.",
          ar: "عينات مراجعة عروض وروابط فقط؛ تحرير المقايسة والإرسال والاعتماد وقرارات العميل غير متاحة.",
        },
        sharedWith: {
          area: "sales",
          page: "quotations",
        },
        kind: "shared",
        related: [
          {
            area: "sales",
            page: "quotations",
          },
        ],
      },
      {
        id: "contracts",
        title: {
          en: "Contract record fixtures — signing unavailable",
          ar: "عينات سجلات عقود — التوقيع غير متاح",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:contracts",
        subject: {
          ar: "العقود",
          en: "Contracts",
        },
        summary: {
          en: "Contract review fixtures only; contract issuance/signature and change-order approval are unavailable.",
          ar: "عينات مراجعة عقود فقط؛ إصدار وتوقيع العقود واعتماد أوامر التغيير غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "change-orders",
        title: {
          en: "Contract change-record fixtures — no revision editor",
          ar: "عينات تغييرات عقود — دون محرر إصدارات",
        },
        section: {
          ar: "العمليات التجارية",
          en: "Commercial",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:changes",
        subject: {
          ar: "مراجعات العقود وأوامر التغيير",
          en: "Contract revisions and change orders",
        },
        summary: {
          en: "Illustrative contract change records; no change-order approval or contract revision write.",
          ar: "سجلات تغييرات عقود توضيحية دون اعتماد أوامر تغيير أو تعديل عقود.",
        },
        kind: "fixture",
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Commercial reports",
          ar: "مؤجل — التقارير التجارية",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "التقارير التجارية",
          en: "Commercial reports",
        },
        kind: "deferred",
        summary: {
          en: "No commercial report calculations or authorized business exports are implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لم تنفذ حسابات تقارير تجارية أو تصديرات أعمال مخولة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "purchasing",
    title: {
      ar: "المشتريات والموردون",
      en: "Purchasing & suppliers",
    },
    provenance: "reference",
    boundary: {
      ar: "المشتريات منفصلة عن المخزون؛ فواتير ومدفوعات الموردين والمرتجعات والاعتمادات تحتاج خدمات مستقلة.",
      en: "Purchases are separate from inventory. Supplier invoices, supplier payment posting, returns and approvals need dedicated services.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Purchasing overview",
          ar: "مؤجل — نظرة عامة على المشتريات",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على المشتريات",
          en: "Purchasing overview",
        },
        kind: "deferred",
        summary: {
          en: "No authoritative purchasing overview is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد نظرة مشتريات معتمدة متصلة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "suppliers",
        title: {
          en: "Supplier directory — fixture preview",
          ar: "دليل الموردين — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:suppliers",
        subject: {
          ar: "دليل الموردين",
          en: "Supplier directory",
        },
        summary: {
          en: "Supplier contact/category fixtures only; no chronological supplier history or payable ledger.",
          ar: "عينات بيانات اتصال وتصنيفات موردين فقط دون سجل زمني للمورد أو دفتر مديونية.",
        },
        kind: "fixture",
      },
      {
        id: "supplier-history",
        title: {
          en: "Supplier directory entry — history unavailable",
          ar: "مدخل دليل الموردين — التاريخ غير متاح",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:suppliers",
        subject: {
          ar: "تفاصيل الموردين وسجلهم",
          en: "Supplier details and history",
        },
        summary: {
          en: "Supplier contact/category fixtures only; no chronological supplier history or payable ledger.",
          ar: "عينات بيانات اتصال وتصنيفات موردين فقط دون سجل زمني للمورد أو دفتر مديونية.",
        },
        sharedWith: {
          area: "purchasing",
          page: "suppliers",
        },
        kind: "shared",
      },
      {
        id: "purchases",
        title: {
          en: "Purchase-summary fixtures — recording and settlement unavailable",
          ar: "عينات ملخص شراء — التسجيل والتسوية غير متاح",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:purchases",
        subject: {
          ar: "سجلات المشتريات",
          en: "Purchase records",
        },
        summary: {
          en: "Existing supplier/purchase preview. Payables are illustrative arithmetic over purchase summaries, not a supplier invoice/payment ledger.",
          ar: "معاينة الموردين والمشتريات الحالية؛ المديونية حساب توضيحي لملخصات شراء وليست دفتر فواتير ودفعات موردين.",
        },
        kind: "preview",
      },
      {
        id: "lines",
        title: {
          en: "Purchase lines — fixture preview",
          ar: "بنود المشتريات — معاينة عينات",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:purchase-lines",
        subject: {
          ar: "بنود المشتريات",
          en: "Purchase lines",
        },
        summary: {
          en: "Illustrative purchase lines, quantities and unit prices; not stock movements.",
          ar: "بنود شراء وكميات وأسعار وحدات توضيحية؛ ليست حركات مخزنية.",
        },
        kind: "fixture",
      },
      {
        id: "invoices",
        title: {
          en: "Deferred — Supplier invoices and attachments",
          ar: "مؤجل — فواتير الموردين ومرفقاتها",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "supplier", "date", "amount", "status"],
        subject: {
          ar: "فواتير الموردين ومرفقاتها",
          en: "Supplier invoices and attachments",
        },
        kind: "deferred",
        summary: {
          en: "Separate supplier invoice entry, attachment storage and approval are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "إدخال فواتير موردين منفصلة وتخزين مرفقاتها واعتمادها غير متاح. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "payments",
        title: {
          en: "Deferred — Supplier payment records",
          ar: "مؤجل — سجلات مدفوعات الموردين",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "supplier", "date", "amount", "status"],
        subject: {
          ar: "سجلات مدفوعات الموردين",
          en: "Supplier payment records",
        },
        kind: "deferred",
        summary: {
          en: "No supplier-payment ledger, settlement or payment verification service exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد دفتر دفعات موردين أو تسوية أو خدمة تحقق دفع. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "payables",
        title: {
          en: "Purchase-summary preview entry — no payable ledger",
          ar: "مدخل معاينة ملخص شراء — دون دفتر مديونية",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:purchases",
        subject: {
          ar: "أرصدة مستحقات الموردين",
          en: "Supplier payable balances",
        },
        summary: {
          en: "Existing supplier/purchase preview. Payables are illustrative arithmetic over purchase summaries, not a supplier invoice/payment ledger.",
          ar: "معاينة الموردين والمشتريات الحالية؛ المديونية حساب توضيحي لملخصات شراء وليست دفتر فواتير ودفعات موردين.",
        },
        sharedWith: {
          area: "purchasing",
          page: "purchases",
        },
        kind: "shared",
      },
      {
        id: "returns",
        title: {
          en: "Deferred — Returns and correction history",
          ar: "مؤجل — المرتجعات وسجل التصحيحات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "supplier", "item", "date", "status"],
        subject: {
          ar: "المرتجعات وسجل التصحيحات",
          en: "Returns and correction history",
        },
        kind: "deferred",
        summary: {
          en: "Purchase returns/corrections require distinct records and approved rules. This is a requirements note, not an operational screen or a completed UI.",
          ar: "مرتجعات وتصحيحات الشراء تتطلب سجلات منفصلة وقواعد معتمدة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "allocations",
        title: {
          en: "Purchase/project association fixtures — not allocation accounting",
          ar: "عينات روابط شراء ومشاريع — ليست محاسبة تخصيص",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:purchase-allocations",
        subject: {
          ar: "توزيع المشتريات على المشروعات والمراحل",
          en: "Project and phase allocations",
        },
        summary: {
          en: "Purchase-to-project/phase associations only; no quantity/cost allocation ledger or allocation editor.",
          ar: "روابط المشتريات بالمشاريع والمراحل فقط؛ لا دفتر تخصيص كميات أو تكاليف أو محرر تخصيص.",
        },
        kind: "fixture",
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Purchasing reports",
          ar: "مؤجل — تقارير المشتريات",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير المشتريات",
          en: "Purchasing reports",
        },
        kind: "deferred",
        summary: {
          en: "Purchasing reports need authorized invoice/payment/return datasets. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تقارير المشتريات تحتاج بيانات فواتير ودفعات ومرتجعات مخولة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "inventory",
    title: {
      ar: "المخزون والمستودعات",
      en: "Inventory & warehouses",
    },
    provenance: "reference",
    boundary: {
      ar: "سياسات وتقييم المخزون وخدمات الحركة المخولة غير محددة؛ لا يتم اختلاق أرصدة أو حركات مخزون.",
      en: "Inventory policies, valuation and authorized movement services are not established. No stock balances or movements are fabricated.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Inventory overview",
          ar: "مؤجل — نظرة عامة على المخزون",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على المخزون",
          en: "Inventory overview",
        },
        kind: "deferred",
        summary: {
          en: "No stock ledger or authoritative inventory position exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد دفتر مخزون أو موقف مخزني معتمد. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "items",
        title: {
          en: "Deferred — Item catalogue",
          ar: "مؤجل — دليل الأصناف",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "item", "unit", "status"],
        subject: {
          ar: "دليل الأصناف",
          en: "Item catalogue",
        },
        kind: "deferred",
        summary: {
          en: "Item codes, units and catalogue maintenance are not implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "أكواد الأصناف والوحدات وإدارة الدليل غير منفذة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "warehouses",
        title: {
          en: "Deferred — Warehouse and location directory",
          ar: "مؤجل — دليل المستودعات والمواقع",
        },
        section: {
          ar: "السجلات",
          en: "Registers",
        },
        fields: ["ref", "name", "location", "status"],
        subject: {
          ar: "دليل المستودعات والمواقع",
          en: "Warehouse and location directory",
        },
        kind: "deferred",
        summary: {
          en: "Warehouse/location records and custody permissions are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "سجلات المخازن والمواقع وصلاحيات العهدة غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "receipts",
        title: {
          en: "Deferred — Stock receipts",
          ar: "مؤجل — استلامات المخزون",
        },
        section: {
          ar: "الحركات",
          en: "Movements",
        },
        fields: ["ref", "item", "location", "quantity", "date"],
        subject: {
          ar: "استلامات المخزون",
          en: "Stock receipts",
        },
        kind: "deferred",
        summary: {
          en: "Stock-receipt recording and quantity evidence are unavailable. Purchases are not stock receipts. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تسجيل استلام مخزني وأدلة الكمية غير متاح؛ المشتريات ليست استلاماً مخزنياً. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "balances",
        title: {
          en: "Deferred — Stock balances",
          ar: "مؤجل — أرصدة المخزون",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["item", "location", "unit", "quantity"],
        subject: {
          ar: "أرصدة المخزون",
          en: "Stock balances",
        },
        kind: "deferred",
        summary: {
          en: "No quantity-on-hand or valuation engine exists; no zero balances are implied. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد حساب كمية متاحة أو تقييم؛ لا يعني الغياب أرصدة صفرية. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "issues",
        title: {
          en: "Deferred — Issues to projects and phases",
          ar: "مؤجل — الصرف للمشروعات والمراحل",
        },
        section: {
          ar: "الحركات",
          en: "Movements",
        },
        fields: ["ref", "item", "project", "phase", "quantity", "date"],
        subject: {
          ar: "الصرف للمشروعات والمراحل",
          en: "Issues to projects and phases",
        },
        kind: "deferred",
        summary: {
          en: "Issues require a stock source, project/phase destination and authorized movement rules. This is a requirements note, not an operational screen or a completed UI.",
          ar: "الصرف يتطلب مصدر مخزون وجهة مشروع أو مرحلة وقواعد حركة مخولة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "transfers",
        title: {
          en: "Deferred — Stock transfers",
          ar: "مؤجل — تحويلات المخزون",
        },
        section: {
          ar: "الحركات",
          en: "Movements",
        },
        fields: ["ref", "item", "location", "quantity", "date"],
        subject: {
          ar: "تحويلات المخزون",
          en: "Stock transfers",
        },
        kind: "deferred",
        summary: {
          en: "Transfers require separate source/destination locations and auditable movement records. This is a requirements note, not an operational screen or a completed UI.",
          ar: "التحويل يتطلب موقعي مصدر ووجهة منفصلين وسجلات حركة مدققة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "returns",
        title: {
          en: "Deferred — Stock returns",
          ar: "مؤجل — مرتجعات المخزون",
        },
        section: {
          ar: "الحركات",
          en: "Movements",
        },
        fields: ["ref", "item", "project", "quantity", "date"],
        subject: {
          ar: "مرتجعات المخزون",
          en: "Stock returns",
        },
        kind: "deferred",
        summary: {
          en: "No stock-return entry or reconciliation with original issues is implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "إدخال مرتجع مخزني أو تسويته مع الصرف الأصلي غير منفذ. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "adjustments",
        title: {
          en: "Deferred — Adjustments and damage",
          ar: "مؤجل — التسويات والتالف",
        },
        section: {
          ar: "الحركات",
          en: "Movements",
        },
        fields: ["ref", "item", "quantity", "reason", "date"],
        subject: {
          ar: "التسويات والتالف",
          en: "Adjustments and damage",
        },
        kind: "deferred",
        summary: {
          en: "Adjustments/damage require approved reasons, quantity evidence and approval. This is a requirements note, not an operational screen or a completed UI.",
          ar: "التسويات والتالف تتطلب أسباباً معتمدة وأدلة كمية واعتماداً. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "history",
        title: {
          en: "Deferred — Movement history",
          ar: "مؤجل — سجل حركات المخزون",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "item", "type", "quantity", "date", "status"],
        subject: {
          ar: "سجل حركات المخزون",
          en: "Movement history",
        },
        kind: "deferred",
        summary: {
          en: "No durable stock movement chronology exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد تسلسل دائم لحركات المخزون. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Inventory reports",
          ar: "مؤجل — تقارير المخزون",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير المخزون",
          en: "Inventory reports",
        },
        kind: "deferred",
        summary: {
          en: "Inventory reports need verified movement/balance datasets; none are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تقارير المخزون تحتاج حركات وأرصدة متحققة؛ لا توجد مصادر متصلة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "projects",
    title: {
      ar: "إدارة المشروعات",
      en: "Project management",
    },
    provenance: "reference",
    boundary: {
      ar: "المشروعات تربط العملاء والمراحل والتكليفات والأدلة؛ كل تقدم معروض مصدره سجلات المعاينة التوضيحية الحالية.",
      en: "Root projects connect customers, phases, assignments and evidence. All displayed progress must come from existing explicit preview records.",
    },
    pages: [
      {
        id: "portfolio",
        title: {
          en: "Project portfolio — review preview",
          ar: "محفظة المشروعات — معاينة مراجعة",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:projects",
        subject: {
          ar: "محفظة المشروعات",
          en: "Project portfolio",
        },
        summary: {
          en: "Existing project portfolio fixtures and workspace links; project plan edits are unavailable.",
          ar: "عينات محفظة المشاريع وروابط مساحات العمل؛ تعديل خطط المشاريع غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "workspaces",
        title: {
          en: "Project directory fixtures — open existing workspaces",
          ar: "عينات دليل مشاريع — افتح مساحات العمل الحالية",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:projects",
        subject: {
          ar: "تفاصيل المشروعات ومساحات العمل",
          en: "Project details and workspaces",
        },
        summary: {
          en: "All illustrative projects in this preview, not scoped to a selected customer. Open an existing workspace for context.",
          ar: "كل المشاريع التوضيحية في المعاينة وليست مقيدة بعميل مختار؛ افتح مساحة المشروع للسياق.",
        },
        kind: "fixture",
      },
      {
        id: "phases",
        title: {
          en: "Project phases — fixture preview",
          ar: "مراحل المشروعات — معاينة عينات",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:phases",
        subject: {
          ar: "مراحل المشروعات",
          en: "Project phases",
        },
        summary: {
          en: "Illustrative phase rows and project links; no phase edits or schedule execution.",
          ar: "صفوف مراحل توضيحية وروابط مشاريع دون تعديل مراحل أو تنفيذ جدول زمني.",
        },
        kind: "fixture",
      },
      {
        id: "milestones",
        title: {
          en: "Milestone review fixtures — updates unavailable",
          ar: "عينات مراجعة معالم — التحديث غير متاح",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:milestones",
        subject: {
          ar: "معالم المشروعات",
          en: "Project milestones",
        },
        summary: {
          en: "Milestone review fixtures, not an editable schedule or dependency-planning tool.",
          ar: "عينات مراجعة معالم وليست جدولاً قابلاً للتحرير أو أداة تخطيط تبعيات.",
        },
        kind: "preview",
      },
      {
        id: "schedule",
        title: {
          en: "Milestone preview entry — schedule editor unavailable",
          ar: "مدخل معاينة معالم — محرر الجدول غير متاح",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:milestones",
        subject: {
          ar: "الجداول والأنشطة القادمة",
          en: "Schedules and upcoming activities",
        },
        summary: {
          en: "Milestone review fixtures, not an editable schedule or dependency-planning tool.",
          ar: "عينات مراجعة معالم وليست جدولاً قابلاً للتحرير أو أداة تخطيط تبعيات.",
        },
        sharedWith: {
          area: "projects",
          page: "milestones",
        },
        kind: "shared",
      },
      {
        id: "assignments",
        title: {
          en: "Engineer workload preview — assignments unavailable",
          ar: "معاينة أحمال مهندسين — إدارة التكليفات غير متاحة",
        },
        section: {
          ar: "التنفيذ",
          en: "Execution",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:engineers",
        subject: {
          ar: "تكليفات المهندسين والفريق",
          en: "Engineer and staff assignments",
        },
        summary: {
          en: "Engineer workload/assignment fixtures and contextual request links; no assignment management or staff changes.",
          ar: "عينات أحمال وتكليفات مهندسين وروابط طلبات سياقية دون إدارة تكليفات أو تعديل موظفين.",
        },
        kind: "preview",
      },
      {
        id: "diary",
        title: {
          en: "Site-diary fixtures — editing unavailable",
          ar: "عينات يوميات موقع — التحرير غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:diary",
        subject: {
          ar: "اليومية الموقعية",
          en: "Site diary",
        },
        summary: {
          en: "Site diary review fixtures only; diary edits and evidence uploads are unavailable.",
          ar: "عينات مراجعة يوميات موقع فقط؛ تعديل اليوميات ورفع الأدلة غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "progress",
        title: {
          en: "Progress and evidence fixtures — updates unavailable",
          ar: "عينات تقدم وأدلة — التحديث غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:progress",
        subject: {
          ar: "سجلات التقدم والأدلة",
          en: "Progress records and evidence",
        },
        summary: {
          en: "Progress and evidence review fixtures only; no progress updates or evidence uploads.",
          ar: "عينات مراجعة تقدم وأدلة فقط؛ لا تحديث تقدم أو رفع أدلة.",
        },
        kind: "preview",
      },
      {
        id: "issues",
        title: {
          en: "Issue and finding fixtures — closure unavailable",
          ar: "عينات ملاحظات وعيوب — الإغلاق غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:issues",
        subject: {
          ar: "المشكلات والإجراءات التصحيحية",
          en: "Issues and corrective actions",
        },
        summary: {
          en: "Issue/finding review fixtures only; no independent corrective-action workflow or closure operation.",
          ar: "عينات مراجعة ملاحظات وعيوب فقط؛ لا مسار مستقل لإجراءات تصحيح أو إغلاق فعلي.",
        },
        kind: "preview",
      },
      {
        id: "quality",
        title: {
          en: "Quality inspections and findings — review preview",
          ar: "معاينات الجودة والملاحظات — معاينة مراجعة",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quality",
        subject: {
          ar: "معاينات الجودة والملاحظات",
          en: "Quality inspections and findings",
        },
        summary: {
          en: "Construction-quality review fixtures only; no checklist editing, material testing or acceptance operation.",
          ar: "عينات مراجعة جودة إنشاءات فقط دون تحرير قوائم فحص أو اختبار مواد أو اعتماد استلام.",
        },
        kind: "preview",
      },
      {
        id: "weekly-reports",
        title: {
          en: "Weekly-report fixtures — approval and delivery unavailable",
          ar: "عينات تقارير أسبوعية — الاعتماد والتسليم غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:reports",
        subject: {
          ar: "التقارير الأسبوعية واعتمادها",
          en: "Weekly reports and approval",
        },
        summary: {
          en: "Weekly-report review fixtures only; approving and publishing/delivering reports are unavailable.",
          ar: "عينات مراجعة تقارير أسبوعية فقط؛ اعتماد ونشر وتسليم التقارير غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "documents",
        title: {
          en: "Document metadata fixtures — upload and download unavailable",
          ar: "عينات بيانات مستندات — الرفع والتنزيل غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:documents",
        subject: {
          ar: "مستندات المشروعات",
          en: "Project documents",
        },
        summary: {
          en: "Document metadata preview only; upload and file download are unavailable.",
          ar: "معاينة بيانات مستندات فقط؛ رفع وتنزيل الملفات غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "handover",
        title: {
          en: "Handover review fixtures — completion unavailable",
          ar: "عينات مراجعة تسليم — الإكمال غير متاح",
        },
        section: {
          ar: "الإقفال",
          en: "Closeout",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:handover",
        subject: {
          ar: "التسليم",
          en: "Handover",
        },
        summary: {
          en: "Handover review fixtures and workspace links only; no scheduling or completion operation.",
          ar: "عينات مراجعة تسليم وروابط مساحات عمل فقط دون جدولة أو إكمال تسليم.",
        },
        kind: "preview",
      },
      {
        id: "warranty",
        title: {
          en: "Warranty fixtures — scheduling and closure unavailable",
          ar: "عينات ضمان — الجدولة والإغلاق غير متاح",
        },
        section: {
          ar: "الإقفال",
          en: "Closeout",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:warranty",
        subject: {
          ar: "الضمان",
          en: "Warranty",
        },
        summary: {
          en: "Warranty review fixtures only; no visit scheduling or warranty-item closure.",
          ar: "عينات مراجعة ضمان فقط دون جدولة زيارات أو إغلاق بنود ضمان.",
        },
        kind: "preview",
      },
      {
        id: "history",
        title: {
          en: "Project-status history fixtures — no phase history",
          ar: "عينات تاريخ حالات مشاريع — دون تاريخ مراحل",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:project-history",
        subject: {
          ar: "سجل المشروعات والمراحل",
          en: "Project and phase history",
        },
        summary: {
          en: "Project-status history fixtures only; phase-status history is not provided.",
          ar: "عينات تاريخ حالات المشاريع فقط؛ لا تتضمن تاريخ حالات المراحل.",
        },
        kind: "fixture",
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Project operational reports",
          ar: "مؤجل — التقارير التشغيلية للمشروعات",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "التقارير التشغيلية للمشروعات",
          en: "Project operational reports",
        },
        kind: "deferred",
        summary: {
          en: "No operational project report builder or business export is implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لم تنفذ أداة تقارير تشغيل مشاريع أو تصدير بيانات أعمال. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "projects",
            page: "weekly-reports",
          },
        ],
      },
    ],
  },
  {
    id: "reporting",
    title: {
      ar: "التقارير العامة",
      en: "General reports",
    },
    provenance: "reference",
    boundary: {
      ar: "مصادر التقارير وتغطيتها واضحة؛ الأرقام التوضيحية ليست مؤشرات معتمدة للشركة وتصدير بيانات الأعمال مؤجل.",
      en: "Report sources and coverage are explicit. No illustrative figure is an authoritative company statistic; business-data exports remain deferred.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Open management dashboard preview — link only",
          ar: "فتح معاينة لوحة الإدارة — رابط فقط",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:overview",
        subject: {
          ar: "نظرة الإدارة العامة",
          en: "Management overview",
        },
        summary: {
          en: "This page provides a link to the existing illustrative management dashboard; it does not embed a separate report screen.",
          ar: "توفر هذه الصفحة رابطاً للوحة الإدارة التوضيحية الحالية ولا تدمج شاشة تقارير مستقلة.",
        },
        kind: "source-link",
      },
      {
        id: "projects",
        title: {
          en: "Shared review entry — Project reports",
          ar: "مدخل مراجعة مشترك — تقارير المشروعات",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:reports",
        subject: {
          ar: "تقارير المشروعات",
          en: "Project reports",
        },
        summary: {
          en: "Weekly-report review fixtures only; approving and publishing/delivering reports are unavailable.",
          ar: "عينات مراجعة تقارير أسبوعية فقط؛ اعتماد ونشر وتسليم التقارير غير متاح.",
        },
        sharedWith: {
          area: "projects",
          page: "weekly-reports",
        },
        kind: "shared",
      },
      {
        id: "commercial",
        title: {
          en: "Deferred — Commercial reports",
          ar: "مؤجل — التقارير التجارية",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "التقارير التجارية",
          en: "Commercial reports",
        },
        kind: "deferred",
        summary: {
          en: "Commercial reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير تجارية وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "purchasing",
        title: {
          en: "Deferred — Purchasing reports",
          ar: "مؤجل — تقارير المشتريات",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير المشتريات",
          en: "Purchasing reports",
        },
        kind: "deferred",
        summary: {
          en: "Purchasing reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير مشتريات وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "suppliers",
        title: {
          en: "Deferred — Supplier reports",
          ar: "مؤجل — تقارير الموردين",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الموردين",
          en: "Supplier reports",
        },
        kind: "deferred",
        summary: {
          en: "Supplier reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير موردين وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "inventory",
        title: {
          en: "Deferred — Inventory reports",
          ar: "مؤجل — تقارير المخزون",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير المخزون",
          en: "Inventory reports",
        },
        kind: "deferred",
        summary: {
          en: "Inventory reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير مخزون وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "treasury",
        title: {
          en: "Deferred — Treasury reports",
          ar: "مؤجل — تقارير الخزينة",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الخزينة",
          en: "Treasury reports",
        },
        kind: "deferred",
        summary: {
          en: "Treasury reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير خزينة وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "financial",
        title: {
          en: "Deferred — Financial reports",
          ar: "مؤجل — التقارير المالية",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "التقارير المالية",
          en: "Financial reports",
        },
        kind: "deferred",
        summary: {
          en: "Financial reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير مالية وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "accounting",
            page: "invoices",
          },
          {
            area: "accounting",
            page: "payments",
          },
        ],
      },
      {
        id: "customers",
        title: {
          en: "Deferred — Customer reports",
          ar: "مؤجل — تقارير العملاء",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير العملاء",
          en: "Customer reports",
        },
        kind: "deferred",
        summary: {
          en: "Customer reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير عملاء وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "operations",
        title: {
          en: "Deferred — Operational performance reports",
          ar: "مؤجل — تقارير الأداء التشغيلي",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الأداء التشغيلي",
          en: "Operational performance reports",
        },
        kind: "deferred",
        summary: {
          en: "Operational performance reports generation and business-data export are unavailable; no report dataset or calculations are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "توليد تقارير أداء تشغيل وتصدير بيانات أعمال غير متاح؛ لا تتصل بيانات أو حسابات تقرير. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "audit",
        title: {
          en: "Shared review entry — Audit and activity reports",
          ar: "مدخل مراجعة مشترك — تقارير التدقيق والنشاط",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:audit",
        subject: {
          ar: "تقارير التدقيق والنشاط",
          en: "Audit and activity reports",
        },
        summary: {
          en: "Illustrative audit chronology only; not security-event monitoring or a business-data export service.",
          ar: "تسلسل تدقيق توضيحي فقط؛ ليس مراقبة أحداث أمنية أو خدمة تصدير بيانات أعمال.",
        },
        sharedWith: {
          area: "administration",
          page: "audit",
        },
        kind: "shared",
      },
      {
        id: "exports",
        title: {
          en: "Navigation metadata download entry — no report export",
          ar: "مدخل تنزيل بيانات التنقل — دون تصدير تقارير",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        source: "export",
        subject: {
          ar: "مساحة تصدير التقارير",
          en: "Report export workspace",
        },
        summary: {
          en: "Downloads static navigation names and routes only, never reports or business records.",
          ar: "ينزل أسماء ومسارات التنقل الثابتة فقط وليس تقارير أو سجلات أعمال.",
        },
        sharedWith: {
          area: "data",
          page: "export",
        },
        kind: "shared",
        related: [
          {
            area: "data",
            page: "export",
          },
        ],
      },
    ],
  },
  {
    id: "settings",
    title: {
      ar: "الإعدادات الفنية",
      en: "Technical settings",
    },
    provenance: "reference",
    boundary: {
      ar: "دليل إعدادات للقراءة فقط؛ لا يتم عرض أو تعديل قيم البيئة أو بيانات الدخول أو إعدادات التشغيل.",
      en: "Read-only configuration catalogue. No environment values, credentials or operational settings are exposed or changed.",
    },
    pages: [
      {
        id: "general",
        title: {
          en: "Read-only note — General settings",
          ar: "مذكرة للقراءة فقط — الإعدادات العامة",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "الإعدادات العامة",
          en: "General settings",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "localization",
        title: {
          en: "Read-only note — Localization and display preferences",
          ar: "مذكرة للقراءة فقط — اللغة وتفضيلات العرض",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "اللغة وتفضيلات العرض",
          en: "Localization and display preferences",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "modules",
        title: {
          en: "Read-only note — Module configuration",
          ar: "مذكرة للقراءة فقط — إعداد الوحدات",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "إعداد الوحدات",
          en: "Module configuration",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "notifications",
        title: {
          en: "Read-only note — Notification configuration",
          ar: "مذكرة للقراءة فقط — إعداد الإشعارات",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "إعداد الإشعارات",
          en: "Notification configuration",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "documents",
        title: {
          en: "Read-only note — Document and attachment settings",
          ar: "مذكرة للقراءة فقط — إعداد المستندات والمرفقات",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "إعداد المستندات والمرفقات",
          en: "Document and attachment settings",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "operations",
        title: {
          en: "Read-only note — Operational configuration",
          ar: "مذكرة للقراءة فقط — إعداد التشغيل",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "إعداد التشغيل",
          en: "Operational configuration",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "health",
        title: {
          en: "Read-only note — Service health and diagnostics",
          ar: "مذكرة للقراءة فقط — حالة الخدمات والتشخيص",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "diagnostics",
        subject: {
          ar: "حالة الخدمات والتشخيص",
          en: "Service health and diagnostics",
        },
        summary: {
          en: "Read-only role/adapter boundary and implementation catalogue, not a live health probe or session/security-event inspector.",
          ar: "حدود دور ومحول ودليل تنفيذ للقراءة فقط؛ ليست فحص صحة حي أو عارض جلسات وأحداث أمنية.",
        },
        kind: "readiness",
      },
      {
        id: "history",
        title: {
          en: "Deferred — Configuration history",
          ar: "مؤجل — سجل الإعدادات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "type", "actor", "date", "status"],
        subject: {
          ar: "سجل الإعدادات",
          en: "Configuration history",
        },
        kind: "deferred",
        summary: {
          en: "No versioned configuration change log is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يتصل سجل تغييرات إعدادات بإصدارات. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "quality",
    title: {
      ar: "جودة أعمال البناء والتشطيب",
      en: "Construction quality",
    },
    provenance: "adapted",
    boundary: {
      ar: "تكييف لفئة التصنيع والجودة لأعمال البناء؛ لا يُدّعى وجود مصنع أو نظام تنفيذ تصنيع أو جدول إنتاج.",
      en: "Adapted from the manufacturing/quality reference category for construction. No factory, manufacturing execution or production schedule is claimed.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Deferred — Quality overview",
          ar: "مؤجل — نظرة عامة على الجودة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "نظرة عامة على الجودة",
          en: "Quality overview",
        },
        kind: "deferred",
        summary: {
          en: "No authoritative construction-quality overview is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا تتصل نظرة جودة إنشاءات معتمدة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "inspections",
        title: {
          en: "Shared review entry — Quality inspection records",
          ar: "مدخل مراجعة مشترك — سجلات معاينات الجودة",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quality",
        subject: {
          ar: "سجلات معاينات الجودة",
          en: "Quality inspection records",
        },
        summary: {
          en: "Construction-quality review fixtures only; no checklist editing, material testing or acceptance operation.",
          ar: "عينات مراجعة جودة إنشاءات فقط دون تحرير قوائم فحص أو اختبار مواد أو اعتماد استلام.",
        },
        sharedWith: {
          area: "projects",
          page: "quality",
        },
        kind: "shared",
      },
      {
        id: "findings",
        title: {
          en: "Shared review entry — Findings and defects",
          ar: "مدخل مراجعة مشترك — الملاحظات والعيوب",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:issues",
        subject: {
          ar: "الملاحظات والعيوب",
          en: "Findings and defects",
        },
        summary: {
          en: "Issue/finding review fixtures only; no independent corrective-action workflow or closure operation.",
          ar: "عينات مراجعة ملاحظات وعيوب فقط؛ لا مسار مستقل لإجراءات تصحيح أو إغلاق فعلي.",
        },
        sharedWith: {
          area: "projects",
          page: "issues",
        },
        kind: "shared",
      },
      {
        id: "corrective-actions",
        title: {
          en: "Issue preview entry — corrective workflow unavailable",
          ar: "مدخل معاينة ملاحظات — مسار التصحيح غير متاح",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:issues",
        subject: {
          ar: "الإجراءات التصحيحية",
          en: "Corrective actions",
        },
        summary: {
          en: "Issue/finding review fixtures only; no independent corrective-action workflow or closure operation.",
          ar: "عينات مراجعة ملاحظات وعيوب فقط؛ لا مسار مستقل لإجراءات تصحيح أو إغلاق فعلي.",
        },
        sharedWith: {
          area: "projects",
          page: "issues",
        },
        kind: "shared",
      },
      {
        id: "checklists",
        title: {
          en: "Deferred — Inspection checklists",
          ar: "مؤجل — قوائم فحص المعاينة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "item", "criteria", "status"],
        subject: {
          ar: "قوائم فحص المعاينة",
          en: "Inspection checklists",
        },
        kind: "deferred",
        summary: {
          en: "Checklist editing, acceptance criteria and inspection completion are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "تحرير قوائم الفحص ومعايير القبول وإكمال الفحوص غير متاح. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "materials",
        title: {
          en: "Deferred — Material and workmanship quality",
          ar: "مؤجل — جودة المواد والمصنعية",
        },
        section: {
          ar: "الأدلة",
          en: "Evidence",
        },
        fields: ["ref", "item", "project", "phase", "date", "status"],
        subject: {
          ar: "جودة المواد والمصنعية",
          en: "Material and workmanship quality",
        },
        kind: "deferred",
        summary: {
          en: "Material/workmanship test records, evidence and approval are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "سجلات اختبار مواد وصنعة وأدلتها واعتمادها غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Quality reports",
          ar: "مؤجل — تقارير الجودة",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير الجودة",
          en: "Quality reports",
        },
        kind: "deferred",
        summary: {
          en: "No quality-report generator or accepted defect metrics are implemented. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لم ينفذ مولد تقارير جودة أو مؤشرات عيوب معتمدة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "quality",
            page: "inspections",
          },
        ],
      },
    ],
  },
  {
    id: "crm",
    title: {
      ar: "علاقات العملاء",
      en: "Customer relations",
    },
    provenance: "reference",
    boundary: {
      ar: "تربط مساحة العميل الطلبات والعقود والمشروعات؛ الملاحظات الداخلية لا تُعرض للعميل ولا توجد متابعة محفوظة أو هوية بوابة جديدة.",
      en: "Customer workspace fixtures connect requests, contracts and projects. Internal notes are not customer-visible; no persisted follow-up or new portal identity model.",
    },
    pages: [
      {
        id: "customers",
        title: {
          en: "Customer directory fixtures — editing unavailable",
          ar: "عينات دليل عملاء — التحرير غير متاح",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:customers",
        subject: {
          ar: "دليل العملاء",
          en: "Customer directory",
        },
        summary: {
          en: "Existing customer-directory fixtures and contextual workspace links; no customer editing here.",
          ar: "عينات دليل العملاء وروابط مساحات العمل الحالية؛ لا تعديل عملاء هنا.",
        },
        kind: "preview",
      },
      {
        id: "profiles",
        title: {
          en: "Customer reference fixtures — open full preview profiles",
          ar: "عينات مراجع عملاء — افتح ملفات المعاينة الأوسع",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:customers",
        subject: {
          ar: "ملفات العملاء",
          en: "Customer profiles",
        },
        summary: {
          en: "Name/city references derived from request fixtures; open the existing customer workspace for a fuller preview profile.",
          ar: "مراجع أسماء ومدن مستخرجة من عينات الطلبات؛ افتح مساحة العميل لملف معاينة أوسع.",
        },
        kind: "fixture",
      },
      {
        id: "contacts",
        title: {
          en: "Deferred — Contacts and preferences",
          ar: "مؤجل — جهات الاتصال والتفضيلات",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "customer", "type", "status"],
        subject: {
          ar: "جهات الاتصال والتفضيلات",
          en: "Contacts and preferences",
        },
        kind: "deferred",
        summary: {
          en: "Customer contact/preference records and consent updates are unavailable. This is a requirements note, not an operational screen or a completed UI.",
          ar: "سجلات اتصال وتفضيلات عملاء وتحديث موافقات غير متاحة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "requests",
        title: {
          en: "Shared review entry — Customer request history",
          ar: "مدخل مراجعة مشترك — سجل طلبات العملاء",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:requests",
        subject: {
          ar: "سجل طلبات العملاء",
          en: "Customer request history",
        },
        summary: {
          en: "Existing request preview; status/assignee edits affect this mounted view only and disappear when it closes or reloads.",
          ar: "معاينة الطلبات الحالية؛ تعديلات الحالة والمسؤول تخص هذه الشاشة فقط وتزول عند مغادرتها أو إعادة تحميلها.",
        },
        sharedWith: {
          area: "sales",
          page: "requests",
        },
        kind: "shared",
      },
      {
        id: "inspections",
        title: {
          en: "Shared review entry — Inspection history",
          ar: "مدخل مراجعة مشترك — سجل المعاينات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:inspections",
        subject: {
          ar: "سجل المعاينات",
          en: "Inspection history",
        },
        summary: {
          en: "Inspection record fixtures only; scheduling and completion actions explain unavailability, not save changes.",
          ar: "عينات سجلات معاينات فقط؛ إجراءات الجدولة والإكمال تشرح عدم التوفر ولا تحفظ تغييرات.",
        },
        sharedWith: {
          area: "sales",
          page: "inspections",
        },
        kind: "shared",
      },
      {
        id: "commercial",
        title: {
          en: "Quotation preview entry — not a contract register",
          ar: "مدخل معاينة عروض — ليس سجل عقود",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:quotations",
        subject: {
          ar: "العروض والعقود",
          en: "Quotations and contracts",
        },
        summary: {
          en: "Quotation review fixtures and related links only; editing BOQ, sending, approval and customer decisions are unavailable.",
          ar: "عينات مراجعة عروض وروابط فقط؛ تحرير المقايسة والإرسال والاعتماد وقرارات العميل غير متاحة.",
        },
        sharedWith: {
          area: "sales",
          page: "quotations",
        },
        kind: "shared",
        related: [
          {
            area: "sales",
            page: "quotations",
          },
          {
            area: "sales",
            page: "contracts",
          },
        ],
      },
      {
        id: "projects",
        title: {
          en: "All-project preview entry — not customer scoped",
          ar: "مدخل معاينة كل المشاريع — غير مقيد بعميل",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "project", "date", "status"],
        source: "data:projects",
        subject: {
          ar: "المشروعات والمراحل المرتبطة",
          en: "Related projects and phases",
        },
        summary: {
          en: "All illustrative projects in this preview, not scoped to a selected customer. Open an existing workspace for context.",
          ar: "كل المشاريع التوضيحية في المعاينة وليست مقيدة بعميل مختار؛ افتح مساحة المشروع للسياق.",
        },
        sharedWith: {
          area: "projects",
          page: "workspaces",
        },
        kind: "shared",
      },
      {
        id: "communications",
        title: {
          en: "Contact inbox preview entry — no conversation history",
          ar: "مدخل معاينة صندوق الاتصال — دون تاريخ محادثات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:messages",
        subject: {
          ar: "سجل اتصالات العملاء",
          en: "Customer communications history",
        },
        summary: {
          en: "Contact-message inbox fixtures only; no sales pipeline, outbound conversation history, contact action or lead conversion.",
          ar: "عينات صندوق رسائل الاتصال فقط؛ لا مسار فرص بيع أو تاريخ محادثات صادرة أو اتصال أو تحويل لطلب.",
        },
        sharedWith: {
          area: "sales",
          page: "leads",
        },
        kind: "shared",
      },
      {
        id: "complaints",
        title: {
          en: "Complaint review fixtures — replies and resolution unavailable",
          ar: "عينات مراجعة شكاوى — الرد والحل غير متاح",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:complaints",
        subject: {
          ar: "الشكاوى والمقترحات",
          en: "Complaints and suggestions",
        },
        summary: {
          en: "Complaint review fixtures only; replies, assignment and resolution actions are unavailable.",
          ar: "عينات مراجعة شكاوى فقط؛ الرد والتعيين والحل غير متاح.",
        },
        kind: "preview",
      },
      {
        id: "follow-up",
        title: {
          en: "Deferred — Customer follow-up workspace",
          ar: "مؤجل — مساحة متابعة العملاء",
        },
        section: {
          ar: "العلاقات",
          en: "Relationships",
        },
        fields: ["ref", "customer", "owner", "due", "status"],
        subject: {
          ar: "مساحة متابعة العملاء",
          en: "Customer follow-up workspace",
        },
        kind: "deferred",
        summary: {
          en: "No saved follow-up tasks, ownership or due-date history exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد مهام متابعة محفوظة أو ملكية أو تاريخ استحقاق. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "reports",
        title: {
          en: "Deferred — Customer reports",
          ar: "مؤجل — تقارير العملاء",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        subject: {
          ar: "تقارير العملاء",
          en: "Customer reports",
        },
        kind: "deferred",
        summary: {
          en: "No customer-scoped report generator is connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يتصل مولد تقارير مقيدة بعميل. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
    ],
  },
  {
    id: "communications",
    title: {
      ar: "الاتصالات والإشعارات",
      en: "Communications & notifications",
    },
    provenance: "reference",
    boundary: {
      ar: "حالات الإرسال التجريبية ليست تأكيدات من المزود؛ لا يتم إرسال واتساب أو بريد أو رسائل نصية من هذه المساحة.",
      en: "Preview delivery labels are not provider confirmations. No WhatsApp, email or SMS is sent from this workspace.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "Notification overview — review preview",
          ar: "نظرة عامة على الإشعارات — معاينة مراجعة",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:notifications",
        subject: {
          ar: "نظرة عامة على الإشعارات",
          en: "Notification overview",
        },
        summary: {
          en: "Notification fixtures including illustrative delivery details; no actual send, retry or mark-reviewed operation.",
          ar: "عينات إشعارات وتفاصيل توصيل توضيحية؛ لا إرسال فعلي أو إعادة محاولة أو تعليم كمراجع.",
        },
        kind: "preview",
      },
      {
        id: "history",
        title: {
          en: "Shared review entry — Notification history",
          ar: "مدخل مراجعة مشترك — سجل الإشعارات",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:notifications",
        subject: {
          ar: "سجل الإشعارات",
          en: "Notification history",
        },
        summary: {
          en: "Notification fixtures including illustrative delivery details; no actual send, retry or mark-reviewed operation.",
          ar: "عينات إشعارات وتفاصيل توصيل توضيحية؛ لا إرسال فعلي أو إعادة محاولة أو تعليم كمراجع.",
        },
        sharedWith: {
          area: "communications",
          page: "overview",
        },
        kind: "shared",
      },
      {
        id: "delivery",
        title: {
          en: "Deferred — Delivery status workspace",
          ar: "مؤجل — مساحة حالات الإرسال",
        },
        section: {
          ar: "الإرسال",
          en: "Delivery",
        },
        fields: ["ref", "channel", "recipient", "date", "status"],
        subject: {
          ar: "مساحة حالات الإرسال",
          en: "Delivery status workspace",
        },
        kind: "deferred",
        summary: {
          en: "No provider delivery events or transport receipts are connected. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا تتصل أحداث توصيل مزود أو إيصالات نقل. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "templates",
        title: {
          en: "Deferred — Templates and event catalogue",
          ar: "مؤجل — القوالب ودليل الأحداث",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "event", "channel", "status"],
        subject: {
          ar: "القوالب ودليل الأحداث",
          en: "Templates and event catalogue",
        },
        kind: "deferred",
        summary: {
          en: "No event/template editor, approved content or provider integration exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد محرر أحداث وقوالب أو محتوى معتمد أو تكامل مزود. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "preferences",
        title: {
          en: "Deferred — Communication preferences",
          ar: "مؤجل — تفضيلات الاتصال",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "customer", "channel", "status"],
        subject: {
          ar: "تفضيلات الاتصال",
          en: "Communication preferences",
        },
        kind: "deferred",
        summary: {
          en: "No communication consent/preference persistence or enforcement exists here. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد حفظ أو تنفيذ لتفضيلات وموافقات اتصال هنا. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "pending",
        title: {
          en: "Deferred — Failed and pending delivery",
          ar: "مؤجل — الإرسال المتعثر والمعلق",
        },
        section: {
          ar: "الإرسال",
          en: "Delivery",
        },
        fields: ["ref", "channel", "date", "status"],
        subject: {
          ar: "الإرسال المتعثر والمعلق",
          en: "Failed and pending delivery",
        },
        kind: "deferred",
        summary: {
          en: "No real pending/failed delivery queue or retry operation exists. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يوجد طابور توصيل معلق أو فاشل فعلي أو إعادة محاولة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "follow-up",
        title: {
          en: "Contact inbox preview entry — no follow-up history",
          ar: "مدخل معاينة صندوق الاتصال — دون تاريخ متابعة",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:messages",
        subject: {
          ar: "سجل متابعة العملاء",
          en: "Customer follow-up history",
        },
        summary: {
          en: "Contact-message inbox fixtures only; no sales pipeline, outbound conversation history, contact action or lead conversion.",
          ar: "عينات صندوق رسائل الاتصال فقط؛ لا مسار فرص بيع أو تاريخ محادثات صادرة أو اتصال أو تحويل لطلب.",
        },
        sharedWith: {
          area: "sales",
          page: "leads",
        },
        kind: "shared",
      },
    ],
  },
  {
    id: "administration",
    title: {
      ar: "إدارة النظام",
      en: "System administration",
    },
    provenance: "reference",
    boundary: {
      ar: "تشخيص آمن للتطبيق والوصول فقط؛ الأحداث الأمنية وإجراءات الصيانة تحتاج خدمات مخولة مستقلة.",
      en: "Safe application and access diagnostics only. Security events and maintenance actions require their own authorized services.",
    },
    pages: [
      {
        id: "overview",
        title: {
          en: "User & role directories — synthetic preview",
          ar: "دليلا المستخدمين والأدوار — معاينة اصطناعية",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "diagnostics",
        subject: {
          ar: "نظرة عامة إدارية",
          en: "Administrative overview",
        },
        summary: {
          en: "Synthetic user/role directories and local-only assignment simulations, alongside the existing diagnostics link. No real provisioning, revocation or access changes.",
          ar: "دليلا مستخدمين وأدوار اصطناعيان ومحاكاة تعيين محلية بجانب رابط التشخيص الحالي. لا إنشاء حسابات أو إلغاء جلسات أو تغيير وصول فعلي.",
        },
        sharedWith: {
          area: "settings",
          page: "health",
        },
        kind: "shared",
      },
      {
        id: "session",
        title: {
          en: "Shared review entry — Authenticated access information",
          ar: "مدخل مراجعة مشترك — معلومات الوصول المصدق",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "diagnostics",
        subject: {
          ar: "معلومات الوصول المصدق",
          en: "Authenticated access information",
        },
        summary: {
          en: "Read-only role/adapter boundary and implementation catalogue, not a live health probe or session/security-event inspector.",
          ar: "حدود دور ومحول ودليل تنفيذ للقراءة فقط؛ ليست فحص صحة حي أو عارض جلسات وأحداث أمنية.",
        },
        sharedWith: {
          area: "settings",
          page: "health",
        },
        kind: "shared",
      },
      {
        id: "operations",
        title: {
          en: "Shared review entry — Operational diagnostics",
          ar: "مدخل مراجعة مشترك — تشخيص التشغيل",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "diagnostics",
        subject: {
          ar: "تشخيص التشغيل",
          en: "Operational diagnostics",
        },
        summary: {
          en: "Read-only role/adapter boundary and implementation catalogue, not a live health probe or session/security-event inspector.",
          ar: "حدود دور ومحول ودليل تنفيذ للقراءة فقط؛ ليست فحص صحة حي أو عارض جلسات وأحداث أمنية.",
        },
        sharedWith: {
          area: "settings",
          page: "health",
        },
        kind: "shared",
      },
      {
        id: "security",
        title: {
          en: "Deferred — Security events",
          ar: "مؤجل — الأحداث الأمنية",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "type", "actor", "date", "status"],
        subject: {
          ar: "الأحداث الأمنية",
          en: "Security events",
        },
        kind: "deferred",
        summary: {
          en: "No security-event source is connected; illustrative audit rows are not security telemetry. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا يتصل مصدر أحداث أمنية؛ صفوف التدقيق التوضيحية ليست قياساً أمنياً. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
      },
      {
        id: "audit",
        title: {
          en: "Audit history — review preview",
          ar: "سجل التدقيق — معاينة مراجعة",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:audit",
        subject: {
          ar: "سجل التدقيق",
          en: "Audit history",
        },
        summary: {
          en: "Illustrative audit chronology only; not security-event monitoring or a business-data export service.",
          ar: "تسلسل تدقيق توضيحي فقط؛ ليس مراقبة أحداث أمنية أو خدمة تصدير بيانات أعمال.",
        },
        kind: "preview",
      },
      {
        id: "health",
        title: {
          en: "Shared review entry — Application health",
          ar: "مدخل مراجعة مشترك — حالة التطبيق",
        },
        section: {
          ar: "المراجعة",
          en: "Review",
        },
        fields: ["ref", "project", "date", "status"],
        source: "diagnostics",
        subject: {
          ar: "حالة التطبيق",
          en: "Application health",
        },
        summary: {
          en: "Read-only role/adapter boundary and implementation catalogue, not a live health probe or session/security-event inspector.",
          ar: "حدود دور ومحول ودليل تنفيذ للقراءة فقط؛ ليست فحص صحة حي أو عارض جلسات وأحداث أمنية.",
        },
        sharedWith: {
          area: "settings",
          page: "health",
        },
        kind: "shared",
      },
      {
        id: "maintenance",
        title: {
          en: "Read-only note — Maintenance and configuration",
          ar: "مذكرة للقراءة فقط — الصيانة والإعداد",
        },
        section: {
          ar: "الإعداد",
          en: "Configuration",
        },
        fields: ["ref", "project", "date", "status"],
        source: "settings",
        subject: {
          ar: "الصيانة والإعداد",
          en: "Maintenance and configuration",
        },
        summary: {
          en: "Read-only policy explanation, not an operational settings editor. No server configuration or preferences are changed.",
          ar: "شرح سياسة للقراءة فقط وليس محرر إعدادات تشغيل؛ لا تتغير إعدادات الخادم أو التفضيلات.",
        },
        kind: "readiness",
      },
      {
        id: "activity",
        title: {
          en: "Shared review entry — Administrative activity reports",
          ar: "مدخل مراجعة مشترك — تقارير النشاط الإداري",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        source: "link:audit",
        subject: {
          ar: "تقارير النشاط الإداري",
          en: "Administrative activity reports",
        },
        summary: {
          en: "Illustrative audit chronology only; not security-event monitoring or a business-data export service.",
          ar: "تسلسل تدقيق توضيحي فقط؛ ليس مراقبة أحداث أمنية أو خدمة تصدير بيانات أعمال.",
        },
        sharedWith: {
          area: "administration",
          page: "audit",
        },
        kind: "shared",
      },
    ],
  },
  {
    id: "data",
    title: {
      ar: "استيراد وتصدير البيانات",
      en: "Data import & export",
    },
    provenance: "reference",
    boundary: {
      ar: "المنفذ هو التحقق المحلي بالمتصفح من بيانات مرشحة وتصدير بيانات التنقل الوصفية فقط؛ لا يتم استيراد أو حفظ أو إرسال سجلات أعمال.",
      en: "Only browser-local candidate validation and navigation-metadata export are implemented. No record is imported, stored or sent to a business service.",
    },
    pages: [
      {
        id: "import",
        title: {
          en: "Local validator entry — no import",
          ar: "مدخل تحقق محلي — دون استيراد",
        },
        section: {
          ar: "التحقق",
          en: "Validation",
        },
        fields: ["ref", "project", "date", "status"],
        source: "import",
        subject: {
          ar: "مساحة الاستيراد",
          en: "Import workspace",
        },
        summary: {
          en: "Local JSON validation only for reference/name/optional email. No domain import, saved results, wizard state or durable jobs.",
          ar: "تحقق JSON محلي للمرجع والاسم والبريد الاختياري فقط؛ لا استيراد نطاق أو نتائج محفوظة أو حالة خطوات أو مهام دائمة.",
        },
        sharedWith: {
          area: "data",
          page: "validation",
        },
        kind: "shared",
      },
      {
        id: "formats",
        title: {
          en: "Local JSON format instructions",
          ar: "إرشادات صيغة JSON المحلية",
        },
        section: {
          ar: "التحقق",
          en: "Validation",
        },
        fields: ["ref", "project", "date", "status"],
        source: "import",
        subject: {
          ar: "صيغة الاستيراد والتعليمات",
          en: "Import format and instructions",
        },
        summary: {
          en: "Local JSON validation only for reference/name/optional email. No domain import, saved results, wizard state or durable jobs.",
          ar: "تحقق JSON محلي للمرجع والاسم والبريد الاختياري فقط؛ لا استيراد نطاق أو نتائج محفوظة أو حالة خطوات أو مهام دائمة.",
        },
        kind: "instructions",
      },
      {
        id: "validation",
        title: {
          en: "Local JSON validation tool — no import",
          ar: "أداة تحقق JSON محلية — دون استيراد",
        },
        section: {
          ar: "التحقق",
          en: "Validation",
        },
        fields: ["ref", "project", "date", "status"],
        source: "import",
        subject: {
          ar: "معاينة التحقق",
          en: "Validation preview",
        },
        summary: {
          en: "Local JSON validation only for reference/name/optional email. No domain import, saved results, wizard state or durable jobs.",
          ar: "تحقق JSON محلي للمرجع والاسم والبريد الاختياري فقط؛ لا استيراد نطاق أو نتائج محفوظة أو حالة خطوات أو مهام دائمة.",
        },
        kind: "tool",
      },
      {
        id: "results",
        title: {
          en: "Local validator entry — no saved results",
          ar: "مدخل تحقق محلي — دون نتائج محفوظة",
        },
        section: {
          ar: "التحقق",
          en: "Validation",
        },
        fields: ["ref", "project", "date", "status"],
        source: "import",
        subject: {
          ar: "نتائج التحقق والأخطاء",
          en: "Validation results and errors",
        },
        summary: {
          en: "Local JSON validation only for reference/name/optional email. No domain import, saved results, wizard state or durable jobs.",
          ar: "تحقق JSON محلي للمرجع والاسم والبريد الاختياري فقط؛ لا استيراد نطاق أو نتائج محفوظة أو حالة خطوات أو مهام دائمة.",
        },
        sharedWith: {
          area: "data",
          page: "validation",
        },
        kind: "shared",
      },
      {
        id: "export",
        title: {
          en: "Download navigation metadata only",
          ar: "تنزيل بيانات التنقل فقط",
        },
        section: {
          ar: "التقارير",
          en: "Reporting",
        },
        fields: ["ref", "project", "date", "status"],
        source: "export",
        subject: {
          ar: "مساحة التصدير",
          en: "Export workspace",
        },
        summary: {
          en: "Downloads static navigation names and routes only, never reports or business records.",
          ar: "ينزل أسماء ومسارات التنقل الثابتة فقط وليس تقارير أو سجلات أعمال.",
        },
        kind: "tool",
      },
      {
        id: "history",
        title: {
          en: "Deferred — Export history",
          ar: "مؤجل — سجل التصدير",
        },
        section: {
          ar: "السجل",
          en: "History",
        },
        fields: ["ref", "type", "actor", "date", "status"],
        subject: {
          ar: "سجل التصدير",
          en: "Export history",
        },
        kind: "deferred",
        summary: {
          en: "No durable export jobs or export history exist. Menu downloads are not logged as business exports. This is a requirements note, not an operational screen or a completed UI.",
          ar: "لا توجد مهام أو سجلات تصدير دائمة؛ تنزيلات القوائم ليست تصديرات أعمال مسجلة. هذه مذكرة متطلبات وليست شاشة تشغيل أو واجهة مكتملة.",
        },
        related: [
          {
            area: "data",
            page: "export",
          },
        ],
      },
    ],
  },
];
export function erpHref(locale: Locale, module?: string, page?: string): string {
  const base = `/${locale}/dashboard/erp`;
  return `${base}${module ? `/${module}` : ""}${page ? `/${page}` : ""}`;
}
export function findErpPage(moduleId: string, pageId: string) {
  const area = erpModules.find((item) => item.id === moduleId);
  const page = area?.pages.find((item) => item.id === pageId);
  return area && page ? { module: area, page } : undefined;
}
/** Mirrors the existing identity boundary, never a substitute for server guards. */
export function canAccessErp(role: unknown): boolean {
  return role === OWNER_REVIEW_ROLE;
}
export const erpPageCount = erpModules.reduce((total, module) => total + module.pages.length, 0);
