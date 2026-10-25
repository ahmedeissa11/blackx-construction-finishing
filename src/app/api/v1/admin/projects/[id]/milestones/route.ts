/**
 * GET project milestones (READ). Writes planned with project
 * operations (TBD-PO-03).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/projects/{id}/milestones",
    async (services, actor) => ({
      body: await services.listProjectMilestones(actor, id, searchParams),
    }),
  );
}
