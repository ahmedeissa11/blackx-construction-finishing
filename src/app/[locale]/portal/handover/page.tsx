import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { DemoActionButton } from "@/components/portal/PortalPanels";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.handover };
}

const CHECKLIST = {
  ar: [
    { label: "مراجعة بنود التشطيب المنفذة مقابل نطاق العمل المعتمد", done: false },
    { label: "فحص تشغيل نقاط المياه والصرف والكهرباء المرتبطة بالأعمال", done: false },
    { label: "تسجيل أي ملاحظات بقائمة التحفظات واتفاق على مواعيد معالجتها", done: false },
    { label: "استلام مستندات الاعتمادات والتقارير الخاصة بالمشروع", done: false },
    { label: "توضيح قنوات طلبات الصيانة بعد التسليم", done: false },
  ],
  en: [
    { label: "Review executed finishing items against the approved scope", done: false },
    { label: "Test water, drainage and electrical points tied to the works", done: false },
    { label: "Record any snags and agree correction timelines", done: false },
    { label: "Receive approval records and project reports", done: false },
    { label: "Clarify post-handover maintenance request channels", done: false },
  ],
};

export default async function PortalHandover({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);

  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.handover}</h2>
      <div className="two-col" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel" aria-label={app.portal.nav.handover}>
          <div className="panel-head">
            <h2>
              {locale === "ar" ? "قائمة مراجعة التسليم (معاينة)" : "Handover checklist (preview)"}
            </h2>
          </div>
          <div className="panel-body">
            <ul className="check-list">
              {CHECKLIST[locale].map((item) => (
                <li key={item.label}>
                  <span className="ck" aria-hidden="true">
                    •
                  </span>
                  <span>{item.label}</span>
                </li>
              ))}
            </ul>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
              {locale === "ar"
                ? "مشروعك الحالي لم يصل لمرحلة التسليم بعد في بيانات المعاينة — القائمة للاطلاع على خطوات الاستلام المتوقعة."
                : "Your current preview project has not reached handover yet — this list shows the expected sign-off steps."}
            </p>
          </div>
        </section>
        <section className="panel" aria-label={app.dashboard.modules.warranty}>
          <div className="panel-head">
            <h2>{app.dashboard.modules.warranty}</h2>
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ color: "var(--color-muted)" }}>
              {locale === "ar"
                ? "بعد التسليم، تُسجَّل طلبات الصيانة والضمان هنا وتُتابع حالتها. لا توجد طلبات مفتوحة عليك في بيانات المعاينة حاليًا."
                : "After handover, warranty and maintenance tickets are recorded and tracked here. You have no open tickets in the preview data."}
            </p>
            <div>
              <DemoActionButton
                locale={locale}
                appDict={app}
                label={
                  locale === "ar" ? "فتح طلب صيانة (معاينة)" : "Open maintenance ticket (preview)"
                }
                primary
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
