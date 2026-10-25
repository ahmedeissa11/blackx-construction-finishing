/**
 * GET /api/v1/admin/projects/{id} (READ). PATCH is planned
 * (status transitions need contract §4.4 + TBD-PO-03 predicates).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute(
    "/api/v1/admin/projects/{id}",
    async (services, actor) => ({
      body: await services.getProject(actor, id),
    }),
    request,
  );
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/projects/{id}", ["TBD-PO-03"]);
}
