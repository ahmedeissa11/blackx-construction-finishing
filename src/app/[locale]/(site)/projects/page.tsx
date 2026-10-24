import type { Metadata } from "next";
import { resolveLocale } from "@/lib/locale-params";
import { localizedAlternates } from "@/lib/site-url";
import { getDictionary } from "@/content/dictionary";
import { publishedProjects } from "@/content/publications";
import { siteHref } from "@/config/navigation";
import { PageHero } from "@/components/site/PageHero";
import { ProjectCard } from "@/components/site/ProjectCard";
import { EmptyState } from "@/components/ui/Pieces";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return {
    title: getDictionary(locale).projects.title,
    alternates: localizedAlternates(locale, "projects"),
  };
}

export default async function ProjectsPage({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);

  return (
    <>
      <PageHero
        locale={locale}
        homeLabel={dict.common.home}
        crumbs={[{ label: dict.projects.title }]}
        title={dict.projects.title}
        lead={dict.projects.lead}
        image="/images/hero-villa.jpg"
      />
      <section className="section">
        <div className="container">
          {publishedProjects.length === 0 ? (
            <EmptyState
              icon="▦"
              title={dict.projects.emptyTitle}
              text={dict.projects.emptyText}
              actionLabel={dict.projects.emptyCta}
              actionHref={siteHref(locale, "request")}
            />
          ) : (
            <div className="services-grid cols-3">
              {publishedProjects.map((project) => (
                <ProjectCard
                  key={project.slug}
                  locale={locale}
                  project={project}
                  detailsLabel={dict.common.viewDetails}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
