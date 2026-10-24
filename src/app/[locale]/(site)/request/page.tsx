import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { getService } from "@/content/services";
import { PageHero } from "@/components/site/PageHero";
import { RequestForm } from "@/components/site/RequestForm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getDictionary(locale).request.title };
}

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ service?: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const { service } = await searchParams;
  const preselected = service && getService(service) ? service : "";

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: dict.request.title }]}
        title={dict.request.title}
        lead={dict.request.lead}
        image="/images/facade-detail.jpg"
      />
      <section className="section">
        <div className="container form-layout">
          <div>
            <h2 style={{ fontSize: "1.5rem", marginBlockEnd: 10 }}>{dict.request.stepsTitle}</h2>
            <ol className="steps-mini" style={{ padding: 0, listStyle: "none" }}>
              {dict.request.steps.map((step, i) => (
                <li key={step.title}>
                  <span className="sm-no">{i + 1}</span>
                  <div>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="alert alert-warning" style={{ marginBlockStart: 26 }}>
              <span aria-hidden="true">⚠</span>
              <p>{dict.request.previewNote}</p>
            </div>
          </div>
          <RequestForm locale={locale} dict={dict} preselectedService={preselected} />
        </div>
      </section>
    </>
  );
}
