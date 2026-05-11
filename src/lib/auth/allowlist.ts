import { requireEnv } from "@/lib/utils";

/**
 * Returns the single email allowed to authenticate.
 * Anything else MUST be rejected at every layer (magic-link request, callback, middleware).
 */
export function getAdminEmail(): string {
  return requireEnv("ADMIN_EMAIL").trim().toLowerCase();
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase() === getAdminEmail();
}
