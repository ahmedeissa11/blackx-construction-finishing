import type { Metadata } from "next";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewPortalClient } from "@/content/preview-data";
import { getPortalDocuments, groupDocumentCatalog } from "@/lib/preview-expansion";
import { formatDate, formatNumber } from "@/lib/format";
import { UnavailableActionButton } from "@/components/portal/PortalPanels";

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
  const x = app.dashboard.expansion;
  const documents = getPortalDocuments(previewPortalClient.id);
  const groups = groupDocumentCatalog(documents);

  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.documents}</h2>
      <p style={{ color: "var(--color-muted)", maxWidth: 900 }}>
        {locale === "ar"
          ? "مستندات مشروعك مصنفة بحسب نوعها. تظهر هنا البيانات الوصفية للملفات المسجلة؛ تنزيل الملفات غير متاح حاليًا. الفواتير والمستخلصات والإيصالات تظهر في قسم المالية."
          : "Your project documents grouped by type. Recorded file metadata appears here; file download is unavailable at the moment. Invoices, payment certificates and receipts appear in the finance section."}
      </p>
      {groups.length === 0 ? (
        <p>{x.documentsWorkspace.emptyGroup}</p>
      ) : (
        groups.map((group) => (
          <section
            key={group.category}
            className="panel"
            aria-label={x.documentCategories[group.category] ?? group.category}
          >
            <div className="panel-head">
              <h2>
                {x.documentCategories[group.category] ?? group.category} ·{" "}
                {formatNumber(group.items.length, locale)} {x.documentsWorkspace.groupCountSuffix}
              </h2>
            </div>
            <div className="list-rows">
              {group.items.map((doc) => (
                <div className="list-row" key={doc.id}>
                  <span className="file-icon" aria-hidden="true">
                    🗀
                  </span>
                  <div className="lr-main">
                    <div className="lr-title">{pick(doc.title, locale)}</div>
                    <div className="lr-sub">
                      <span dir="ltr">{doc.reference}</span>
                      {doc.format ? (
                        <>
                          {" · "}
                          <span dir="ltr">{doc.format}</span>
                        </>
                      ) : null}
                      {doc.updatedAt ? ` · ${formatDate(doc.updatedAt, locale)}` : null}
                    </div>
                  </div>
                  <UnavailableActionButton
                    locale={locale}
                    appDict={app}
                    label={app.portal.downloadPreview}
                  />
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </>
  );
}
