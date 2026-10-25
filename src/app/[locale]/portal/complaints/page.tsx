import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { PortalComplaintsPanel } from "@/components/portal/PortalExpansionPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.complaints };
}

export default async function PortalComplaints({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.complaints.title}</h2>
      <PortalComplaintsPanel locale={locale} appDict={app} />
    </>
  );
}
