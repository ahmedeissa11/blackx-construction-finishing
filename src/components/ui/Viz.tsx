import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { clampPercent, formatPercent, initials } from "@/lib/format";

/**
 * Lightweight, honest data-visualisation primitives shared by the admin
 * dashboard and the customer portal. Every figure rendered here is passed
 * in by callers from existing derivations — nothing is fabricated inside
 * these components.
 */

export function Donut({
  value,
  locale,
  label,
  size = 118,
}: {
  value: number;
  locale: Locale;
  label: string;
  size?: number;
}) {
  const pct = clampPercent(value);
  const stroke = 11;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const filled = (pct / 100) * circumference;
  return (
    <div className="viz-donut" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`${label}: ${formatPercent(pct, locale)}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--viz-track)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--viz-accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference - filled}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="viz-donut-center">
        <strong>{formatPercent(pct, locale)}</strong>
        <span>{label}</span>
      </div>
    </div>
  );
}

export type BarRowItem = {
  key: string;
  label: ReactNode;
  valueLabel: ReactNode;
  ratio: number; // 0..1 relative to the largest row
  tone?: "ok" | "warn" | "danger" | "neutral";
};

export function BarRows({ items, ariaLabel }: { items: BarRowItem[]; ariaLabel: string }) {
  return (
    <div className="viz-bars" role="list" aria-label={ariaLabel}>
      {items.map((item) => (
        <div className="viz-bar-row" role="listitem" key={item.key}>
          <span className="viz-bar-label">{item.label}</span>
          <span className={`viz-bar-track viz-tone-${item.tone ?? "neutral"}`} aria-hidden="true">
            <span style={{ width: `${Math.max(0, Math.min(1, item.ratio)) * 100}%` }} />
          </span>
          <strong className="viz-bar-value" dir="ltr">
            {item.valueLabel}
          </strong>
        </div>
      ))}
    </div>
  );
}

export function StackedBar({
  segments,
  ariaLabel,
}: {
  segments: Array<{
    key: string;
    label: ReactNode;
    valueLabel: ReactNode;
    ratio: number;
    tone: "ok" | "warn" | "danger" | "neutral";
  }>;
  ariaLabel: string;
}) {
  return (
    <div className="viz-stacked" aria-label={ariaLabel}>
      <div className="viz-stacked-track" aria-hidden="true">
        {segments.map((segment) => (
          <span
            key={segment.key}
            className={`viz-tone-${segment.tone}`}
            style={{ width: `${Math.max(0, Math.min(1, segment.ratio)) * 100}%` }}
          />
        ))}
      </div>
      <div className="viz-stacked-legend">
        {segments.map((segment) => (
          <span key={segment.key} className="viz-legend-item">
            <span className={`viz-legend-dot viz-tone-${segment.tone}`} aria-hidden="true" />
            {segment.label} · <strong dir="ltr">{segment.valueLabel}</strong>
          </span>
        ))}
      </div>
    </div>
  );
}

const AVATAR_TONES = ["olive", "brass", "slate", "clay", "sage", "ink"] as const;

export function AvatarChip({ name, id }: { name: string; id?: string }) {
  const seed = (id ?? name).split("").reduce((total, ch) => total + ch.charCodeAt(0), 0);
  const tone = AVATAR_TONES[seed % AVATAR_TONES.length];
  return (
    <span className={`viz-avatar viz-avatar-${tone}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}

const DOC_TONES: Record<string, string> = {
  PDF: "pdf",
  DOC: "doc",
  DOCX: "doc",
  XLS: "sheet",
  XLSX: "sheet",
  JPG: "image",
  JPEG: "image",
  PNG: "image",
  WEBP: "image",
};

export function DocBadge({ format }: { format?: string | null }) {
  const normalized = (format ?? "").trim().toUpperCase();
  const tone = DOC_TONES[normalized] ?? "file";
  return (
    <span className={`viz-doc viz-doc-${tone}`} aria-hidden="true">
      <span className="viz-doc-ext">{normalized || "—"}</span>
    </span>
  );
}

export type StepperStep = {
  key: string;
  title: ReactNode;
  meta?: ReactNode;
  state: "done" | "current" | "upcoming";
};

export function MilestoneStepper({
  steps,
  ariaLabel,
}: {
  steps: StepperStep[];
  ariaLabel: string;
}) {
  return (
    <ol className="viz-stepper" aria-label={ariaLabel}>
      {steps.map((step) => (
        <li key={step.key} className={`viz-step viz-step-${step.state}`}>
          <span className="viz-step-dot" aria-hidden="true">
            {step.state === "done" ? "✓" : step.state === "current" ? "●" : ""}
          </span>
          <span className="viz-step-body">
            <span className="viz-step-title">{step.title}</span>
            {step.meta ? <span className="viz-step-meta">{step.meta}</span> : null}
          </span>
        </li>
      ))}
    </ol>
  );
}
