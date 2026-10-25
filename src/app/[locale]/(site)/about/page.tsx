import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLocale } from "@/lib/locale-params";
import { localizedAlternates } from "@/lib/site-url";
import { getDictionary } from "@/content/dictionary";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { CtaBand, SectionHead } from "@/components/ui/Pieces";
import { GlyphIcon } from "@/components/ui/GlyphIcon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getDictionary(locale).about.title,
    alternates: localizedAlternates(locale, "about"),
  };
}

const VALUE_ICONS = ["▤", "✓", "⌂"];

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const a = dict.about;

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: a.title }]}
        title={a.title}
        lead={a.lead}
        image="/images/staircase.jpg"
      />

      <section className="section">
        <div className="container split">
          <div className="split-media">
            <Image
              src="/images/bedroom.jpg"
              alt={
                locale === "ar" ? "تصميم داخلي توضيحي لغرفة نوم" : "Illustrative bedroom interior"
              }
              width={960}
              height={720}
              sizes="(max-width: 900px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
          <div className="split-copy">
            <h2>{a.introTitle}</h2>
            {a.intro.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
            <Link
              href={siteHref(locale, "services")}
              className="btn btn-dark"
              style={{ marginBlockStart: 8 }}
            >
              {dict.common.browseServices}
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-sand">
        <div className="container">
          <SectionHead eyebrow={dict.brand.full} title={a.valuesTitle} />
          <div className="values-grid">
            {a.values.map((value, i) => (
              <article className="value-card" key={value.title}>
                <h3>
                  <span
                    className="ck"
                    aria-hidden="true"
                    style={{ width: 34, height: 34, margin: 0 }}
                  >
                    <GlyphIcon icon={VALUE_ICONS[i] ?? "▦"} />
                  </span>
                  {value.title}
                </h3>
                <p>{value.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container split flip">
          <div className="split-media">
            <Image
              src="/images/stone-detail.jpg"
              alt={locale === "ar" ? "خامات تشطيب توضيحية" : "Illustrative finishing materials"}
              width={960}
              height={720}
              sizes="(max-width: 900px) 100vw, 50vw"
              loading="lazy"
            />
          </div>
          <div className="split-copy">
            <h2>{a.qualityTitle}</h2>
            <p>{a.qualityText}</p>
            <ul className="check-list">
              {a.qualityPoints.map((point) => (
                <li key={point}>
                  <span className="ck" aria-hidden="true">
                    ✓
                  </span>
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section
        className="section section-white"
        style={{ borderBlockStart: "1px solid var(--color-line)" }}
      >
        <div className="container">
          <SectionHead
            eyebrow={dict.home.processEyebrow}
            title={a.workflowTitle}
            lead={dict.home.processLead}
          />
          <div className="process-grid light">
            {dict.home.steps.map((step, i) => (
              <div className="process-step" key={step.title}>
                <span className="step-no">0{i + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </div>
            ))}
          </div>
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
