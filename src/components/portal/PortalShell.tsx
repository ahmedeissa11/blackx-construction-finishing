"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
import { getAppDictionary } from "@/content/app-dictionary";
import { portalHref, portalNav } from "@/config/navigation";
import { previewIssues } from "@/content/preview-data";
import { AppShell, type ShellNavItem } from "@/components/ui/AppShell";

export function PortalShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  const appDict = getAppDictionary(locale);
  const pathname = usePathname() ?? "";
  const base = `/${locale}/portal`;
  const rest = pathname.replace(base, "").replace(/^\//, "");
  const currentKey = portalNav.find((m) => m.segment === rest.split("/")[0])?.key ?? "overview";

  const openIssues = previewIssues.filter((i) => i.status !== "resolved").length;

  const navItems: ShellNavItem[] = portalNav.map((item) => ({
    href: portalHref(locale, item.segment),
    label: appDict.portal.nav[item.key],
    icon: item.icon,
    count: item.key === "issues" ? openIssues : undefined,
  }));

  return (
    <AppShell
      locale={locale}
      appDict={appDict}
      roleLabel={appDict.portal.shellRole}
      title={appDict.portal.nav[currentKey]}
      navItems={navItems}
      baseSegment="portal"
      showSignOut
    >
      {children}
    </AppShell>
  );
}
