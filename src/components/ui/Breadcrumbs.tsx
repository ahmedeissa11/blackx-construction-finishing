import Link from "next/link";
import type { Locale } from "@/lib/i18n";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({
  locale,
  homeLabel,
  items,
}: {
  locale: Locale;
  homeLabel: string;
  items: Crumb[];
}) {
  return (
    <nav className="breadcrumbs" aria-label={locale === "ar" ? "مسار التصفح" : "Breadcrumb"}>
      <ol className="breadcrumbs-list">
        <li>
          <Link href={`/${locale}`}>{homeLabel}</Link>
        </li>
        {items.map((item, index) => (
          <li key={`${item.label}-${item.href ?? "current"}-${index}`}>
            <span className="sep" aria-hidden="true">
              /
            </span>
            {item.href ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
