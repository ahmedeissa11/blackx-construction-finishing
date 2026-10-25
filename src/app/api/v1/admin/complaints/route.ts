/**
 * GET complaints/suggestions (READ, staff projection incl.
 * internal replies). Writes and the customer-visible projection are
 * planned behind TBD-PO-08 (portal visibility approvals).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/complaints",
    async (services, actor) => ({
      body: await services.listComplaints(actor, searchParams),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/complaints", ["TBD-PO-08", "TBD-PO-03"]);
}
