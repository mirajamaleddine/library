export interface BookOut {
  id: string;
  title: string;
  author: string;
  description: string | null;
  isbn: string | null;
  publishedYear: number | null;
  availableCopies: number;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BookCreate {
  title: string;
  author: string;
  description?: string;
  isbn?: string;
  publishedYear?: number;
  availableCopies?: number;
  coverImageUrl?: string;
}

export interface BookListResponse {
  items: BookOut[];
  nextCursor: string | null;
}

export type SortOption = "createdAt:desc" | "createdAt:asc" | "title:asc";
