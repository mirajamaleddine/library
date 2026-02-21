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
import { type BookCreate, type BookOut } from "@/features/books/types";
import { useIsAdmin } from "@/features/auth/useIsAdmin";

// ── Types ─────────────────────────────────────────────────────────────────────

type ListState =
  | { status: "loading" }
  | { status: "success"; books: BookOut[] }
  | { status: "error"; message: string };

const EMPTY_FORM: BookCreate = {
  title: "",
  author: "",
  description: "",
  isbn: "",
  publishedYear: undefined,
  availableCopies: 1,
};

// ── Component ─────────────────────────────────────────────────────────────────

export function Books() {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const isAdmin = useIsAdmin();

  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [form, setForm] = useState<BookCreate>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Load books ──────────────────────────────────────────────────────────────

  async function loadBooks() {
    setListState({ status: "loading" });
    try {
      const books = await listBooks(authedFetchRef.current);
      setListState({ status: "success", books });
    } catch (err) {
      setListState({
        status: "error",
        message: err instanceof HttpError ? err.error.message : "Failed to load books.",
      });
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadBooks(); }, []);

  // ── Create ──────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setCreateError(null);
    try {
      await createBook(authedFetchRef.current, {
        ...form,
        publishedYear: form.publishedYear ?? undefined,
      });
      setForm(EMPTY_FORM);
      await loadBooks();
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
      await loadBooks();
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
      {isAdmin && (
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

              {createError && (
                <p className="text-sm text-destructive">{createError}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={creating}>
                {creating ? "Creating…" : "Create book"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      <Separator />

      {/* Book list */}
      {listState.status === "loading" && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading books…</p>
      )}

      {listState.status === "error" && (
        <p className="text-sm text-destructive">{listState.message}</p>
      )}

      {listState.status === "success" && listState.books.length === 0 && (
        <p className="text-sm text-muted-foreground">No books yet.</p>
      )}

      {listState.status === "success" && listState.books.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {listState.books.map((book) => (
            <Card key={book.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="text-base leading-snug">
                  <Link
                    to={`/books/${book.id}`}
                    className="hover:underline underline-offset-2"
                  >
                    {book.title}
                  </Link>
                </CardTitle>
                <p className="text-sm text-muted-foreground">{book.author}</p>
              </CardHeader>
              <CardContent className="flex-1 pb-2">
                <div className="flex flex-wrap gap-1">
                  {book.publishedYear && (
                    <Badge variant="outline" className="text-xs">
                      {book.publishedYear}
                    </Badge>
                  )}
                  <Badge
                    variant={book.availableCopies > 0 ? "success" : "secondary"}
                    className="text-xs"
                  >
                    {book.availableCopies} available
                  </Badge>
                </div>
              </CardContent>
              {isAdmin && (
                <CardFooter className="pt-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    disabled={deletingId === book.id}
                    onClick={() => void handleDelete(book)}
                  >
                    {deletingId === book.id ? "Deleting…" : "Delete"}
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
