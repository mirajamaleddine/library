import { useQuery } from "@tanstack/react-query";
import { useFetchRef } from "@/api/client";
import { listUsers } from "./api";

export function useUsers(enabled = true) {
  const fetchRef = useFetchRef();

  return useQuery({
    queryKey: ["users"],
    queryFn: () => listUsers(fetchRef.current),
    enabled,
  });
}
