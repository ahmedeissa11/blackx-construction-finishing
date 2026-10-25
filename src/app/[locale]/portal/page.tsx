import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { pick } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getAppDictionary } from "@/content/app-dictionary";
import {
  previewIssues,
  previewMilestones,
  previewPortalClient,
  previewPortalCurrentProject,
} from "@/content/preview-data";
import { previewPortalReports } from "@/content/preview-modules";
import { formatDate, formatMoney, formatNumber, formatPercent, initials } from "@/lib/format";
import { getPortalFinance } from "@/lib/preview-expansion";
import { Donut, MilestoneStepper, StackedBar } from "@/components/ui/Viz";
import { Arrow } from "@/components/ui/Pieces";
import { portalHref } from "@/config/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  return { title: getAppDictionary(locale).portal.nav.overview };
}

export default async function PortalOverview({ params }: { params: Promise<{ locale: string }> }) {
  const locale = await resolveLocale(params);
  const app = getAppDictionary(locale);
  const p = app.portal;
  const project = previewPortalCurrentProject;
  const current = previewMilestones.find((m) => m.state === "current");
  const next = previewMilestones.find((m) => m.state === "upcoming");
  const latestReport = previewPortalReports[0]!;
  const openIssues = previewIssues.filter((i) => i.status !== "resolved").length;
  const finance = getPortalFinance(previewPortalClient.id);
  const projectMilestones = previewMilestones.filter((m) => m.projectId === project.id);

  return (
    <>
      <div className="portal-welcome">
        <span className="avatar" aria-hidden="true">
          {initials(pick(previewPortalClient.name, locale))}
        </span>
        <div>
          <h2 style={{ fontSize: "1.45rem" }}>
            {p.welcome}
            {locale === "ar" ? "، " : ", "}
            {pick(previewPortalClient.name, locale)}
          </h2>
          <p style={{ color: "var(--color-muted)" }}>{p.overviewLead}</p>
        </div>
      </div>

      <section className="panel portal-current-project" aria-label={p.currentProject}>
        <div
          style={{ display: "grid", gridTemplateColumns: "300px 1fr" }}
          className="portal-hero-grid"
        >
          <div style={{ position: "relative", minHeight: 210 }}>
            <Image
              src={project.image}
              alt={pick(project.title, locale)}
              fill
              sizes="(max-width: 800px) 100vw, 300px"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <span className="eyebrow" style={{ margin: 0 }}>
              {p.currentProject} · <span dir="ltr">{project.id}</span>
            </span>
            <h3 style={{ fontSize: "1.25rem" }}>{pick(project.title, locale)}</h3>
            <div className="portal-hero-progress">
              <Donut
                value={project.progress}
                locale={locale}
                label={p.overallProgress}
                size={104}
              />
              <div className="portal-hero-progress-main">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.9rem",
                    color: "var(--color-muted)",
                    marginBlockEnd: 6,
                  }}
                >
                  <span>{p.overallProgress}</span>
                  <strong style={{ color: "var(--color-charcoal)" }}>
                    {formatPercent(project.progress, locale)}
                  </strong>
                </div>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow={project.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={p.overallProgress}
                >
                  <span style={{ width: `${project.progress}%` }} />
                </div>
              </div>
            </div>
            <dl className="kv-grid">
              {current ? (
                <div className="kv">
                  <dt>{p.currentMilestone}</dt>
                  <dd>{pick(current.title, locale)}</dd>
                </div>
              ) : null}
              {next ? (
                <div className="kv">
                  <dt>{p.nextMilestone}</dt>
                  <dd>
                    {pick(next.title, locale)} · {formatDate(next.plannedDate, locale)}
                  </dd>
                </div>
              ) : null}
            </dl>
            <div>
              <Link
                href={portalHref(locale, `projects/${project.id}`)}
                className="btn btn-primary btn-sm"
              >
                {p.viewProject}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="panel portal-milestones-panel" aria-label={p.currentMilestone}>
        <div className="panel-body">
          <MilestoneStepper
            ariaLabel={p.currentMilestone}
            steps={projectMilestones.map((milestone) => ({
              key: milestone.id,
              title: pick(milestone.title, locale),
              meta: formatDate(milestone.plannedDate, locale),
              state: milestone.state,
            }))}
          />
        </div>
      </section>

      <section className="panel portal-finance-panel" aria-label={p.finance.title}>
        <div className="panel-head">
          <h2>{p.finance.title}</h2>
          <Link href={portalHref(locale, "finance")} className="btn btn-ghost btn-sm">
            {app.dashboard.viewAll} <Arrow />
          </Link>
        </div>
        <div className="panel-body">
          <StackedBar
            ariaLabel={p.finance.title}
            segments={[
              {
                key: "paid",
                label: p.finance.totalPaid,
                valueLabel: formatMoney(finance.collected, locale),
                ratio: finance.duesTotal > 0 ? finance.collected / finance.duesTotal : 0,
                tone: "ok",
              },
              {
                key: "remaining",
                label: p.finance.totalRemaining,
                valueLabel: formatMoney(finance.remaining, locale),
                ratio: finance.duesTotal > 0 ? finance.remaining / finance.duesTotal : 0,
                tone: "warn",
              },
            ]}
          />
          <p className="viz-note">
            {p.finance.totalDues} ·{" "}
            <strong dir="ltr">{formatMoney(finance.duesTotal, locale)}</strong>
          </p>
        </div>
      </section>

      <div className="two-col portal-summary-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <section className="panel portal-summary-panel" aria-label={p.latestReport}>
          <div className="panel-head">
            <h2>{p.latestReport}</h2>
            <Link href={portalHref(locale, "reports")} className="btn btn-ghost btn-sm">
              {app.dashboard.viewAll} <Arrow />
            </Link>
          </div>
          <div className="panel-body">
            <p style={{ fontWeight: 600, color: "var(--color-charcoal)" }}>
              {pick(latestReport.title, locale)}
            </p>
            <p style={{ color: "var(--color-muted)", fontSize: "0.9rem" }}>
              {formatDate(latestReport.date, locale)} · <span dir="ltr">{latestReport.week}</span>
            </p>
          </div>
        </section>
        <section className="panel portal-summary-panel" aria-label={p.openIssuesCount}>
          <div className="panel-head">
            <h2>{p.openIssuesCount}</h2>
            <Link href={portalHref(locale, "issues")} className="btn btn-ghost btn-sm">
              {app.dashboard.viewAll} <Arrow />
            </Link>
          </div>
          <div className="panel-body">
            <p>
              <strong style={{ fontSize: "1.7rem", color: "var(--color-charcoal)" }}>
                {formatNumber(openIssues, locale)}
              </strong>{" "}
              <span style={{ color: "var(--color-muted)" }}>{p.openIssuesCount}</span>
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
