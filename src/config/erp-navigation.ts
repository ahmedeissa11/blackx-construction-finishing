import { erpHref, erpModules } from "@/config/erp";
import type { Locale, LocalizedText } from "@/lib/i18n";

/** Presentation groups only. Module/page IDs and server authorization stay unchanged. */
export const erpNavigationGroups: ReadonlyArray<{
  id: string;
  title: LocalizedText;
  modules: readonly string[];
}> = [
  {
    id: "commercial",
    title: { ar: "العملاء والمبيعات والتوريد", en: "Clients, sales & purchasing" },
    modules: ["crm", "sales", "purchasing", "communications"],
  },
  {
    id: "delivery",
    title: { ar: "تنفيذ المشروعات والمخزون والجودة", en: "Project delivery, inventory & quality" },
    modules: ["projects", "inventory", "quality"],
  },
  {
    id: "finance",
    title: { ar: "المالية والخزينة والتقارير", en: "Finance, treasury & reporting" },
    modules: ["accounting", "treasury", "cheques", "reporting"],
  },
  {
    id: "governance",
    title: { ar: "النظام والإدارة والبيانات", en: "System, administration & data" },
    modules: ["permissions", "settings", "administration", "data"],
  },
];

/** Authoritative route data, derived from the same registry used by the guarded pages. */
export function getErpRouteInventory(locale: Locale) {
  const layout = "src/app/[locale]/dashboard/layout.tsx";
  const groupFor = (area: string) => erpNavigationGroups.find((g) => g.modules.includes(area))!.id;
  return [
    {
      path: erpHref(locale),
      module: null,
      page: null,
      group: null,
      kind: "directory",
      title: "BLACK X ERP",
      section: null,
      summary:
        "Guarded ERP directory inside the existing Admin shell; not an operational dashboard.",
      canonical: null,
      layout,
      access: "owner_review",
      integration: "shared-admin",
    },
    ...erpModules.flatMap((area) => [
      {
        path: erpHref(locale, area.id),
        module: area.id,
        page: null,
        group: groupFor(area.id),
        kind: "module",
        title: area.title[locale],
        section: null,
        summary: area.boundary[locale],
        canonical: null,
        layout,
        access: "owner_review",
        integration: "shared-admin",
      },
      ...area.pages.map((page) => ({
        path: erpHref(locale, area.id, page.id),
        module: area.id,
        page: page.id,
        group: groupFor(area.id),
        kind: page.kind,
        title: page.title[locale],
        section: page.section[locale],
        summary: page.summary[locale],
        canonical: page.sharedWith
          ? erpHref(locale, page.sharedWith.area, page.sharedWith.page)
          : null,
        layout,
        access: "owner_review",
        integration: "shared-admin",
      })),
    ]),
  ];
}
