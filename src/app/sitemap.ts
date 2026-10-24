import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { publishedArticles, publishedProjects } from "@/content/publications";
import { locales } from "@/lib/i18n";
import { getSiteUrl, localizedAlternates } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  // Cross-link each entry to its other-locale twin (hreflang), matching
  // the alternates the pages themselves declare in <head>.
  const languagesFor = (locale: (typeof locales)[number], path: string) =>
    Object.fromEntries(
      Object.entries(localizedAlternates(locale, path).languages).map(([lang, href]) => [
        lang,
        `${base}${href}`,
      ]),
    );
  const staticPaths = [
    "",
    "about",
    "services",
    "projects",
    ...(publishedArticles.length > 0 ? ["articles"] : []),
    "contact",
    "faqs",
    "request",
  ];
  const entries: MetadataRoute.Sitemap = [];

  for (const locale of locales) {
    for (const path of staticPaths) {
      entries.push({
        url: `${base}/${locale}${path ? `/${path}` : ""}`,
        changeFrequency: "monthly",
        alternates: { languages: languagesFor(locale, path) },
      });
    }
    for (const service of services) {
      entries.push({
        url: `${base}/${locale}/services/${service.slug}`,
        changeFrequency: "monthly",
        alternates: { languages: languagesFor(locale, `services/${service.slug}`) },
      });
    }
    for (const project of publishedProjects) {
      entries.push({
        url: `${base}/${locale}/projects/${project.slug}`,
        changeFrequency: "monthly",
        alternates: { languages: languagesFor(locale, `projects/${project.slug}`) },
      });
    }
    for (const article of publishedArticles) {
      entries.push({
        url: `${base}/${locale}/articles/${article.slug}`,
        changeFrequency: "monthly",
        alternates: { languages: languagesFor(locale, `articles/${article.slug}`) },
      });
    }
  }
  return entries;
}
