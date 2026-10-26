import { notFound } from "next/navigation";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { erpModules } from "@/config/erp";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { pick } from "@/lib/i18n";
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; area: string }>;
}) {
  const locale = await resolveLocale(params);
  const { area } = await params;
  const areaModule = erpModules.find((item) => item.id === area);
  return { title: areaModule ? pick(areaModule.title, locale) : "BLACK X ERP" };
}
export default async function ErpModule({
  params,
}: {
  params: Promise<{ locale: string; area: string }>;
}) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  const { area } = await params;
  if (!erpModules.some((item) => item.id === area)) notFound();
  return <ErpDirectory key={area} locale={locale} moduleId={area} />;
}
