import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { articles, publishedArticles } from "@/content/publications";
import { formatNumber } from "@/lib/format";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Arrow, EmptyState, PreviewTag } from "@/components/ui/Pieces";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getDictionary(locale).articles.title,
    robots: publishedArticles.length === 0 ? { index: false, follow: true } : undefined,
  };
}

export default async function ArticlesPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const hasPreviewArticles = articles.some((article) => article.preview);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: dict.articles.title }]}
        title={dict.articles.title}
        lead={dict.articles.lead}
        image="/images/staircase.jpg"
      />
      <section className="section">
        <div className="container">
          {articles.length === 0 ? (
            <EmptyState icon="▤" title={dict.articles.emptyTitle} text={dict.articles.emptyText} />
          ) : (
            <>
              {hasPreviewArticles ? (
                <div className="alert alert-warning" style={{ marginBlockEnd: 26 }}>
                  <span aria-hidden="true">◐</span>
                  <p>
                    {locale === "ar"
                      ? "المقالات المميزة بوسم «محتوى توضيحي للمعاينة» موجودة لمراجعة تصميم صفحة المقالات فقط، وسيتم استبدالها بمحتوى معتمد رسميًا قبل الإطلاق."
                      : "Articles marked as illustrative preview content exist only for reviewing the article design and will be replaced with officially approved content before launch."}
                  </p>
                </div>
              ) : null}
              <div className="articles-grid">
                {articles.map((article) => (
                  <Link
                    key={article.slug}
                    href={siteHref(locale, `articles/${article.slug}`)}
                    className="article-card"
                  >
                    <span className="ac-media">
                      <Image
                        src={article.image}
                        alt={pick(article.title, locale)}
                        width={720}
                        height={450}
                        sizes="(max-width: 620px) 100vw, 33vw"
                        loading="lazy"
                      />
                    </span>
                    <span className="ac-body">
                      <span className="ac-meta">
                        {article.preview ? <PreviewTag label={dict.common.previewContent} /> : null}
                        <span>
                          {formatNumber(article.readingMinutes, locale)} {dict.common.minRead}
                        </span>
                      </span>
                      <h3>{pick(article.title, locale)}</h3>
                      <p>{pick(article.excerpt, locale)}</p>
                      <span className="sc-link text-link">
                        {dict.common.readMore}
                        <Arrow />
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
