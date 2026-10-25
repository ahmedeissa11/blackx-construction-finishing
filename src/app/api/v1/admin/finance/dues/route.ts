/**
 * GET receivables/dues with computed balances (READ).
 * Foundation-proposed surface (not in api-contract v1); writes are
 * planned behind the currency/tax and allocation policies (TBD-PO-04).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/finance/dues", async (services, actor) => ({
    body: await services.listDues(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/finance/dues", ["TBD-PO-04"]);
}
