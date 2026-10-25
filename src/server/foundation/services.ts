/**
 * Foundation application services — business rules over the ports.
 *
 * Layering (contract §5.1): routes do auth + transport only; these
 * services own validation, workspace scoping, idempotency, optimistic
 * concurrency, audit decisions, and DTO projection; adapters own
 * storage. Nothing here imports an ORM/driver or vendor SDK.
 *
 * Wave-1 scope honesty:
 * - Customers are fully writable (create/list/get/patch) per contract
 *   §2.4/§3.3. Duplicate phones are neither merged nor rejected — that
 *   policy is TBD-PO-12; `derivedStatus` is omitted until its inputs
 *   (linked requests/projects) are writable.
 * - Every other domain is READ-only over its port. Reads never append
 *   audit rows (contract §1.10 `READ`). Write endpoints for those
 *   domains return 501 at the HTTP layer until their gating owner
 *   decisions land; no state machine is invented here.
 * - Derived read-models (project progress, due balances, purchase
 *   totals, quotation eligibility) follow the contract's stated
 *   formulas and are marked provisional where the contract says so.
 */

import { createHash } from "node:crypto";
import type {
  AuditEventDTO,
  ComplaintDTO,
  ContractSummaryDTO,
  CurrentUserDTO,
  CustomerDTO,
  DiaryEntryDTO,
  DocumentDTO,
  DueDTO,
  FindingDTO,
  HandoverDTO,
  InspectionDTO,
  MilestoneDTO,
  Page,
  PaymentDTO,
  ProgressMeasurementDTO,
  ProjectDTO,
  ProjectSummaryDTO,
  PurchaseDTO,
  QuotationSummaryDTO,
  RoleCode,
  SupplierDTO,
  UserDTO,
  WarrantyRequestDTO,
  WeeklyReportDTO,
  WorkspaceDTO,
} from "@/lib/api-types";
import * as dto from "./dto";
import { ApiError, toApiError } from "./errors";
import { parseListQuery, type ListQuerySpec } from "./query";
import { isValidIdempotencyKey, validateBody } from "./validation";
import type {
  AuditEventRecord,
  BaseListQuery,
  CustomerRecord,
  FoundationPorts,
  FoundationRepositories,
  PaymentRecord,
  ProjectRecord,
} from "./ports";

/** The authenticated actor, resolved server-side from the session. */
export interface Actor {
  userId: string;
  email: string;
  displayName: string;
  /** API role code (§1.3); the env owner maps to OWN until PO-03 lands. */
  role: RoleCode;
  workspaceId: string;
  provisioning: "environment" | "database";
}

const ROLE_CODES = new Set(["OWN", "OPS", "CRD", "INS", "PM", "QA", "CUST"]);
const USER_STATUSES = new Set(["invited", "active", "disabled"]);
const PROJECT_STATUSES = new Set(["in_progress", "on_hold", "handed_over", "cancelled"]);
const MILESTONE_STATUSES = new Set(["pending", "in_progress", "completed"]);
const FINDING_KINDS = new Set(["issue", "quality"]);
const FINDING_STATUSES = new Set(["open", "in_progress", "resolved"]);
const REPORT_STATUSES = new Set(["draft", "pending", "approved", "sent"]);
const INSPECTION_STATUSES = new Set(["inspection_scheduled", "inspection_done", "cancelled"]);
const CONTRACT_STATUSES = new Set(["draft", "pending_signature", "signed"]);
const WARRANTY_STATUSES = new Set(["open", "in_progress", "resolved"]);
const PAYMENT_METHODS = new Set(["cash", "instapay", "fawry", "bank_transfer"]);
const COMPLAINT_STATUSES = new Set(["open", "in_progress", "resolved"]);
const COMPLAINT_KINDS = new Set(["complaint", "suggestion"]);

const CUSTOMERS_ROUTE = "/api/v1/admin/customers";
/** Authenticated-create idempotency retention (contract §1.8 proposal). */
const IDEMPOTENCY_RETENTION_MS = 7 * 24 * 60 * 60 * 1000;

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, item]) => item !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`).join(",")}}`;
}

function payloadHash(payload: unknown): string {
  return createHash("sha256").update(stableStringify(payload)).digest("hex");
}

/** Pages through a repository list until exhausted (read-model composition). */
async function listAll<TRecord, TQuery extends BaseListQuery>(
  list: (query: TQuery) => Promise<Page<TRecord>>,
  query: TQuery,
): Promise<TRecord[]> {
  const all: TRecord[] = [];
  let page = 1;
  for (;;) {
    const result = await list({ ...query, page, pageSize: 100 });
    all.push(...result.items);
    if (all.length >= result.total || result.items.length === 0) return all;
    page += 1;
  }
}

export function createFoundationServices(ports: FoundationPorts) {
  const repos = ports.repositories;

  function auditEntry(
    actor: Actor,
    action: string,
    entity: { type: string; id: string; reference?: string },
    correlationId?: string,
  ): AuditEventRecord {
    return {
      id: ports.ids.newId(),
      workspaceId: actor.workspaceId,
      at: ports.clock.now(),
      actor: { kind: "user", userId: actor.userId, role: actor.role },
      action,
      entity,
      ...(correlationId !== undefined ? { correlationId } : {}),
    };
  }

  async function customerName(
    workspaceId: string,
    customerId: string,
  ): Promise<string | undefined> {
    const customer = await repos.customers.byId(workspaceId, customerId);
    return customer?.name;
  }

  async function projectDerived(actor: Actor, project: ProjectRecord) {
    const [measurements, milestones, name] = await Promise.all([
      listAll(repos.progress.list, {
        workspaceId: actor.workspaceId,
        projectId: project.id,
        page: 1,
        pageSize: 100,
        sortField: "measuredAt",
        direction: "desc" as const,
      }),
      listAll(repos.milestones.list, {
        workspaceId: actor.workspaceId,
        projectId: project.id,
        page: 1,
        pageSize: 100,
        sortField: "plannedDate",
        direction: "asc" as const,
      }),
      customerName(actor.workspaceId, project.customerId),
    ]);
    // PROVISIONAL (TBD-PO-18): latest measurement by (measuredAt,
    // recordedAt, id), else 0 — the contract's proposed default.
    const latest = [...measurements].sort((a, b) => {
      if (a.measuredAt !== b.measuredAt) return a.measuredAt < b.measuredAt ? 1 : -1;
      if (a.recordedAt !== b.recordedAt) return a.recordedAt < b.recordedAt ? 1 : -1;
      return a.id < b.id ? 1 : -1;
    })[0];
    const currentMilestone = milestones.find((milestone) => milestone.status !== "completed");
    return {
      progressPercent: latest?.measuredPercent ?? 0,
      ...(currentMilestone ? { currentMilestoneId: currentMilestone.id } : {}),
      ...(name !== undefined ? { customerName: name } : {}),
    };
  }

  async function requireProject(actor: Actor, projectId: string): Promise<ProjectRecord> {
    const project = await repos.projects.byId(actor.workspaceId, projectId);
    if (!project) throw new ApiError("NOT_FOUND");
    return project;
  }

  function baseQuery(
    actor: Actor,
    params: URLSearchParams,
    spec: ListQuerySpec,
  ): BaseListQuery & {
    parsed: ReturnType<typeof parseListQuery>;
  } {
    const parsed = parseListQuery(params, spec);
    return {
      workspaceId: actor.workspaceId,
      page: parsed.page,
      pageSize: parsed.pageSize,
      sortField: parsed.sortField,
      direction: parsed.direction,
      ...(parsed.search !== undefined ? { search: parsed.search } : {}),
      ...(parsed.from !== undefined ? { from: parsed.from } : {}),
      ...(parsed.to !== undefined ? { to: parsed.to } : {}),
      parsed,
    };
  }

  async function allocatedForDues(
    actor: Actor,
    dueKeys: Array<{ customerId: string; projectId: string }>,
  ): Promise<Map<string, PaymentRecord[]>> {
    const byPair = new Map<string, PaymentRecord[]>();
    for (const { customerId, projectId } of dueKeys) {
      const key = `${customerId}|${projectId}`;
      if (byPair.has(key)) continue;
      const payments = await listAll(repos.payments.list, {
        workspaceId: actor.workspaceId,
        customerId,
        projectId,
        page: 1,
        pageSize: 100,
        sortField: "paidAt",
        direction: "asc" as const,
      });
      byPair.set(key, payments);
    }
    return byPair;
  }

  function dueDTO(
    record: Parameters<typeof dto.toDueDTO>[0],
    paymentsByPair: Map<string, PaymentRecord[]>,
  ): DueDTO {
    const payments = paymentsByPair.get(`${record.customerId}|${record.projectId}`) ?? [];
    const allocated = payments.reduce(
      (total, payment) =>
        total +
        payment.allocations
          .filter((allocation) => allocation.dueId === record.id)
          .reduce((sum, allocation) => sum + allocation.amountMinor, 0),
      0,
    );
    return dto.toDueDTO(record, allocated, ports.clock.now().slice(0, 10));
  }

  return {
    // -----------------------------------------------------------------
    // System / identity reads
    // -----------------------------------------------------------------

    getWorkspace(actor: Actor): WorkspaceDTO {
      return { id: actor.workspaceId, mode: "single-workspace", multiCompany: false };
    },

    getCurrentUser(actor: Actor): CurrentUserDTO {
      return {
        id: actor.userId,
        email: actor.email,
        displayName: actor.displayName,
        role: actor.role,
        status: "active",
        provisioning: actor.provisioning,
      };
    },

    async listUsers(actor: Actor, params: URLSearchParams): Promise<Page<UserDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt", "displayName"],
        defaultSortField: "createdAt",
        enumFilters: { role: ROLE_CODES, status: USER_STATUSES },
      });
      const page = await repos.users.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toUserDTO) };
    },

    // -----------------------------------------------------------------
    // Customers (implemented writes)
    // -----------------------------------------------------------------

    async createCustomer(
      actor: Actor,
      body: unknown,
      idempotencyKey: string | null,
      correlationId: string,
    ): Promise<{ dto: CustomerDTO; status: number }> {
      const input = validateBody(body, {
        fields: {
          name: { kind: "string", required: true, minLength: 3, maxLength: 120 },
          phone: { kind: "phone", required: true },
          email: { kind: "email" },
          city: { kind: "string", maxLength: 120 },
        },
      });
      if (!isValidIdempotencyKey(idempotencyKey)) {
        throw new ApiError("IDEMPOTENCY_KEY_REQUIRED");
      }
      const hash = payloadHash({ method: "POST", routeTemplate: CUSTOMERS_ROUTE, input });
      const claimResult = await ports.idempotency.claim(
        actor.userId,
        "POST",
        CUSTOMERS_ROUTE,
        idempotencyKey,
        hash,
      );
      if (claimResult.kind === "payload_mismatch") {
        throw new ApiError("IDEMPOTENCY_PAYLOAD_MISMATCH");
      }
      if (claimResult.kind === "in_progress") {
        throw new ApiError("IDEMPOTENCY_IN_PROGRESS", {
          retryAfterSec: claimResult.retryAfterSec,
        });
      }
      if (claimResult.kind === "completed") {
        const existing = await repos.customers.byId(actor.workspaceId, claimResult.resourceId);
        if (!existing) throw new ApiError("INTERNAL");
        return { dto: dto.toCustomerDTO(existing), status: claimResult.httpStatus };
      }

      const claim = claimResult.claim;
      try {
        const record = await ports.unitOfWork.run(async (tx: FoundationRepositories) => {
          const now = ports.clock.now();
          const customer: CustomerRecord = {
            id: ports.ids.newId(),
            workspaceId: actor.workspaceId,
            reference: await tx.references.next("customer"),
            name: input.name as string,
            phoneE164: input.phone as string,
            ...(input.email !== undefined ? { email: input.email as string } : {}),
            ...(input.city !== undefined ? { city: input.city as string } : {}),
            whatsappConsent: { granted: false },
            portalUserIds: [],
            createdAt: now,
            updatedAt: now,
            version: 1,
          };
          await tx.customers.create(customer);
          await tx.auditEvents.append(
            auditEntry(
              actor,
              "customer.created",
              { type: "customer", id: customer.id, reference: customer.reference },
              correlationId,
            ),
          );
          await ports.idempotency.complete(
            claim,
            201,
            "customer",
            customer.id,
            new Date(Date.parse(now) + IDEMPOTENCY_RETENTION_MS).toISOString(),
          );
          return customer;
        });
        return { dto: dto.toCustomerDTO(record), status: 201 };
      } catch (error) {
        await ports.idempotency.releaseRetryable(claim);
        throw toApiError(error);
      }
    },

    async listCustomers(actor: Actor, params: URLSearchParams): Promise<Page<CustomerDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt", "name"],
        defaultSortField: "createdAt",
      });
      void parsed;
      const page = await repos.customers.list(base);
      return { ...page, items: page.items.map(dto.toCustomerDTO) };
    },

    async getCustomer(actor: Actor, id: string): Promise<CustomerDTO> {
      const record = await repos.customers.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toCustomerDTO(record);
    },

    async updateCustomer(
      actor: Actor,
      id: string,
      body: unknown,
      correlationId: string,
    ): Promise<CustomerDTO> {
      const input = validateBody(body, {
        fields: {
          name: { kind: "string", minLength: 3, maxLength: 120 },
          phone: { kind: "phone" },
          email: { kind: "email" },
          city: { kind: "string", maxLength: 120 },
          version: { kind: "integer", required: true, min: 1 },
        },
        nullableFields: ["email", "city"],
      });
      const changeKeys = Object.keys(input).filter((key) => key !== "version");
      if (changeKeys.length === 0) {
        throw new ApiError("VALIDATION_FAILED", { details: { reason: "EMPTY_PATCH" } });
      }
      const existing = await repos.customers.byId(actor.workspaceId, id);
      if (!existing) throw new ApiError("NOT_FOUND");

      const expectedVersion = input.version as number;
      const next: CustomerRecord = {
        ...existing,
        ...(input.name !== undefined ? { name: input.name as string } : {}),
        ...(input.phone !== undefined ? { phoneE164: input.phone as string } : {}),
        updatedAt: ports.clock.now(),
        version: existing.version + 1,
      };
      if (input.email !== undefined) {
        if (input.email === null) delete next.email;
        else next.email = input.email as string;
      }
      if (input.city !== undefined) {
        if (input.city === null) delete next.city;
        else next.city = input.city as string;
      }

      try {
        await ports.unitOfWork.run(async (tx) => {
          await tx.customers.update(next, expectedVersion);
          await tx.auditEvents.append(
            auditEntry(
              actor,
              "customer.updated",
              { type: "customer", id: next.id, reference: next.reference },
              correlationId,
            ),
          );
        });
      } catch (error) {
        throw toApiError(error);
      }
      return dto.toCustomerDTO(next);
    },

    // -----------------------------------------------------------------
    // Read-only domains (writes are 501 at the HTTP layer)
    // -----------------------------------------------------------------

    async listProjects(actor: Actor, params: URLSearchParams): Promise<Page<ProjectSummaryDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "updatedAt",
        stringFilters: ["customerId", "serviceSlug"],
        enumFilters: { status: PROJECT_STATUSES },
      });
      const page = await repos.projects.list({ ...base, ...parsed.filters });
      const items = await Promise.all(
        page.items.map(async (record) =>
          dto.toProjectSummaryDTO(record, await projectDerived(actor, record)),
        ),
      );
      return { ...page, items };
    },

    async getProject(actor: Actor, id: string): Promise<ProjectDTO> {
      const record = await requireProject(actor, id);
      return dto.toProjectDTO(record, await projectDerived(actor, record));
    },

    async listProjectMilestones(
      actor: Actor,
      projectId: string,
      params: URLSearchParams,
    ): Promise<Page<MilestoneDTO>> {
      await requireProject(actor, projectId);
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["plannedDate", "createdAt"],
        defaultSortField: "plannedDate",
        enumFilters: { status: MILESTONE_STATUSES },
      });
      const page = await repos.milestones.list({ ...base, ...parsed.filters, projectId });
      return { ...page, items: page.items.map(dto.toMilestoneDTO) };
    },

    async listProjectProgress(
      actor: Actor,
      projectId: string,
      params: URLSearchParams,
    ): Promise<Page<ProgressMeasurementDTO>> {
      await requireProject(actor, projectId);
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["measuredAt", "recordedAt"],
        defaultSortField: "measuredAt",
        stringFilters: ["milestoneId"],
        search: false,
      });
      const page = await repos.progress.list({ ...base, ...parsed.filters, projectId });
      return { ...page, items: page.items.map(dto.toProgressMeasurementDTO) };
    },

    async listProjectDiary(
      actor: Actor,
      projectId: string,
      params: URLSearchParams,
    ): Promise<Page<DiaryEntryDTO>> {
      await requireProject(actor, projectId);
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["entryDate", "createdAt"],
        defaultSortField: "entryDate",
      });
      void parsed;
      const page = await repos.diary.list({ ...base, projectId });
      return { ...page, items: page.items.map(dto.toDiaryEntryDTO) };
    },

    async listProjectReports(
      actor: Actor,
      projectId: string,
      params: URLSearchParams,
    ): Promise<Page<WeeklyReportDTO>> {
      await requireProject(actor, projectId);
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["weekStart", "createdAt"],
        defaultSortField: "weekStart",
        enumFilters: { status: REPORT_STATUSES },
      });
      const page = await repos.reports.list({ ...base, ...parsed.filters, projectId });
      return { ...page, items: page.items.map(dto.toWeeklyReportDTO) };
    },

    async getProjectHandover(actor: Actor, projectId: string): Promise<HandoverDTO> {
      await requireProject(actor, projectId);
      const page = await repos.handovers.list({
        workspaceId: actor.workspaceId,
        projectId,
        page: 1,
        pageSize: 1,
        sortField: "createdAt",
        direction: "asc",
      });
      const record = page.items[0];
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toHandoverDTO(record);
    },

    async listFindings(actor: Actor, params: URLSearchParams): Promise<Page<FindingDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["reportedAt", "createdAt"],
        defaultSortField: "reportedAt",
        stringFilters: ["projectId", "assigneeId"],
        enumFilters: { kind: FINDING_KINDS, status: FINDING_STATUSES },
      });
      const page = await repos.findings.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toFindingDTO) };
    },

    async listInspections(actor: Actor, params: URLSearchParams): Promise<Page<InspectionDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["scheduledAt", "createdAt"],
        defaultSortField: "scheduledAt",
        stringFilters: ["requestId", "engineerId"],
        enumFilters: { status: INSPECTION_STATUSES },
        dateRange: true,
      });
      const page = await repos.inspections.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toInspectionDTO) };
    },

    async getInspection(actor: Actor, id: string): Promise<InspectionDTO> {
      const record = await repos.inspections.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toInspectionDTO(record);
    },

    async listQuotations(
      actor: Actor,
      params: URLSearchParams,
    ): Promise<Page<QuotationSummaryDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "updatedAt",
        stringFilters: ["customerId", "requestId"],
      });
      const page = await repos.quotations.list({ ...base, ...parsed.filters });
      const now = ports.clock.now();
      const items = await Promise.all(
        page.items.map(async (record) =>
          dto.toQuotationSummaryDTO(
            record,
            now,
            await customerName(actor.workspaceId, record.customerId),
          ),
        ),
      );
      return { ...page, items };
    },

    async listContracts(actor: Actor, params: URLSearchParams): Promise<Page<ContractSummaryDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "updatedAt",
        stringFilters: ["customerId", "projectId"],
        enumFilters: { status: CONTRACT_STATUSES },
      });
      const page = await repos.contracts.list({ ...base, ...parsed.filters });
      const items = await Promise.all(
        page.items.map(async (record) =>
          dto.toContractSummaryDTO(
            record,
            await customerName(actor.workspaceId, record.customerId),
          ),
        ),
      );
      return { ...page, items };
    },

    async listWarrantyRequests(
      actor: Actor,
      params: URLSearchParams,
    ): Promise<Page<WarrantyRequestDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "createdAt",
        stringFilters: ["projectId", "assigneeId"],
        enumFilters: { status: WARRANTY_STATUSES },
      });
      const page = await repos.warrantyRequests.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toWarrantyRequestDTO) };
    },

    async getWarrantyRequest(actor: Actor, id: string): Promise<WarrantyRequestDTO> {
      const record = await repos.warrantyRequests.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toWarrantyRequestDTO(record);
    },

    async listDocuments(actor: Actor, params: URLSearchParams): Promise<Page<DocumentDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "updatedAt",
        stringFilters: ["entityType", "entityId", "docType", "visibleToCustomer"],
      });
      const { visibleToCustomer: rawVisible, ...filters } = parsed.filters;
      let visibleToCustomer: boolean | undefined;
      if (rawVisible !== undefined) {
        if (rawVisible !== "true" && rawVisible !== "false") {
          throw new ApiError("INVALID_QUERY");
        }
        visibleToCustomer = rawVisible === "true";
      }
      const page = await repos.documents.list({
        ...base,
        ...filters,
        ...(visibleToCustomer !== undefined ? { visibleToCustomer } : {}),
      });
      return { ...page, items: page.items.map(dto.toDocumentDTO) };
    },

    async getDocument(actor: Actor, id: string): Promise<DocumentDTO> {
      const record = await repos.documents.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toDocumentDTO(record);
    },

    async listDues(actor: Actor, params: URLSearchParams): Promise<Page<DueDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["dueDate", "createdAt"],
        defaultSortField: "dueDate",
        stringFilters: ["customerId", "projectId"],
      });
      const page = await repos.dues.list({ ...base, ...parsed.filters });
      const paymentsByPair = await allocatedForDues(actor, page.items);
      return { ...page, items: page.items.map((record) => dueDTO(record, paymentsByPair)) };
    },

    async getDue(actor: Actor, id: string): Promise<DueDTO> {
      const record = await repos.dues.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      const paymentsByPair = await allocatedForDues(actor, [record]);
      return dueDTO(record, paymentsByPair);
    },

    async listPayments(actor: Actor, params: URLSearchParams): Promise<Page<PaymentDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["paidAt", "createdAt"],
        defaultSortField: "paidAt",
        stringFilters: ["customerId", "projectId"],
        enumFilters: { method: PAYMENT_METHODS },
        search: false,
      });
      const page = await repos.payments.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toPaymentDTO) };
    },

    async getPayment(actor: Actor, id: string): Promise<PaymentDTO> {
      const record = await repos.payments.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toPaymentDTO(record);
    },

    async listSuppliers(actor: Actor, params: URLSearchParams): Promise<Page<SupplierDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "createdAt",
      });
      void parsed;
      const page = await repos.suppliers.list(base);
      return { ...page, items: page.items.map(dto.toSupplierDTO) };
    },

    async getSupplier(actor: Actor, id: string): Promise<SupplierDTO> {
      const record = await repos.suppliers.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toSupplierDTO(record);
    },

    async listPurchases(actor: Actor, params: URLSearchParams): Promise<Page<PurchaseDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["date", "createdAt"],
        defaultSortField: "date",
        stringFilters: ["supplierId", "projectId"],
      });
      const page = await repos.purchases.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toPurchaseDTO) };
    },

    async getPurchase(actor: Actor, id: string): Promise<PurchaseDTO> {
      const record = await repos.purchases.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toPurchaseDTO(record);
    },

    async listComplaints(actor: Actor, params: URLSearchParams): Promise<Page<ComplaintDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["createdAt", "updatedAt"],
        defaultSortField: "createdAt",
        stringFilters: ["customerId", "projectId"],
        enumFilters: { status: COMPLAINT_STATUSES, kind: COMPLAINT_KINDS },
      });
      const page = await repos.complaints.list({ ...base, ...parsed.filters });
      return { ...page, items: page.items.map(dto.toComplaintDTO) };
    },

    async getComplaint(actor: Actor, id: string): Promise<ComplaintDTO> {
      const record = await repos.complaints.byId(actor.workspaceId, id);
      if (!record) throw new ApiError("NOT_FOUND");
      return dto.toComplaintDTO(record);
    },

    async listAuditEvents(actor: Actor, params: URLSearchParams): Promise<Page<AuditEventDTO>> {
      const { parsed, ...base } = baseQuery(actor, params, {
        sortFields: ["at"],
        defaultSortField: "at",
        stringFilters: ["actorId", "action", "entityType", "entityId"],
        dateRange: true,
        search: false,
      });
      const page = await repos.auditEvents.query({
        workspaceId: actor.workspaceId,
        page: base.page,
        pageSize: base.pageSize,
        direction: base.direction,
        ...(base.from !== undefined ? { from: base.from } : {}),
        ...(base.to !== undefined ? { to: base.to } : {}),
        ...parsed.filters,
      });
      return { ...page, items: page.items.map(dto.toAuditEventDTO) };
    },
  };
}

export type FoundationServices = ReturnType<typeof createFoundationServices>;
