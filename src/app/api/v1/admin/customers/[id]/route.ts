/**
 * /api/v1/admin/customers/{id} (contract §3.3).
 * GET detail (READ) · PATCH with expected version (§1.8).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";
import { readJsonBody } from "@/server/foundation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute("/api/v1/admin/customers/{id}", async (services, actor) => ({
    body: await services.getCustomer(actor, id),
  }));
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleFoundationRoute(
    "/api/v1/admin/customers/{id}",
    async (services, actor, correlationId) => ({
      body: await services.updateCustomer(actor, id, await readJsonBody(request), correlationId),
    }),
  );
}
