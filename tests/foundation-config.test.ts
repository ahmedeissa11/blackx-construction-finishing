/**
 * Foundation adapter governance (contract §5.4): fail-safe selection,
 * no silent fallback, fake refused in production, status output that
 * exposes presence booleans only — never secret values.
 */

import { describe, expect, it } from "vitest";
import { getAdapterSelection, getSystemStatus, getWorkspaceId } from "@/server/foundation/config";
import { getFoundationServices, resetFoundationCacheForTests } from "@/server/foundation/runtime";

function withEnv<T>(env: Record<string, string | undefined>, run: () => T): T {
  const previous = { ...process.env };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetFoundationCacheForTests();
  try {
    return run();
  } finally {
    process.env = previous;
    resetFoundationCacheForTests();
  }
}

describe("adapter selection", () => {
  it("is unconfigured when DATA_ADAPTER is unset", () => {
    expect(getAdapterSelection({} as NodeJS.ProcessEnv)).toEqual({
      kind: "unconfigured",
      requested: null,
    });
  });

  it("refuses unknown adapter names instead of falling back", () => {
    const selection = getAdapterSelection({
      DATA_ADAPTER: "some-vendor",
    } as unknown as NodeJS.ProcessEnv);
    expect(selection).toMatchObject({ kind: "refused", reason: "unknown_adapter" });
  });

  it("refuses the fake in production", () => {
    const selection = getAdapterSelection({
      DATA_ADAPTER: "fake",
      NODE_ENV: "production",
    } as NodeJS.ProcessEnv);
    expect(selection).toMatchObject({ kind: "refused", reason: "fake_in_production" });
  });

  it("activates the fake outside production and never calls it production-capable", () => {
    const selection = getAdapterSelection({
      DATA_ADAPTER: "fake",
      NODE_ENV: "test",
    } as NodeJS.ProcessEnv);
    expect(selection).toEqual({ kind: "active", name: "fake", productionCapable: false });
  });
});

describe("runtime assembly (fail-closed)", () => {
  it("assembles no services when unconfigured", () => {
    withEnv({ DATA_ADAPTER: undefined, NODE_ENV: "test" }, () => {
      expect(getFoundationServices()).toBeNull();
    });
  });

  it("assembles no services for an unknown adapter", () => {
    withEnv({ DATA_ADAPTER: "nope", NODE_ENV: "test" }, () => {
      expect(getFoundationServices()).toBeNull();
    });
  });

  it("assembles no services when the fake is requested in production mode", () => {
    withEnv({ DATA_ADAPTER: "fake", NODE_ENV: "production" }, () => {
      expect(getFoundationServices()).toBeNull();
    });
  });

  it("assembles services for the fake in test mode, as a process singleton", () => {
    withEnv({ DATA_ADAPTER: "fake", NODE_ENV: "test" }, () => {
      const first = getFoundationServices();
      expect(first).not.toBeNull();
      expect(getFoundationServices()).toBe(first);
    });
  });
});

describe("system status (no secrets)", () => {
  it("reports booleans/names only and never echoes env values", () => {
    // authConfigured is sourced from the real process env (admin-auth).
    const status = withEnv(
      {
        NODE_ENV: "test",
        DATA_ADAPTER: "fake",
        AUTH_SECRET: "x".repeat(40),
        ADMIN_OWNER_EMAIL: "owner@example.com",
        ADMIN_OWNER_PASSWORD_HASH: "scrypt$16384$8$1$c2FsdA==$aGFzaA==",
      },
      () => getSystemStatus(),
    );
    const serialized = JSON.stringify(status);
    expect(serialized).not.toContain("owner@example.com");
    expect(serialized).not.toContain("scrypt");
    expect(serialized).not.toContain("x".repeat(40));
    expect(status.authConfigured).toBe(true);
    expect(status.dataAdapter).toEqual({
      configured: true,
      name: "fake",
      productionCapable: false,
    });
    expect(status.domains.implemented).toContain("customers");
    expect(status.domains.readOnly).toContain("projects");
    expect(status.domains.planned).toContain("user-administration");
  });

  it("reports unconfigured adapter honestly", () => {
    const status = withEnv(
      {
        NODE_ENV: "production",
        DATA_ADAPTER: undefined,
        AUTH_SECRET: undefined,
        ADMIN_OWNER_EMAIL: undefined,
        ADMIN_OWNER_PASSWORD_HASH: undefined,
      },
      () => getSystemStatus(),
    );
    expect(status.environment).toBe("production");
    expect(status.dataAdapter).toEqual({
      configured: false,
      name: null,
      productionCapable: false,
    });
    expect(status.authConfigured).toBe(false);
  });
});

describe("workspace resolution", () => {
  it("defaults to the single workspace and honors the env override name", () => {
    expect(getWorkspaceId({} as NodeJS.ProcessEnv)).toBe("blackx");
    expect(getWorkspaceId({ BLACKX_WORKSPACE_ID: " ws-1 " } as unknown as NodeJS.ProcessEnv)).toBe(
      "ws-1",
    );
  });
});
