import { beforeEach, describe, expect, it, vi } from "vitest";
const guard = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ requireReviewAccess: guard }));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
  usePathname: () => "/en/dashboard/erp",
}));
vi.mock("@/components/dashboard/ErpPageContent", () => ({ ErpPageContent: () => null }));
vi.mock("@/components/dashboard/ErpDirectory", () => ({ ErpDirectory: () => null }));
import ErpIndex from "@/app/[locale]/dashboard/erp/page";
import ErpModule from "@/app/[locale]/dashboard/erp/[area]/page";
import ErpLeaf from "@/app/[locale]/dashboard/erp/[area]/[page]/page";
import { erpModules } from "@/config/erp";

describe("Protected ERP route composition", () => {
  beforeEach(() => {
    guard.mockReset();
    guard.mockResolvedValue({ user: { role: "owner_review" } });
  });
  it("requires the existing server guard on directory, module and leaf", async () => {
    await ErpIndex({ params: Promise.resolve({ locale: "en" }) });
    await ErpModule({ params: Promise.resolve({ locale: "ar", area: "sales" }) });
    await ErpLeaf({ params: Promise.resolve({ locale: "en", area: "sales", page: "quotations" }) });
    expect(guard.mock.calls.map((x) => x[0])).toEqual(["en", "ar", "en"]);
  });
  it("denies access before resolving known or unknown module/page data", async () => {
    guard.mockRejectedValue(new Error("DENIED"));
    await expect(ErpIndex({ params: Promise.resolve({ locale: "en" }) })).rejects.toThrow("DENIED");
    await expect(
      ErpModule({ params: Promise.resolve({ locale: "en", area: "missing" }) }),
    ).rejects.toThrow("DENIED");
    await expect(
      ErpLeaf({ params: Promise.resolve({ locale: "ar", area: "sales", page: "quotations" }) }),
    ).rejects.toThrow("DENIED");
  });
  it("resolves every registered module and page for both locales", async () => {
    for (const locale of ["ar", "en"]) {
      for (const area of erpModules) {
        expect(
          await ErpModule({ params: Promise.resolve({ locale, area: area.id }) }),
        ).toBeTruthy();
        for (const page of area.pages) {
          expect(
            await ErpLeaf({ params: Promise.resolve({ locale, area: area.id, page: page.id }) }),
          ).toBeTruthy();
        }
      }
    }
    expect(guard).toHaveBeenCalledTimes(316);
  });
  it("validates layout query values after the guard, without enabling operations", async () => {
    const params = Promise.resolve({ locale: "en", area: "accounting", page: "reports" });
    const result = await ErpLeaf({
      params,
      searchParams: Promise.resolve({ view: "general-ledger" }),
    });
    expect(result.props.screenView).toBe("general-ledger");
    for (const view of ["unknown", ["trial-balance", "tax-reports"], "users"]) {
      expect(
        (await ErpLeaf({ params, searchParams: Promise.resolve({ view }) })).props.screenView,
      ).toBeUndefined();
    }
  });
  it("does not inspect query selection before access is authorized", async () => {
    const read = vi.fn(() => "trial-balance");
    guard.mockRejectedValue(new Error("DENIED"));
    const searchParams = Promise.resolve({
      get view() {
        return read();
      },
    });
    await expect(
      ErpLeaf({
        params: Promise.resolve({ locale: "en", area: "accounting", page: "reports" }),
        searchParams,
      }),
    ).rejects.toThrow("DENIED");
    expect(read).not.toHaveBeenCalled();
  });
  it("rejects unknown destinations and invalid locales", async () => {
    await expect(
      ErpModule({ params: Promise.resolve({ locale: "en", area: "missing" }) }),
    ).rejects.toThrow("NOT_FOUND");
    await expect(
      ErpLeaf({ params: Promise.resolve({ locale: "ar", area: "sales", page: "missing" }) }),
    ).rejects.toThrow("NOT_FOUND");
    await expect(ErpIndex({ params: Promise.resolve({ locale: "xx" }) })).rejects.toThrow(
      "NOT_FOUND",
    );
  });
  it("passes only bounded readiness fields, never environment or session material", async () => {
    guard.mockResolvedValue({
      user: { role: "owner_review", email: "private@example.com" },
      sessionToken: "not-for-client",
    });
    const element = await ErpLeaf({
      params: Promise.resolve({ locale: "en", area: "administration", page: "health" }),
    });
    expect(Object.keys(element.props.diagnostics).sort()).toEqual([
      "adapter",
      "implemented",
      "planned",
      "readOnly",
      "role",
    ]);
    expect(JSON.stringify(element.props)).not.toContain("private@example.com");
    expect(JSON.stringify(element.props)).not.toContain("not-for-client");
  });
});
