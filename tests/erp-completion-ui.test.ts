// @vitest-environment jsdom
import { act, createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { beforeEach, afterEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { ErpIdentityWorkspace } from "@/components/dashboard/ErpIdentityWorkspace";
import { ErpScreenPreview } from "@/components/dashboard/ErpScreenPreview";
import { ErpAccountHierarchy } from "@/components/dashboard/ErpAccountingPreview";
import { ErpCostWorkbench, ErpJournalWorkbench } from "@/components/dashboard/ErpLocalWorkbenches";
import { previewUiRoles, previewUiUsers } from "@/content/erp-identity-preview";
let container: HTMLDivElement, root: Root;
const seeds = JSON.stringify([previewUiUsers, previewUiRoles]);
let fetchSpy: MockInstance<typeof globalThis.fetch>,
  storageSpy: ReturnType<typeof vi.spyOn>,
  printSpy: ReturnType<typeof vi.spyOn>;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  fetchSpy = vi.spyOn(globalThis, "fetch");
  storageSpy = vi.spyOn(Storage.prototype, "setItem");
  printSpy = vi.spyOn(window, "print");
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  expect(fetchSpy).not.toHaveBeenCalled();
  expect(storageSpy).not.toHaveBeenCalled();
  expect(printSpy).not.toHaveBeenCalled();
  expect(JSON.stringify([previewUiUsers, previewUiRoles])).toBe(seeds);
  vi.restoreAllMocks();
});
async function render(node: ReactNode) {
  await act(async () => root.render(node));
}
async function click(element: Element) {
  expect(element).toBeTruthy();
  await act(async () => (element as HTMLElement).click());
}
function button(text: string, scope: ParentNode = container) {
  const element = [...scope.querySelectorAll<HTMLButtonElement>("button")].find(
    (b) => b.textContent?.trim() === text,
  );
  expect(element, text).toBeTruthy();
  return element!;
}
function field(label: string, scope: ParentNode = container) {
  const element = [...scope.querySelectorAll("label")].find((item) =>
    item.textContent?.trim().startsWith(label),
  );
  expect(element, label).toBeTruthy();
  return (element!.querySelector("input,select,textarea") ??
    document.getElementById(element!.htmlFor)) as HTMLInputElement;
}
async function type(element: HTMLInputElement | HTMLTextAreaElement, value: string) {
  expect(element).toBeTruthy();
  await act(async () => {
    const proto =
      element instanceof HTMLTextAreaElement
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value")!.set!.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function select(element: Element, value: string) {
  await act(async () => {
    (element as HTMLSelectElement).value = value;
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}
async function submit(form: Element) {
  await act(async () =>
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })),
  );
}
async function fillUser(
  name = "Synthetic new reviewer",
  login = "preview.new-reviewer",
  email = "new-reviewer@example.invalid",
) {
  const form = container.querySelector('form[aria-label="Add synthetic user — not an account"]')!;
  await type(field("Synthetic display name", form), name);
  await type(field("Synthetic login identifier", form), login);
  await type(field("Synthetic email", form), email);
  return form;
}
async function fillCost(index = 0, quantity = "2.5", price = "10", discount = "10") {
  for (const [key, value] of Object.entries({
    description: "Synthetic finish",
    quantity,
    unit: "m²",
    price,
    discount,
  }))
    await type(container.querySelector<HTMLInputElement>(`input[id$="-${index}-${key}"]`)!, value);
}
async function fillJournal() {
  for (const [index, values] of [
    { account: "DEMO-A", description: "Synthetic debit", debit: "100.01" },
    { account: "DEMO-B", description: "Synthetic credit", credit: "100.01" },
  ].entries()) {
    for (const [key, value] of Object.entries(values))
      await type(
        container.querySelector<HTMLInputElement>(`input[id$="-${index}-${key}"]`)!,
        value,
      );
  }
}
describe("Local user creation, search, cancellation and confirmed context", () => {
  it("cancels a local add draft, restores focus and reopens with blank fields", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    const add = button("Add synthetic user");
    await click(add);
    await fillUser();
    expect(container.querySelectorAll("tbody tr")).toHaveLength(5);
    await click(button("Cancel synthetic user draft"));
    expect(document.activeElement).toBe(add);
    expect(
      container.querySelector('form[aria-label="Add synthetic user — not an account"]'),
    ).toBeNull();
    await click(add);
    expect(field("Synthetic display name").value).toBe("");
    expect(container.textContent).toContain("8 synthetic users");
  });
  it("validates required fields and focuses the first invalid labeled input", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await click(button("Add synthetic user"));
    await submit(container.querySelector("form")!);
    expect(container.querySelectorAll('[aria-invalid="true"]')).toHaveLength(3);
    expect(document.activeElement).toBe(field("Synthetic display name"));
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("Nothing created");
    expect(container.textContent).toContain("8 synthetic users");
  });
  it("rejects duplicate case-insensitive login/email and real-domain addresses", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await click(button("Add synthetic user"));
    const form = await fillUser(
      "Synthetic duplicate",
      previewUiUsers[0]!.login.toUpperCase(),
      previewUiUsers[0]!.email.toUpperCase(),
    );
    await submit(form);
    expect(field("Synthetic login identifier").getAttribute("aria-invalid")).toBe("true");
    expect(field("Synthetic email").getAttribute("aria-invalid")).toBe("true");
    await type(field("Synthetic login identifier"), "preview.unique");
    await type(field("Synthetic email"), "person@example.com");
    await submit(form);
    expect(field("Synthetic email").getAttribute("aria-invalid")).toBe("true");
    expect(container.textContent).toContain("8 synthetic users");
  });
  it("creates only a synthetic row, exposes suspended filtering/search and module summaries", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await click(button("Add synthetic user"));
    const form = await fillUser();
    await select(field("Initial simulated status", form), "suspended");
    await select(field("Initial synthetic role", form), "preview-reader");
    await submit(form);
    expect(container.textContent).toContain("9 synthetic users");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    expect(container.querySelector("tbody")?.textContent).toContain("Suspended preview");
    expect(document.activeElement).toBe(button("Add synthetic user"));
    await click(button("Clear directory filters"));
    await select(field("Preview user status"), "suspended");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
    await click(button("Inspect preview user — preview.new-reviewer"));
    const summary = container.querySelector(".erp-module-access-summary")!;
    expect(summary.textContent).toContain("ui.crm.view");
    expect(summary.textContent).toContain("not access grants");
    expect(summary.textContent).toContain("Last activity is unavailable");
    expect(container.textContent).toContain("No account, session, real role or access was changed");
    await click(button("Clear directory filters"));
    await type(field("Search synthetic users"), "Suspended preview");
    expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
  });
  it("cancels unconfirmed login/email/status edits, then applies a validated local edit", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await type(field("Search synthetic users"), "preview.coordinator");
    await click(container.querySelector("tbody button")!);
    const form = container.querySelector('form[aria-label="Edit synthetic display only"]')!;
    await type(field("Preview login", form), "preview.changed");
    await type(field("Preview email", form), "changed@example.invalid");
    await select(field("Simulated status", form), "suspended");
    await click(button("Cancel unconfirmed display edits"));
    expect(field("Preview login", form).value).toBe("preview.coordinator");
    expect(field("Simulated status", form).value).toBe("active");
    await type(field("Preview email", form), "real@example.com");
    await submit(form);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("No changes applied");
    await type(field("Preview email", form), "changed@example.invalid");
    await type(field("Preview login", form), "preview.changed");
    await select(field("Simulated status", form), "suspended");
    await submit(form);
    expect(container.querySelector("tbody button")).toBeNull();
    await click(button("Close preview details"));
    expect(document.activeElement).toBe(field("Search synthetic users"));
    await click(button("Clear directory filters"));
    await type(field("Search synthetic users"), "changed@example.invalid");
    expect(container.querySelector("tbody")?.textContent).toContain("preview.changed");
    expect(container.querySelector("tbody")?.textContent).toContain("Suspended preview");
  });
  it("keeps unconfirmed role choices out of the module definition summary", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await type(field("Search synthetic users"), "preview.unassigned");
    await click(container.querySelector("tbody button")!);
    const summary = container.querySelector(".erp-module-access-summary")!;
    expect(summary.textContent).not.toContain("ui.crm.view");
    await click(container.querySelector('.erp-role-assignment input[type="checkbox"]')!);
    expect(summary.textContent).not.toContain("ui.crm.view");
    await click(button("Confirm temporary role list"));
    expect(summary.textContent).toContain("ui.crm.view");
    expect(summary.textContent).toContain("Module-view selections never imply page");
  });
  it("renders Arabic add/error labels in RTL without provisioning fields", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "ar" }));
    await click(button("إضافة مستخدم اصطناعي"));
    await submit(container.querySelector("form")!);
    expect(container.querySelector("[data-identity-preview]")?.getAttribute("dir")).toBe("rtl");
    expect(container.querySelector('[role="alert"]')?.textContent).toContain("لم يُنشأ شيء");
    expect(container.querySelector('input[type="password"],input[type="file"]')).toBeNull();
    await click(button("إلغاء مسودة المستخدم الاصطناعي"));
    expect(document.activeElement).toBe(button("إضافة مستخدم اصطناعي"));
  });
  it("does not persist newly created rows across remounts or fabricate activity dates", async () => {
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    await click(button("Add synthetic user"));
    await submit(await fillUser());
    expect(container.querySelector("tbody")?.textContent).toContain(
      "Unavailable — no activity source",
    );
    expect(container.querySelector("time")).toBeNull();
    await render(createElement("div"));
    await render(createElement(ErpIdentityWorkspace, { locale: "en" }));
    expect(container.textContent).toContain("8 synthetic users");
    expect(container.querySelector("tbody")?.textContent).not.toContain("preview.new-reviewer");
  });
});
describe("Journal and construction workbench behavior", () => {
  it("rejects blank lines, balances displayed inputs, detects a difference, and clears", async () => {
    await render(createElement(ErpJournalWorkbench, { locale: "en" }));
    const form = container.querySelector("form")!;
    await submit(form);
    expect(container.querySelector('[role="alert"]')?.textContent).toContain(
      "No totals calculated",
    );
    await fillJournal();
    await submit(form);
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "Balanced arithmetic only — not postable",
    );
    expect(container.querySelector('[role="status"]')?.textContent).toContain("100.01");
    await type(container.querySelector<HTMLInputElement>('input[id$="-1-credit"]')!, "99.99");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("Unbalanced preview");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("0.02");
    await type(container.querySelector<HTMLInputElement>('input[id$="-0-credit"]')!, "1");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await click(button("Clear journal exercise"));
    expect(container.querySelector('[role="status"],[role="alert"]')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[id$="-0-debit"]')!.value).toBe("");
  });
  it("adds/removes lines, enforces the 20-line UI cap and restores focus on removal", async () => {
    await render(createElement(ErpJournalWorkbench, { locale: "en" }));
    for (let i = 2; i < 20; i++) await click(button("Add journal line"));
    expect(container.querySelectorAll("fieldset")).toHaveLength(20);
    expect(button("Add journal line").disabled).toBe(true);
    await click(button("Remove preview line 20"));
    expect(container.querySelectorAll("fieldset")).toHaveLength(19);
    expect(button("Add journal line").disabled).toBe(false);
    expect(document.activeElement).toBe(button("Check displayed-input balance"));
  });
  it("sums individually rounded cost lines and never assumes tax/currency or saving", async () => {
    await render(createElement(ErpCostWorkbench, { locale: "en", mode: "boq" }));
    await fillCost(0, "0.005", "1", "0");
    await click(button("Add cost line"));
    await fillCost(1, "0.005", "1", "0");
    await submit(container.querySelector("form")!);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("0.02");
    expect(container.textContent).toContain("not a currency or company balance");
    expect(container.textContent).toContain(
      "Internal exercise note — never customer-visible or sent",
    );
    await click(button("Remove preview line 1"));
    await submit(container.querySelector("form")!);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("0.01");
    await click(button("Clear line exercise"));
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[id$="-0-quantity"]')!.value).toBe("");
  });
  it("requires receipt expectations and derives the signed displayed-quantity discrepancy", async () => {
    await render(createElement(ErpCostWorkbench, { locale: "en", mode: "purchase-receipts" }));
    await fillCost();
    await submit(container.querySelector("form")!);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await type(container.querySelector<HTMLInputElement>('input[id$="-0-expected"]')!, "3");
    await submit(container.querySelector("form")!);
    expect(container.textContent).toContain("Received minus expected: −0.500");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("22.50");
    for (const [expected, difference] of [
      ["2.5", "0.000"],
      ["2", "0.500"],
      ["0", "2.500"],
    ]) {
      await type(container.querySelector<HTMLInputElement>('input[id$="-0-expected"]')!, expected!);
      expect(container.textContent).toContain(`Received minus expected: ${difference}`);
      expect(container.querySelector('[role="status"]')?.textContent).toContain(
        "no tax or posting",
      );
    }
    await type(container.querySelector<HTMLInputElement>('input[id$="-0-expected"]')!, "-1");
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(container.querySelector('[role="status"]')).toBeNull();
    expect(container.textContent).not.toContain("Calculated preview line total");
  });
  it("requires an original reference/reason for return arithmetic without reversing stock", async () => {
    await render(createElement(ErpCostWorkbench, { locale: "en", mode: "purchase-returns" }));
    await fillCost();
    await submit(container.querySelector("form")!);
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    await type(field("Synthetic original document reference"), "SYN-ORIGINAL");
    await type(container.querySelector("textarea")!, "Synthetic excess quantity");
    await submit(container.querySelector("form")!);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("22.50");
    expect(container.textContent).toContain("No real records or accounts");
  });
  it("clears line/note state when switching purchase layouts and preserves bounded deep links", async () => {
    await render(
      createElement(ErpScreenPreview, { area: "purchasing", page: "invoices", locale: "en" }),
    );
    await fillCost();
    await type(container.querySelector("textarea")!, "Synthetic internal note");
    await click(button("Purchase orders"));
    expect(container.querySelector('[data-local-cost="purchase-orders"]')).not.toBeNull();
    expect(container.querySelector<HTMLInputElement>('input[id$="-0-quantity"]')!.value).toBe("");
    expect(container.querySelector("textarea")!.value).toBe("");
    expect(container.querySelector('a[href$="?view=purchase-orders"]')).not.toBeNull();
  });
  it("supports Arabic decimal inputs, localized output scope and RTL workbenches", async () => {
    await render(createElement(ErpCostWorkbench, { locale: "ar", mode: "boq" }));
    await fillCost(0, "٢٫٥", "١٠", "١٠");
    await submit(container.querySelector("form")!);
    expect(container.querySelector("[data-local-cost]")?.getAttribute("dir")).toBe("rtl");
    expect(container.querySelector('[role="status"]')?.textContent).toContain("22.50");
    expect(container.textContent).toContain("دون ضريبة أو ترحيل");
  });
});
describe("Hierarchy, purpose-specific reports and read-only prerequisites", () => {
  it("filters types/status and retains ancestors of matches with inspected details", async () => {
    await render(createElement(ErpAccountHierarchy, { locale: "en" }));
    await type(field("Search example account"), "DEMO-A2");
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "1 matching synthetic nodes",
    );
    expect(container.querySelector("nav")?.textContent).toContain("DEMO-A ·");
    expect(container.querySelector("nav")?.textContent).toContain("DEMO-A2");
    await click(button("DEMO-A2 · Illustrative archived subaccount · Inactive example"));
    expect(container.querySelector("aside")?.textContent).toContain("DEMO-A");
    await select(field("Example account type"), "liability");
    expect(container.textContent).toContain("No synthetic nodes match");
    expect(container.querySelector("aside")?.textContent).toContain("archived subaccount");
    const close = button("Close account inspection");
    close.focus();
    await click(close);
    expect(document.activeElement).toBe(field("Search example account"));
    await click(button("Clear hierarchy filters"));
    await select(field("Example account status"), "inactive");
    expect(container.querySelector('[role="status"]')?.textContent).toContain(
      "1 matching synthetic nodes",
    );
    expect(container.querySelector("table")).toBeNull();
    const node = button("DEMO-A2 · Illustrative archived subaccount · Inactive example");
    await click(node);
    button("Close account inspection").focus();
    await click(button("Close account inspection"));
    expect(document.activeElement).toBe(node);
    await click(node);
    const disclosure = node.closest("details")!;
    await click(disclosure.querySelector("summary")!);
    expect(disclosure.open).toBe(false);
    button("Close account inspection").focus();
    await click(button("Close account inspection"));
    expect(document.activeElement).toBe(field("Search example account"));
  });
  it.each(["ar", "en"] as const)(
    "keeps %s financial statement/budget layouts and closing prerequisites unknown",
    async (locale) => {
      await render(
        createElement(ErpScreenPreview, {
          area: "accounting",
          page: "reports",
          initialView: "balance-sheet",
          locale,
        }),
      );
      expect(
        container.querySelector('[data-report-template="balance-sheet"]')?.textContent,
      ).toContain(locale === "ar" ? "تصنيف حقوق الملكية" : "Equity classification");
      expect(container.querySelector("tbody")?.textContent).toContain(
        locale === "ar" ? "هذا ليس رصيداً صفرياً" : "This is not a zero balance",
      );
      await click(
        button(locale === "ar" ? "تقرير الموازنة العامة" : "Public / general budget report"),
      );
      expect(
        container.querySelector('[data-report-template="general-budget"]')?.textContent,
      ).toContain(locale === "ar" ? "ليست ميزانية عمومية" : "not a balance sheet");
      expect(container.querySelector("thead")?.textContent).toContain(
        locale === "ar" ? "قيمة الموازنة المعتمدة" : "Approved budget amount",
      );
      await render(
        createElement(ErpScreenPreview, {
          key: "closing",
          area: "accounting",
          page: "corrections",
          locale,
        }),
      );
      expect(container.querySelectorAll("[data-closing-prerequisites] li")).toHaveLength(5);
      expect(container.querySelector("[data-closing-prerequisites] input")).toBeNull();
    },
  );
  it.each(["treasury", "inventory"])(
    "checks %s adapted layout parameters without querying or manufacturing rows",
    async (area) => {
      await render(
        createElement(ErpScreenPreview, {
          area,
          page: area === "treasury" ? "reconciliation" : "history",
          locale: "en",
        }),
      );
      await type(
        container.querySelector<HTMLInputElement>('input[id$="-filter-from"]')!,
        "2026-10-26",
      );
      await type(
        container.querySelector<HTMLInputElement>('input[id$="-filter-to"]')!,
        "2026-10-01",
      );
      await submit(container.querySelector('form[aria-label="Layout parameters only"]')!);
      expect(container.querySelector('[id$="-filter-to"]')?.getAttribute("aria-invalid")).toBe(
        "true",
      );
      expect(container.querySelectorAll("tbody tr")).toHaveLength(1);
      expect(container.querySelector("tbody")?.textContent).toContain("No authorized records");
    },
  );
});
