import type { ReactNode } from "react";
import { requireReviewAccess } from "@/auth";
import { resolveLocale } from "@/lib/locale-params";
import { PortalShell } from "@/components/portal/PortalShell";

export const dynamic = "force-dynamic";

export default async function PortalLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const locale = await resolveLocale(params);
  await requireReviewAccess(locale);
  return <PortalShell locale={locale}>{children}</PortalShell>;
}
