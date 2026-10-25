/**
 * GET /api/v1/ready — readiness to serve traffic. Ready means the app
 * can serve (authentication configured). The data adapter is NOT part
 * of readiness by design: the public site and fail-closed business API
 * operate without it; adapter state is reported only on the
 * owner-gated /api/v1/admin/system/status. No values are exposed.
 */
import { isAdminAuthConfigured } from "@/lib/admin-auth";
import { jsonResponse } from "@/server/foundation/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const ready = isAdminAuthConfigured();
  return jsonResponse({ status: ready ? "ready" : "not_ready" }, ready ? 200 : 503);
}
