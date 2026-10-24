/**
 * Server-side intake validation — Appendix A of the API contract.
 *
 * Mirrors (and never weakens) the semantics already enforced by
 * `src/lib/validation.ts` in the browser: V-NAME, V-PHONE, V-EMAIL,
 * V-AREA, V-DESC, V-MSG, plus strict-DTO rules from §1.1/§2 (unknown
 * fields ⇒ `unknownField`, server-owned fields ⇒ `readOnly`, never
 * silently ignored). Field-error values reuse the dictionaries' existing
 * validation keys so the UI can localize them unchanged. Clients must
 * omit empty optional fields rather than sending "".
 */

import type { ConsentInput } from "./ports";

export interface NormalizedInspectionRequest {
  fullName: string;
  phoneE164: string;
  email?: string;
  serviceSlug: string;
  city: string;
  areaM2?: number;
  unitType?: string;
  description: string;
  consent: ConsentInput;
  locale: "ar" | "en";
}

export interface NormalizedContactMessage {
  fullName: string;
  phoneE164: string;
  subject: string;
  message: string;
  consent: ConsentInput;
  locale: "ar" | "en";
}

export type ValidationOutcome<T> =
  { ok: true; value: T } | { ok: false; fieldErrors: Record<string, string[]> };

export interface IntakeAllowlists {
  serviceSlugs: ReadonlySet<string>;
  unitTypes: ReadonlySet<string>;
  subjects: ReadonlySet<string>;
}

const PHONE_PATTERN = /^\+?\d{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Server-owned fields: sending one is a `readOnly` error (§2). */
const READ_ONLY_FIELDS = new Set([
  "id",
  "reference",
  "receivedAt",
  "submittedAt",
  "createdAt",
  "updatedAt",
  "status",
  "customerId",
  "version",
  "history",
  "source",
  "phoneE164",
]);

const REQUEST_FIELDS = new Set([
  "fullName",
  "phone",
  "email",
  "serviceSlug",
  "city",
  "areaM2",
  "unitType",
  "description",
  "consent",
  "locale",
  "challengeToken",
]);

const CONTACT_FIELDS = new Set([
  "fullName",
  "phone",
  "subject",
  "message",
  "consent",
  "locale",
  "challengeToken",
]);

function foldDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));
}

/**
 * Folds Arabic-Indic/Persian digits and strips separators. Applies no
 * default country code (TBD-PO-10): a leading `+` is preserved, its
 * absence is preserved too — nothing is invented.
 */
/**
 * Search-text folding used by list adapters: case-folded, Arabic-Indic /
 * Persian digits folded to ASCII. Full Arabic search semantics (diacritic
 * folding etc.) are TBD-DB-04 and must be documented by the real adapter.
 */
export function foldSearchText(value: string): string {
  return foldDigits(value.trim().toLowerCase());
}

export function normalizePhone(value: string): string {
  return foldDigits(value.trim()).replace(/[\s()-]/g, "");
}

function textLength(value: string): number {
  return Array.from(value.trim()).length;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

type ErrorBag = Record<string, string[]>;

function addError(errors: ErrorBag, field: string, key: string): void {
  const existing = errors[field];
  if (existing) {
    if (!existing.includes(key)) existing.push(key);
  } else {
    errors[field] = [key];
  }
}

function rejectDisallowedFields(
  body: Record<string, unknown>,
  allowed: ReadonlySet<string>,
  errors: ErrorBag,
): void {
  for (const field of Object.keys(body)) {
    if (allowed.has(field)) continue;
    addError(errors, field, READ_ONLY_FIELDS.has(field) ? "readOnly" : "unknownField");
  }
}

function requiredString(
  body: Record<string, unknown>,
  field: string,
  errors: ErrorBag,
): string | undefined {
  const value = body[field];
  if (value === undefined || value === null || (typeof value === "string" && !value.trim())) {
    if (value !== undefined && value !== null && typeof value !== "string") {
      addError(errors, field, "invalidType");
    } else {
      addError(errors, field, "required");
    }
    return undefined;
  }
  if (typeof value !== "string") {
    addError(errors, field, "invalidType");
    return undefined;
  }
  return value;
}

function parseFullName(body: Record<string, unknown>, errors: ErrorBag): string | undefined {
  const raw = requiredString(body, "fullName", errors);
  if (raw === undefined) return undefined;
  if (textLength(raw) < 3) {
    addError(errors, "fullName", "nameShort");
    return undefined;
  }
  return raw.trim();
}

function parsePhone(body: Record<string, unknown>, errors: ErrorBag): string | undefined {
  const raw = requiredString(body, "phone", errors);
  if (raw === undefined) return undefined;
  const normalized = normalizePhone(raw);
  if (!PHONE_PATTERN.test(normalized)) {
    addError(errors, "phone", "phoneInvalid");
    return undefined;
  }
  return normalized;
}

function parseLocale(body: Record<string, unknown>, errors: ErrorBag): "ar" | "en" | undefined {
  const raw = requiredString(body, "locale", errors);
  if (raw === undefined) return undefined;
  if (raw !== "ar" && raw !== "en") {
    addError(errors, "locale", "invalidOption");
    return undefined;
  }
  return raw;
}

function parseConsent(body: Record<string, unknown>, errors: ErrorBag): ConsentInput | undefined {
  const raw = body.consent;
  if (raw === undefined || raw === null) {
    addError(errors, "consent", "required");
    return undefined;
  }
  if (!isPlainObject(raw)) {
    addError(errors, "consent", "invalidType");
    return undefined;
  }
  for (const field of Object.keys(raw)) {
    if (field === "contact" || field === "whatsapp") continue;
    const readOnly = field === "textVersion" || field === "capturedAt" || field === "source";
    addError(errors, `consent.${field}`, readOnly ? "readOnly" : "unknownField");
  }
  let valid = true;
  if (typeof raw.contact !== "boolean") {
    addError(errors, "consent.contact", raw.contact === undefined ? "required" : "invalidType");
    valid = false;
  } else if (raw.contact !== true) {
    addError(errors, "consent.contact", "consentRequired");
    valid = false;
  }
  if (typeof raw.whatsapp !== "boolean") {
    addError(errors, "consent.whatsapp", raw.whatsapp === undefined ? "required" : "invalidType");
    valid = false;
  }
  if (!valid) return undefined;
  return { contact: true, whatsapp: raw.whatsapp as boolean };
}

function parseChallengeToken(body: Record<string, unknown>, errors: ErrorBag): void {
  const raw = body.challengeToken;
  // Reserved for the anti-spam challenge (TBD-TECH-03): accepted in the
  // DTO now so enabling verification later is non-breaking (§1.9).
  if (raw !== undefined && typeof raw !== "string") {
    addError(errors, "challengeToken", "invalidType");
  }
}

function finish<T>(errors: ErrorBag, build: () => T): ValidationOutcome<T> {
  if (Object.keys(errors).length > 0) return { ok: false, fieldErrors: errors };
  return { ok: true, value: build() };
}

export function validateInspectionRequestInput(
  body: unknown,
  allowlists: IntakeAllowlists,
): ValidationOutcome<NormalizedInspectionRequest> {
  const errors: ErrorBag = {};
  if (!isPlainObject(body)) {
    return { ok: false, fieldErrors: { body: ["invalidType"] } };
  }
  rejectDisallowedFields(body, REQUEST_FIELDS, errors);

  const fullName = parseFullName(body, errors);
  const phoneE164 = parsePhone(body, errors);
  const locale = parseLocale(body, errors);
  const consent = parseConsent(body, errors);
  parseChallengeToken(body, errors);

  let email: string | undefined;
  if (body.email !== undefined) {
    if (typeof body.email !== "string") {
      addError(errors, "email", "invalidType");
    } else if (!EMAIL_PATTERN.test(body.email.trim())) {
      addError(errors, "email", "emailInvalid");
    } else {
      email = body.email.trim();
    }
  }

  const serviceSlug = requiredString(body, "serviceSlug", errors);
  if (serviceSlug !== undefined && !allowlists.serviceSlugs.has(serviceSlug)) {
    addError(errors, "serviceSlug", "invalidOption");
  }

  const cityRaw = requiredString(body, "city", errors);
  const city = cityRaw?.trim();

  let areaM2: number | undefined;
  if (body.areaM2 !== undefined) {
    const raw = body.areaM2;
    const parsed =
      typeof raw === "number"
        ? raw
        : typeof raw === "string"
          ? Number(foldDigits(raw.trim()).replace(",", "."))
          : Number.NaN;
    if (typeof raw !== "number" && typeof raw !== "string") {
      addError(errors, "areaM2", "invalidType");
    } else if (!Number.isFinite(parsed) || parsed <= 0) {
      addError(errors, "areaM2", "areaInvalid");
    } else {
      areaM2 = parsed;
    }
  }

  let unitType: string | undefined;
  if (body.unitType !== undefined) {
    if (typeof body.unitType !== "string") {
      addError(errors, "unitType", "invalidType");
    } else if (!allowlists.unitTypes.has(body.unitType)) {
      addError(errors, "unitType", "invalidOption");
    } else {
      unitType = body.unitType;
    }
  }

  const description = requiredString(body, "description", errors);
  if (description !== undefined && textLength(description) < 20) {
    addError(errors, "description", "descriptionShort");
  }

  return finish(errors, () => ({
    fullName: fullName as string,
    phoneE164: phoneE164 as string,
    ...(email !== undefined ? { email } : {}),
    serviceSlug: serviceSlug as string,
    city: city as string,
    ...(areaM2 !== undefined ? { areaM2 } : {}),
    ...(unitType !== undefined ? { unitType } : {}),
    description: description as string,
    consent: consent as ConsentInput,
    locale: locale as "ar" | "en",
  }));
}

export function validateContactMessageInput(
  body: unknown,
  allowlists: IntakeAllowlists,
): ValidationOutcome<NormalizedContactMessage> {
  const errors: ErrorBag = {};
  if (!isPlainObject(body)) {
    return { ok: false, fieldErrors: { body: ["invalidType"] } };
  }
  rejectDisallowedFields(body, CONTACT_FIELDS, errors);

  const fullName = parseFullName(body, errors);
  const phoneE164 = parsePhone(body, errors);
  const locale = parseLocale(body, errors);
  const consent = parseConsent(body, errors);
  parseChallengeToken(body, errors);

  const subject = requiredString(body, "subject", errors);
  if (subject !== undefined && !allowlists.subjects.has(subject)) {
    addError(errors, "subject", "invalidOption");
  }

  const message = requiredString(body, "message", errors);
  if (message !== undefined && textLength(message) < 10) {
    addError(errors, "message", "messageShort");
  }

  return finish(errors, () => ({
    fullName: fullName as string,
    phoneE164: phoneE164 as string,
    subject: subject as string,
    message: message as string,
    consent: consent as ConsentInput,
    locale: locale as "ar" | "en",
  }));
}
