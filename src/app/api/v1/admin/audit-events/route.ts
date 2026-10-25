/**
 * GET foundation staff audit events (READ; viewing appends
 * nothing). The intake audit trail remains on /admin/audit-logs; the
 * real adapter must unify storage (integration contract).
 */
import { handleFoundationRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/audit-events", async (services, actor) => ({
    body: await services.listAuditEvents(actor, searchParams),
  }));
}
