"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getAppDictionary } from "@/content/app-dictionary";
import { dashboardHref, dashboardModules, getDashboardNavGroupKey } from "@/config/navigation";
import { erpModules, erpHref, canAccessErp } from "@/config/erp";
import { pick } from "@/lib/i18n";
import { erpText } from "@/content/erp-dictionary";
import { ErpHeaderTools } from "./ErpHeaderTools";
import { ErpNavigation } from "./ErpNavigation";
import { previewRequests } from "@/content/preview-data";
import { countPreviewModuleStatus } from "@/content/preview-modules";
import { AppShell, type ShellBreadcrumbItem, type ShellNavItem } from "@/components/ui/AppShell";

export function DashboardShell({
  locale,
  role,
  children,
}: {
  locale: Locale;
  role: unknown;
  children: ReactNode;
}) {
  const [compact, setCompact] = useState(false);
  const appDict = getAppDictionary(locale);
  const pathname = usePathname() ?? "";
  const base = `/${locale}/dashboard`;
  const rest = pathname.replace(base, "").replace(/^\//, "");
  const pathParts = rest.split("/").filter(Boolean);
  const currentKey = dashboardModules.find((m) => m.segment === pathParts[0])?.key ?? "overview";
  const currentGroupKey = getDashboardNavGroupKey(currentKey);
  const detailId =
    currentKey === "projects" && pathParts[1] ? decodeURIComponent(pathParts[1]) : undefined;

  const newCount = previewRequests.filter((r) => r.status === "new").length;
  const notificationCount = countPreviewModuleStatus("notifications", "new");

  const navItems: ShellNavItem[] = dashboardModules.map((m) => ({
    href: dashboardHref(locale, m.segment),
    label: appDict.dashboard.modules[m.key],
    icon: m.icon,
    group: appDict.dashboard.navGroups[getDashboardNavGroupKey(m.key)],
    count:
      m.key === "requests" ? newCount : m.key === "notifications" ? notificationCount : undefined,
  }));

  const breadcrumbs: ShellBreadcrumbItem[] =
    currentKey === "overview"
      ? [{ label: appDict.dashboard.modules.overview }]
      : [
          {
            label: appDict.dashboard.modules.overview,
            href: dashboardHref(locale),
          },
          { label: appDict.dashboard.navGroups[currentGroupKey] },
          // The module name already serves as the page H1 in the shell topbar,
          // so it is only repeated in the trail when a record detail sits beneath it.
          ...(detailId
            ? [
                {
                  label: appDict.dashboard.modules[currentKey],
                  href: dashboardHref(locale, "projects"),
                },
                { label: detailId },
              ]
            : []),
        ];

  const erpModule =
    pathParts[0] === "erp" ? erpModules.find((item) => item.id === pathParts[1]) : undefined;
  const erpPage = erpModule?.pages.find((item) => item.id === pathParts[2]);
  const erpBreadcrumbs: ShellBreadcrumbItem[] = [
    { label: appDict.dashboard.modules.overview, href: dashboardHref(locale) },
    { label: erpText("workspace", locale), href: erpHref(locale) },
    ...(erpModule
      ? [{ label: pick(erpModule.title, locale), href: erpHref(locale, erpModule.id) }]
      : []),
    ...(erpPage ? [{ label: pick(erpPage.title, locale) }] : []),
  ];
  return (
    <AppShell
      locale={locale}
      appDict={appDict}
      roleLabel={appDict.dashboard.shellRole}
      title={
        pathParts[0] === "erp"
          ? erpPage
            ? pick(erpPage.title, locale)
            : erpModule
              ? pick(erpModule.title, locale)
              : erpText("workspace", locale)
          : appDict.dashboard.modules[currentKey]
      }
      navItems={navItems}
      breadcrumbs={pathParts[0] === "erp" ? erpBreadcrumbs : breadcrumbs}
      navigationContent={
        canAccessErp(role) ? <ErpNavigation locale={locale} role={role} /> : undefined
      }
      shellClassName={`erp-admin-shell${compact ? " erp-density-compact" : ""}`}
      topbarContent={
        canAccessErp(role) ? (
          <ErpHeaderTools
            locale={locale}
            compact={compact}
            onCompactChange={() => setCompact((value) => !value)}
          />
        ) : undefined
      }
      baseSegment="dashboard"
      showSignOut
    >
      <aside className="erp-preview-note" role="note">
        <strong>{erpText("preview", locale)}</strong>
        <p>{erpText("previewNote", locale)}</p>
      </aside>
      {children}
    </AppShell>
  );
}
