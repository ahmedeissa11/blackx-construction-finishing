import { describe, expect, it } from "vitest";
import { erpModules } from "@/config/erp";
import { completionScreenSpecs } from "@/config/erp-screen-completion";
import { erpScreenSpecs, getScreenViews } from "@/config/erp-screen-specs";
import {
  previewAmount,
  previewDecimal,
  previewJournal,
  previewLineTotal,
  type PreviewCostLine,
} from "@/lib/erp-local-calculations";
import { previewUserIssues } from "@/lib/erp-preview-users";
import { previewUiUsers } from "@/content/erp-identity-preview";
const line: PreviewCostLine = {
  description: "Synthetic finish",
  quantity: "2.5",
  unit: "m²",
  price: "10.00",
  discount: "10",
  allocation: "",
  expected: "",
};
describe("Comprehensive frontend coverage without route or data inflation", () => {
  it("profiles all 59 deferred routes, preserves their unavailable kinds and sources", () => {
    const deferred = erpModules.flatMap((area) =>
      area.pages
        .filter((page) => page.kind === "deferred")
        .map((page) => ({ route: `${area.id}/${page.id}`, page })),
    );
    expect(deferred).toHaveLength(59);
    expect(Object.keys(completionScreenSpecs)).toHaveLength(33);
    for (const { route, page } of deferred) {
      expect(erpScreenSpecs[route]?.length, route).toBeGreaterThan(0);
      expect(page.source).toBeUndefined();
      expect(page.title.en).toMatch(/^Deferred — /);
    }
    for (const [route, views] of Object.entries(completionScreenSpecs)) {
      expect(deferred.some((entry) => entry.route === route)).toBe(true);
      expect(views.every((view) => view.evidence === "adapted")).toBe(true);
      expect(views.every((view) => !view.columns.includes("openingDebit"))).toBe(true);
    }
  });
  it("separates balance sheet, budget and account statement purposes and columns", () => {
    const reports = getScreenViews("accounting", "reports");
    expect(reports[0]?.id).toBe("trial-balance");
    expect(reports.find((v) => v.id === "general-budget")!.columns).toEqual([
      "account",
      "plannedAmount",
      "actualAmount",
      "variance",
    ]);
    expect(reports.find((v) => v.id === "balance-sheet")!.evidence).toBe("adapted");
    expect(reports.find((v) => v.id === "account-statement")!.columns).toContain("date");
    expect(getScreenViews("reporting", "financial")).toEqual(reports);
  });
  it("keeps bank reconciliation and warehouse quantities separate from cash fixtures", () => {
    expect(getScreenViews("treasury", "reconciliation")[0]!.columns).toEqual(
      expect.arrayContaining(["bankAccount", "sourceDocument", "discrepancy"]),
    );
    expect(getScreenViews("inventory", "balances")[0]!.columns).toEqual([
      "warehouse",
      "item",
      "unit",
      "onHand",
      "reserved",
      "availability",
    ]);
    expect(getScreenViews("inventory", "adjustments")[0]!.sensitive).toBe(true);
    expect(getScreenViews("administration", "security")[0]!.draft).toEqual([]);
    expect(getScreenViews("data", "history")[0]!.dependency.en).toContain(
      "do not become business-data operation history",
    );
  });
});
describe("Displayed-input arithmetic only, exact decimal rules", () => {
  it.each(["", "-1", "1e3", "NaN", "Infinity", "1,000", ".5", "1.", "1.001", "1000000000", "1 2"])(
    "rejects invalid two-place decimal %j",
    (value) => expect(previewDecimal(value)).toBeNull(),
  );
  it("accepts Arabic/Latin decimal input and formats exact signed hundredths", () => {
    expect(previewDecimal("١٢٫٣٠")).toBe(1230n);
    expect(previewDecimal("۱۲٫۳۰")).toBe(1230n);
    expect(previewDecimal(" 0001.2 ")).toBe(120n);
    expect(previewDecimal("0")).toBe(0n);
    expect(previewAmount(-1n)).toBe("−0.01");
    expect(previewAmount(-1250n, 3)).toBe("−1.250");
  });
  it("calculates only the declared quantity/price/discount inputs", () => {
    expect(previewLineTotal(line)).toBe(2250n);
    expect(previewLineTotal({ ...line, quantity: "0.005", price: "1", discount: "0" })).toBe(1n);
    expect(previewLineTotal({ ...line, quantity: "0.004", price: "1", discount: "0" })).toBe(0n);
    expect(previewLineTotal({ ...line, discount: "100" })).toBe(0n);
    expect(previewLineTotal({ ...line, price: "0" })).toBe(0n);
    expect(
      previewLineTotal({
        ...line,
        quantity: "999999999.999",
        price: "999999999.99",
        discount: "0",
      }),
    ).toBe(99999999998900000000n);
  });
  it.each([
    { description: " " },
    { unit: "" },
    { quantity: "0" },
    { quantity: "-1" },
    { quantity: "1.0001" },
    { price: "1.001" },
    { discount: "100.01" },
    { discount: "" },
  ])("refuses invalid/undisclosed cost line %j", (change) =>
    expect(previewLineTotal({ ...line, ...change })).toBeNull(),
  );
  it("balances valid described journal inputs and exposes a nonzero difference", () => {
    const journal = [
      { account: "SYN-A", description: "Synthetic debit", debit: "100.01", credit: "" },
      { account: "SYN-B", description: "Synthetic credit", debit: "", credit: "100.01" },
    ];
    expect(previewJournal(journal)).toEqual({
      debit: 10001n,
      credit: 10001n,
      difference: 0n,
      balanced: true,
    });
    expect(previewJournal([journal[0]!, { ...journal[1]!, credit: "99.99" }])).toEqual({
      debit: 10001n,
      credit: 9999n,
      difference: 2n,
      balanced: false,
    });
    expect(previewJournal(journal)).toEqual(previewJournal([...journal].reverse()));
  });
  it.each([
    { account: "" },
    { description: " " },
    { debit: "0" },
    { debit: "-1" },
    { debit: "1.001" },
    { credit: "1" },
  ])("refuses invalid or double-sided journal input %j", (change) => {
    expect(
      previewJournal([
        { account: "SYN-A", description: "Demo debit", debit: "1", credit: "", ...change },
        { account: "SYN-B", description: "Demo credit", debit: "", credit: "1" },
      ]),
    ).toBeNull();
    expect(previewJournal([])).toBeNull();
    expect(
      previewJournal([{ account: "SYN-A", description: "Only line", debit: "1", credit: "" }]),
    ).toBeNull();
  });
});
describe("Synthetic user form validation is not account policy", () => {
  const valid = {
    name: "New synthetic user",
    login: "preview.synthetic-new",
    email: "synthetic-new@example.invalid",
  };
  it("accepts only a unique synthetic namespace and bounded display label", () => {
    expect(previewUserIssues(valid, previewUiUsers)).toEqual([]);
    expect(
      previewUserIssues(
        { ...valid, name: "x", login: "real.user", email: "person@example.com" },
        previewUiUsers,
      ),
    ).toEqual(["name", "login", "email"]);
    expect(previewUserIssues({ ...valid, name: "x".repeat(81) }, previewUiUsers)).toEqual(["name"]);
  });
  it("checks case-insensitive uniqueness, excluding the selected row on edit", () => {
    const existing = previewUiUsers[0]!;
    const duplicate = {
      name: valid.name,
      login: existing.login.toUpperCase(),
      email: existing.email.toUpperCase(),
    };
    expect(previewUserIssues(duplicate, previewUiUsers)).toEqual(["login", "email"]);
    expect(previewUserIssues(duplicate, previewUiUsers, existing.id)).toEqual([]);
  });
});
