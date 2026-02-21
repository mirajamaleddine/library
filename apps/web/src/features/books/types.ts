export interface BookOut {
  id: string;
  title: string;
  author: string;
  description: string | null;
  isbn: string | null;
  publishedYear: number | null;
  availableCopies: number;
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
}
