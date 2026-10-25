/**
 * GET /api/v1/admin/projects (READ). POST is planned: project
 * creation is contract-derived (contract §2.6) and gated on the
 * contract workflow decisions (TBD-PO-05, TBD-PO-03).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/projects",
    async (services, actor) => ({
      body: await services.listProjects(actor, searchParams),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/projects", ["TBD-PO-05", "TBD-PO-03"]);
}
