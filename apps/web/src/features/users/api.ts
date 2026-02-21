import { type AuthedFetch } from "@/api/client";
import { type ClerkUser } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const listUsers = (fetch: AuthedFetch, limit = 100): Promise<ClerkUser[]> =>
  fetch<ClerkUser[]>(`${API_BASE}/v1/users?limit=${limit}`);
