import type { Metadata } from "next";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary, statusBadgeClass } from "@/content/app-dictionary";
import { previewPortalReports } from "@/content/preview-modules";
import { formatDate } from "@/lib/format";
import { UnavailableActionButton } from "@/components/portal/PortalPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.reports };
}

export default async function PortalReports({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.reports}</h2>
      <div className="panel">
        <div className="list-rows">
          {previewPortalReports.map((report) => (
            <div className="list-row" key={report.id}>
              <span className="file-icon" aria-hidden="true">
                ▥
              </span>
              <div className="lr-main">
                <div className="lr-title">{pick(report.title, locale)}</div>
                <div className="lr-sub">
                  <span dir="ltr">{report.week}</span> · {formatDate(report.date, locale)}
                </div>
              </div>
              <span className={statusBadgeClass(report.status)}>{app.status[report.status]}</span>
              <UnavailableActionButton
                locale={locale}
                appDict={app}
                label={app.portal.downloadPreview}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
