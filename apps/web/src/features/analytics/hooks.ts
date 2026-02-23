import { useQuery } from "@tanstack/react-query";
import { useFetchRef } from "@/api/client";
import { getAnalyticsSummary } from "./api";

export const analyticsKeys = {
  all: ["analytics"] as const,
  summary: (days: number) => [...analyticsKeys.all, "summary", days] as const,
};

export function useAnalyticsSummary(days = 30) {
  const fetchRef = useFetchRef();

  return useQuery({
    queryKey: analyticsKeys.summary(days),
    queryFn: () => getAnalyticsSummary(fetchRef.current, days),
    staleTime: 60_000,
  });
}
