import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary, statusBadgeClass } from "@/content/app-dictionary";
import { previewPortalProjects } from "@/content/preview-data";
import { formatPercent } from "@/lib/format";
import { portalHref } from "@/config/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.myProjects };
}

export default async function PortalProjects({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  const mine = previewPortalProjects;

  return (
    <>
      <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.myProjects}</h2>
      <div
        className="services-grid cols-3"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
      >
        {mine.map((project) => (
          <Link
            key={project.id}
            href={portalHref(locale, `projects/${project.id}`)}
            className="service-card"
          >
            <span className="sc-media">
              <Image
                src={project.image}
                alt={pick(project.title, locale)}
                width={720}
                height={540}
                loading="lazy"
              />
            </span>
            <span className="sc-body">
              <span
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <h3>{pick(project.title, locale)}</h3>
                <span className={statusBadgeClass(project.status)}>
                  {app.status[project.status]}
                </span>
              </span>
              <span className="progress-row">
                <span
                  className="progress"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <span style={{ width: `${project.progress}%` }} />
                </span>
                <strong>{formatPercent(project.progress, locale)}</strong>
              </span>
              <p>{pick(project.currentMilestone, locale)}</p>
            </span>
          </Link>
        ))}
      </div>
    </>
  );
}
