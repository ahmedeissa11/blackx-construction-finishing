import type { Metadata } from "next";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewPortalClient } from "@/content/preview-data";
import { getPortalHandover, getPortalWarranty } from "@/lib/preview-expansion";
import { formatDate } from "@/lib/format";
import { UnavailableActionButton } from "@/components/portal/PortalPanels";
import { portalHref } from "@/config/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.handover };
}

const EXPECTED_CHECKLIST = {
  ar: [
    "مراجعة بنود التشطيب المنفذة مقابل نطاق العمل المعتمد",
    "فحص تشغيل نقاط المياه والصرف والكهرباء المرتبطة بالأعمال",
    "تسجيل أي ملاحظات بقائمة التحفظات واتفاق على مواعيد معالجتها",
    "استلام مستندات الاعتمادات والتقارير الخاصة بالمشروع",
    "توضيح قنوات طلبات الصيانة بعد التسليم",
  ],
  en: [
    "Review executed finishing items against the approved scope",
    "Test water, drainage and electrical points tied to the works",
    "Record any snags and agree correction timelines",
    "Receive approval records and project reports",
    "Clarify post-handover maintenance request channels",
  ],
};

export default async function PortalHandover({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  const life = app.dashboard.expansion.lifecycle;
  const handovers = getPortalHandover(previewPortalClient.id);
  const warrantyItems = getPortalWarranty(previewPortalClient.id);
  const muted = { color: "var(--color-muted)" } as const;

  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.handover}</h2>
      <div className="two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel" aria-label={app.portal.nav.handover}>
          <div className="panel-head">
            <h2>{life.checklistTitle}</h2>
          </div>
          <div className="panel-body">
            {handovers.length === 0 ? (
              <>
                <ul className="check-list">
                  {EXPECTED_CHECKLIST[locale].map((label) => (
                    <li key={label}>
                      <span className="ck" aria-hidden="true">
                        •
                      </span>
                      <span>{label}</span>
                    </li>
                  ))}
                </ul>
                <p style={{ ...muted, fontSize: "0.9rem" }}>
                  {locale === "ar"
                    ? "مشروعك الحالي لم يصل إلى مرحلة التسليم بعد — تعرض القائمة خطوات الاستلام المتوقعة عند اكتمال الأعمال."
                    : "Your current project has not reached handover yet — this list shows the expected sign-off steps when the works are complete."}
                </p>
              </>
            ) : (
              handovers.map((handover) => (
                <div key={handover.ref}>
                  <p>
                    <span dir="ltr">{handover.ref}</span> ·{" "}
                    {handover.actualDate
                      ? `${life.actualDate}: ${formatDate(handover.actualDate, locale)}`
                      : `${life.plannedDate}: ${formatDate(handover.plannedDate, locale)}`}
                  </p>
                  <ul className="check-list">
                    {handover.checklist.map((item) => (
                      <li key={pick(item.label, locale)}>
                        <span className="ck" aria-hidden="true">
                          {item.state === "done" ? "✓" : "•"}
                        </span>
                        <span>
                          {pick(item.label, locale)} —{" "}
                          {item.state === "done" ? life.checklistDone : life.checklistPending}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p style={{ ...muted, fontSize: "0.9rem" }}>
                    {life.snagsTitle}: {pick(handover.snagsNote, locale)}
                  </p>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="panel" aria-label={app.dashboard.modules.warranty}>
          <div className="panel-head">
            <h2>{app.dashboard.modules.warranty}</h2>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {warrantyItems.length === 0 ? (
              <p style={muted}>
                {locale === "ar"
                  ? "بعد التسليم، تُسجَّل طلبات الصيانة والضمان هنا وتُتابع حالتها. لا توجد طلبات مفتوحة مرتبطة بمشروعك حاليًا."
                  : "After handover, warranty and maintenance tickets are recorded and tracked here. No open tickets are linked to your project right now."}
              </p>
            ) : (
              warrantyItems.map((item) => (
                <div key={item.ref}>
                  <p>
                    <span dir="ltr">{item.ref}</span> ·{" "}
                    {life.warrantySources[item.source] ?? item.source} ·{" "}
                    {formatDate(item.openedAt, locale)}
                  </p>
                  <p>{pick(item.summary, locale)}</p>
                  {item.nextVisit ? (
                    <p style={muted}>
                      {life.nextVisit}: {formatDate(item.nextVisit, locale)}
                    </p>
                  ) : null}
                  {item.visits.map((visit) => (
                    <p key={visit.date} style={muted}>
                      {formatDate(visit.date, locale)} — {life.findings}:{" "}
                      {pick(visit.findings, locale)} · {life.actionTaken}:{" "}
                      {pick(visit.actionTaken, locale)}
                    </p>
                  ))}
                </div>
              ))
            )}
            <p style={{ ...muted, fontSize: "0.9rem" }}>{life.policyNote}</p>
            <p style={{ ...muted, fontSize: "0.9rem" }}>
              {locale === "ar" ? (
                <>
                  ملاحظات الجودة أثناء التنفيذ تُتابع من{" "}
                  <Link href={portalHref(locale, "issues")} className="text-link">
                    صفحة المشكلات
                  </Link>
                  ، والشكاوى والاقتراحات العامة من{" "}
                  <Link href={portalHref(locale, "complaints")} className="text-link">
                    صفحة الشكاوى والاقتراحات
                  </Link>
                  .
                </>
              ) : (
                <>
                  Quality notes during execution are tracked on the{" "}
                  <Link href={portalHref(locale, "issues")} className="text-link">
                    issues page
                  </Link>
                  , and general complaints and suggestions on the{" "}
                  <Link href={portalHref(locale, "complaints")} className="text-link">
                    complaints and suggestions page
                  </Link>
                  .
                </>
              )}
            </p>
            <div>
              <UnavailableActionButton
                locale={locale}
                appDict={app}
                label={locale === "ar" ? "فتح طلب صيانة" : "Open maintenance ticket"}
                primary
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
