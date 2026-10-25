/**
 * GET /api/v1/admin/users — database users (empty until staff
 * accounts exist). POST (create staff user) is planned: it needs the
 * approved role matrix and identity lifecycle (TBD-PO-03, TBD-TECH-01)
 * and must never be faked.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/users",
    async (services, actor) => ({
      body: await services.listUsers(actor, searchParams),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/users", ["TBD-PO-03", "TBD-TECH-01"]);
}
