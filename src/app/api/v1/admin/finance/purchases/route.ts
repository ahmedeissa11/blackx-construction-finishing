/**
 * GET purchases with computed totals (READ). Writes planned
 * (TBD-PO-04 finance policies).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/finance/purchases", async (services, actor) => ({
    body: await services.listPurchases(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/finance/purchases", ["TBD-PO-04"]);
}
