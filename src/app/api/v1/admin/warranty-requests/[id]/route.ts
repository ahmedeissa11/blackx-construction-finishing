/**
 * GET warranty request detail (READ). PATCH planned (TBD-PO-14).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute("/api/v1/admin/warranty-requests/{id}", async (services, actor) => ({
    body: await services.getWarrantyRequest(actor, id),
  }));
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/warranty-requests/{id}", ["TBD-PO-14"]);
}
