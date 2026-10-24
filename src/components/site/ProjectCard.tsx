import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { PublishedProject } from "@/content/publications";
import { siteHref } from "@/config/navigation";
import { Arrow } from "@/components/ui/Pieces";

export function ProjectCard({
  locale,
  project,
  detailsLabel,
}: {
  locale: Locale;
  project: PublishedProject;
  detailsLabel: string;
}) {
  return (
    <Link href={siteHref(locale, `projects/${project.slug}`)} className="service-card">
      <span className="sc-media">
        <Image
          src={project.image}
          alt={pick(project.title, locale)}
          width={720}
          height={540}
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 33vw"
          loading="lazy"
        />
      </span>
      <span className="sc-body">
        <h3>{pick(project.title, locale)}</h3>
        <p>{pick(project.description, locale)}</p>
        <span className="sc-link">
          {detailsLabel}
          <Arrow />
        </span>
      </span>
    </Link>
  );
}
