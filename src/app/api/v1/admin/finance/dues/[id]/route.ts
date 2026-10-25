/**
 * GET one due with computed balance (READ).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute("/api/v1/admin/finance/dues/{id}", async (services, actor) => ({
    body: await services.getDue(actor, id),
  }));
}
