/**
 * Strict request-body validation for foundation write endpoints.
 *
 * Implements the contract's DTO-ownership rules (§2): only fields named
 * in the input DTO are writable; unknown fields are
 * `422 fieldErrors[field]: ["unknownField"]`; server-owned fields are
 * `["readOnly"]`; they are never silently ignored (mass-assignment
 * defense). Field rules are at least as strict as the inherited UI
 * validation (Appendix A) and reuse the intake slice's phone
 * normalization so the whole API folds digits identically. No default
 * phone country is applied (TBD-PO-10).
 */

import { normalizePhone } from "@/server/intake/validation";
import { ApiError } from "./errors";

/** Server-owned everywhere: sending one is `readOnly`, never `unknownField`. */
const GLOBAL_READ_ONLY_FIELDS = new Set([
  "id",
  "reference",
  "workspaceId",
  "createdAt",
  "updatedAt",
  "createdBy",
  "updatedBy",
  "source",
  "derivedStatus",
  "progressPercent",
  "customerName",
  "phoneE164",
  "whatsappConsent",
  "portalUserIds",
]);

export type FieldSpec =
  | { kind: "string"; required?: boolean; minLength?: number; maxLength?: number; trim?: boolean }
  | { kind: "phone"; required?: boolean }
  | { kind: "email"; required?: boolean }
  | { kind: "enum"; required?: boolean; values: ReadonlySet<string> }
  | { kind: "integer"; required?: boolean; min?: number; max?: number }
  | { kind: "boolean"; required?: boolean }
  | { kind: "isoDateTime"; required?: boolean }
  | { kind: "isoDate"; required?: boolean };

export interface BodySpec {
  fields: Readonly<Record<string, FieldSpec>>;
  /** Extra server-owned fields for this DTO (beyond the global set). */
  readOnlyFields?: readonly string[];
  /** PATCH semantics: `null` clears these optional fields (contract §2). */
  nullableFields?: readonly string[];
}

const PHONE_PATTERN = /^\+?\d{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

type ErrorBag = Record<string, string[]>;

function addError(errors: ErrorBag, field: string, key: string): void {
  const existing = errors[field];
  if (existing) {
    if (!existing.includes(key)) existing.push(key);
  } else {
    errors[field] = [key];
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function textLength(value: string): number {
  return Array.from(value.trim()).length;
}

/**
 * Validates `body` against `spec` and returns the normalized writable
 * subset. Throws `ApiError("VALIDATION_FAILED")` with `fieldErrors`
 * (stable machine keys mirroring the intake validators: `required`,
 * `invalidType`, `unknownField`, `readOnly`, plus rule keys like
 * `nameShort`, `phoneInvalid`, `emailInvalid`).
 */
export function validateBody(
  body: unknown,
  spec: BodySpec,
): Record<string, string | number | boolean | null> {
  if (!isPlainObject(body)) {
    throw new ApiError("VALIDATION_FAILED", { fieldErrors: { body: ["invalidType"] } });
  }
  const errors: ErrorBag = {};
  const readOnly = new Set([...GLOBAL_READ_ONLY_FIELDS, ...(spec.readOnlyFields ?? [])]);
  const nullable = new Set(spec.nullableFields ?? []);
  const out: Record<string, string | number | boolean | null> = {};

  for (const field of Object.keys(body)) {
    if (field in spec.fields) continue;
    addError(errors, field, readOnly.has(field) ? "readOnly" : "unknownField");
  }

  for (const [field, fieldSpec] of Object.entries(spec.fields)) {
    const raw = body[field];

    if (raw === undefined) {
      if (fieldSpec.required) addError(errors, field, "required");
      continue;
    }
    if (raw === null) {
      if (nullable.has(field)) {
        out[field] = null;
      } else if (fieldSpec.required) {
        addError(errors, field, "required");
      } else {
        addError(errors, field, "invalidType");
      }
      continue;
    }

    switch (fieldSpec.kind) {
      case "string": {
        if (typeof raw !== "string") {
          addError(errors, field, "invalidType");
          break;
        }
        const value = fieldSpec.trim === false ? raw : raw.trim();
        if (fieldSpec.required && textLength(value) === 0) {
          addError(errors, field, "required");
          break;
        }
        if (fieldSpec.minLength !== undefined && textLength(value) < fieldSpec.minLength) {
          addError(errors, field, "tooShort");
          break;
        }
        if (fieldSpec.maxLength !== undefined && textLength(value) > fieldSpec.maxLength) {
          addError(errors, field, "tooLong");
          break;
        }
        out[field] = value;
        break;
      }
      case "phone": {
        if (typeof raw !== "string") {
          addError(errors, field, "invalidType");
          break;
        }
        const normalized = normalizePhone(raw);
        if (!PHONE_PATTERN.test(normalized)) {
          addError(errors, field, "phoneInvalid");
          break;
        }
        out[field] = normalized;
        break;
      }
      case "email": {
        if (typeof raw !== "string") {
          addError(errors, field, "invalidType");
          break;
        }
        // Case preserved as submitted, matching the intake validators;
        // login-email normalization is a separate auth concern.
        const value = raw.trim();
        if (!EMAIL_PATTERN.test(value)) {
          addError(errors, field, "emailInvalid");
          break;
        }
        out[field] = value;
        break;
      }
      case "enum": {
        if (typeof raw !== "string" || !fieldSpec.values.has(raw)) {
          addError(errors, field, "invalidValue");
          break;
        }
        out[field] = raw;
        break;
      }
      case "integer": {
        if (typeof raw !== "number" || !Number.isInteger(raw)) {
          addError(errors, field, "invalidType");
          break;
        }
        if (fieldSpec.min !== undefined && raw < fieldSpec.min) {
          addError(errors, field, "tooSmall");
          break;
        }
        if (fieldSpec.max !== undefined && raw > fieldSpec.max) {
          addError(errors, field, "tooLarge");
          break;
        }
        out[field] = raw;
        break;
      }
      case "boolean": {
        if (typeof raw !== "boolean") {
          addError(errors, field, "invalidType");
          break;
        }
        out[field] = raw;
        break;
      }
      case "isoDateTime": {
        if (typeof raw !== "string" || !Number.isFinite(Date.parse(raw))) {
          addError(errors, field, "invalidValue");
          break;
        }
        out[field] = new Date(raw).toISOString();
        break;
      }
      case "isoDate": {
        if (
          typeof raw !== "string" ||
          !ISO_DATE_PATTERN.test(raw) ||
          !Number.isFinite(Date.parse(raw))
        ) {
          addError(errors, field, "invalidValue");
          break;
        }
        out[field] = raw;
        break;
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    throw new ApiError("VALIDATION_FAILED", { fieldErrors: errors });
  }
  return out;
}

/** Idempotency-Key format: 16–128 printable ASCII (contract §1.8). */
export function isValidIdempotencyKey(value: string | null): value is string {
  return value !== null && /^[\x21-\x7E]{16,128}$/.test(value);
}
