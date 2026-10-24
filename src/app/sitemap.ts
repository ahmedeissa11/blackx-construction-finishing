import type { MetadataRoute } from "next";
import { services } from "@/content/services";
import { publishedArticles, publishedProjects } from "@/content/publications";
import { locales } from "@/lib/i18n";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://blackx-construction.example";
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
      });
    }
    for (const service of services) {
      entries.push({
        url: `${base}/${locale}/services/${service.slug}`,
        changeFrequency: "monthly",
      });
    }
    for (const project of publishedProjects) {
      entries.push({
        url: `${base}/${locale}/projects/${project.slug}`,
        changeFrequency: "monthly",
      });
    }
    for (const article of publishedArticles) {
      entries.push({
        url: `${base}/${locale}/articles/${article.slug}`,
        changeFrequency: "monthly",
      });
    }
  }
  return entries;
}
