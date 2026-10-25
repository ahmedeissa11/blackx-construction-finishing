/**
 * GET one purchase (READ).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute("/api/v1/admin/finance/purchases/{id}", async (services, actor) => ({
    body: await services.getPurchase(actor, id),
  }));
}
