/**
 * Record → DTO projections for the foundation API. Mappings are explicit
 * field-by-field (never object spreads of records): `workspaceId`,
 * password hashes, document `storageRef`s, and other server-internal
 * fields must never reach the wire (contract §2, §6). Derived read-model
 * fields are computed here or by services — never stored, never
 * client-writable.
 */

import type {
  AuditEventDTO,
  ComplaintDTO,
  ContractSummaryDTO,
  CustomerDTO,
  DiaryEntryDTO,
  DecisionEligibility,
  DocumentDTO,
  DueDTO,
  FindingDTO,
  HandoverDTO,
  InspectionDTO,
  MilestoneDTO,
  PaymentDTO,
  ProgressMeasurementDTO,
  ProjectDTO,
  ProjectSummaryDTO,
  PurchaseDTO,
  QuotationSummaryDTO,
  SupplierDTO,
  UserDTO,
  WarrantyRequestDTO,
  WeeklyReportDTO,
} from "@/lib/api-types";
import type {
  AuditEventRecord,
  ComplaintRecord,
  ContractRecord,
  CustomerRecord,
  DiaryEntryRecord,
  DocumentRecord,
  DueRecord,
  FindingRecord,
  HandoverRecord,
  InspectionRecord,
  MilestoneRecord,
  PaymentRecord,
  ProgressMeasurementRecord,
  ProjectRecord,
  PurchaseRecord,
  QuotationRecord,
  QuotationRevisionRecord,
  SupplierRecord,
  UserRecord,
  WarrantyRequestRecord,
  WeeklyReportRecord,
} from "./ports";

export function toUserDTO(record: UserRecord): UserDTO {
  return {
    id: record.id,
    email: record.email,
    ...(record.phoneE164 !== undefined ? { phoneE164: record.phoneE164 } : {}),
    displayName: record.displayName,
    role: record.role,
    status: record.status,
    ...(record.customerId !== undefined ? { customerId: record.customerId } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    ...(record.lastLoginAt !== undefined ? { lastLoginAt: record.lastLoginAt } : {}),
    version: record.version,
  };
}

export function toCustomerDTO(record: CustomerRecord): CustomerDTO {
  return {
    id: record.id,
    reference: record.reference,
    name: record.name,
    phoneE164: record.phoneE164,
    ...(record.email !== undefined ? { email: record.email } : {}),
    ...(record.city !== undefined ? { city: record.city } : {}),
    whatsappConsent: record.whatsappConsent,
    portalUserIds: [...record.portalUserIds],
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toProjectSummaryDTO(
  record: ProjectRecord,
  derived: { progressPercent: number; currentMilestoneId?: string; customerName?: string },
): ProjectSummaryDTO {
  return {
    id: record.id,
    reference: record.reference,
    title: record.title,
    customerId: record.customerId,
    ...(derived.customerName !== undefined ? { customerName: derived.customerName } : {}),
    contractId: record.contractId,
    serviceSlug: record.serviceSlug,
    status: record.status,
    progressPercent: derived.progressPercent,
    ...(derived.currentMilestoneId !== undefined
      ? { currentMilestoneId: derived.currentMilestoneId }
      : {}),
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toProjectDTO(
  record: ProjectRecord,
  derived: { progressPercent: number; currentMilestoneId?: string; customerName?: string },
): ProjectDTO {
  return {
    ...toProjectSummaryDTO(record, derived),
    ...(record.quotationId !== undefined ? { quotationId: record.quotationId } : {}),
    createdAt: record.createdAt,
  };
}

export function toMilestoneDTO(record: MilestoneRecord): MilestoneDTO {
  return {
    id: record.id,
    projectId: record.projectId,
    title: record.title,
    ...(record.detail !== undefined ? { detail: record.detail } : {}),
    status: record.status,
    progressPercent: record.progressPercent,
    plannedDate: record.plannedDate,
    ...(record.completedAt !== undefined ? { completedAt: record.completedAt } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toDiaryEntryDTO(record: DiaryEntryRecord): DiaryEntryDTO {
  return {
    id: record.id,
    projectId: record.projectId,
    entryDate: record.entryDate,
    title: record.title,
    ...(record.body !== undefined ? { body: record.body } : {}),
    authorId: record.authorId,
    attachmentDocumentIds: [...record.attachmentDocumentIds],
    createdAt: record.createdAt,
  };
}

export function toProgressMeasurementDTO(
  record: ProgressMeasurementRecord,
): ProgressMeasurementDTO {
  return {
    id: record.id,
    projectId: record.projectId,
    ...(record.milestoneId !== undefined ? { milestoneId: record.milestoneId } : {}),
    measuredPercent: record.measuredPercent,
    measuredAt: record.measuredAt,
    recordedAt: record.recordedAt,
    measuredBy: record.measuredBy,
    ...(record.note !== undefined ? { note: record.note } : {}),
  };
}

export function toFindingDTO(record: FindingRecord): FindingDTO {
  return {
    id: record.id,
    reference: record.reference,
    projectId: record.projectId,
    kind: record.kind,
    source: record.source,
    ...(record.phase !== undefined ? { phase: record.phase } : {}),
    title: record.title,
    ...(record.location !== undefined ? { location: record.location } : {}),
    detail: record.detail,
    ...(record.correctiveAction !== undefined ? { correctiveAction: record.correctiveAction } : {}),
    ...(record.assigneeId !== undefined ? { assigneeId: record.assigneeId } : {}),
    severity: record.severity,
    status: record.status,
    reportedAt: record.reportedAt,
    ...(record.resolvedAt !== undefined ? { resolvedAt: record.resolvedAt } : {}),
    ...(record.resolvedBy !== undefined ? { resolvedBy: record.resolvedBy } : {}),
    version: record.version,
  };
}

export function toWeeklyReportDTO(record: WeeklyReportRecord): WeeklyReportDTO {
  return {
    id: record.id,
    projectId: record.projectId,
    weekStart: record.weekStart,
    title: record.title,
    ...(record.progressPercent !== undefined ? { progressPercent: record.progressPercent } : {}),
    status: record.status,
    ...(record.documentId !== undefined ? { documentId: record.documentId } : {}),
    ...(record.publishedAt !== undefined ? { publishedAt: record.publishedAt } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toInspectionDTO(record: InspectionRecord): InspectionDTO {
  return {
    id: record.id,
    reference: record.reference,
    requestId: record.requestId,
    customerId: record.customerId ?? null,
    serviceSlug: record.serviceSlug,
    scheduledAt: record.scheduledAt,
    engineerId: record.engineerId,
    status: record.status,
    ...(record.result !== undefined ? { result: record.result } : {}),
    version: record.version,
  };
}

/**
 * Decision eligibility of the CURRENT revision (contract §2.5):
 * a decided revision is `decided` forever; `superseded` applies only to
 * a sent, undecided revision replaced by a newer one — impossible for
 * the current revision itself, so it never appears here (it matters on
 * per-revision projections, which arrive with the quotation detail).
 */
export function deriveDecisionEligibility(
  revision: QuotationRevisionRecord,
  nowIso: string,
): DecisionEligibility {
  if (revision.customerDecision !== null) return "decided";
  if (revision.delivery.status !== "sent") return "not_sent";
  if (revision.validUntil !== undefined && revision.validUntil < nowIso.slice(0, 10)) {
    return "expired";
  }
  return "actionable";
}

export function toQuotationSummaryDTO(
  record: QuotationRecord,
  nowIso: string,
  customerName?: string,
): QuotationSummaryDTO {
  const current =
    record.revisions.find((revision) => revision.revisionNo === record.currentRevisionNo) ??
    record.revisions.at(-1);
  if (!current) {
    // A quotation without revisions is corrupt data; surface as empty
    // commercial state rather than inventing figures.
    throw new Error(`Quotation ${record.id} has no revisions`);
  }
  const decision = current.customerDecision;
  return {
    id: record.id,
    reference: record.reference,
    ...(record.requestId !== undefined ? { requestId: record.requestId } : {}),
    customerId: record.customerId,
    ...(customerName !== undefined ? { customerName } : {}),
    title: current.title,
    currency: record.currency,
    currentRevisionNo: record.currentRevisionNo,
    internalReviewStatus: current.internalReview.status,
    deliveryStatus: current.delivery.status,
    ...(decision !== null ? { customerDecisionOutcome: decision.outcome } : {}),
    decisionEligibility: deriveDecisionEligibility(current, nowIso),
    // `superseded` here depends on the unchosen TBD-PO-04A Q2 option and
    // is therefore never emitted yet (documented in api-types).
    contractEligibility:
      decision !== null && decision.outcome === "approved" ? "eligible" : "not_eligible",
    totals: current.totals,
    ...(current.validUntil !== undefined ? { validUntil: current.validUntil } : {}),
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toContractSummaryDTO(
  record: ContractRecord,
  customerName?: string,
): ContractSummaryDTO {
  const approvedDeltas = record.changeOrders
    .filter((order) => order.decisionStatus === "approved")
    .reduce((total, order) => total + order.amountDeltaMinor, 0);
  return {
    id: record.id,
    reference: record.reference,
    quotationId: record.quotationId,
    quotationRevisionNo: record.quotationRevisionNo,
    customerId: record.customerId,
    ...(customerName !== undefined ? { customerName } : {}),
    ...(record.projectId !== undefined ? { projectId: record.projectId } : {}),
    type: record.type,
    baseAmountMinor: record.baseAmountMinor,
    effectiveAmountMinor: record.baseAmountMinor + approvedDeltas,
    currency: record.currency,
    status: record.status,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toHandoverDTO(record: HandoverRecord): HandoverDTO {
  return {
    id: record.id,
    projectId: record.projectId,
    ...(record.scheduledAt !== undefined ? { scheduledAt: record.scheduledAt } : {}),
    checklist: record.checklist.map((item) => ({ ...item })),
    status: record.status,
    ...(record.handedOverAt !== undefined ? { handedOverAt: record.handedOverAt } : {}),
    version: record.version,
  };
}

export function toWarrantyRequestDTO(record: WarrantyRequestRecord): WarrantyRequestDTO {
  return {
    id: record.id,
    reference: record.reference,
    projectId: record.projectId,
    source: record.source,
    title: record.title,
    detail: record.detail,
    status: record.status,
    ...(record.visitScheduledAt !== undefined ? { visitScheduledAt: record.visitScheduledAt } : {}),
    ...(record.assigneeId !== undefined ? { assigneeId: record.assigneeId } : {}),
    ...(record.resolutionNote !== undefined ? { resolutionNote: record.resolutionNote } : {}),
    ...(record.resolvedBy !== undefined ? { resolvedBy: record.resolvedBy } : {}),
    ...(record.closedAt !== undefined ? { closedAt: record.closedAt } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toDocumentDTO(record: DocumentRecord): DocumentDTO {
  return {
    id: record.id,
    owner: { ...record.owner },
    title: record.title,
    docType: record.docType,
    visibleToCustomer: record.visibleToCustomer,
    currentVersionNo: record.currentVersionNo,
    // `storageRef` is deliberately dropped here (contract §2.6).
    versions: record.versions.map((version) => ({
      versionNo: version.versionNo,
      fileName: version.fileName,
      mimeType: version.mimeType,
      sizeBytes: version.sizeBytes,
      uploadedBy: version.uploadedBy,
      uploadedAt: version.uploadedAt,
    })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toAuditEventDTO(record: AuditEventRecord): AuditEventDTO {
  return {
    id: record.id,
    at: record.at,
    actor: { ...record.actor },
    action: record.action,
    entity: { ...record.entity },
    ...(record.correlationId !== undefined ? { correlationId: record.correlationId } : {}),
  };
}

export function toDueDTO(record: DueRecord, allocatedMinor: number, todayIso: string): DueDTO {
  const remainingMinor = Math.max(0, record.amountMinor - allocatedMinor);
  return {
    id: record.id,
    customerId: record.customerId,
    projectId: record.projectId,
    label: record.label,
    dueDate: record.dueDate,
    amountMinor: record.amountMinor,
    currency: record.currency,
    allocatedMinor,
    remainingMinor,
    balanceStatus: remainingMinor === 0 ? "settled" : record.dueDate < todayIso ? "overdue" : "due",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toPaymentDTO(record: PaymentRecord): PaymentDTO {
  return {
    id: record.id,
    customerId: record.customerId,
    projectId: record.projectId,
    paidAt: record.paidAt,
    method: record.method,
    amountMinor: record.amountMinor,
    currency: record.currency,
    allocations: record.allocations.map((allocation) => ({ ...allocation })),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toSupplierDTO(record: SupplierRecord): SupplierDTO {
  return {
    id: record.id,
    reference: record.reference,
    name: record.name,
    ...(record.category !== undefined ? { category: record.category } : {}),
    ...(record.phoneE164 !== undefined ? { phoneE164: record.phoneE164 } : {}),
    ...(record.city !== undefined ? { city: record.city } : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toPurchaseDTO(record: PurchaseRecord): PurchaseDTO {
  const lines = record.lines.map((line) => ({
    ...line,
    // Quantities may carry up to 3 decimals (contract §2.5 convention);
    // line totals round to the nearest minor unit.
    lineTotalMinor: Math.round(line.quantity * line.unitPriceMinor),
  }));
  const grossMinor = lines.reduce((total, line) => total + line.lineTotalMinor, 0);
  const netMinor = grossMinor - record.discountMinor;
  return {
    id: record.id,
    reference: record.reference,
    supplierId: record.supplierId,
    projectId: record.projectId,
    date: record.date,
    supplierInvoiceRef: record.supplierInvoiceRef,
    lines,
    discountMinor: record.discountMinor,
    paidAmountMinor: record.paidAmountMinor,
    currency: record.currency,
    totals: { grossMinor, netMinor, payableMinor: netMinor - record.paidAmountMinor },
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}

export function toComplaintDTO(record: ComplaintRecord): ComplaintDTO {
  return {
    id: record.id,
    reference: record.reference,
    kind: record.kind,
    customerId: record.customerId,
    ...(record.projectId !== undefined ? { projectId: record.projectId } : {}),
    category: record.category,
    title: record.title,
    detail: record.detail,
    status: record.status,
    priority: record.priority,
    assigneeId: record.assigneeId ?? null,
    replies: record.replies.map((reply) => ({ ...reply })),
    ...(record.resolutionSummary !== undefined
      ? { resolutionSummary: record.resolutionSummary }
      : {}),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    version: record.version,
  };
}
