import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { erpModules, findErpPage } from "@/config/erp";
import {
  erpScreenSpecs,
  getScreenViews,
  resolveScreenView,
  screenFields,
  screenReference,
  validateScreenInputs,
} from "@/config/erp-screen-specs";
import { ErpScreenPreview } from "@/components/dashboard/ErpScreenPreview";
import retainedRouteIds from "./fixtures/erp-route-ids.json";

const placements = Object.entries(erpScreenSpecs).flatMap(([route, views]) =>
  views.map((view) => ({ route, view })),
);
const escape = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");

describe("Second recording: bounded layout metadata, not additional routes", () => {
  it("preserves exactly 15 hubs / 143 IDs and the independent-verification boundary", () => {
    expect(erpModules).toHaveLength(15);
    expect(erpModules.flatMap((area) => area.pages.map((page) => `${area.id}/${page.id}`))).toEqual(
      retainedRouteIds,
    );
    expect(Object.keys(erpScreenSpecs)).toHaveLength(76);
    expect(placements).toHaveLength(109);
    expect(new Set(placements.map(({ view }) => view.id)).size).toBe(93);
    expect(screenReference).toEqual({
      approximateDurationSeconds: 246,
      independentlyVerified: false,
    });
  });
  it.each(Object.entries(erpScreenSpecs))(
    "%s reuses an existing route with safe unique view IDs",
    (route, views) => {
      const [area, page] = route.split("/");
      expect(findErpPage(area!, page!)).toBeDefined();
      expect(new Set(views.map((view) => view.id)).size).toBe(views.length);
      for (const view of views) {
        expect(resolveScreenView(area!, page!, view.id)).toBe(view.id);
        expect(view.id).toMatch(/^[a-z][a-z0-9-]*$/);
        expect(["visible", "adapted", "unverified"]).toContain(view.evidence);
        for (const locale of ["ar", "en"] as const) {
          expect(view.title[locale].length).toBeGreaterThan(3);
          expect(view.dependency[locale].length).toBeGreaterThan(30);
        }
        for (const inputs of [view.filters, view.draft]) {
          expect(new Set(inputs.map((field) => field.key)).size).toBe(inputs.length);
          for (const field of inputs) expect(screenFields[field.key]).toBeDefined();
        }
        expect(new Set(view.columns).size).toBe(view.columns.length);
      }
    },
  );
  it("exposes bounded deep links and refuses ambiguous, unknown and cross-page view values", () => {
    expect(resolveScreenView("accounting", "reports", "general-ledger")).toBe("general-ledger");
    for (const candidate of [
      ["general-ledger"],
      ["general-ledger", "tax-reports"],
      "<script>",
      "users",
      undefined,
    ])
      expect(resolveScreenView("accounting", "reports", candidate)).toBeUndefined();
    expect(getScreenViews("not-a-module", "missing")).toEqual([]);
  });
  it("keeps accounting reports purpose-specific and does not add retail/campaign services", () => {
    const reports = getScreenViews("accounting", "reports");
    expect(reports.find((v) => v.id === "trial-balance")!.columns).toEqual([
      "account",
      "openingDebit",
      "openingCredit",
      "periodDebit",
      "periodCredit",
      "closingDebit",
      "closingCredit",
    ]);
    expect(reports.find((v) => v.id === "tax-reports")!.filters.map((f) => f.key)).not.toContain(
      "subaccounts",
    );
    expect(
      reports.find((v) => v.id === "cost-center-summary")!.filters.map((f) => f.key),
    ).toContain("costCenter");
    expect(getScreenViews("sales", "overview")[0]!.evidence).toBe("adapted");
    expect(placements.some(({ view }) => /campaign|broadcast|checkout/.test(view.id))).toBe(false);
  });
  it("distinguishes cash/bank incoming/outgoing vouchers and purchase document types", () => {
    const incoming = getScreenViews("treasury", "receipts");
    const outgoing = getScreenViews("treasury", "disbursements");
    expect(incoming.map((v) => v.id)).toEqual(["cash-receipts", "bank-receipts"]);
    expect(outgoing.map((v) => v.id)).toEqual(["cash-disbursements", "bank-disbursements"]);
    expect(incoming[0]!.columns).toContain("treasury");
    expect(incoming[1]!.columns).toContain("bankAccount");
    expect(outgoing[0]!.columns).toContain("supplier");
    expect(getScreenViews("purchasing", "invoices").map((v) => v.id)).toEqual([
      "purchase-invoices",
      "purchase-orders",
      "purchase-receipts",
    ]);
    expect(getScreenViews("purchasing", "returns")[0]!.columns).toEqual(
      expect.arrayContaining(["original", "reason"]),
    );
  });
});

describe("Every new layout renders bilingual and explicitly disconnected", () => {
  it.each(placements)(
    "$route / $view.id has its own columns, boundary and unavailable actions",
    ({ route, view }) => {
      const [area, page] = route.split("/");
      for (const locale of ["ar", "en"] as const) {
        const html = renderToStaticMarkup(
          createElement(ErpScreenPreview, {
            area: area!,
            page: page!,
            locale,
            initialView: view.id,
          }),
        );
        expect(html).toContain(`dir="${locale === "ar" ? "rtl" : "ltr"}"`);
        expect(html).toContain(`data-screen-evidence="${view.evidence}"`);
        expect(html).toContain(escape(view.title[locale]));
        expect(html).toContain(escape(view.dependency[locale]));
        if (view.id === "users" || view.id === "roles") {
          expect(html).toContain("data-identity-preview");
          expect(html).toContain(locale === "ar" ? "عينات اصطناعية" : "Synthetic fixtures");
          expect(html).not.toContain('type="password"');
          expect(html).not.toContain('type="file"');
          if (view.id === "users") expect(html).toContain("example.invalid");
          continue;
        }
        for (const key of view.columns)
          expect(html).toContain(`<th scope="col">${escape(screenFields[key][locale])}</th>`);
        expect((html.match(/<tbody><tr>/g) ?? []).length).toBe(1);
        expect(html).toContain(
          locale === "ar" ? "هذا ليس رصيداً صفرياً" : "This is not a zero balance",
        );
        expect(html).not.toMatch(/type="(?:password|file)"|href="(?:javascript:|#)"/);
        for (const action of view.actions.slice(0, 2))
          expect(html).toContain(
            `${escape(action[locale])} — ${locale === "ar" ? "غير متاح" : "unavailable"}</button>`,
          );
        expect((html.match(/<button[^>]*disabled/g) ?? []).length).toBe(
          Math.min(2, view.actions.length),
        );
        if (view.report)
          expect(html).toContain(
            locale === "ar" ? "لا تُحسب إجماليات" : "Totals are not calculated",
          );
        if (view.sensitive) expect(html).toContain("erp-screen-history");
      }
    },
  );
});

describe("Local field validation is not business acceptance", () => {
  const inputs = [
    { key: "name", type: "text", required: true },
    { key: "email", type: "email" },
    { key: "quantity", type: "number" },
    { key: "from", type: "date" },
    { key: "to", type: "date" },
  ] as const;
  it.each([
    [{ name: "" }, "name"],
    [{ name: "  " }, "name"],
    [{ name: "Synthetic", email: "invalid" }, "email"],
    [{ name: "Synthetic", quantity: "-1" }, "quantity"],
    [{ name: "Synthetic", quantity: "Infinity" }, "quantity"],
    [{ name: "Synthetic", quantity: "not-number" }, "quantity"],
    [{ name: "Synthetic", from: "2026-02-30" }, "from"],
    [{ name: "Synthetic", from: "2026-10-26", to: "2026-10-25" }, "to"],
  ] as const)("rejects invalid local input %#", (values, key) => {
    expect(validateScreenInputs([...inputs], values)[key]).toBeDefined();
  });
  it("checks synthetic fields only and never accepts a forged required lookup", () => {
    expect(
      validateScreenInputs([...inputs], {
        name: "Synthetic",
        email: "synthetic@example.invalid",
        quantity: "1.5",
        from: "2026-10-01",
        to: "2026-10-26",
      }),
    ).toEqual({});
    expect(
      validateScreenInputs([{ key: "customer", type: "lookup", required: true }], {
        customer: "forged-customer",
      }),
    ).toEqual({ customer: "lookup" });
  });
});
