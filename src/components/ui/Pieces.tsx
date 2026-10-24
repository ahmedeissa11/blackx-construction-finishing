import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionary";
import { siteHref } from "@/config/navigation";

export function SectionHead({
  eyebrow,
  title,
  lead,
  center = false,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  center?: boolean;
}) {
  return (
    <div className={`section-head${center ? " center" : ""}`}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="section-title">{title}</h2>
      {lead ? <p className="section-lead">{lead}</p> : null}
    </div>
  );
}

export function Arrow({ back = false }: { back?: boolean } = {}) {
  return (
    <span className={`arrow-icon${back ? " arrow-back" : ""}`} aria-hidden="true">
      {back ? "←" : "→"}
    </span>
  );
}

export function CtaBand({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <div className="cta-band">
      <div className="cta-bg" aria-hidden="true">
        <Image
          src="/images/facade-detail.jpg"
          alt=""
          fill
          sizes="100vw"
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="cta-in">
        <div>
          <h2>{dict.home.ctaTitle}</h2>
          <p>{dict.home.ctaText}</p>
        </div>
        <Link href={siteHref(locale, "request")} className="btn btn-primary">
          {dict.common.requestInspection}
        </Link>
      </div>
    </div>
  );
}

export function EmptyState({
  icon = "▦",
  title,
  text,
  actionLabel,
  actionHref,
}: {
  icon?: string;
  title: string;
  text: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="empty-state">
      <div className="es-icon" aria-hidden="true">
        {icon}
      </div>
      <h2>{title}</h2>
      <p>{text}</p>
      {actionLabel && actionHref ? (
        <Link href={actionHref} className="btn btn-primary">
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function PreviewTag({ label }: { label: string }) {
  return <span className="preview-tag">◐ {label}</span>;
}
