import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { verifyOwnerPassword } from "@/lib/admin-auth";

const script = resolve("scripts/prepare-preview-auth.mjs");
const folders: string[] = [];
function prepare(input: string, folder?: string) {
  const cwd = folder ?? mkdtempSync(join(tmpdir(), "blackx-preview-preparation-"));
  if (!folder) folders.push(cwd);
  const result = spawnSync(
    process.execPath,
    [script, "--email", "review@example.com", "--origin", "https://verified-branch.vercel.app"],
    { cwd, input, encoding: "utf8" },
  );
  return { cwd, result };
}
afterEach(() => {
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

describe("offline Preview credential preparation", () => {
  it("uses the repository hash implementation and creates private, non-echoed output", async () => {
    // Ephemeral test fixture only, never a deployed account credential.
    const password = randomBytes(24).toString("base64url");
    const { cwd, result } = prepare(`${password}\n`);
    expect(result.status).toBe(0);
    const path = join(cwd, ".env.preview-auth.local");
    expect(statSync(path).mode & 0o777).toBe(0o600);
    const contents = readFileSync(path, "utf8");
    const vars = Object.fromEntries(
      contents
        .trim()
        .split("\n")
        .map((line) => {
          const index = line.indexOf("=");
          return [line.slice(0, index), line.slice(index + 2, -1)];
        }),
    );
    // Boolean assertions avoid printing secret material on failures.
    expect(await verifyOwnerPassword(password, vars.ADMIN_OWNER_PASSWORD_HASH!)).toBe(true);
    expect(vars.AUTH_SECRET?.length).toBe(64);
    expect(vars.AUTH_URL).toBe("https://verified-branch.vercel.app");
    expect(vars.CSRF_TRUSTED_ORIGINS).toBe(vars.AUTH_URL);
    const output = result.stdout + result.stderr;
    expect(output.includes(password)).toBe(false);
    expect(output.includes(vars.AUTH_SECRET!)).toBe(false);
    expect(output.includes(vars.ADMIN_OWNER_PASSWORD_HASH!)).toBe(false);
    expect(contents.includes(password)).toBe(false);
  });

  it("creates independent random secrets and salted hashes across runs", () => {
    const password = randomBytes(24).toString("base64url");
    const first = prepare(password);
    const second = prepare(password);
    expect(first.result.status).toBe(0);
    expect(second.result.status).toBe(0);
    const firstContents = readFileSync(join(first.cwd, ".env.preview-auth.local"), "utf8");
    const secondContents = readFileSync(join(second.cwd, ".env.preview-auth.local"), "utf8");
    const line = (text: string, key: string) =>
      text.split("\n").find((value) => value.startsWith(`${key}=`));
    expect(line(firstContents, "AUTH_SECRET") === line(secondContents, "AUTH_SECRET")).toBe(false);
    expect(
      line(firstContents, "ADMIN_OWNER_PASSWORD_HASH") ===
        line(secondContents, "ADMIN_OWNER_PASSWORD_HASH"),
    ).toBe(false);
  });

  it("refuses to overwrite existing credentials", () => {
    const password = randomBytes(24).toString("base64url");
    const first = prepare(password);
    expect(first.result.status).toBe(0);
    const before = readFileSync(join(first.cwd, ".env.preview-auth.local"), "utf8");
    expect(prepare(password, first.cwd).result.status).toBe(1);
    expect(readFileSync(join(first.cwd, ".env.preview-auth.local"), "utf8") === before).toBe(true);
  });

  it.each(["", "too-short", "a".repeat(257), "multi\nline-password"])(
    "rejects invalid stdin case %# without echoing it",
    (input) => {
      const { cwd, result } = prepare(input);
      expect(result.status).toBe(1);
      expect(() => statSync(join(cwd, ".env.preview-auth.local"))).toThrow();
      if (input) expect((result.stdout + result.stderr).includes(input)).toBe(false);
    },
  );
});
