import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { IssuesPanel } from "@/components/portal/PortalPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.issues };
}

export default async function PortalIssues({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.issues}</h2>
      <IssuesPanel locale={locale} appDict={app} />
    </>
  );
}
