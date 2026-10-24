import Link from "next/link";
import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import type { Service } from "@/content/services";
import { siteHref } from "@/config/navigation";
import { Arrow } from "@/components/ui/Pieces";

export function ServiceCard({
  locale,
  service,
  detailsLabel,
  variant = "standard",
}: {
  locale: Locale;
  service: Service;
  detailsLabel: string;
  variant?: "standard" | "overlay";
}) {
  return (
    <Link
      href={siteHref(locale, `services/${service.slug}`)}
      className={`service-card${variant === "overlay" ? " service-card-overlay" : ""}`}
    >
      <span className="sc-media">
        <Image
          src={service.image}
          alt={pick(service.title, locale)}
          width={720}
          height={540}
          sizes="(max-width: 600px) 100vw, (max-width: 1100px) 50vw, 25vw"
          loading="lazy"
        />
      </span>
      <span className="sc-body">
        <h3>{pick(service.title, locale)}</h3>
        <p>{pick(service.summary, locale)}</p>
        <span className="sc-link">
          {detailsLabel}
          <Arrow />
        </span>
      </span>
    </Link>
  );
}
