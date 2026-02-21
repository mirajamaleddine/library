import { useEffect, useRef, useState } from "react";
import { useAuthedFetch, type AuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface CurrentUser {
  userId: string;
  permissions: string[];
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; user: CurrentUser }
  | { status: "error"; message: string };

export function useCurrentUser() {
  const [state, setState] = useState<State>({ status: "idle" });
  const authedFetch = useAuthedFetch();
  const fetchRef = useRef<AuthedFetch>(authedFetch);
  fetchRef.current = authedFetch;

  async function refetch() {
    setState({ status: "loading" });
    try {
      const user = await fetchRef.current<CurrentUser>(`${API_BASE}/v1/whoami`);
      setState({ status: "success", user });
    } catch (err) {
      const message = err instanceof HttpError ? err.error.message : "Unknown error";
      setState({ status: "error", message });
    }
  }

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const permissions = state.status === "success" ? state.user.permissions : [];
  const userId = state.status === "success" ? state.user.userId : null;

  return {
    state,
    userId,
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    refetch,
  };
}
