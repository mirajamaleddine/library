import { type AuthedFetch } from "@/api/client";
import { type BookCreate, type BookOut } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export const listBooks = (fetch: AuthedFetch, skip = 0, limit = 50): Promise<BookOut[]> =>
  fetch<BookOut[]>(`${API_BASE}/v1/books?skip=${skip}&limit=${limit}`);

export const getBook = (fetch: AuthedFetch, id: string): Promise<BookOut> =>
  fetch<BookOut>(`${API_BASE}/v1/books/${id}`);

export const createBook = (fetch: AuthedFetch, data: BookCreate): Promise<BookOut> =>
  fetch<BookOut>(`${API_BASE}/v1/books`, {
    method: "POST",
    body: JSON.stringify(data),
  });

export const deleteBook = (fetch: AuthedFetch, id: string): Promise<void> =>
  fetch<void>(`${API_BASE}/v1/books/${id}`, { method: "DELETE" });
