import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  return {
    sitemap: `${getSiteUrl()}/sitemap.xml`,
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/ar/dashboard", "/en/dashboard", "/ar/portal", "/en/portal"],
      },
    ],
  };
}
