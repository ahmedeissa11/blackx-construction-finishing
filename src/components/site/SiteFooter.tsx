import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionary";
import { services } from "@/content/services";
import { siteHref, siteNav } from "@/config/navigation";
import { BrandMarkLarge } from "@/components/brand/Logo";

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <BrandMarkLarge />
            <p>{dict.footer.tagline}</p>
          </div>
          <nav aria-label={dict.footer.exploreTitle}>
            <h3>{dict.footer.exploreTitle}</h3>
            <ul className="footer-links">
              {siteNav.map((item) => (
                <li key={item.key}>
                  <Link href={siteHref(locale, item.segment)}>{dict.nav[item.key]}</Link>
                </li>
              ))}
              <li>
                <Link href={siteHref(locale, "faqs")}>{dict.nav.faqs}</Link>
              </li>
              <li>
                <Link href={siteHref(locale, "request")}>{dict.request.title}</Link>
              </li>
            </ul>
          </nav>
          <nav aria-label={dict.footer.servicesTitle}>
            <h3>{dict.footer.servicesTitle}</h3>
            <ul className="footer-links">
              {services.map((service) => (
                <li key={service.slug}>
                  <Link href={siteHref(locale, `services/${service.slug}`)}>
                    {pick(service.title, locale)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <nav aria-label={dict.footer.companyTitle}>
            <h3>{dict.footer.companyTitle}</h3>
            <ul className="footer-links">
              <li>
                <Link href={siteHref(locale, "dashboard")}>{dict.nav.dashboard}</Link>
              </li>
              <li>
                <Link href={siteHref(locale, "portal")}>{dict.nav.portal}</Link>
              </li>
              <li>
                <Link href={siteHref(locale, "contact")}>{dict.nav.contact}</Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>{dict.footer.rights}</span>
          <span>{dict.footer.frontendNote}</span>
        </div>
      </div>
    </footer>
  );
}
