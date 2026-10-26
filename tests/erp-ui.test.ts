// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const navigation = vi.hoisted(() => ({ pathname: "/en/dashboard/erp/sales/quotations" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { ErpNavigation } from "@/components/dashboard/ErpNavigation";
import { ErpRegister } from "@/components/dashboard/ErpRegister";
import { ErpAccessMatrix } from "@/components/dashboard/ErpAccessMatrix";
import { ErpImportValidator, ErpExport } from "@/components/dashboard/ErpTools";
import { erpText } from "@/content/erp-dictionary";
import { RequestsBoard } from "@/components/dashboard/RequestsBoard";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewRequests } from "@/content/preview-data";
import { getErpDataset } from "@/lib/erp-data";

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute("open");
  };
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});
async function render(node: ReactNode) {
  await act(async () => root.render(node));
}
async function click(element: Element) {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  });
}
async function input(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  await act(async () => {
    const setter = Object.getOwnPropertyDescriptor(
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype,
      "value",
    )!.set!;
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(element: HTMLSelectElement, value: string) {
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function button(text: string) {
  const value = [...container.querySelectorAll("button")].find(
    (x) => x.textContent?.trim() === text,
  );
  expect(value, text).toBeTruthy();
  return value!;
}

describe("ERP interactive controls (DOM, not authenticated browser E2E)", () => {
  it("searches the bilingual directory and reports empty results", async () => {
    await render(createElement(ErpDirectory, { locale: "ar" }));
    expect(container.querySelectorAll(".erp-module-card")).toHaveLength(15);
    await input(container.querySelector('input[type="search"]')!, "شيكات");
    expect(container.querySelectorAll(".erp-module-card").length).toBeGreaterThan(0);
    await input(container.querySelector('input[type="search"]')!, "none-zzzzz");
    expect(container.querySelectorAll(".erp-module-card")).toHaveLength(0);
    expect(container.textContent).toContain(erpText("noResults", "ar"));
  });
  it("filters the directory by dependency readiness without empty links", async () => {
    await render(createElement(ErpDirectory, { locale: "en", moduleId: "sales" }));
    await select(container.querySelector("select")!, "deferred");
    expect(container.querySelectorAll(".erp-module-card li").length).toBeGreaterThan(0);
    for (const link of container.querySelectorAll("a"))
      expect(link.getAttribute("href")).toMatch(/^\/en\/dashboard\/erp\//);
  });
  it("opens the active hierarchy and supports collapsible groups and quick search", async () => {
    await render(createElement(ErpNavigation, { locale: "en", role: "owner_review" }));
    const active = container.querySelector('a[aria-current="page"]')!;
    expect(active.getAttribute("href")).toBe(navigation.pathname);
    expect(active.closest("details")?.open).toBe(true);
    await click(active.closest("details")!.querySelector("summary")!);
    expect(active.closest("details")?.open).toBe(false);
    await act(async () => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
      );
    });
    expect(document.querySelector("dialog")?.open).toBe(true);
    expect(document.querySelector("dialog")?.parentElement).toBe(document.body);
    await input(document.querySelector("#erp-command-search")!, "BOQ");
    expect(document.querySelectorAll(".erp-command-results li").length).toBeGreaterThan(0);
    const commandLink = document.querySelector(".erp-command-results a")!;
    commandLink.addEventListener("click", (event) => event.preventDefault());
    await click(commandLink);
    expect(document.querySelector("dialog")?.open).toBe(false);
  });
  it("hides ERP navigation from unsupported identities", async () => {
    await render(createElement(ErpNavigation, { locale: "en", role: "customer" }));
    expect(container.innerHTML).toBe("");
  });
  it("searches, sorts and opens read-only fixture details", async () => {
    await render(createElement(ErpRegister, { locale: "en", source: "projects" }));
    const data = getErpDataset("projects", "en")!;
    await select(
      [...container.querySelectorAll<HTMLSelectElement>(".erp-filterbar select")].at(-1)!,
      "desc",
    );
    expect(container.querySelector("tbody tr td")?.textContent).toBe(
      [...data.rows].sort((a, b) => b.id.localeCompare(a.id))[0]!.cells.ref,
    );
    await input(container.querySelector("input")!, data.rows[0]!.id);
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    await click(container.querySelector("tbody button")!);
    expect(container.querySelector("dialog")?.open).toBe(true);
    expect(container.querySelector("dialog a")?.getAttribute("href")).toBe(data.rows[0]!.href);
    expect(container.querySelector("dialog")?.textContent).toContain(erpText("preview", "en"));
    await click(button(erpText("close", "en")));
    expect(container.querySelector("dialog")?.open).toBe(false);
    await input(container.querySelector("input")!, "no-matching-project");
    expect(container.textContent).toContain(erpText("noResults", "en"));
  });
  it("pages BOQ fixtures without inventing additional rows", async () => {
    await render(createElement(ErpRegister, { locale: "en", source: "boq" }));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
    await click(button(erpText("next", "en")));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(
      getErpDataset("boq", "en")!.rows.length - 10,
    );
    expect(button(erpText("next", "en")).disabled).toBe(true);
    await click(button(erpText("previous", "en")));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(10);
  });
  it.each(["ar", "en"] as const)(
    "opens exactly the requested fixture in %s without changing it",
    async (locale) => {
      const request = previewRequests[1]!;
      const before = JSON.stringify(previewRequests);
      await render(
        createElement(RequestsBoard, {
          locale,
          appDict: getAppDictionary(locale),
          initialRequests: previewRequests,
          initialFocusId: request.id,
        }),
      );
      const dialog = container.querySelector("dialog[open]")!;
      expect(dialog).not.toBeNull();
      expect(dialog.textContent).toContain(request.id);
      expect(container.querySelector<HTMLSelectElement>("#req-status-select")?.value).toBe(
        request.status,
      );
      expect(JSON.stringify(previewRequests)).toBe(before);
    },
  );
  it("shows an unavailable message for missing focus and never substitutes another request", async () => {
    await render(
      createElement(RequestsBoard, {
        locale: "en",
        appDict: getAppDictionary("en"),
        initialRequests: previewRequests,
        focusUnavailable: true,
      }),
    );
    expect(container.querySelector("dialog[open]")).toBeNull();
    expect(container.textContent).toContain("referenced request is unavailable");
  });
  it("auto-expands the old active workspace and searches both languages", async () => {
    const oldPath = navigation.pathname;
    navigation.pathname = "/en/dashboard/finance";
    await render(createElement(ErpNavigation, { locale: "en", role: "owner_review" }));
    expect(
      container
        .querySelector('a[href="/en/dashboard/finance"][aria-current="page"]')
        ?.closest("details")?.open,
    ).toBe(true);
    await input(
      container.querySelector("#erp-nav-search")!,
      getAppDictionary("ar").dashboard.modules.finance,
    );
    expect(container.querySelector('a[href="/en/dashboard/finance"]')).not.toBeNull();
    navigation.pathname = oldPath;
  });
  it("filters the read-only page permission matrix without offering grants", async () => {
    await render(createElement(ErpAccessMatrix, { locale: "en" }));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(143);
    await select(container.querySelector<HTMLSelectElement>('select[id$="-module"]')!, "data");
    expect(container.querySelectorAll("tbody tr").length).toBeLessThan(143);
    expect(
      container.querySelector("[data-permission-selection-preview] button")?.textContent,
    ).toContain("preview");
    expect(container.querySelectorAll("tbody button")).toHaveLength(0);
    expect(container.querySelector('input[type="search"]')).not.toBeNull();
    expect(container.textContent).toContain("navigation");
  });
  it("validates JSON locally, displays safe errors and resets", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    await render(createElement(ErpImportValidator, { locale: "en" }));
    const textarea = container.querySelector("textarea")!;
    await input(textarea, JSON.stringify([{ reference: "R-1", name: "Example" }]));
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(container.querySelector(".is-valid")).not.toBeNull();
    expect(container.textContent).toContain(erpText("importUnavailable", "en"));
    await input(
      textarea,
      JSON.stringify([{ reference: "R-1", name: "Example", password: "must-not-echo" }]),
    );
    await act(async () => {
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });
    expect(container.querySelector(".is-invalid")?.textContent).not.toContain("must-not-echo");
    await click(button(erpText("reset", "en")));
    expect(textarea.value).toBe("");
    expect(container.querySelector(".erp-validation")).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
  });
  it("ignores pending file reads after reset", async () => {
    await render(createElement(ErpImportValidator, { locale: "en" }));
    let resolve!: (value: string) => void;
    const pending = new Promise<string>((r) => {
      resolve = r;
    });
    const file = { size: 15, text: () => pending };
    const fileInput = container.querySelector('input[type="file"]')!;
    Object.defineProperty(fileInput, "files", { value: [file] });
    await act(async () => {
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
    });
    await click(button(erpText("reset", "en")));
    await act(async () => {
      resolve("stale content");
    });
    expect(container.querySelector("textarea")?.value).toBe("");
  });
  it("disables metadata export for other roles", async () => {
    await render(createElement(ErpExport, { locale: "en", role: "customer" }));
    expect(container.querySelector("button")?.disabled).toBe(true);
  });
  it("downloads only static navigation metadata, never business records", async () => {
    const create = vi.fn((_blob: Blob) => "blob:test");
    const anchor = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: create });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: vi.fn() });
    await render(createElement(ErpExport, { locale: "en", role: "owner_review" }));
    await click(container.querySelector("button")!);
    expect(anchor).toHaveBeenCalledOnce();
    const blob = create.mock.calls[0]?.[0] as unknown as Blob;
    const content = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsText(blob);
    });
    const payload = JSON.parse(content);
    expect(payload.scope).toBe("navigation-metadata-only");
    expect(payload.businessRecords).toBe(false);
    expect(payload.modules).toHaveLength(15);
    expect(Object.keys(payload.modules[0])).toEqual(["name", "pages"]);
  });
});
