import { describe, it, expect } from "vitest";
import {
  erpModules,
  erpPageCount,
  erpHref,
  findErpPage,
  legacyReference,
  canAccessErp,
} from "@/config/erp";
import { dashboardModules } from "@/config/navigation";
import { getErpDataset, erpDatasetNames, validateErpImport } from "@/lib/erp-data";
import { erpFields, erpCopy } from "@/content/erp-dictionary";
import { isReviewProtectedPath } from "@/lib/review-auth-shared";
import { searchErpPages } from "@/components/dashboard/ErpNavigation";

describe("ERP registry and evidence boundaries", () => {
  it("counts only actual categories/pages and keeps legacy metadata separate", () => {
    expect(erpModules).toHaveLength(15);
    expect(erpPageCount).toBe(143);
    expect(legacyReference).toEqual({
      reportedModules: 21,
      reportedPages: 337,
      namedCategories: 15,
      independentlyVerifiedInternalPages: 0,
    });
    expect(erpModules.find((x) => x.id === "quality")?.provenance).toBe("adapted");
  });
  it("has unique, safe, bilingual, protected destinations and valid existing sources", () => {
    const routes = new Set<string>();
    for (const area of erpModules) {
      expect(area.id).toMatch(/^[a-z-]+$/);
      expect(area.boundary.ar).toBeTruthy();
      expect(area.boundary.en).toBeTruthy();
      for (const page of area.pages) {
        expect(page.id).toMatch(/^[a-z-]+$/);
        for (const locale of ["ar", "en"] as const) {
          expect(page.title[locale]).toBeTruthy();
          expect(page.section[locale]).toBeTruthy();
          const href = erpHref(locale, area.id, page.id);
          expect(routes.has(href)).toBe(false);
          routes.add(href);
          expect(isReviewProtectedPath(href)).toBe(true);
          for (const field of page.fields) expect(erpFields[field]?.[locale], field).toBeTruthy();
        }
        expect(findErpPage(area.id, page.id)?.page).toBe(page);
        if (page.source?.startsWith("link:"))
          expect(
            dashboardModules.some((x) => x.key === page.source?.slice(5)),
            page.source,
          ).toBe(true);
        if (page.source?.startsWith("data:"))
          expect(erpDatasetNames).toContain(page.source.slice(5));
      }
    }
    expect(routes.size).toBe(286);
    expect(findErpPage("missing", "missing")).toBeUndefined();
    expect(findErpPage("sales", "missing")).toBeUndefined();
    expect(findErpPage("__proto__", "constructor")).toBeUndefined();
  });
  it("localizes every common UI label", () => {
    for (const label of Object.values(erpCopy)) {
      expect(label.ar).toBeTruthy();
      expect(label.en).toBeTruthy();
    }
  });
  it("gates ERP presentation to the actual existing owner role", () => {
    expect(canAccessErp("owner_review")).toBe(true);
    for (const role of [undefined, null, "owner", "admin", "customer", {}, true])
      expect(canAccessErp(role)).toBe(false);
  });
  it("searches titles, categories and sections across both languages", () => {
    expect(searchErpPages("")).toHaveLength(143);
    expect(searchErpPages("QUOTATION").some((x) => x.page.id === "quotations")).toBe(true);
    expect(searchErpPages("شيكات").length).toBeGreaterThan(0);
    expect(searchErpPages("zzzz-no-result")).toHaveLength(0);
  });
  it("keeps the complete construction workflow discoverable", () => {
    for (const [area, page] of [
      ["sales", "requests"],
      ["sales", "inspections"],
      ["sales", "quotations"],
      ["sales", "decisions"],
      ["sales", "contracts"],
      ["projects", "phases"],
      ["projects", "progress"],
      ["quality", "inspections"],
      ["projects", "weekly-reports"],
      ["projects", "handover"],
      ["projects", "warranty"],
    ] as const)
      expect(findErpPage(area, page), `${area}/${page}`).toBeTruthy();
  });
});
describe("Read-only, distinct illustrative datasets", () => {
  for (const locale of ["ar", "en"] as const)
    it(`maps every declared source with real columns in ${locale}`, () => {
      for (const source of erpDatasetNames) {
        const dataset = getErpDataset(source, locale)!;
        expect(dataset, source).toBeDefined();
        expect(new Set(dataset.rows.map((x) => x.id)).size, source).toBe(dataset.rows.length);
        for (const row of dataset.rows) {
          for (const column of dataset.columns)
            expect(typeof row.cells[column], `${source}/${column}`).toBe("string");
          if (row.href)
            expect(row.href).toMatch(new RegExp(`^/${locale}/dashboard/(projects|customers)/`));
        }
      }
    });
  it("does not infer supplier invoices/payments/stock or expose unknown sources", () => {
    for (const source of ["supplier-invoices", "supplier-payments", "inventory", "__proto__"])
      expect(getErpDataset(source, "en")).toBeUndefined();
    const sets = ["invoices", "certificates", "payments", "receipts", "expenses"].map((x) =>
      getErpDataset(x, "en")!.rows.map((row) => row.id),
    );
    expect(new Set(sets.flat()).size).toBe(sets.flat().length);
  });
});
describe("Validation-only import", () => {
  const valid = { reference: "REF-1", name: "اسم تجريبي", email: "example@example.com" };
  it("accepts a bounded proposed schema without changing input", () => {
    const input = JSON.stringify([valid]);
    expect(validateErpImport(input)).toEqual({ valid: true, count: 1, issues: [] });
    expect(input).toBe(JSON.stringify([valid]));
  });
  it.each([
    "not json",
    "null",
    "{}",
    "[]",
    "[null]",
    "[[]]",
    JSON.stringify(Array.from({ length: 501 }, () => valid)),
    " ".repeat(262145),
    JSON.stringify([{ ...valid, name: "أ".repeat(140000) }]),
  ])("rejects malformed, oversized or invalid JSON", (text) => {
    expect(validateErpImport(text).valid).toBe(false);
  });
  it.each([
    { ...valid, reference: "../bad" },
    { ...valid, reference: "" },
    { ...valid, reference: 34 },
    { ...valid, name: " " },
    { ...valid, name: "bad\nname" },
    { ...valid, email: "not email" },
    { ...valid, role: "admin" },
    { ...valid, email: null },
  ])("rejects invalid fields without reflecting raw input", (record) => {
    const result = validateErpImport(JSON.stringify([record]));
    expect(result.valid).toBe(false);
    for (const issue of result.issues) expect(Object.keys(issue).sort()).toEqual(["field", "row"]);
  });
  it("rejects normalized duplicate references with the precise row", () => {
    expect(
      validateErpImport(JSON.stringify([valid, { ...valid, reference: "ref-1" }])).issues,
    ).toContainEqual({ row: 2, field: "reference" });
  });
});
