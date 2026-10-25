/**
 * Foundation runtime assembly + adapter governance (contract §5.4).
 *
 * Same rules as the intake runtime: selection by the `DATA_ADAPTER`
 * env var NAME; the only registered adapter is the in-memory `fake`,
 * refused in production. Unconfigured/unknown/refused ⇒ no services are
 * assembled and routes fail closed with 503 — nothing silently falls
 * back to fixtures or in-memory storage, and no write can fake success.
 * Registering the database colleague's real adapter here is a future
 * authorized task gated on the foundation contract suite passing
 * against it (see docs/database-integration-contract.md).
 */

import { getAdapterSelection } from "./config";
import { createFakeFoundationAdapter } from "./fake-adapter";
import { logInfo, logWarn } from "./logger";
import { createFoundationServices, type FoundationServices } from "./services";

/**
 * The dev/test fake must be ONE store per process (same reason as the
 * intake runtime): Next.js can load this module in several route graphs
 * in dev. With the real adapter, state lives in the colleague's
 * database and this cache holds only connection-level objects.
 */
const globalCache = globalThis as typeof globalThis & {
  __blackxFoundationServices?: FoundationServices;
  __blackxFoundationRefusalLogged?: boolean;
};

export function getFoundationServices(): FoundationServices | null {
  const selection = getAdapterSelection();
  if (selection.kind !== "active") {
    if (selection.kind === "refused" && !globalCache.__blackxFoundationRefusalLogged) {
      globalCache.__blackxFoundationRefusalLogged = true;
      // Names/booleans only — never env values (logger redacts regardless).
      logWarn("foundation.adapter_refused", { reason: selection.reason });
    }
    return null;
  }
  if (!globalCache.__blackxFoundationServices) {
    const { ports } = createFakeFoundationAdapter();
    globalCache.__blackxFoundationServices = createFoundationServices(ports);
    logInfo("foundation.adapter_active", {
      adapter: selection.name,
      productionCapable: selection.productionCapable,
    });
  }
  return globalCache.__blackxFoundationServices;
}

/** Test support: drop cached assembly so env changes take effect. */
export function resetFoundationCacheForTests(): void {
  delete globalCache.__blackxFoundationServices;
  delete globalCache.__blackxFoundationRefusalLogged;
}
