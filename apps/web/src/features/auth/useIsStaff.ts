import { useAuth } from "@clerk/clerk-react";

/**
 * Returns true when the current session's JWT contains admin OR librarian role.
 * Both roles carry MANAGE_LOANS / MANAGE_BOOKS permissions on the backend.
 *
 * UI-only gate — the backend always re-validates the claim.
 */
export function useIsStaff(): boolean {
  const { sessionClaims } = useAuth();
  if (!sessionClaims) return false;
  const role = (sessionClaims as Record<string, unknown>).role;
  return role === "admin" || role === "librarian";
}
