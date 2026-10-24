/**
 * Canonical public site URL for generated absolute URLs (sitemap, etc.).
 *
 * Previously the sitemap hardcoded the placeholder origin
 * `https://blackx-construction.example`, which made every submitted
 * sitemap URL wrong. The fallback below is the domain actually assigned
 * to the existing Vercel production project; when a custom domain is
 * approved and attached, set NEXT_PUBLIC_SITE_URL (name documented in
 * .env.example) — no code change needed. This chooses no business
 * contact details (TBD-PO-07); it only stops publishing a fake origin.
 */

import { defaultLocale, locales, type Locale } from "@/lib/i18n";

const FALLBACK_SITE_URL = "https://blackx-construction-finishing.vercel.app";

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }
  return FALLBACK_SITE_URL;
}

/**
 * Canonical + hreflang alternates for a public localized page. Returns
 * root-relative URLs; Next resolves them against the layout's
 * `metadataBase` (getSiteUrl), so a future custom domain needs only the
 * NEXT_PUBLIC_SITE_URL change. `path` is the locale-less path segment
 * (e.g. "about", "services/kitchens"; "" for the locale home).
 * `x-default` points at the default locale, matching middleware.
 */
export function localizedAlternates(
  locale: Locale,
  path = "",
): { canonical: string; languages: Record<string, string> } {
  const suffix = path ? `/${path}` : "";
  const languages: Record<string, string> = {};
  for (const candidate of locales) {
    languages[candidate] = `/${candidate}${suffix}`;
  }
  languages["x-default"] = `/${defaultLocale}${suffix}`;
  return { canonical: `/${locale}${suffix}`, languages };
}
