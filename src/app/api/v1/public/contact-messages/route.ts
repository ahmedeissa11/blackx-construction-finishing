/**
 * POST /api/v1/public/contact-messages (contract §3.1).
 * Public intake: validate → rate-limit → idempotent atomic save
 * (message + audit + staff-alert intent) → 201 IntakeReceipt.
 * Persistence goes through the intake ports; see src/server/intake/.
 */
import { handleIntakePost } from "@/server/intake/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleIntakePost(request, (service) => service.submitContactMessage);
}
