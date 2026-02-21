export interface LoanOut {
  id: string;
  bookId: string;
  borrowerId: string;
  status: "borrowed" | "returned";
  borrowedAt: string;
  returnedAt: string | null;
  bookTitle: string;
  bookAuthor: string;
  bookCoverImageUrl: string | null;
}

export interface LoanCreate {
  bookId: string;
}

export interface LoanListResponse {
  items: LoanOut[];
  nextCursor: string | null;
}
