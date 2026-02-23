import { HttpError } from "@/api/http";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { useBooks } from "@/features/books/hooks";
import { type BookOut, type SortOption } from "@/features/books/types";
import { cn } from "@/lib/cn";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const SORT_LABELS: Record<SortOption, string> = {
  "createdAt:desc": "Newest first",
  "createdAt:asc": "Oldest first",
  "title:asc": "Title A–Z",
};

export function Books() {
  const { permissions } = useCurrentUser();
  const canManageBooks = permissions.includes("manage_books");

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("createdAt:desc");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const booksQuery = useBooks({
    query: debouncedQuery || undefined,
    availableOnly,
    sort,
    limit: 20,
  });

  const books = booksQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-medium tracking-tight">Explore Books</h1>
        <p className="text-muted-foreground">Browse the library catalogue</p>
      </div>

      {/* Filter toolbar */}
      <div className="flex flex-wrap items-center justify-between w-full">
        <div className="flex items-center gap-2 flex-1">
          <Input
            className="h-9 w-1/3"
            placeholder="Search title or author…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />

          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <Checkbox
              checked={availableOnly}
              onCheckedChange={(checked) => setAvailableOnly(checked === true)}
            />
            Available only
          </label>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className={cn(
              "h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm",
              "focus:outline-none focus:ring-1 focus:ring-ring",
            )}
          >
            {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        {canManageBooks && (
          <Button size="lg">
            <Link to="/books/new" className={buttonVariants()}>
              <PlusIcon /> New book
            </Link>
          </Button>
        )}
      </div>

      {/* Book list */}
      {booksQuery.isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading books…</p>
      )}
      {booksQuery.isError && (
        <p className="text-sm text-destructive">
          {booksQuery.error instanceof HttpError
            ? booksQuery.error.error.message
            : "Failed to load books."}
        </p>
      )}
      {booksQuery.isSuccess && books.length === 0 && (
        <p className="text-sm text-muted-foreground">No books found.</p>
      )}

      {books.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4 lg:grid-cols-8">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
            />
          ))}
        </div>
      )}

      {booksQuery.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => void booksQuery.fetchNextPage()}
            disabled={booksQuery.isFetchingNextPage}
          >
            {booksQuery.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

function BookCard({
  book,
}: {
  book: BookOut;
}) {
  return (
    <>
      <div className="flex flex-col gap-2">
        <BookThumbnail url={book.coverImageUrl} />
        <div className="flex flex-col">
          <Link
            to={`/books/${book.id}`}
            className="hover:underline underline-offset-2 text-sm leading-none"
          >
            {book.title}
          </Link>{" "}
          <span className="text-xs text-muted-foreground truncate">{book.author}</span>
        </div>
      </div>
    </>
  );
}

function BookThumbnail({ url }: { url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="h-40 w-32 shrink-0 rounded bg-muted flex items-center justify-center">
        <span className="text-[9px] text-muted-foreground text-center leading-tight px-1">
          No Cover
        </span>
      </div>
    );
  }
  return (
    <img
      src={url}
      alt="cover"
      className="h-40 w-32 shrink-0 rounded object-cover border border-border"
      onError={() => setBroken(true)}
    />
  );
}
