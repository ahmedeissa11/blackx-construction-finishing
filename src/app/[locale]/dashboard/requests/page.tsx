import type { Metadata } from "next";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewRequests } from "@/content/preview-data";
import { RequestsBoard } from "@/components/dashboard/RequestsBoard";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).dashboard.requestsTitle };
}

export default async function DashboardRequests({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  return <RequestsBoard locale={locale} appDict={app} initialRequests={previewRequests} />;
}
