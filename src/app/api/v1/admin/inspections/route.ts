/**
 * GET /api/v1/admin/inspections (READ). POST is planned: the
 * result/measurement schema and scheduling rules are TBD-PO-13 and
 * engineer eligibility is TBD-PO-03.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/inspections", async (services, actor) => ({
    body: await services.listInspections(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/inspections", ["TBD-PO-13", "TBD-PO-03"]);
}
