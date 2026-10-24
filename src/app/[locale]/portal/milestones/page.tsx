import type { Metadata } from "next";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewMilestones, previewPortalCurrentProject } from "@/content/preview-data";
import { formatDate, formatPercent } from "@/lib/format";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.milestones };
}

export default async function PortalMilestones({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  const project = previewPortalCurrentProject;

  return (
    <>
      <div>
        <h2 style={{ fontSize: "1.45rem" }}>{app.portal.nav.milestones}</h2>
        <p style={{ color: "var(--color-muted)" }}>
          {pick(project.title, locale)} · {app.portal.overallProgress}:{" "}
          <strong>{formatPercent(project.progress, locale)}</strong>
        </p>
      </div>
      <div className="panel">
        <div className="panel-body">
          <div className="timeline">
            {previewMilestones.map((m) => (
              <div className={`timeline-item ${m.state}`} key={m.id}>
                <span className="timeline-dot" aria-hidden="true">
                  {m.state === "done" ? "✓" : "•"}
                </span>
                <div style={{ flex: 1 }}>
                  <h3>{pick(m.title, locale)}</h3>
                  <p style={{ marginBlockEnd: 8 }}>
                    {pick(m.detail, locale)} · {formatDate(m.plannedDate, locale)}
                  </p>
                  <span className="progress-row" style={{ maxWidth: 420 }}>
                    <span
                      className="progress"
                      role="progressbar"
                      aria-valuenow={m.progress}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={pick(m.title, locale)}
                    >
                      <span style={{ width: `${m.progress}%` }} />
                    </span>
                    <strong>{formatPercent(m.progress, locale)}</strong>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
