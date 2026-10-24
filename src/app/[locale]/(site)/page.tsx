import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { getService, services } from "@/content/services";
import { faqs, publishedProjects } from "@/content/publications";
import { siteHref } from "@/config/navigation";
import { ProjectCard } from "@/components/site/ProjectCard";
import { ServiceCard } from "@/components/site/ServiceCard";
import { Accordion } from "@/components/ui/Accordion";
import { Arrow, CtaBand, EmptyState, SectionHead } from "@/components/ui/Pieces";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return { title: dict.brand.full, description: dict.meta.siteDescription };
}

const TRUST_ICONS = ["◉", "▤", "⛨", "✓"];

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const h = dict.home;
  const featured = services.slice(0, 4);
  const materialsService = getService("materials-supply");
  const featuredProjects = publishedProjects.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-media" aria-hidden="true">
          <Image src="/images/hero-villa.jpg" alt="" fill priority sizes="100vw" />
        </div>
        <div className="container home-hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow">{h.eyebrow}</span>
            <h1 className="hero-title">
              <span className="hero-title-line">{h.titleA}</span>{" "}
              <span className="hero-title-line accent">{h.titleB}</span>
            </h1>
            <p className="hero-lead">{h.lead}</p>
            <div className="hero-actions">
              <Link href={siteHref(locale, "request")} className="btn btn-primary">
                {dict.common.requestInspection}
              </Link>
              <Link href={siteHref(locale, "services")} className="btn btn-outline">
                {dict.common.browseServices}
              </Link>
            </div>
          </div>
        </div>

        <div className="container">
          <ul className="hero-trust" aria-label={h.craftEyebrow}>
            {h.trust.map((item, i) => (
              <li className="trust-item" key={item.title}>
                <span className="t-icon" aria-hidden="true">
                  {TRUST_ICONS[i]}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <span>{item.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Services overview (dark) */}
      <section className="section section-dark">
        <div className="container">
          <SectionHead eyebrow={h.servicesEyebrow} title={h.servicesTitle} lead={h.servicesLead} />
          <div className="services-grid">
            {featured.map((service) => (
              <ServiceCard
                key={service.slug}
                locale={locale}
                service={service}
                detailsLabel={dict.common.viewDetails}
                variant="overlay"
              />
            ))}
          </div>
          <div style={{ marginBlockStart: 32 }}>
            <Link href={siteHref(locale, "services")} className="btn btn-outline-light">
              {dict.common.viewAllServices}
            </Link>
          </div>
        </div>
      </section>

      {/* Craftsmanship */}
      <section className="section home-craft">
        <div className="container split split-media-wide">
          <div className="split-copy">
            <span className="eyebrow">{h.craftEyebrow}</span>
            <h2>{h.craftTitle}</h2>
            <p>{h.craftText}</p>
            <ul className="check-list">
              {h.craftPoints.map((point) => (
                <li key={point}>
                  <span className="ck" aria-hidden="true">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
            <Link href={siteHref(locale, "about")} className="btn btn-dark">
              {dict.common.learnMore}
            </Link>
          </div>
          <div className="split-media">
            <Image
              src="/images/interior-living.jpg"
              alt={
                locale === "ar"
                  ? "تصميم داخلي توضيحي لغرفة معيشة"
                  : "Illustrative living room interior"
              }
              width={1408}
              height={768}
              sizes="(max-width: 900px) 100vw, 58vw"
              loading="lazy"
            />
          </div>
        </div>
      </section>

      {/* Materials */}
      <section className="section section-sand">
        <div className="container split flip">
          <div className="split-media">
            <Image
              src="/images/stone-detail.jpg"
              alt={
                locale === "ar"
                  ? "تفاصيل خامات حجر وخشب — صورة توضيحية"
                  : "Stone and wood material details — illustrative image"
              }
              width={1408}
              height={768}
              sizes="(max-width: 900px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
          <div className="split-copy">
            {materialsService ? (
              <span className="eyebrow">{pick(materialsService.title, locale)}</span>
            ) : null}
            <h2>{h.materialsTitle}</h2>
            <p>{h.materialsText}</p>
            <p style={{ fontSize: "0.9rem" }}>{dict.common.illustrativeNote}</p>
            <Link
              href={siteHref(locale, "services/materials-supply")}
              className="text-link"
              style={{ marginBlockStart: 8 }}
            >
              {dict.common.viewDetails}
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="section section-dark">
        <div className="container">
          <SectionHead eyebrow={h.processEyebrow} title={h.processTitle} lead={h.processLead} />
          <div className="process-grid">
            {h.steps.map((step, i) => (
              <div className="process-step" key={step.title}>
                <span className="step-no">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Projects (honest state) */}
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={h.projectsEyebrow} title={h.projectsTitle} lead={h.projectsLead} />
          {featuredProjects.length === 0 ? (
            <EmptyState
              icon="▦"
              title={dict.projects.emptyTitle}
              text={dict.projects.emptyText}
              actionLabel={dict.projects.emptyCta}
              actionHref={siteHref(locale, "request")}
            />
          ) : (
            <>
              <div className="services-grid cols-3">
                {featuredProjects.map((project) => (
                  <ProjectCard
                    key={project.slug}
                    locale={locale}
                    project={project}
                    detailsLabel={dict.common.viewDetails}
                  />
                ))}
              </div>
              <div style={{ marginBlockStart: 32 }}>
                <Link href={siteHref(locale, "projects")} className="btn btn-outline">
                  {dict.common.viewAllProjects}
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* FAQs */}
      <section
        className="section section-white"
        style={{ borderBlockStart: "1px solid var(--color-line)" }}
      >
        <div className="container" style={{ maxWidth: 920 }}>
          <SectionHead eyebrow={h.faqEyebrow} title={h.faqTitle} lead={h.faqLead} center />
          <Accordion
            items={faqs
              .slice(0, 4)
              .map((f) => ({ question: pick(f.q, locale), answer: pick(f.a, locale) }))}
          />
          <div style={{ textAlign: "center", marginBlockStart: 26 }}>
            <Link href={siteHref(locale, "faqs")} className="text-link">
              {dict.nav.faqs}
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-tight">
        <div className="container">
          <CtaBand locale={locale} dict={dict} />
        </div>
      </section>
    </>
  );
}
