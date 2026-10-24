import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pick, locales } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { localizedAlternates } from "@/lib/site-url";
import { getDictionary } from "@/content/dictionary";
import { getService, services } from "@/content/services";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { ServiceCard } from "@/components/site/ServiceCard";
import { Accordion } from "@/components/ui/Accordion";
import { SectionHead } from "@/components/ui/Pieces";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => services.map((s) => ({ locale, slug: s.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const service = getService(slug);
  if (!service) notFound();
  return {
    title: pick(service.title, locale),
    description: pick(service.summary, locale),
    alternates: localizedAlternates(locale, `services/${slug}`),
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const service = getService(slug);
  if (!service) notFound();

  const related = services.filter((s) => s.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[
          { label: dict.services.title, href: siteHref(locale, "services") },
          { label: pick(service.title, locale) },
        ]}
        title={pick(service.title, locale)}
        lead={pick(service.summary, locale)}
        image={service.image}
      />

      <section className="section">
        <div className="container detail-layout">
          <div>
            <h2 className="section-title" style={{ fontSize: "1.6rem" }}>
              {dict.services.detailIntro}
            </h2>
            <p style={{ color: "var(--color-muted)", marginBlock: "12px 28px", maxWidth: "68ch" }}>
              {pick(service.intro, locale)}
            </p>

            <h3 style={{ fontSize: "1.2rem", marginBlockEnd: 14 }}>{dict.services.scopeTitle}</h3>
            <ul className="scope-tags" style={{ marginBlockEnd: 30 }}>
              {service.scope[locale].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <div className="inc-grid" style={{ marginBlockEnd: 36 }}>
              <div className="inc-card">
                <h3>{dict.services.includesTitle}</h3>
                <ul>
                  {service.includes[locale].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="inc-card">
                <h3>{dict.services.excludesTitle}</h3>
                <ul>
                  {service.excludes[locale].map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginBlockEnd: 36 }}>
              {dict.common.scopeNote}
            </p>

            <h3 style={{ fontSize: "1.2rem", marginBlockEnd: 16 }}>{dict.services.processTitle}</h3>
            <ol
              className="steps-mini"
              style={{ marginBlockEnd: 40, padding: 0, listStyle: "none" }}
            >
              {service.steps[locale].map((step, i) => (
                <li key={step}>
                  <span className="sm-no">{i + 1}</span>
                  <h3 style={{ margin: 0, alignSelf: "center" }}>{step}</h3>
                </li>
              ))}
            </ol>

            <h3 style={{ fontSize: "1.2rem", marginBlockEnd: 16 }}>{dict.services.galleryTitle}</h3>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginBlockEnd: 16 }}>
              {dict.common.illustrativeNote}
            </p>
            <div className="gallery" style={{ marginBlockEnd: 40 }}>
              {service.gallery.map((src, i) => (
                <figure key={`${src}-${i}`}>
                  <Image
                    src={src}
                    alt={`${pick(service.title, locale)} — ${i + 1}`}
                    width={640}
                    height={480}
                    sizes="(max-width: 800px) 50vw, 30vw"
                    loading="lazy"
                  />
                </figure>
              ))}
            </div>

            <h3 style={{ fontSize: "1.2rem", marginBlockEnd: 16 }}>{dict.services.faqTitle}</h3>
            <Accordion
              items={service.faqs.map((f) => ({
                question: pick(f.q, locale),
                answer: pick(f.a, locale),
              }))}
            />
          </div>

          <aside>
            <div className="side-card">
              <h2>{dict.services.sideTitle}</h2>
              <p>{dict.services.sideText}</p>
              <Link
                href={`${siteHref(locale, "request")}?service=${service.slug}`}
                className="btn btn-primary btn-block"
              >
                {dict.common.requestInspection}
              </Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <SectionHead eyebrow={dict.services.title} title={dict.common.relatedServices} />
          <div className="services-grid cols-3">
            {related.map((s) => (
              <ServiceCard
                key={s.slug}
                locale={locale}
                service={s}
                detailsLabel={dict.common.viewDetails}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
