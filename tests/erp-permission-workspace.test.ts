// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErpPermissionSelectionPreview } from "@/components/dashboard/ErpPermissionSelectionPreview";
import { ErpPermissionPicker } from "@/components/dashboard/ErpPermissionPicker";
import { ErpIdentityWorkspace } from "@/components/dashboard/ErpIdentityWorkspace";
import { ErpScreenPreview } from "@/components/dashboard/ErpScreenPreview";
import { uiPermissions } from "@/lib/erp-ui-permissions";
import { previewUiRoles, previewUiUsers } from "@/content/erp-identity-preview";

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
  expect(element).toBeTruthy();
  await act(async () =>
    element.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true })),
  );
}
async function type(element: HTMLInputElement, value: string) {
  expect(element).toBeTruthy();
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(element: HTMLSelectElement, value: string) {
  expect(element).toBeTruthy();
  await act(async () => {
    element.value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
function button(text: string, scope: ParentNode = container) {
  const element = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  expect(element, text).toBeTruthy();
  return element!;
}
function dialog() {
  return container.querySelector<HTMLDialogElement>("dialog")!;
}
function permission(id: string) {
  const label = [...dialog().querySelectorAll(".erp-permission-option")].find((label) =>
    label.textContent?.includes(id),
  );
  expect(label, id).toBeTruthy();
  return label!.querySelector<HTMLInputElement>("input")!;
}
function group(id: string) {
  return dialog().querySelector<HTMLElement>(`[data-permission-group="${id}"]`)!;
}
async function openSandbox() {
  await render(createElement(ErpPermissionSelectionPreview, { locale: "en" }));
  const trigger = button("Select UI permissions — preview");
  trigger.focus();
  await click(trigger);
  return trigger;
}
async function searchPermissions(value: string) {
  await type(dialog().querySelector<HTMLInputElement>('input[type="search"]')!, value);
}
async function confirm() {
  await click(button("Review selection", dialog()));
  await click(button("Confirm preview selection", dialog()));
}

describe("Grouped permission picker — UI definitions, not authorization", () => {
  it.each(["ar", "en"] as const)(
    "opens a named, described, localized native modal in %s",
    async (locale) => {
      await render(createElement(ErpPermissionSelectionPreview, { locale }));
      await click(
        button(
          locale === "ar" ? "اختيار صلاحيات الواجهة — معاينة" : "Select UI permissions — preview",
        ),
      );
      expect(dialog().open).toBe(true);
      expect(dialog().getAttribute("dir")).toBe(locale === "ar" ? "rtl" : "ltr");
      expect(dialog().getAttribute("aria-modal")).toBe("true");
      expect(document.getElementById(dialog().getAttribute("aria-labelledby")!)?.textContent).toBe(
        locale === "ar" ? "اختيار صلاحيات الواجهة" : "Select UI permissions",
      );
      expect(
        document.getElementById(dialog().getAttribute("aria-describedby")!)?.textContent,
      ).toContain(locale === "ar" ? "لا تمنح وصولاً" : "Nothing grants access");
      expect(document.activeElement).toBe(dialog().querySelector('input[type="search"]'));
      expect(dialog().querySelectorAll("fieldset")).toHaveLength(15);
      expect(dialog().querySelectorAll(".erp-permission-option")).toHaveLength(165);
    },
  );
  it("searches labels, Arabic and exact identifiers with an honest empty state", async () => {
    await openSandbox();
    for (const query of ["Validate local JSON", "فحص JSON", "ui.data.validation.check_local"]) {
      await searchPermissions(query);
      expect(dialog().querySelectorAll(".erp-permission-option")).toHaveLength(1);
      expect(permission("ui.data.validation.check_local").checked).toBe(false);
    }
    await searchPermissions("no-such-permission");
    expect(dialog().querySelectorAll("fieldset")).toHaveLength(0);
    expect(dialog().textContent).toContain("No permissions match");
    expect(button("Select all matching", dialog()).disabled).toBe(true);
  });
  it("has individual, unchecked, partial and fully selected group states", async () => {
    await openSandbox();
    const check = group("permissions").querySelector<HTMLInputElement>(
      ".erp-permission-group-head input",
    )!;
    expect(check.checked).toBe(false);
    expect(check.indeterminate).toBe(false);
    await click(permission("ui.permissions.view"));
    expect(check.indeterminate).toBe(true);
    expect(check.getAttribute("aria-checked")).toBe("mixed");
    const size = uiPermissions.filter(
      (p) => p.group === "permissions" && p.availability !== "unavailable",
    ).length;
    expect(group("permissions").textContent).toContain(`1 / ${size}`);
    await click(check);
    expect(check.checked).toBe(true);
    expect(check.indeterminate).toBe(false);
    expect(group("permissions").textContent).toContain(`${size} / ${size}`);
    await click(button("Clear matching in this group", group("permissions")));
    expect(check.checked).toBe(false);
    expect(check.indeterminate).toBe(false);
  });
  it("scopes group selection to search matches and preserves hidden selections", async () => {
    await openSandbox();
    await searchPermissions("ui.data.view");
    await click(button("Select matching in this group", group("data")));
    await searchPermissions("ui.sales.view");
    await click(button("Select matching in this group", group("sales")));
    expect(dialog().querySelector('[role="status"]')?.textContent).toContain("2 selected");
    await click(button("Clear matching in this group", group("sales")));
    expect(dialog().querySelector('[role="status"]')?.textContent).toContain("1 selected");
    await click(button("Review selection", dialog()));
    expect(dialog().querySelector(".erp-permission-summary")?.textContent).toContain(
      "ui.data.view",
    );
    expect(dialog().querySelector(".erp-permission-summary")?.textContent).not.toContain(
      "ui.sales.view",
    );
  });
  it("selects all matching, clears matching, and does not select unavailable requirements", async () => {
    await openSandbox();
    await searchPermissions("create purchase document");
    expect(permission("ui.purchasing.invoices.create_document").disabled).toBe(true);
    expect(
      group("purchasing").querySelector<HTMLInputElement>(".erp-permission-group-head input")!
        .disabled,
    ).toBe(true);
    await searchPermissions("");
    await click(button("Select all matching", dialog()));
    expect(dialog().querySelector('[role="status"]')?.textContent).toContain("164 selected");
    expect(permission("ui.purchasing.invoices.create_document").checked).toBe(false);
    await click(button("Clear matching selection", dialog()));
    expect(dialog().querySelector('[role="status"]')?.textContent).toContain("0 selected");
  });
  it("expands/collapses groups with associated controls", async () => {
    await openSandbox();
    const toggle = group("data").querySelector<HTMLButtonElement>("button[aria-expanded]")!;
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await click(toggle);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(document.getElementById(toggle.getAttribute("aria-controls")!)!.hidden).toBe(false);
    await click(button("Collapse groups", dialog()));
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    await click(button("Expand groups", dialog()));
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
  });
  it("validates an empty preview, then reviews before confirmation", async () => {
    await openSandbox();
    await click(button("Review selection", dialog()));
    expect(dialog().querySelector('[role="alert"]')?.textContent).toContain("Choose at least one");
    await searchPermissions("ui.data.view");
    await click(permission("ui.data.view"));
    expect(dialog().querySelector('[role="alert"]')).toBeNull();
    await click(button("Review selection", dialog()));
    expect(document.activeElement?.textContent).toBe("Review temporary permission summary");
    expect(dialog().querySelector(".erp-permission-summary")!.textContent).toContain("View module");
    await click(button("Back to selection", dialog()));
    expect(permission("ui.data.view").checked).toBe(true);
    await confirm();
    expect(dialog()).toBeNull();
    expect(container.textContent).toContain("1 temporary definitions selected — not grants");
  });
  it("cancel and Escape discard the draft and restore opener focus", async () => {
    const previousOverflow = document.body.style.overflow;
    const trigger = await openSandbox();
    expect(document.body.style.overflow).toBe("hidden");
    await searchPermissions("ui.data.view");
    await click(permission("ui.data.view"));
    await act(async () =>
      dialog().dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      ),
    );
    expect(dialog()).toBeNull();
    expect(document.activeElement).toBe(trigger);
    expect(document.body.style.overflow).toBe(previousOverflow);
    expect(container.textContent).toContain("0 temporary definitions selected");
    await click(trigger);
    expect(permission("ui.data.view").checked).toBe(false);
    await click(button("Cancel", dialog()));
    expect(dialog()).toBeNull();
  });
  it("cancelling an edit leaves the previous confirmed preview unchanged", async () => {
    await openSandbox();
    await searchPermissions("ui.data.view");
    await click(permission("ui.data.view"));
    await confirm();
    await click(button("Select UI permissions — preview"));
    expect(permission("ui.data.view").checked).toBe(true);
    await click(permission("ui.data.view"));
    await click(button("Cancel", dialog()));
    expect(container.textContent).toContain("1 temporary definitions selected");
  });
  it("cycles Tab/Shift+Tab without reaching hidden group controls", async () => {
    await openSandbox();
    const first = dialog().querySelector<HTMLButtonElement>(".dialog-head button")!;
    const last = button("Review selection", dialog());
    last.focus();
    await act(async () =>
      last.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true }),
      ),
    );
    expect(document.activeElement).toBe(first);
    await act(async () =>
      first.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    );
    expect(document.activeElement).toBe(last);
  });
  it("normalizes unsupported initial values and never calls confirm before review", async () => {
    const confirm = vi.fn();
    const cancel = vi.fn();
    await render(
      createElement(ErpPermissionPicker, {
        locale: "en",
        initialSelected: ["server.admin", "ui.data.view", "ui.purchasing.invoices.create_document"],
        context: "Synthetic",
        onConfirm: confirm,
        onCancel: cancel,
      }),
    );
    expect(dialog().querySelector('[role="status"]')?.textContent).toContain("1 selected");
    expect(confirm).not.toHaveBeenCalled();
    await act(async () =>
      dialog().dispatchEvent(new Event("cancel", { bubbles: false, cancelable: true })),
    );
    expect(cancel).toHaveBeenCalledOnce();
    expect(confirm).not.toHaveBeenCalled();
  });
});

describe("User/role preview screens — no account or access mutation", () => {
  it.each(["ar", "en"] as const)(
    "renders page-specific user and role directories/details in %s",
    async (locale) => {
      await render(createElement(ErpIdentityWorkspace, { locale }));
      expect(container.querySelector("[data-identity-preview]")?.getAttribute("dir")).toBe(
        locale === "ar" ? "rtl" : "ltr",
      );
      expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
      expect(container.textContent).toContain("example.invalid");
      expect(container.querySelector('input[type="password"]')).toBeNull();
      await click(container.querySelector("tbody button")!);
      expect(container.querySelector(".erp-identity-detail")).not.toBeNull();
      expect(document.activeElement).toBe(container.querySelector(".erp-identity-detail"));
      await click(button(locale === "ar" ? "دليل الأدوار" : "Role directory"));
      expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
      await click(container.querySelector("tbody button")!);
      expect(
        container.querySelector(".erp-identity-detail .erp-permission-summary")!.textContent,
      ).toContain("ui.");
      expect(container.textContent).toContain(
        locale === "ar" ? "ليست سياسات وصول الشركة" : "not company access policies",
      );
    },
  );
  it("supports user search/status/role filters, sorting, pagination and empty states", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    const tbody = () => container.querySelector("tbody")!;
    const firstPage = tbody().textContent;
    await click(button("Next preview page"));
    expect(tbody().querySelectorAll("tr")).toHaveLength(3);
    expect(tbody().textContent).not.toBe(firstPage);
    await click(button("Previous preview page"));
    expect(tbody().textContent).toBe(firstPage);
    const sorts = [...container.querySelectorAll<HTMLSelectElement>(".erp-filterbar select")];
    await select(sorts.at(-1)!, "name-desc");
    const visibleLogins = () =>
      [...tbody().querySelectorAll("tr th")].map((cell) => cell.textContent);
    expect(visibleLogins()).toEqual(
      [...previewUiUsers]
        .sort((a, b) => b.name.en.localeCompare(a.name.en, "en"))
        .slice(0, 5)
        .map((u) => u.login),
    );
    await select(sorts.at(-1)!, "login");
    expect(visibleLogins()).toEqual(
      [...previewUiUsers]
        .sort((a, b) => a.login.localeCompare(b.login, "en"))
        .slice(0, 5)
        .map((u) => u.login),
    );
    await select(sorts[0]!, "inactive");
    expect(tbody().querySelectorAll("tr")).toHaveLength(2);
    await select(sorts[1]!, "preview-purchasing-reader");
    expect(tbody().querySelectorAll("tr")).toHaveLength(1);
    await type(
      container.querySelector<HTMLInputElement>('input[type="search"]')!,
      "nothing-matches",
    );
    expect(tbody().querySelectorAll("tr")).toHaveLength(0);
    expect(container.textContent).toContain("No synthetic rows match");
    await click(button("Clear directory filters"));
    expect(tbody().querySelectorAll("tr")).toHaveLength(5);
  });
  it("supports role module/search filters and role pagination", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en", initialMode: "roles" }));
    await click(button("Next preview page"));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    await select(
      container.querySelector<HTMLSelectElement>(".erp-filterbar select")!,
      "purchasing",
    );
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody")!.textContent).toContain("Preview purchasing reader");
    await type(
      container.querySelector<HTMLInputElement>('input[type="search"]')!,
      "no matching role",
    );
    expect(container.textContent).toContain("No synthetic rows match");
  });
  it("validates display edits, previews a role summary and applies only synthetic state", async () => {
    const before = JSON.stringify(previewUiUsers);
    const fetch = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await type(
      container.querySelector<HTMLInputElement>('input[type="search"]')!,
      "preview.reader",
    );
    await click(container.querySelector("tbody button")!);
    const name = container.querySelector<HTMLInputElement>(".erp-identity-detail form input")!;
    await type(name, " ");
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await type(name, "Synthetic changed name");
    await select(
      container.querySelector<HTMLSelectElement>(".erp-identity-detail form select")!,
      "inactive",
    );
    await act(async () =>
      container
        .querySelector("form")!
        .dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
    );
    expect(container.querySelector("tbody")!.textContent).toContain("Synthetic changed name");
    expect(container.querySelector("tbody")!.textContent).toContain("Inactive preview");
    const assignment = container.querySelector(".erp-role-assignment")!;
    const uiEditor = [...assignment.querySelectorAll("label")]
      .find((l) => l.textContent?.includes("Preview UI editor"))!
      .querySelector("input")!;
    await click(uiEditor);
    expect(assignment.textContent).toContain(
      "Preview role summary: Preview reader · Preview UI editor",
    );
    await click(button("Confirm temporary role list"));
    expect(container.querySelector("tbody")!.textContent).toContain("Preview UI editor");
    expect(container.textContent).toContain("No account, session, real role or access was changed");
    expect(JSON.stringify(previewUiUsers)).toBe(before);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    await render(createElement("div"));
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    expect(container.textContent).not.toContain("Synthetic changed name");
  });
  it("updates synthetic role permission counts only after picker confirmation", async () => {
    const before = JSON.stringify(previewUiRoles);
    const fetch = vi.spyOn(globalThis, "fetch");
    const storage = vi.spyOn(Storage.prototype, "setItem");
    const print = vi.spyOn(window, "print");
    await render(createElement(ErpIdentityWorkspace, { locale: "en", initialMode: "roles" }));
    await type(
      container.querySelector<HTMLInputElement>('input[type="search"]')!,
      "preview-ui-editor",
    );
    await click(container.querySelector("tbody button")!);
    await click(button("Choose UI permissions — preview"));
    await searchPermissions("ui.data.view");
    await click(permission("ui.data.view"));
    expect(container.querySelector("tbody tr td")?.textContent).toBeTruthy();
    await confirm();
    expect(
      container.querySelector(".erp-identity-detail .erp-permission-summary")!.textContent,
    ).toContain("ui.data.view");
    expect(container.querySelectorAll("tbody tr td")[1]!.textContent).toBe("4");
    expect(JSON.stringify(previewUiRoles)).toBe(before);
    expect(fetch).not.toHaveBeenCalled();
    expect(storage).not.toHaveBeenCalled();
    expect(print).not.toHaveBeenCalled();
  });
  it("the assignment route opens its own explicitly local assignment view", async () => {
    await render(
      createElement(ErpScreenPreview, { area: "permissions", page: "assignments", locale: "en" }),
    );
    expect(button("User-to-role assignment").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("tbody button")?.textContent).toContain(
      "Preview role assignment",
    );
  });
});
