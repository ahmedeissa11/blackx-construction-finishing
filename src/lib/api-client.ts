/**
 * Centralized typed client for the BLACK X business API (`/api/v1`).
 *
 * Browser-safe: relative same-origin URLs only (the session cookie
 * authenticates; no credentials, tokens, or base URLs are handled
 * here). Every method maps to the OpenAPI contract
 * (`docs/openapi.json`) and the DTOs in `src/lib/api-types.ts`; errors
 * are normalized to `ApiClientError` carrying the server's stable
 * `code`/`messageKey`/`fieldErrors` so UI code can localize without
 * parsing prose.
 *
 * INTEGRATION STATUS (deliberate): no board is wired to this client
 * yet. Boards still read the isolated preview fixtures because no
 * production-capable database adapter exists — pointing the UI at
 * endpoints that (correctly) fail closed with 503 would break the
 * working frontend and misrepresent persistence. Cutover happens per
 * module after the real adapter passes the contract suites, under a
 * separate release decision. Until then this client is the tested,
 * ready integration point (see docs/backend-architecture.md).
 */

import type {
  ApiErrorBody,
  AuditEventDTO,
  ComplaintDTO,
  ContractSummaryDTO,
  CurrentUserDTO,
  CustomerCreateInput,
  CustomerDTO,
  CustomerUpdateInput,
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
  SupplierDTO,
  SystemStatusDTO,
  UserDTO,
  WarrantyRequestDTO,
  WeeklyReportDTO,
  WorkspaceDTO,
} from "@/lib/api-types";

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly messageKey: string;
  readonly fieldErrors?: Record<string, string[]>;
  readonly details?: Record<string, unknown>;

  constructor(status: number, body: ApiErrorBody) {
    super(body.error.code);
    this.name = "ApiClientError";
    this.status = status;
    this.code = body.error.code;
    this.messageKey = body.error.messageKey;
    this.fieldErrors = body.error.fieldErrors;
    this.details = body.error.details;
  }
}

export interface ListParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  search?: string;
  from?: string;
  to?: string;
  [filter: string]: string | number | undefined;
}

type FetchFn = typeof fetch;

export interface ApiClient {
  health(): Promise<{ status: string }>;
  ready(): Promise<{ status: string }>;
  me(): Promise<CurrentUserDTO>;
  systemStatus(): Promise<SystemStatusDTO>;
  workspace(): Promise<WorkspaceDTO>;
  listUsers(params?: ListParams): Promise<Page<UserDTO>>;
  listCustomers(params?: ListParams): Promise<Page<CustomerDTO>>;
  getCustomer(id: string): Promise<CustomerDTO>;
  createCustomer(
    input: CustomerCreateInput,
    options?: { idempotencyKey?: string },
  ): Promise<CustomerDTO>;
  updateCustomer(id: string, input: CustomerUpdateInput): Promise<CustomerDTO>;
  listProjects(params?: ListParams): Promise<Page<ProjectSummaryDTO>>;
  getProject(id: string): Promise<ProjectDTO>;
  listProjectMilestones(projectId: string, params?: ListParams): Promise<Page<MilestoneDTO>>;
  listProjectProgress(
    projectId: string,
    params?: ListParams,
  ): Promise<Page<ProgressMeasurementDTO>>;
  listProjectDiary(projectId: string, params?: ListParams): Promise<Page<DiaryEntryDTO>>;
  listProjectReports(projectId: string, params?: ListParams): Promise<Page<WeeklyReportDTO>>;
  getProjectHandover(projectId: string): Promise<HandoverDTO>;
  listFindings(params?: ListParams): Promise<Page<FindingDTO>>;
  listInspections(params?: ListParams): Promise<Page<InspectionDTO>>;
  getInspection(id: string): Promise<InspectionDTO>;
  listQuotations(params?: ListParams): Promise<Page<QuotationSummaryDTO>>;
  listContracts(params?: ListParams): Promise<Page<ContractSummaryDTO>>;
  listWarrantyRequests(params?: ListParams): Promise<Page<WarrantyRequestDTO>>;
  getWarrantyRequest(id: string): Promise<WarrantyRequestDTO>;
  listDocuments(params?: ListParams): Promise<Page<DocumentDTO>>;
  getDocument(id: string): Promise<DocumentDTO>;
  listDues(params?: ListParams): Promise<Page<DueDTO>>;
  getDue(id: string): Promise<DueDTO>;
  listPayments(params?: ListParams): Promise<Page<PaymentDTO>>;
  getPayment(id: string): Promise<PaymentDTO>;
  listSuppliers(params?: ListParams): Promise<Page<SupplierDTO>>;
  getSupplier(id: string): Promise<SupplierDTO>;
  listPurchases(params?: ListParams): Promise<Page<PurchaseDTO>>;
  getPurchase(id: string): Promise<PurchaseDTO>;
  listComplaints(params?: ListParams): Promise<Page<ComplaintDTO>>;
  getComplaint(id: string): Promise<ComplaintDTO>;
  listAuditEvents(params?: ListParams): Promise<Page<AuditEventDTO>>;
}

function toQuery(params?: ListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined) search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : "";
}

async function parseError(response: Response): Promise<ApiClientError> {
  try {
    const body = (await response.json()) as ApiErrorBody;
    if (body && typeof body === "object" && "error" in body && body.error?.code) {
      return new ApiClientError(response.status, body);
    }
  } catch {
    // fall through to the generic mapping below
  }
  return new ApiClientError(response.status, {
    error: { code: "INTERNAL", messageKey: "errors.internal" },
  });
}

export function createApiClient(fetchFn: FetchFn = fetch): ApiClient {
  async function request<T>(
    method: string,
    path: string,
    init?: { body?: unknown; idempotencyKey?: string },
  ): Promise<T> {
    const response = await fetchFn(path, {
      method,
      headers: {
        Accept: "application/json",
        ...(init?.body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(init?.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      },
      ...(init?.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!response.ok) throw await parseError(response);
    return (await response.json()) as T;
  }

  const get = <T>(path: string) => request<T>("GET", path);
  const list = <T>(path: string, params?: ListParams) => get<Page<T>>(`${path}${toQuery(params)}`);

  return {
    health: () => get("/api/v1/health"),
    ready: () => get("/api/v1/ready"),
    me: () => get("/api/v1/me"),
    systemStatus: () => get("/api/v1/admin/system/status"),
    workspace: () => get("/api/v1/admin/workspace"),
    listUsers: (params) => list("/api/v1/admin/users", params),
    listCustomers: (params) => list("/api/v1/admin/customers", params),
    getCustomer: (id) => get(`/api/v1/admin/customers/${encodeURIComponent(id)}`),
    createCustomer: (input, options) =>
      request("POST", "/api/v1/admin/customers", {
        body: input,
        // One key per user intent: callers retrying the SAME intent
        // should pass the same key explicitly.
        idempotencyKey: options?.idempotencyKey ?? globalThis.crypto.randomUUID(),
      }),
    updateCustomer: (id, input) =>
      request("PATCH", `/api/v1/admin/customers/${encodeURIComponent(id)}`, { body: input }),
    listProjects: (params) => list("/api/v1/admin/projects", params),
    getProject: (id) => get(`/api/v1/admin/projects/${encodeURIComponent(id)}`),
    listProjectMilestones: (projectId, params) =>
      list(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/milestones`, params),
    listProjectProgress: (projectId, params) =>
      list(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/progress-measurements`, params),
    listProjectDiary: (projectId, params) =>
      list(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/diary-entries`, params),
    listProjectReports: (projectId, params) =>
      list(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/weekly-reports`, params),
    getProjectHandover: (projectId) =>
      get(`/api/v1/admin/projects/${encodeURIComponent(projectId)}/handover`),
    listFindings: (params) => list("/api/v1/admin/findings", params),
    listInspections: (params) => list("/api/v1/admin/inspections", params),
    getInspection: (id) => get(`/api/v1/admin/inspections/${encodeURIComponent(id)}`),
    listQuotations: (params) => list("/api/v1/admin/quotations", params),
    listContracts: (params) => list("/api/v1/admin/contracts", params),
    listWarrantyRequests: (params) => list("/api/v1/admin/warranty-requests", params),
    getWarrantyRequest: (id) => get(`/api/v1/admin/warranty-requests/${encodeURIComponent(id)}`),
    listDocuments: (params) => list("/api/v1/admin/documents", params),
    getDocument: (id) => get(`/api/v1/admin/documents/${encodeURIComponent(id)}`),
    listDues: (params) => list("/api/v1/admin/finance/dues", params),
    getDue: (id) => get(`/api/v1/admin/finance/dues/${encodeURIComponent(id)}`),
    listPayments: (params) => list("/api/v1/admin/finance/payments", params),
    getPayment: (id) => get(`/api/v1/admin/finance/payments/${encodeURIComponent(id)}`),
    listSuppliers: (params) => list("/api/v1/admin/finance/suppliers", params),
    getSupplier: (id) => get(`/api/v1/admin/finance/suppliers/${encodeURIComponent(id)}`),
    listPurchases: (params) => list("/api/v1/admin/finance/purchases", params),
    getPurchase: (id) => get(`/api/v1/admin/finance/purchases/${encodeURIComponent(id)}`),
    listComplaints: (params) => list("/api/v1/admin/complaints", params),
    getComplaint: (id) => get(`/api/v1/admin/complaints/${encodeURIComponent(id)}`),
    listAuditEvents: (params) => list("/api/v1/admin/audit-events", params),
  };
}

/** Shared browser client (same-origin). Server components should prefer services directly. */
export const apiClient: ApiClient = createApiClient();
