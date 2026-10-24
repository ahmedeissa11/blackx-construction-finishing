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
import { getProjectPhases, getProjectWorkItems, workItemProgress } from "@/lib/preview-expansion";
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
  const phases = getProjectPhases(project.id);
  const workItemGroups = getProjectWorkItems(project.id);
  const workflow = app.dashboard.expansion.workflow;
  const phaseTypes = app.dashboard.expansion.phaseTypes;

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

      <section className="panel" aria-label={app.portal.phases.title}>
        <div className="panel-head">
          <h2>{app.portal.phases.title}</h2>
        </div>
        <div className="panel-body">
          <p style={{ color: "var(--color-muted)" }}>{app.portal.phases.intro}</p>
          {phases.length === 0 ? (
            <p>{app.portal.phases.noPhases}</p>
          ) : (
            <div className="list-rows">
              {phases.map((phase) => (
                <div className="list-row" key={phase.id}>
                  <div className="lr-main">
                    <div className="lr-title">
                      {phaseTypes[phase.type] ?? phase.type} — {pick(phase.title, locale)}
                    </div>
                    <div className="lr-sub">{formatPercent(phase.progress, locale)}</div>
                    <div
                      className="progress"
                      role="progressbar"
                      aria-valuenow={phase.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={pick(phase.title, locale)}
                      style={{ marginBlockStart: 8 }}
                    >
                      <span style={{ width: `${phase.progress}%` }} />
                    </div>
                  </div>
                  <span className={statusBadgeClass(phase.status)}>{app.status[phase.status]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {workItemGroups.length > 0 ? (
        <section className="panel" aria-label={workflow.workItemsTitle}>
          <div className="panel-head">
            <h2>{workflow.workItemsTitle}</h2>
          </div>
          <div className="panel-body">
            <p style={{ color: "var(--color-muted)" }}>{workflow.workItemsIntro}</p>
            {workItemGroups.map((group) => (
              <div key={group.phase.id} style={{ marginBlockStart: 16 }}>
                <h3 style={{ fontSize: "1rem" }}>
                  {phaseTypes[group.phase.type] ?? group.phase.type} —{" "}
                  {pick(group.phase.title, locale)}
                </h3>
                <div className="list-rows">
                  {group.items.map((item) => (
                    <div className="list-row" key={item.id}>
                      <div className="lr-main">
                        <div className="lr-title">{pick(item.label, locale)}</div>
                        <div className="lr-sub">
                          {workflow.completedQty} {item.completedQty}/{item.plannedQty}{" "}
                          {pick(item.unit, locale)} ·{" "}
                          {formatPercent(workItemProgress(item), locale)}
                        </div>
                        <div
                          className="progress"
                          role="progressbar"
                          aria-valuenow={workItemProgress(item)}
                          aria-valuemin={0}
                          aria-valuemax={100}
                          aria-label={pick(item.label, locale)}
                          style={{ marginBlockStart: 8 }}
                        >
                          <span style={{ width: `${workItemProgress(item)}%` }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
