import type { ReactNode } from "react";
import { resolveLocale } from "@/lib/locale-params";
import { getDictionary } from "@/content/dictionary";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";

export default async function SiteLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const dict = getDictionary(locale);
  return (
    <>
      <a className="skip-link" href="#main">
        {locale === "ar" ? "تخطَّ إلى المحتوى" : "Skip to content"}
      </a>
      <SiteHeader locale={locale} dict={dict} />
      <main id="main">{children}</main>
      <SiteFooter locale={locale} dict={dict} />
    </>
  );
}
