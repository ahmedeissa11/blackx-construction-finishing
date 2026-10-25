/**
 * Quotation detail + writes are planned with the quotation
 * workflow (TBD-PO-04/04A, TBD-PO-03). Summaries are available on
 * the list endpoint.
 */
import { handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/quotations/{id}", ["TBD-PO-04", "TBD-PO-04A"]);
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/quotations/{id}", [
    "TBD-PO-04",
    "TBD-PO-04A",
    "TBD-PO-03",
  ]);
}
