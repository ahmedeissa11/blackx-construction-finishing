// @vitest-environment jsdom
import { act, createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErpDirectory } from "@/components/dashboard/ErpDirectory";
import { erpModules, erpHref } from "@/config/erp";
import { erpNavigationGroups } from "@/config/erp-navigation";
import { getScreenViews } from "@/config/erp-screen-specs";
import {
  erpWorkspacePresentation,
  normalizeWorkspaceSearch,
  workspaceCount,
} from "@/config/erp-workspace";
import { erpText, erpKindLabel } from "@/content/erp-dictionary";
import { AdminThemeProvider, AdminThemeToggle } from "@/components/dashboard/AdminTheme";

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  localStorage.clear();
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {},
  }));
});
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  vi.unstubAllGlobals();
});
async function render(locale: "ar" | "en", moduleId?: string) {
  await act(async () =>
    root.render(
      createElement(ErpDirectory, { key: `${locale}/${moduleId ?? "all"}`, locale, moduleId }),
    ),
  );
}
async function search(value: string) {
  await act(async () => {
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}
async function filter(value: string) {
  await act(async () => {
    const select = container.querySelector("select")!;
    Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(select, value);
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

describe("Registered ERP workspace (DOM, not authenticated browser E2E)", () => {
  it.each([0, 1, 2, 15])("uses natural bilingual count labels for %i", (count) => {
    const nouns = [
      ["module", "module", "modules", "الوحدات"],
      ["page", "page", "pages", "الصفحات"],
      ["matching-page", "matching page", "matching pages", "الصفحات المطابقة"],
      ["area", "business area", "business areas", "مجالات العمل"],
    ] as const;
    for (const [noun, singular, plural, arabic] of nouns) {
      expect(workspaceCount(count, noun, "en")).toBe(`${count} ${count === 1 ? singular : plural}`);
      expect(workspaceCount(count, noun, "ar")).toBe(`${arabic}: ${count}`);
    }
  });
  it.each(["ar", "en"] as const)(
    "uses module-specific %s hub prompts and counts",
    async (locale) => {
      await render(locale, "projects");
      const counts = container.querySelector(".workspace-counts")!.textContent!;
      expect(counts).toContain(locale === "en" ? "1 module" : "الوحدات: 1");
      expect(counts).not.toMatch(/Named modules|وحدات مسماة/);
      expect(container.querySelector('[role="status"]')!.textContent).toBe(
        locale === "en" ? "Choose a page in this module" : "اختر صفحة من هذه الوحدة",
      );
      await render(locale);
      await search(erpModules.find((item) => item.id === "projects")!.title[locale]);
      expect(container.querySelector('[role="status"]')!.textContent).toContain(
        workspaceCount(1, "module", locale),
      );
    },
  );
  it.each(["ar", "en"] as const)(
    "restores accurate %s provenance and registry-derived deferred counts",
    async (locale) => {
      await render(locale);
      expect(container.querySelector(".workspace-hub-meta")).toBeNull();
      for (const areaModule of erpModules) {
        await render(locale, areaModule.id);
        expect(container.querySelector(".workspace-provenance")!.textContent).toBe(
          erpText(areaModule.provenance === "adapted" ? "adapted" : "category", locale),
        );
        const count = areaModule.pages.filter((page) => page.kind === "deferred").length;
        const badge = container.querySelector(".workspace-availability");
        if (count) {
          expect(badge!.textContent).toBe(
            `${workspaceCount(count, "page", locale)} · ${erpText("pending", locale)}`,
          );
        } else expect(badge).toBeNull();
        expect(container.querySelector(".workspace-hub-meta")!.textContent).not.toContain(
          erpText("previewNote", locale),
        );
      }
    },
  );
  it.each(["ar", "en"] as const)(
    "keeps every %s title and exact status visible while removing uniform status repetition",
    async (locale) => {
      let sharedSections = 0,
        mixedSections = 0;
      for (const areaModule of erpModules) {
        await render(locale, areaModule.id);
        for (const section of container.querySelectorAll(".workspace-page-group")) {
          const sectionTitle = section.querySelector("h3")!.textContent;
          const pages = areaModule.pages.filter((page) => page.section[locale] === sectionTitle);
          const common = pages.length > 1 && pages.every((page) => page.kind === pages[0]?.kind);
          expect(section.querySelectorAll(".workspace-page-link")).toHaveLength(pages.length);
          for (const page of pages) {
            const link = section.querySelector(
              `a[href="${erpHref(locale, areaModule.id, page.id)}"]`,
            )!;
            expect(link.querySelector("span")!.textContent).toBe(page.title[locale]);
            if (common) {
              expect(section.querySelector(".workspace-section-kind")!.textContent).toContain(
                erpKindLabel(page.kind, locale),
              );
              expect(link.querySelector("small")).toBeNull();
              expect(
                document.getElementById(link.getAttribute("aria-describedby")!)?.textContent,
              ).toContain(erpKindLabel(page.kind, locale));
            } else
              expect(link.querySelector("small")!.textContent).toBe(
                erpKindLabel(page.kind, locale),
              );
          }
          if (common) sharedSections++;
          else mixedSections++;
        }
      }
      expect(sharedSections).toBeGreaterThan(0);
      expect(mixedSections).toBeGreaterThan(0);
    },
  );
  it("assigns every registered module exactly once and supplies presentation without invented modules", () => {
    const ids = erpModules.map((areaModule) => areaModule.id).sort();
    expect(erpNavigationGroups.flatMap((group) => group.modules).sort()).toEqual(ids);
    expect(Object.keys(erpWorkspacePresentation).sort()).toEqual(ids);
    expect(new Set(erpNavigationGroups.flatMap((group) => group.modules)).size).toBe(ids.length);
    expect(normalizeWorkspaceSearch("  شِـيكات  ")).toBe("شيكات");
  });
  it.each(["ar", "en"] as const)(
    "starts %s with grouped cards, accurate counts, hub destinations and no nested card links",
    async (locale) => {
      await render(locale);
      expect(container.querySelector(".workspace-directory")?.getAttribute("dir")).toBe(
        locale === "ar" ? "rtl" : "ltr",
      );
      expect(container.querySelector("h2")?.textContent).toBe(
        locale === "ar" ? "مساحة عمل BLACK X ERP" : "BLACK X ERP Workspace",
      );
      expect(container.querySelectorAll(".workspace-category")).toHaveLength(
        erpNavigationGroups.length,
      );
      expect(container.querySelectorAll(".workspace-module")).toHaveLength(erpModules.length);
      expect(container.querySelectorAll(".workspace-module li, .workspace-matches")).toHaveLength(
        0,
      );
      for (const group of erpNavigationGroups) {
        const category = [...container.querySelectorAll(".workspace-category")].find(
          (section) => section.querySelector("h3")?.textContent === group.title[locale],
        )!;
        expect(category.querySelectorAll(".workspace-module")).toHaveLength(group.modules.length);
        for (const id of group.modules) {
          const areaModule = erpModules.find((item) => item.id === id)!;
          const link = category.querySelector(`a[href="${erpHref(locale, id)}"]`)!;
          const card = link.closest(".workspace-module")!;
          expect(card.querySelector("h4")?.textContent).toBe(areaModule.title[locale]);
          expect(card.querySelectorAll("svg[aria-hidden=true]")).toHaveLength(1);
          expect(card.querySelector(".workspace-module-action > span")?.textContent).toContain(
            String(areaModule.pages.length),
          );
          expect(
            [...card.querySelectorAll("a")].every(
              (a) => a.getAttribute("href") === erpHref(locale, id),
            ),
          ).toBe(true);
        }
      }
      expect(container.querySelector("#erp-system-guide")?.hasAttribute("open")).toBe(false);
      expect(container.querySelector(".erp-workflow")?.hasAttribute("open")).toBe(false);
      expect(container.querySelector("#erp-system-guide")?.textContent).toContain(
        locale === "ar" ? "ليست سجلات أعمال معتمدة" : "not authoritative business records",
      );
    },
  );
  it.each(["ar", "en"] as const)(
    "can find all registered %s page titles without changing their destination",
    async (locale) => {
      await render(locale);
      for (const areaModule of erpModules)
        for (const page of areaModule.pages) {
          await search(page.title[locale]);
          expect(
            container.querySelector(
              `.workspace-page-link[href="${erpHref(locale, areaModule.id, page.id)}"]`,
            ),
            `${areaModule.id}/${page.id}`,
          ).not.toBeNull();
        }
    },
  );
  it.each(["ar", "en"] as const)(
    "keeps every %s hub page and detailed-layout destination",
    async (locale) => {
      for (const areaModule of erpModules) {
        await render(locale, areaModule.id);
        expect(container.querySelectorAll(".workspace-hub")).toHaveLength(1);
        expect(container.querySelector(".workspace-back")?.getAttribute("href")).toBe(
          erpHref(locale),
        );
        for (const page of areaModule.pages) {
          expect(
            container.querySelector(`a[href="${erpHref(locale, areaModule.id, page.id)}"]`),
          ).not.toBeNull();
          for (const view of getScreenViews(areaModule.id, page.id))
            expect(
              container.querySelector(
                `a[href="${erpHref(locale, areaModule.id, page.id)}?view=${view.id}"]`,
              ),
            ).not.toBeNull();
        }
      }
    },
  );
  it.each(["ar", "en"] as const)(
    "searches both languages and opens matching detailed layouts in %s",
    async (locale) => {
      await render(locale);
      for (const q of ["Trial balance", "ميزان المراجعة"]) {
        await search(q);
        const link = container.querySelector('a[href$="/accounting/reports?view=trial-balance"]')!;
        expect(link).not.toBeNull();
        expect(link.closest("details")?.open).toBe(true);
        expect(link.getAttribute("href")?.startsWith(`/${locale}/`)).toBe(true);
      }
      await search("شِـيكات");
      expect(container.querySelector(`a[href="${erpHref(locale, "cheques")}"]`)).not.toBeNull();
    },
  );
  it("uses named search, polite result counts and a focused reset for empty states", async () => {
    await render("en");
    const input = container.querySelector<HTMLInputElement>('input[type="search"]')!;
    expect(container.querySelector(`label[for="${input.id}"]`)).not.toBeNull();
    expect(document.getElementById(input.getAttribute("aria-describedby")!)).not.toBeNull();
    await search("nothing-matches-987654");
    expect(container.querySelectorAll(".workspace-module")).toHaveLength(0);
    expect(container.querySelector('[role="status"]')?.textContent).toContain("0 modules");
    expect(container.querySelector(".workspace-empty")?.textContent).toContain("No matches");
    await act(async () =>
      container.querySelector<HTMLButtonElement>(".workspace-empty button")!.click(),
    );
    expect(container.querySelectorAll(".workspace-module")).toHaveLength(15);
    expect(document.activeElement).toBe(input);
    expect(input.value).toBe("");
  });
  it("clears a typed search with Escape without losing keyboard focus", async () => {
    await render("ar");
    await search("شيكات");
    const input = container.querySelector<HTMLInputElement>("input")!;
    input.focus();
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true }),
      ),
    );
    expect(input.value).toBe("");
    expect(document.activeElement).toBe(input);
    expect(container.querySelectorAll(".workspace-module")).toHaveLength(15);
  });
  it("preserves the exact availability filter semantics and resets filters", async () => {
    await render("en");
    for (const mode of ["source", "deferred"]) {
      await filter(mode);
      const expected = erpModules
        .flatMap((areaModule) =>
          areaModule.pages
            .filter((page) =>
              mode === "source"
                ? ["preview", "fixture", "tool"].includes(page.kind)
                : page.kind === "deferred",
            )
            .map((page) => erpHref("en", areaModule.id, page.id)),
        )
        .sort();
      expect(
        [...container.querySelectorAll(".workspace-page-link")]
          .map((a) => a.getAttribute("href"))
          .sort(),
      ).toEqual(expected);
    }
    await act(async () =>
      container.querySelector<HTMLButtonElement>(".workspace-results-bar button")!.click(),
    );
    expect(container.querySelector("select")!.value).toBe("all");
    expect(container.querySelectorAll(".workspace-matches")).toHaveLength(0);
  });
  it("retains the existing saved theme through workspace/hub/locale remounts", async () => {
    const mount = async (locale: "ar" | "en", moduleId?: string) =>
      act(async () =>
        root.render(
          createElement(
            AdminThemeProvider,
            null,
            createElement(AdminThemeToggle, { locale }),
            createElement(ErpDirectory, {
              key: `${locale}/${moduleId ?? "all"}`,
              locale,
              moduleId,
            }),
          ),
        ),
      );
    await mount("en");
    await act(async () =>
      container.querySelector<HTMLButtonElement>(".admin-theme-toggle")!.click(),
    );
    for (const locale of ["ar", "en"] as const) {
      await mount(locale, "projects");
      expect(container.querySelector(".admin-theme-root")?.getAttribute("data-admin-theme")).toBe(
        "dark",
      );
      expect(localStorage.getItem("blackx.admin.theme")).toBe("dark");
    }
  });
});
