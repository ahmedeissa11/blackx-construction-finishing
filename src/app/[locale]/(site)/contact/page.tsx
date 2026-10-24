import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { resolveLocale } from "@/lib/locale-params";
import { localizedAlternates } from "@/lib/site-url";
import { getDictionary } from "@/content/dictionary";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { ContactForm } from "@/components/site/ContactForm";
import { SectionHead } from "@/components/ui/Pieces";
import { GlyphIcon } from "@/components/ui/GlyphIcon";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getDictionary(locale).contact.title,
    alternates: localizedAlternates(locale, "contact"),
  };
}

const CARD_ICONS = ["◎", "✉", "▥"];

export default async function ContactPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const c = dict.contact;

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: c.title }]}
        title={c.title}
        lead={c.lead}
        image="/images/hero-villa.jpg"
      />
      <section className="section">
        <div className="container">
          <SectionHead eyebrow={c.title} title={c.infoTitle} lead={c.verifiedNote} />
          <div className="info-cards" style={{ marginBlockEnd: 48 }}>
            {c.infoCards.map((card, i) => (
              <article className="info-card" key={card.title}>
                <span className="t-icon" aria-hidden="true">
                  <GlyphIcon icon={CARD_ICONS[i] ?? "▦"} />
                </span>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
          <div className="form-layout">
            <div>
              <div className="split-media">
                <Image
                  src="/images/facade-detail.jpg"
                  alt={
                    locale === "ar"
                      ? "تفاصيل واجهة سكنية توضيحية"
                      : "Illustrative residential facade detail"
                  }
                  width={860}
                  height={640}
                  sizes="(max-width: 960px) 100vw, 40vw"
                  loading="lazy"
                />
              </div>
              <div style={{ marginBlockStart: 22 }}>
                <Link href={siteHref(locale, "request")} className="btn btn-dark">
                  {dict.common.requestInspection}
                </Link>
              </div>
            </div>
            <ContactForm dict={dict} />
          </div>
        </div>
      </section>
    </>
  );
}
