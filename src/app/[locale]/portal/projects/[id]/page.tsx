import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { locales, pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary, statusBadgeClass } from "@/content/app-dictionary";
import {
  getPreviewPortalProject,
  previewMilestones,
  previewPortalProjects,
} from "@/content/preview-data";
import { formatDate, formatPercent } from "@/lib/format";
import { Arrow } from "@/components/ui/Pieces";
import { portalHref } from "@/config/navigation";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    previewPortalProjects.map((project) => ({ locale, id: project.id })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const project = getPreviewPortalProject(id);
  if (!project) notFound();
  return { title: pick(project.title, locale) };
}

export default async function PortalProjectDetail({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  const project = getPreviewPortalProject(id);
  if (!project) notFound();

  return (
    <>
      <p>
        <Link href={portalHref(locale, "projects")} className="text-link">
          <Arrow back /> {app.portal.nav.myProjects}
        </Link>
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div>
          <h2 style={{ fontSize: "1.45rem" }}>{pick(project.title, locale)}</h2>
          <p style={{ color: "var(--color-muted)" }}>
            <span dir="ltr">{project.id}</span> · {pick(project.serviceLabel, locale)} ·{" "}
            {formatDate(project.updatedAt, locale)}
          </p>
        </div>
        <span className={statusBadgeClass(project.status)}>{app.status[project.status]}</span>
      </div>

      <div className="detail-media panel" style={{ margin: 0 }}>
        <Image
          src={project.image}
          alt={pick(project.title, locale)}
          width={1280}
          height={640}
          priority
          style={{ aspectRatio: "16/8" }}
        />
      </div>

      <div className="two-col">
        <section className="panel" aria-label={app.portal.nav.milestones}>
          <div className="panel-head">
            <h2>{app.portal.nav.milestones}</h2>
            <strong>{formatPercent(project.progress, locale)}</strong>
          </div>
          <div className="panel-body">
            <div
              className="progress"
              role="progressbar"
              aria-valuenow={project.progress}
              aria-valuemin={0}
              aria-valuemax={100}
              style={{ marginBlockEnd: 24 }}
            >
              <span style={{ width: `${project.progress}%` }} />
            </div>
            <div className="timeline">
              {previewMilestones.map((m) => (
                <div className={`timeline-item ${m.state}`} key={m.id}>
                  <span className="timeline-dot" aria-hidden="true">
                    {m.state === "done" ? "✓" : "•"}
                  </span>
                  <div>
                    <h3>{pick(m.title, locale)}</h3>
                    <p>
                      {pick(m.detail, locale)} · {formatDate(m.plannedDate, locale)} ·{" "}
                      {formatPercent(m.progress, locale)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <section className="panel" aria-label={app.portal.nav.reports}>
            <div className="panel-head">
              <h2>{app.portal.nav.reports}</h2>
            </div>
            <div className="panel-body">
              <Link href={portalHref(locale, "reports")} className="btn btn-outline btn-sm">
                {app.portal.nav.reports} <Arrow />
              </Link>{" "}
              <Link href={portalHref(locale, "documents")} className="btn btn-outline btn-sm">
                {app.portal.nav.documents} <Arrow />
              </Link>
            </div>
          </section>
          <section className="panel" aria-label={app.portal.nav.issues}>
            <div className="panel-head">
              <h2>{app.portal.nav.issues}</h2>
            </div>
            <div className="panel-body">
              <Link href={portalHref(locale, "issues")} className="btn btn-primary btn-sm">
                {app.portal.addIssuePreview}
              </Link>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
