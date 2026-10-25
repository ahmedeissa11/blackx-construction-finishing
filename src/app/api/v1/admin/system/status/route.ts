/**
 * GET /api/v1/admin/system/status — owner-gated operational status.
 * Presence booleans and names only; never secret values.
 */
import { handleOwnerOnlyRoute } from "@/server/foundation/admin-http";
import { getSystemStatus } from "@/server/foundation/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return handleOwnerOnlyRoute("/api/v1/admin/system/status", async () => ({
    body: getSystemStatus(),
  }));
}
