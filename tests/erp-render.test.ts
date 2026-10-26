import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
vi.mock("next/navigation", () => ({ usePathname: () => "/en/dashboard/erp" }));
import { erpModules } from "@/config/erp";
import { ErpPageContent } from "@/components/dashboard/ErpPageContent";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { DOMAIN_STATUS } from "@/server/foundation/config";

describe("ERP content rendering without auth bypass or production services", () => {
  for (const locale of ["ar", "en"] as const) {
    it(`renders every registered page with its own heading and boundary in ${locale}`, () => {
      for (const area of erpModules)
        for (const page of area.pages) {
          const html = renderToStaticMarkup(
            createElement(ErpPageContent, {
              module: area,
              page,
              locale,
              diagnostics: { role: "owner_review", adapter: "unconfigured", ...DOMAIN_STATUS },
            }),
          );
          expect(html, `${area.id}/${page.id}`).toContain(
            page.title[locale].replaceAll("&", "&amp;"),
          );
          expect(html).toContain("erp-workspace");
          if (!page.source) expect(html).toContain("erp-boundary");
          expect(html).not.toMatch(/href=["'](?:#|javascript:)/);
        }
    });
    it(`renders directory and all 15 hubs in ${locale}`, () => {
      expect(renderToStaticMarkup(createElement(ErpDirectory, { locale }))).toContain("143");
      for (const area of erpModules) {
        expect(
          renderToStaticMarkup(createElement(ErpDirectory, { locale, moduleId: area.id })),
        ).toContain(area.title[locale].replaceAll("&", "&amp;"));
      }
    });
  }
});
