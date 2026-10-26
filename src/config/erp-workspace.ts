import type { LocalizedText } from "@/lib/i18n";

/** Presentation only. Names, counts, availability and destinations come from erpModules. */
export const erpWorkspacePresentation: Record<
  string,
  { icon: string; description: LocalizedText }
> = {
  crm: {
    icon: "◉",
    description: {
      en: "Customer references, inquiries and complaint review.",
      ar: "مراجع العملاء والاستفسارات ومراجعة الشكاوى.",
    },
  },
  sales: {
    icon: "▣",
    description: {
      en: "Requests, inspections, quotations and commercial review.",
      ar: "الطلبات والمعاينات والعروض والمراجعة التجارية.",
    },
  },
  purchasing: {
    icon: "▤",
    description: {
      en: "Supplier references, purchases and invoice previews.",
      ar: "مراجع الموردين والمشتريات ومعاينات الفواتير.",
    },
  },
  communications: {
    icon: "✉",
    description: {
      en: "Message, notification and template previews; no delivery.",
      ar: "معاينات الرسائل والإشعارات والقوالب؛ دون إرسال فعلي.",
    },
  },
  projects: {
    icon: "⬢",
    description: {
      en: "Project portfolios, phases, progress and handover review.",
      ar: "محفظة المشروعات والمراحل والتقدم ومراجعة التسليم.",
    },
  },
  inventory: {
    icon: "▩",
    description: {
      en: "Item references and stock-movement review structures.",
      ar: "مراجع الأصناف وهياكل مراجعة حركات المخزون.",
    },
  },
  quality: {
    icon: "✓",
    description: {
      en: "Inspection references, checklists and quality review.",
      ar: "مراجع الفحوصات وقوائم التحقق ومراجعة الجودة.",
    },
  },
  accounting: {
    icon: "▥",
    description: {
      en: "Accounts, journal structures and financial review layouts.",
      ar: "الحسابات وهياكل القيود ونماذج المراجعة المالية.",
    },
  },
  treasury: {
    icon: "◈",
    description: {
      en: "Receipt, payment and reconciliation review structures.",
      ar: "هياكل مراجعة المقبوضات والمدفوعات والتسويات.",
    },
  },
  cheques: {
    icon: "✎",
    description: {
      en: "Incoming and outgoing cheque register layouts.",
      ar: "هياكل سجلات الشيكات الواردة والصادرة.",
    },
  },
  reporting: {
    icon: "↗",
    description: {
      en: "Project, cost and financial report templates and previews.",
      ar: "قوالب ومعاينات تقارير المشروعات والتكاليف والمالية.",
    },
  },
  permissions: {
    icon: "⛨",
    description: {
      en: "Synthetic roles and UI-permission previews; no live grants.",
      ar: "أدوار اصطناعية ومعاينات صلاحيات الواجهة؛ دون منح فعلي.",
    },
  },
  settings: {
    icon: "⚙",
    description: {
      en: "Company and workspace configuration references.",
      ar: "مراجع إعدادات الشركة ومساحة العمل.",
    },
  },
  administration: {
    icon: "🔑",
    description: {
      en: "User-directory previews, session and system review.",
      ar: "معاينات دليل المستخدمين ومراجعة الجلسات والنظام.",
    },
  },
  data: {
    icon: "🗀",
    description: {
      en: "Local format validation and export tools; no data import.",
      ar: "تحقق محلي من الصيغ وأدوات التصدير؛ دون استيراد بيانات.",
    },
  },
};

/** Bilingual search, including common Arabic diacritics/tatweel and repeated whitespace. */
export function normalizeWorkspaceSearch(text: string): string {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\u0640\u064b-\u065f\u0670]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
