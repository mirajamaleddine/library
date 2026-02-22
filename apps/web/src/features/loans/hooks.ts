import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFetchRef } from "@/api/client";
import { checkoutBook, listLoans, returnLoan, type ListLoansParams } from "./api";
import { type LoanCreate } from "./types";
import { bookKeys } from "@/features/books/hooks";

export const loanKeys = {
  all: ["loans"] as const,
  lists: () => [...loanKeys.all, "list"] as const,
  list: (params: Omit<ListLoansParams, "cursor">) => [...loanKeys.lists(), params] as const,
};

export function useLoans(params: Omit<ListLoansParams, "cursor">) {
  const fetchRef = useFetchRef();

  return useInfiniteQuery({
    queryKey: loanKeys.list(params),
    queryFn: ({ pageParam }) =>
      listLoans(fetchRef.current, { ...params, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  });
}

export function useCheckoutBook() {
  const fetchRef = useFetchRef();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: LoanCreate) => checkoutBook(fetchRef.current, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: loanKeys.lists() });
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}

export function useReturnLoan() {
  const fetchRef = useFetchRef();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (loanId: string) => returnLoan(fetchRef.current, loanId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: loanKeys.lists() });
      void qc.invalidateQueries({ queryKey: bookKeys.all });
    },
  });
}
