import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { DomainBoard, type DomainBoardModuleKey } from "@/components/dashboard/DomainBoards";
import { ExpansionBoard, type ExpansionModuleKey } from "@/components/dashboard/ExpansionBoards";
import { getAppDictionary } from "@/content/app-dictionary";

const domainKeys: DomainBoardModuleKey[] = [
  "customers",
  "inspections",
  "quotations",
  "contracts",
  "projects",
  "milestones",
  "diary",
  "progress",
  "issues",
  "quality",
  "reports",
  "documents",
  "handover",
  "warranty",
  "notifications",
  "audit",
];
const expansionKeys: ExpansionModuleKey[] = ["finance", "purchases", "complaints", "messages"];
describe("Unavailable business actions advertise unavailability before activation", () => {
  for (const locale of ["ar", "en"] as const) {
    it.each(domainKeys)(
      `${locale}: DomainBoard %s actions are explicitly unavailable`,
      (moduleKey) => {
        const appDict = getAppDictionary(locale);
        const html = renderToStaticMarkup(
          createElement(DomainBoard, { locale, appDict, moduleKey }),
        );
        const actions = [
          ...html.matchAll(/<button[^>]*aria-haspopup="dialog"[^>]*>([\s\S]*?)<\/button>/g),
        ];
        expect(actions.length).toBeGreaterThan(0);
        for (const action of actions) expect(action[1]).toContain(appDict.previewUnavailableTitle);
      },
    );
    it.each(expansionKeys)(
      `${locale}: ExpansionBoard %s actions are explicitly unavailable`,
      (moduleKey) => {
        const appDict = getAppDictionary(locale);
        const html = renderToStaticMarkup(
          createElement(ExpansionBoard, { locale, appDict, moduleKey }),
        );
        const actions = [
          ...html.matchAll(/<button[^>]*aria-haspopup="dialog"[^>]*>([\s\S]*?)<\/button>/g),
        ];
        expect(actions.length).toBeGreaterThan(0);
        for (const action of actions) expect(action[1]).toContain(appDict.previewUnavailableTitle);
      },
    );
    it(`${locale}: payment entry and confirmation are named simulation, not durable verification`, () => {
      const finance = getAppDictionary(locale).dashboard.expansion.finance;
      const word = locale === "ar" ? "محاكاة" : "Simulate";
      expect(finance.recordPayment).toContain(word);
      expect(finance.recordForm.title).toContain(word);
      expect(finance.recordForm.confirmReceipt).toContain(word);
      expect(finance.recordForm.sessionOnlyNote).toContain(
        locale === "ar" ? "لا تنتقل لسجلات أخرى" : "other registers do not receive",
      );
    });
  }
});
