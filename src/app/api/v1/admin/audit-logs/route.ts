/**
 * GET /api/v1/admin/audit-logs (contract §3.9, READ).
 * Viewing the audit log appends no audit entry. Owner-session gate per
 * src/server/intake/admin-http.ts (provisional until TBD-PO-03).
 */
import { handleAdminIntakeGet } from "@/server/intake/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleAdminIntakeGet((reads) => reads.listAuditLogs(searchParams));
}
