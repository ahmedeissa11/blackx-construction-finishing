/**
 * GET /api/v1/admin/overview (contract §3.9, READ).
 * Intake-only honest slice: real counts + recent audit activity computed
 * at request time. Action-queue/metric vocabulary freezes at overview
 * kickoff (see admin-reads.ts). Owner-session gate per admin-http.ts.
 */
import { handleAdminIntakeGet } from "@/server/intake/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return handleAdminIntakeGet((reads) => reads.getOverview());
}
