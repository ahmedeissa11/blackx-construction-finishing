import { notFound } from "next/navigation";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { pick } from "@/lib/i18n";
import { resolveScreenView } from "@/config/erp-screen-specs";
import { findErpPage } from "@/config/erp";
import { getAdapterSelection, DOMAIN_STATUS } from "@/server/foundation/config";
import { ErpPageContent } from "@/components/dashboard/ErpPageContent";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; area: string; page: string }>;
}) {
  const locale = await resolveLocale(params);
  const { area, page } = await params;
  const match = findErpPage(area, page);
  return { title: match ? pick(match.page.title, locale) : "BLACK X ERP" };
}
export default async function ErpLeaf({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; area: string; page: string }>;
  searchParams?: Promise<{ view?: string | string[] }>;
}) {
  const locale = await resolveLocale(params);
  const session = await requireReviewAccess(locale);
  const { area, page } = await params;
  const match = findErpPage(area, page);
  if (!match) notFound();
  const diagnostics = {
    role: session.user?.role ?? "",
    adapter: getAdapterSelection().kind,
    ...DOMAIN_STATUS,
  };
  return (
    <ErpPageContent
      key={`${area}/${page}`}
      locale={locale}
      module={match.module}
      page={match.page}
      diagnostics={diagnostics}
      screenView={resolveScreenView(area, page, (await searchParams)?.view)}
    />
  );
}
