import { useAuth } from "@clerk/clerk-react";

/**
 * Returns true when the current session's JWT contains the admin role claim.
 *
 * Requires a Clerk JWT template that injects the role into the token, e.g.:
 *   { "role": "{{user.public_metadata.role}}" }
 *
 * This is a UI-only gate — the backend always re-validates the claim.
 */
export function useIsAdmin(): boolean {
  const { sessionClaims } = useAuth();
  if (!sessionClaims) return false;
  return (sessionClaims as Record<string, unknown>).role === "admin";
}
