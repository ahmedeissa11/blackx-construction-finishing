/**
 * Contract detail + writes are planned with the contract
 * workflow (TBD-PO-05). Summaries are available on the list endpoint.
 */
import { handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/contracts/{id}", ["TBD-PO-05"]);
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/contracts/{id}", ["TBD-PO-05"]);
}
