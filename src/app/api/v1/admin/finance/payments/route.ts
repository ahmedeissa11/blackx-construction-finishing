/**
 * GET payments (READ). Recording payments is planned behind
 * the finance policies (TBD-PO-04) — the session-only board flow is
 * not persistence and is never presented as such.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/finance/payments", async (services, actor) => ({
    body: await services.listPayments(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/finance/payments", ["TBD-PO-04"]);
}
