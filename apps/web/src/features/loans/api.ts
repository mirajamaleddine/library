import { type AuthedFetch } from "@/api/client";
import { type LoanCreate, type LoanOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const listMyLoans = (
  fetch: AuthedFetch,
  showAll = false,
  bookId?: string,
): Promise<LoanOut[]> => {
  const params = new URLSearchParams({ all: String(showAll) });
  if (bookId) params.set("bookId", bookId);
  return fetch<LoanOut[]>(`${API_BASE}/v1/loans?${params}`);
};

export const borrowBook = (fetch: AuthedFetch, data: LoanCreate): Promise<LoanOut> =>
  fetch<LoanOut>(`${API_BASE}/v1/loans`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const returnLoan = (fetch: AuthedFetch, loanId: string): Promise<LoanOut> =>
  fetch<LoanOut>(`${API_BASE}/v1/loans/${loanId}/return`, { method: "POST" });
