import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, pick } from "@/lib/i18n";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewProjects } from "@/content/preview-data";
import { getPreviewProjectOperations } from "@/lib/admin-preview";
import { ProjectWorkspace } from "@/components/dashboard/ProjectWorkspace";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    previewProjects.map((project) => ({ locale, id: project.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const operations = getPreviewProjectOperations(id);
  if (!operations) notFound();
  return {
    title: `${pick(operations.project.title, locale)} — ${getAppDictionary(locale).dashboard.modules.projects}`,
  };
}

export default async function DashboardProjectWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  const operations = getPreviewProjectOperations(id);
  if (!operations) notFound();

  return <ProjectWorkspace locale={locale} appDict={app} operations={operations} />;
}
