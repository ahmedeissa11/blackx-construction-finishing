import type { Locale, LocalizedText } from "@/lib/i18n";
export const erpCopy = {
  workspace: { ar: "مساحة BLACK X ERP", en: "BLACK X ERP workspace" },
  catalogue: { ar: "دليل الوحدات والصفحات", en: "Module & page directory" },
  search: { ar: "ابحث عن وحدة أو صفحة…", en: "Find a module or page…" },
  command: { ar: "البحث السريع", en: "Quick navigation" },
  close: { ar: "إغلاق", en: "Close" },
  noResults: {
    ar: "لا توجد نتائج. غيّر عبارة البحث أو امسح المرشحات.",
    en: "No matches. Change your search or clear the filters.",
  },
  preview: {
    ar: "معاينة توضيحية — ليست سجلات أعمال معتمدة",
    en: "Illustrative preview — not authoritative business records",
  },
  previewNote: {
    ar: "العينات الحالية للمراجعة فقط؛ لا يتم حفظ تعديلات أو إرسال رسائل أو تنفيذ حركات مالية أو مخزنية.",
    en: "Existing fixtures are for review only. No edits are persisted, messages delivered, or financial/stock movements executed.",
  },
  legacy: {
    ar: "المرجع القديم يذكر 21 وحدة و337 صفحة؛ الأسماء الداخلية غير متحققة. هذا الدليل يعرض نطاق BLACK X الفعلي فقط.",
    en: "The legacy reference reports 21 modules and 337 pages; internal page names are unverified. This directory counts only actual BLACK X workspace routes.",
  },
  category: { ar: "فئة وردت في الوصف المرجعي", en: "Category supplied in reference description" },
  adapted: { ar: "تكييف لأعمال البناء والتشطيب", en: "Adapted for construction & finishing" },
  proposed: {
    ar: "هيكل صفحة BLACK X — ليس تحققاً من صفحة قديمة",
    en: "BLACK X page structure — not a verified legacy page",
  },
  pages: { ar: "صفحات", en: "Pages" },
  modules: { ar: "وحدات مسماة", en: "Named modules" },
  current: { ar: "مساحات المراجعة الحالية", en: "Existing review workspaces" },
  open: { ar: "فتح مساحة المراجعة الحالية", en: "Open existing review workspace" },
  linked: { ar: "موارد مراجعة (ليست خدمات حية)", en: "Review resources (not live services)" },
  pending: { ar: "مؤجل — غير منفذ", en: "Deferred — not implemented" },
  deferred: {
    ar: "مؤجل لحين اعتماد القواعد والتفويض",
    en: "Deferred pending rules & authorization",
  },
  unavailable: { ar: "العملية غير متاحة", en: "Operation unavailable" },
  empty: {
    ar: "لا توجد سجلات من مصدر معتمد متصل لهذه الصفحة.",
    en: "No records from a connected, authorized source are available for this page.",
  },
  dependency: { ar: "ما يلزم لتفعيل هذه المساحة", en: "What this workspace needs" },
  service: {
    ar: "خدمة نطاق معتمدة ومصدر بيانات دائم؛ لا يتم استخدام عينات كسجلات حقيقية.",
    en: "An authorized domain service and durable data source; fixtures must not become operational records.",
  },
  rules: {
    ar: "قواعد الأعمال والتحقق وسياسة الموافقة والتدقيق المعتمدة لهذا السجل.",
    en: "Approved business rules, validation, approval policy and auditing for this record type.",
  },
  access: {
    ar: "تفويض من الخادم لكل إجراء؛ إخفاء زر لا يُعد حماية.",
    en: "Server authorization for every action; hiding a button is not a security boundary.",
  },
  fields: {
    ar: "حقول مقترحة — مخطط واجهة وليس عقد خدمة نهائياً",
    en: "Proposed fields — UI schema, not a final service contract",
  },
  inspect: { ar: "عرض التفاصيل", en: "Inspect details" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
  sort: { ar: "ترتيب السجلات", en: "Sort records" },
  ascending: { ar: "المرجع تصاعدياً", en: "Reference ascending" },
  descending: { ar: "المرجع تنازلياً", en: "Reference descending" },
  filter: { ar: "تصفية بالحالة أو النوع", en: "Filter by status or type" },
  all: { ar: "الكل", en: "All" },
  count: { ar: "سجلات توضيحية مطابقة", en: "Matching illustrative records" },
  matrix: {
    ar: "نموذج الهوية الحالي: حساب واحد بدور مراجعة المالك. الجدول يعرض حدود التنفيذ، وليس منح صلاحيات للموظفين.",
    en: "Current identity: a single owner-review account. This matrix documents implementation boundaries, not editable staff grants.",
  },
  view: { ar: "عرض", en: "View" },
  create: { ar: "إنشاء", en: "Create" },
  edit: { ar: "تعديل", en: "Edit" },
  approve: { ar: "اعتماد", en: "Approve" },
  export: { ar: "تصدير", en: "Export" },
  admin: { ar: "إدارة الصلاحيات", en: "Administer access" },
  owner: { ar: "مراجعة المالك فقط", en: "Owner review only" },
  blocked: { ar: "غير مفعّل هنا", en: "Not enabled here" },
  settings: {
    ar: "هذه الصفحة دليل إعدادات وليست محرراً لقيم الخادم. اختيار اللغة متاح من شريط التطبيق؛ التفضيلات الأخرى غير محفوظة.",
    en: "This is a configuration catalogue, not an editor for server values. Switch language in the app header; other preferences are not persisted.",
  },
  health: {
    ar: "تشخيص آمن لحدود التطبيق — ليس اختبار اتصال بقاعدة بيانات أو مزود خارجي.",
    en: "Safe application-boundary diagnostics — not a database or external-provider connectivity test.",
  },
  role: { ar: "الدور المصدق", en: "Authenticated role" },
  adapter: { ar: "حالة محول البيانات", en: "Data adapter status" },
  contract: { ar: "حالة نطاقات عقد الخدمة", en: "Service-contract domain readiness" },
  configured: { ar: "مفعّل للاختبار فقط", en: "Active for testing only" },
  refused: { ar: "مرفوض بسياسة الأمان", en: "Refused by security policy" },
  unconfigured: { ar: "غير متصل", en: "Not connected" },
  importHelp: {
    ar: "صيغة BLACK X مقترحة للتحقق فقط: مصفوفة JSON من كائنات تحتوي reference وname وemail اختياري. الحد 500 سجل و256 KiB. التحقق محلي؛ لا تُرسل أي بيانات.",
    en: "Proposed BLACK X validation format only: a JSON array of objects with reference, name and optional email. Maximum 500 rows / 256 KiB. Validation stays in this browser; nothing is submitted.",
  },
  choose: { ar: "ملف JSON مرشح للتحقق", en: "Candidate JSON file for validation" },
  validate: { ar: "تحقق محلياً فقط", en: "Validate locally only" },
  reset: { ar: "مسح المعاينة", en: "Clear preview" },
  invalid: {
    ar: "بيانات غير صالحة؛ راجع أرقام الصفوف والحقول أدناه.",
    en: "Invalid candidate data; review row numbers and fields below.",
  },
  valid: {
    ar: "اجتاز التحقق المحلي فقط — لم يُستورد أو يُحفظ أي سجل.",
    en: "Local validation passed only — no records were imported or saved.",
  },
  importUnavailable: {
    ar: "الاستيراد الفعلي غير متاح حتى توفير خدمة استيراد مخولة ومصدر دائم.",
    en: "Actual import is unavailable until an authorized import service and durable source exist.",
  },
  exportHelp: {
    ar: "التنزيل المتاح يضم أسماء ومسارات الوحدات فقط، بلا بيانات عملاء أو أموال. تصدير بيانات الأعمال وسجله غير مفعّلين.",
    en: "The available download contains module names and routes only—no customer or financial records. Business-data export and its history are not enabled.",
  },
  download: { ar: "تنزيل دليل التنقل فقط (JSON)", en: "Download navigation directory only (JSON)" },
  chain: { ar: "مسار العمل الإنشائي", en: "Construction workflow" },
  future: {
    ar: "الست فئات المرجعية المتبقية غير مسماة؛ لا توجد أسماء مخترعة أو ادعاء بإعادة 337 صفحة.",
    en: "The remaining six reference categories are unnamed; no invented names or claim of 337 reproduced pages.",
  },
  loading: { ar: "جارٍ فتح مساحة العمل…", en: "Opening workspace…" },
  error: {
    ar: "تعذر عرض المساحة. لم يتم تنفيذ أي عملية جديدة من هذه الصفحة.",
    en: "The workspace could not be displayed. No new operation was executed by this page.",
  },
  retry: { ar: "إعادة المحاولة", en: "Try again" },
  sourceNote: {
    ar: "افتح المصدر الحالي لمراجعة عيناته وتفاصيله. لا تُعد هذه الصفحة تطبيقاً جديداً للاعتماد أو للترحيل أو لسجل غير متوفر.",
    en: "Open the existing source to inspect its fixtures and details. This page does not implement new approvals, posting, or an unavailable history.",
  },
} satisfies Record<string, LocalizedText>;
export function erpText(key: keyof typeof erpCopy, locale: Locale) {
  return erpCopy[key][locale];
}
export const erpFields: Record<string, LocalizedText> = Object.fromEntries(
  [
    ["ref", "المرجع", "Reference"],
    ["name", "الاسم", "Name"],
    ["type", "النوع", "Type"],
    ["project", "المشروع", "Project"],
    ["phase", "المرحلة", "Phase"],
    ["date", "التاريخ", "Date"],
    ["status", "الحالة", "Status"],
    ["amount", "القيمة التوضيحية", "Illustrative amount"],
    ["actor", "الفاعل", "Actor"],
    ["action", "الإجراء", "Action"],
    ["party", "الطرف", "Party"],
    ["due", "الاستحقاق", "Due date"],
    ["supplier", "المورد", "Supplier"],
    ["item", "الصنف / البند", "Item / work item"],
    ["unit", "الوحدة", "Unit"],
    ["quantity", "الكمية", "Quantity"],
    ["location", "الموقع", "Location"],
    ["reason", "السبب", "Reason"],
    ["currency", "العملة", "Currency"],
    ["criteria", "معيار الفحص", "Inspection criterion"],
    ["customer", "العميل", "Customer"],
    ["owner", "المسؤول", "Owner"],
    ["channel", "القناة", "Channel"],
    ["recipient", "المستلم", "Recipient"],
    ["event", "الحدث", "Event"],
    ["phone", "الهاتف", "Phone"],
    ["city", "المدينة", "City"],
    ["payment", "مرجع السداد", "Payment reference"],
    ["period", "الفترة", "Period"],
    ["price", "سعر الوحدة التوضيحي", "Illustrative unit price"],
    ["contract", "العقد", "Contract"],
    ["note", "البيان", "Description"],
  ].map(([key, ar, en]) => [key!, { ar: ar!, en: en! }]),
);

/** Presentation labels are not service-readiness or authorization claims. */
export function erpKindLabel(kind: import("@/config/erp").ErpPageKind, locale: Locale): string {
  const labels: Record<import("@/config/erp").ErpPageKind, LocalizedText> = {
    preview: { en: "Illustrative review — no durable writes", ar: "مراجعة توضيحية — دون حفظ دائم" },
    fixture: { en: "Read-only fixture data", ar: "عينات للقراءة فقط" },
    shared: { en: "Shared entry — not a separate operation", ar: "مدخل مشترك — ليس عملية مستقلة" },
    tool: { en: "Local tool — no business transaction", ar: "أداة محلية — دون معاملة أعمال" },
    deferred: { en: "Deferred — not implemented", ar: "مؤجل — غير منفذ" },
    readiness: { en: "Read-only readiness note", ar: "مذكرة جاهزية للقراءة فقط" },
    "source-link": { en: "Link only — existing preview", ar: "رابط فقط — معاينة حالية" },
    instructions: { en: "Format instructions — no import", ar: "إرشادات صيغة — دون استيراد" },
  };
  return labels[kind][locale];
}
