import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { ProfilePanel } from "@/components/portal/PortalPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.profile };
}

export default async function PortalProfile({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.profile}</h2>
      <div style={{ maxWidth: 760 }}>
        <ProfilePanel locale={locale} appDict={app} />
      </div>
    </>
  );
}
