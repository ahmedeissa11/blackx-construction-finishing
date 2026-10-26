/**
 * Offline Preview-only credential preparation. Requires Node >=22.18.
 * Read a NEW Preview password from stdin (e.g. a password-manager pipe or
 * a private file redirected into stdin). Never pass the password in argv.
 * Usage: node scripts/prepare-preview-auth.mjs --email OWNER_EMAIL \
 *   --origin VERIFIED_BRANCH_ORIGIN < /private/preview-password
 *
 * Writes .env.preview-auth.local (0600, ignored, refuses overwrite), never
 * the plaintext password. Import the file into Vercel ONLY for Preview,
 * scoped to the feature branch. It generates an independent session secret;
 * it never reads or changes Production. Do not cat/log/commit the output.
 */
import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import { parseArgs } from "node:util";

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      origin: { type: "string" },
    },
    strict: true,
  });
  if (!/^[^\s@'"=]+@[^\s@'"=]+\.[^\s@'"=]+$/.test(values.email ?? "")) {
    throw new Error("Invalid email");
  }
  const origin = new URL(values.origin);
  if (
    origin.protocol !== "https:" ||
    origin.username ||
    origin.password ||
    origin.pathname !== "/" ||
    origin.search ||
    origin.hash ||
    !/^[a-z0-9.-]+$/i.test(origin.hostname)
  )
    throw new Error("Invalid HTTPS origin");
  if (process.stdin.isTTY) throw new Error("Use a private stdin source");

  let password = "";
  process.stdin.setEncoding("utf8");
  for await (const chunk of process.stdin) {
    password += chunk;
    if (password.length > 258) throw new Error("Password too long");
  }
  // Permit one terminal line ending from a private file/password manager.
  password = password.replace(/\r?\n$/, "");
  if (password.length < 12 || password.length > 256 || /[\r\n\0]/.test(password)) {
    throw new Error("Invalid password input");
  }

  // Native type stripping + narrow alias resolution load the exact repository
  // implementation, rather than a second, potentially divergent hash function.
  registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier.startsWith("@/")) {
        return nextResolve(
          new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href,
          context,
        );
      }
      return nextResolve(specifier, context);
    },
  });
  const { hashOwnerPassword } = await import("../src/lib/admin-auth.ts");
  const hash = await hashOwnerPassword(password);
  password = "";
  const secret = randomBytes(48).toString("base64url");
  const vars = {
    AUTH_URL: origin.origin,
    CSRF_TRUSTED_ORIGINS: origin.origin,
    ADMIN_OWNER_EMAIL: values.email.trim().toLowerCase(),
    AUTH_SECRET: secret,
    ADMIN_OWNER_PASSWORD_HASH: hash,
  };
  // Single quotes preserve the '$' separators when parsed as dotenv.
  const contents =
    Object.entries(vars)
      .map(([key, value]) => `${key}='${value}'`)
      .join("\n") + "\n";
  await writeFile(".env.preview-auth.local", contents, { mode: 0o600, flag: "wx" });
  console.info(
    "Created private .env.preview-auth.local; import ONLY into branch-scoped Vercel Preview. No credentials printed.",
  );
}

main().catch(() => {
  // Error messages/stacks may include arguments or input: do not echo them.
  console.error(
    "Preview preparation failed. Check email, HTTPS origin, private stdin (12–256 characters), Node >=22.18, and that the output file does not already exist. No credentials printed.",
  );
  process.exitCode = 1;
});
