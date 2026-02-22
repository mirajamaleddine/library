import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFetchRef } from "@/api/client";
import { createBook, deleteBook, getBook, listBooks, type ListBooksParams } from "./api";
import { type BookCreate } from "./types";

export const bookKeys = {
  all: ["books"] as const,
  lists: () => [...bookKeys.all, "list"] as const,
  list: (params: Omit<ListBooksParams, "cursor">) => [...bookKeys.lists(), params] as const,
  details: () => [...bookKeys.all, "detail"] as const,
  detail: (id: string) => [...bookKeys.details(), id] as const,
};

export function useBooks(params: Omit<ListBooksParams, "cursor">) {
  const fetchRef = useFetchRef();

  return useInfiniteQuery({
    queryKey: bookKeys.list(params),
    queryFn: ({ pageParam }) =>
      listBooks(fetchRef.current, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useBook(id: string | undefined) {
  const fetchRef = useFetchRef();

  return useQuery({
    queryKey: bookKeys.detail(id!),
    queryFn: () => getBook(fetchRef.current, id!),
    enabled: !!id,
  });
}

export function useCreateBook() {
  const fetchRef = useFetchRef();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: BookCreate) => createBook(fetchRef.current, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}

export function useDeleteBook() {
  const fetchRef = useFetchRef();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteBook(fetchRef.current, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: bookKeys.lists() });
    },
  });
}
