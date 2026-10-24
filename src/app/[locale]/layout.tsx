import type { Metadata } from "next";
import type { ReactNode } from "react";
import { locales, getDirection } from "@/lib/i18n";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import "@fontsource-variable/cairo";
import "@fontsource-variable/inter";
import "@/styles/globals.css";
import "@/styles/site.css";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return {
    title: {
      default: `${dict.brand.full} | BLACK X`,
      template: "%s | BLACK X CONSTRUCTION & FINISHING",
    },
    description: dict.meta.siteDescription,
    icons: { icon: "/brand/blackx-logo.jpg" },
  };
}

export default async function LocaleRootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  return (
    <html lang={locale} dir={getDirection(locale)}>
      <body>{children}</body>
    </html>
  );
}
