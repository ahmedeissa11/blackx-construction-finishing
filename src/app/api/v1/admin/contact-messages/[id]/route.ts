/**
 * GET /api/v1/admin/contact-messages/{id} (contract §3.3, READ).
 * Owner-session staff read over the intake ports; see
 * src/server/intake/admin-http.ts for the provisional PO-03 gate.
 */
import { handleAdminIntakeGet } from "@/server/intake/admin-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;
  return handleAdminIntakeGet((reads) => reads.getContactMessage(id));
}
