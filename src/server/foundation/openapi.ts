/**
 * OpenAPI 3.1 specification for the BLACK X business API (`/api/v1`).
 *
 * Single source: served (owner-gated) at `/api/v1/admin/openapi.json`
 * and committed rendered as `docs/openapi.json` (a drift test keeps the
 * two identical, and a coverage test asserts every routed path appears
 * here). Frontend developers can build against this contract without
 * knowing anything about the database implementation — there is no
 * production database adapter yet (see `x-implementation-status`).
 *
 * Status vocabulary (vendor extension, per operation):
 * - `implemented` — endpoint works end-to-end over the ports.
 * - `read-only` — GET implemented; writes are `planned`.
 * - `planned` — returns `501 NOT_IMPLEMENTED` (after auth) naming the
 *   blocking decisions in `x-blocked-by`; DTOs/ports already exist.
 * In any environment without a configured data adapter, implemented
 * business endpoints return `503 DEPENDENCY_UNAVAILABLE` (fail-closed —
 * never fixture data).
 */

type Json = Record<string, unknown>;

const ref = (name: string): Json => ({ $ref: `#/components/schemas/${name}` });
const errRef = (): Json => ({
  description: "Error envelope (docs/api-contract-v1.md §1.7)",
  content: { "application/json": { schema: ref("ApiError") } },
});
const pageOf = (dtoName: string): Json => ({
  type: "object",
  required: ["items", "total", "page", "pageSize"],
  properties: {
    items: { type: "array", items: ref(dtoName) },
    total: { type: "integer" },
    page: { type: "integer" },
    pageSize: { type: "integer" },
  },
});
const jsonBody = (schema: Json, status = "200", description = "OK"): Json => ({
  [status]: { description, content: { "application/json": { schema } } },
});
const errors = (...codes: string[]): Json =>
  Object.fromEntries(codes.map((code) => [code, errRef()]));

const AUTH_ERRORS = errors("401", "403", "500");
const LIST_ERRORS = { ...errors("400"), ...AUTH_ERRORS, ...errors("503") };
const READ_ERRORS = { ...errors("404"), ...AUTH_ERRORS, ...errors("503") };
const WRITE_ERRORS = { ...errors("400", "404", "409", "422"), ...AUTH_ERRORS, ...errors("503") };
const PLANNED_ERRORS = { ...AUTH_ERRORS, ...errors("501") };

const listParams = (extra: Json[] = []): Json[] => [
  { $ref: "#/components/parameters/Page" },
  { $ref: "#/components/parameters/PageSize" },
  { $ref: "#/components/parameters/Sort" },
  { $ref: "#/components/parameters/Search" },
  ...extra,
];
const filterParam = (name: string, description?: string): Json => ({
  name,
  in: "query",
  required: false,
  schema: { type: "string" },
  ...(description ? { description } : {}),
});
const dateRangeParams: Json[] = [
  filterParam("from", "Inclusive ISO lower bound on the sort timestamp"),
  filterParam("to", "Inclusive ISO upper bound on the sort timestamp"),
];

const listOp = (
  summary: string,
  dtoName: string,
  extraParams: Json[] = [],
  status: "implemented" | "read-only" = "read-only",
): Json => ({
  summary,
  "x-implementation-status": status,
  security: [{ sessionCookie: [] }],
  parameters: listParams(extraParams),
  responses: { ...jsonBody(pageOf(dtoName)), ...LIST_ERRORS },
});
const detailOp = (summary: string, dtoName: string): Json => ({
  summary,
  "x-implementation-status": "read-only",
  security: [{ sessionCookie: [] }],
  responses: { ...jsonBody(ref(dtoName)), ...READ_ERRORS },
});
const plannedOp = (summary: string, blockedBy: string[]): Json => ({
  summary,
  "x-implementation-status": "planned",
  "x-blocked-by": blockedBy,
  security: [{ sessionCookie: [] }],
  responses: { ...PLANNED_ERRORS },
});

const obj = (properties: Record<string, Json>, required: string[] = []): Json => ({
  type: "object",
  ...(required.length ? { required } : {}),
  properties,
});
const str: Json = { type: "string" };
const int: Json = { type: "integer" };
const num: Json = { type: "number" };
const bool: Json = { type: "boolean" };
const dateTime: Json = { type: "string", format: "date-time" };
const date: Json = { type: "string", format: "date" };
const localized: Json = obj({ ar: str, en: str }, ["ar", "en"]);
const strEnum = (...values: string[]): Json => ({ type: "string", enum: values });

export const openApiSpec: Json = {
  openapi: "3.1.0",
  info: {
    title: "BLACK X Business API",
    version: "1.0.0-foundation.1",
    description:
      "Database-agnostic business API for BLACK X Construction & Finishing. " +
      "Foundation wave 1: customers are fully writable; other domains are read-only over " +
      "repository ports with writes returning 501 until their gating owner decisions land " +
      "(see x-blocked-by). No production database adapter is integrated yet: without one, " +
      "business endpoints fail closed with 503 instead of inventing persistence. " +
      "Normative prose contract: docs/api-contract-v1.md. Colleague integration: " +
      "docs/database-integration-contract.md.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "system" },
    { name: "identity" },
    { name: "customers" },
    { name: "intake" },
    { name: "projects" },
    { name: "operations" },
    { name: "commercial" },
    { name: "documents" },
    { name: "finance" },
    { name: "engagement" },
    { name: "audit" },
  ],
  components: {
    securitySchemes: {
      sessionCookie: {
        type: "apiKey",
        in: "cookie",
        name: "__Secure-blackx-review-session",
        description:
          "NextAuth session cookie (HttpOnly, SameSite=Lax). Browser flows only; " +
          "credentials are never accepted in URLs or custom headers.",
      },
    },
    parameters: {
      Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
      PageSize: {
        name: "pageSize",
        in: "query",
        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
      },
      Sort: {
        name: "sort",
        in: "query",
        description: "Allow-listed field, optional `-` prefix for descending (default).",
        schema: { type: "string" },
      },
      Search: { name: "search", in: "query", schema: { type: "string", maxLength: 200 } },
      IdempotencyKey: {
        name: "Idempotency-Key",
        in: "header",
        required: true,
        description: "16–128 printable ASCII; UUIDv4 recommended. One key per user intent.",
        schema: { type: "string", minLength: 16, maxLength: 128 },
      },
    },
    schemas: {
      ApiError: obj(
        {
          error: obj(
            {
              code: str,
              messageKey: str,
              fieldErrors: {
                type: "object",
                additionalProperties: { type: "array", items: str },
              },
              details: { type: "object" },
            },
            ["code", "messageKey"],
          ),
        },
        ["error"],
      ),
      CurrentUser: obj(
        {
          id: str,
          email: str,
          displayName: str,
          role: strEnum("OWN", "OPS", "CRD", "INS", "PM", "QA", "CUST"),
          status: strEnum("invited", "active", "disabled"),
          provisioning: strEnum("environment", "database"),
        },
        ["id", "email", "displayName", "role", "status", "provisioning"],
      ),
      SystemStatus: obj({
        environment: strEnum("production", "development", "test"),
        apiVersion: str,
        authConfigured: bool,
        dataAdapter: obj({
          configured: bool,
          name: { type: ["string", "null"] },
          productionCapable: bool,
        }),
        workspaceId: str,
        domains: obj({
          implemented: { type: "array", items: str },
          readOnly: { type: "array", items: str },
          planned: { type: "array", items: str },
        }),
      }),
      Workspace: obj(
        { id: str, mode: strEnum("single-workspace"), multiCompany: { const: false } },
        ["id", "mode", "multiCompany"],
      ),
      User: obj({
        id: str,
        email: str,
        phoneE164: str,
        displayName: str,
        role: strEnum("OWN", "OPS", "CRD", "INS", "PM", "QA", "CUST"),
        status: strEnum("invited", "active", "disabled"),
        customerId: str,
        createdAt: dateTime,
        updatedAt: dateTime,
        lastLoginAt: dateTime,
        version: int,
      }),
      Customer: obj(
        {
          id: str,
          reference: str,
          name: str,
          phoneE164: str,
          email: str,
          city: str,
          whatsappConsent: obj({ granted: bool, at: dateTime, source: str }, ["granted"]),
          portalUserIds: { type: "array", items: str },
          derivedStatus: str,
          createdAt: dateTime,
          updatedAt: dateTime,
          version: int,
        },
        [
          "id",
          "reference",
          "name",
          "phoneE164",
          "whatsappConsent",
          "portalUserIds",
          "createdAt",
          "updatedAt",
          "version",
        ],
      ),
      RequestSummary: obj(
        {
          id: str,
          reference: str,
          customerId: { type: ["string", "null"] },
          customerName: str,
          serviceSlug: str,
          city: str,
          submittedAt: dateTime,
          status: strEnum(
            "new",
            "contacted",
            "inspection_scheduled",
            "inspection_done",
            "quotation_sent",
            "approved",
            "on_hold",
            "cancelled",
          ),
          priority: strEnum("normal", "high", "urgent"),
          assigneeId: str,
          assigneeName: str,
          version: int,
        },
        [
          "id",
          "reference",
          "customerId",
          "customerName",
          "serviceSlug",
          "city",
          "submittedAt",
          "status",
          "priority",
          "version",
        ],
      ),
      CustomerDetail: {
        allOf: [
          ref("Customer"),
          obj(
            {
              summary: obj(
                {
                  requests: { type: "array", items: ref("RequestSummary") },
                  projects: { type: "array", items: ref("ProjectSummary") },
                  openFindings: int,
                },
                ["requests", "projects", "openFindings"],
              ),
            },
            ["summary"],
          ),
        ],
        description:
          "Customer + read-model summary (contract §3.3). summary.requests is empty while request→customer linking is unimplemented (TBD-PO-12); summary.openFindings counts findings with status open or in_progress across the customer's projects.",
      },
      CustomerCreateInput: obj({ name: str, phone: str, email: str, city: str }, ["name", "phone"]),
      CustomerUpdateInput: obj(
        {
          name: str,
          phone: str,
          email: { type: ["string", "null"] },
          city: { type: ["string", "null"] },
          version: int,
        },
        ["version"],
      ),
      ProjectSummary: obj({
        id: str,
        reference: str,
        title: localized,
        customerId: str,
        customerName: str,
        contractId: str,
        serviceSlug: str,
        status: strEnum("in_progress", "on_hold", "handed_over", "cancelled"),
        progressPercent: int,
        currentMilestoneId: str,
        updatedAt: dateTime,
        version: int,
      }),
      Project: obj({
        id: str,
        reference: str,
        title: localized,
        customerId: str,
        customerName: str,
        contractId: str,
        quotationId: str,
        serviceSlug: str,
        status: strEnum("in_progress", "on_hold", "handed_over", "cancelled"),
        progressPercent: int,
        currentMilestoneId: str,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Milestone: obj({
        id: str,
        projectId: str,
        title: localized,
        detail: str,
        status: strEnum("pending", "in_progress", "completed"),
        progressPercent: int,
        plannedDate: date,
        completedAt: dateTime,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      ProgressMeasurement: obj({
        id: str,
        projectId: str,
        milestoneId: str,
        measuredPercent: int,
        measuredAt: dateTime,
        recordedAt: dateTime,
        measuredBy: str,
        note: str,
      }),
      DiaryEntry: obj({
        id: str,
        projectId: str,
        entryDate: date,
        title: str,
        body: str,
        authorId: str,
        attachmentDocumentIds: { type: "array", items: str },
        createdAt: dateTime,
      }),
      Finding: obj({
        id: str,
        reference: str,
        projectId: str,
        kind: strEnum("issue", "quality"),
        source: strEnum("staff", "portal"),
        phase: str,
        title: str,
        location: str,
        detail: str,
        correctiveAction: str,
        assigneeId: str,
        severity: strEnum("normal", "high", "urgent"),
        status: strEnum("open", "in_progress", "resolved"),
        reportedAt: dateTime,
        resolvedAt: dateTime,
        resolvedBy: str,
        version: int,
      }),
      WeeklyReport: obj({
        id: str,
        projectId: str,
        weekStart: date,
        title: str,
        progressPercent: int,
        status: strEnum("draft", "pending", "approved", "sent"),
        documentId: str,
        publishedAt: dateTime,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Inspection: obj({
        id: str,
        reference: str,
        requestId: str,
        customerId: { type: ["string", "null"] },
        serviceSlug: str,
        scheduledAt: dateTime,
        engineerId: str,
        status: strEnum("inspection_scheduled", "inspection_done", "cancelled"),
        result: obj({ notes: str, completedAt: dateTime, completedBy: str }),
        version: int,
      }),
      QuotationSummary: obj({
        id: str,
        reference: str,
        requestId: str,
        customerId: str,
        customerName: str,
        title: str,
        currency: str,
        currentRevisionNo: int,
        internalReviewStatus: str,
        deliveryStatus: str,
        customerDecisionOutcome: strEnum("approved", "rejected"),
        decisionEligibility: strEnum("not_sent", "actionable", "decided", "superseded", "expired"),
        contractEligibility: strEnum("not_eligible", "eligible", "superseded"),
        totals: obj({ subtotalMinor: int, taxMinor: int, totalMinor: int }, [
          "subtotalMinor",
          "totalMinor",
        ]),
        validUntil: date,
        updatedAt: dateTime,
        version: int,
      }),
      ContractSummary: obj({
        id: str,
        reference: str,
        quotationId: str,
        quotationRevisionNo: int,
        customerId: str,
        customerName: str,
        projectId: str,
        type: str,
        baseAmountMinor: int,
        effectiveAmountMinor: int,
        currency: str,
        status: strEnum("draft", "pending_signature", "signed"),
        updatedAt: dateTime,
        version: int,
      }),
      Handover: obj({
        id: str,
        projectId: str,
        scheduledAt: dateTime,
        checklist: {
          type: "array",
          items: obj({
            id: str,
            label: str,
            mandatory: bool,
            checked: bool,
            checkedBy: str,
            checkedAt: dateTime,
          }),
        },
        status: strEnum("pending", "handed_over"),
        handedOverAt: dateTime,
        version: int,
      }),
      WarrantyRequest: obj({
        id: str,
        reference: str,
        projectId: str,
        source: strEnum("staff", "portal"),
        title: str,
        detail: str,
        status: strEnum("open", "in_progress", "resolved"),
        visitScheduledAt: dateTime,
        assigneeId: str,
        resolutionNote: str,
        resolvedBy: str,
        closedAt: dateTime,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Document: obj({
        id: str,
        owner: obj({ entityType: str, entityId: str }, ["entityType", "entityId"]),
        title: str,
        docType: str,
        visibleToCustomer: bool,
        currentVersionNo: int,
        versions: {
          type: "array",
          items: obj({
            versionNo: int,
            fileName: str,
            mimeType: str,
            sizeBytes: int,
            uploadedBy: str,
            uploadedAt: dateTime,
          }),
        },
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      AuditEvent: obj({
        id: str,
        at: dateTime,
        actor: obj({
          kind: strEnum("user", "public", "system", "provider"),
          userId: str,
          role: str,
        }),
        action: str,
        entity: obj({ type: str, id: str, reference: str }, ["type", "id"]),
        correlationId: str,
      }),
      Due: obj({
        id: str,
        customerId: str,
        projectId: str,
        label: localized,
        dueDate: date,
        amountMinor: int,
        currency: str,
        allocatedMinor: int,
        remainingMinor: int,
        balanceStatus: strEnum("settled", "overdue", "due"),
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Payment: obj({
        id: str,
        customerId: str,
        projectId: str,
        paidAt: dateTime,
        method: strEnum("cash", "instapay", "fawry", "bank_transfer"),
        amountMinor: int,
        currency: str,
        allocations: { type: "array", items: obj({ dueId: str, amountMinor: int }) },
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Supplier: obj({
        id: str,
        reference: str,
        name: localized,
        category: localized,
        phoneE164: str,
        city: localized,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Purchase: obj({
        id: str,
        reference: str,
        supplierId: str,
        projectId: str,
        date,
        supplierInvoiceRef: str,
        lines: {
          type: "array",
          items: obj({
            label: localized,
            quantity: num,
            unit: localized,
            unitPriceMinor: int,
            lineTotalMinor: int,
          }),
        },
        discountMinor: int,
        paidAmountMinor: int,
        currency: str,
        totals: obj({ grossMinor: int, netMinor: int, payableMinor: int }),
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      Complaint: obj({
        id: str,
        reference: str,
        kind: strEnum("complaint", "suggestion"),
        customerId: str,
        projectId: str,
        category: str,
        title: str,
        detail: str,
        status: strEnum("open", "in_progress", "resolved"),
        priority: strEnum("normal", "high"),
        assigneeId: { type: ["string", "null"] },
        replies: {
          type: "array",
          items: obj({
            id: str,
            visibility: strEnum("customer", "internal"),
            authorId: str,
            authorDisplayName: str,
            at: dateTime,
            text: str,
          }),
        },
        resolutionSummary: str,
        createdAt: dateTime,
        updatedAt: dateTime,
        version: int,
      }),
      IntakeListItem: {
        type: "object",
        description:
          "Intake read projection — field sets are normative in docs/api-contract-v1.md \u00a72.4/\u00a72.7 and src/server/intake/admin-reads.ts.",
      },
      IntakeReceipt: obj({ id: str, reference: str, receivedAt: dateTime }, [
        "id",
        "reference",
        "receivedAt",
      ]),
      InspectionRequestCreateInput: obj(
        {
          fullName: str,
          phone: str,
          email: str,
          serviceSlug: str,
          city: str,
          areaM2: { type: ["number", "string"] },
          unitType: str,
          description: str,
          consent: obj({ contact: bool, whatsapp: bool }, ["contact", "whatsapp"]),
          locale: strEnum("ar", "en"),
          challengeToken: str,
        },
        ["fullName", "phone", "serviceSlug", "city", "description", "consent", "locale"],
      ),
      ContactMessageCreateInput: obj(
        {
          fullName: str,
          phone: str,
          subject: str,
          message: str,
          consent: obj({ contact: bool, whatsapp: bool }, ["contact", "whatsapp"]),
          locale: strEnum("ar", "en"),
          challengeToken: str,
        },
        ["fullName", "phone", "subject", "message", "consent", "locale"],
      ),
    },
  },
  paths: {
    "/api/v1/health": {
      get: {
        tags: ["system"],
        summary: "Liveness (process up). No configuration detail.",
        "x-implementation-status": "implemented",
        responses: jsonBody(obj({ status: strEnum("ok") })),
      },
    },
    "/api/v1/ready": {
      get: {
        tags: ["system"],
        summary:
          "Readiness to serve (authentication configured). Adapter state is intentionally not part of readiness.",
        "x-implementation-status": "implemented",
        responses: {
          ...jsonBody(obj({ status: strEnum("ready") })),
          "503": {
            description: "Not ready",
            content: { "application/json": { schema: obj({ status: strEnum("not_ready") }) } },
          },
        },
      },
    },
    "/api/v1/me": {
      get: {
        tags: ["identity"],
        summary: "Current session identity (works without a data adapter).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody(ref("CurrentUser")), ...AUTH_ERRORS },
      },
    },
    "/api/v1/admin/system/status": {
      get: {
        tags: ["system"],
        summary: "Owner-gated operational status (booleans/names only, never secret values).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody(ref("SystemStatus")), ...AUTH_ERRORS },
      },
    },
    "/api/v1/admin/openapi.json": {
      get: {
        tags: ["system"],
        summary: "This OpenAPI document.",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody({ type: "object" }), ...AUTH_ERRORS },
      },
    },
    "/api/v1/admin/workspace": {
      get: {
        tags: ["identity"],
        summary: "Current workspace (single-workspace; multi-company prepared, not enabled).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody(ref("Workspace")), ...AUTH_ERRORS, ...errors("503") },
      },
    },
    "/api/v1/admin/users": {
      get: {
        tags: ["identity"],
        ...listOp("List database users (empty until staff accounts exist).", "User", [
          filterParam("role"),
          filterParam("status"),
        ]),
      },
      post: {
        tags: ["identity"],
        ...plannedOp("Create staff user (invited).", ["TBD-PO-03", "TBD-TECH-01"]),
      },
    },
    "/api/v1/admin/users/{id}": {
      patch: {
        tags: ["identity"],
        ...plannedOp("Update user / roles / status.", ["TBD-PO-03", "TBD-TECH-01"]),
      },
    },
    "/api/v1/admin/engineers": {
      get: {
        tags: ["identity"],
        ...plannedOp("Engineers = staff users in engineering roles; arrives with staff accounts.", [
          "TBD-PO-03",
        ]),
      },
    },
    "/api/v1/admin/customers": {
      get: { tags: ["customers"], ...listOp("List customers.", "Customer", [], "implemented") },
      post: {
        tags: ["customers"],
        summary:
          "Create a customer. Tx: customer + audit. Duplicates are neither merged nor rejected (TBD-PO-12).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("CustomerCreateInput") } },
        },
        responses: {
          ...jsonBody(
            ref("Customer"),
            "201",
            "Created (or the stored result on idempotent replay)",
          ),
          ...WRITE_ERRORS,
        },
      },
    },
    "/api/v1/admin/customers/{id}": {
      get: {
        tags: ["customers"],
        summary: "Get one customer with its linked-work summary (contract §3.3).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody(ref("CustomerDetail")), ...READ_ERRORS },
      },
      patch: {
        tags: ["customers"],
        summary:
          "Update a customer (expected version required; stale ⇒ 409 CONFLICT_VERSION; version-only ⇒ 422 EMPTY_PATCH).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("CustomerUpdateInput") } },
        },
        responses: { ...jsonBody(ref("Customer")), ...WRITE_ERRORS },
      },
    },
    "/api/v1/public/inspection-requests": {
      post: {
        tags: ["intake"],
        summary:
          "Public inspection-request intake (rate-limited, idempotent, atomic). Implemented on intake ports; forms cut over only after the real adapter integrates.",
        "x-implementation-status": "implemented",
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("InspectionRequestCreateInput") } },
        },
        responses: {
          ...jsonBody(ref("IntakeReceipt"), "201", "Received"),
          ...errors("400", "409", "422", "429", "500", "503"),
        },
      },
    },
    "/api/v1/public/contact-messages": {
      post: {
        tags: ["intake"],
        summary: "Public contact-message intake (rate-limited, idempotent, atomic).",
        "x-implementation-status": "implemented",
        parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: ref("ContactMessageCreateInput") } },
        },
        responses: {
          ...jsonBody(ref("IntakeReceipt"), "201", "Received"),
          ...errors("400", "409", "422", "429", "500", "503"),
        },
      },
    },
    "/api/v1/admin/requests": {
      get: {
        tags: ["intake"],
        ...listOp(
          "List intake requests (summaries omit phone/description).",
          "IntakeListItem",
          [filterParam("status"), filterParam("serviceSlug"), filterParam("assigneeId")],
          "implemented",
        ),
      },
    },
    "/api/v1/admin/requests/{id}": {
      get: {
        tags: ["intake"],
        summary: "Intake request detail (staff projection incl. history).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody({ type: "object" }), ...READ_ERRORS },
      },
    },
    "/api/v1/admin/contact-messages": {
      get: {
        tags: ["intake"],
        ...listOp(
          "List contact messages.",
          "IntakeListItem",
          [filterParam("subject"), ...dateRangeParams],
          "implemented",
        ),
      },
    },
    "/api/v1/admin/contact-messages/{id}": {
      get: {
        tags: ["intake"],
        summary: "Contact message detail.",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody({ type: "object" }), ...READ_ERRORS },
      },
    },
    "/api/v1/admin/audit-logs": {
      get: {
        tags: ["audit"],
        ...listOp(
          "Intake audit trail (append-only; viewing appends nothing).",
          "AuditEvent",
          [
            filterParam("actorId"),
            filterParam("action"),
            filterParam("entityType"),
            filterParam("entityId"),
            ...dateRangeParams,
          ],
          "implemented",
        ),
      },
    },
    "/api/v1/admin/notifications": {
      get: {
        tags: ["engagement"],
        ...listOp(
          "Notification outbox visibility (no params/keys/phone exposed; mutations planned).",
          "IntakeListItem",
          [filterParam("status"), filterParam("channel"), filterParam("eventType")],
          "implemented",
        ),
      },
    },
    "/api/v1/admin/overview": {
      get: {
        tags: ["intake"],
        summary: "Operational overview of intake (honest counts + recent activity).",
        "x-implementation-status": "implemented",
        security: [{ sessionCookie: [] }],
        responses: { ...jsonBody({ type: "object" }), ...AUTH_ERRORS, ...errors("503") },
      },
    },
    "/api/v1/admin/projects": {
      get: {
        tags: ["projects"],
        ...listOp(
          "List projects (progressPercent = provisional TBD-PO-18 derivation).",
          "ProjectSummary",
          [filterParam("customerId"), filterParam("status"), filterParam("serviceSlug")],
        ),
      },
      post: {
        tags: ["projects"],
        ...plannedOp("Create project (contract-derived).", ["TBD-PO-05", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/projects/{id}": {
      get: { tags: ["projects"], ...detailOp("Get one project.", "Project") },
      patch: {
        tags: ["projects"],
        ...plannedOp("Update project / status transitions.", ["TBD-PO-03"]),
      },
    },
    "/api/v1/admin/projects/{id}/milestones": {
      get: {
        tags: ["operations"],
        ...listOp("List project milestones.", "Milestone", [filterParam("status")]),
      },
    },
    "/api/v1/admin/projects/{id}/progress-measurements": {
      get: {
        tags: ["operations"],
        ...listOp("List progress measurements (immutable).", "ProgressMeasurement", [
          filterParam("milestoneId"),
        ]),
      },
    },
    "/api/v1/admin/projects/{id}/diary-entries": {
      get: {
        tags: ["operations"],
        ...listOp("List site diary entries (immutable).", "DiaryEntry"),
      },
    },
    "/api/v1/admin/projects/{id}/weekly-reports": {
      get: {
        tags: ["operations"],
        ...listOp("List weekly reports.", "WeeklyReport", [filterParam("status")]),
      },
    },
    "/api/v1/admin/projects/{id}/handover": {
      get: { tags: ["operations"], ...detailOp("Get the project's handover record.", "Handover") },
      post: {
        tags: ["operations"],
        ...plannedOp("Create handover (checklist template).", ["TBD-PO-06", "TBD-PO-05"]),
      },
      patch: {
        tags: ["operations"],
        ...plannedOp("Update checklist / complete handover.", ["TBD-PO-06", "TBD-PO-05"]),
      },
    },
    "/api/v1/admin/findings": {
      get: {
        tags: ["operations"],
        ...listOp("List issues + quality findings.", "Finding", [
          filterParam("projectId"),
          filterParam("kind"),
          filterParam("status"),
          filterParam("assigneeId"),
        ]),
      },
      post: { tags: ["operations"], ...plannedOp("Create finding.", ["TBD-PO-03"]) },
    },
    "/api/v1/admin/inspections": {
      get: {
        tags: ["operations"],
        ...listOp("List inspections.", "Inspection", [
          filterParam("requestId"),
          filterParam("engineerId"),
          filterParam("status"),
          ...dateRangeParams,
        ]),
      },
      post: {
        tags: ["operations"],
        ...plannedOp("Schedule inspection.", ["TBD-PO-13", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/inspections/{id}": {
      get: { tags: ["operations"], ...detailOp("Get one inspection.", "Inspection") },
      patch: {
        tags: ["operations"],
        ...plannedOp("Reschedule/reassign/complete inspection.", ["TBD-PO-13", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/quotations": {
      get: {
        tags: ["commercial"],
        ...listOp(
          "List quotation summaries (current revision projection; tax omitted until TBD-PO-04).",
          "QuotationSummary",
          [filterParam("customerId"), filterParam("requestId")],
        ),
      },
      post: {
        tags: ["commercial"],
        ...plannedOp("Create quotation with revision 1.", ["TBD-PO-04", "TBD-PO-04A", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/quotations/{id}": {
      get: {
        tags: ["commercial"],
        ...plannedOp("Quotation detail (revisions/items).", ["TBD-PO-04", "TBD-PO-04A"]),
      },
      patch: {
        tags: ["commercial"],
        ...plannedOp("Edit unsent current revision.", ["TBD-PO-04", "TBD-PO-04A", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/contracts": {
      get: {
        tags: ["commercial"],
        ...listOp(
          "List contract summaries (effective = base + approved change orders).",
          "ContractSummary",
          [filterParam("customerId"), filterParam("projectId"), filterParam("status")],
        ),
      },
      post: {
        tags: ["commercial"],
        ...plannedOp("Create contract from approved quotation revision.", [
          "TBD-PO-05",
          "TBD-PO-04",
        ]),
      },
    },
    "/api/v1/admin/contracts/{id}": {
      get: { tags: ["commercial"], ...plannedOp("Contract detail.", ["TBD-PO-05"]) },
      patch: { tags: ["commercial"], ...plannedOp("Update draft contract.", ["TBD-PO-05"]) },
    },
    "/api/v1/admin/warranty-requests": {
      get: {
        tags: ["operations"],
        ...listOp(
          "List warranty requests (coverage is never asserted; TBD-PO-14).",
          "WarrantyRequest",
          [filterParam("projectId"), filterParam("status"), filterParam("assigneeId")],
        ),
      },
      post: {
        tags: ["operations"],
        ...plannedOp("Create warranty request.", ["TBD-PO-14", "TBD-PO-03"]),
      },
    },
    "/api/v1/admin/warranty-requests/{id}": {
      get: { tags: ["operations"], ...detailOp("Get one warranty request.", "WarrantyRequest") },
      patch: {
        tags: ["operations"],
        ...plannedOp("Update/resolve warranty request.", ["TBD-PO-14"]),
      },
    },
    "/api/v1/admin/documents": {
      get: {
        tags: ["documents"],
        ...listOp("List document metadata (storage keys never exposed).", "Document", [
          filterParam("entityType"),
          filterParam("entityId"),
          filterParam("docType"),
          filterParam("visibleToCustomer"),
        ]),
      },
      post: {
        tags: ["documents"],
        ...plannedOp("Upload signing/finalize (object storage).", [
          "TBD-DB-09",
          "TBD-TECH-05",
          "TBD-PO-06",
        ]),
      },
    },
    "/api/v1/admin/documents/{id}": {
      get: { tags: ["documents"], ...detailOp("Get document metadata.", "Document") },
      patch: {
        tags: ["documents"],
        ...plannedOp("Update metadata/visibility.", ["TBD-PO-06", "TBD-PO-08"]),
      },
    },
    "/api/v1/admin/audit-events": {
      get: {
        tags: ["audit"],
        ...listOp(
          "Foundation staff audit events (append-only; the real adapter unifies storage with /admin/audit-logs).",
          "AuditEvent",
          [
            filterParam("actorId"),
            filterParam("action"),
            filterParam("entityType"),
            filterParam("entityId"),
            ...dateRangeParams,
          ],
          "implemented",
        ),
      },
    },
    "/api/v1/admin/finance/dues": {
      get: {
        tags: ["finance"],
        ...listOp(
          "List receivables with computed balances. Foundation-proposed (not in api-contract v1).",
          "Due",
          [filterParam("customerId"), filterParam("projectId")],
        ),
      },
      post: { tags: ["finance"], ...plannedOp("Create due.", ["TBD-PO-04"]) },
    },
    "/api/v1/admin/finance/dues/{id}": {
      get: { tags: ["finance"], ...detailOp("Get one due with computed balance.", "Due") },
    },
    "/api/v1/admin/finance/payments": {
      get: {
        tags: ["finance"],
        ...listOp("List payments with allocations. Foundation-proposed.", "Payment", [
          filterParam("customerId"),
          filterParam("projectId"),
          filterParam("method"),
        ]),
      },
      post: { tags: ["finance"], ...plannedOp("Record payment.", ["TBD-PO-04"]) },
    },
    "/api/v1/admin/finance/payments/{id}": {
      get: { tags: ["finance"], ...detailOp("Get one payment.", "Payment") },
    },
    "/api/v1/admin/finance/suppliers": {
      get: { tags: ["finance"], ...listOp("List suppliers. Foundation-proposed.", "Supplier") },
      post: { tags: ["finance"], ...plannedOp("Create supplier.", ["TBD-PO-03"]) },
    },
    "/api/v1/admin/finance/suppliers/{id}": {
      get: { tags: ["finance"], ...detailOp("Get one supplier.", "Supplier") },
    },
    "/api/v1/admin/finance/purchases": {
      get: {
        tags: ["finance"],
        ...listOp("List purchases with computed totals. Foundation-proposed.", "Purchase", [
          filterParam("supplierId"),
          filterParam("projectId"),
        ]),
      },
      post: { tags: ["finance"], ...plannedOp("Create purchase.", ["TBD-PO-04"]) },
    },
    "/api/v1/admin/finance/purchases/{id}": {
      get: { tags: ["finance"], ...detailOp("Get one purchase.", "Purchase") },
    },
    "/api/v1/admin/complaints": {
      get: {
        tags: ["engagement"],
        ...listOp(
          "List complaints/suggestions (staff projection incl. internal replies). Foundation-proposed.",
          "Complaint",
          [
            filterParam("customerId"),
            filterParam("projectId"),
            filterParam("status"),
            filterParam("kind"),
          ],
        ),
      },
      post: { tags: ["engagement"], ...plannedOp("Create complaint.", ["TBD-PO-08", "TBD-PO-03"]) },
    },
    "/api/v1/admin/complaints/{id}": {
      get: { tags: ["engagement"], ...detailOp("Get one complaint.", "Complaint") },
      patch: {
        tags: ["engagement"],
        ...plannedOp("Update/reply/resolve complaint.", ["TBD-PO-08"]),
      },
    },
  },
};
