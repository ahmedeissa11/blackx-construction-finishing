/**
 * PREVIEW SUBMISSION ADAPTER — FRONTEND PHASE ONLY
 * -------------------------------------------------
 * This adapter gives the UI an asynchronous local-only submission boundary
 * for loading and completion states. It revalidates its input and can return
 * a validation failure, but it does NOT send, store or book anything. When a
 * real backend is connected, replace the body of these functions with an API
 * call / server action and extend the result only for real server outcomes.
 */
import {
  hasErrors,
  validateContactForm,
  validateRequestForm,
  type ContactFormValues,
  type RequestFormValues,
} from "@/lib/validation";

export type PreviewSubmissionResult =
  | { ok: true; reference: string; mode: "preview" }
  | { ok: false; reason: "validation_failed"; mode: "preview" };

function makeReference(prefix: string): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-PREVIEW-${stamp}`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function completePreviewSubmission(
  prefix: string,
  invalid: boolean,
  delayMs: number,
): Promise<PreviewSubmissionResult> {
  await delay(delayMs);
  if (invalid) return { ok: false, reason: "validation_failed", mode: "preview" };
  return { ok: true, reference: makeReference(prefix), mode: "preview" };
}

export function submitInspectionRequestPreview(
  values: RequestFormValues,
): Promise<PreviewSubmissionResult> {
  return completePreviewSubmission("RQ", hasErrors(validateRequestForm(values)), 1100);
}

export function submitContactMessagePreview(
  values: ContactFormValues,
): Promise<PreviewSubmissionResult> {
  return completePreviewSubmission("MSG", hasErrors(validateContactForm(values)), 900);
}
