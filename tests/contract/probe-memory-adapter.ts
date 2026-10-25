/**
 * BX-104 — In-memory dummy implementation of the neutral probe port.
 *
 * Test-only. This is a harness fixture, NOT a database adapter and NOT
 * the governed fake adapter proposed in `docs/api-contract-v1.md` §5.4
 * (building that is a separate, future, explicitly authorized task).
 * It exists so the probe contract suite has one real implementation to
 * run against today, proving test selection, fresh-instance isolation,
 * and reset behavior without choosing any database technology.
 */

import type { ContractAdapter } from "./harness";
import type { ProbeRecord, ProbeStore } from "./probe-port";

class MemoryProbeStore implements ProbeStore {
  private readonly records = new Map<string, string>();

  async put(record: ProbeRecord): Promise<void> {
    this.records.set(record.key, record.value);
  }

  async get(key: string): Promise<ProbeRecord | null> {
    const value = this.records.get(key);
    return value === undefined ? null : { key, value };
  }

  async list(): Promise<ProbeRecord[]> {
    return [...this.records.entries()]
      .map(([key, value]) => ({ key, value }))
      .sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  }

  async size(): Promise<number> {
    return this.records.size;
  }

  clear(): void {
    this.records.clear();
  }
}

/** Registered under the stable selection name "memory-dummy". */
export const memoryDummyAdapter: ContractAdapter<ProbeStore> = {
  name: "memory-dummy",

  async create(): Promise<ProbeStore> {
    return new MemoryProbeStore();
  },

  async reset(port: ProbeStore): Promise<void> {
    if (port instanceof MemoryProbeStore) {
      port.clear();
    }
  },
};
