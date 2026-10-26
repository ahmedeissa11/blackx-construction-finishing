import type { PreviewUser } from "@/content/erp-identity-preview";
export type PreviewUserInput = Pick<PreviewUser, "login" | "email"> & { name: string };
/** A deliberately synthetic namespace, NOT a real provisioning/password policy. */
export function previewUserIssues(
  input: PreviewUserInput,
  users: readonly PreviewUser[],
  editingId?: string,
): (keyof PreviewUserInput)[] {
  const errors: (keyof PreviewUserInput)[] = [];
  const name = input.name.trim(),
    login = input.login.trim(),
    email = input.email.trim();
  if (name.length < 2 || name.length > 80) errors.push("name");
  if (
    !/^preview\.[a-z0-9][a-z0-9._-]{1,61}$/i.test(login) ||
    users.some((u) => u.id !== editingId && u.login.toLowerCase() === login.toLowerCase())
  )
    errors.push("login");
  if (
    !/^[a-z0-9][a-z0-9._+-]{0,63}@example\.invalid$/i.test(email) ||
    users.some((u) => u.id !== editingId && u.email.toLowerCase() === email.toLowerCase())
  )
    errors.push("email");
  return errors;
}
