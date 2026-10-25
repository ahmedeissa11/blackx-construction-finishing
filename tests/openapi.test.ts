/**
 * OpenAPI governance: the committed docs/openapi.json must equal the
 * served spec object (drift), every routed /api/v1 path+method must be
 * documented (coverage), every operation must carry an honest
 * x-implementation-status (planned ⇒ x-blocked-by), and no
 * server-internal field may leak into the contract.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { openApiSpec } from "@/server/foundation/openapi";

const API_ROOT = join(process.cwd(), "src/app/api/v1");
const METHODS = ["GET", "POST", "PATCH", "PUT", "DELETE"] as const;

function routedOperations(): Array<{ path: string; method: string }> {
  const operations: Array<{ path: string; method: string }> = [];
  const walk = (dir: string, segments: string[]): void => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(join(dir, entry.name), [...segments, entry.name]);
      } else if (entry.name === "route.ts") {
        const routePath =
          "/api/v1" +
          (segments.length
            ? "/" + segments.map((s) => s.replace(/^\[(.+)\]$/, "{$1}")).join("/")
            : "");
        const source = readFileSync(join(dir, entry.name), "utf8");
        for (const method of METHODS) {
          if (new RegExp(`export async function ${method}\\b`).test(source)) {
            operations.push({ path: routePath, method: method.toLowerCase() });
          }
        }
      }
    }
  };
  walk(API_ROOT, []);
  return operations;
}

describe("OpenAPI specification", () => {
  it("docs/openapi.json matches the served spec object exactly", () => {
    const committed = JSON.parse(readFileSync(join(process.cwd(), "docs/openapi.json"), "utf8"));
    expect(committed).toEqual(JSON.parse(JSON.stringify(openApiSpec)));
  });

  it("documents every routed path and method", () => {
    const paths = (openApiSpec as { paths: Record<string, Record<string, unknown>> }).paths;
    const missing = routedOperations().filter(
      ({ path, method }) => !paths[path] || !(method in (paths[path] as object)),
    );
    expect(missing).toEqual([]);
  });

  it("marks every operation with an honest implementation status", () => {
    const paths = (
      openApiSpec as { paths: Record<string, Record<string, Record<string, unknown>>> }
    ).paths;
    const valid = new Set(["implemented", "read-only", "planned"]);
    for (const [path, operations] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(operations)) {
        const status = operation["x-implementation-status"] as string;
        expect(valid.has(status), `${method.toUpperCase()} ${path}`).toBe(true);
        if (status === "planned") {
          const blockedBy = operation["x-blocked-by"] as string[];
          expect(Array.isArray(blockedBy) && blockedBy.length > 0, `${method} ${path}`).toBe(true);
        }
      }
    }
  });

  it("never exposes server-internal fields in entity schemas", () => {
    const schemas = (openApiSpec as { components: { schemas: Record<string, unknown> } }).components
      .schemas;
    for (const [name, schema] of Object.entries(schemas)) {
      const serialized = JSON.stringify(schema);
      expect(serialized, name).not.toContain("passwordHash");
      expect(serialized, name).not.toContain("storageRef");
      // `workspaceId` is a legitimate *operational* field on
      // SystemStatus only; it must never appear on an entity DTO.
      if (name !== "SystemStatus") {
        expect(serialized, name).not.toContain("workspaceId");
      }
    }
  });
});
