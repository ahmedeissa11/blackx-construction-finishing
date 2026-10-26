"use client";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { screenSearchText, getScreenViews } from "@/config/erp-screen-specs";
import { erpModules, erpHref, canAccessErp, type ErpModule } from "@/config/erp";
import { dashboardModules, dashboardHref, dashboardNavGroups } from "@/config/navigation";
import { erpNavigationGroups } from "@/config/erp-navigation";
import { getAppDictionary } from "@/content/app-dictionary";
import { erpText } from "@/content/erp-dictionary";
import { InfoDialog } from "@/components/ui/ConfirmDialog";

export function searchErpPages(query: string) {
  const q = query.trim().toLocaleLowerCase();
  return erpModules.flatMap((module) =>
    module.pages
      .filter((page) =>
        `${module.title.ar} ${module.title.en} ${module.id} ${page.title.ar} ${page.title.en} ${page.id} ${page.section.ar} ${page.section.en} ${screenSearchText(module.id, page.id)}`
          .toLocaleLowerCase()
          .includes(q),
      )
      .map((page) => ({ module, page })),
  );
}
/** Existing website Admin pages share the same search and command surface. */
export function searchAdminPages(query: string) {
  const q = query.trim().toLocaleLowerCase();
  return dashboardModules.filter((item) =>
    `${getAppDictionary("ar").dashboard.modules[item.key]} ${getAppDictionary("en").dashboard.modules[item.key]} ${item.key}`
      .toLocaleLowerCase()
      .includes(q),
  );
}
/** A matching layout is a query parameter on an existing guarded route. */
export function erpSearchHref(locale: Locale, area: string, page: string, query: string) {
  const q = query.trim().toLowerCase();
  const match = q
    ? getScreenViews(area, page).find((view) =>
        `${view.id} ${view.title.ar} ${view.title.en}`.toLowerCase().includes(q),
      )
    : undefined;
  return `${erpHref(locale, area, page)}${match ? `?view=${match.id}` : ""}`;
}
function ModuleGroup({
  module,
  locale,
  query,
  pathname,
}: {
  module: ErpModule;
  locale: Locale;
  query: string;
  pathname: string;
}) {
  const active =
    pathname === erpHref(locale, module.id) ||
    pathname.startsWith(`${erpHref(locale, module.id)}/`);
  const [expanded, setExpanded] = useState(active);
  useEffect(() => {
    if (active) setExpanded(true);
  }, [active, pathname]);
  const pages = searchErpPages(query)
    .filter((item) => item.module.id === module.id)
    .map((item) => item.page);
  if (!pages.length) return null;
  const sections = [...new Set(pages.map((page) => pick(page.section, locale)))];
  return (
    <details
      className={`erp-nav-module${active ? " is-active" : ""}`}
      open={Boolean(query) || expanded}
    >
      <summary
        onClick={(event) => {
          event.preventDefault();
          setExpanded(!expanded);
        }}
        aria-expanded={Boolean(query) || expanded}
      >
        <span>
          {pick(module.title, locale)}
          <small className="erp-nav-meta">
            <bdi>{module.id}</bdi> · {pages.length} / {module.pages.length}{" "}
            {erpText("pages", locale)}
          </small>
        </span>
        <span aria-hidden="true">{Boolean(query) || expanded ? "−" : "+"}</span>
      </summary>
      <Link
        href={erpHref(locale, module.id)}
        aria-current={pathname === erpHref(locale, module.id) ? "page" : undefined}
      >
        {erpText("catalogue", locale)}
      </Link>
      {sections.map((section) => (
        <div className="erp-nav-submenu" key={section} role="group" aria-label={section}>
          <span className="erp-nav-section">{section}</span>
          {pages
            .filter((page) => pick(page.section, locale) === section)
            .map((page) => {
              const href = erpHref(locale, module.id, page.id);
              const searchHref = erpSearchHref(locale, module.id, page.id, query);
              return (
                <Link
                  key={page.id}
                  href={searchHref}
                  aria-current={pathname === href ? "page" : undefined}
                  className={pathname === href ? "active" : undefined}
                >
                  {pick(page.title, locale)}
                </Link>
              );
            })}
        </div>
      ))}
    </details>
  );
}
export function ErpNavigation({ locale, role }: { locale: Locale; role: unknown }) {
  const pathname = usePathname() ?? "";
  const [query, setQuery] = useState("");
  const [command, setCommand] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const oldWorkspaceActive =
    (pathname === `/${locale}/dashboard` || pathname.startsWith(`/${locale}/dashboard/`)) &&
    !(pathname === erpHref(locale) || pathname.startsWith(`${erpHref(locale)}/`));
  const [oldExpanded, setOldExpanded] = useState(oldWorkspaceActive);
  useEffect(() => {
    if (oldWorkspaceActive) setOldExpanded(true);
  }, [oldWorkspaceActive, pathname]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setCommand(false);
    setQuery("");
  }, [pathname]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommand((value) => !value);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);
  if (!canAccessErp(role)) return null;
  const app = getAppDictionary(locale);
  const results = searchErpPages(commandQuery);
  const adminResults = searchAdminPages(commandQuery);
  const matchingModules = new Set(searchErpPages(query).map(({ module }) => module.id));
  const adminPages = searchAdminPages(query).filter((item) => item.key !== "overview");
  return (
    <>
      <div className="erp-nav-tools">
        <label htmlFor="erp-nav-search">{erpText("search", locale)}</label>
        <input
          id="erp-nav-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="form-input"
        />
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={() => setCommand(true)}
          aria-haspopup="dialog"
        >
          {erpText("command", locale)} <kbd>Ctrl K</kbd>
        </button>
      </div>
      <nav className="shell-nav erp-nav" aria-label={erpText("adminNavigation", locale)}>
        <Link
          href={dashboardHref(locale)}
          aria-current={pathname === dashboardHref(locale) ? "page" : undefined}
        >
          {app.dashboard.modules.overview}
        </Link>
        <Link
          className="erp-workspace-entry"
          href={erpHref(locale)}
          aria-current={pathname === erpHref(locale) ? "page" : undefined}
        >
          {erpText("workspace", locale)}
        </Link>
        {erpNavigationGroups.map((group) =>
          group.modules.some((id) => matchingModules.has(id)) ? (
            <div
              key={group.id}
              className="erp-nav-category"
              role="group"
              aria-labelledby={`erp-nav-category-${group.id}`}
            >
              <span id={`erp-nav-category-${group.id}`} className="erp-nav-category-title">
                {pick(group.title, locale)}
              </span>
              {group.modules.map((id) => {
                const areaModule = erpModules.find((item) => item.id === id)!;
                return (
                  <ModuleGroup
                    key={id}
                    module={areaModule}
                    locale={locale}
                    query={query}
                    pathname={pathname}
                  />
                );
              })}
            </div>
          ) : null,
        )}
        {query.trim() && !matchingModules.size && !searchAdminPages(query).length ? (
          <p>{erpText("noResults", locale)}</p>
        ) : null}
        <details className="erp-nav-module" open={Boolean(query) || oldExpanded}>
          <summary
            aria-expanded={Boolean(query) || oldExpanded}
            onClick={(event) => {
              event.preventDefault();
              setOldExpanded((value) => !value);
            }}
          >
            {erpText("current", locale)}
          </summary>
          {dashboardNavGroups.map((group) => {
            const items = adminPages.filter((item) => group.modules.includes(item.key));
            if (!items.length) return null;
            return (
              <div
                key={group.key}
                className="erp-nav-submenu"
                role="group"
                aria-label={app.dashboard.navGroups[group.key]}
              >
                <span className="erp-nav-section">{app.dashboard.navGroups[group.key]}</span>
                {items.map((item) => {
                  const href = dashboardHref(locale, item.segment);
                  const active = pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link key={item.key} href={href} aria-current={active ? "page" : undefined}>
                      {app.dashboard.modules[item.key]}
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </details>
      </nav>
      {mounted
        ? createPortal(
            <InfoDialog
              open={command}
              title={erpText("command", locale)}
              closeLabel={erpText("close", locale)}
              onClose={() => setCommand(false)}
            >
              <label htmlFor="erp-command-search">{erpText("search", locale)}</label>
              <input
                id="erp-command-search"
                className="form-input"
                type="search"
                value={commandQuery}
                onChange={(event) => setCommandQuery(event.target.value)}
              />
              <ul className="erp-command-results">
                {adminResults.map((item) => (
                  <li key={`admin/${item.key}`}>
                    <Link
                      href={dashboardHref(locale, item.segment)}
                      onClick={() => setCommand(false)}
                    >
                      <small>{erpText("websiteAdmin", locale)}</small>
                      <strong>{app.dashboard.modules[item.key]}</strong>
                    </Link>
                  </li>
                ))}
                {results.map(({ module, page }) => (
                  <li key={`${module.id}/${page.id}`}>
                    <Link
                      href={erpSearchHref(locale, module.id, page.id, commandQuery)}
                      onClick={() => setCommand(false)}
                    >
                      <small>
                        {pick(module.title, locale)} / {pick(page.section, locale)}
                      </small>
                      <strong>{pick(page.title, locale)}</strong>
                    </Link>
                  </li>
                ))}
              </ul>
              {!results.length && !adminResults.length ? (
                <p>{erpText("noResults", locale)}</p>
              ) : null}
            </InfoDialog>,
            // Native modal stays in the theme boundary, outside the inert drawer.
            document.querySelector(".admin-theme-root") ?? document.body,
          )
        : null}
    </>
  );
}
