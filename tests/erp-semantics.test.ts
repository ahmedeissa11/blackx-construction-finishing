// @vitest-environment jsdom
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/en/dashboard/erp" }));
import { erpModules, erpHref, findErpPage, type ErpPage } from "@/config/erp";
import { getScreenViews } from "@/config/erp-screen-specs";
import { erpKindLabel } from "@/content/erp-dictionary";
import { ErpPageContent } from "@/components/dashboard/ErpPageContent";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { ErpNavigation } from "@/components/dashboard/ErpNavigation";
import { getErpDataset, erpDatasetNames } from "@/lib/erp-data";
import { previewProjects, previewRequests } from "@/content/preview-data";
import { dashboardModules } from "@/config/navigation";
import { DOMAIN_STATUS } from "@/server/foundation/config";
import type { Locale } from "@/lib/i18n";

import retainedRouteIds from "./fixtures/erp-route-ids.json";

const entries = erpModules.flatMap((area) =>
  area.pages.map((page) => ({ area, page, route: `${area.id}/${page.id}` })),
);
const diagnostics = { role: "owner_review", adapter: "unconfigured" as const, ...DOMAIN_STATUS };
const escape = (s: string) =>
  s
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
function renderPage(areaId: string, pageId: string, locale: Locale = "en") {
  const match = findErpPage(areaId, pageId)!;
  return renderToStaticMarkup(
    createElement(ErpPageContent, { module: match.module, page: match.page, locale, diagnostics }),
  );
}

describe("Phase 2: every retained leaf advertises only its delivered scope", () => {
  it.each(entries)(
    "$route has truthful bilingual title, scope and presentation",
    ({ area, page }) => {
      for (const locale of ["ar", "en"] as const) {
        const html = renderPage(area.id, page.id, locale);
        // The newly authorized local layout panel is separate from both the
        // deferred business body and the canonical/shared fixture workspace.
        // Parse the actual structure: nested report/workbench sections must not
        // terminate a regex early or hide any business-body controls.
        const rendered = document.createElement("div");
        rendered.innerHTML = html;
        expect(rendered.querySelectorAll("h1")).toHaveLength(1);
        expect(rendered.querySelector("h1")?.textContent).toBe(page.title[locale]);
        rendered.querySelectorAll("fieldset.erp-form-section").forEach((section) => {
          expect(section.querySelector("legend")?.textContent?.trim()).toBeTruthy();
        });
        rendered.querySelectorAll(".erp-table-region").forEach((region) => {
          expect(region.getAttribute("role")).toBe("region");
          expect(region.getAttribute("aria-label")?.trim()).toBeTruthy();
          expect(region.getAttribute("tabindex")).toBe("0");
        });
        const panels = rendered.querySelectorAll("[data-screen-preview]");
        expect(panels.length).toBe(getScreenViews(area.id, page.id).length ? 1 : 0);
        panels.forEach((panel) => panel.remove());
        const baseline = rendered.innerHTML;
        if (getScreenViews(area.id, page.id).length) {
          expect(html).toContain(`data-screen-preview="${area.id}/${page.id}"`);
          expect(html).toContain(
            locale === "ar" ? "معاينة هيكل واجهة فقط" : "UI-only layout preview",
          );
        }
        expect(html).toContain(escape(page.title[locale]));
        expect(html).toContain(escape(page.summary[locale]));
        expect(html).toContain(escape(erpKindLabel(page.kind, locale)));
        expect(html).not.toContain("UI ready");
        expect(html).not.toContain("واجهة جاهزة — ربط الخدمة مطلوب");
        if (page.kind === "deferred") {
          expect(html).toContain(`data-erp-deferred="${area.id}/${page.id}"`);
          expect(baseline).not.toContain("<table");
          expect(baseline).not.toContain("<button");
          expect(baseline).not.toContain("<form");
          expect(page.source).toBeUndefined();
          expect(page.title.en).toMatch(/^Deferred — /);
        }
        if (page.kind === "shared") {
          const target = findErpPage(page.sharedWith!.area, page.sharedWith!.page)!;
          expect(target.page.kind).not.toBe("shared");
          expect(target.page.source).toBe(page.source);
          expect(html).toContain(`href="${erpHref(locale, target.module.id, target.page.id)}"`);
          expect(html).toContain("data-erp-shared");
          expect(baseline).not.toMatch(
            /<table|<form|class="panel erp-register|class="panel requests-board/,
          );
        }
        for (const ref of page.related ?? []) expect(findErpPage(ref.area, ref.page)).toBeDefined();
      }
    },
  );
  it("retains all 15 modules/143 route IDs and makes each rendered source canonical", () => {
    expect(erpModules).toHaveLength(15);
    expect(entries).toHaveLength(143);
    expect(entries.map((entry) => entry.route)).toEqual(retainedRouteIds);
    const count = (kind: ErpPage["kind"]) => entries.filter((x) => x.page.kind === kind).length;
    expect([
      count("deferred"),
      count("shared"),
      count("preview"),
      count("fixture"),
      count("readiness"),
      count("tool"),
      count("source-link"),
      count("instructions"),
    ]).toEqual([59, 34, 22, 15, 8, 3, 1, 1]);
    const direct = entries.filter((x) => ["preview", "fixture", "tool"].includes(x.page.kind));
    expect(new Set(direct.map((x) => x.page.source)).size).toBe(direct.length);
    const deferred = entries.filter((x) => x.page.kind === "deferred");
    expect(new Set(deferred.map((x) => x.page.summary.en)).size).toBe(59);
  });
  it("names incoming cash correctly without fabricating cash-out records", () => {
    const page = findErpPage("treasury", "cash-register")!.page;
    expect(page.title.en).toBe("Incoming cash-payment fixtures");
    expect(page.summary.en).toContain("Outgoing cash");
    const cash = getErpDataset("cash", "en")!.rows;
    const payments = getErpDataset("payments", "en")!.rows;
    expect(cash.length).toBeGreaterThan(0);
    for (const row of cash) expect(payments.some((x) => x.id === row.id)).toBe(true);
  });
  it("does not relabel expenses as actual disbursements or payments as bank history", () => {
    expect(findErpPage("treasury", "disbursements")!.page.title.en).toContain("not disbursements");
    expect(findErpPage("treasury", "history")!.page.title.en).toContain("no bank history");
    expect(findErpPage("accounting", "supplier-balances")!.page.summary.en).toContain(
      "not a supplier invoice/payment ledger",
    );
  });
  it("replaces false supplier history with an explicit directory entry", () => {
    expect(findErpPage("purchasing", "supplier-history")!.page.title.en).toContain(
      "history unavailable",
    );
    const html = renderPage("purchasing", "supplier-history");
    expect(html).toContain('href="/en/dashboard/erp/purchasing/suppliers"');
    expect(html).not.toContain("<table");
  });
  it("offers no report export and has only one navigation metadata download tool", () => {
    const html = renderPage("reporting", "exports");
    expect(html).toContain("no report export");
    expect(html).not.toContain("<button");
    expect(html).toContain('href="/en/dashboard/erp/data/export"');
    const tool = renderPage("data", "export");
    expect(tool).toContain("navigation metadata only");
    expect(tool).toContain("no business reports");
    expect(
      entries.filter((x) => x.page.source === "export" && x.page.kind === "tool"),
    ).toHaveLength(1);
  });
  it("gives instructions and no false import wizard or saved-results screen", () => {
    const html = renderPage("data", "formats");
    expect(html).toContain("data-erp-instructions");
    expect(html).not.toContain("<textarea");
    for (const id of ["import", "results"]) {
      const entry = renderPage("data", id);
      expect(entry).not.toContain("<textarea");
      expect(entry).toContain('href="/en/dashboard/erp/data/validation"');
    }
    expect(findErpPage("data", "results")!.page.summary.en).toContain(
      "No domain import, saved results",
    );
  });
  it("identifies link-only management overview rather than counting it as embedded", () => {
    expect(findErpPage("reporting", "overview")!.page.kind).toBe("source-link");
    const html = renderPage("reporting", "overview");
    expect(html).toContain("Link only");
    expect(html).toContain('href="/en/dashboard"');
    expect(html).not.toContain("<table");
  });
  it("does not imply customer scope, phase history, editable schedules or a combined contract register", () => {
    expect(findErpPage("crm", "projects")!.page.title.en).toContain("not customer scoped");
    expect(findErpPage("projects", "history")!.page.title.en).toContain("no phase history");
    expect(findErpPage("projects", "schedule")!.page.title.en).toContain(
      "schedule editor unavailable",
    );
    expect(findErpPage("crm", "commercial")!.page.title.en).toContain("not a contract register");
    expect(findErpPage("crm", "commercial")!.page.related).toContainEqual({
      area: "sales",
      page: "contracts",
    });
  });
  it("shows module-local counts and title rather than global 15/143", () => {
    const html = renderToStaticMarkup(
      createElement(ErpDirectory, { locale: "en", moduleId: "cheques" }),
    );
    expect(html).toContain("<strong>1</strong>");
    expect(html).toContain("<strong>8</strong>");
    expect(html).toContain("<h1>Cheque management</h1>");
    expect(html).not.toContain("<strong>143</strong>");
  });
});

describe("Phase 2: complete route and link graph (static, not authenticated browser acceptance)", () => {
  it.each(["ar", "en"] as const)(
    "all %s directories, hubs, leaves, sidebar and row links resolve without orphan routes",
    (locale) => {
      const htmls = [
        renderToStaticMarkup(createElement(ErpDirectory, { locale })),
        renderToStaticMarkup(createElement(ErpNavigation, { locale, role: "owner_review" })),
      ];
      for (const area of erpModules) {
        htmls.push(
          renderToStaticMarkup(createElement(ErpDirectory, { locale, moduleId: area.id })),
        );
        for (const page of area.pages) htmls.push(renderPage(area.id, page.id, locale));
      }
      const hrefs = new Set(
        htmls.flatMap((html) =>
          [...html.matchAll(/href="([^"]+)"/g)].map((x) => x[1]!.replaceAll("&amp;", "&")),
        ),
      );
      for (const source of erpDatasetNames)
        for (const row of getErpDataset(source, locale)!.rows) if (row.href) hrefs.add(row.href);
      for (const href of hrefs) {
        const url = new URL(href, "https://audit.invalid");
        const p = url.pathname.split("/").filter(Boolean);
        expect(p.slice(0, 2), href).toEqual([locale, "dashboard"]);
        if (p[2] === "erp") {
          if (p.length === 3) continue;
          const area = erpModules.find((x) => x.id === p[3]);
          expect(area, href).toBeDefined();
          if (p.length === 5) expect(findErpPage(p[3]!, p[4]!), href).toBeDefined();
          else expect(p.length).toBe(4);
        } else if (p.length === 2) continue;
        else if (p.length === 3)
          expect(
            dashboardModules.some((x) => x.segment === p[2]),
            href,
          ).toBe(true);
        else if (p[2] === "projects")
          expect(
            previewProjects.some((x) => x.id === p[3]),
            href,
          ).toBe(true);
        else if (p[2] === "customers")
          expect(
            previewRequests.some((x) => x.customerId === p[3]),
            href,
          ).toBe(true);
        else throw new Error(`Unresolved target: ${href}`);
      }
      expect(hrefs.has(erpHref(locale))).toBe(true);
      for (const area of erpModules) {
        expect(hrefs.has(erpHref(locale, area.id))).toBe(true);
        for (const page of area.pages)
          expect(hrefs.has(erpHref(locale, area.id, page.id))).toBe(true);
      }
    },
  );
});
