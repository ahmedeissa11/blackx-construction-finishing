/**
 * GET document metadata (READ). Uploads are planned: object
 * storage ownership/handshake are TBD-DB-09/TBD-TECH-05 and the
 * docType allow-list is TBD-PO-06. No file bytes are accepted here.
 */
import { handleFoundationRoute, handlePlannedRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleFoundationRoute("/api/v1/admin/documents", async (services, actor) => ({
    body: await services.listDocuments(actor, searchParams),
  }));
}

export async function POST(): Promise<Response> {
  return handlePlannedRoute("/api/v1/admin/documents", ["TBD-DB-09", "TBD-TECH-05", "TBD-PO-06"]);
}
