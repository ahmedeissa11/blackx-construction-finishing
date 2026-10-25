/**
 * GET /api/v1/admin/projects/{id}/handover (READ). Creation/checklist
 * updates/completion are planned (templates TBD-PO-06, acknowledgement
 * TBD-PO-05).
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
    "/api/v1/admin/projects/{id}/handover",
    async (services, actor) => ({
      body: await services.getProjectHandover(actor, id),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/projects/{id}/handover", ["TBD-PO-06", "TBD-PO-05"]);
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/projects/{id}/handover", ["TBD-PO-06", "TBD-PO-05"]);
}
