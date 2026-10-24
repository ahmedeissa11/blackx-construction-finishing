import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { getProject, publishedProjects } from "@/content/publications";
import { getService } from "@/content/services";
import { formatDate } from "@/lib/format";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { Arrow } from "@/components/ui/Pieces";

/**
 * Project detail template. Renders only for company-approved published
 * projects; with none approved yet, every slug returns a proper 404
 * instead of fabricating project details.
 */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    publishedProjects.map((project) => ({ locale, slug: project.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const project = getProject(slug);
  if (!project) notFound();
  return { title: pick(project.title, locale), description: pick(project.description, locale) };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  const project = getProject(slug);
  if (!project) notFound();

  const related = publishedProjects.filter((p) => p.slug !== slug).slice(0, 3);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[
          { label: dict.projects.title, href: siteHref(locale, "projects") },
          { label: pick(project.title, locale) },
        ]}
        title={pick(project.title, locale)}
        lead={pick(project.description, locale)}
        image={project.image}
      />
      <section className="section">
        <div className="container detail-layout">
          <div>
            <div className="detail-media">
              <Image
                src={project.image}
                alt={pick(project.title, locale)}
                width={1280}
                height={720}
                priority
              />
            </div>
            <h2 style={{ fontSize: "1.35rem", marginBlockEnd: 14 }}>{dict.projects.scopeTitle}</h2>
            <ul className="check-list" style={{ marginBlockEnd: 36 }}>
              {project.scope[locale].map((item) => (
                <li key={item}>
                  <span className="ck" aria-hidden="true">
                    ✓
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            {project.gallery.length > 0 ? (
              <>
                <h2 style={{ fontSize: "1.35rem", marginBlockEnd: 16 }}>
                  {dict.projects.galleryTitle}
                </h2>
                <div className="gallery">
                  {project.gallery.map((src, i) => (
                    <figure key={`${src}-${i}`}>
                      <Image
                        src={src}
                        alt={`${pick(project.title, locale)} — ${i + 1}`}
                        width={640}
                        height={480}
                        loading="lazy"
                      />
                    </figure>
                  ))}
                </div>
              </>
            ) : null}
            {related.length > 0 ? (
              <div style={{ marginBlockStart: 44 }}>
                <h2 style={{ fontSize: "1.35rem", marginBlockEnd: 16 }}>{dict.projects.title}</h2>
                <ul style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {related.map((p) => (
                    <li key={p.slug}>
                      <Link className="text-link" href={siteHref(locale, `projects/${p.slug}`)}>
                        {pick(p.title, locale)}
                        <Arrow />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <aside>
            <div
              className="side-card"
              style={{
                background: "var(--color-white)",
                color: "var(--color-ink)",
                border: "1px solid var(--color-line)",
              }}
            >
              <h2 style={{ color: "var(--color-charcoal)" }}>{dict.projects.metaTitle}</h2>
              <dl className="kv-grid" style={{ gridTemplateColumns: "1fr" }}>
                {project.location ? (
                  <div className="kv">
                    <dt>{dict.request.fields.city}</dt>
                    <dd>{pick(project.location, locale)}</dd>
                  </div>
                ) : null}
                {project.completedAt ? (
                  <div className="kv">
                    <dt>{locale === "ar" ? "تاريخ الإنجاز" : "Completed"}</dt>
                    <dd>{formatDate(project.completedAt, locale)}</dd>
                  </div>
                ) : null}
                <div className="kv">
                  <dt>{dict.services.title}</dt>
                  <dd>
                    {project.serviceSlugs
                      .map((s) => {
                        const svc = getService(s);
                        return svc ? pick(svc.title, locale) : s;
                      })
                      .join(" · ")}
                  </dd>
                </div>
              </dl>
              <Link
                href={siteHref(locale, "request")}
                className="btn btn-primary btn-block"
                style={{ marginBlockStart: 22 }}
              >
                {dict.common.requestInspection}
              </Link>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
