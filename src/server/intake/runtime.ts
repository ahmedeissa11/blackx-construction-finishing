/**
 * Intake runtime assembly + adapter governance (contract §5.4–§5.5).
 *
 * The adapter is selected by the DATA_ADAPTER environment variable
 * (name from §5.4). Only one adapter exists today — the in-memory fake —
 * and it is REFUSED when NODE_ENV=production. In production, or with
 * DATA_ADAPTER unset/unknown, no service is assembled and the routes
 * fail closed with 503: they can never fake a durable save. Registering
 * the database colleague's real adapter here is a future authorized
 * task gated on TBD-DB-01…10 and the CT-PORT suite passing against it.
 */

import { dictionaries } from "@/content/dictionary";
import { services } from "@/content/services";
import { createAdminIntakeReads, type AdminIntakeReads } from "./admin-reads";
import { createFakeIntakeAdapter } from "./fake-adapter";
import { createIntakeService, type IntakeService } from "./service";
import type { IntakeAllowlists } from "./validation";

/**
 * Allowlists derive from the published catalogue/content so the API can
 * never accept a service, unit type, or subject the site does not offer.
 * Unit types/subjects are published as localized display values (§2.2),
 * so both locales' values are accepted exactly as published.
 */
export function buildIntakeAllowlists(): IntakeAllowlists {
  return {
    serviceSlugs: new Set(services.map((service) => service.slug)),
    unitTypes: new Set([
      ...dictionaries.ar.request.unitTypes,
      ...dictionaries.en.request.unitTypes,
    ]),
    subjects: new Set([...dictionaries.ar.contact.subjects, ...dictionaries.en.contact.subjects]),
  };
}

interface IntakeRuntime {
  service: IntakeService;
  adminReads: AdminIntakeReads;
}

/**
 * The dev/test fake must be ONE store per process: Next.js may load this
 * module in several route module graphs (observed in `next dev`), and a
 * plain module-level cache gives each route its own in-memory state —
 * public submissions would be invisible to the admin reads. Anchoring on
 * globalThis is the standard dev-singleton pattern. With the real
 * adapter, state lives in the colleague's database and this disappears.
 */
const globalCache = globalThis as typeof globalThis & {
  __blackxIntakeRuntime?: IntakeRuntime;
};

function getFakeRuntime(): IntakeRuntime | null {
  if (process.env.DATA_ADAPTER !== "fake") return null;
  if (process.env.NODE_ENV === "production") return null;
  if (!globalCache.__blackxIntakeRuntime) {
    const { ports } = createFakeIntakeAdapter();
    const allowlists = buildIntakeAllowlists();
    globalCache.__blackxIntakeRuntime = {
      service: createIntakeService(ports, allowlists),
      adminReads: createAdminIntakeReads(ports, allowlists),
    };
  }
  return globalCache.__blackxIntakeRuntime;
}

export function getIntakeService(): IntakeService | null {
  return getFakeRuntime()?.service ?? null;
}

export function getAdminIntakeReads(): AdminIntakeReads | null {
  return getFakeRuntime()?.adminReads ?? null;
}

/** Test support: drop the cached fake so env changes take effect. */
export function resetIntakeServiceCacheForTests(): void {
  delete globalCache.__blackxIntakeRuntime;
}
