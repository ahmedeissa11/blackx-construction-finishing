import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ErpPageNavigator } from "@/components/dashboard/ErpPageNavigator";
import { describe, expect, it } from "vitest";
import { erpModules, findErpPage } from "@/config/erp";
import {
  cleanUiSelection,
  matchUiPermission,
  setUiGroupSelection,
  uiGroupState,
  uiPermissions,
} from "@/lib/erp-ui-permissions";
import { previewUiRoles, previewUiUsers } from "@/content/erp-identity-preview";

describe("Frontend-only permission catalogue: explicit route/action mapping", () => {
  it("defines exactly one module/page view per existing destination and seven curated actions", () => {
    expect(uiPermissions).toHaveLength(165);
    expect(new Set(uiPermissions.map((p) => p.id)).size).toBe(165);
    expect(uiPermissions.filter((p) => p.action === "view")).toHaveLength(158);
    expect(uiPermissions.filter((p) => p.availability === "unavailable")).toHaveLength(1);
  });
  it.each(erpModules)(
    "$id maps the module and every original page, not invented permissions",
    (module) => {
      const items = uiPermissions.filter((p) => p.group === module.id);
      expect(items.some((p) => p.id === `ui.${module.id}.view` && p.target.page === "")).toBe(true);
      for (const page of module.pages)
        expect(
          items.some(
            (p) => p.id === `ui.${module.id}.${page.id}.view` && p.target.page === page.id,
          ),
        ).toBe(true);
      for (const item of items) {
        expect(item.id).toMatch(/^ui\.[a-z0-9_.-]+$/);
        expect(item.target.area).toBe(module.id);
        if (item.target.page) expect(findErpPage(item.target.area, item.target.page)).toBeDefined();
        expect(item.label.ar).toBeTruthy();
        expect(item.label.en).toBeTruthy();
      }
    },
  );
  it("does not fabricate archive/delete/print/approval grants for unavailable operations", () => {
    expect(
      uiPermissions.some((p) => /\.(delete|archive|print|approve|reject)(\.|$)/.test(p.id)),
    ).toBe(false);
    const exportAction = uiPermissions.find((p) => p.action === "export")!;
    expect(exportAction.id).toBe("ui.data.export.download_metadata");
    expect(exportAction.target).toEqual({ area: "data", page: "export" });
    expect(uiPermissions.find((p) => p.action === "create")!.availability).toBe("unavailable");
  });
  it.each([
    "ui.data.validation.check_local",
    "فحص JSON",
    "Validate local JSON",
    "  VALIDATE LOCAL JSON  ",
  ])("searches labels/technical identifiers: %s", (query) => {
    expect(
      matchUiPermission(
        uiPermissions.find((p) => p.id === "ui.data.validation.check_local")!,
        query,
      ),
    ).toBe(true);
  });
  it("normalizes only known selectable UI keys, never unavailable or arbitrary grants", () => {
    expect(
      cleanUiSelection([
        "ui.data.view",
        "ui.data.view",
        "admin",
        "ui.purchasing.invoices.create_document",
        "secret",
        "ui.sales.view",
      ]),
    ).toEqual(["ui.data.view", "ui.sales.view"]);
  });
  it("selects and clears a scoped group without touching hidden groups", () => {
    const selected = ["ui.sales.view"];
    const next = setUiGroupSelection(selected, ["ui.data.view", "ui.data.export.view"], true);
    expect(selected).toEqual(["ui.sales.view"]);
    expect(next).toEqual(["ui.data.export.view", "ui.data.view", "ui.sales.view"]);
    expect(setUiGroupSelection(next, ["ui.data.view", "ui.data.export.view"], false)).toEqual(
      selected,
    );
  });
  it("has checked/unchecked/partial states and never selects descendants implicitly", () => {
    const ids = ["ui.data.view", "ui.data.export.view"];
    expect(uiGroupState([], ids)).toBe("none");
    expect(uiGroupState(["ui.data.view"], ids)).toBe("partial");
    expect(uiGroupState(ids, ids)).toBe("all");
    expect(setUiGroupSelection([], ["ui.data.view"], true)).toEqual(["ui.data.view"]);
    expect(uiGroupState([], ["ui.purchasing.invoices.create_document"])).toBe("none");
  });
});

describe("Synthetic identity fixtures have no backend identity/session semantics", () => {
  it("uses only reserved synthetic IDs/emails and known UI definitions", () => {
    expect(previewUiUsers).toHaveLength(8);
    expect(previewUiRoles).toHaveLength(6);
    for (const user of previewUiUsers) {
      expect(user.id).toMatch(/^preview-user-/);
      expect(user.email).toMatch(/@example\.invalid$/);
      expect(user.login).toMatch(/^preview\./);
      for (const id of user.roles) expect(previewUiRoles.some((role) => role.id === id)).toBe(true);
      expect(Object.keys(user).sort()).toEqual(["email", "id", "login", "name", "roles", "status"]);
    }
    for (const role of previewUiRoles) {
      expect(role.id).toMatch(/^preview-/);
      expect(cleanUiSelection(role.permissions)).toHaveLength(role.permissions.length);
    }
  });
});

describe("Frontend module-relative navigation", () => {
  it("links only valid previous/current-module/next destinations for every AR/EN leaf", () => {
    for (const locale of ["ar", "en"] as const)
      for (const area of erpModules)
        for (const [index, page] of area.pages.entries()) {
          const html = renderToStaticMarkup(
            createElement(ErpPageNavigator, { module: area, pageId: page.id, locale }),
          );
          const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
          const base = `/${locale}/dashboard/erp/${area.id}`;
          const expected = [
            area.pages[index - 1] ? `${base}/${area.pages[index - 1]!.id}` : undefined,
            base,
            area.pages[index + 1] ? `${base}/${area.pages[index + 1]!.id}` : undefined,
          ].filter(Boolean);
          expect(hrefs).toEqual(expected);
          expect(html.replace(/<[^>]+>/g, "")).toContain(
            `${area.id} · ${index + 1} / ${area.pages.length}`,
          );
        }
  });
});
