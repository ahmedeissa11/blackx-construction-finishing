/**
 * GET document metadata detail (READ; storage keys never
 * exposed). Metadata PATCH planned (TBD-PO-06/TBD-PO-08 visibility).
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute("/api/v1/admin/documents/{id}", async (services, actor) => ({
    body: await services.getDocument(actor, id),
  }));
}

export async function PATCH(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/documents/{id}", ["TBD-PO-06", "TBD-PO-08"]);
}
