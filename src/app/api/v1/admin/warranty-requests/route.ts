/**
 * GET warranty requests (READ). Writes planned: warranty
 * period/coverage policy is TBD-PO-14 and must never be asserted by
 * the API before it exists.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/warranty-requests", async (services, actor) => ({
    body: await services.listWarrantyRequests(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/warranty-requests", ["TBD-PO-14", "TBD-PO-03"]);
}
