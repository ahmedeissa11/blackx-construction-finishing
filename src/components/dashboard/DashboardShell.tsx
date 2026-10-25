"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getAppDictionary } from "@/content/app-dictionary";
import { dashboardHref, dashboardModules, getDashboardNavGroupKey } from "@/config/navigation";
import { previewRequests } from "@/content/preview-data";
import { countPreviewModuleStatus } from "@/content/preview-modules";
import { AppShell, type ShellBreadcrumbItem, type ShellNavItem } from "@/components/ui/AppShell";

export function DashboardShell({ locale, children }: { locale: Locale; children: ReactNode }) {
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

  return (
    <AppShell
      locale={locale}
      appDict={appDict}
      roleLabel={appDict.dashboard.shellRole}
      title={appDict.dashboard.modules[currentKey]}
      navItems={navItems}
      breadcrumbs={breadcrumbs}
      baseSegment="dashboard"
      showSignOut
    >
      {children}
    </AppShell>
  );
}
