"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { buildLocaleSwitchHref } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import { Arrow } from "@/components/ui/Pieces";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: string;
  count?: number;
  group?: string;
};

export type ShellBreadcrumbItem = { label: string; href?: string };

export function AppShell({
  locale,
  appDict,
  roleLabel,
  title,
  navItems,
  breadcrumbs = [],
  baseSegment,
  showSignOut = false,
  children,
}: {
  locale: Locale;
  appDict: AppDictionary;
  roleLabel: string;
  title: string;
  navItems: ShellNavItem[];
  breadcrumbs?: ShellBreadcrumbItem[];
  baseSegment: "dashboard" | "portal";
  showSignOut?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [urlSuffix, setUrlSuffix] = useState("");

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    function syncUrlSuffix() {
      setUrlSuffix(`${window.location.search}${window.location.hash}`);
    }
    syncUrlSuffix();
    window.addEventListener("hashchange", syncUrlSuffix);
    window.addEventListener("popstate", syncUrlSuffix);
    return () => {
      window.removeEventListener("hashchange", syncUrlSuffix);
      window.removeEventListener("popstate", syncUrlSuffix);
    };
  }, [pathname]);

  function isActive(href: string): boolean {
    const base = `/${locale}/${baseSegment}`;
    if (href === base) return pathname === base || pathname === `${base}/`;
    return pathname.startsWith(href);
  }

  const navGroups = navItems.reduce<Array<{ label?: string; items: ShellNavItem[] }>>(
    (groups, item) => {
      const current = groups.at(-1);
      if (current && current.label === item.group) {
        current.items.push(item);
      } else {
        groups.push({ label: item.group, items: [item] });
      }
      return groups;
    },
    [],
  );

  return (
    <div className="shell">
      {open ? (
        <button
          type="button"
          className="shell-scrim"
          aria-label={appDict.close}
          onClick={() => setOpen(false)}
        />
      ) : null}
      <aside
        id="app-sidebar"
        className={`shell-sidebar${open ? " open" : ""}`}
        aria-label={roleLabel}
      >
        <div className="shell-brand">
          <img src="/brand/blackx-logo.jpg" alt="BLACK X" width={46} height={46} />
          <div>
            <div className="sb-name">BLACK X</div>
            <div className="sb-role">{roleLabel}</div>
          </div>
        </div>
        <nav className="shell-nav" aria-label={roleLabel}>
          {navGroups.map((group, groupIndex) => (
            <div
              className="shell-nav-group"
              key={`${group.label ?? "default"}-${groupIndex}`}
              role={group.label ? "group" : undefined}
              aria-label={group.label}
            >
              {group.label ? <p className="shell-nav-heading">{group.label}</p> : null}
              {group.items.map((item) => (
                <Link
                  key={item.href + item.label}
                  href={item.href}
                  className={isActive(item.href) ? "active" : undefined}
                  aria-current={isActive(item.href) ? "page" : undefined}
                >
                  <span className="nav-icon" aria-hidden="true">
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {typeof item.count === "number" && item.count > 0 ? (
                    <span className="nav-count">{item.count}</span>
                  ) : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="shell-foot">
          <p style={{ marginBlockEnd: 10 }}>{appDict.authNote}</p>
          <Link href={`/${locale}`}>
            <Arrow back /> {appDict.backToSite}
          </Link>
        </div>
      </aside>
      <div className="shell-main">
        <div className="preview-banner" role="note">
          <div className="container">
            <strong>{locale === "ar" ? "تنبيه: " : "Note: "}</strong>
            {appDict.previewBanner}
          </div>
        </div>
        <header className="shell-topbar">
          <button
            type="button"
            className="shell-menu-btn"
            aria-expanded={open}
            aria-controls="app-sidebar"
            aria-label={open ? appDict.close : appDict.menu}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "✕" : "☰"}
          </button>
          <h1>{title}</h1>
          <span
            style={{
              marginInlineStart: "auto",
              display: "inline-flex",
              gap: 10,
              alignItems: "center",
            }}
          >
            <span className="locale-switch" role="group" aria-label="Language / اللغة">
              <Link
                href={buildLocaleSwitchHref(pathname, "ar", urlSuffix)}
                className={locale === "ar" ? "current" : undefined}
                aria-current={locale === "ar" ? "true" : undefined}
              >
                عربي
              </Link>
              <Link
                href={buildLocaleSwitchHref(pathname, "en", urlSuffix)}
                className={locale === "en" ? "current" : undefined}
                aria-current={locale === "en" ? "true" : undefined}
              >
                EN
              </Link>
            </span>
            {showSignOut ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => void signOut({ callbackUrl: `/${locale}/login` })}
              >
                {appDict.signOut}
              </button>
            ) : null}
          </span>
        </header>
        <main className="shell-content" id="main">
          {breadcrumbs.length > 1 ? (
            <nav
              className="breadcrumbs shell-breadcrumbs"
              aria-label={appDict.dashboard.breadcrumbLabel}
            >
              <ol className="breadcrumbs-list">
                {breadcrumbs.map((item, index) => {
                  const isLast = index === breadcrumbs.length - 1;
                  return (
                    <li key={`${item.label}-${index}`}>
                      {index > 0 ? (
                        <span className="sep" aria-hidden="true">
                          /
                        </span>
                      ) : null}
                      {item.href && !isLast ? (
                        <Link href={item.href}>{item.label}</Link>
                      ) : (
                        <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                      )}
                    </li>
                  );
                })}
              </ol>
            </nav>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

export function StatusBadge({ appDict, status }: { appDict: AppDictionary; status: string }) {
  const label = appDict.status[status] ?? status;
  return <StatusBadgeView label={label} status={status} />;
}

export function StatusBadgeView({ label, status }: { label: string; status: string }) {
  return <span className={statusBadgeClass(status)}>{label}</span>;
}
