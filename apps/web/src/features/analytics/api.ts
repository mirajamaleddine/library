import { type AuthedFetch } from "@/api/client";
import { type AnalyticsSummary } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function getAnalyticsSummary(
  fetch: AuthedFetch,
  days: number,
): Promise<AnalyticsSummary> {
  return fetch<AnalyticsSummary>(
    `${API_BASE}/v1/analytics/summary?days=${days}`,
  );
}
