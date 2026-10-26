/** Read-only mappings over existing fixtures. No authoritative totals or persistence. */
import type { Locale } from "@/lib/i18n";
import { pick } from "@/lib/i18n";
import { formatDate, formatMoney, formatNumber } from "@/lib/format";
import { getAppDictionary } from "@/content/app-dictionary";
import { previewProjects, previewRequests } from "@/content/preview-data";
import {
  previewInvoices,
  previewCertificates,
  previewPayments,
  previewReceipts,
  previewExpenses,
  previewSuppliers,
  previewPurchases,
  previewPhases,
  previewQuotationDetails,
  previewChangeOrderDetails,
  previewProjectStatusHistory,
} from "@/content/preview-expansion";
export type ErpRow = {
  id: string;
  cells: Record<string, string>;
  href?: string;
  filterDate?: string;
};
export type ErpDataset = { columns: string[]; rows: ErpRow[] };
export const erpDatasetNames = [
  "invoices",
  "certificates",
  "payments",
  "receipts",
  "expenses",
  "cash",
  "suppliers",
  "purchase-lines",
  "purchase-allocations",
  "boq",
  "changes",
  "projects",
  "phases",
  "project-history",
  "customers",
] as const;
export function getErpDataset(source: string, locale: Locale): ErpDataset | undefined {
  const money = (n: number) => formatMoney(n, locale);
  const date = (value: string) => formatDate(value, locale);
  const status = (value: string) => getAppDictionary(locale).status[value] ?? value;
  switch (source) {
    case "invoices":
      return {
        columns: ["ref", "customer", "project", "date", "amount", "status"],
        rows: previewInvoices.map((x) => ({
          id: x.id,
          filterDate: x.issuedAt.slice(0, 10),
          cells: {
            ref: x.id,
            customer: x.customerId,
            project: x.projectId,
            date: date(x.issuedAt),
            amount: money(x.amount),
            status: status(x.status),
          },
        })),
      };
    case "certificates":
      return {
        columns: ["ref", "project", "phase", "period", "amount", "status"],
        rows: previewCertificates.map((x) => ({
          id: x.id,
          cells: {
            ref: x.id,
            project: x.projectId,
            phase: x.phaseId ?? "—",
            period: `${date(x.periodFrom)} – ${date(x.periodTo)}`,
            amount: money(x.amount),
            status: status(x.status),
          },
        })),
      };
    case "cash":
    case "payments":
      return {
        columns: ["ref", "customer", "project", "type", "date", "amount"],
        rows: previewPayments
          .filter((x) => source !== "cash" || x.method === "cash")
          .map((x) => ({
            id: x.id,
            filterDate: x.paidAt.slice(0, 10),
            cells: {
              ref: x.id,
              customer: x.customerId,
              project: x.projectId,
              type:
                getAppDictionary(locale).dashboard.expansion.paymentMethods[x.method] ?? x.method,
              date: date(x.paidAt),
              amount: money(x.amount),
            },
          })),
      };
    case "receipts":
      return {
        columns: ["ref", "payment", "date", "status"],
        rows: previewReceipts.map((x) => ({
          id: x.id,
          filterDate: x.issuedAt.slice(0, 10),
          cells: {
            ref: x.id,
            payment: x.paymentId,
            date: date(x.issuedAt),
            status: status(x.status),
          },
        })),
      };
    case "expenses":
      return {
        columns: ["ref", "project", "phase", "type", "date", "amount"],
        rows: previewExpenses.map((x) => ({
          id: x.id,
          filterDate: x.date.slice(0, 10),
          cells: {
            ref: x.id,
            project: x.projectId,
            phase: x.phaseId ?? "—",
            type: pick(x.category, locale),
            date: date(x.date),
            amount: money(x.amount),
            note: pick(x.note, locale),
          },
        })),
      };
    case "suppliers":
      return {
        columns: ["ref", "name", "type", "city", "phone"],
        rows: previewSuppliers.map((x) => ({
          id: x.id,
          cells: {
            ref: x.id,
            name: pick(x.name, locale),
            type: pick(x.category, locale),
            city: pick(x.city, locale),
            phone: x.phone,
          },
        })),
      };
    case "purchase-lines":
      return {
        columns: ["ref", "supplier", "item", "quantity", "unit", "price"],
        rows: previewPurchases.flatMap((x) =>
          x.lines.map((line, index) => ({
            id: `${x.id}-${index}`,
            cells: {
              ref: x.id,
              supplier: x.supplierId,
              item: pick(line.label, locale),
              quantity: formatNumber(line.quantity, locale),
              unit: pick(line.unit, locale),
              price: money(line.unitPrice),
            },
          })),
        ),
      };
    case "purchase-allocations":
      return {
        columns: ["ref", "supplier", "project", "phase", "date"],
        rows: previewPurchases.map((x) => ({
          id: x.id,
          filterDate: x.date.slice(0, 10),
          cells: {
            ref: x.id,
            supplier: x.supplierId,
            project: x.projectId,
            phase: x.phaseId ?? "—",
            date: date(x.date),
          },
        })),
      };
    case "boq":
      return {
        columns: ["ref", "item", "quantity", "unit", "price"],
        rows: previewQuotationDetails.flatMap((x) =>
          x.boqLines.map((line, index) => ({
            id: `${x.ref}-${index}`,
            cells: {
              ref: x.ref,
              item: pick(line.label, locale),
              quantity: formatNumber(line.quantity, locale),
              unit: pick(line.unit, locale),
              price: money(line.unitPrice),
            },
          })),
        ),
      };
    case "changes":
      return {
        columns: ["ref", "contract", "note", "amount", "status"],
        rows: previewChangeOrderDetails.map((x) => ({
          id: x.ref,
          cells: {
            ref: x.ref,
            contract: x.contractRef,
            note: pick(x.description, locale),
            amount: money(x.amountDelta),
            status: status(x.decision.state),
          },
        })),
      };
    case "projects":
      return {
        columns: ["ref", "name", "customer", "status"],
        rows: previewProjects.map((x) => ({
          id: x.id,
          href: `/${locale}/dashboard/projects/${encodeURIComponent(x.id)}`,
          cells: {
            ref: x.id,
            name: pick(x.title, locale),
            customer: pick(x.customer, locale),
            status: status(x.status),
          },
        })),
      };
    case "phases":
      return {
        columns: ["ref", "name", "project", "type", "status"],
        rows: previewPhases.map((x) => ({
          id: x.id,
          href: `/${locale}/dashboard/projects/${encodeURIComponent(x.rootProjectId)}`,
          cells: {
            ref: x.id,
            name: pick(x.title, locale),
            project: x.rootProjectId,
            type: getAppDictionary(locale).dashboard.expansion.phaseTypes[x.type] ?? x.type,
            status: status(x.status),
          },
        })),
      };
    case "project-history":
      return {
        columns: ["project", "date", "status", "note"],
        rows: previewProjectStatusHistory.map((x, i) => ({
          id: `${x.projectId}-${i}`,
          href: `/${locale}/dashboard/projects/${encodeURIComponent(x.projectId)}`,
          filterDate: x.at.slice(0, 10),
          cells: {
            project: x.projectId,
            date: date(x.at),
            status: status(x.status),
            note: pick(x.note, locale),
          },
        })),
      };
    case "customers":
      return {
        columns: ["ref", "name", "city"],
        rows: [...new Map(previewRequests.map((x) => [x.customerId, x])).values()].map((x) => ({
          id: x.customerId,
          href: `/${locale}/dashboard/customers/${encodeURIComponent(x.customerId)}`,
          cells: {
            ref: x.customerId,
            name: pick(x.customerName, locale),
            city: pick(x.city, locale),
          },
        })),
      };
    default:
      return undefined;
  }
}

export type ImportIssue = {
  row: number;
  field: "file" | "reference" | "name" | "email" | "fields";
};
export type ImportValidation = { valid: boolean; count: number; issues: ImportIssue[] };
/** A proposed validation-only format. No fetching, storage, mutation, or raw-value errors. */
export function validateErpImport(text: string): ImportValidation {
  const fail = (issues: ImportIssue[], count = 0) => ({ valid: false, count, issues });
  if (new TextEncoder().encode(text).length > 256 * 1024) return fail([{ row: 0, field: "file" }]);
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return fail([{ row: 0, field: "file" }]);
  }
  if (!Array.isArray(value) || value.length === 0 || value.length > 500)
    return fail([{ row: 0, field: "file" }]);
  const issues: ImportIssue[] = [];
  const seen = new Set<string>();
  value.forEach((entry: unknown, index) => {
    const row = index + 1;
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      issues.push({ row, field: "fields" });
      return;
    }
    const item = entry as Record<string, unknown>;
    if (Object.keys(item).some((key) => !["reference", "name", "email"].includes(key)))
      issues.push({ row, field: "fields" });
    if (
      typeof item.reference !== "string" ||
      !/^[A-Za-z0-9_-]{1,80}$/.test(item.reference) ||
      seen.has(item.reference.toLowerCase())
    )
      issues.push({ row, field: "reference" });
    else seen.add(item.reference.toLowerCase());
    if (
      typeof item.name !== "string" ||
      item.name.trim().length < 2 ||
      item.name.length > 160 ||
      /[\u0000-\u001f]/.test(item.name)
    )
      issues.push({ row, field: "name" });
    if (
      item.email !== undefined &&
      (typeof item.email !== "string" ||
        item.email.length > 254 ||
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email))
    )
      issues.push({ row, field: "email" });
  });
  return { valid: issues.length === 0, count: value.length, issues };
}
