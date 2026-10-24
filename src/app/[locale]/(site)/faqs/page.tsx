import type { Metadata } from "next";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { faqs } from "@/content/publications";
import { PageHero } from "@/components/site/PageHero";
import { Accordion } from "@/components/ui/Accordion";
import { CtaBand } from "@/components/ui/Pieces";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getDictionary(locale).faqsPage.title };
}

export default async function FaqsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: dict.faqsPage.title }]}
        title={dict.faqsPage.title}
        lead={dict.faqsPage.lead}
        image="/images/interior-living.jpg"
      />
      <section className="section">
        <div className="container" style={{ maxWidth: 920 }}>
          <Accordion
            items={faqs.map((f) => ({ question: pick(f.q, locale), answer: pick(f.a, locale) }))}
          />
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
