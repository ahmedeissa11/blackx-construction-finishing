export type RequestFormValues = {
  fullName: string;
  phone: string;
  email: string;
  service: string;
  city: string;
  area: string;
  unitType: string;
  description: string;
  consent: boolean;
};

export type RequestFormErrors = Partial<Record<keyof RequestFormValues, string>>;

const PHONE_PATTERN = /^\+?\d{8,15}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function normalizeDigits(value: string): string {
  return value
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x660))
    .replace(/[۰-۹]/g, (digit) => String(digit.charCodeAt(0) - 0x6f0));
}

function isValidPhone(value: string): boolean {
  const compact = normalizeDigits(value.trim()).replace(/[\s()-]/g, "");
  return PHONE_PATTERN.test(compact);
}

function textLength(value: string): number {
  return Array.from(value.trim()).length;
}

/**
 * Returns error *keys* (not translated strings) so the UI can localize them.
 * Keys map to entries under `validation` in the dictionary.
 */
export function validateRequestForm(values: RequestFormValues): RequestFormErrors {
  const errors: RequestFormErrors = {};

  if (!values.fullName.trim()) errors.fullName = "required";
  else if (textLength(values.fullName) < 3) errors.fullName = "nameShort";

  if (!values.phone.trim()) errors.phone = "required";
  else if (!isValidPhone(values.phone)) errors.phone = "phoneInvalid";

  if (values.email.trim() && !EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "emailInvalid";
  }

  if (!values.service) errors.service = "required";
  if (!values.city.trim()) errors.city = "required";

  if (values.area.trim()) {
    const area = Number(normalizeDigits(values.area.trim()).replace(",", "."));
    if (!Number.isFinite(area) || area <= 0) errors.area = "areaInvalid";
  }

  if (!values.description.trim()) errors.description = "required";
  else if (textLength(values.description) < 20) errors.description = "descriptionShort";

  if (!values.consent) errors.consent = "consentRequired";

  return errors;
}

export type ContactFormValues = {
  fullName: string;
  phone: string;
  subject: string;
  message: string;
  consent: boolean;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "required";
  else if (textLength(values.fullName) < 3) errors.fullName = "nameShort";
  if (!values.phone.trim()) errors.phone = "required";
  else if (!isValidPhone(values.phone)) errors.phone = "phoneInvalid";
  if (!values.subject) errors.subject = "required";
  if (!values.message.trim()) errors.message = "required";
  else if (textLength(values.message) < 10) errors.message = "messageShort";
  if (!values.consent) errors.consent = "consentRequired";
  return errors;
}

export type PortalIssueFormValues = {
  title: string;
  location: string;
  detail: string;
};

export type PortalIssueFormErrors = Partial<Record<keyof PortalIssueFormValues, string>>;

export function validatePortalIssueForm(values: PortalIssueFormValues): PortalIssueFormErrors {
  const errors: PortalIssueFormErrors = {};
  if (!values.title.trim()) errors.title = "required";
  else if (textLength(values.title) < 3) errors.title = "issueTitleShort";
  if (!values.detail.trim()) errors.detail = "required";
  else if (textLength(values.detail) < 10) errors.detail = "issueDetailsShort";
  return errors;
}

export type PortalProfileFormValues = {
  name: string;
  phone: string;
  email: string;
};

export type PortalProfileFormErrors = Partial<Record<keyof PortalProfileFormValues, string>>;

export function validatePortalProfileForm(
  values: PortalProfileFormValues,
): PortalProfileFormErrors {
  const errors: PortalProfileFormErrors = {};
  if (!values.name.trim()) errors.name = "required";
  else if (textLength(values.name) < 3) errors.name = "nameShort";
  if (!values.phone.trim()) errors.phone = "required";
  else if (!isValidPhone(values.phone)) errors.phone = "phoneInvalid";
  if (!values.email.trim()) errors.email = "required";
  else if (!EMAIL_PATTERN.test(values.email.trim())) errors.email = "emailInvalid";
  return errors;
}

export type AdminRequestAssignmentValues = {
  status: string;
  assignee: string;
};

export type AdminRequestAssignmentErrors = Partial<
  Record<keyof AdminRequestAssignmentValues, string>
>;

const ADMIN_INSPECTION_STATUSES = new Set(["inspection_scheduled", "inspection_done"]);
const ADMIN_CONSEQUENTIAL_REQUEST_STATUSES = new Set(["approved", "on_hold", "cancelled"]);

export function validateAdminRequestAssignment(
  values: AdminRequestAssignmentValues,
): AdminRequestAssignmentErrors {
  const errors: AdminRequestAssignmentErrors = {};
  if (ADMIN_INSPECTION_STATUSES.has(values.status) && !values.assignee.trim()) {
    errors.assignee = "assigneeRequired";
  }
  return errors;
}

export function requiresAdminRequestConfirmation(status: string): boolean {
  return ADMIN_CONSEQUENTIAL_REQUEST_STATUSES.has(status);
}

export function hasAdminRequestDraftChanges(values: {
  currentStatus: string;
  currentAssignee: string;
  draftStatus: string;
  draftAssignee: string;
}): boolean {
  return (
    values.currentStatus !== values.draftStatus || values.currentAssignee !== values.draftAssignee
  );
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some((v) => Boolean(v));
}
