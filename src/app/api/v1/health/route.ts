/**
 * GET /api/v1/health — liveness. Public and intentionally minimal:
 * process-up only, no configuration or dependency detail (see
 * /api/v1/ready for readiness and the owner-gated system status for
 * diagnostics).
 */
import { jsonResponse } from "@/server/foundation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return jsonResponse({ status: "ok" });
}
