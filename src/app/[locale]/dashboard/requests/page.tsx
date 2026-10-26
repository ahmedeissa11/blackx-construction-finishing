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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams?: Promise<{ focus?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const app = getAppDictionary(locale);
  const rawFocus = (await searchParams)?.focus;
  const focused =
    typeof rawFocus === "string"
      ? previewRequests.find((request) => request.id === rawFocus)
      : undefined;
  return (
    <RequestsBoard
      key={focused?.id ?? (rawFocus !== undefined ? "unavailable-focus" : "requests")}
      locale={locale}
      appDict={app}
      initialRequests={previewRequests}
      initialFocusId={focused?.id}
      focusUnavailable={rawFocus !== undefined && !focused}
    />
  );
}
