import type { Locale } from "@/lib/i18n";

const intlLocale: Record<Locale, string> = { ar: "ar-EG", en: "en-GB" };

export function formatDate(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(intlLocale[locale], {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function formatNumber(value: number, locale: Locale): string {
  return new Intl.NumberFormat(locale === "ar" ? "ar-EG-u-nu-latn" : "en-GB").format(value);
}

/** Currency formatting used by dashboard and portal records. */
export function formatMoney(value: number, locale: Locale): string {
  const amount = formatNumber(value, locale);
  return locale === "ar" ? `${amount} ج.م` : `EGP ${amount}`;
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "—";
  if (parts.length === 1) return (parts[0] ?? "").slice(0, 2);
  return `${(parts[0] ?? "").charAt(0)}${(parts[1] ?? "").charAt(0)}`;
}

export function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function formatPercent(value: number, locale: Locale): string {
  const amount = formatNumber(clampPercent(value), locale);
  return locale === "ar" ? `${amount}٪` : `${amount}%`;
}
