/**
 * POST /api/v1/public/inspection-requests (contract §3.1).
 * Public intake: validate → rate-limit → idempotent atomic save
 * (request + history + audit + outbox intents) → 201 IntakeReceipt.
 * Persistence goes through the intake ports; see src/server/intake/.
 */
import { handleIntakePost } from "@/server/intake/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  return handleIntakePost(request, (service) => service.submitInspectionRequest);
}
