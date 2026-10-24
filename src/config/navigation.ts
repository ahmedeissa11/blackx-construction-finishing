import type { Locale } from "@/lib/i18n";

export type SiteNavKey = "home" | "about" | "services" | "projects" | "articles" | "contact";

export const siteNav: ReadonlyArray<{ key: SiteNavKey; segment: string }> = [
  { key: "home", segment: "" },
  { key: "about", segment: "about" },
  { key: "services", segment: "services" },
  { key: "projects", segment: "projects" },
  { key: "articles", segment: "articles" },
  { key: "contact", segment: "contact" },
];

export function siteHref(locale: Locale, segment = ""): string {
  return segment ? `/${locale}/${segment}` : `/${locale}`;
}

export type DashboardModuleKey =
  | "overview"
  | "customers"
  | "requests"
  | "inspections"
  | "quotations"
  | "contracts"
  | "projects"
  | "milestones"
  | "diary"
  | "progress"
  | "issues"
  | "documents"
  | "reports"
  | "quality"
  | "handover"
  | "warranty"
  | "notifications"
  | "audit";

export const dashboardModules: ReadonlyArray<{
  key: DashboardModuleKey;
  segment: string;
  icon: string;
}> = [
  { key: "overview", segment: "", icon: "▦" },
  { key: "notifications", segment: "notifications", icon: "🔔" },
  { key: "customers", segment: "customers", icon: "◉" },
  { key: "requests", segment: "requests", icon: "✉" },
  { key: "inspections", segment: "inspections", icon: "◎" },
  { key: "quotations", segment: "quotations", icon: "▤" },
  { key: "contracts", segment: "contracts", icon: "▣" },
  { key: "projects", segment: "projects", icon: "⬢" },
  { key: "milestones", segment: "milestones", icon: "⚑" },
  { key: "diary", segment: "diary", icon: "✎" },
  { key: "progress", segment: "progress", icon: "↗" },
  { key: "issues", segment: "issues", icon: "⚠" },
  { key: "quality", segment: "quality", icon: "✓" },
  { key: "handover", segment: "handover", icon: "🔑" },
  { key: "warranty", segment: "warranty", icon: "⛨" },
  { key: "reports", segment: "reports", icon: "▥" },
  { key: "documents", segment: "documents", icon: "🗀" },
  { key: "audit", segment: "audit", icon: "☰" },
];

export type DashboardNavGroupKey =
  "home" | "clientsSales" | "projectsExecution" | "qualityHandover" | "managementReports";

export const dashboardNavGroups: ReadonlyArray<{
  key: DashboardNavGroupKey;
  modules: readonly DashboardModuleKey[];
}> = [
  { key: "home", modules: ["overview", "notifications"] },
  {
    key: "clientsSales",
    modules: ["customers", "requests", "inspections", "quotations", "contracts"],
  },
  { key: "projectsExecution", modules: ["projects", "milestones", "diary", "progress"] },
  { key: "qualityHandover", modules: ["issues", "quality", "handover", "warranty"] },
  { key: "managementReports", modules: ["reports", "documents", "audit"] },
];

export function getDashboardNavGroupKey(module: DashboardModuleKey): DashboardNavGroupKey {
  return dashboardNavGroups.find((group) => group.modules.includes(module))?.key ?? "home";
}

export function dashboardHref(locale: Locale, segment = ""): string {
  return segment ? `/${locale}/dashboard/${segment}` : `/${locale}/dashboard`;
}

export type PortalNavKey =
  | "overview"
  | "myProjects"
  | "milestones"
  | "reports"
  | "documents"
  | "quotations"
  | "issues"
  | "handover"
  | "profile";

export const portalNav: ReadonlyArray<{ key: PortalNavKey; segment: string; icon: string }> = [
  { key: "overview", segment: "", icon: "▦" },
  { key: "myProjects", segment: "projects", icon: "⬢" },
  { key: "milestones", segment: "milestones", icon: "⚑" },
  { key: "reports", segment: "reports", icon: "▥" },
  { key: "documents", segment: "documents", icon: "🗀" },
  { key: "quotations", segment: "quotations", icon: "▤" },
  { key: "issues", segment: "issues", icon: "⚠" },
  { key: "handover", segment: "handover", icon: "🔑" },
  { key: "profile", segment: "profile", icon: "◉" },
];

export function portalHref(locale: Locale, segment = ""): string {
  return segment ? `/${locale}/portal/${segment}` : `/${locale}/portal`;
}
