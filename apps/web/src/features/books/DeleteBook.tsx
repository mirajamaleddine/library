import { HttpError } from "@/api/http";
import { Button } from "@/components/ui/button";
import { PATHS } from "@/lib/routes";
import { useDeleteBook } from "@/features/books/hooks";
import type { BookOut } from "@/features/books/types";
import { useNavigate } from "react-router-dom";

interface DeleteBookProps {
  book: BookOut;
}

export function DeleteBook({ book }: DeleteBookProps) {
  const navigate = useNavigate();
  const deleteMutation = useDeleteBook();

  async function handleDelete() {
    if (!window.confirm(`Delete "${book.title}"? This cannot be undone.`)) return;

    try {
      await deleteMutation.mutateAsync(book.id);
      navigate(PATHS.books);
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Failed to delete book.");
    }
  }

  return (
    <Button
      variant="destructive"
      size="sm"
      onClick={() => void handleDelete()}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? "Deleting…" : "Delete book"}
    </Button>
  );
}

