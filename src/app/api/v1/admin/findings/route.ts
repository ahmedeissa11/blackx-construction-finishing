/**
 * GET /api/v1/admin/findings — issues + quality findings (READ).
 * POST is planned (assignment/authority TBD-PO-03).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/findings", async (services, actor) => ({
    body: await services.listFindings(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/findings", ["TBD-PO-03"]);
}
