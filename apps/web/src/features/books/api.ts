import { type AuthedFetch } from "@/api/client";
import { type BookCreate, type BookListResponse, type BookOut, type SortOption } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export interface ListBooksParams {
  query?: string;
  author?: string;
  availableOnly?: boolean;
  sort?: SortOption;
  limit?: number;
  cursor?: string;
}

export const listBooks = (
  fetch: AuthedFetch,
  params: ListBooksParams = {},
): Promise<BookListResponse> => {
  const p = new URLSearchParams();
  if (params.query) p.set("query", params.query);
  if (params.author) p.set("author", params.author);
  if (params.availableOnly) p.set("availableOnly", "true");
  if (params.sort) p.set("sort", params.sort);
  if (params.limit != null) p.set("limit", String(params.limit));
  if (params.cursor) p.set("cursor", params.cursor);
  return fetch<BookListResponse>(`${API_BASE}/v1/books?${p}`);
};

export const getBook = (fetch: AuthedFetch, id: string): Promise<BookOut> =>
  fetch<BookOut>(`${API_BASE}/v1/books/${id}`);

export const createBook = (fetch: AuthedFetch, data: BookCreate): Promise<BookOut> =>
  fetch<BookOut>(`${API_BASE}/v1/books`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteBook = (fetch: AuthedFetch, id: string): Promise<void> =>
  fetch<void>(`${API_BASE}/v1/books/${id}`, { method: "DELETE" });
