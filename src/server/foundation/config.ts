/**
 * Backend foundation configuration — environment-based, fail-safe.
 *
 * Adapter governance is shared with the intake slice (contract §5.4):
 * the adapter is selected by the `DATA_ADAPTER` env var (name only).
 * The single registered adapter today is the in-memory `fake`, which is
 * REFUSED when NODE_ENV=production. With the variable unset, unknown, or
 * refused, no services are assembled and foundation routes fail closed
 * with `503 DEPENDENCY_UNAVAILABLE` — there is deliberately NO silent
 * fallback to fixtures or in-memory storage in production.
 *
 * Only env-var NAMES and presence booleans are ever derived here; secret
 * values are never read into status output and never logged.
 */

import { isAdminAuthConfigured } from "@/lib/admin-auth";
import type { SystemStatusDTO } from "@/lib/api-types";

/** Adapter names registered in `runtime.ts`. Adding one is a contract change. */
export const REGISTERED_ADAPTERS = ["fake"] as const;
export type RegisteredAdapterName = (typeof REGISTERED_ADAPTERS)[number];

/** Single-workspace default; overridable by env NAME `BLACKX_WORKSPACE_ID`. */
const DEFAULT_WORKSPACE_ID = "blackx";

export type AdapterSelection =
  | { kind: "unconfigured"; requested: string | null }
  | { kind: "refused"; requested: string; reason: "fake_in_production" | "unknown_adapter" }
  | { kind: "active"; name: RegisteredAdapterName; productionCapable: boolean };

export function getAdapterSelection(env: NodeJS.ProcessEnv = process.env): AdapterSelection {
  const requested = env.DATA_ADAPTER?.trim() || null;
  if (requested === null) return { kind: "unconfigured", requested: null };
  if (!(REGISTERED_ADAPTERS as readonly string[]).includes(requested)) {
    return { kind: "refused", requested, reason: "unknown_adapter" };
  }
  if (requested === "fake" && env.NODE_ENV === "production") {
    return { kind: "refused", requested, reason: "fake_in_production" };
  }
  return {
    kind: "active",
    name: requested as RegisteredAdapterName,
    // The in-memory fake loses state on restart and is per-process; it
    // can never be a production database (contract §5.4).
    productionCapable: false,
  };
}

/**
 * The workspace every record is scoped to. Multi-company access is not
 * enabled: there is exactly one workspace, resolved server-side (never
 * from client input), so enabling more later is a config/identity
 * change rather than a schema redesign.
 */
export function getWorkspaceId(env: NodeJS.ProcessEnv = process.env): string {
  return env.BLACKX_WORKSPACE_ID?.trim() || DEFAULT_WORKSPACE_ID;
}

export function getEnvironmentKind(
  env: NodeJS.ProcessEnv = process.env,
): SystemStatusDTO["environment"] {
  if (env.NODE_ENV === "production") return "production";
  if (env.NODE_ENV === "test") return "test";
  return "development";
}

/** Domain implementation status — the single source mirrored in docs/OpenAPI. */
export const DOMAIN_STATUS: SystemStatusDTO["domains"] = {
  implemented: ["customers", "intake", "identity-reads", "workspace", "system"],
  readOnly: [
    "users",
    "projects",
    "milestones",
    "progress",
    "diary",
    "findings",
    "reports",
    "inspections",
    "quotations",
    "contracts",
    "handover",
    "warranty",
    "documents",
    "audit-events",
    "finance",
    "complaints",
  ],
  planned: [
    "user-administration",
    "engineers",
    "invitations",
    "password-reset",
    "request-mutations",
    "inspection-writes",
    "quotation-workflow",
    "contract-workflow",
    "project-writes",
    "document-uploads",
    "finance-writes",
    "complaint-writes",
    "notification-sending",
    "audit-exports",
    "customer-portal-api",
  ],
};

/**
 * Safe operational status: presence booleans and names only, never
 * values. `authConfigured` always reflects the real process env via
 * `isAdminAuthConfigured` (single source in `@/lib/admin-auth`); the
 * `env` parameter drives adapter/workspace selection for tests.
 */
export function getSystemStatus(env: NodeJS.ProcessEnv = process.env): SystemStatusDTO {
  const selection = getAdapterSelection(env);
  return {
    environment: getEnvironmentKind(env),
    apiVersion: "v1",
    authConfigured: isAdminAuthConfigured(),
    dataAdapter:
      selection.kind === "active"
        ? {
            configured: true,
            name: selection.name,
            productionCapable: selection.productionCapable,
          }
        : { configured: false, name: null, productionCapable: false },
    workspaceId: getWorkspaceId(env),
    domains: DOMAIN_STATUS,
  };
}
