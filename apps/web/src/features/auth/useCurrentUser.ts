import { useQuery } from "@tanstack/react-query";
import { useFetchRef } from "@/api/client";
import { HttpError } from "@/api/http";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface CurrentUser {
  userId: string;
  permissions: string[];
}

export function useCurrentUser() {
  const fetchRef = useFetchRef();

  const query = useQuery({
    queryKey: ["whoami"],
    queryFn: () => fetchRef.current<CurrentUser>(`${API_BASE}/v1/whoami`),
  });

  const permissions = query.data?.permissions ?? [];
  const userId = query.data?.userId ?? null;

  return {
    isLoading: query.isLoading,
    isSuccess: query.isSuccess,
    isError: query.isError,
    errorMessage:
      query.error instanceof HttpError
        ? query.error.error.message
        : query.error
          ? "Unknown error"
          : null,
    userId,
    permissions,
    hasPermission: (permission: string) => permissions.includes(permission),
    refetch: query.refetch,
  };
}
