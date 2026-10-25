/**
 * /api/v1/admin/customers (contract §3.3).
 * GET list (READ) · POST create (Idempotency-Key required, §1.8).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";
import { readJsonBody } from "@/server/foundation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute(
    "/api/v1/admin/customers",
    async (services, actor) => ({
      body: await services.listCustomers(actor, searchParams),
    }),
    request,
  );
}

export async function POST(request: Request): Promise<Response> {
  return handleFoundationRoute(
    "/api/v1/admin/customers",
    async (services, actor, correlationId) => {
      const body = await readJsonBody(request);
      const result = await services.createCustomer(
        actor,
        body,
        request.headers.get("idempotency-key"),
        correlationId,
      );
      return { body: result.dto, status: result.status };
    },
    request,
  );
}
