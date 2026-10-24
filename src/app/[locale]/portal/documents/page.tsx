import type { Metadata } from "next";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewPortalDocuments } from "@/content/preview-modules";
import { formatDate } from "@/lib/format";
import { DemoActionButton } from "@/components/portal/PortalPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.documents };
}

export default async function PortalDocuments({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.documents}</h2>
      <div className="panel">
        <div className="list-rows">
          {previewPortalDocuments.map((doc) => (
            <div className="list-row" key={doc.id}>
              <span className="file-icon" aria-hidden="true">
                🗀
              </span>
              <div className="lr-main">
                <div className="lr-title">{pick(doc.title, locale)}</div>
                <div className="lr-sub">
                  <span dir="ltr">
                    {doc.type} · {doc.meta}
                  </span>{" "}
                  · {formatDate(doc.date, locale)}
                </div>
              </div>
              <DemoActionButton locale={locale} appDict={app} label={app.portal.downloadPreview} />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
