import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import type { Dictionary } from "@/content/dictionary";

/**
 * The authentic supplied BLACK X logo asset (white artwork on a baked-in
 * dark background). It is rendered as-is — never redrawn or recoloured —
 * inside a rounded frame that respects its background.
 */
export function BrandLockup({
  locale,
  dict,
  dark = false,
  onClick,
}: {
  locale: Locale;
  dict: Dictionary;
  dark?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link href={`/${locale}`} className="brand" aria-label={dict.brand.full} onClick={onClick}>
      <img
        src="/brand/blackx-logo.jpg"
        alt="BLACK X"
        className="brand-logo"
        width={52}
        height={52}
        loading="eager"
      />
      <span className="brand-text">
        <span className="brand-name" style={dark ? { color: "#fff" } : undefined}>
          {dict.brand.name}
        </span>
        <br />
        <span className="brand-sub">{dict.brand.sub}</span>
      </span>
    </Link>
  );
}

export function BrandMarkLarge() {
  return (
    <img
      src="/brand/blackx-logo.jpg"
      alt="BLACK X — Construction & Finishing"
      width={120}
      height={120}
      loading="lazy"
    />
  );
}
