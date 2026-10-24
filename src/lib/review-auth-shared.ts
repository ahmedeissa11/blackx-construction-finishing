import type { Locale } from "@/lib/i18n";

export const OWNER_REVIEW_ROLE = "owner_review";

export function isReviewProtectedPath(pathname: string): boolean {
  return /^\/(ar|en)\/(dashboard|portal)(\/|$)/.test(pathname);
}

export function sanitizeReviewCallbackUrl(value: unknown, locale: Locale): string {
  const fallback = `/${locale}/dashboard`;
  if (typeof value !== "string") return fallback;

  const callback = value.trim();
  if (!callback || callback.includes("\\") || callback.startsWith("//")) return fallback;

  let url: URL;
  try {
    url = new URL(callback, "http://blackx.local");
  } catch {
    return fallback;
  }

  if (url.origin !== "http://blackx.local") return fallback;
  if (!/^\/(dashboard|portal)(\/|$)/.test(url.pathname.replace(`/${locale}`, ""))) {
    return fallback;
  }
  if (
    !url.pathname.startsWith(`/${locale}/dashboard`) &&
    !url.pathname.startsWith(`/${locale}/portal`)
  ) {
    return fallback;
  }

  return `${url.pathname}${url.search}${url.hash}`;
}
