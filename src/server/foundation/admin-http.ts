/**
 * Authorization + dispatch guard for foundation staff routes.
 *
 * PROVISIONAL until TBD-PO-03 approves the staff role matrix — exactly
 * like the intake guard: the only staff identity that exists today is
 * the single company-owner account, so every foundation staff route
 * requires that session. Authentication is checked BEFORE adapter
 * state and BEFORE the planned/not-implemented marker, so anonymous
 * callers learn nothing about server configuration or roadmap:
 * unauthenticated ⇒ 401, wrong role ⇒ 403, adapter unavailable ⇒ 503,
 * domain write not yet implemented ⇒ 501 (never a fake success).
 *
 * When real staff accounts land, `requireActor` is the single place
 * that swaps the environment-owner resolution for the user store and
 * the approved role + resource predicates (contract §3.11).
 */

import { getReviewSession } from "@/auth";
import { OWNER_REVIEW_ROLE } from "@/lib/review-auth-shared";
import { getWorkspaceId } from "./config";
import { ApiError } from "./errors";
import { apiErrorResponse, jsonResponse } from "./http";
import { newCorrelationId } from "./logger";
import { getFoundationServices } from "./runtime";
import type { Actor, FoundationServices } from "./services";

async function requireActor(): Promise<Actor> {
  const session = await getReviewSession();
  if (!session?.user) {
    throw new ApiError("UNAUTHENTICATED");
  }
  if (session.user.role !== OWNER_REVIEW_ROLE) {
    throw new ApiError("FORBIDDEN");
  }
  return {
    // The environment owner's stable id (see src/lib/admin-auth.ts).
    userId: "owner-review",
    email: session.user.email ?? "",
    displayName: session.user.name ?? "Company Owner Review",
    role: "OWN",
    workspaceId: getWorkspaceId(),
    provisioning: "environment",
  };
}

export interface FoundationRouteResult {
  body: unknown;
  status?: number;
}

/**
 * Runs a foundation staff handler: auth → adapter availability →
 * handler. `routeTemplate` is used only for structured logging (never
 * concrete IDs or query data).
 */
export async function handleFoundationRoute(
  routeTemplate: string,
  handler: (
    services: FoundationServices,
    actor: Actor,
    correlationId: string,
  ) => Promise<FoundationRouteResult>,
): Promise<Response> {
  const correlationId = newCorrelationId();
  try {
    const actor = await requireActor();
    const services = getFoundationServices();
    if (!services) {
      // No real adapter is registered yet, or the fake was requested in
      // production. Fail closed: nothing is read from or written to
      // fixtures/memory, and no success is ever faked.
      throw new ApiError("DEPENDENCY_UNAVAILABLE");
    }
    const result = await handler(services, actor, correlationId);
    return jsonResponse(result.body, result.status ?? 200);
  } catch (error) {
    return apiErrorResponse(error, { routeTemplate, correlationId });
  }
}

/**
 * Marker for endpoints whose ports/DTOs exist but whose write behavior
 * is gated on an open owner decision. Auth still applies first; the
 * response names the blocking decision register IDs so clients and
 * reviewers can see exactly why the operation does not exist yet.
 */
export async function handlePlannedRoute(
  routeTemplate: string,
  blockedBy: readonly string[],
): Promise<Response> {
  const correlationId = newCorrelationId();
  try {
    await requireActor();
    throw new ApiError("NOT_IMPLEMENTED", { details: { blockedBy: [...blockedBy] } });
  } catch (error) {
    return apiErrorResponse(error, { routeTemplate, correlationId });
  }
}

/** Owner-gated responses that do not need the data adapter (status/spec). */
export async function handleOwnerOnlyRoute(
  routeTemplate: string,
  handler: (actor: Actor) => Promise<FoundationRouteResult>,
): Promise<Response> {
  const correlationId = newCorrelationId();
  try {
    const actor = await requireActor();
    const result = await handler(actor);
    return jsonResponse(result.body, result.status ?? 200);
  } catch (error) {
    return apiErrorResponse(error, { routeTemplate, correlationId });
  }
}

/** Identity read open to any signed-in session (contract §3.2 `GET /me`). */
export async function handleMeRoute(routeTemplate: string): Promise<Response> {
  const correlationId = newCorrelationId();
  try {
    const session = await getReviewSession();
    if (!session?.user) {
      throw new ApiError("UNAUTHENTICATED");
    }
    if (session.user.role !== OWNER_REVIEW_ROLE) {
      // No other identity kind exists yet; unknown roles get nothing.
      throw new ApiError("FORBIDDEN");
    }
    const services = getFoundationServices();
    const actor: Actor = {
      userId: "owner-review",
      email: session.user.email ?? "",
      displayName: session.user.name ?? "Company Owner Review",
      role: "OWN",
      workspaceId: getWorkspaceId(),
      provisioning: "environment",
    };
    if (!services) {
      // Identity comes from the session, not the data adapter — it must
      // work even while no database adapter is configured.
      return jsonResponse({
        id: actor.userId,
        email: actor.email,
        displayName: actor.displayName,
        role: actor.role,
        status: "active",
        provisioning: actor.provisioning,
      });
    }
    return jsonResponse(services.getCurrentUser(actor));
  } catch (error) {
    return apiErrorResponse(error, { routeTemplate, correlationId });
  }
}
