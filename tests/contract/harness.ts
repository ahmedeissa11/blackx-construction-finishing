/**
 * BX-104 — Adapter-agnostic contract-test harness.
 *
 * Purpose: one shared, behavior-only test suite must be runnable against
 * any interchangeable implementation ("adapter") of the same port —
 * today the neutral in-memory dummy, later (only under separate,
 * explicitly authorized tasks) a fake adapter and the database
 * colleague's real adapter for the ports proposed in
 * `docs/api-contract-v1.md` §5. This file defines the harness mechanics
 * only. It invents no business rules and chooses no database, ORM,
 * physical schema, or migration approach.
 *
 * Deterministic setup/reset conventions (see tests/contract/README.md):
 *
 * - `create()` MUST return a new, completely empty port instance. The
 *   harness calls it before every test, so tests never share state and
 *   never depend on execution order.
 * - `reset(port)` MUST remove all state while keeping the port usable.
 *   For a future real adapter this maps to the colleague's documented
 *   disposable-test-database reset procedure (TBD-DB-07 in the API
 *   contract) — the mechanism is theirs; the observable "empty again"
 *   behavior is what suites assert.
 * - `dispose(port)`, when present, releases resources after each test.
 * - Suites must be deterministic: no wall-clock, randomness, network, or
 *   reliance on test order. Where time or IDs matter, future suites use
 *   the injected Clock/IdGenerator pattern proposed in the API contract.
 *
 * Adapter selection: the `CONTRACT_ADAPTER` environment variable names
 * the registered adapter to run. Unset, the registry's default runs.
 * Naming an unregistered adapter fails loudly at collection time and
 * lists the registered names — a suite must never silently fall back to
 * a different implementation than the one requested.
 */

import { afterEach, beforeEach, describe } from "vitest";

export interface ContractAdapter<TPort> {
  /** Stable selection name, e.g. "memory-dummy". Never rename in place. */
  readonly name: string;
  /** Returns a new, completely empty port instance. */
  create(): Promise<TPort>;
  /** Removes all state; the port must remain usable afterwards. */
  reset(port: TPort): Promise<void>;
  /** Optional resource cleanup after each test. */
  dispose?(port: TPort): Promise<void>;
}

/** Environment variable that selects which registered adapter runs. */
export const ADAPTER_ENV_VAR = "CONTRACT_ADAPTER";

/**
 * Resolves the adapter to run from a registry.
 *
 * - `requested` undefined/empty → `defaultName` if given, else the first
 *   registered adapter.
 * - `requested` naming no registered adapter → throws, listing every
 *   registered name. There is intentionally no silent fallback.
 */
export function resolveAdapter<TPort>(
  registry: readonly ContractAdapter<TPort>[],
  requested: string | undefined,
  defaultName?: string,
): ContractAdapter<TPort> {
  if (registry.length === 0) {
    throw new Error("Contract harness: adapter registry is empty.");
  }
  const wanted = requested?.trim() ? requested.trim() : defaultName;
  if (wanted === undefined) {
    // Registry is non-empty (checked above); index 0 is defined.
    return registry[0] as ContractAdapter<TPort>;
  }
  const match = registry.find((adapter) => adapter.name === wanted);
  if (!match) {
    const available = registry.map((adapter) => adapter.name).join(", ");
    throw new Error(
      `Contract harness: no adapter named "${wanted}" is registered. ` +
        `Registered adapters: ${available}. ` +
        `Set ${ADAPTER_ENV_VAR} to one of those names, or leave it unset for the default.`,
    );
  }
  return match;
}

/** Convenience: resolve using the CONTRACT_ADAPTER environment variable. */
export function resolveAdapterFromEnv<TPort>(
  registry: readonly ContractAdapter<TPort>[],
  defaultName?: string,
): ContractAdapter<TPort> {
  return resolveAdapter(registry, process.env[ADAPTER_ENV_VAR], defaultName);
}

/**
 * Runs a shared contract suite against one resolved adapter. The suite
 * receives `getPort()`; every test inside it gets a fresh, empty port
 * instance created in `beforeEach`, and `dispose` (if any) runs in
 * `afterEach`. The identical suite function is reused verbatim when a
 * second adapter is registered — that reuse is the point of BX-104.
 */
export function describeWithAdapter<TPort>(
  title: string,
  adapter: ContractAdapter<TPort>,
  suite: (getPort: () => TPort) => void,
): void {
  describe(`${title} [adapter: ${adapter.name}]`, () => {
    let port: TPort;

    beforeEach(async () => {
      port = await adapter.create();
    });

    afterEach(async () => {
      await adapter.dispose?.(port);
    });

    suite(() => port);
  });
}
