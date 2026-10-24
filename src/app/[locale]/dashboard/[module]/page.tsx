import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales } from "@/lib/i18n";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { dashboardModules, type DashboardModuleKey } from "@/config/navigation";
import { previewModuleTables } from "@/content/preview-modules";
import { DataTable } from "@/components/dashboard/DataTable";
import { DomainBoard, type DomainBoardModuleKey } from "@/components/dashboard/DomainBoards";
import { ExpansionBoard, type ExpansionModuleKey } from "@/components/dashboard/ExpansionBoards";

const DOMAIN_BOARD_MODULES = new Set<DashboardModuleKey>([
  "customers",
  "inspections",
  "quotations",
  "contracts",
  "projects",
  "milestones",
  "diary",
  "progress",
  "issues",
  "quality",
  "reports",
  "documents",
  "handover",
  "warranty",
  "notifications",
  "audit",
]);

function isDomainBoardModule(key: DashboardModuleKey): key is DomainBoardModuleKey {
  return DOMAIN_BOARD_MODULES.has(key);
}

const EXPANSION_BOARD_MODULES = new Set<DashboardModuleKey>([
  "engineers",
  "finance",
  "purchases",
  "complaints",
  "messages",
]);

function isExpansionBoardModule(key: DashboardModuleKey): key is ExpansionModuleKey {
  return EXPANSION_BOARD_MODULES.has(key);
}

const TABLE_MODULES = dashboardModules.filter(
  (m) => m.key !== "overview" && m.key !== "requests" && m.segment !== "",
);

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => TABLE_MODULES.map((m) => ({ locale, module: m.segment })));
}

function moduleKeyFor(segment: string): DashboardModuleKey | undefined {
  return dashboardModules.find((m) => m.segment === segment)?.key;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; module: string }>;
}): Promise<Metadata> {
  const { module } = await params;
  const locale = await resolveLocale(params);
  const key = moduleKeyFor(module);
  if (!key || key === "overview" || key === "requests") notFound();
  return { title: getAppDictionary(locale).dashboard.modules[key] };
}

export default async function DashboardModulePage({
  params,
}: {
  params: Promise<{ locale: string; module: string }>;
}) {
  const { module } = await params;
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  const key = moduleKeyFor(module);
  if (!key || key === "overview" || key === "requests") notFound();

  const table = previewModuleTables[key];
  const lead = app.dashboard.moduleLead[key];

  if (isDomainBoardModule(key)) {
    return <DomainBoard locale={locale} appDict={app} moduleKey={key} />;
  }

  if (isExpansionBoardModule(key)) {
    return <ExpansionBoard locale={locale} appDict={app} moduleKey={key} />;
  }

  return (
    <>
      <div className="module-page-head">
        <h2>{app.dashboard.modules[key]}</h2>
        {lead ? <p>{lead}</p> : null}
      </div>
      {table ? (
        <DataTable locale={locale} appDict={app} table={table} moduleKey={key} />
      ) : (
        <div className="empty-state">
          <h2>{app.dashboard.modules[key]}</h2>
          <p>{app.dashboard.genericEmpty}</p>
        </div>
      )}
    </>
  );
}
