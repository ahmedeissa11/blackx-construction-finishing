import { beforeEach, describe, expect, it, vi } from "vitest";
const guard = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ requireReviewAccess: guard }));
vi.mock("@/components/dashboard/RequestsBoard", () => ({ RequestsBoard: () => null }));
import DashboardRequests from "@/app/[locale]/dashboard/requests/page";
import { previewRequests } from "@/content/preview-data";

describe("Existing request route contextual focus preserves its authorization boundary", () => {
  beforeEach(() => {
    guard.mockReset();
    guard.mockResolvedValue({ user: { role: "owner_review" } });
  });
  it.each(["ar", "en"])(
    "passes only a known preview request to the %s detail modal",
    async (locale) => {
      for (const request of previewRequests) {
        const element = await DashboardRequests({
          params: Promise.resolve({ locale }),
          searchParams: Promise.resolve({ focus: request.id }),
        });
        expect(element.props.initialFocusId).toBe(request.id);
        expect(element.props.focusUnavailable).toBe(false);
        expect(element.key).toBe(request.id);
      }
      expect(guard).toHaveBeenCalledWith(locale);
    },
  );
  it.each(["unknown-request", ["PV-RQ-1002", "PV-RQ-1003"], ""])(
    "does not open another record for invalid/ambiguous focus",
    async (focus) => {
      const element = await DashboardRequests({
        params: Promise.resolve({ locale: "en" }),
        searchParams: Promise.resolve({ focus }),
      });
      expect(element.props.initialFocusId).toBeUndefined();
      expect(element.props.focusUnavailable).toBe(true);
    },
  );
  it("keeps the original list behavior when no query is supplied", async () => {
    const element = await DashboardRequests({ params: Promise.resolve({ locale: "en" }) });
    expect(element.props.initialFocusId).toBeUndefined();
    expect(element.props.focusUnavailable).toBe(false);
  });
  it("does not read focus or records before the existing access guard succeeds", async () => {
    guard.mockRejectedValue(new Error("DENIED"));
    await expect(
      DashboardRequests({
        params: Promise.resolve({ locale: "ar" }),
        searchParams: Promise.resolve({ focus: "PV-RQ-1002" }),
      }),
    ).rejects.toThrow("DENIED");
  });
});
