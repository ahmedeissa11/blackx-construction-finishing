"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { buildLocaleSwitchHref } from "@/lib/i18n";
import type { AppDictionary } from "@/content/app-dictionary";
import { statusBadgeClass } from "@/content/app-dictionary";
import { Arrow } from "@/components/ui/Pieces";
import { GlyphIcon } from "@/components/ui/GlyphIcon";

export type ShellNavItem = {
  href: string;
  label: string;
  icon: string;
  count?: number;
  group?: string;
};

export type ShellBreadcrumbItem = { label: string; href?: string };

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
      focusable="false"
    >
      {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="shell-signout-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m16 17 5-5-5-5" />
      <path d="M21 12H9" />
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    </svg>
  );
}

export function AppShell({
  locale,
  appDict,
  roleLabel,
  title,
  navItems,
  navigationContent,
  topbarContent,
  utilityContent,
  shellClassName,
  pageHeadingInContent = false,
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
  /** Optional Admin-specific hierarchy; default portal navigation is unchanged. */
  navigationContent?: ReactNode;
  /** Optional Admin-only controls; Portal keeps its existing header. */
  topbarContent?: ReactNode;
  utilityContent?: ReactNode;
  shellClassName?: string;
  /** Admin pages may own the single page title in their content header. */
  pageHeadingInContent?: boolean;
  breadcrumbs?: ShellBreadcrumbItem[];
  baseSegment: "dashboard" | "portal";
  showSignOut?: boolean;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const contentHeading = pageHeadingInContent;
  const [urlSuffix, setUrlSuffix] = useState("");
  const [compactNav, setCompactNav] = useState(false);
  const [navQuery, setNavQuery] = useState("");
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);

  const closeDrawer = useCallback((restoreFocus = false) => {
    setOpen(false);
    if (restoreFocus) {
      window.requestAnimationFrame(() => menuButtonRef.current?.focus({ preventScroll: true }));
    }
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    const mobileQuery = window.matchMedia("(max-width: 960px)");
    const syncCompactNav = () => setCompactNav(mobileQuery.matches);
    syncCompactNav();
    mobileQuery.addEventListener("change", syncCompactNav);
    return () => mobileQuery.removeEventListener("change", syncCompactNav);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const mobileQuery = window.matchMedia("(max-width: 960px)");
    if (!mobileQuery.matches) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusFrame = window.requestAnimationFrame(() => {
      sidebarRef.current
        ?.querySelector<HTMLElement>(".shell-nav a")
        ?.focus({ preventScroll: true });
    });

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Tab" && baseSegment === "dashboard") {
        const items = Array.from(
          sidebarRef.current?.querySelectorAll<HTMLElement>("a[href],button,input,summary") ?? [],
        ).filter(
          (el) => el.getClientRects().length && !el.closest("details:not([open]) > :not(summary)"),
        );
        const first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeDrawer(true);
      }
    }
    function onViewportChange(event: MediaQueryListEvent) {
      if (!event.matches) setOpen(false);
    }

    document.addEventListener("keydown", onKeyDown);
    mobileQuery.addEventListener("change", onViewportChange);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      mobileQuery.removeEventListener("change", onViewportChange);
    };
  }, [baseSegment, closeDrawer, open]);

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
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const normalizedNavQuery = navQuery.trim().toLocaleLowerCase(locale);
  const filteredNavItems = normalizedNavQuery
    ? navItems.filter((item) =>
        `${item.label} ${item.group ?? ""}`.toLocaleLowerCase(locale).includes(normalizedNavQuery),
      )
    : navItems;

  const navGroups = filteredNavItems.reduce<Array<{ label?: string; items: ShellNavItem[] }>>(
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

  function toggleNavGroup(label: string, expanded: boolean) {
    setGroupOverrides((current) => ({ ...current, [label]: !expanded }));
  }

  return (
    <div
      className={`shell${shellClassName ? ` ${shellClassName}` : ""}${baseSegment === "dashboard" && sidebarCollapsed ? " shell-sidebar-collapsed" : ""}`}
    >
      {open ? (
        <button
          type="button"
          className="shell-scrim"
          aria-label={appDict.close}
          onClick={() => closeDrawer(true)}
        />
      ) : null}
      <aside
        ref={sidebarRef}
        id="app-sidebar"
        className={`shell-sidebar${open ? " open" : ""}`}
        aria-label={roleLabel}
        inert={(compactNav && !open) || (!compactNav && sidebarCollapsed)}
        aria-hidden={(compactNav && !open) || (!compactNav && sidebarCollapsed)}
      >
        <div className="shell-brand">
          <img src="/brand/blackx-logo.jpg" alt="BLACK X" width={46} height={46} />
          <div className="shell-brand-copy">
            <div className="sb-name">BLACK X</div>
            <div className="sb-role">{roleLabel}</div>
          </div>
          <button
            type="button"
            className="shell-drawer-close"
            aria-label={appDict.close}
            onClick={() => closeDrawer(true)}
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>
        {navigationContent ? (
          <div
            onClick={(event) => {
              if ((event.target as HTMLElement).closest("a")) setOpen(false);
            }}
          >
            {navigationContent}
          </div>
        ) : (
          <>
            <div className="shell-nav-search">
              <span className="shell-nav-search-icon" aria-hidden="true">
                <SearchIcon />
              </span>
              <label className="sr-only" htmlFor="shell-navigation-search">
                {appDict.navFilter}
              </label>
              <input
                id="shell-navigation-search"
                type="search"
                value={navQuery}
                onChange={(event) => setNavQuery(event.target.value)}
                placeholder={appDict.navFilter}
                autoComplete="off"
              />
              {navQuery ? (
                <button
                  type="button"
                  className="shell-nav-search-clear"
                  aria-label={appDict.clearFilters}
                  onClick={() => setNavQuery("")}
                >
                  ×
                </button>
              ) : null}
            </div>
            <nav className="shell-nav" aria-label={roleLabel}>
              {navGroups.map((group, groupIndex) => {
                const hasActiveItem = group.items.some((item) => isActive(item.href));
                const expanded = group.label
                  ? normalizedNavQuery
                    ? true
                    : (groupOverrides[group.label] ?? (!compactNav || hasActiveItem))
                  : true;
                const visibleItems = expanded
                  ? group.items
                  : group.items.filter((item) => isActive(item.href));
                const groupPanelId = `shell-nav-group-${groupIndex}`;

                return (
                  <div
                    className="shell-nav-group"
                    key={`${group.label ?? "default"}-${groupIndex}`}
                    role={group.label ? "group" : undefined}
                    aria-label={group.label}
                  >
                    {group.label ? (
                      <button
                        type="button"
                        className="shell-nav-heading"
                        aria-expanded={expanded}
                        aria-controls={groupPanelId}
                        onClick={() => toggleNavGroup(group.label!, expanded)}
                      >
                        <span>{group.label}</span>
                        <span className="shell-nav-chevron" aria-hidden="true">
                          {expanded ? "⌃" : "⌄"}
                        </span>
                      </button>
                    ) : null}
                    <div id={groupPanelId} className="shell-nav-items">
                      {visibleItems.map((item) => (
                        <Link
                          key={item.href + item.label}
                          href={item.href}
                          className={isActive(item.href) ? "active" : undefined}
                          aria-current={isActive(item.href) ? "page" : undefined}
                          onClick={() => setOpen(false)}
                        >
                          <span className="nav-icon" aria-hidden="true">
                            <GlyphIcon icon={item.icon} />
                          </span>
                          <span className="nav-label">{item.label}</span>
                          {typeof item.count === "number" && item.count > 0 ? (
                            <>
                              <span className="nav-count" aria-hidden="true">
                                {item.count}
                              </span>
                              <span className="sr-only">
                                ({item.count} {appDict.status.new})
                              </span>
                            </>
                          ) : null}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              {normalizedNavQuery && navGroups.length === 0 ? (
                <p className="shell-nav-empty">{appDict.noResults}</p>
              ) : null}
            </nav>
          </>
        )}
        <div className="shell-foot">
          <p style={{ marginBlockEnd: 10 }}>{appDict.authNote}</p>
          <Link href={`/${locale}`}>
            <Arrow back /> {appDict.backToSite}
          </Link>
        </div>
      </aside>
      <div className="shell-main" inert={baseSegment === "dashboard" && compactNav && open}>
        <header className="shell-topbar">
          {baseSegment === "dashboard" ? (
            <button
              type="button"
              className="shell-collapse-btn"
              aria-controls="app-sidebar"
              aria-expanded={!sidebarCollapsed}
              aria-label={
                locale === "ar"
                  ? sidebarCollapsed
                    ? "إظهار التنقل الجانبي"
                    : "طي التنقل الجانبي"
                  : sidebarCollapsed
                    ? "Expand navigation"
                    : "Collapse navigation"
              }
              onClick={() => setSidebarCollapsed((value) => !value)}
            >
              <MenuIcon open={false} />
            </button>
          ) : null}
          <button
            ref={menuButtonRef}
            type="button"
            className="shell-menu-btn"
            aria-expanded={open}
            aria-controls="app-sidebar"
            aria-label={open ? appDict.close : appDict.menu}
            onClick={() => (open ? closeDrawer(true) : setOpen(true))}
          >
            <MenuIcon open={open} />
          </button>
          <div className="shell-heading">
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
                        {item.href && (!isLast || (contentHeading && item.href !== pathname)) ? (
                          <Link href={item.href}>{item.label}</Link>
                        ) : (
                          <span aria-current={isLast ? "page" : undefined}>{item.label}</span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : (
              <p className="shell-context">{roleLabel}</p>
            )}
            {contentHeading ? (
              <p className="shell-title shell-page-context">{roleLabel}</p>
            ) : (
              <h1 className="shell-title">{title}</h1>
            )}
          </div>
          <span className="shell-topbar-actions">
            {utilityContent}
            <span className="locale-switch" role="group" aria-label="Language / اللغة">
              <Link
                href={buildLocaleSwitchHref(pathname, "ar", urlSuffix)}
                lang="ar"
                className={locale === "ar" ? "current" : undefined}
                aria-current={locale === "ar" ? "true" : undefined}
              >
                عربي
              </Link>
              <Link
                href={buildLocaleSwitchHref(pathname, "en", urlSuffix)}
                lang="en"
                className={locale === "en" ? "current" : undefined}
                aria-current={locale === "en" ? "true" : undefined}
              >
                EN
              </Link>
            </span>
            <span className="shell-account" aria-label={roleLabel}>
              <span className="shell-account-avatar" aria-hidden="true">
                BX
              </span>
              <span className="shell-account-copy">
                <strong>BLACK X</strong>
                <small>{roleLabel}</small>
              </span>
            </span>
            {showSignOut ? (
              <button
                type="button"
                className="btn btn-ghost btn-sm shell-signout"
                onClick={() => void signOut({ callbackUrl: `/${locale}/login` })}
              >
                <LogoutIcon />
                {appDict.signOut}
              </button>
            ) : null}
          </span>
          {topbarContent ? <div className="shell-topbar-tools">{topbarContent}</div> : null}
        </header>
        <main className="shell-content" id="main">
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
