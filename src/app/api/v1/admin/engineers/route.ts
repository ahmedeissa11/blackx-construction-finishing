/**
 * GET /api/v1/admin/engineers — planned. Engineers are staff users in
 * engineering roles (contract §1.3), not a separate entity; this
 * filtered view arrives with staff accounts (TBD-PO-03).
 */
import { handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/engineers", ["TBD-PO-03"]);
}
