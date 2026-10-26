// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { readFileSync, existsSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ pathname: "/ar/dashboard", mobile: false, guard: vi.fn() }));
vi.mock("next/navigation", () => ({ usePathname: () => state.pathname }));
vi.mock("next-auth/react", () => ({ signOut: vi.fn() }));
vi.mock("@/auth", () => ({ requireReviewAccess: state.guard }));

import { AdminThemeProvider } from "@/components/dashboard/AdminTheme";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ErpNavigation } from "@/components/dashboard/ErpNavigation";
import { erpModules, erpHref } from "@/config/erp";
import { erpNavigationGroups, getErpRouteInventory } from "@/config/erp-navigation";
import { dashboardModules, dashboardHref } from "@/config/navigation";
import { erpText } from "@/content/erp-dictionary";
import { getAppDictionary } from "@/content/app-dictionary";
import { isReviewProtectedPath } from "@/lib/review-auth-shared";
import type { Locale } from "@/lib/i18n";
import DashboardLayout from "@/app/[locale]/dashboard/layout";
import AdminOverview from "@/app/[locale]/dashboard/page";

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  state.pathname = "/ar/dashboard";
  state.mobile = false;
  state.guard.mockReset();
  state.guard.mockResolvedValue({ user: { role: "owner_review" } });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: state.mobile,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
  window.matchMedia = globalThis.matchMedia;
  vi.stubGlobal("requestAnimationFrame", (fn: FrameRequestCallback) => {
    fn(0);
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", vi.fn());
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function render(element: ReactNode) {
  await act(async () => root.render(element));
}
async function click(element: Element) {
  await act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
  );
}
async function input(element: HTMLInputElement, value: string) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
function shell(locale: Locale = "ar", role: unknown = "owner_review") {
  const props = { locale, role, children: createElement("p", null, "Page body") };
  return createElement(DashboardShell, props);
}

describe("Unified existing Admin and ERP (DOM/source checks, not authenticated browser E2E)", () => {
  it("keeps every module in exactly one logical navigation group", () => {
    const ids = erpNavigationGroups.flatMap((g) => g.modules);
    expect(ids).toHaveLength(15);
    expect(new Set(ids).size).toBe(15);
    expect([...ids].sort()).toEqual(erpModules.map((m) => m.id).sort());
    expect(erpNavigationGroups).toHaveLength(4);
  });

  it("keeps the authoritative inventory synchronized, unique, guarded and attached to actual route files", () => {
    const inventory = JSON.parse(readFileSync("docs/ERP_ADMIN_ROUTE_INVENTORY.json", "utf8"));
    const routes = ["ar", "en"].flatMap((locale) => getErpRouteInventory(locale as Locale));
    expect(inventory.routes).toEqual(routes);
    expect(inventory.groups).toEqual(erpNavigationGroups);
    expect(inventory.counts).toEqual({
      navigationGroups: 4,
      modules: 15,
      leaves: 143,
      perLocale: 159,
      localizedRoutes: 318,
    });
    expect(new Set(routes.map((r) => r.path)).size).toBe(318);
    for (const route of routes) {
      expect(isReviewProtectedPath(route.path), route.path).toBe(true);
      expect(route.layout).toBe("src/app/[locale]/dashboard/layout.tsx");
      expect(route.integration).toBe("shared-admin");
      const pattern = route.page ? "[area]/[page]/" : route.module ? "[area]/" : "";
      expect(existsSync(`src/app/[locale]/dashboard/erp/${pattern}page.tsx`), route.path).toBe(
        true,
      );
      if (route.canonical) expect(routes.some((r) => r.path === route.canonical)).toBe(true);
    }
    // There is one inherited Admin layout, not an isolated ERP shell/route group.
    expect(existsSync("src/app/[locale]/dashboard/erp/layout.tsx")).toBe(false);
  });

  it.each(["ar", "en"] as const)(
    "exposes every %s ERP route and every existing Admin entry in one sidebar",
    async (locale) => {
      state.pathname = dashboardHref(locale);
      await render(shell(locale));
      expect(container.querySelectorAll("#app-sidebar")).toHaveLength(1);
      expect(container.querySelectorAll(".shell-main")).toHaveLength(1);
      expect(container.querySelectorAll(".erp-nav")).toHaveLength(1);
      const nav = container.querySelector(".erp-nav")!;
      for (const route of getErpRouteInventory(locale)) {
        expect(nav.querySelector(`a[href="${route.path}"]`), route.path).not.toBeNull();
      }
      for (const page of dashboardModules) {
        expect(
          nav.querySelectorAll(`a[href="${dashboardHref(locale, page.segment)}"]`),
          page.key,
        ).toHaveLength(1);
      }
      expect(nav.querySelector(`a[href="${erpHref(locale)}"]`)?.textContent).toBe(
        erpText("workspace", locale),
      );
      expect(nav.querySelectorAll(".erp-nav-category")).toHaveLength(4);
    },
  );

  it.each(["ar", "en"] as const)(
    "opens a representative leaf in all 15 %s modules with active state and complete breadcrumbs",
    async (locale) => {
      for (const area of erpModules) {
        const page = area.pages[0]!;
        state.pathname = erpHref(locale, area.id, page.id);
        await render(shell(locale));
        const active = container.querySelectorAll('.erp-nav a[aria-current="page"]');
        expect(active).toHaveLength(1);
        expect(active[0]!.getAttribute("href")).toBe(state.pathname);
        expect(active[0]!.closest("details")?.open).toBe(true);
        expect(container.querySelector("h1")?.textContent).toBe(page.title[locale]);
        const crumbs = container.querySelector(".shell-breadcrumbs")!;
        expect([...crumbs.querySelectorAll("a")].map((a) => a.getAttribute("href"))).toEqual([
          dashboardHref(locale),
          erpHref(locale),
          erpHref(locale, area.id),
        ]);
        expect(crumbs.querySelector('[aria-current="page"]')?.textContent).toBe(page.title[locale]);
      }
    },
  );

  it("restores active module visibility on route changes and fresh direct-route mounts", async () => {
    state.pathname = "/ar/dashboard/erp/sales/quotations";
    await render(shell());
    await input(container.querySelector("#erp-nav-search")!, "cheques");
    expect(
      container.querySelector('.erp-nav a[href="/ar/dashboard/erp/sales/quotations"]'),
    ).toBeNull();
    state.pathname = "/ar/dashboard/erp/projects/portfolio";
    await render(shell());
    expect(container.querySelector<HTMLInputElement>("#erp-nav-search")!.value).toBe("");
    const active = container.querySelector('.erp-nav a[aria-current="page"]')!;
    expect(active.getAttribute("href")).toBe(state.pathname);
    expect(active.closest("details")?.open).toBe(true);
    await act(async () => root.unmount());
    root = createRoot(container);
    await render(shell());
    expect(container.querySelector('.erp-nav a[aria-current="page"]')?.getAttribute("href")).toBe(
      state.pathname,
    );
  });

  it("keeps existing Admin detail routes active without duplicate overview links", async () => {
    state.pathname = "/ar/dashboard/projects/PV-PR-1001";
    await render(shell());
    const active = container.querySelector('.erp-nav a[aria-current="page"]')!;
    expect(active.getAttribute("href")).toBe("/ar/dashboard/projects");
    expect(active.closest("details")?.open).toBe(true);
    expect(container.querySelectorAll('.erp-nav a[href="/ar/dashboard"]')).toHaveLength(1);
  });

  it("searches existing Admin in both the shared sidebar and command dialog", async () => {
    await render(shell());
    const label = getAppDictionary("ar").dashboard.modules.finance;
    await input(container.querySelector("#erp-nav-search")!, label);
    expect(container.querySelector('a[href="/ar/dashboard/finance"]')).not.toBeNull();
    expect(container.querySelector(".erp-nav")!.textContent).not.toContain(
      erpText("noResults", "ar"),
    );
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
      ),
    );
    await input(document.querySelector("#erp-command-search")!, label);
    expect(document.querySelector('dialog a[href="/ar/dashboard/finance"]')).not.toBeNull();
    expect(document.querySelector("dialog[open]")).not.toBeNull();
  });

  it("uses the existing mobile drawer, closes on route link and restores focus on Escape", async () => {
    state.mobile = true;
    await render(shell());
    const sidebar = container.querySelector<HTMLElement>("#app-sidebar")!;
    const menu = container.querySelector<HTMLButtonElement>(".shell-menu-btn")!;
    expect(sidebar.getAttribute("aria-hidden")).toBe("true");
    await click(menu);
    expect(menu.getAttribute("aria-expanded")).toBe("true");
    const link = sidebar.querySelector('a[href="/ar/dashboard/erp"]')!;
    link.addEventListener("click", (e) => e.preventDefault());
    await click(link);
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    await click(menu);
    await act(async () =>
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(menu.getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(menu);
    expect(document.body.style.overflow).not.toBe("hidden");
  });

  it("keeps the portalled command dialog inside the Admin theme boundary", async () => {
    const props = { children: shell() };
    await render(createElement(AdminThemeProvider, props));
    await act(async () =>
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
      ),
    );
    const dialog = document.querySelector("dialog[open]");
    expect(dialog).not.toBeNull();
    expect(dialog?.closest(".admin-theme-root")).toBe(container.querySelector(".admin-theme-root"));
    expect(dialog?.closest(".shell-sidebar")).toBeNull();
  });

  it("falls back to the original Admin nav for unsupported presentation roles without granting ERP access", async () => {
    await render(shell("ar", "customer"));
    expect(container.querySelector(".erp-nav")).toBeNull();
    expect(container.querySelector('a[href="/ar/dashboard/requests"]')).not.toBeNull();
    expect(container.querySelector('a[href="/ar/dashboard/erp"]')).toBeNull();
  });

  it.each(["ar", "en"] as const)(
    "links from the existing %s Admin dashboard to ERP, after the server guard",
    async (locale) => {
      const element = await AdminOverview({ params: Promise.resolve({ locale }) });
      expect(renderToStaticMarkup(element)).toContain(`href="${erpHref(locale)}"`);
      expect(state.guard).toHaveBeenCalledWith(locale);
    },
  );

  it.each(["ar", "en"] as const)(
    "separates %s header tools from utility controls and keeps the prominent ERP entries",
    async (locale) => {
      await render(shell(locale));
      const actions = container.querySelector(".shell-topbar-actions")!;
      const tools = container.querySelector(".shell-topbar-tools")!;
      expect(actions.contains(tools)).toBe(false);
      expect(actions.querySelectorAll(".locale-switch a")).toHaveLength(2);
      const disclosure = tools.querySelector<HTMLDetailsElement>("details")!;
      expect(disclosure.open).toBe(false);
      expect(disclosure.querySelector("summary")?.textContent).toBeTruthy();
      expect(
        disclosure.querySelector(`a[href="${erpHref(locale, "administration", "session")}"]`),
      ).not.toBeNull();
      expect(
        disclosure.querySelector(`a[href="${erpHref(locale)}#erp-system-guide"]`),
      ).not.toBeNull();
      const density = disclosure.querySelector<HTMLButtonElement>("button[aria-pressed]")!;
      await click(density);
      expect(density.getAttribute("aria-pressed")).toBe("true");
      expect(container.querySelector(".erp-density-compact")).not.toBeNull();
      expect(disclosure.querySelector("button:disabled")).not.toBeNull();
      expect(container.querySelector(".erp-nav .erp-workspace-entry")?.getAttribute("href")).toBe(
        erpHref(locale),
      );
      const overview = await AdminOverview({ params: Promise.resolve({ locale }) });
      await render(overview);
      const entry = container.querySelector(".dashboard-intro .erp-workspace-entry")!;
      expect(entry.getAttribute("href")).toBe(erpHref(locale));
      expect(entry.textContent).toBe(erpText("workspace", locale));
    },
  );

  it("retains the inherited server guard and passes the actual role to the only Admin shell", async () => {
    const element = await DashboardLayout({
      params: Promise.resolve({ locale: "ar" }),
      children: "Content",
    });
    expect(element.type).toBe(AdminThemeProvider);
    expect(element.props.children.type).toBe(DashboardShell);
    expect(element.props.children.props.role).toBe("owner_review");
    state.guard.mockRejectedValue(new Error("DENIED"));
    await expect(
      DashboardLayout({ params: Promise.resolve({ locale: "ar" }), children: "Content" }),
    ).rejects.toThrow("DENIED");
    await expect(AdminOverview({ params: Promise.resolve({ locale: "ar" }) })).rejects.toThrow(
      "DENIED",
    );
  });

  it("keeps RTL and responsive styling inherited, without creating another public ERP route", () => {
    const layout = readFileSync("src/app/[locale]/layout.tsx", "utf8");
    expect(layout).toContain("dir={getDirection(locale)}");
    const css = readFileSync("src/styles/erp.css", "utf8");
    expect(css).toContain("margin-inline-start");
    expect(css).toContain("@media (max-width:");
    expect(existsSync("src/app/[locale]/erp/page.tsx")).toBe(false);
    const nav = renderToStaticMarkup(
      createElement(ErpNavigation, { locale: "ar", role: "owner_review" }),
    );
    expect(nav).not.toMatch(/href="\/ar\/(?!dashboard)/);
  });
});
