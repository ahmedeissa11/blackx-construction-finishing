/**
 * GET /api/v1/me (contract §3.2) — the session user's identity.
 * Works without a data adapter: identity comes from the session.
 */
import { handleMeRoute } from "@/server/foundation/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  return handleMeRoute("/api/v1/me");
}
