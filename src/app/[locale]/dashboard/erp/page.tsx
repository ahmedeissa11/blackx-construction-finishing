import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
export default async function ErpIndex({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  return <ErpDirectory locale={locale} />;
}
