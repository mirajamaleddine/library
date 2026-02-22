import { useRef } from "react";
import { useAuth } from "@clerk/clerk-react";
import { apiFetch } from "./http";

/**
 * A typed fetch function that can carry an Authorization header.
 * Generic so callers specify the expected response shape: authedFetch<MyType>(url).
 */
export type AuthedFetch = <T>(url: string, init?: RequestInit) => Promise<T>;

/**
 * Hook that returns a fetch wrapper bound to the current Clerk session token.
 * Injects `Authorization: Bearer <token>` when a token is available.
 * Falls back to unauthenticated fetch when no session exists.
 *
 * Must be called inside a React component or hook (uses useAuth internally).
 */
export function useAuthedFetch(): AuthedFetch {
  const { getToken } = useAuth();

  return async function authedFetch<T>(url: string, init?: RequestInit): Promise<T> {
    const token = await getToken();
    return apiFetch<T>(url, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init?.headers,
      },
    });
  };
}

/**
 * Stable ref to the latest `AuthedFetch` — safe to call inside React Query
 * queryFn / mutationFn without stale closure issues.
 */
export function useFetchRef() {
  const f = useAuthedFetch();
  const ref = useRef(f);
  ref.current = f;
  return ref;
}
