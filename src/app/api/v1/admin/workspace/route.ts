/**
 * GET /api/v1/admin/workspace — current workspace surface
 * (single-workspace today; multi-company is prepared, not enabled).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleFoundationRoute(
    "/api/v1/admin/workspace",
    async (services, actor) => ({
      body: services.getWorkspace(actor),
    }),
    request,
  );
}
