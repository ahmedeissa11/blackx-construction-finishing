/**
 * BX-104 — Shared probe contract suite (harness proof, not business tests).
 *
 * The suite asserts only the neutral, observable semantics documented in
 * `probe-port.ts`, plus the harness's own guarantees (fresh-instance
 * isolation and reset). It runs against whichever registered adapter
 * `CONTRACT_ADAPTER` selects — today only the in-memory dummy. When a
 * future authorized task registers another probe adapter, this exact
 * suite must pass against it unchanged; that is the conformance pattern
 * the real repository ports (API contract §5/§8) will later follow.
 */

import { describe, expect, it } from "vitest";
import {
  ADAPTER_ENV_VAR,
  describeWithAdapter,
  resolveAdapter,
  resolveAdapterFromEnv,
  type ContractAdapter,
} from "./harness";
import { memoryDummyAdapter } from "./probe-memory-adapter";
import type { ProbeStore } from "./probe-port";

/**
 * Adapter registry. Future adapters (under separate authorization) are
 * added here; suites below never change when the registry grows.
 */
const probeAdapters: readonly ContractAdapter<ProbeStore>[] = [memoryDummyAdapter];

const adapter = resolveAdapterFromEnv(probeAdapters, memoryDummyAdapter.name);

describeWithAdapter("ProbeStore contract", adapter, (getStore) => {
  it("starts empty: size 0, empty list, missing key reads as null", async () => {
    const store = getStore();
    expect(await store.size()).toBe(0);
    expect(await store.list()).toEqual([]);
    expect(await store.get("missing")).toBeNull();
  });

  it("returns a stored record by key", async () => {
    const store = getStore();
    await store.put({ key: "alpha", value: "one" });
    expect(await store.get("alpha")).toEqual({ key: "alpha", value: "one" });
    expect(await store.size()).toBe(1);
  });

  it("overwrites an existing key without growing the store", async () => {
    const store = getStore();
    await store.put({ key: "alpha", value: "one" });
    await store.put({ key: "alpha", value: "two" });
    expect(await store.size()).toBe(1);
    expect(await store.get("alpha")).toEqual({ key: "alpha", value: "two" });
  });

  it("lists records sorted by key regardless of insertion order", async () => {
    const store = getStore();
    await store.put({ key: "gamma", value: "3" });
    await store.put({ key: "alpha", value: "1" });
    await store.put({ key: "beta", value: "2" });
    expect(await store.list()).toEqual([
      { key: "alpha", value: "1" },
      { key: "beta", value: "2" },
      { key: "gamma", value: "3" },
    ]);
  });

  it("returns copies: mutating a returned record does not change stored state", async () => {
    const store = getStore();
    await store.put({ key: "alpha", value: "one" });
    const first = await store.get("alpha");
    expect(first).not.toBeNull();
    if (first) {
      first.value = "mutated";
    }
    expect(await store.get("alpha")).toEqual({ key: "alpha", value: "one" });
  });

  it("reset empties the store and the store remains usable", async () => {
    const store = getStore();
    await store.put({ key: "alpha", value: "one" });
    await store.put({ key: "beta", value: "two" });
    await adapter.reset(store);
    expect(await store.size()).toBe(0);
    expect(await store.list()).toEqual([]);
    expect(await store.get("alpha")).toBeNull();
    await store.put({ key: "after-reset", value: "ok" });
    expect(await store.get("after-reset")).toEqual({ key: "after-reset", value: "ok" });
  });

  it("isolation (writer): state written here must not leak into other tests", async () => {
    const store = getStore();
    await store.put({ key: "leak-check", value: "present" });
    expect(await store.get("leak-check")).not.toBeNull();
  });

  it("isolation (reader): a fresh instance never sees another test's state", async () => {
    const store = getStore();
    expect(await store.get("leak-check")).toBeNull();
    expect(await store.size()).toBe(0);
  });
});

describe("Contract harness adapter selection", () => {
  it("defaults to the registered dummy when nothing is requested", () => {
    expect(resolveAdapter(probeAdapters, undefined, memoryDummyAdapter.name).name).toBe(
      memoryDummyAdapter.name,
    );
    expect(resolveAdapter(probeAdapters, "").name).toBe(memoryDummyAdapter.name);
  });

  it("selects the adapter named by the request", () => {
    expect(resolveAdapter(probeAdapters, memoryDummyAdapter.name).name).toBe(
      memoryDummyAdapter.name,
    );
  });

  it("fails loudly for an unregistered adapter and lists what is registered", () => {
    expect(() => resolveAdapter(probeAdapters, "no-such-adapter")).toThrowError(
      /no adapter named "no-such-adapter"/,
    );
    expect(() => resolveAdapter(probeAdapters, "no-such-adapter")).toThrowError(
      new RegExp(memoryDummyAdapter.name),
    );
    expect(() => resolveAdapter(probeAdapters, "no-such-adapter")).toThrowError(
      new RegExp(ADAPTER_ENV_VAR),
    );
  });

  it("rejects an empty registry instead of running against nothing", () => {
    expect(() => resolveAdapter<ProbeStore>([], undefined)).toThrowError(/registry is empty/);
  });
});
