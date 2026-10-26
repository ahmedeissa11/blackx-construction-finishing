import type { ReactNode } from "react";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import "@/styles/erp.css";
import "@/styles/admin-theme.css";
import "@/styles/admin-workspace.css";
import { AdminThemeProvider } from "@/components/dashboard/AdminTheme";
import { DashboardShell } from "@/components/dashboard/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  const session = await requireReviewAccess(locale);
  return (
    <AdminThemeProvider>
      <DashboardShell locale={locale} role={session.user?.role}>
        {children}
      </DashboardShell>
    </AdminThemeProvider>
  );
}
