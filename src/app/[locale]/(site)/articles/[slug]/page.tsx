import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pick, locales } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { articles, getArticle } from "@/content/publications";
import { getService } from "@/content/services";
import { formatNumber } from "@/lib/format";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Arrow, CtaBand, PreviewTag } from "@/components/ui/Pieces";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => articles.map((a) => ({ locale, slug: a.slug })));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const article = getArticle(slug);
  if (!article) notFound();
  return {
    title: pick(article.title, locale),
    description: pick(article.excerpt, locale),
    robots: article.preview ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const article = getArticle(slug);
  if (!article) notFound();

  const related = articles.filter((a) => a.slug !== slug);
  const relatedServices = article.relatedServiceSlugs
    .map((s) => getService(s))
    .filter((s): s is NonNullable<typeof s> => Boolean(s));

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[
          { label: dict.articles.title, href: siteHref(locale, "articles") },
          { label: pick(article.title, locale) },
        ]}
        title={pick(article.title, locale)}
        lead={pick(article.excerpt, locale)}
        image={article.image}
      />
      <section className="section">
        <div className="container">
          <div
            style={{
              display: "flex",
              gap: 14,
              alignItems: "center",
              flexWrap: "wrap",
              marginBlockEnd: 28,
            }}
          >
            {article.preview ? <PreviewTag label={dict.common.previewContent} /> : null}
            <span style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
              {formatNumber(article.readingMinutes, locale)} {dict.common.minRead}
            </span>
          </div>
          <div className="detail-media" style={{ maxWidth: 920 }}>
            <Image
              src={article.image}
              alt={pick(article.title, locale)}
              width={1280}
              height={720}
              priority
              sizes="(max-width: 920px) 100vw, 920px"
            />
          </div>
          <article className="prose">
            {article.body[locale].map((block, i) => (
              <div key={i}>
                {block.heading ? <h2>{block.heading}</h2> : null}
                {block.paragraphs.map((p) => (
                  <p key={p.slice(0, 32)}>{p}</p>
                ))}
                {block.bullets ? (
                  <ul>
                    {block.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </article>

          {relatedServices.length > 0 ? (
            <div style={{ marginBlockStart: 44, maxWidth: "72ch" }}>
              <h2 style={{ fontSize: "1.25rem", marginBlockEnd: 14 }}>
                {dict.common.relatedServices}
              </h2>
              <ul style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {relatedServices.map((s) => (
                  <li key={s.slug}>
                    <Link
                      href={siteHref(locale, `services/${s.slug}`)}
                      className="btn btn-outline btn-sm"
                    >
                      {pick(s.title, locale)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {related.length > 0 ? (
            <div style={{ marginBlockStart: 40, maxWidth: "72ch" }}>
              <h2 style={{ fontSize: "1.25rem", marginBlockEnd: 14 }}>
                {dict.common.relatedArticles}
              </h2>
              <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {related.map((a) => (
                  <li key={a.slug}>
                    <Link className="text-link" href={siteHref(locale, `articles/${a.slug}`)}>
                      {pick(a.title, locale)}
                      <Arrow />
                      {a.preview ? <PreviewTag label={dict.common.previewContent} /> : null}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
