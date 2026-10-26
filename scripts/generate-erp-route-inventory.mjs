/** Node >=22.18. Generates public route metadata only; never reads environment or credentials. */
import { registerHooks } from "node:module";
import { readFile, writeFile } from "node:fs/promises";

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      return nextResolve(new URL(`../src/${specifier.slice(2)}.ts`, import.meta.url).href, context);
    }
    return nextResolve(specifier, context);
  },
});
const { erpNavigationGroups, getErpRouteInventory } =
  await import("../src/config/erp-navigation.ts");
const { erpModules, erpPageCount } = await import("../src/config/erp.ts");
const data = {
  schemaVersion: 1,
  source: "src/config/erp.ts + src/config/erp-navigation.ts",
  scope: "Existing guarded Admin; route availability is not backend operational readiness.",
  counts: {
    navigationGroups: erpNavigationGroups.length,
    modules: erpModules.length,
    leaves: erpPageCount,
    perLocale: 1 + erpModules.length + erpPageCount,
    localizedRoutes: 2 * (1 + erpModules.length + erpPageCount),
  },
  groups: erpNavigationGroups,
  routes: ["ar", "en"].flatMap(getErpRouteInventory),
};
const content = JSON.stringify(data, null, 2) + "\n";
const file = new URL("../docs/ERP_ADMIN_ROUTE_INVENTORY.json", import.meta.url);
if (process.argv.includes("--check")) {
  if ((await readFile(file, "utf8")) !== content) {
    throw new Error("ERP inventory is stale. Run node scripts/generate-erp-route-inventory.mjs.");
  }
  console.info(`Inventory matches registry: ${data.counts.localizedRoutes} localized routes.`);
} else {
  await writeFile(file, content);
  console.info(
    `Generated inventory: ${data.counts.modules} modules / ${data.counts.leaves} leaves.`,
  );
}
