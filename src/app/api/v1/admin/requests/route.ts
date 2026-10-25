/**
 * GET /api/v1/admin/requests (contract §3.4, READ).
 * Owner-session staff read over the intake ports; see
 * src/server/intake/admin-http.ts for the provisional PO-03 gate.
 */
import { handleAdminIntakeGet } from "@/server/intake/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleAdminIntakeGet((reads) => reads.listRequests(searchParams));
}
