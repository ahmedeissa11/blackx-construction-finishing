import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { locales, pick } from "@/lib/i18n";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewRequests } from "@/content/preview-data";
import { previewCertificates } from "@/content/preview-expansion";
import { getPreviewCustomerContext, getPreviewCustomerItems } from "@/lib/admin-preview";
import {
  getComplaintsForCustomer,
  getCustomerFinance,
  getProjectPhases,
} from "@/lib/preview-expansion";
import { CustomerWorkspace } from "@/components/dashboard/CustomerWorkspace";

export const dynamicParams = false;

const customerIds = [...new Set(previewRequests.map((request) => request.customerId))].sort();

export function generateStaticParams() {
  return locales.flatMap((locale) => customerIds.map((id) => ({ locale, id })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const context = getPreviewCustomerContext(id);
  if (!context.latestRequest && context.projects.length === 0) notFound();
  const name = context.latestRequest ? pick(context.latestRequest.customerName, locale) : id;
  return {
    title: `${name} — ${getAppDictionary(locale).dashboard.expansion.customer.workspaceTitle}`,
  };
}

export default async function DashboardCustomerWorkspacePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  const context = getPreviewCustomerContext(id);
  if (!context.latestRequest && context.projects.length === 0) notFound();
  const item = getPreviewCustomerItems().find((entry) => entry.customerId === id);
  const projectIds = new Set(context.projects.map((project) => project.id));

  return (
    <CustomerWorkspace
      locale={locale}
      appDict={app}
      data={{
        context,
        status: item?.status,
        finance: getCustomerFinance(id),
        certificates: previewCertificates.filter((certificate) =>
          projectIds.has(certificate.projectId),
        ),
        complaints: getComplaintsForCustomer(id),
        phasesByProject: Object.fromEntries(
          context.projects.map((project) => [project.id, getProjectPhases(project.id)]),
        ),
      }}
    />
  );
}
