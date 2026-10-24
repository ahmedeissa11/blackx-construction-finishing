export const locales = ["ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "ar";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export function getDirection(locale: Locale): "rtl" | "ltr" {
  return locale === "ar" ? "rtl" : "ltr";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "ar" ? "en" : "ar";
}

/** Switch the locale segment of a pathname, preserving the rest of the path. */
export function switchLocalePath(pathname: string, target: Locale): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0] ?? "")) {
    segments[0] = target;
    return `/${segments.join("/")}`;
  }
  return `/${target}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

export function buildLocaleSwitchHref(pathname: string, target: Locale, urlSuffix = ""): string {
  const suffix = urlSuffix.startsWith("?") || urlSuffix.startsWith("#") ? urlSuffix : "";
  return `${switchLocalePath(pathname, target)}${suffix}`;
}

export type LocalizedText = Record<Locale, string>;

export function pick(text: LocalizedText, locale: Locale): string {
  return text[locale];
}
