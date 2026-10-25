/**
 * GET /api/v1/admin/openapi.json — the OpenAPI 3.1 contract for the
 * business API, owner-gated like every staff surface. The committed
 * docs/openapi.json is generated from the same object (drift-tested).
 */
import { handleOwnerOnlyRoute } from "@/server/foundation/admin-http";
import { openApiSpec } from "@/server/foundation/openapi";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return handleOwnerOnlyRoute("/api/v1/admin/openapi.json", async () => ({
    body: openApiSpec,
  }));
}
