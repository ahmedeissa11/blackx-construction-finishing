/**
 * Fake (in-memory) intake adapter — STRICT GOVERNANCE (contract §5.4).
 *
 * Development and automated tests ONLY. It implements the same ports and
 * observable semantics the colleague's real adapter must satisfy, and
 * contains no business rules (rules live in the service, which is tested
 * against this adapter and must pass unchanged against the real one).
 * `runtime.ts` refuses to construct it in production. All state lives in
 * process memory and is lost on restart — it must never be presented as
 * durable or production persistence.
 *
 * Known fake limitations (real-adapter runs must cover these):
 * - Reference-sequence counters roll back with a failed transaction;
 *   many databases do not roll back sequences. The contract requires
 *   reference *uniqueness*, not gaplessness.
 * - No cross-process sharing: rate limits/idempotency are per-process
 *   here; the real adapter backs them with shared storage (§1.9).
 */

import { randomUUID } from "node:crypto";
import type {
  AuditEntry,
  Clock,
  ContactMessageRecord,
  IdGenerator,
  IdempotencyClaim,
  IdempotencyClaimResult,
  IntakePorts,
  IntakeReceipt,
  IntakeRepositories,
  IntakeRequestRecord,
  OutboxIntent,
  Page,
  RequestHistoryEntry,
} from "./ports";
import { foldSearchText } from "./validation";

interface FakeState {
  requests: Map<string, { record: IntakeRequestRecord; history: RequestHistoryEntry[] }>;
  contactMessages: Map<string, ContactMessageRecord>;
  audit: AuditEntry[];
  outbox: OutboxIntent[];
  sequences: Map<string, number>;
}

function emptyState(): FakeState {
  return {
    requests: new Map(),
    contactMessages: new Map(),
    audit: [],
    outbox: [],
    sequences: new Map(),
  };
}

/** Provisional reference prefixes; human format is TBD-PO-11 (§1.4). */
const REFERENCE_PREFIXES: Record<string, string> = {
  request: "RQ",
  contact_message: "MSG",
};

function compareTimeThenId(
  aTime: string,
  bTime: string,
  aId: string,
  bId: string,
  direction: "asc" | "desc",
): number {
  if (aTime !== bTime) {
    const order = aTime < bTime ? -1 : 1;
    return direction === "desc" ? -order : order;
  }
  return aId < bId ? -1 : aId > bId ? 1 : 0;
}

function toPage<T>(all: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize;
  return { items: all.slice(start, start + pageSize), total: all.length, page, pageSize };
}

function matchesSearch(fields: string[], search: string | undefined): boolean {
  if (search === undefined || search === "") return true;
  const needle = foldSearchText(search);
  // Staff often paste formatted phone numbers ("100 777 6666") while the
  // stored value is separator-free; also try the compact needle so those
  // searches hit. Documented adapter search semantics (TBD-DB-04).
  const compactNeedle = needle.replace(/[\s()-]/g, "");
  const needles =
    compactNeedle !== "" && compactNeedle !== needle ? [needle, compactNeedle] : [needle];
  return fields.some((field) => {
    const folded = foldSearchText(field);
    return needles.some((candidate) => candidate !== "" && folded.includes(candidate));
  });
}

function makeRepositories(getState: () => FakeState): IntakeRepositories {
  return {
    requests: {
      async create(record, historyEntry) {
        const state = getState();
        if (state.requests.has(record.id)) {
          throw new Error(`Duplicate request id: ${record.id}`);
        }
        state.requests.set(record.id, {
          record: structuredClone(record),
          history: [structuredClone(historyEntry)],
        });
      },
      async byId(id) {
        const found = getState().requests.get(id);
        return found ? structuredClone(found) : null;
      },
      async list(query) {
        const all = [...getState().requests.values()]
          .map((entry) => entry.record)
          .filter(
            (record) =>
              (query.status === undefined || record.status === query.status) &&
              (query.serviceSlug === undefined || record.serviceSlug === query.serviceSlug) &&
              (query.assigneeId === undefined || record.assigneeId === query.assigneeId) &&
              matchesSearch(
                [record.reference, record.fullName, record.phoneE164, record.city],
                query.search,
              ),
          )
          .sort((a, b) =>
            compareTimeThenId(a.submittedAt, b.submittedAt, a.id, b.id, query.direction),
          );
        const page = toPage(all, query.page, query.pageSize);
        return { ...page, items: page.items.map((item) => structuredClone(item)) };
      },
      async count() {
        return getState().requests.size;
      },
    },
    contactMessages: {
      async create(record) {
        const state = getState();
        if (state.contactMessages.has(record.id)) {
          throw new Error(`Duplicate contact message id: ${record.id}`);
        }
        state.contactMessages.set(record.id, structuredClone(record));
      },
      async byId(id) {
        const found = getState().contactMessages.get(id);
        return found ? structuredClone(found) : null;
      },
      async list(query) {
        const fromMs = query.from !== undefined ? Date.parse(query.from) : undefined;
        const toMs = query.to !== undefined ? Date.parse(query.to) : undefined;
        const all = [...getState().contactMessages.values()]
          .filter(
            (record) =>
              (query.subject === undefined || record.subject === query.subject) &&
              (fromMs === undefined || Date.parse(record.receivedAt) >= fromMs) &&
              (toMs === undefined || Date.parse(record.receivedAt) <= toMs) &&
              matchesSearch(
                [
                  record.reference,
                  record.fullName,
                  record.phoneE164,
                  record.subject,
                  record.message,
                ],
                query.search,
              ),
          )
          .sort((a, b) =>
            compareTimeThenId(a.receivedAt, b.receivedAt, a.id, b.id, query.direction),
          );
        const page = toPage(all, query.page, query.pageSize);
        return { ...page, items: page.items.map((item) => structuredClone(item)) };
      },
      async count() {
        return getState().contactMessages.size;
      },
    },
    audit: {
      async append(entry) {
        getState().audit.push(structuredClone(entry));
      },
      async query(query) {
        const fromMs = query.from !== undefined ? Date.parse(query.from) : undefined;
        const toMs = query.to !== undefined ? Date.parse(query.to) : undefined;
        const all = getState()
          .audit.filter(
            (entry) =>
              // Public-actor entries carry no user id, so an actorId
              // filter matches nothing until staff actors exist.
              query.actorId === undefined &&
              (query.action === undefined || entry.event === query.action) &&
              (query.entityType === undefined || entry.entityType === query.entityType) &&
              (query.entityId === undefined || entry.entityId === query.entityId) &&
              (fromMs === undefined || Date.parse(entry.at) >= fromMs) &&
              (toMs === undefined || Date.parse(entry.at) <= toMs),
          )
          .sort((a, b) => compareTimeThenId(a.at, b.at, a.id, b.id, query.direction));
        const page = toPage(all, query.page, query.pageSize);
        return { ...page, items: page.items.map((entry) => structuredClone(entry)) };
      },
    },
    outbox: {
      async enqueue(intent) {
        const state = getState();
        if (state.outbox.some((row) => row.idempotencyKey === intent.idempotencyKey)) {
          throw new Error(`Duplicate outbox idempotency key: ${intent.idempotencyKey}`);
        }
        state.outbox.push(structuredClone(intent));
      },
      async listByEntity(entityType, entityId) {
        return getState()
          .outbox.filter((row) => row.entityType === entityType && row.entityId === entityId)
          .map((row) => structuredClone(row));
      },
      async list(query) {
        const all = getState()
          .outbox.filter(
            (row) =>
              (query.status === undefined || row.status === query.status) &&
              (query.channel === undefined || row.channel === query.channel) &&
              (query.eventType === undefined || row.eventType === query.eventType) &&
              (query.entityType === undefined || row.entityType === query.entityType) &&
              (query.entityId === undefined || row.entityId === query.entityId),
          )
          .sort((a, b) => compareTimeThenId(a.createdAt, b.createdAt, a.id, b.id, query.direction));
        const page = toPage(all, query.page, query.pageSize);
        return { ...page, items: page.items.map((row) => structuredClone(row)) };
      },
    },
    references: {
      async next(kind) {
        const state = getState();
        const nextValue = (state.sequences.get(kind) ?? 0) + 1;
        state.sequences.set(kind, nextValue);
        const prefix = REFERENCE_PREFIXES[kind] ?? kind.toUpperCase();
        return `${prefix}-${String(nextValue).padStart(6, "0")}`;
      },
    },
  };
}

interface IdempotencyRecord {
  payloadHash: string;
  state: "in_progress" | "completed";
  httpStatus?: number;
  receipt?: IntakeReceipt;
  leaseUntilMs: number;
  expiresAtMs?: number;
}

/** In-progress claim lease; tuning is TBD-TECH-03. */
const CLAIM_LEASE_MS = 30_000;

export interface FakeIntakeAdapter {
  ports: IntakePorts;
  /** Clears every store. Used by the contract-test harness. */
  reset(): Promise<void>;
}

export function createFakeIntakeAdapter(deps?: {
  clock?: Clock;
  ids?: IdGenerator;
}): FakeIntakeAdapter {
  const clock: Clock = deps?.clock ?? { now: () => new Date().toISOString() };
  const ids: IdGenerator = deps?.ids ?? { newId: () => randomUUID() };

  let committed = emptyState();
  const repositories = makeRepositories(() => committed);

  const idempotencyRecords = new Map<string, IdempotencyRecord>();
  const tupleKey = (claim: IdempotencyClaim): string =>
    [claim.scope, claim.method, claim.routeTemplate, claim.key].join("\u0000");

  const rateWindows = new Map<string, { startedAtMs: number; count: number }>();

  const ports: IntakePorts = {
    repositories,
    clock,
    ids,
    unitOfWork: {
      async run(work) {
        // Snapshot transaction: work mutates a deep copy; commit swaps it
        // in, any throw discards it — zero partial writes (§5.2).
        const working = structuredClone(committed);
        const result = await work(makeRepositories(() => working));
        committed = working;
        return result;
      },
    },
    idempotency: {
      async claim(scope, method, routeTemplate, key, payloadHash) {
        const claim: IdempotencyClaim = { scope, method, routeTemplate, key };
        const storeKey = tupleKey(claim);
        const nowMs = Date.parse(clock.now());
        const existing = idempotencyRecords.get(storeKey);

        if (existing) {
          const expiredCompletion =
            existing.state === "completed" &&
            existing.expiresAtMs !== undefined &&
            nowMs >= existing.expiresAtMs;
          const expiredLease = existing.state === "in_progress" && nowMs >= existing.leaseUntilMs;
          if (!expiredCompletion && !expiredLease) {
            if (existing.payloadHash !== payloadHash) {
              return { kind: "payload_mismatch" } satisfies IdempotencyClaimResult;
            }
            if (existing.state === "completed") {
              return {
                kind: "completed",
                httpStatus: existing.httpStatus as number,
                receipt: structuredClone(existing.receipt as IntakeReceipt),
              } satisfies IdempotencyClaimResult;
            }
            return {
              kind: "in_progress",
              retryAfterSec: Math.max(1, Math.ceil((existing.leaseUntilMs - nowMs) / 1000)),
            } satisfies IdempotencyClaimResult;
          }
        }

        idempotencyRecords.set(storeKey, {
          payloadHash,
          state: "in_progress",
          leaseUntilMs: nowMs + CLAIM_LEASE_MS,
        });
        return { kind: "claimed", claim } satisfies IdempotencyClaimResult;
      },
      async complete(claim, httpStatus, receipt, expiresAt) {
        const storeKey = tupleKey(claim);
        const existing = idempotencyRecords.get(storeKey);
        if (!existing || existing.state !== "in_progress") return;
        idempotencyRecords.set(storeKey, {
          payloadHash: existing.payloadHash,
          state: "completed",
          httpStatus,
          receipt: structuredClone(receipt),
          leaseUntilMs: existing.leaseUntilMs,
          expiresAtMs: Date.parse(expiresAt),
        });
      },
      async releaseRetryable(claim) {
        const storeKey = tupleKey(claim);
        const existing = idempotencyRecords.get(storeKey);
        if (existing?.state === "in_progress") {
          idempotencyRecords.delete(storeKey);
        }
      },
    },
    rateLimits: {
      async hit(key, limit, windowSec) {
        const nowMs = Date.parse(clock.now());
        const windowMs = windowSec * 1000;
        const current = rateWindows.get(key);
        if (!current || nowMs - current.startedAtMs >= windowMs) {
          rateWindows.set(key, { startedAtMs: nowMs, count: 1 });
          return { allowed: true, retryAfterSec: 0 };
        }
        if (current.count < limit) {
          current.count += 1;
          return { allowed: true, retryAfterSec: 0 };
        }
        return {
          allowed: false,
          retryAfterSec: Math.max(1, Math.ceil((current.startedAtMs + windowMs - nowMs) / 1000)),
        };
      },
    },
  };

  return {
    ports,
    async reset() {
      committed = emptyState();
      idempotencyRecords.clear();
      rateWindows.clear();
    },
  };
}
