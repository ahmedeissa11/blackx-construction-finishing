import type { DashboardModuleKey } from "@/config/navigation";
import {
  previewIssues,
  previewMilestones,
  previewProjects,
  previewRequests,
  previewSnapshotDate,
  type PreviewIssue,
  type PreviewProject,
  type PreviewRequest,
} from "@/content/preview-data";
import {
  previewModuleTables,
  type PreviewCell,
  type PreviewModuleRow,
  type PreviewRecordLinks,
} from "@/content/preview-modules";
import type { LocalizedText } from "@/lib/i18n";

const completedStatuses = new Set(["completed", "resolved", "handed_over", "sent", "signed"]);
const findingUnresolvedStatuses = new Set(["open", "in_progress"]);

export function getPreviewModuleRows(module: DashboardModuleKey): PreviewModuleRow[] {
  return previewModuleTables[module]?.rows ?? [];
}

export function getPreviewRowStatus(row: PreviewModuleRow): string | undefined {
  const status = row.cells.status;
  return status?.kind === "status" ? status.value : undefined;
}

export function getPreviewRowPriority(row: PreviewModuleRow): string | undefined {
  const priority = row.cells.severity ?? row.cells.priority;
  return priority?.kind === "priority" ? priority.value : undefined;
}

export function getPreviewRowProgress(row: PreviewModuleRow): number | undefined {
  const progress = row.cells.progress;
  return progress?.kind === "progress" ? progress.value : undefined;
}

export function getPreviewRowMoney(row: PreviewModuleRow): number | undefined {
  const amount = row.cells.amount;
  return amount?.kind === "money" ? amount.value : undefined;
}

export function getPreviewRowText(
  row: PreviewModuleRow,
  key: string,
): LocalizedText | string | undefined {
  return getPreviewCellText(row.cells[key]);
}

export function countPreviewRowsByStatus(
  module: DashboardModuleKey,
  statuses: readonly string[],
): number {
  const allowed = new Set(statuses);
  return getPreviewModuleRows(module).filter((row) => {
    const status = getPreviewRowStatus(row);
    return status ? allowed.has(status) : false;
  }).length;
}

export function getPreviewRowDate(row: PreviewModuleRow): string | undefined {
  for (const key of ["date", "due", "updated"] as const) {
    const cell = row.cells[key];
    if (cell?.kind === "date") return cell.value;
  }
  return undefined;
}

export function getPreviewRowReference(row: PreviewModuleRow): string | undefined {
  for (const key of ["ref", "entity", "project"] as const) {
    const cell = row.cells[key];
    if (cell?.kind === "plain") return cell.value;
  }
  return undefined;
}

export function getPreviewCellText(
  cell: PreviewCell | undefined,
): LocalizedText | string | undefined {
  if (!cell) return undefined;
  if (cell.kind === "text") return cell.value;
  if (cell.kind === "plain" || cell.kind === "date") return cell.value;
  return undefined;
}

export function findPreviewModuleRowByReference(
  module: DashboardModuleKey,
  reference: string,
): PreviewModuleRow | undefined {
  return getPreviewModuleRows(module).find((row) => getPreviewRowReference(row) === reference);
}

export function isPreviewFindingUnresolved(row: PreviewModuleRow): boolean {
  const status = getPreviewRowStatus(row);
  return status ? findingUnresolvedStatuses.has(status) : false;
}

export function isPreviewMilestoneOverdue(
  row: PreviewModuleRow,
  snapshotDate = previewSnapshotDate,
): boolean {
  const due = getPreviewRowDate(row);
  const status = getPreviewRowStatus(row);
  return Boolean(due && due < snapshotDate && status && !completedStatuses.has(status));
}

export type PreviewLinkedRecord = {
  kind: "customer" | "request" | "project" | "quotation" | "contract";
  id: string;
  module: DashboardModuleKey;
  title?: LocalizedText | string;
  status?: string;
};

export function getLinkedPreviewRecords(
  links: PreviewRecordLinks | undefined,
): PreviewLinkedRecord[] {
  if (!links) return [];
  const records: PreviewLinkedRecord[] = [];

  if (links.customerId) {
    const customerRow = getPreviewModuleRows("customers").find(
      (row) => row.id === links.customerId,
    );
    const request = previewRequests.find((item) => item.customerId === links.customerId);
    records.push({
      kind: "customer",
      id: links.customerId,
      module: "customers",
      title: customerRow ? getPreviewCellText(customerRow.cells.name) : request?.customerName,
      status: customerRow ? getPreviewRowStatus(customerRow) : request?.status,
    });
  }

  if (links.requestId) {
    const request = previewRequests.find((item) => item.id === links.requestId);
    records.push({
      kind: "request",
      id: links.requestId,
      module: "requests",
      title: request?.serviceLabel,
      status: request?.status,
    });
  }

  if (links.projectId) {
    const project = previewProjects.find((item) => item.id === links.projectId);
    records.push({
      kind: "project",
      id: links.projectId,
      module: "projects",
      title: project?.title,
      status: project?.status,
    });
  }

  if (links.quotationId) {
    const quotation = findPreviewModuleRowByReference("quotations", links.quotationId);
    records.push({
      kind: "quotation",
      id: links.quotationId,
      module: "quotations",
      title: quotation ? getPreviewCellText(quotation.cells.title) : undefined,
      status: quotation ? getPreviewRowStatus(quotation) : undefined,
    });
  }

  if (links.contractId) {
    const contract = findPreviewModuleRowByReference("contracts", links.contractId);
    records.push({
      kind: "contract",
      id: links.contractId,
      module: "contracts",
      title: contract ? getPreviewCellText(contract.cells.type) : undefined,
      status: contract ? getPreviewRowStatus(contract) : undefined,
    });
  }

  return records;
}

export type PreviewRequestContext = {
  inspections: PreviewModuleRow[];
  quotations: PreviewModuleRow[];
  customerProjects: PreviewProject[];
  customerContracts: PreviewModuleRow[];
};

export function getPreviewRequestContext(request: PreviewRequest): PreviewRequestContext {
  return {
    inspections: getPreviewModuleRows("inspections").filter(
      (row) => row.links?.requestId === request.id,
    ),
    quotations: getPreviewModuleRows("quotations").filter(
      (row) => row.links?.requestId === request.id,
    ),
    customerProjects: previewProjects.filter(
      (project) => project.customerId === request.customerId,
    ),
    customerContracts: getPreviewModuleRows("contracts").filter(
      (row) => row.links?.customerId === request.customerId,
    ),
  };
}

export type PreviewRequestWorkflowStageKey =
  "received" | "contact" | "inspection" | "quotation" | "decision";

export type PreviewRequestWorkflowStageState =
  "complete" | "current" | "upcoming" | "blocked" | "terminal";

export type PreviewRequestNextActionKey =
  | "firstContact"
  | "scheduleInspection"
  | "reviewInspection"
  | "prepareQuotation"
  | "awaitClientDecision"
  | "reviewApprovedContext"
  | "resumeRequest"
  | "noNextAction";

export type PreviewRequestWorkflowBlockerKey =
  "assigneeMissing" | "directInspectionMissing" | "directQuotationMissing" | "onHold" | "cancelled";

export type PreviewRequestWorkflow = {
  stages: Array<{
    key: PreviewRequestWorkflowStageKey;
    state: PreviewRequestWorkflowStageState;
    evidenceRefs: string[];
    statusOnly: boolean;
  }>;
  nextAction: PreviewRequestNextActionKey;
  nextActionModule: DashboardModuleKey;
  blockers: PreviewRequestWorkflowBlockerKey[];
};

const previewRequestStageKeys: PreviewRequestWorkflowStageKey[] = [
  "received",
  "contact",
  "inspection",
  "quotation",
  "decision",
];

function latestNonHoldRequestStatus(request: PreviewRequest): string {
  return (
    [...request.history]
      .reverse()
      .find((entry) => entry.status !== "on_hold" && entry.status !== "cancelled")?.status ?? "new"
  );
}

export function getAllowedPreviewRequestStatusTransitions(request: PreviewRequest): string[] {
  const current = request.status;
  if (current === "approved" || current === "cancelled") return [current];

  if (current === "on_hold") {
    const previous = latestNonHoldRequestStatus(request);
    const resumeStatus =
      previous === "new" ? "contacted" : previous === "on_hold" ? "contacted" : previous;
    return [...new Set([current, resumeStatus, "cancelled"])];
  }

  const transitions: Record<string, string[]> = {
    new: ["contacted", "on_hold", "cancelled"],
    contacted: ["inspection_scheduled", "on_hold", "cancelled"],
    inspection_scheduled: ["inspection_done", "on_hold", "cancelled"],
    inspection_done: ["quotation_sent", "on_hold", "cancelled"],
    quotation_sent: ["approved", "on_hold", "cancelled"],
  };

  return [...new Set([current, ...(transitions[current] ?? [])])];
}

export function getPreviewRequestWorkflow(request: PreviewRequest): PreviewRequestWorkflow {
  const context = getPreviewRequestContext(request);
  const inspectionRefs = context.inspections
    .map((row) => getPreviewRowReference(row))
    .filter((reference): reference is string => Boolean(reference));
  const quotationRefs = context.quotations
    .map((row) => getPreviewRowReference(row))
    .filter((reference): reference is string => Boolean(reference));
  const effectiveStatus =
    request.status === "on_hold" ? latestNonHoldRequestStatus(request) : request.status;
  const hasScheduledInspection = context.inspections.some(
    (row) => getPreviewRowStatus(row) === "inspection_scheduled",
  );
  const hasSentQuotation = context.quotations.some((row) => getPreviewRowStatus(row) === "sent");

  let currentIndex = 0;
  if (effectiveStatus === "contacted") currentIndex = 1;
  if (effectiveStatus === "inspection_scheduled" || hasScheduledInspection) currentIndex = 2;
  if (effectiveStatus === "inspection_done") currentIndex = 3;
  if (effectiveStatus === "quotation_sent" || hasSentQuotation) currentIndex = 4;
  if (effectiveStatus === "approved") currentIndex = 4;

  const inspectionStatusOnly =
    (effectiveStatus === "inspection_scheduled" ||
      effectiveStatus === "inspection_done" ||
      effectiveStatus === "quotation_sent" ||
      effectiveStatus === "approved") &&
    inspectionRefs.length === 0;
  const quotationStatusOnly =
    (effectiveStatus === "quotation_sent" || effectiveStatus === "approved") &&
    quotationRefs.length === 0;

  const stages = previewRequestStageKeys.map((key, index) => {
    let state: PreviewRequestWorkflowStageState;
    if (request.status === "cancelled") {
      state = index === 0 ? "complete" : "terminal";
    } else if (request.status === "approved") {
      state = "complete";
    } else if (index < currentIndex) {
      state = "complete";
    } else if (index === currentIndex) {
      state = request.status === "on_hold" ? "blocked" : "current";
    } else {
      state = "upcoming";
    }

    return {
      key,
      state,
      evidenceRefs:
        key === "received"
          ? [request.id]
          : key === "inspection"
            ? inspectionRefs
            : key === "quotation" || key === "decision"
              ? quotationRefs
              : [],
      statusOnly:
        key === "inspection"
          ? inspectionStatusOnly
          : key === "quotation" || key === "decision"
            ? quotationStatusOnly
            : false,
    };
  });

  const blockers: PreviewRequestWorkflowBlockerKey[] = [];
  if (!request.assignee && ["new", "contacted", "inspection_scheduled"].includes(request.status)) {
    blockers.push("assigneeMissing");
  }
  if (inspectionStatusOnly) blockers.push("directInspectionMissing");
  if (quotationStatusOnly) blockers.push("directQuotationMissing");
  if (request.status === "on_hold") blockers.push("onHold");
  if (request.status === "cancelled") blockers.push("cancelled");

  let nextAction: PreviewRequestNextActionKey = "firstContact";
  let nextActionModule: DashboardModuleKey = "requests";
  if (request.status === "cancelled") {
    nextAction = "noNextAction";
  } else if (request.status === "on_hold") {
    nextAction = "resumeRequest";
  } else if (request.status === "approved") {
    nextAction = "reviewApprovedContext";
    nextActionModule = "contracts";
  } else if (effectiveStatus === "quotation_sent" || hasSentQuotation) {
    nextAction = "awaitClientDecision";
    nextActionModule = "quotations";
  } else if (effectiveStatus === "inspection_done") {
    nextAction = "prepareQuotation";
    nextActionModule = "quotations";
  } else if (effectiveStatus === "inspection_scheduled" || hasScheduledInspection) {
    nextAction = "reviewInspection";
    nextActionModule = "inspections";
  } else if (effectiveStatus === "contacted") {
    nextAction = "scheduleInspection";
    nextActionModule = "inspections";
  }

  return { stages, nextAction, nextActionModule, blockers };
}

export type PreviewProjectOperations = {
  project: PreviewProject;
  customerRequests: PreviewRequest[];
  milestones: typeof previewMilestones;
  milestoneRows: PreviewModuleRow[];
  diaryRows: PreviewModuleRow[];
  progressRows: PreviewModuleRow[];
  issueRows: PreviewModuleRow[];
  canonicalIssues: typeof previewIssues;
  qualityRows: PreviewModuleRow[];
  documentRows: PreviewModuleRow[];
  reportRows: PreviewModuleRow[];
  handoverRows: PreviewModuleRow[];
  warrantyRows: PreviewModuleRow[];
  quotationRows: PreviewModuleRow[];
  contractRows: PreviewModuleRow[];
  unresolvedFindings: number;
  pendingReports: number;
  blockerRows: PreviewModuleRow[];
  nextMilestone?: {
    title: LocalizedText | string;
    date?: string;
    progress?: number;
    status?: string;
    source: "canonical" | "module";
  };
  latestProgressRow?: PreviewModuleRow;
  handoverState: "handed_over" | "pending" | "not_scheduled";
};

function rowsForProject(module: DashboardModuleKey, projectId: string): PreviewModuleRow[] {
  return getPreviewModuleRows(module).filter((row) => row.links?.projectId === projectId);
}

export function getPreviewProjectOperations(
  projectId: string,
): PreviewProjectOperations | undefined {
  const project = previewProjects.find((item) => item.id === projectId);
  if (!project) return undefined;

  const issueRows = rowsForProject("issues", projectId);
  const qualityRows = rowsForProject("quality", projectId);
  const reportRows = rowsForProject("reports", projectId);
  const milestoneRows = rowsForProject("milestones", projectId);
  const progressRows = rowsForProject("progress", projectId);
  const handoverRows = rowsForProject("handover", projectId);
  const canonicalMilestones = previewMilestones.filter(
    (milestone) => milestone.projectId === projectId,
  );
  const nextCanonicalMilestone = canonicalMilestones
    .filter((milestone) => milestone.state !== "done")
    .sort((a, b) => a.plannedDate.localeCompare(b.plannedDate))[0];
  const nextModuleMilestone = milestoneRows
    .filter((row) => {
      const status = getPreviewRowStatus(row);
      return status ? !completedStatuses.has(status) : false;
    })
    .sort((a, b) => (getPreviewRowDate(a) ?? "").localeCompare(getPreviewRowDate(b) ?? ""))[0];
  const blockerRows = [...issueRows, ...qualityRows].filter((row) => {
    const priority = getPreviewRowPriority(row);
    return isPreviewFindingUnresolved(row) && (priority === "high" || priority === "urgent");
  });
  const latestProgressRow = [...progressRows].sort((a, b) =>
    (getPreviewRowDate(b) ?? "").localeCompare(getPreviewRowDate(a) ?? ""),
  )[0];
  const handoverState = handoverRows.some((row) => getPreviewRowStatus(row) === "handed_over")
    ? "handed_over"
    : handoverRows.length > 0
      ? "pending"
      : "not_scheduled";

  return {
    project,
    customerRequests: previewRequests.filter(
      (request) => request.customerId === project.customerId,
    ),
    milestones: previewMilestones.filter((milestone) => milestone.projectId === projectId),
    milestoneRows: rowsForProject("milestones", projectId),
    diaryRows: rowsForProject("diary", projectId),
    progressRows: rowsForProject("progress", projectId),
    issueRows,
    canonicalIssues: previewIssues.filter((issue) => issue.projectId === projectId),
    qualityRows,
    documentRows: rowsForProject("documents", projectId),
    reportRows,
    handoverRows: rowsForProject("handover", projectId),
    warrantyRows: rowsForProject("warranty", projectId),
    quotationRows: getPreviewModuleRows("quotations").filter(
      (row) =>
        row.links?.projectId === projectId ||
        (project.quotationId ? getPreviewRowReference(row) === project.quotationId : false),
    ),
    contractRows: rowsForProject("contracts", projectId),
    unresolvedFindings: [...issueRows, ...qualityRows].filter(isPreviewFindingUnresolved).length,
    pendingReports: reportRows.filter((row) => getPreviewRowStatus(row) === "pending").length,
    blockerRows,
    nextMilestone: nextCanonicalMilestone
      ? {
          title: nextCanonicalMilestone.title,
          date: nextCanonicalMilestone.plannedDate,
          progress: nextCanonicalMilestone.progress,
          status: nextCanonicalMilestone.state,
          source: "canonical",
        }
      : nextModuleMilestone
        ? {
            title:
              getPreviewRowText(nextModuleMilestone, "milestone") ??
              getPreviewRowText(nextModuleMilestone, "title") ??
              nextModuleMilestone.id,
            date: getPreviewRowDate(nextModuleMilestone),
            progress: getPreviewRowProgress(nextModuleMilestone),
            status: getPreviewRowStatus(nextModuleMilestone),
            source: "module",
          }
        : undefined,
    latestProgressRow,
    handoverState,
  };
}

export type PreviewOperationalFlowStage = {
  key:
    | "requests"
    | "inspections"
    | "quotations"
    | "contracts"
    | "projectSetup"
    | "execution"
    | "qualityReporting"
    | "handover"
    | "warranty";
  module: DashboardModuleKey;
  count: number;
};

export function getPreviewOperationalFlow(): PreviewOperationalFlowStage[] {
  return [
    { key: "requests", module: "requests", count: previewRequests.length },
    {
      key: "inspections",
      module: "inspections",
      count: getPreviewModuleRows("inspections").length,
    },
    { key: "quotations", module: "quotations", count: getPreviewModuleRows("quotations").length },
    { key: "contracts", module: "contracts", count: getPreviewModuleRows("contracts").length },
    { key: "projectSetup", module: "projects", count: previewProjects.length },
    { key: "execution", module: "milestones", count: getPreviewModuleRows("milestones").length },
    { key: "qualityReporting", module: "reports", count: getPreviewModuleRows("reports").length },
    { key: "handover", module: "handover", count: getPreviewModuleRows("handover").length },
    { key: "warranty", module: "warranty", count: getPreviewModuleRows("warranty").length },
  ];
}

export type PreviewAdminOverview = {
  snapshotDate: string;
  metrics: {
    newRequests: number;
    upcomingInspections: number;
    quotationsAwaitingDecision: number;
    pendingContracts: number;
    activeProjects: number;
    overdueMilestones: number;
    unresolvedFindings: number;
    pendingReports: number;
  };
  recentRequests: PreviewRequest[];
  upcomingInspectionRows: PreviewModuleRow[];
  upcomingMilestoneRows: PreviewModuleRow[];
  overdueMilestoneRows: PreviewModuleRow[];
  activeProjects: PreviewProject[];
  recentActivityRows: PreviewModuleRow[];
  pendingReportRows: PreviewModuleRow[];
  pendingContractRows: PreviewModuleRow[];
  unresolvedFindingRows: PreviewModuleRow[];
  operationalFlow: PreviewOperationalFlowStage[];
  actionQueue: PreviewOverviewActionQueueItem[];
};

export function getPreviewAdminOverview(snapshotDate = previewSnapshotDate): PreviewAdminOverview {
  const upcomingInspectionRows = getPreviewModuleRows("inspections")
    .filter((row) => {
      const date = getPreviewRowDate(row);
      return getPreviewRowStatus(row) === "inspection_scheduled" && date && date >= snapshotDate;
    })
    .sort((a, b) => (getPreviewRowDate(a) ?? "").localeCompare(getPreviewRowDate(b) ?? ""));

  const milestoneRows = getPreviewModuleRows("milestones");
  const overdueMilestoneRows = milestoneRows.filter((row) =>
    isPreviewMilestoneOverdue(row, snapshotDate),
  );
  const upcomingMilestoneRows = milestoneRows
    .filter((row) => {
      const due = getPreviewRowDate(row);
      const status = getPreviewRowStatus(row);
      return due && due >= snapshotDate && status && !completedStatuses.has(status);
    })
    .sort((a, b) => (getPreviewRowDate(a) ?? "").localeCompare(getPreviewRowDate(b) ?? ""));

  const unresolvedFindingRows = [
    ...getPreviewModuleRows("issues"),
    ...getPreviewModuleRows("quality"),
  ].filter(isPreviewFindingUnresolved);
  const pendingReportRows = getPreviewModuleRows("reports").filter(
    (row) => getPreviewRowStatus(row) === "pending",
  );
  const pendingContractRows = getPreviewModuleRows("contracts").filter(
    (row) => getPreviewRowStatus(row) === "pending",
  );

  return {
    snapshotDate,
    metrics: {
      newRequests: previewRequests.filter((request) => request.status === "new").length,
      upcomingInspections: upcomingInspectionRows.length,
      quotationsAwaitingDecision: countPreviewRowsByStatus("quotations", ["sent"]),
      pendingContracts: pendingContractRows.length,
      activeProjects: previewProjects.filter((project) => project.status === "in_progress").length,
      overdueMilestones: overdueMilestoneRows.length,
      unresolvedFindings: unresolvedFindingRows.length,
      pendingReports: pendingReportRows.length,
    },
    recentRequests: [...previewRequests]
      .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))
      .slice(0, 5),
    upcomingInspectionRows,
    upcomingMilestoneRows,
    overdueMilestoneRows,
    activeProjects: previewProjects.filter((project) => project.status === "in_progress"),
    recentActivityRows: [...getPreviewModuleRows("audit")].sort((a, b) =>
      (getPreviewRowDate(b) ?? "").localeCompare(getPreviewRowDate(a) ?? ""),
    ),
    pendingReportRows,
    pendingContractRows,
    unresolvedFindingRows,
    operationalFlow: getPreviewOperationalFlow(),
    actionQueue: getPreviewOverviewActionQueue(snapshotDate),
  };
}

type PreviewResolvedLinks = ReturnType<typeof getLinkedPreviewRecords>;

function linksForRow(row: PreviewModuleRow): PreviewResolvedLinks {
  return getLinkedPreviewRecords(row.links);
}

export type PreviewInspectionItem = {
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
  isUpcoming: boolean;
};

export function getPreviewInspectionItems(
  snapshotDate = previewSnapshotDate,
): PreviewInspectionItem[] {
  return getPreviewModuleRows("inspections")
    .map((row) => ({
      row,
      reference: getPreviewRowReference(row),
      status: getPreviewRowStatus(row),
      date: getPreviewRowDate(row),
      links: linksForRow(row),
      isUpcoming:
        getPreviewRowStatus(row) === "inspection_scheduled" &&
        Boolean(getPreviewRowDate(row) && getPreviewRowDate(row)! >= snapshotDate),
    }))
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));
}

export type PreviewQuotationItem = {
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  amount?: number;
  links: PreviewResolvedLinks;
  kind: "quotation" | "boq";
};

export function getPreviewQuotationItems(): PreviewQuotationItem[] {
  return getPreviewModuleRows("quotations")
    .map((row) => ({
      row,
      reference: getPreviewRowReference(row),
      status: getPreviewRowStatus(row),
      amount: getPreviewRowMoney(row),
      links: linksForRow(row),
      kind: getPreviewRowReference(row) === "PV-QT-75" ? ("boq" as const) : ("quotation" as const),
    }))
    .sort((a, b) => (a.reference ?? "").localeCompare(b.reference ?? ""));
}

export type PreviewContractItem = {
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  amount?: number;
  links: PreviewResolvedLinks;
  kind: "contract" | "changeOrder";
};

export function getPreviewContractItems(): PreviewContractItem[] {
  return getPreviewModuleRows("contracts")
    .map((row) => {
      const reference = getPreviewRowReference(row);
      return {
        row,
        reference,
        status: getPreviewRowStatus(row),
        amount: getPreviewRowMoney(row),
        links: linksForRow(row),
        kind: reference?.startsWith("PV-CO") ? ("changeOrder" as const) : ("contract" as const),
      };
    })
    .sort((a, b) => (a.reference ?? "").localeCompare(b.reference ?? ""));
}

export type PreviewFindingItem = {
  moduleKey: "issues" | "quality";
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  severity?: string;
  links: PreviewResolvedLinks;
  canonicalIssue?: PreviewIssue;
  unresolved: boolean;
  blocker: boolean;
};

export function getPreviewFindingItems(moduleKey?: "issues" | "quality"): PreviewFindingItem[] {
  const moduleKeys: Array<"issues" | "quality"> = moduleKey ? [moduleKey] : ["issues", "quality"];

  return moduleKeys
    .flatMap((key) =>
      getPreviewModuleRows(key).map((row) => {
        const severity = getPreviewRowPriority(row);
        const unresolved = isPreviewFindingUnresolved(row);
        return {
          moduleKey: key,
          row,
          reference: getPreviewRowReference(row),
          status: getPreviewRowStatus(row),
          severity,
          links: linksForRow(row),
          canonicalIssue: previewIssues.find((issue) => issue.id === getPreviewRowReference(row)),
          unresolved,
          blocker: unresolved && (severity === "high" || severity === "urgent"),
        };
      }),
    )
    .sort((a, b) => Number(b.blocker) - Number(a.blocker));
}

export type PreviewReportItem = {
  row: PreviewModuleRow;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
  pending: boolean;
};

export function getPreviewReportItems(): PreviewReportItem[] {
  return getPreviewModuleRows("reports")
    .map((row) => ({
      row,
      status: getPreviewRowStatus(row),
      date: getPreviewRowDate(row),
      links: linksForRow(row),
      pending: getPreviewRowStatus(row) === "pending",
    }))
    .sort((a, b) => Number(b.pending) - Number(a.pending));
}

export type PreviewCustomerContext = {
  customerId: string;
  requests: PreviewRequest[];
  latestRequest?: PreviewRequest;
  latestWorkflow?: PreviewRequestWorkflow;
  projects: PreviewProject[];
  inspectionRows: PreviewModuleRow[];
  quotationRows: PreviewModuleRow[];
  contractRows: PreviewModuleRow[];
};

export function getPreviewCustomerContext(customerId: string): PreviewCustomerContext {
  const requests = previewRequests
    .filter((request) => request.customerId === customerId)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
  const latestRequest = requests[0];

  return {
    customerId,
    requests,
    latestRequest,
    latestWorkflow: latestRequest ? getPreviewRequestWorkflow(latestRequest) : undefined,
    projects: previewProjects.filter((project) => project.customerId === customerId),
    inspectionRows: getPreviewModuleRows("inspections").filter(
      (row) => row.links?.customerId === customerId,
    ),
    quotationRows: getPreviewModuleRows("quotations").filter(
      (row) => row.links?.customerId === customerId,
    ),
    contractRows: getPreviewModuleRows("contracts").filter(
      (row) => row.links?.customerId === customerId,
    ),
  };
}

export type PreviewCustomerItem = {
  row: PreviewModuleRow;
  customerId: string;
  status?: string;
  links: PreviewResolvedLinks;
  context: PreviewCustomerContext;
};

export function getPreviewCustomerItems(): PreviewCustomerItem[] {
  return getPreviewModuleRows("customers")
    .map((row) => ({
      row,
      customerId: row.id,
      status: getPreviewRowStatus(row),
      links: linksForRow(row),
      context: getPreviewCustomerContext(row.id),
    }))
    .sort((a, b) => a.customerId.localeCompare(b.customerId));
}

export type PreviewProjectPortfolioItem = {
  project: PreviewProject;
  row: PreviewModuleRow;
  operations: PreviewProjectOperations;
  links: PreviewResolvedLinks;
};

export function getPreviewProjectPortfolioItems(): PreviewProjectPortfolioItem[] {
  return previewProjects
    .flatMap((project) => {
      const row = getPreviewModuleRows("projects").find((item) => item.id === project.id);
      const operations = getPreviewProjectOperations(project.id);
      if (!row || !operations) return [];
      return [{ project, row, operations, links: linksForRow(row) }];
    })
    .sort((a, b) => {
      const blockerDifference = b.operations.blockerRows.length - a.operations.blockerRows.length;
      if (blockerDifference !== 0) return blockerDifference;
      const pendingReportDifference = b.operations.pendingReports - a.operations.pendingReports;
      if (pendingReportDifference !== 0) return pendingReportDifference;
      return b.project.updatedAt.localeCompare(a.project.updatedAt);
    });
}

function daysBetweenPreviewDates(fromDate: string, toDate: string): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  return Math.round(
    (Date.parse(`${toDate}T00:00:00Z`) - Date.parse(`${fromDate}T00:00:00Z`)) / millisecondsPerDay,
  );
}

export type PreviewMilestoneScheduleState = "overdue" | "dueSoon" | "scheduled" | "completed";

export type PreviewMilestoneItem = {
  row: PreviewModuleRow;
  projectId?: string;
  title: LocalizedText | string;
  due?: string;
  progress?: number;
  status?: string;
  links: PreviewResolvedLinks;
  scheduleState: PreviewMilestoneScheduleState;
  daysUntilDue?: number;
};

export function getPreviewMilestoneItems(
  snapshotDate = previewSnapshotDate,
): PreviewMilestoneItem[] {
  return getPreviewModuleRows("milestones")
    .map((row) => {
      const due = getPreviewRowDate(row);
      const status = getPreviewRowStatus(row);
      const daysUntilDue = due ? daysBetweenPreviewDates(snapshotDate, due) : undefined;
      const completed = status ? completedStatuses.has(status) : false;
      const scheduleState: PreviewMilestoneScheduleState = completed
        ? "completed"
        : daysUntilDue !== undefined && daysUntilDue < 0
          ? "overdue"
          : daysUntilDue !== undefined && daysUntilDue <= 7
            ? "dueSoon"
            : "scheduled";

      return {
        row,
        projectId: row.links?.projectId,
        title: getPreviewRowText(row, "milestone") ?? getPreviewRowText(row, "title") ?? row.id,
        due,
        progress: getPreviewRowProgress(row),
        status,
        links: linksForRow(row),
        scheduleState,
        daysUntilDue,
      };
    })
    .sort((a, b) => {
      const completedDifference =
        Number(a.scheduleState === "completed") - Number(b.scheduleState === "completed");
      if (completedDifference !== 0) return completedDifference;
      return (a.due ?? "").localeCompare(b.due ?? "");
    });
}

export type PreviewDiaryItem = {
  row: PreviewModuleRow;
  date?: string;
  status?: string;
  links: PreviewResolvedLinks;
};

export function getPreviewDiaryItems(): PreviewDiaryItem[] {
  return getPreviewModuleRows("diary")
    .map((row) => ({
      row,
      date: getPreviewRowDate(row),
      status: getPreviewRowStatus(row),
      links: linksForRow(row),
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.row.id.localeCompare(b.row.id));
}

export type PreviewProgressRecordItem = {
  row: PreviewModuleRow;
  date?: string;
  status?: string;
  progress?: number;
  links: PreviewResolvedLinks;
  latestForProject: boolean;
};

export function getPreviewProgressRecordItems(): PreviewProgressRecordItem[] {
  const rows = getPreviewModuleRows("progress");
  const latestDateByProject = new Map<string, string>();

  for (const row of rows) {
    const projectId = row.links?.projectId;
    const date = getPreviewRowDate(row);
    if (!projectId || !date) continue;
    const currentLatest = latestDateByProject.get(projectId);
    if (!currentLatest || date > currentLatest) latestDateByProject.set(projectId, date);
  }

  return rows
    .map((row) => {
      const date = getPreviewRowDate(row);
      const projectId = row.links?.projectId;
      return {
        row,
        date,
        status: getPreviewRowStatus(row),
        progress: getPreviewRowProgress(row),
        links: linksForRow(row),
        latestForProject: Boolean(projectId && date && latestDateByProject.get(projectId) === date),
      };
    })
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.row.id.localeCompare(b.row.id));
}

export type PreviewDocumentItem = {
  row: PreviewModuleRow;
  updated?: string;
  fileFormat?: string;
  links: PreviewResolvedLinks;
};

export function getPreviewDocumentItems(): PreviewDocumentItem[] {
  return getPreviewModuleRows("documents")
    .map((row) => {
      const size = getPreviewRowText(row, "size");
      return {
        row,
        updated: getPreviewRowDate(row),
        fileFormat: typeof size === "string" ? size.split(" · ")[0] : undefined,
        links: linksForRow(row),
      };
    })
    .sort((a, b) => (b.updated ?? "").localeCompare(a.updated ?? ""));
}

export type PreviewHandoverItem = {
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
  project?: PreviewProject;
  operations?: PreviewProjectOperations;
  pending: boolean;
};

export function getPreviewHandoverItems(): PreviewHandoverItem[] {
  return getPreviewModuleRows("handover")
    .map((row) => {
      const projectId = row.links?.projectId;
      return {
        row,
        reference: getPreviewRowReference(row),
        status: getPreviewRowStatus(row),
        date: getPreviewRowDate(row),
        links: linksForRow(row),
        project: projectId
          ? previewProjects.find((project) => project.id === projectId)
          : undefined,
        operations: projectId ? getPreviewProjectOperations(projectId) : undefined,
        pending: getPreviewRowStatus(row) === "pending",
      };
    })
    .sort(
      (a, b) => Number(b.pending) - Number(a.pending) || (a.date ?? "").localeCompare(b.date ?? ""),
    );
}

export type PreviewWarrantyItem = {
  row: PreviewModuleRow;
  reference?: string;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
  active: boolean;
};

export function getPreviewWarrantyItems(): PreviewWarrantyItem[] {
  return getPreviewModuleRows("warranty")
    .map((row) => {
      const status = getPreviewRowStatus(row);
      return {
        row,
        reference: getPreviewRowReference(row),
        status,
        date: getPreviewRowDate(row),
        links: linksForRow(row),
        active: status ? !completedStatuses.has(status) : false,
      };
    })
    .sort(
      (a, b) => Number(b.active) - Number(a.active) || (b.date ?? "").localeCompare(a.date ?? ""),
    );
}

export type PreviewNotificationItem = {
  row: PreviewModuleRow;
  entityReference?: string;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
  requiresReview: boolean;
  recordedAsSent: boolean;
};

export function getPreviewNotificationItems(): PreviewNotificationItem[] {
  return getPreviewModuleRows("notifications")
    .map((row) => {
      const status = getPreviewRowStatus(row);
      return {
        row,
        entityReference: getPreviewRowReference(row),
        status,
        date: getPreviewRowDate(row),
        links: linksForRow(row),
        requiresReview: status === "new",
        recordedAsSent: status === "sent",
      };
    })
    .sort(
      (a, b) =>
        Number(b.requiresReview) - Number(a.requiresReview) ||
        (b.date ?? "").localeCompare(a.date ?? "") ||
        a.row.id.localeCompare(b.row.id),
    );
}

export type PreviewAuditItem = {
  row: PreviewModuleRow;
  entityReference?: string;
  actor?: LocalizedText | string;
  action?: LocalizedText | string;
  status?: string;
  date?: string;
  links: PreviewResolvedLinks;
};

export function getPreviewAuditItems(): PreviewAuditItem[] {
  return getPreviewModuleRows("audit")
    .map((row) => ({
      row,
      entityReference: getPreviewRowReference(row),
      actor: getPreviewRowText(row, "actor"),
      action: getPreviewRowText(row, "action"),
      status: getPreviewRowStatus(row),
      date: getPreviewRowDate(row),
      links: linksForRow(row),
    }))
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || a.row.id.localeCompare(b.row.id));
}

export type PreviewOverviewActionQueueKind =
  | "projectBlocker"
  | "requestReview"
  | "milestone"
  | "pendingReport"
  | "pendingHandover"
  | "quotationDecision"
  | "pendingContract"
  | "activeWarranty";

export type PreviewOverviewActionQueueItem = {
  id: string;
  kind: PreviewOverviewActionQueueKind;
  reference: string;
  title: LocalizedText | string;
  date?: string;
  status?: string;
  dashboardSegment: string;
  projectId?: string;
  requestId?: string;
  requestNextAction?: PreviewRequestWorkflow["nextAction"];
  milestoneState?: PreviewMilestoneScheduleState;
};

function overviewQueueRowTitle(
  row: PreviewModuleRow,
  keys: readonly string[],
): LocalizedText | string {
  for (const key of keys) {
    const value = getPreviewRowText(row, key);
    if (value) return value;
  }
  return row.id;
}

function overviewProjectSegment(projectId: string | undefined, hash: string): string {
  return projectId ? `projects/${encodeURIComponent(projectId)}#${hash}` : "projects";
}

export function getPreviewOverviewActionQueue(
  snapshotDate = previewSnapshotDate,
): PreviewOverviewActionQueueItem[] {
  const projectBlockers = getPreviewFindingItems()
    .filter((item) => item.blocker)
    .map((item) => ({
      id: `project-blocker:${item.row.id}`,
      kind: "projectBlocker" as const,
      reference: item.reference ?? item.row.id,
      title: overviewQueueRowTitle(item.row, ["title"]),
      date: getPreviewRowDate(item.row),
      status: item.status,
      dashboardSegment: overviewProjectSegment(item.row.links?.projectId, "project-findings"),
      projectId: item.row.links?.projectId,
    }));

  const requestStatusRank = new Map([
    ["new", 0],
    ["on_hold", 1],
    ["approved", 2],
  ]);
  const requestReviews = previewRequests
    .map((request) => ({ request, workflow: getPreviewRequestWorkflow(request) }))
    .filter(
      ({ request, workflow }) => request.status !== "cancelled" && workflow.blockers.length > 0,
    )
    .sort((a, b) => {
      const rankDifference =
        (requestStatusRank.get(a.request.status) ?? 3) -
        (requestStatusRank.get(b.request.status) ?? 3);
      return rankDifference || a.request.submittedAt.localeCompare(b.request.submittedAt);
    })
    .map(({ request, workflow }) => ({
      id: `request-review:${request.id}`,
      kind: "requestReview" as const,
      reference: request.id,
      title: request.serviceLabel,
      date: request.submittedAt,
      status: request.status,
      dashboardSegment: "requests",
      requestId: request.id,
      requestNextAction: workflow.nextAction,
    }));

  const milestones = getPreviewMilestoneItems(snapshotDate)
    .filter((item) => item.scheduleState === "overdue" || item.scheduleState === "dueSoon")
    .map((item) => ({
      id: `milestone:${item.row.id}`,
      kind: "milestone" as const,
      reference: item.projectId ?? item.row.id,
      title: item.title,
      date: item.due,
      status: item.status,
      dashboardSegment: overviewProjectSegment(item.projectId, "project-milestones"),
      projectId: item.projectId,
      milestoneState: item.scheduleState,
    }));

  const pendingReports = getPreviewReportItems()
    .filter((item) => item.pending)
    .map((item) => {
      const projectId = item.row.links?.projectId;
      const week = getPreviewRowText(item.row, "week");
      return {
        id: `pending-report:${item.row.id}`,
        kind: "pendingReport" as const,
        reference: projectId && typeof week === "string" ? `${projectId} · ${week}` : item.row.id,
        title: overviewQueueRowTitle(item.row, ["title"]),
        date: item.date,
        status: item.status,
        dashboardSegment: overviewProjectSegment(projectId, "project-reports"),
        projectId,
      };
    });

  const pendingHandovers = getPreviewHandoverItems()
    .filter((item) => item.pending)
    .map((item) => ({
      id: `pending-handover:${item.row.id}`,
      kind: "pendingHandover" as const,
      reference: item.reference ?? item.row.id,
      title: item.project?.title ?? overviewQueueRowTitle(item.row, ["project"]),
      date: item.date,
      status: item.status,
      dashboardSegment: overviewProjectSegment(item.row.links?.projectId, "project-handover"),
      projectId: item.row.links?.projectId,
    }));

  const quotationDecisions = getPreviewQuotationItems()
    .filter((item) => item.status === "sent")
    .map((item) => ({
      id: `quotation-decision:${item.row.id}`,
      kind: "quotationDecision" as const,
      reference: item.reference ?? item.row.id,
      title: overviewQueueRowTitle(item.row, ["title"]),
      date: getPreviewRowDate(item.row),
      status: item.status,
      dashboardSegment: "quotations",
      requestId: item.row.links?.requestId,
      projectId: item.row.links?.projectId,
    }));

  const pendingContracts = getPreviewContractItems()
    .filter((item) => item.status === "pending")
    .map((item) => ({
      id: `pending-contract:${item.row.id}`,
      kind: "pendingContract" as const,
      reference: item.reference ?? item.row.id,
      title: overviewQueueRowTitle(item.row, ["type", "title"]),
      date: getPreviewRowDate(item.row),
      status: item.status,
      dashboardSegment: "contracts",
      projectId: item.row.links?.projectId,
    }));

  const activeWarranty = getPreviewWarrantyItems()
    .filter((item) => item.active)
    .map((item) => ({
      id: `active-warranty:${item.row.id}`,
      kind: "activeWarranty" as const,
      reference: item.reference ?? item.row.id,
      title: overviewQueueRowTitle(item.row, ["title"]),
      date: item.date,
      status: item.status,
      dashboardSegment: "warranty",
      projectId: item.row.links?.projectId,
    }));

  return [
    ...projectBlockers,
    ...requestReviews,
    ...milestones,
    ...pendingReports,
    ...pendingHandovers,
    ...quotationDecisions,
    ...pendingContracts,
    ...activeWarranty,
  ];
}
