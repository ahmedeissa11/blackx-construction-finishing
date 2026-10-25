import { previewIssues, previewProjects, previewRequests } from "@/content/preview-data";
import {
  expansionSnapshotDate,
  previewAssignmentHistory,
  previewCertificates,
  previewDocumentCategoryOrder,
  previewDocumentRowCategories,
  previewHandoverDetails,
  previewWarrantyDetails,
  previewChangeOrderDetails,
  previewComplaints,
  previewContractDetails,
  previewInspectionDetails,
  previewNotificationDeliveries,
  previewProjectStatusHistory,
  previewQuotationDetails,
  previewWorkItems,
  previewContactMessages,
  previewDues,
  previewEngineers,
  previewExpenses,
  previewInvoices,
  previewPayments,
  previewPhases,
  previewPurchases,
  previewReceipts,
  previewSuppliers,
  type PreviewComplaint,
  type PreviewDue,
  type PreviewDocumentCategory,
  type PreviewPhase,
  type PreviewPurchase,
} from "@/content/preview-expansion";
import { previewModuleTables, previewPortalDocuments } from "@/content/preview-modules";
import type { LocalizedText } from "@/lib/i18n";

/**
 * Derivations for the frontend-expansion modules. Every figure here is
 * computed from the isolated presentation fixtures in
 * `preview-expansion.ts` anchored to the review snapshot date
 * (2026-10-21); nothing reads a database or claims to be current
 * company performance.
 */

const phaseTypeOrder: Record<PreviewPhase["type"], number> = {
  contracting: 0,
  finishing: 1,
  furnishing: 2,
};

export function getPreviewEngineer(engineerId: string | null | undefined) {
  if (!engineerId) return undefined;
  return previewEngineers.find((engineer) => engineer.id === engineerId);
}

export function getPreviewPhase(phaseId: string | null | undefined) {
  if (!phaseId) return undefined;
  return previewPhases.find((phase) => phase.id === phaseId);
}

export function getProjectPhases(projectId: string): PreviewPhase[] {
  return previewPhases
    .filter((phase) => phase.rootProjectId === projectId)
    .sort((a, b) => phaseTypeOrder[a.type] - phaseTypeOrder[b.type] || a.id.localeCompare(b.id));
}

export type PreviewEngineerAssignments = {
  engineer: (typeof previewEngineers)[number];
  requests: typeof previewRequests;
  phases: PreviewPhase[];
  issues: typeof previewIssues;
};

export function getEngineerAssignments(engineerId: string): PreviewEngineerAssignments | undefined {
  const engineer = getPreviewEngineer(engineerId);
  if (!engineer) return undefined;
  const matchesName = (name: { en: string } | null | undefined) => name?.en === engineer.name.en;
  return {
    engineer,
    requests: previewRequests.filter((request) => matchesName(request.assignee)),
    phases: previewPhases.filter((phase) => phase.engineerId === engineer.id),
    issues: previewIssues.filter((issue) => matchesName(issue.assignee)),
  };
}

export function getAllEngineerAssignments(): PreviewEngineerAssignments[] {
  return previewEngineers.map(
    (engineer) => getEngineerAssignments(engineer.id) as PreviewEngineerAssignments,
  );
}

/* ---------------- Finance derivations ---------------- */

export function allocatedForDue(dueId: string): number {
  return previewPayments.reduce(
    (total, payment) =>
      total +
      payment.allocations
        .filter((allocation) => allocation.dueId === dueId)
        .reduce((sum, allocation) => sum + allocation.amount, 0),
    0,
  );
}

export type PreviewDueStatus = "settled" | "overdue" | "due";

export type PreviewDueWithBalance = {
  due: PreviewDue;
  allocated: number;
  remaining: number;
  status: PreviewDueStatus;
};

export function getDueWithBalance(due: PreviewDue): PreviewDueWithBalance {
  const allocated = allocatedForDue(due.id);
  const remaining = Math.max(0, due.amount - allocated);
  const status: PreviewDueStatus =
    remaining === 0 ? "settled" : due.dueDate < expansionSnapshotDate ? "overdue" : "due";
  return { due, allocated, remaining, status };
}

export function getAllDuesWithBalance(): PreviewDueWithBalance[] {
  return previewDues
    .map(getDueWithBalance)
    .sort((a, b) => a.due.dueDate.localeCompare(b.due.dueDate));
}

/* ---------------- Session payment recording (D1) ---------------- */

/**
 * Pure helpers for the Finance board's session-only payment recording.
 * Nothing here persists: callers keep the recorded payments in component
 * state, and only payments the staff explicitly confirm are planned into
 * allocations and applied to balances. Pending (unverified) amounts must
 * never be passed to these helpers.
 */
export type SessionAllocation = { dueId: string; amount: number };

/** FIFO allocation plan against a customer's open dues for one project. */
export function planSessionAllocations(
  dues: PreviewDueWithBalance[],
  input: { customerId: string; projectId: string; amount: number },
): SessionAllocation[] {
  let remainingToAllocate = Math.max(0, input.amount);
  const plan: SessionAllocation[] = [];
  const candidates = dues
    .filter(
      (item) =>
        item.due.customerId === input.customerId &&
        item.due.projectId === input.projectId &&
        item.remaining > 0,
    )
    .sort((a, b) => a.due.dueDate.localeCompare(b.due.dueDate));
  for (const item of candidates) {
    if (remainingToAllocate <= 0) break;
    const amount = Math.min(item.remaining, remainingToAllocate);
    if (amount > 0) {
      plan.push({ dueId: item.due.id, amount });
      remainingToAllocate -= amount;
    }
  }
  return plan;
}

/** Total still owed by one customer for one project across open dues. */
export function sessionRemainingFor(
  dues: PreviewDueWithBalance[],
  customerId: string,
  projectId: string,
): number {
  return dues
    .filter((item) => item.due.customerId === customerId && item.due.projectId === projectId)
    .reduce((total, item) => total + item.remaining, 0);
}

/** Re-derive balances/statuses after applying confirmed session allocations. */
export function withSessionAllocations(
  dues: PreviewDueWithBalance[],
  allocations: SessionAllocation[],
): PreviewDueWithBalance[] {
  if (allocations.length === 0) return dues;
  const extraByDue = new Map<string, number>();
  for (const allocation of allocations) {
    extraByDue.set(allocation.dueId, (extraByDue.get(allocation.dueId) ?? 0) + allocation.amount);
  }
  return dues.map((item) => {
    const extra = extraByDue.get(item.due.id) ?? 0;
    if (extra <= 0) return item;
    const allocated = item.allocated + extra;
    const remaining = Math.max(0, item.due.amount - allocated);
    const status: PreviewDueStatus =
      remaining === 0 ? "settled" : item.due.dueDate < expansionSnapshotDate ? "overdue" : "due";
    return { due: item.due, allocated, remaining, status };
  });
}

export type PreviewCustomerFinance = {
  dues: PreviewDueWithBalance[];
  payments: typeof previewPayments;
  invoices: typeof previewInvoices;
  receipts: Array<{
    receipt: (typeof previewReceipts)[number];
    payment?: (typeof previewPayments)[number];
  }>;
  duesTotal: number;
  collected: number;
  remaining: number;
};

export function getCustomerFinance(customerId: string): PreviewCustomerFinance {
  const dues = previewDues
    .filter((due) => due.customerId === customerId)
    .map(getDueWithBalance)
    .sort((a, b) => a.due.dueDate.localeCompare(b.due.dueDate));
  const payments = previewPayments
    .filter((payment) => payment.customerId === customerId)
    .sort((a, b) => b.paidAt.localeCompare(a.paidAt));
  const paymentIds = new Set(payments.map((payment) => payment.id));
  const receipts = previewReceipts
    .filter((receipt) => paymentIds.has(receipt.paymentId))
    .map((receipt) => ({
      receipt,
      payment: payments.find((payment) => payment.id === receipt.paymentId),
    }))
    .sort((a, b) => b.receipt.issuedAt.localeCompare(a.receipt.issuedAt));
  return {
    dues,
    payments,
    invoices: previewInvoices
      .filter((invoice) => invoice.customerId === customerId)
      .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    receipts,
    duesTotal: dues.reduce((total, item) => total + item.due.amount, 0),
    collected: dues.reduce((total, item) => total + item.allocated, 0),
    remaining: dues.reduce((total, item) => total + item.remaining, 0),
  };
}

export type PreviewProjectFinance = {
  projectId: string;
  duesTotal: number;
  collected: number;
  remaining: number;
  expensesTotal: number;
  purchasesTotal: number;
  byPhase: Array<{
    phase: PreviewPhase;
    duesTotal: number;
    collected: number;
    expensesTotal: number;
    purchasesTotal: number;
  }>;
};

export function purchaseTotals(purchase: PreviewPurchase) {
  const gross = purchase.lines.reduce((total, line) => total + line.quantity * line.unitPrice, 0);
  const net = gross - purchase.discount;
  return { gross, net, payable: net - purchase.paidAmount };
}

export function getProjectFinance(projectId: string): PreviewProjectFinance {
  const dues = previewDues.filter((due) => due.projectId === projectId).map(getDueWithBalance);
  const expenses = previewExpenses.filter((expense) => expense.projectId === projectId);
  const purchases = previewPurchases.filter((purchase) => purchase.projectId === projectId);
  const byPhase = getProjectPhases(projectId).map((phase) => {
    const phaseDues = dues.filter((item) => item.due.phaseId === phase.id);
    return {
      phase,
      duesTotal: phaseDues.reduce((total, item) => total + item.due.amount, 0),
      collected: phaseDues.reduce((total, item) => total + item.allocated, 0),
      expensesTotal: expenses
        .filter((expense) => expense.phaseId === phase.id)
        .reduce((total, expense) => total + expense.amount, 0),
      purchasesTotal: purchases
        .filter((purchase) => purchase.phaseId === phase.id)
        .reduce((total, purchase) => total + purchaseTotals(purchase).net, 0),
    };
  });
  return {
    projectId,
    duesTotal: dues.reduce((total, item) => total + item.due.amount, 0),
    collected: dues.reduce((total, item) => total + item.allocated, 0),
    remaining: dues.reduce((total, item) => total + item.remaining, 0),
    expensesTotal: expenses.reduce((total, expense) => total + expense.amount, 0),
    purchasesTotal: purchases.reduce((total, purchase) => total + purchaseTotals(purchase).net, 0),
    byPhase,
  };
}

export type PreviewAgingBucketKey = "current" | "d1_30" | "d31_60" | "d61_90" | "d90plus";

export function getAgingBuckets(dues: PreviewDueWithBalance[] = getAllDuesWithBalance()): Array<{
  key: PreviewAgingBucketKey;
  amount: number;
  count: number;
}> {
  const buckets: Record<PreviewAgingBucketKey, { amount: number; count: number }> = {
    current: { amount: 0, count: 0 },
    d1_30: { amount: 0, count: 0 },
    d31_60: { amount: 0, count: 0 },
    d61_90: { amount: 0, count: 0 },
    d90plus: { amount: 0, count: 0 },
  };
  const snapshot = new Date(`${expansionSnapshotDate}T00:00:00Z`).getTime();
  for (const item of dues) {
    if (item.remaining <= 0) continue;
    const days = Math.floor(
      (snapshot - new Date(`${item.due.dueDate}T00:00:00Z`).getTime()) / 86400000,
    );
    const key: PreviewAgingBucketKey =
      days <= 0
        ? "current"
        : days <= 30
          ? "d1_30"
          : days <= 60
            ? "d31_60"
            : days <= 90
              ? "d61_90"
              : "d90plus";
    buckets[key].amount += item.remaining;
    buckets[key].count += 1;
  }
  return (Object.keys(buckets) as PreviewAgingBucketKey[]).map((key) => ({
    key,
    ...buckets[key],
  }));
}

/* ---------------- Suppliers ---------------- */

export function getSupplierBalance(supplierId: string) {
  const supplier = previewSuppliers.find((item) => item.id === supplierId);
  const purchases = previewPurchases
    .filter((purchase) => purchase.supplierId === supplierId)
    .sort((a, b) => b.date.localeCompare(a.date));
  const purchasesTotal = purchases.reduce(
    (total, purchase) => total + purchaseTotals(purchase).net,
    0,
  );
  const paid = purchases.reduce((total, purchase) => total + purchase.paidAmount, 0);
  return { supplier, purchases, purchasesTotal, paid, payable: purchasesTotal - paid };
}

export function getAllSupplierBalances() {
  return previewSuppliers.map((supplier) => getSupplierBalance(supplier.id));
}

/* ---------------- Complaints ---------------- */

export function getComplaintsForCustomer(customerId: string): PreviewComplaint[] {
  return previewComplaints
    .filter((complaint) => complaint.customerId === customerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function customerVisibleReplies(complaint: PreviewComplaint) {
  return complaint.replies.filter((reply) => reply.visibility === "customer");
}

export function internalReplies(complaint: PreviewComplaint) {
  return complaint.replies.filter((reply) => reply.visibility === "internal");
}

/* ---------------- Portal (own customer only) ---------------- */

export type PreviewPortalFinance = PreviewCustomerFinance & {
  certificates: typeof previewCertificates;
};

/**
 * Portal-visible finance for ONE customer: their issued invoices, work
 * certificates for their own projects, and receipts for their payments.
 * Internal expenses, supplier purchases, and other customers' records
 * are never included.
 */
export function getPortalFinance(customerId: string): PreviewPortalFinance {
  const finance = getCustomerFinance(customerId);
  const ownProjectIds = new Set(
    previewProjects
      .filter((project) => project.customerId === customerId)
      .map((project) => project.id),
  );
  return {
    ...finance,
    certificates: previewCertificates
      .filter((certificate) => ownProjectIds.has(certificate.projectId))
      .sort((a, b) => b.periodTo.localeCompare(a.periodTo)),
  };
}

/** Portal-visible view of a complaint: internal replies are stripped. */
export type PreviewPortalComplaint = Omit<PreviewComplaint, "replies"> & {
  replies: PreviewComplaint["replies"];
};

export function getPortalComplaints(customerId: string): PreviewPortalComplaint[] {
  return getComplaintsForCustomer(customerId).map((complaint) => ({
    ...complaint,
    replies: customerVisibleReplies(complaint),
  }));
}

/* ---------------- Overview summary ---------------- */

export function getExpansionOverview() {
  const dues = getAllDuesWithBalance();
  return {
    outstandingTotal: dues.reduce((total, item) => total + item.remaining, 0),
    overdueTotal: dues
      .filter((item) => item.status === "overdue")
      .reduce((total, item) => total + item.remaining, 0),
    overdueCount: dues.filter((item) => item.status === "overdue").length,
    collectedTotal: dues.reduce((total, item) => total + item.allocated, 0),
    expensesTotal: previewExpenses.reduce((total, expense) => total + expense.amount, 0),
    purchasesPayable: getAllSupplierBalances().reduce(
      (total, balance) => total + balance.payable,
      0,
    ),
    openComplaints: previewComplaints.filter((complaint) => complaint.status !== "resolved").length,
    newMessages: previewContactMessages.filter((message) => message.status === "new").length,
    activePhases: previewPhases.filter((phase) => phase.status === "in_progress").length,
    engineers: previewEngineers.length,
  };
}

/* ---------------- Workflow details (inspections, quotations, contracts) ---------------- */

export function getInspectionDetail(ref: string | undefined) {
  if (!ref) return undefined;
  return previewInspectionDetails.find((detail) => detail.ref === ref);
}

export type PreviewQuotationTotals = { gross: number; discount: number; net: number };

export function getQuotationDetail(ref: string | undefined) {
  if (!ref) return undefined;
  const detail = previewQuotationDetails.find((item) => item.ref === ref);
  if (!detail) return undefined;
  const gross = detail.boqLines.reduce((t, line) => t + line.quantity * line.unitPrice, 0);
  const totals: PreviewQuotationTotals = {
    gross,
    discount: detail.discount,
    net: gross - detail.discount,
  };
  return { detail, totals };
}

export function getContractDetail(ref: string | undefined) {
  if (!ref) return undefined;
  return previewContractDetails.find((detail) => detail.ref === ref);
}

export function getChangeOrderDetail(ref: string | undefined) {
  if (!ref) return undefined;
  return previewChangeOrderDetails.find((detail) => detail.ref === ref);
}

export function getChangeOrdersForContract(contractRef: string) {
  return previewChangeOrderDetails.filter((detail) => detail.contractRef === contractRef);
}

export function getNotificationDelivery(rowId: string) {
  return previewNotificationDeliveries.find((detail) => detail.rowId === rowId);
}

/* ---------------- Work items and histories ---------------- */

export type PreviewPhaseWorkItems = {
  phase: PreviewPhase;
  items: typeof previewWorkItems;
};

export function getProjectWorkItems(projectId: string): PreviewPhaseWorkItems[] {
  return getProjectPhases(projectId)
    .map((phase) => ({
      phase,
      items: previewWorkItems.filter((item) => item.phaseId === phase.id),
    }))
    .filter((group) => group.items.length > 0);
}

export function workItemProgress(item: (typeof previewWorkItems)[number]): number {
  if (item.plannedQty <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((item.completedQty / item.plannedQty) * 100)));
}

export function getAssignmentHistoryForProject(projectId: string) {
  return previewAssignmentHistory
    .filter((record) => record.projectId === projectId)
    .sort((a, b) => b.from.localeCompare(a.from));
}

export function getAssignmentHistoryForEngineer(engineerId: string) {
  return previewAssignmentHistory
    .filter((record) => record.engineerId === engineerId)
    .sort((a, b) => b.from.localeCompare(a.from));
}

export function getProjectStatusHistory(projectId: string) {
  return previewProjectStatusHistory
    .filter((record) => record.projectId === projectId)
    .sort((a, b) => a.at.localeCompare(b.at));
}

/* ---------------- Handover & warranty ---------------- */

export function getHandoverDetail(ref: string | undefined) {
  if (!ref) return undefined;
  return previewHandoverDetails.find((detail) => detail.ref === ref);
}

export function getHandoverForProject(projectId: string) {
  return previewHandoverDetails.find((detail) => detail.projectId === projectId);
}

export function getWarrantyDetail(ref: string | undefined) {
  if (!ref) return undefined;
  return previewWarrantyDetails.find((detail) => detail.ref === ref);
}

export function getWarrantyForProject(projectId: string) {
  return previewWarrantyDetails.filter((detail) => detail.projectId === projectId);
}

/** Customer-safe warranty view: internal team notes are never included. */
export type PortalWarrantyItem = {
  ref: string;
  projectId: string;
  source: string;
  openedAt: string;
  nextVisit?: string;
  summary: LocalizedText;
  visits: Array<{
    date: string;
    findings: LocalizedText;
    actionTaken: LocalizedText;
    evidence: Array<{ label: LocalizedText; kind: string }>;
  }>;
};

export function getPortalWarranty(customerId: string): PortalWarrantyItem[] {
  return previewWarrantyDetails
    .filter((detail) => detail.customerId === customerId)
    .map((detail) => ({
      ref: detail.ref,
      projectId: detail.projectId,
      source: detail.source,
      openedAt: detail.openedAt,
      nextVisit: detail.nextVisit,
      summary: detail.customerSummary,
      visits: detail.visits.map((visit) => ({
        date: visit.date,
        findings: visit.findings,
        actionTaken: visit.actionTaken,
        evidence: visit.evidence,
      })),
    }));
}

export function getPortalHandover(customerId: string) {
  return previewHandoverDetails.filter((detail) => detail.customerId === customerId);
}

/* ---------------- Document catalog (grouped workspace) ---------------- */

export type PreviewDocumentCatalogItem = {
  id: string;
  title: LocalizedText;
  category: PreviewDocumentCategory;
  reference: string;
  projectId?: string;
  customerId?: string;
  updatedAt?: string;
  format?: string;
  amount?: number;
  status?: string;
};

function cellText(row: { cells: Record<string, unknown> }, key: string): LocalizedText | undefined {
  const cell = row.cells[key] as { kind?: string; value?: unknown } | undefined;
  if (!cell) return undefined;
  if (cell.kind === "text" && typeof cell.value === "object" && cell.value !== null) {
    return cell.value as LocalizedText;
  }
  if (typeof cell.value === "string") return { ar: cell.value, en: cell.value };
  return undefined;
}

function cellPlain(row: { cells: Record<string, unknown> }, key: string): string | undefined {
  const cell = row.cells[key] as { value?: unknown } | undefined;
  return typeof cell?.value === "string" ? cell.value : undefined;
}

function moduleRowByRef(moduleKey: "contracts", ref: string) {
  return previewModuleTables[moduleKey]?.rows.find((row) => cellPlain(row, "ref") === ref);
}

export function getDocumentCatalog(): PreviewDocumentCatalogItem[] {
  const items: PreviewDocumentCatalogItem[] = [];

  // Documents module rows (dc1..dc4) + portal-only dc5 (PR-201 paint approval).
  for (const row of previewModuleTables["documents"]?.rows ?? []) {
    const category = previewDocumentRowCategories[row.id];
    const title = cellText(row, "title");
    if (!category || !title) continue;
    const size = cellPlain(row, "size");
    items.push({
      id: row.id,
      title,
      category,
      reference: row.id.toUpperCase(),
      projectId: row.links?.projectId,
      customerId: row.links?.customerId,
      updatedAt: cellPlain(row, "updated"),
      format: size?.split(" · ")[0],
    });
  }
  for (const doc of previewPortalDocuments) {
    if (items.some((item) => item.id === doc.id)) continue;
    items.push({
      id: doc.id,
      title: doc.title,
      category: previewDocumentRowCategories[doc.id] ?? "approvals_drawings",
      reference: doc.id.toUpperCase(),
      projectId: "PV-PR-201",
      customerId: "PV-CU-06",
      updatedAt: doc.date,
      format: doc.type,
    });
  }

  // Contract document packages + change orders.
  for (const detail of previewContractDetails) {
    const row = moduleRowByRef("contracts", detail.ref);
    for (const [index, doc] of detail.documents.entries()) {
      items.push({
        id: `${detail.ref}-DOC-${index + 1}`,
        title: doc.label,
        category: "contracts",
        reference: detail.ref,
        projectId: row?.links?.projectId,
        customerId: row?.links?.customerId,
        updatedAt: row ? cellPlain(row, "date") : undefined,
        format: "PDF",
      });
    }
  }
  for (const order of previewChangeOrderDetails) {
    const row = moduleRowByRef("contracts", order.ref);
    items.push({
      id: order.ref,
      title: order.description,
      category: "change_orders",
      reference: order.ref,
      projectId: row?.links?.projectId,
      customerId: row?.links?.customerId,
      updatedAt: row ? cellPlain(row, "date") : undefined,
      amount: order.amountDelta,
      status: order.decision.state,
    });
  }

  // Finance documents stay distinct types: invoices / certificates / receipts.
  for (const invoice of previewInvoices) {
    items.push({
      id: invoice.id,
      title: invoice.label,
      category: "invoices",
      reference: invoice.id,
      projectId: invoice.projectId,
      customerId: invoice.customerId,
      updatedAt: invoice.issuedAt,
      amount: invoice.amount,
      status: invoice.status,
    });
  }
  for (const certificate of previewCertificates) {
    items.push({
      id: certificate.id,
      title: certificate.label,
      category: "certificates",
      reference: certificate.id,
      projectId: certificate.projectId,
      customerId: previewProjects.find((project) => project.id === certificate.projectId)
        ?.customerId,
      updatedAt: certificate.periodTo,
      amount: certificate.amount,
      status: certificate.status,
    });
  }
  for (const receipt of previewReceipts) {
    const payment = previewPayments.find((item) => item.id === receipt.paymentId);
    items.push({
      id: receipt.id,
      title: { ar: "إيصال سداد مسجل", en: "Recorded payment receipt" },
      category: "receipts",
      reference: receipt.id,
      projectId: payment?.projectId,
      customerId: payment?.customerId,
      updatedAt: receipt.issuedAt,
      amount: payment?.amount,
      status: receipt.status,
    });
  }

  // Handover packages and warranty visit evidence.
  for (const detail of previewHandoverDetails) {
    for (const [index, doc] of detail.documents.entries()) {
      items.push({
        id: `${detail.ref}-DOC-${index + 1}`,
        title: doc.label,
        category: "handover",
        reference: detail.ref,
        projectId: detail.projectId,
        customerId: detail.customerId,
        updatedAt: detail.actualDate ?? detail.plannedDate,
        format: "PDF",
      });
    }
  }
  for (const detail of previewWarrantyDetails) {
    for (const visit of detail.visits) {
      for (const [index, evidence] of visit.evidence.entries()) {
        items.push({
          id: `${detail.ref}-${visit.date}-${index + 1}`,
          title: evidence.label,
          category: "warranty",
          reference: detail.ref,
          projectId: detail.projectId,
          customerId: detail.customerId,
          updatedAt: visit.date,
          format: evidence.kind === "image" ? "JPG" : "PDF",
        });
      }
    }
  }

  return items.sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
}

export type PreviewDocumentGroup = {
  category: PreviewDocumentCategory;
  items: PreviewDocumentCatalogItem[];
};

export function groupDocumentCatalog(items: PreviewDocumentCatalogItem[]): PreviewDocumentGroup[] {
  return previewDocumentCategoryOrder
    .map((category) => ({
      category,
      items: items.filter((item) => item.category === category),
    }))
    .filter((group) => group.items.length > 0);
}

export function getProjectDocuments(projectId: string): PreviewDocumentCatalogItem[] {
  return getDocumentCatalog().filter((item) => item.projectId === projectId);
}

export function getCustomerDocuments(customerId: string): PreviewDocumentCatalogItem[] {
  return getDocumentCatalog().filter((item) => item.customerId === customerId);
}

/**
 * Portal document catalog: the customer's own project documents only.
 * Finance documents are already presented in the portal finance area, and
 * warranty-internal evidence never leaves the staff side.
 */
const portalDocumentCategories: PreviewDocumentCategory[] = [
  "boq",
  "contracts",
  "reports_evidence",
  "approvals_drawings",
  "handover",
];

export function getPortalDocuments(customerId: string): PreviewDocumentCatalogItem[] {
  return getCustomerDocuments(customerId).filter((item) =>
    portalDocumentCategories.includes(item.category),
  );
}
