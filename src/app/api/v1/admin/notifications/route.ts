/**
 * GET /api/v1/admin/notifications (contract §3.9, READ).
 * Staff visibility over the notification outbox — queued intents only;
 * no sending exists yet (PO-01/TECH-06), and review/retry mutations are
 * intentionally absent until TBD-PO-03. Owner-session gate per
 * src/server/intake/admin-http.ts.
 */
import { handleAdminIntakeGet } from "@/server/intake/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  return handleAdminIntakeGet((reads) => reads.listNotifications(searchParams));
}
