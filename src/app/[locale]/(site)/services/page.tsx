import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { localizedAlternates } from "@/lib/site-url";
import { getDictionary } from "@/content/dictionary";
import { services } from "@/content/services";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Arrow, CtaBand } from "@/components/ui/Pieces";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getDictionary(locale).services.title,
    alternates: localizedAlternates(locale, "services"),
  };
}

export default async function ServicesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: dict.services.title }]}
        title={dict.services.title}
        lead={dict.services.lead}
        image="/images/interior-living.jpg"
      />
      <section className="section">
        <div className="container">
          <div className="service-rows">
            {services.map((service) => (
              <article className="service-row" key={service.slug}>
                <div className="sr-media">
                  <Image
                    src={service.image}
                    alt={pick(service.title, locale)}
                    width={680}
                    height={460}
                    sizes="(max-width: 800px) 100vw, 340px"
                    loading="lazy"
                  />
                </div>
                <div className="sr-body">
                  <h2>{pick(service.title, locale)}</h2>
                  <p>{pick(service.summary, locale)}</p>
                  <ul className="scope-tags" aria-label={dict.services.scopeTitle}>
                    {service.scope[locale].map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                  <div>
                    <Link href={siteHref(locale, `services/${service.slug}`)} className="text-link">
                      {dict.common.viewDetails}
                      <Arrow />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <p style={{ color: "var(--color-muted)", fontSize: "0.9rem", marginBlockStart: 22 }}>
            {dict.common.illustrativeNote} {dict.common.scopeNote}
          </p>
        </div>
      </section>
      <section className="section-tight">
        <div className="container">
          <CtaBand locale={locale} dict={dict} />
        </div>
      </section>
    </>
  );
}
