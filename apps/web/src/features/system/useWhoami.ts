import { useEffect, useRef, useState } from "react";
import { useAuthedFetch, type AuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface WhoamiData {
  userId: string | null;
  email: string | null;
  claimsKeys: string[];
}

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: WhoamiData }
  | { status: "error"; message: string };

export function useWhoami() {
  const [state, setState] = useState<State>({ status: "idle" });
  const authedFetch = useAuthedFetch();

  // Keep a ref to the latest authedFetch so `refetch` (stable callback) never
  // closes over a stale version between renders.
  const fetchRef = useRef<AuthedFetch>(authedFetch);
  fetchRef.current = authedFetch;

  async function doFetch() {
    setState({ status: "loading" });
    try {
      const data = await fetchRef.current<WhoamiData>(`${API_BASE}/v1/whoami`);
      setState({ status: "success", data });
    } catch (err) {
      const message = err instanceof HttpError ? err.error.message : "Unknown error";
      setState({ status: "error", message });
    }
  }

  // Fetch once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void doFetch(); }, []);

  return { state, refetch: doFetch };
}
