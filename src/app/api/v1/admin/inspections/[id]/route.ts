/**
 * GET inspection detail (READ). PATCH planned (TBD-PO-13/03).
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
    "/api/v1/admin/inspections/{id}",
    async (services, actor) => ({
      body: await services.getInspection(actor, id),
    }),
    request,
  );
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/inspections/{id}", ["TBD-PO-13", "TBD-PO-03"]);
}
