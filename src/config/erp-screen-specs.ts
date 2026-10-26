import { completionScreenSpecs } from "./erp-screen-completion";
import type { LocalizedText } from "@/lib/i18n";

const text = (en: string, ar: string): LocalizedText => ({ en, ar });
/** User-extracted second recording, not independently watched/verified. */
export const screenReference = {
  approximateDurationSeconds: 246,
  independentlyVerified: false,
} as const;
export const screenFields = {
  search: text("Search", "بحث"),
  login: text("Login identifier", "معرّف الدخول"),
  name: text("Display name / title", "الاسم الظاهر / العنوان"),
  email: text("Email", "البريد الإلكتروني"),
  role: text("Level / role", "المستوى / الدور"),
  roles: text("Assigned roles", "الأدوار المعينة"),
  minimum: text("Minimum access requirement", "الحد الأدنى لمتطلبات الوصول"),
  permission: text("Permission requirements", "متطلبات الصلاحية"),
  status: text("Status", "الحالة"),
  company: text("Company / financial entity", "الشركة / الجهة المالية"),
  branch: text("Branch", "الفرع"),
  module: text("Module", "الوحدة"),
  page: text("Page", "الصفحة"),
  ref: text("Document reference", "مرجع المستند"),
  date: text("Document date", "تاريخ المستند"),
  from: text("Start date", "تاريخ البداية"),
  to: text("End date", "تاريخ النهاية"),
  account: text("Account", "الحساب"),
  accountLevel: text("Account level", "مستوى الحساب"),
  accountType: text("Account type", "نوع الحساب"),
  parent: text("Parent account", "الحساب الرئيسي"),
  subaccounts: text("Include subaccounts", "تضمين الحسابات الفرعية"),
  plannedAmount: text("Approved budget amount", "قيمة الموازنة المعتمدة"),
  actualAmount: text("Actual amount", "القيمة الفعلية"),
  variance: text("Variance — requires budget and actuals", "الانحراف — يتطلب الموازنة والفعلي"),
  reportType: text("Report / statement type", "نوع التقرير / القائمة"),
  openingDebit: text("Opening debit", "مدين افتتاحي"),
  openingCredit: text("Opening credit", "دائن افتتاحي"),
  periodDebit: text("Period debit", "مدين الفترة"),
  periodCredit: text("Period credit", "دائن الفترة"),
  closingDebit: text("Closing debit", "مدين ختامي"),
  closingCredit: text("Closing credit", "دائن ختامي"),
  debit: text("Debit", "مدين"),
  credit: text("Credit", "دائن"),
  balance: text("Balance", "الرصيد"),
  amount: text("Amount", "القيمة"),
  year: text("Financial year", "السنة المالية"),
  period: text("Fiscal period", "الفترة المالية"),
  openPeriods: text("Open periods", "الفترات المفتوحة"),
  unposted: text("Unposted journals", "القيود غير المرحلة"),
  closingSummary: text("Closing / profit and loss summary", "ملخص الإقفال / الربح والخسارة"),
  requirements: text("Remaining prerequisites", "المتطلبات المتبقية"),
  costCenter: text("Cost center", "مركز التكلفة"),
  tax: text("Tax classification", "التصنيف الضريبي"),
  currency: text("Currency", "العملة"),
  bank: text("Bank", "البنك"),
  bankAccount: text("Bank account reference", "مرجع الحساب البنكي"),
  treasury: text("Treasury / cash register", "الخزينة / الصندوق"),
  source: text("Source account / treasury", "الحساب / الخزينة المصدر"),
  destination: text("Destination account / treasury", "الحساب / الخزينة الوجهة"),
  rate: text("Exchange rate", "سعر الصرف"),
  supplier: text("Supplier", "المورد"),
  customer: text("Customer", "العميل"),
  project: text("Project", "المشروع"),
  phase: text("Project phase", "مرحلة المشروع"),
  lines: text("Document lines", "بنود المستند"),
  description: text("Description / instructions", "الوصف / التعليمات"),
  quantity: text("Quantity", "الكمية"),
  unit: text("Unit", "الوحدة"),
  cost: text("Unit cost", "تكلفة الوحدة"),
  attachments: text("Attachments", "المرفقات"),
  payment: text("Payment state", "حالة السداد"),
  allocation: text("Project / phase allocation", "توزيع المشروع / المرحلة"),
  original: text("Original purchase document", "مستند الشراء الأصلي"),
  reason: text("Reason", "السبب"),
  stage: text("Sales stage", "مرحلة البيع"),
  revision: text("Revision number", "رقم المراجعة"),
  internalReview: text("Internal review", "المراجعة الداخلية"),
  customerDecision: text("Customer decision", "قرار العميل"),
  channel: text("Message channel", "قناة الرسائل"),
  assignee: text("Assigned staff", "الموظف المسؤول"),
  response: text("Response interval", "زمن الاستجابة"),
  consent: text("Communication consent", "موافقة التواصل"),
  event: text("Event / action", "الحدث / الإجراء"),
  actor: text("Actor", "منفذ الإجراء"),
  entity: text("Related record", "السجل المرتبط"),
  format: text("Print format", "تنسيق الطباعة"),
  orientation: text("Page orientation", "اتجاه الصفحة"),
  quota: text("User / module allowance", "حد المستخدمين / الوحدات"),
  addon: text("Add-on", "الإضافة"),
  retention: text("Retention policy", "سياسة الاحتفاظ"),
  code: text("Code", "الكود"),
  item: text("Material / item", "المادة / البند"),
  warehouse: text("Warehouse", "المستودع"),
  location: text("Location", "الموقع"),
  category: text("Category", "الفئة"),
  direction: text("Incoming / outgoing", "وارد / صادر"),
  counterparty: text("Counterparty", "الطرف المقابل"),
  due: text("Due date", "تاريخ الاستحقاق"),
  custodian: text("Custodian", "أمين العهدة"),
  sourceDocument: text("Source document", "المستند المصدر"),
  resolution: text("Resolution / follow-up", "المعالجة / المتابعة"),
  received: text("Received quantity", "الكمية المستلمة"),
  returned: text("Returned quantity", "الكمية المرتجعة"),
  discrepancy: text("Discrepancy", "الفرق"),
  onHand: text("On-hand quantity", "الكمية الفعلية"),
  reserved: text("Reserved quantity", "الكمية المحجوزة"),
  availability: text("Availability — requires source", "الإتاحة — تتطلب مصدراً"),
  counted: text("Counted quantity", "الكمية المجرودة"),
  milestone: text("Milestone", "المرحلة التنفيذية"),
  planned: text("Planned date / scope", "التاريخ / النطاق المخطط"),
  completed: text("Completed date / scope", "التاريخ / النطاق المنجز"),
  progress: text("Verified progress", "التقدم المتحقق"),
  priority: text("Priority", "الأولوية"),
  severity: text("Severity", "الخطورة"),
  checklist: text("Checklist / criterion", "قائمة الفحص / المعيار"),
  evidence: text("Inspection evidence", "دليل المعاينة"),
  measurement: text("Measurement / test", "القياس / الاختبار"),
  required: text("Required evidence", "الدليل المطلوب"),
  language: text("Language", "اللغة"),
  approval: text("Approval state", "حالة الاعتماد"),
  lastBackup: text("Last verified backup", "آخر نسخة احتياطية متحققة"),
} as const;
export type ScreenFieldKey = keyof typeof screenFields;
export type ScreenInput = {
  key: ScreenFieldKey;
  type: "text" | "search" | "email" | "date" | "number" | "lookup" | "checkbox";
  required?: boolean;
};
export type ScreenView = {
  id: string;
  title: LocalizedText;
  evidence: "visible" | "adapted" | "unverified";
  filters: ScreenInput[];
  columns: ScreenFieldKey[];
  draft: ScreenInput[];
  actions: LocalizedText[];
  dependency: LocalizedText;
  sensitive?: boolean;
  report?: boolean;
  summaries?: ScreenFieldKey[];
};
const field = (
  key: ScreenFieldKey,
  type: ScreenInput["type"] = "text",
  required = false,
): ScreenInput => ({ key, type, required });
const search = field("search", "search");
const dates = [field("from", "date"), field("to", "date")];
const status = field("status", "lookup");
const scope = [field("company", "lookup"), field("branch", "lookup")];
const balances: ScreenFieldKey[] = [
  "account",
  "openingDebit",
  "openingCredit",
  "periodDebit",
  "periodCredit",
  "closingDebit",
  "closingCredit",
];
const accountingDependency = text(
  "Requires an approved chart, posting/tax/closing rules, immutable audit and an authorized ledger service. No ledger balances or business-report totals are calculated; labeled local exercises use synthetic displayed inputs only.",
  "يتطلب دليلاً معتمداً وقواعد الترحيل والضريبة والإقفال وتدقيقاً ثابتاً وخدمة دفتر مفوضة؛ لا تُحسب أرصدة دفتر أو إجماليات تقارير أعمال؛ التمارين المحلية الموسومة تستخدم مدخلات اصطناعية ظاهرة فقط.",
);
const accessDependency = text(
  "Requires identity provisioning, approved role/resource predicates and a revocable session service. This layout grants no access and contains no real user records.",
  "يتطلب خدمة هوية ومصفوفة أدوار وموارد معتمدة وخدمة جلسات قابلة للإلغاء؛ لا تمنح هذه الواجهة وصولاً ولا تعرض حسابات حقيقية.",
);
const organizationDependency = text(
  "BLACK X currently uses one server-resolved workspace. Company/branch structures, status, archiving and isolation are not implemented; no tenant or branch is created here.",
  "تستخدم BLACK X مساحة واحدة يحددها الخادم؛ هياكل الشركات والفروع وحالاتها وأرشفتها وعزلها غير منفذة، ولا تُنشأ جهة أو فرع هنا.",
);
const treasuryDependency = text(
  "Requires authorized account-specific voucher services, posting, reconciliation, currency rules and immutable history. Existing incoming-payment or expense fixtures are not this register.",
  "يتطلب خدمات سندات خاصة بكل حساب وقواعد ترحيل وتسوية وعملة وتاريخ ثابت؛ عينات المقبوضات أو المصروفات الحالية ليست هذا السجل.",
);
const purchaseDependency = text(
  "Requires separate purchasing document services, supplier authorization, receipt/return rules and allocation history. No stock receipt, supplier liability or payment is recorded.",
  "يتطلب خدمات مستندات شراء مستقلة وتفويض الموردين وقواعد الاستلام والمرتجعات وتاريخ التوزيع؛ لا يُسجل استلام مخزون أو التزام مورد أو سداد.",
);
const commercialDependency = text(
  "Requires the approved request–inspection–BOQ–decision–contract workflow and durable authorized services. Prior fixture workspaces below remain previews; no order, approval or project is created.",
  "يتطلب مسار الطلب والمعاينة والمقايسة والقرار والعقد المعتمد وخدمات دائمة مفوضة؛ مساحات العينات أدناه تبقى معاينات ولا يُنشأ أمر أو اعتماد أو مشروع.",
);
const communicationDependency = text(
  "Requires channel transport, consent, assignment rules and timestamped delivery/response events. No message, distribution, campaign or broadcast is sent; metrics cannot be inferred from fixtures.",
  "يتطلب نقل القنوات والموافقات وقواعد التوزيع وأحداث الإرسال والاستجابة المؤرخة؛ لا تُرسل رسالة أو حملة أو بث، ولا تُستنتج المقاييس من العينات.",
);
function view(
  id: string,
  en: string,
  ar: string,
  columns: ScreenFieldKey[],
  filters: ScreenInput[],
  dependency: LocalizedText,
  extra: Partial<ScreenView> = {},
): ScreenView {
  return {
    id,
    title: text(en, ar),
    evidence: "visible",
    columns,
    filters,
    dependency,
    draft: [],
    actions: [],
    ...extra,
  };
}
const action = text;
function report(
  id: string,
  en: string,
  ar: string,
  columns: ScreenFieldKey[] = balances,
  extra: ScreenInput[] = [],
): ScreenView {
  return view(
    id,
    en,
    ar,
    columns,
    [
      ...scope,
      ...dates,
      ...(["trial-balance", "account-statement", "general-ledger", "journal-report"].includes(id)
        ? [field("account", "lookup")]
        : []),
      ...(["trial-balance", "general-ledger"].includes(id)
        ? [
            field("accountLevel", "number"),
            field("accountType"),
            status,
            field("subaccounts", "checkbox"),
          ]
        : []),
      ...(id === "journal-report" || id === "tax-reports" ? [status] : []),
      ...extra,
    ],
    accountingDependency,
    {
      report: true,
      evidence: id === "balance-sheet" || id === "general-budget" ? "adapted" : "visible",
    },
  );
}
function voucher(
  id: string,
  en: string,
  ar: string,
  direction: "cash" | "bank",
  incoming: boolean,
): ScreenView {
  return view(
    id,
    en,
    ar,
    [
      "ref",
      "date",
      direction === "cash" ? "treasury" : "bankAccount",
      incoming ? "customer" : "supplier",
      "amount",
      "currency",
      "status",
      "attachments",
    ],
    [search, status, ...dates, field(direction === "cash" ? "treasury" : "bankAccount", "lookup")],
    treasuryDependency,
    {
      draft: [
        field("ref", "text", true),
        field("date", "date", true),
        field("amount", "number", true),
        field("currency", "text", true),
      ],
      actions: [action("Record voucher", "تسجيل سند"), action("Inspect voucher", "فحص السند")],
      sensitive: true,
    },
  );
}
function purchase(id: string, en: string, ar: string, extra: ScreenFieldKey[] = []): ScreenView {
  return view(
    id,
    en,
    ar,
    [
      "ref",
      "supplier",
      "date",
      "lines",
      "quantity",
      "unit",
      "cost",
      "status",
      "attachments",
      "payment",
      "project",
      "phase",
      ...extra,
    ],
    [search, status, ...dates, field("supplier", "lookup"), field("project", "lookup")],
    purchaseDependency,
    {
      draft: [
        field("ref", "text", true),
        field("date", "date", true),
        field("supplier", "lookup", true),
        field("description", "text", true),
        field("quantity", "number", true),
        field("unit", "text", true),
        field("cost", "number", true),
      ],
      actions: [
        action("Create document", "إنشاء مستند"),
        action("Edit / inspect lines", "تعديل / فحص البنود"),
      ],
      sensitive: true,
    },
  );
}
const users = view(
  "users",
  "User administration",
  "إدارة المستخدمين",
  ["login", "name", "email", "role", "status", "roles", "company", "branch"],
  [search, status, field("role", "lookup")],
  accessDependency,
  {
    draft: [
      field("login", "text", true),
      field("name", "text", true),
      field("email", "email", true),
      field("role", "lookup", true),
    ],
    actions: [
      action("Edit user", "تعديل مستخدم"),
      action("Assign roles", "تعيين أدوار"),
      action("Assign company / branch", "تعيين شركة / فرع"),
      action("Revoke sessions", "إلغاء الجلسات"),
      action("Activate / deactivate", "تفعيل / تعطيل"),
    ],
    sensitive: true,
  },
);
const roles = view(
  "roles",
  "Role definitions",
  "تعريفات الأدوار",
  ["name", "permission", "minimum", "status"],
  [search, status],
  accessDependency,
  {
    draft: [field("name", "text", true), field("description")],
    actions: [action("Create / edit role", "إنشاء / تعديل دور")],
    sensitive: true,
  },
);
const branches = view(
  "branches",
  "Companies and branches",
  "الشركات والفروع",
  ["company", "branch", "name", "status"],
  [search, status],
  organizationDependency,
  {
    draft: [field("name", "text", true), field("company", "lookup")],
    summaries: ["company", "branch"],
    actions: [
      action("Add company", "إضافة شركة"),
      action("Add branch", "إضافة فرع"),
      action("Edit", "تعديل"),
      action("Archive", "أرشفة"),
    ],
    sensitive: true,
  },
);
const years = view(
  "financial-years",
  "Financial years",
  "السنوات المالية",
  ["year", "status", "openPeriods", "unposted", "requirements"],
  [search, status],
  accountingDependency,
  {
    draft: [field("name", "text", true), field("from", "date", true), field("to", "date", true)],
    actions: [action("Close financial year", "إقفال السنة المالية")],
    summaries: ["openPeriods", "unposted", "closingSummary", "requirements"],
    sensitive: true,
  },
);
const closing = view(
  "period-closing",
  "Fiscal-period closing prerequisites",
  "متطلبات إقفال الفترات المالية",
  ["year", "period", "status", "unposted", "requirements"],
  [field("year", "lookup"), status, ...dates],
  accountingDependency,
  {
    actions: [action("Close period", "إقفال الفترة")],
    summaries: ["unposted", "requirements"],
    sensitive: true,
  },
);
const closingHistory = view(
  "closing-history",
  "Closing / reopening history",
  "تاريخ الإقفال وإعادة الفتح",
  ["year", "period", "event", "actor", "date", "reason"],
  [field("year", "lookup"), ...dates],
  accountingDependency,
  { actions: [action("Reopen period", "إعادة فتح الفترة")], sensitive: true },
);
const ledgerReports = [
  report("trial-balance", "Trial balance", "ميزان المراجعة"),
  report("account-statement", "Account statement", "كشف حساب", [
    "account",
    "date",
    "ref",
    "debit",
    "credit",
    "balance",
  ]),
  report("general-ledger", "General ledger", "دفتر الأستاذ العام", [
    "account",
    "date",
    "ref",
    "description",
    "debit",
    "credit",
    "balance",
  ]),
  report("journal-report", "Journal report", "تقرير القيود اليومية", [
    "ref",
    "date",
    "account",
    "debit",
    "credit",
    "status",
  ]),
  report(
    "income-statement",
    "Income statement",
    "قائمة الدخل",
    ["account", "periodDebit", "periodCredit", "balance"],
    [field("reportType")],
  ),
  report(
    "general-budget",
    "Public / general budget report",
    "تقرير الموازنة العامة",
    ["account", "plannedAmount", "actualAmount", "variance"],
    [field("reportType")],
  ),
  report(
    "tax-reports",
    "Tax reports",
    "التقارير الضريبية",
    ["tax", "ref", "date", "amount", "status"],
    [field("tax")],
  ),
  report(
    "cost-center-summary",
    "Cost-center summary",
    "ملخص مراكز التكلفة",
    ["costCenter", "debit", "credit", "balance"],
    [field("costCenter", "lookup")],
  ),
  report(
    "cost-center-detail",
    "Cost-center detail",
    "تفاصيل مراكز التكلفة",
    ["costCenter", "account", "ref", "date", "debit", "credit"],
    [field("costCenter", "lookup")],
  ),
  report(
    "balance-sheet",
    "Financial position / balance sheet",
    "المركز المالي / الميزانية العمومية",
    ["account", "periodDebit", "periodCredit", "balance"],
  ),
];
const audit = view(
  "audit",
  "Activity and audit history",
  "سجل النشاط والتدقيق",
  ["date", "actor", "event", "entity", "ref"],
  [search, ...dates, field("actor", "lookup"), field("event")],
  text(
    "Requires durable append-only audit with approved access and minimized metadata. No audit record is generated by this layout.",
    "يتطلب تدقيقاً دائماً لا يقبل التعديل ووصولاً معتمداً وبيانات محدودة؛ لا تولد هذه الواجهة حدث تدقيق.",
  ),
  { sensitive: true },
);
const backup = view(
  "backups",
  "Backup administration",
  "إدارة النسخ الاحتياطية",
  ["name", "status", "lastBackup", "retention"],
  [search, status, ...dates],
  text(
    "No backup provider, job service, verified backup history or restore procedure is connected. Creation, download, restore and deletion are unavailable.",
    "لا يوجد مزود نسخ احتياطي أو خدمة مهام أو سجل متحقق أو إجراء استعادة متصل؛ الإنشاء والتنزيل والاستعادة والحذف غير متاحة.",
  ),
  {
    actions: [action("Create backup", "إنشاء نسخة"), action("Restore backup", "استعادة نسخة")],
    sensitive: true,
  },
);
const responseMetrics = view(
  "response-metrics",
  "Response metrics",
  "مقاييس الاستجابة",
  ["channel", "assignee", "response", "from", "to"],
  [...dates, field("channel"), field("assignee", "lookup")],
  communicationDependency,
  { report: true, evidence: "adapted" },
);

/** Layout views are not extra catalogue routes or operational registers. */
export const erpScreenSpecs: Record<string, ScreenView[]> = {
  "permissions/roles": [roles],
  "permissions/assignments": [users],
  "permissions/history": [audit],
  "administration/overview": [users, roles],
  "administration/session": [
    view(
      "access-information",
      "Administrative access information",
      "معلومات الوصول الإداري",
      ["login", "role", "minimum", "status"],
      [],
      accessDependency,
      { sensitive: true },
    ),
  ],
  "administration/maintenance": [backup],
  "administration/audit": [audit],
  "administration/activity": [audit],
  "settings/general": [
    branches,
    view(
      "general-settings",
      "General settings",
      "الإعدادات العامة",
      ["name", "status"],
      [],
      organizationDependency,
      {
        draft: [field("name", "text", true)],
        actions: [action("Save settings", "حفظ الإعدادات")],
        sensitive: true,
      },
    ),
    view(
      "print-settings",
      "Print settings",
      "إعدادات الطباعة",
      ["name", "format", "orientation", "status"],
      [],
      text(
        "Print templates and organization identity require an approved print service; no format or document is saved or printed.",
        "تتطلب قوالب الطباعة وهوية الجهة خدمة معتمدة؛ لا يُحفظ تنسيق أو مستند ولا تُنفذ طباعة.",
      ),
      {
        draft: [field("name", "text", true), field("format"), field("orientation")],
        actions: [action("Save print settings", "حفظ إعدادات الطباعة")],
      },
    ),
  ],
  "settings/modules": [
    view(
      "navigation",
      "Sidebar / navigation configuration",
      "إعداد القائمة الجانبية والتنقل",
      ["module", "page", "status", "minimum"],
      [search],
      accessDependency,
      { actions: [action("Save navigation", "حفظ التنقل")] },
    ),
    view(
      "quotas-addons",
      "User and module quotas / add-ons",
      "حدود المستخدمين والوحدات والإضافات",
      ["module", "quota", "addon", "status"],
      [search, status],
      text(
        "Reference navigation concept only. BLACK X has no subscription, quota enforcement, entitlement or marketplace service; no allowance or purchase is fabricated.",
        "مفهوم من التنقل المرجعي فقط؛ لا توجد خدمة اشتراكات أو حدود أو استحقاقات أو متجر في BLACK X ولا تُختلق حصص أو مشتريات.",
      ),
      { evidence: "unverified" },
    ),
  ],
  "settings/notifications": [
    view(
      "notification-settings",
      "Notification settings",
      "إعدادات الإشعارات",
      ["event", "channel", "status", "consent"],
      [field("channel"), status],
      communicationDependency,
      {
        draft: [field("name", "text", true), field("description")],
        actions: [action("Save notification settings", "حفظ إعدادات الإشعارات")],
        sensitive: true,
      },
    ),
  ],
  "settings/history": [audit],
  "accounting/overview": [years],
  "accounting/accounts": [
    view(
      "chart-of-accounts",
      "Chart of accounts",
      "دليل الحسابات",
      balances,
      [search, field("accountLevel", "number"), field("accountType"), status],
      accountingDependency,
      {
        draft: [
          field("ref", "text", true),
          field("name", "text", true),
          field("parent", "lookup"),
          field("accountType", "text", true),
        ],
        actions: [action("Add account", "إضافة حساب"), action("Edit account", "تعديل حساب")],
        sensitive: true,
      },
    ),
    view(
      "opening-balances",
      "Opening account balances",
      "الأرصدة الافتتاحية للحسابات",
      ["account", "year", "openingDebit", "openingCredit", "status"],
      [...scope, field("year", "lookup"), field("account", "lookup")],
      accountingDependency,
      {
        draft: [
          field("account", "lookup", true),
          field("openingDebit", "number"),
          field("openingCredit", "number"),
        ],
        actions: [action("Record opening balances", "تسجيل الأرصدة الافتتاحية")],
        sensitive: true,
      },
    ),
    view(
      "cost-centers",
      "Cost centers",
      "مراكز التكلفة",
      ["ref", "name", "project", "status"],
      [search, status, field("project", "lookup")],
      accountingDependency,
      {
        evidence: "adapted",
        draft: [field("ref", "text", true), field("name", "text", true)],
        actions: [action("Add cost center", "إضافة مركز تكلفة")],
        sensitive: true,
      },
    ),
  ],
  "accounting/transactions": [
    view(
      "daily-journals",
      "Daily journal entries",
      "القيود اليومية",
      ["ref", "date", "account", "description", "debit", "credit", "costCenter", "status"],
      [search, status, ...dates, field("account", "lookup")],
      accountingDependency,
      {
        draft: [
          field("ref", "text", true),
          field("date", "date", true),
          field("description", "text", true),
          field("account", "lookup", true),
          field("debit", "number"),
          field("credit", "number"),
        ],
        actions: [action("Create journal", "إنشاء قيد"), action("Post journal", "ترحيل قيد")],
        sensitive: true,
      },
    ),
    view(
      "unposted-journals",
      "Non-posted journals",
      "القيود غير المرحلة",
      ["ref", "date", "description", "debit", "credit", "status"],
      [search, ...dates],
      accountingDependency,
      { sensitive: true },
    ),
    view(
      "unbalanced-journals",
      "Unbalanced journals",
      "القيود غير المتوازنة",
      ["ref", "date", "debit", "credit", "requirements"],
      [search, ...dates],
      accountingDependency,
      { sensitive: true },
    ),
  ],
  "accounting/corrections": [closing, closingHistory],
  "accounting/reports": ledgerReports,
  "treasury/overview": [
    view(
      "treasuries",
      "Treasuries / cash registers",
      "الخزائن / الصناديق",
      ["ref", "name", "currency", "status"],
      [search, status],
      treasuryDependency,
      {
        draft: [
          field("ref", "text", true),
          field("name", "text", true),
          field("currency", "text", true),
        ],
        actions: [action("Add treasury", "إضافة خزينة")],
        sensitive: true,
      },
    ),
  ],
  "treasury/bank-accounts": [
    view(
      "bank-accounts",
      "Bank accounts",
      "الحسابات البنكية",
      ["ref", "name", "bank", "bankAccount", "currency", "status"],
      [search, status, field("bank", "lookup")],
      treasuryDependency,
      {
        draft: [
          field("name", "text", true),
          field("bank", "lookup", true),
          field("currency", "text", true),
        ],
        actions: [action("Add bank account", "إضافة حساب بنكي")],
        sensitive: true,
      },
    ),
  ],
  "treasury/receipts": [
    voucher("cash-receipts", "Incoming cash receipts", "المقبوضات النقدية", "cash", true),
    voucher("bank-receipts", "Incoming bank receipts", "المقبوضات البنكية", "bank", true),
  ],
  "treasury/disbursements": [
    voucher("cash-disbursements", "Cash disbursements", "المدفوعات النقدية", "cash", false),
    voucher("bank-disbursements", "Bank disbursements", "المدفوعات البنكية", "bank", false),
  ],
  "treasury/history": [
    view(
      "voucher-history",
      "Treasury voucher history",
      "تاريخ سندات الخزينة",
      ["ref", "date", "event", "treasury", "bankAccount", "actor", "status"],
      [search, ...dates, field("treasury", "lookup")],
      treasuryDependency,
      { sensitive: true },
    ),
    view(
      "transfers",
      "Transfers between accounts / treasuries",
      "التحويلات بين الحسابات والخزائن",
      ["ref", "date", "source", "destination", "amount", "currency", "status"],
      [search, ...dates, status],
      treasuryDependency,
      {
        draft: [
          field("date", "date", true),
          field("source", "lookup", true),
          field("destination", "lookup", true),
          field("amount", "number", true),
        ],
        actions: [action("Record transfer", "تسجيل تحويل")],
        sensitive: true,
      },
    ),
    view(
      "currency-revaluation",
      "Currency exchange / revaluation — unsupported",
      "الصرف وإعادة التقييم — غير مدعوم",
      ["date", "currency", "rate", "account", "status"],
      [...dates, field("currency")],
      treasuryDependency,
      { evidence: "unverified", sensitive: true },
    ),
  ],
  "treasury/reports": [
    view(
      "financial-position",
      "Financial-position report",
      "تقرير المركز المالي",
      ["account", "currency", "debit", "credit", "balance"],
      [...scope, ...dates, field("account", "lookup")],
      treasuryDependency,
      { report: true },
    ),
  ],
  "purchasing/overview": [
    view(
      "purchasing-overview",
      "Purchasing document overview",
      "نظرة على مستندات المشتريات",
      ["ref", "supplier", "date", "status", "project", "payment"],
      [search, status, ...dates, field("supplier", "lookup")],
      purchaseDependency,
    ),
  ],
  "purchasing/invoices": [
    purchase("purchase-invoices", "Purchase invoices", "فواتير المشتريات"),
    purchase("purchase-orders", "Purchase orders", "أوامر الشراء"),
    purchase("purchase-receipts", "Purchase receipt tools", "أدوات استلام المشتريات"),
  ],
  "purchasing/returns": [
    purchase("purchase-returns", "Purchase returns", "مرتجعات المشتريات", ["original", "reason"]),
  ],
  "purchasing/suppliers": [
    view(
      "supplier-details",
      "Supplier directory structure",
      "هيكل دليل الموردين",
      ["ref", "name", "email", "status", "attachments"],
      [search, status],
      purchaseDependency,
      {
        draft: [field("name", "text", true), field("email", "email")],
        actions: [action("Edit supplier", "تعديل المورد")],
        sensitive: true,
      },
    ),
  ],
  "purchasing/payments": [
    view(
      "supplier-payments",
      "Supplier payment register — unavailable",
      "سجل سداد الموردين — غير متاح",
      ["ref", "supplier", "date", "amount", "payment", "attachments"],
      [search, ...dates, field("supplier", "lookup")],
      purchaseDependency,
      { evidence: "adapted", sensitive: true },
    ),
  ],
  "purchasing/reports": [
    view(
      "purchase-reports",
      "Purchasing reports",
      "تقارير المشتريات",
      ["supplier", "ref", "date", "quantity", "cost", "allocation", "status"],
      [...dates, field("supplier", "lookup"), field("project", "lookup")],
      purchaseDependency,
      { report: true, evidence: "adapted" },
    ),
  ],
  "sales/overview": [
    view(
      "sales-orders",
      "Construction sales orders / commitments",
      "أوامر البيع / ارتباطات البناء",
      ["ref", "customer", "date", "project", "stage", "status", "attachments"],
      [search, status, ...dates, field("customer", "lookup")],
      commercialDependency,
      {
        evidence: "adapted",
        draft: [
          field("name", "text", true),
          field("customer", "lookup", true),
          field("description", "text", true),
        ],
        actions: [action("Create construction order", "إنشاء أمر بناء")],
        sensitive: true,
      },
    ),
  ],
  "sales/reports": [
    view(
      "sales-stages",
      "Construction sales-stage report",
      "تقرير مراحل بيع البناء",
      ["customer", "ref", "stage", "date", "status"],
      [...dates, field("customer", "lookup"), field("stage")],
      commercialDependency,
      { evidence: "adapted", report: true },
    ),
  ],
  "sales/revisions": [
    view(
      "quotation-revisions",
      "Quotation revision structure",
      "هيكل مراجعات عروض الأسعار",
      ["ref", "revision", "date", "internalReview", "customerDecision", "status"],
      [search, field("customer", "lookup")],
      commercialDependency,
      { evidence: "adapted", sensitive: true },
    ),
  ],
  "sales/decisions": [
    view(
      "customer-decisions",
      "Customer decision history",
      "تاريخ قرارات العميل",
      ["ref", "revision", "customer", "customerDecision", "date", "actor"],
      [search, ...dates, field("customer", "lookup")],
      commercialDependency,
      { evidence: "adapted", sensitive: true },
    ),
  ],
  "crm/contacts": [
    view(
      "customer-search",
      "Customer search and contact structure",
      "هيكل بحث العملاء ووسائل الاتصال",
      ["ref", "name", "email", "status", "assignee"],
      [search, status, field("assignee", "lookup")],
      commercialDependency,
      {
        draft: [field("name", "text", true), field("email", "email")],
        actions: [action("Edit contact", "تعديل وسيلة الاتصال")],
      },
    ),
  ],
  "crm/reports": [
    view(
      "customer-status",
      "Customer status report",
      "تقرير حالة العملاء",
      ["customer", "stage", "status", "date", "assignee"],
      [search, status, ...dates, field("customer", "lookup")],
      commercialDependency,
      { report: true },
    ),
  ],
  "crm/follow-up": [responseMetrics],
  "communications/delivery": [
    view(
      "channels",
      "Message channels and delivery",
      "قنوات الرسائل والتسليم",
      ["channel", "ref", "customer", "date", "status"],
      [search, status, ...dates, field("channel")],
      communicationDependency,
    ),
  ],
  "communications/pending": [
    view(
      "distribution",
      "Message distribution / staff assignment",
      "توزيع الرسائل / تعيين الموظفين",
      ["ref", "channel", "assignee", "date", "status"],
      [search, status, field("assignee", "lookup")],
      communicationDependency,
      { actions: [action("Assign message", "تعيين رسالة")], sensitive: true },
    ),
  ],
  "communications/preferences": [
    view(
      "communication-preferences",
      "Communication consent and preferences",
      "موافقات وتفضيلات التواصل",
      ["customer", "channel", "consent", "status"],
      [search, field("customer", "lookup"), field("channel")],
      communicationDependency,
      { evidence: "adapted", sensitive: true },
    ),
  ],
  "communications/follow-up": [responseMetrics],
  ...completionScreenSpecs,
  "reporting/financial": ledgerReports,
  "reporting/commercial": [
    view(
      "commercial-pipeline",
      "Inquiry to project pipeline report",
      "تقرير المسار من الاستفسار إلى المشروع",
      ["customer", "ref", "stage", "revision", "customerDecision", "status"],
      [...dates, field("project", "lookup"), field("customer", "lookup")],
      commercialDependency,
      { evidence: "adapted", report: true },
    ),
  ],
  "reporting/customers": [
    view(
      "customer-report",
      "Customer-related report",
      "تقرير العملاء",
      ["customer", "ref", "stage", "status", "date"],
      [search, status, ...dates, field("customer", "lookup")],
      commercialDependency,
      { report: true },
    ),
  ],
};
/** Purpose separates scopes even when the visual column pattern is shared. */
export const screenPurposes: Record<string, LocalizedText> = {
  "cash-receipts": text(
    "Incoming cash only: a customer receipt into a cash treasury, not bank settlement or an outgoing expense.",
    "مقبوضات نقدية فقط: سند عميل إلى خزينة نقدية، وليس تسوية بنكية أو مصروفاً صادراً.",
  ),
  "bank-receipts": text(
    "Incoming bank receipts only: a bank-account voucher, not proof of cleared funds and not the cash register.",
    "مقبوضات بنكية فقط: سند حساب بنكي، وليس إثبات تحصيل فعلي أو سجل صندوق نقدي.",
  ),
  "cash-disbursements": text(
    "Outgoing cash vouchers only. Expense fixtures are not cash disbursement records or supplier settlement evidence.",
    "سندات النقد الصادر فقط؛ عينات المصروفات ليست سجلات صرف نقدي أو إثبات تسوية مورد.",
  ),
  "bank-disbursements": text(
    "Outgoing bank vouchers only. No bank debit, transfer completion or supplier payment is verified.",
    "سندات البنك الصادرة فقط؛ لا يُتحقق من خصم بنكي أو اكتمال تحويل أو سداد مورد.",
  ),
  "voucher-history": text(
    "Voucher lifecycle events, not incoming-payment history. No event or past voucher state is inferred from other fixtures.",
    "أحداث دورة السندات وليس تاريخ المقبوضات؛ لا يُستنتج حدث أو حالة سند سابقة من عينات أخرى.",
  ),
  transfers: text(
    "Paired source and destination movements require an atomic authorized transfer; this is not an independent income/expense form.",
    "تتطلب حركتا المصدر والوجهة تحويلاً مفوضاً ذرياً؛ ليست استمارة إيراد أو مصروف مستقلة.",
  ),
  "currency-revaluation": text(
    "Conditional navigation concept only. Exchange-rate sourcing, gains/losses and valuation methods are unverified and unsupported.",
    "مفهوم تنقل مشروط فقط؛ مصدر الصرف والأرباح والخسائر وأساليب التقييم غير متحققة وغير مدعومة.",
  ),
  "purchase-invoices": text(
    "Supplier invoice structure: document reference, dated priced lines, attachments and payment state. It is not a posted payable.",
    "هيكل فاتورة مورد: مرجع المستند وبنود مؤرخة مسعرة ومرفقات وحالة سداد؛ ليست التزاماً مرحلاً.",
  ),
  "purchase-orders": text(
    "Procurement orders are separate from supplier invoices. An order does not establish goods receipt, stock, liability or payment.",
    "أوامر التوريد مستقلة عن فواتير الموردين؛ لا يثبت الأمر استلاماً أو مخزوناً أو التزاماً أو سداداً.",
  ),
  "purchase-receipts": text(
    "Receipt tools describe received lines/quantities and source documents. No warehouse receipt, stock movement or payable is produced.",
    "تصف أدوات الاستلام البنود والكميات المستلمة ومستنداتها؛ لا تنتج إذن مخزن أو حركة مخزون أو التزاماً.",
  ),
  "purchase-returns": text(
    "Returns require an original purchase document and reason, with separate quantity/cost and attachment evidence; no reversal is executed.",
    "تتطلب المرتجعات مستند شراء أصلياً وسبباً وأدلة كمية وتكلفة ومرفقات مستقلة؛ لا يُنفذ عكس حركة.",
  ),
  "financial-years": text(
    "Inspect a year’s status, open periods, unposted journals and remaining prerequisites. Closing/profit figures remain unknown without a ledger.",
    "افحص حالة السنة والفترات المفتوحة والقيود غير المرحلة والمتطلبات المتبقية؛ تظل أرقام الإقفال والأرباح غير معروفة دون دفتر.",
  ),
  "period-closing": text(
    "Prerequisite inspection only. No period is closed and historical entries cannot be rewritten from this screen.",
    "فحص متطلبات فقط؛ لا تُقفل فترة ولا تعاد كتابة قيود تاريخية من هذه الشاشة.",
  ),
  "closing-history": text(
    "Preserve distinct closing and reopening events with actor, date and reason. No synthetic history or automatic reopening is supplied.",
    "الاحتفاظ بأحداث الإقفال وإعادة الفتح منفصلة بالمنفذ والتاريخ والسبب؛ لا يوجد تاريخ مصطنع أو إعادة فتح تلقائية.",
  ),
  "trial-balance": text(
    "Account-by-account opening debit/credit, period debit/credit and closing debit/credit. No trial balance is computed from payment fixtures.",
    "افتتاحي مدين ودائن وحركة الفترة مدين ودائن وختامي مدين ودائن لكل حساب؛ لا يُحسب الميزان من عينات السداد.",
  ),
  "general-budget": text(
    "Public/general budget is the supplied reference label. Its exact accounting definition, formula and relation to financial position are unverified.",
    "الموازنة العامة تسمية المرجع المقدم؛ تعريفها المحاسبي وصيغتها وعلاقتها بالمركز المالي غير متحققة.",
  ),
  branches: text(
    "Company/branch layout only, not active organizations. BLACK X has no branch directory, company records or multi-company isolation here.",
    "هيكل شركات وفروع فقط وليس جهات فعالة؛ لا يوجد دليل فروع أو سجلات شركات أو عزل متعدد الشركات هنا.",
  ),
  users: text(
    "Inspect login, name, email, level, status, roles and unavailable account actions. No password field or real identity data is included.",
    "فحص الدخول والاسم والبريد والمستوى والحالة والأدوار وإجراءات الحساب غير المتاحة؛ لا حقل كلمة مرور أو بيانات هوية حقيقية.",
  ),
  "sales-orders": text(
    "Adapt orders to construction scope and commitments, not a retail checkout or an approved contract/project. The contractual workflow remains separate.",
    "تكييف الأوامر لنطاق وارتباطات البناء وليس بيع التجزئة أو عقداً أو مشروعاً معتمداً؛ يظل مسار التعاقد مستقلاً.",
  ),
  "response-metrics": text(
    "Requires correlated incoming/response timestamps and assignment/channel attribution. No response average or service target is guessed.",
    "يتطلب ربط أوقات الوارد والاستجابة وتحديد القناة والمسؤول؛ لا يُخمن متوسط استجابة أو هدف خدمة.",
  ),
  distribution: text(
    "Staff assignment of incoming messages only; not marketing distribution or a bulk broadcast/campaign service.",
    "تعيين موظف للرسائل الواردة فقط؛ ليس توزيعاً تسويقياً أو خدمة بث جماعي أو حملات.",
  ),
};
export function getScreenViews(area: string, page: string): ScreenView[] {
  return erpScreenSpecs[`${area}/${page}`] ?? [];
}
export function resolveScreenView(
  area: string,
  page: string,
  candidate: unknown,
): string | undefined {
  return typeof candidate === "string" && getScreenViews(area, page).some((v) => v.id === candidate)
    ? candidate
    : undefined;
}
export function screenSearchText(area: string, page: string): string {
  return getScreenViews(area, page)
    .map((v) => `${v.title.ar} ${v.title.en} ${v.id}`)
    .join(" ");
}
export function validateScreenInputs(
  inputs: ScreenInput[],
  values: Record<string, string>,
): Partial<Record<ScreenFieldKey, "required" | "invalid" | "lookup">> {
  const errors: Partial<Record<ScreenFieldKey, "required" | "invalid" | "lookup">> = {};
  for (const input of inputs) {
    const value = (values[input.key] ?? "").trim();
    if (input.type === "lookup") {
      if (input.required) errors[input.key] = "lookup";
      continue;
    }
    if (!value && input.required) errors[input.key] = "required";
    else if (
      value &&
      ((input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) ||
        (input.type === "number" && (!Number.isFinite(Number(value)) || Number(value) < 0)) ||
        (input.type === "date" &&
          (!/^\d{4}-\d{2}-\d{2}$/.test(value) ||
            Number.isNaN(Date.parse(value)) ||
            new Date(value).toISOString().slice(0, 10) !== value)))
    )
      errors[input.key] = "invalid";
  }
  if (values.from && values.to && values.from > values.to) errors.to = "invalid";
  return errors;
}
