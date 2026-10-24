/**
 * Authorization + transport guard for the staff intake read routes.
 *
 * PROVISIONAL until TBD-PO-03 approves the staff role matrix (§1.3,
 * §3.11): the only staff identity that exists today is the single
 * company-owner account, so these reads require exactly that session
 * (the same `owner_review` gate the dashboard already enforces in
 * layouts/middleware). There is deliberately NO "any signed-in user"
 * or blanket-STAFF fallback — unauthenticated ⇒ 401, any other role ⇒
 * 403. When real staff accounts land, this single check is replaced by
 * the approved role + resource predicates.
 */

import { getReviewSession } from "@/auth";
import { OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";
import { IntakeError } from "./ports";
import { getAdminIntakeReads } from "./runtime";
import { intakeErrorResponse, jsonOk } from "./http";
import type { AdminIntakeReads } from "./admin-reads";

async function requireOwnerSession(): Promise<void> {
  const session = await getReviewSession();
  if (!session?.user) {
    throw new IntakeError("UNAUTHENTICATED");
  }
  if (session.user.role !== OWNER_REVIEW_ROLE) {
    throw new IntakeError("FORBIDDEN");
  }
}

/**
 * Runs an admin read with authentication checked BEFORE adapter state,
 * so anonymous callers learn nothing about server configuration.
 * Adapter unconfigured/refused (incl. fake in production) ⇒ 503.
 */
export async function handleAdminIntakeGet(
  read: (reads: AdminIntakeReads) => Promise<unknown>,
): Promise<Response> {
  try {
    await requireOwnerSession();
    const reads = getAdminIntakeReads();
    if (!reads) {
      throw new IntakeError("DEPENDENCY_UNAVAILABLE", {
        messageKey: "errors.intakeUnavailable",
      });
    }
    return jsonOk(await read(reads));
  } catch (error) {
    return intakeErrorResponse(error);
  }
}
