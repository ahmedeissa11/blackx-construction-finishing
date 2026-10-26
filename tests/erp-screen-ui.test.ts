// @vitest-environment jsdom
import { act, createElement, useState, type ReactNode, type ComponentProps } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/en/dashboard/erp/accounting/reports" }));
import { AppShell } from "@/components/ui/AppShell";
import { getAppDictionary } from "@/content/app-dictionary";
import { ErpScreenPreview } from "@/components/dashboard/ErpScreenPreview";
import { ErpAccessMatrix } from "@/components/dashboard/ErpAccessMatrix";
import { ErpRegister } from "@/components/dashboard/ErpRegister";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { ErpNavigation, searchErpPages, erpSearchHref } from "@/components/dashboard/ErpNavigation";
import { ErpHeaderTools } from "@/components/dashboard/ErpHeaderTools";
import { getErpDataset } from "@/lib/erp-data";
import type { Locale } from "@/lib/i18n";

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
async function render(node: ReactNode) {
  await act(async () => root.render(node));
}
async function click(element: Element) {
  await act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
  );
}
async function input(selector: string, value: string) {
  const element = container.querySelector<HTMLInputElement>(selector)!;
  expect(element, selector).not.toBeNull();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(selector: string, value: string) {
  const element = container.querySelector<HTMLSelectElement>(selector)!;
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function submit(selector: string) {
  await act(async () =>
    container
      .querySelector(selector)!
      .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
}
function button(text: string) {
  const element = [...container.querySelectorAll("button")].find(
    (x) => x.textContent?.trim() === text,
  );
  expect(element, text).toBeTruthy();
  return element!;
}

describe("Disconnected screen layouts: actual local behavior, no business writes", () => {
  it.each(["ar", "en"] as const)(
    "shows synthetic identity previews without provisioning controls in %s",
    async (locale) => {
      await render(
        createElement(ErpScreenPreview, { area: "administration", page: "overview", locale }),
      );
      expect(container.querySelector("[data-identity-preview]")).not.toBeNull();
      expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
      expect(container.querySelector('input[type="password"]')).toBeNull();
      expect(container.textContent).toContain("example.invalid");
      expect(container.textContent).toContain(
        locale === "ar" ? "غير متصل بالحسابات" : "Not connected to accounts",
      );
    },
  );
  it("validates a synthetic chart draft but never saves, fetches, prints or stores", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const print = vi.spyOn(window, "print");
    await render(
      createElement(ErpScreenPreview, { area: "accounting", page: "accounts", locale: "en" }),
    );
    await input('[id$="-draft-ref"]', "SYNTHETIC");
    await input('[id$="-draft-name"]', "Layout only");
    await input('[id$="-draft-accountType"]', "Unverified type");
    await submit(".erp-screen-draft form");
    expect(container.textContent).toContain("not business validation, approval or a saved record");
    await click(button("Discard local draft"));
    expect(container.querySelector<HTMLInputElement>('[id$="-draft-name"]')!.value).toBe("");
    expect(container.querySelector(".erp-screen-draft [role=status]")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();
  });
  it("checks date range parameters without generating a report", async () => {
    await render(
      createElement(ErpScreenPreview, { area: "accounting", page: "reports", locale: "en" }),
    );
    await input('[id$="-filter-from"]', "2026-10-26");
    await input('[id$="-filter-to"]', "2026-10-01");
    await submit('form[aria-label="Layout parameters only"]');
    expect(container.querySelector('[id$="-filter-to"]')?.getAttribute("aria-invalid")).toBe(
      "true",
    );
    expect(container.textContent).toContain("No report was generated");
    await input('[id$="-filter-to"]', "2026-10-31");
    expect(container.querySelector('form [role="status"]')).toBeNull();
    await submit('form[aria-label="Layout parameters only"]');
    expect(container.textContent).toContain("no records queried or report generated");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody td")?.textContent).toContain("No authorized records");
    expect(
      [...container.querySelectorAll("button")].some((b) =>
        /^(Print|CSV|Excel)/.test(b.textContent ?? ""),
      ),
    ).toBe(false);
  });
  it("switches distinct treasury scopes and discards transient parameters/drafts", async () => {
    await render(
      createElement(ErpScreenPreview, { area: "treasury", page: "receipts", locale: "en" }),
    );
    await input('[id$="-draft-amount"]', "1");
    await input('[id$="-filter-search"]', "synthetic-filter");
    await click(button("Incoming bank receipts"));
    expect(container.querySelector<HTMLInputElement>('[id$="-draft-amount"]')!.value).toBe("");
    expect(container.querySelector<HTMLInputElement>('[id$="-filter-search"]')!.value).toBe("");
    expect(container.querySelector("thead")!.textContent).toContain("Bank account reference");
    expect(container.querySelector("thead")!.textContent).not.toContain("Treasury / cash register");
    expect(container.querySelector('a[href$="?view=bank-receipts"]')).not.toBeNull();
    expect(button("Incoming bank receipts").getAttribute("aria-pressed")).toBe("true");
  });
  it("financial-year prerequisite disclosure shows unknown summaries, not closing results", async () => {
    await render(
      createElement(ErpScreenPreview, { area: "accounting", page: "overview", locale: "en" }),
    );
    expect(container.querySelectorAll(".erp-readiness > div")).toHaveLength(4);
    expect(container.querySelector(".erp-readiness")?.textContent).toContain(
      "Unknown — no authorized source",
    );
    const requirements = container.querySelector<HTMLDetailsElement>(".erp-screen-history")!;
    await click(requirements.querySelector("summary")!);
    expect(requirements.open).toBe(true);
    expect(requirements.textContent).toContain("No close, reopen");
    expect(button("Close financial year — unavailable").disabled).toBe(true);
  });
});

describe("Detailed permission requirements remain descriptive", () => {
  it("combines module/page/permission/search and never offers grants", async () => {
    const fetch = vi.spyOn(globalThis, "fetch");
    await render(createElement(ErpAccessMatrix, { locale: "en" }));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(143);
    await select('select[id$="-module"]', "accounting");
    await select('select[id$="-page"]', "accounting/reports");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(
      container.querySelector('tbody a[href="/en/dashboard/erp/accounting/reports"]'),
    ).not.toBeNull();
    await select('select[id$="-requirement"]', "export");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
    expect(container.textContent).toContain("not an authorization decision");
    await select('select[id$="-module"]', "data");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector('tbody a[href="/en/dashboard/erp/data/export"]')).not.toBeNull();
    await select('select[id$="-user"]', "");
    expect(container.textContent).toContain("Not evaluated — no identity");
    await input('input[type="search"]', "no match");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(0);
    expect(
      container.querySelector("[data-permission-selection-preview] button")?.textContent,
    ).toContain("preview");
    expect(container.querySelectorAll("tbody button")).toHaveLength(0);
    expect(fetch).not.toHaveBeenCalled();
  });
});

describe("Existing fixture filters use actual ISO date metadata, not localized parsing", () => {
  it.each(["ar", "en"] as const)(
    "filters dates and project/customer scopes in %s",
    async (locale) => {
      const data = getErpDataset("invoices", locale)!;
      const row = data.rows[0]!;
      await render(createElement(ErpRegister, { source: "invoices", locale }));
      const selects = [...container.querySelectorAll("select")];
      const projectSelect = selects.find((s) =>
        s.parentElement!.textContent?.startsWith(locale === "ar" ? "المشروع" : "Project"),
      )!;
      await act(async () => {
        projectSelect.value = row.cells.project!;
        projectSelect.dispatchEvent(new Event("change", { bubbles: true }));
      });
      const dateInputs = [...container.querySelectorAll<HTMLInputElement>('input[type="date"]')];
      expect(dateInputs).toHaveLength(2);
      // Scope to the exact fixture day, including both endpoints.
      for (const element of dateInputs)
        await act(async () => {
          Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
            element,
            row.filterDate!,
          );
          element.dispatchEvent(new Event("input", { bubbles: true }));
        });
      const expected = data.rows.filter(
        (r) => r.cells.project === row.cells.project && r.filterDate === row.filterDate,
      );
      expect(container.querySelectorAll("tbody tr")).toHaveLength(expected.length);
      expect(container.querySelector("tbody")!.textContent).toContain(row.id);
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          dateInputs[0],
          "2099-01-01",
        );
        dateInputs[0]!.dispatchEvent(new Event("input", { bubbles: true }));
      });
      expect(container.querySelector('[role="alert"]')).not.toBeNull();
      await click(button(locale === "ar" ? "مسح مرشحات العينات" : "Clear fixture filters"));
      expect(container.querySelectorAll("tbody tr")).toHaveLength(data.rows.length);
      expect(container.querySelector('[role="alert"]')).toBeNull();
    },
  );
  it("does not add date/company filters to an undated BOQ dataset", async () => {
    await render(createElement(ErpRegister, { source: "boq", locale: "en" }));
    expect(container.querySelector('input[type="date"]')).toBeNull();
    expect(container.querySelectorAll("select")).toHaveLength(1);
  });
});

function HeaderHarness({ locale }: { locale: Locale }) {
  const [compact, setCompact] = useState(false);
  return createElement(ErpHeaderTools, {
    locale,
    compact,
    onCompactChange: () => setCompact((value) => !value),
  });
}
describe("Navigation and header patterns, not a marketplace or preference service", () => {
  it("finds layout aliases bilingually and links a matched layout without adding routes", async () => {
    expect(
      searchErpPages("Trial balance").some(
        ({ module, page }) => module.id === "accounting" && page.id === "reports",
      ),
    ).toBe(true);
    expect(searchErpPages("ميزان المراجعة").length).toBeGreaterThan(0);
    expect(erpSearchHref("en", "purchasing", "invoices", "Purchase orders")).toBe(
      "/en/dashboard/erp/purchasing/invoices?view=purchase-orders",
    );
    await render(createElement(ErpDirectory, { locale: "en", moduleId: "accounting" }));
    await input('input[type="search"]', "Trial balance");
    expect(
      container.querySelector('a[href="/en/dashboard/erp/accounting/reports?view=trial-balance"]'),
    ).not.toBeNull();
    expect(container.querySelectorAll(".erp-module-card")).toHaveLength(1);
  });
  it("shows module identifiers/counts and active-page context on the rail", async () => {
    await render(createElement(ErpNavigation, { locale: "en", role: "owner_review" }));
    expect(container.querySelectorAll(".erp-nav-meta")).toHaveLength(15);
    expect(container.querySelector('a[aria-current="page"]')?.closest("details")?.open).toBe(true);
    await input("#erp-nav-search", "Purchase orders");
    expect(
      container.querySelector(
        'a[href="/en/dashboard/erp/purchasing/invoices?view=purchase-orders"]',
      ),
    ).not.toBeNull();
  });
  it("keeps the Portal default header/navigation when Admin slots are omitted", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    const portalProps: ComponentProps<typeof AppShell> = {
      locale: "en",
      appDict: getAppDictionary("en"),
      roleLabel: "Portal test",
      title: "Portal",
      baseSegment: "portal",
      navItems: [{ href: "/en/portal", label: "Portal home", icon: "home" }],
      children: null,
    };
    await render(
      createElement(AppShell, portalProps, createElement("p", null, "Existing Portal content")),
    );
    expect(container.querySelector('a[href="/en/portal"]')).not.toBeNull();
    expect(container.querySelector(".erp-header-tools")).toBeNull();
    expect(container.querySelector(".erp-admin-shell")).toBeNull();
    expect(container.textContent).toContain("Existing Portal content");
  });
  it.each(["ar", "en"] as const)(
    "offers local-only appearance and honest unavailable marketplace in %s",
    async (locale) => {
      const storage = vi.spyOn(Storage.prototype, "setItem");
      const fetch = vi.spyOn(globalThis, "fetch");
      await render(createElement(HeaderHarness, { locale }));
      const compact = container.querySelector<HTMLButtonElement>("button[aria-pressed]")!;
      await click(compact);
      expect(compact.getAttribute("aria-pressed")).toBe("true");
      expect(container.querySelector("button:disabled")).not.toBeNull();
      expect(
        container.querySelector(`a[href="/${locale}/dashboard/erp#erp-system-guide"]`),
      ).not.toBeNull();
      expect(storage).not.toHaveBeenCalled();
      expect(fetch).not.toHaveBeenCalled();
    },
  );
});
