import { type AuthedFetch } from "@/api/client";
import { type LoanCreate, type LoanListResponse, type LoanOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface ListLoansParams {
  showAll?: boolean;
  bookId?: string;
  status?: "borrowed" | "returned";
  limit?: number;
  cursor?: string;
}

export const listMyLoans = (
  fetch: AuthedFetch,
  params: ListLoansParams = {},
): Promise<LoanListResponse> => {
  const p = new URLSearchParams();
  if (params.showAll) p.set("all", "true");
  if (params.bookId) p.set("bookId", params.bookId);
  if (params.status) p.set("status", params.status);
  if (params.limit != null) p.set("limit", String(params.limit));
  if (params.cursor) p.set("cursor", params.cursor);
  return fetch<LoanListResponse>(`${API_BASE}/v1/loans?${p}`);
};

export const borrowBook = (fetch: AuthedFetch, data: LoanCreate): Promise<LoanOut> =>
  fetch<LoanOut>(`${API_BASE}/v1/loans`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const returnLoan = (fetch: AuthedFetch, loanId: string): Promise<LoanOut> =>
  fetch<LoanOut>(`${API_BASE}/v1/loans/${loanId}/return`, { method: "POST" });
