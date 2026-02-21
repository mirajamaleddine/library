export interface LoanOut {
  id: string;
  bookId: string;
  borrowerUserId: string | null;
  borrowerName: string | null;
  processedByAdminId: string;
  status: "borrowed" | "returned";
  borrowedAt: string;
  returnedAt: string | null;
  bookTitle: string;
  bookAuthor: string;
  bookCoverImageUrl: string | null;
}

export interface LoanCreate {
  bookId: string;
  borrowerUserId?: string;
  borrowerName?: string;
}

export interface LoanListResponse {
  items: LoanOut[];
  nextCursor: string | null;
}
