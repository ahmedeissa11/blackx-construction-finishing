// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AdminThemeProvider, AdminThemeToggle } from "@/components/dashboard/AdminTheme";
import { ADMIN_THEME_KEY, adminThemeBootstrap, resolveAdminTheme } from "@/lib/admin-theme";

let container: HTMLDivElement, root: Root;
let systemDark = false;
const listeners = new Set<() => void>();
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  systemDark = false;
  listeners.clear();
  vi.stubGlobal("matchMedia", () => ({
    get matches() {
      return systemDark;
    },
    addEventListener: (_: string, fn: () => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => listeners.delete(fn),
  }));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
async function mount(locale: "ar" | "en" = "en", page = "overview") {
  await act(async () =>
    root.render(
      createElement(
        AdminThemeProvider,
        null,
        createElement(
          "section",
          { lang: locale, dir: locale === "ar" ? "rtl" : "ltr" },
          createElement(AdminThemeToggle, { locale }),
          createElement("p", null, page),
        ),
      ),
    ),
  );
}
const current = () => container.querySelector<HTMLElement>(".admin-theme-root")!.dataset.adminTheme;
const toggle = () => container.querySelector<HTMLButtonElement>("button")!;
async function click() {
  await act(async () => toggle().click());
}

describe("Admin theme preference (UI only)", () => {
  it("leaves shells outside the Admin provider without a theme control", async () => {
    await act(async () => root.render(createElement(AdminThemeToggle, { locale: "en" })));
    expect(container.querySelector("button")).toBeNull();
    expect(document.documentElement.hasAttribute("data-admin-theme")).toBe(false);
  });
  it.each(["light", "dark"] as const)("maintains accessible %s semantic color pairs", (mode) => {
    const css = readFileSync("src/styles/admin-theme.css", "utf8");
    const block =
      mode === "light"
        ? css.match(/\.admin-theme-root \{([\s\S]*?)\}/)?.[1]
        : css.match(/\.admin-theme-root\[data-admin-theme="dark"\] \{([\s\S]*?)\}/)?.[1];
    if (!block) throw new Error(`Missing ${mode} theme token block`);
    const colors = Object.fromEntries(
      [...block.matchAll(/--ui-([\w-]+): (#[\da-f]{6});/g)].map((m) => [m[1]!, m[2]!]),
    );
    const luminance = (hex: string) =>
      hex
        .slice(1)
        .match(/../g)!
        .map((c) => parseInt(c, 16) / 255)
        .map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
        .reduce((sum, c, i) => sum + c * [0.2126, 0.7152, 0.0722][i]!, 0);
    const ratio = (a: string, b: string) => {
      const fg = colors[a],
        bg = colors[b];
      if (!fg || !bg) throw new Error(`Missing semantic pair: ${a} / ${b}`);
      const x = luminance(fg),
        y = luminance(bg);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
    };
    const pairs: [string, string][] = [
      ["text", "surface"],
      ["muted", "surface"],
      ["muted", "canvas"],
      ["muted", "raised"],
      ["muted", "muted-surface"],
      ["on-action", "action"],
      ["on-action", "action-hover"],
      ["gold", "raised"],
      ["accent", "accent-soft"],
      ...["success", "warning", "error", "info"].map(
        (key) => [key, `${key}-bg`] as [string, string],
      ),
    ];
    for (const [fg, bg] of pairs)
      expect(ratio(fg, bg), `${mode}: ${fg} / ${bg}`).toBeGreaterThanOrEqual(4.5);
    expect(ratio("border-strong", "surface")).toBeGreaterThanOrEqual(3);
    expect(ratio("focus", "surface")).toBeGreaterThanOrEqual(3);
  });

  it("validates preferences and follows the OS only without an explicit valid choice", () => {
    expect(resolveAdminTheme("dark", false)).toBe("dark");
    expect(resolveAdminTheme("light", true)).toBe("light");
    expect(resolveAdminTheme(null, true)).toBe("dark");
    expect(resolveAdminTheme("invalid", false)).toBe("light");
  });
  it.each(["ar", "en"] as const)(
    "switches %s with accessible localized names and pressed state",
    async (locale) => {
      await mount(locale);
      expect(toggle().getAttribute("aria-label")).toBe(
        locale === "ar" ? "التبديل إلى الوضع الداكن" : "Switch to dark mode",
      );
      expect(toggle().type).toBe("button");
      await click();
      expect(current()).toBe("dark");
      expect(toggle().getAttribute("aria-pressed")).toBe("true");
      expect(toggle().getAttribute("aria-label")).toBe(
        locale === "ar" ? "التبديل إلى الوضع الفاتح" : "Switch to light mode",
      );
      expect(container.querySelector("section")!.dir).toBe(locale === "ar" ? "rtl" : "ltr");
      await click();
      expect(current()).toBe("light");
    },
  );
  it("persists across a fresh mount (refresh simulation) and locale/module navigation", async () => {
    await mount();
    await click();
    expect(localStorage.getItem(ADMIN_THEME_KEY)).toBe("dark");
    await mount("ar", "inventory");
    expect(current()).toBe("dark");
    await act(async () => root.unmount());
    root = createRoot(container);
    await mount("en", "accounting");
    expect(current()).toBe("dark");
  });
  it("tracks OS changes until an explicit selection is made", async () => {
    systemDark = true;
    await mount();
    expect(current()).toBe("dark");
    systemDark = false;
    await act(async () => listeners.forEach((fn) => fn()));
    expect(current()).toBe("light");
    await click();
    await act(async () => listeners.forEach((fn) => fn()));
    expect(current()).toBe("dark");
  });
  it("explicit saved light wins over OS dark and invalid storage falls back", async () => {
    systemDark = true;
    localStorage.setItem(ADMIN_THEME_KEY, "light");
    await mount();
    expect(current()).toBe("light");
    localStorage.setItem(ADMIN_THEME_KEY, "invalid");
    await act(async () =>
      window.dispatchEvent(new StorageEvent("storage", { key: ADMIN_THEME_KEY })),
    );
    expect(current()).toBe("dark");
  });
  it("syncs cross-tab changes and clearing storage resumes OS preference", async () => {
    await mount();
    localStorage.setItem(ADMIN_THEME_KEY, "dark");
    await act(async () =>
      window.dispatchEvent(new StorageEvent("storage", { key: ADMIN_THEME_KEY })),
    );
    expect(current()).toBe("dark");
    localStorage.clear();
    await act(async () => window.dispatchEvent(new StorageEvent("storage", { key: null })));
    expect(current()).toBe("light");
  });
  it("continues working if preference storage throws", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw Error("quota");
    });
    await mount();
    await click();
    expect(current()).toBe("dark");
  });
  it("cleans up media listeners on unmount", async () => {
    await mount();
    expect(listeners.size).toBe(1);
    await act(async () => root.unmount());
    root = createRoot(container);
    expect(listeners.size).toBe(0);
  });
  it("bootstraps saved theme before child markup without changing the document or auth", () => {
    const html = renderToStaticMarkup(
      createElement(AdminThemeProvider, null, createElement("main", null, "workspace")),
    );
    expect(html.indexOf("<script>")).toBeLessThan(html.indexOf("<main>"));
    const boundary = document.createElement("div");
    const script = document.createElement("script");
    boundary.append(script);
    const execute = new Function("document", "localStorage", "matchMedia", adminThemeBootstrap);
    execute({ currentScript: script }, { getItem: () => "dark" }, () => ({ matches: false }));
    expect(boundary.dataset.adminTheme).toBe("dark");
    execute({ currentScript: script }, { getItem: () => "light" }, () => ({ matches: true }));
    expect(boundary.dataset.adminTheme).toBe("light");
    execute(
      { currentScript: script },
      {
        getItem: () => {
          throw Error("blocked");
        },
      },
      () => ({ matches: true }),
    );
    expect(boundary.dataset.adminTheme).toBe("dark");
    expect(document.documentElement.hasAttribute("data-admin-theme")).toBe(false);
  });
});
