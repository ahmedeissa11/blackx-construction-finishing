/**
 * GET suppliers (READ). Writes planned (TBD-PO-03 predicates).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/finance/suppliers", async (services, actor) => ({
    body: await services.listSuppliers(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/finance/suppliers", ["TBD-PO-03"]);
}
