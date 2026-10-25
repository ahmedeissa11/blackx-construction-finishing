/**
 * GET /api/v1/admin/quotations — summary reads (READ). The
 * quotation workflow (revisions, review, send, decisions) is planned
 * behind TBD-PO-04/04A and TBD-PO-03; nothing here invents tax or
 * currency policy.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/quotations",
    async (services, actor) => ({
      body: await services.listQuotations(actor, searchParams),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/quotations", ["TBD-PO-04", "TBD-PO-04A", "TBD-PO-03"]);
}
