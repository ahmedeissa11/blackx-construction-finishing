/**
 * PATCH /api/v1/admin/users/{id} — planned. User administration
 * (roles, disable, session revocation) is gated on the approved role
 * matrix and owner-recovery policy (TBD-PO-03, TBD-TECH-01).
 */
import { handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/users/{id}", ["TBD-PO-03", "TBD-TECH-01"]);
}
