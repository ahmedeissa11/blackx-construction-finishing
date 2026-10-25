/**
 * GET /api/v1/admin/contracts — summary reads (READ). Contract
 * creation/issuance/signature recording is planned (TBD-PO-05).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/contracts",
    async (services, actor) => ({
      body: await services.listContracts(actor, searchParams),
    }),
    request,
  );
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/contracts", ["TBD-PO-05", "TBD-PO-04"]);
}
