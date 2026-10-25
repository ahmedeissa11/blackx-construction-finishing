/**
 * GET progress measurements (READ, immutable records). Create
 * is planned; the progress derivation rule is TBD-PO-18.
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
    "/api/v1/admin/projects/{id}/progress-measurements",
    async (services, actor) => ({
      body: await services.listProjectProgress(actor, id, searchParams),
    }),
  );
}
