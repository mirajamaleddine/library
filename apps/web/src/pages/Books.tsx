import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { createBook, deleteBook, listBooks } from "@/features/books/api";
import { type BookCreate, type BookOut, type SortOption } from "@/features/books/types";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM: BookCreate = {
  title: "",
  author: "",
  description: "",
  isbn: "",
  publishedYear: undefined,
  availableCopies: 1,
  coverImageUrl: "",
};

const SORT_LABELS: Record<SortOption, string> = {
  "createdAt:desc": "Newest first",
  "createdAt:asc": "Oldest first",
  "title:asc": "Title A–Z",
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Books() {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const { permissions } = useCurrentUser();
  const canManageBooks = permissions.includes("manage_books");

  // ── Filter state ────────────────────────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("createdAt:desc");

  // ── List state ──────────────────────────────────────────────────────────────
  const [books, setBooks] = useState<BookOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Create form state ───────────────────────────────────────────────────────
  const [form, setForm] = useState<BookCreate>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Debounce search input ───────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchInput.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // ── Reload list when filters change ────────────────────────────────────────
  useEffect(() => {
    async function fetchFirst() {
      setLoading(true);
      setError(null);
      try {
        const result = await listBooks(authedFetchRef.current, {
          query: debouncedQuery || undefined,
          availableOnly,
          sort,
          limit: 20,
        });
        setBooks(result.items);
        setNextCursor(result.nextCursor);
      } catch (err) {
        setError(err instanceof HttpError ? err.error.message : "Failed to load books.");
      } finally {
        setLoading(false);
      }
    }
    void fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, availableOnly, sort]);

  // ── Load more ───────────────────────────────────────────────────────────────
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await listBooks(authedFetchRef.current, {
        query: debouncedQuery || undefined,
        availableOnly,
        sort,
        limit: 20,
        cursor: nextCursor,
      });
      setBooks((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch {
      // silently ignore load-more failures
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Create ──────────────────────────────────────────────────────────────────
  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      const created = await createBook(authedFetchRef.current, {
        ...form,
        publishedYear: form.publishedYear ?? undefined,
        coverImageUrl: form.coverImageUrl || undefined,
      });
      setForm(EMPTY_FORM);
      // Optimistically prepend if on createdAt:desc, otherwise just reload.
      if (sort === "createdAt:desc") {
        setBooks((prev) => [created, ...prev]);
      } else {
        // Trigger a full reload by resetting the debounced query (no-op hack —
        // easiest way is to force the effect by toggling a counter).
        const result = await listBooks(authedFetchRef.current, {
          query: debouncedQuery || undefined,
          availableOnly,
          sort,
          limit: 20,
        });
        setBooks(result.items);
        setNextCursor(result.nextCursor);
      }
    } catch (err) {
      setCreateError(err instanceof HttpError ? err.error.message : "Failed to create book.");
    } finally {
      setCreating(false);
    }
  }

  // ── Delete ──────────────────────────────────────────────────────────────────
  async function handleDelete(book: BookOut) {
    if (!window.confirm(`Delete "${book.title}"?`)) return;
    setDeletingId(book.id);
    try {
      await deleteBook(authedFetchRef.current, book.id);
      setBooks((prev) => prev.filter((b) => b.id !== book.id));
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Failed to delete book.");
    } finally {
      setDeletingId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Books</h1>
        <p className="mt-1 text-muted-foreground">Browse the library catalogue.</p>
      </div>

      {/* Create form — admin only */}
      {canManageBooks && (
        <Card>
          <CardHeader>
            <CardTitle>Add a book</CardTitle>
          </CardHeader>
          <form onSubmit={(e) => void handleCreate(e)}>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title *">
                  <Input
                    required
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="The Name of the Wind"
                  />
                </Field>
                <Field label="Author *">
                  <Input
                    required
                    value={form.author}
                    onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
                    placeholder="Patrick Rothfuss"
                  />
                </Field>
              </div>

              <Field label="Description">
                <Textarea
                  value={form.description ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="A short description…"
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-3">
                <Field label="ISBN">
                  <Input
                    value={form.isbn ?? ""}
                    onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                    placeholder="978-0-7564-0407-1"
                  />
                </Field>
                <Field label="Published year">
                  <Input
                    type="number"
                    min={0}
                    max={new Date().getFullYear()}
                    value={form.publishedYear ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        publishedYear: e.target.value ? Number(e.target.value) : undefined,
                      }))
                    }
                    placeholder="2007"
                  />
                </Field>
                <Field label="Available copies">
                  <Input
                    type="number"
                    min={0}
                    value={form.availableCopies ?? 1}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, availableCopies: Number(e.target.value) }))
                    }
                  />
                </Field>
              </div>

              <Field label="Cover image URL">
                <Input
                  type="url"
                  value={form.coverImageUrl ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://covers.openlibrary.org/b/id/123-L.jpg"
                />
              </Field>
              {form.coverImageUrl && <CoverPreview url={form.coverImageUrl} />}

              {createError && <p className="text-sm text-destructive">{createError}</p>}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create book"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ── Filter toolbar ───────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="h-9 w-full sm:w-64"
          placeholder="Search title or author…"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
        />

        <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
          <input
            type="checkbox"
            className="h-4 w-4 rounded border border-input accent-primary cursor-pointer"
            checked={availableOnly}
            onChange={(e) => setAvailableOnly(e.target.checked)}
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

      <Separator />

      {/* ── Book list ────────────────────────────────────────────────────────── */}
      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading books…</p>
      )}
      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!loading && !error && books.length === 0 && (
        <p className="text-sm text-muted-foreground">No books found.</p>
      )}

      {books.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              canManageBooks={canManageBooks}
              deleting={deletingId === book.id}
              onDelete={() => void handleDelete(book)}
            />
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

// ── Book card ─────────────────────────────────────────────────────────────────

function BookCard({
  book,
  canManageBooks,
  deleting,
  onDelete,
}: {
  book: BookOut;
  canManageBooks: boolean;
  deleting: boolean;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex gap-3">
          <BookThumbnail url={book.coverImageUrl} />
          <div className="min-w-0">
            <CardTitle className="text-base leading-snug">
              <Link to={`/books/${book.id}`} className="hover:underline underline-offset-2">
                {book.title}
              </Link>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5 truncate">{book.author}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex flex-wrap gap-1">
          {book.publishedYear && (
            <Badge variant="outline" className="text-xs">
              {book.publishedYear}
            </Badge>
          )}
          <Badge variant={book.availableCopies > 0 ? "success" : "secondary"} className="text-xs">
            {book.availableCopies} available
          </Badge>
        </div>
      </CardContent>
      {canManageBooks && (
        <CardFooter className="pt-0">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            disabled={deleting}
            onClick={onDelete}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

// ── Image helpers ─────────────────────────────────────────────────────────────

function BookThumbnail({ url }: { url: string | null }) {
  const [broken, setBroken] = useState(false);
  if (!url || broken) {
    return (
      <div className="h-16 w-12 shrink-0 rounded bg-muted flex items-center justify-center">
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
      className="h-16 w-12 shrink-0 rounded object-cover border border-border"
      onError={() => setBroken(true)}
    />
  );
}

function CoverPreview({ url }: { url: string }) {
  const [broken, setBroken] = useState(false);
  const prevUrl = useRef(url);
  if (prevUrl.current !== url) {
    prevUrl.current = url;
    setBroken(false);
  }
  if (broken) {
    return <p className="text-xs text-muted-foreground">Image failed to load — check the URL.</p>;
  }
  return (
    <img
      src={url}
      alt="cover preview"
      className="max-h-40 rounded-md shadow-sm border border-border object-cover"
      onError={() => setBroken(true)}
    />
  );
}

// ── Field wrapper ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
