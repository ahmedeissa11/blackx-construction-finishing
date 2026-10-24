import Image from "next/image";
import type { Locale } from "@/lib/i18n";
import { Breadcrumbs, type Crumb } from "@/components/ui/Breadcrumbs";

export function PageHero({
  locale,
  homeLabel,
  crumbs,
  title,
  lead,
  image = "/images/hero-villa.jpg",
}: {
  locale: Locale;
  homeLabel: string;
  crumbs: Crumb[];
  title: string;
  lead?: string;
  image?: string;
}) {
  return (
    <section className="page-hero">
      <div className="ph-bg" aria-hidden="true">
        <Image src={image} alt="" fill priority sizes="100vw" style={{ objectFit: "cover" }} />
      </div>
      <div className="container ph-in">
        <Breadcrumbs locale={locale} homeLabel={homeLabel} items={crumbs} />
        <h1>{title}</h1>
        {lead ? <p className="ph-lead">{lead}</p> : null}
      </div>
    </section>
  );
}
