/**
 * BX-104 — Neutral probe port used ONLY to prove the contract-test harness.
 *
 * This is deliberately NOT a business port. It carries no BLACK X domain
 * semantics (no customers, projects, quotations, or finance), selects no
 * database/ORM/schema, and must never be imported by application code in
 * `src/`. Its sole purpose is to verify that one shared contract suite can
 * run unchanged against interchangeable adapters, as required for the
 * future repository ports proposed in `docs/api-contract-v1.md` (§5, §8).
 *
 * The observable semantics below are the contract every probe adapter must
 * honor. They are intentionally small and deterministic:
 *
 * - A freshly created store is empty.
 * - `put` inserts or overwrites by `key`.
 * - `get` returns `null` for a missing key (never `undefined`, never throws).
 * - `list` returns every record sorted by `key` in ascending code-point
 *   order, regardless of insertion order.
 * - Records returned by `get`/`list` are copies: mutating a returned record
 *   must not affect stored state.
 */

export interface ProbeRecord {
  key: string;
  value: string;
}

export interface ProbeStore {
  put(record: ProbeRecord): Promise<void>;
  get(key: string): Promise<ProbeRecord | null>;
  list(): Promise<ProbeRecord[]>;
  size(): Promise<number>;
}
