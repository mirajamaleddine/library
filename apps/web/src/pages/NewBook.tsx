import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HttpError } from "@/api/http";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { useCreateBook } from "@/features/books/hooks";
import { type BookCreate } from "@/features/books/types";

const EMPTY_FORM: BookCreate = {
  title: "",
  author: "",
  description: "",
  isbn: "",
  publishedYear: undefined,
  availableCopies: 1,
  coverImageUrl: "",
};

export function NewBook() {
  const navigate = useNavigate();

  const { permissions } = useCurrentUser();
  const canManageBooks = permissions.includes("manage_books");

  const createMutation = useCreateBook();

  const [form, setForm] = useState<BookCreate>(EMPTY_FORM);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const created = await createMutation.mutateAsync({
        ...form,
        publishedYear: form.publishedYear ?? undefined,
        coverImageUrl: form.coverImageUrl || undefined,
      });
      navigate(`/books/${created.id}`);
    } catch {
      // error is captured in createMutation.error
    }
  }

  if (!canManageBooks) {
    return (
      <div className="space-y-4">
        <h1 className="text-3xl font-bold tracking-tight">New Book</h1>
        <p className="text-sm text-muted-foreground">
          You do not have permission to create books.
        </p>
        <Link to="/books" className={buttonVariants({ variant: "outline" })}>
          Back to books
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Book</h1>
        <p className="mt-1 text-muted-foreground">Add a new book to the catalogue.</p>
      </div>

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

            {createMutation.isError && (
              <p className="text-sm text-destructive">
                {createMutation.error instanceof HttpError
                  ? createMutation.error.error.message
                  : "Failed to create book."}
              </p>
            )}
          </CardContent>
          <CardFooter className="gap-2">
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creating…" : "Create book"}
            </Button>
            <Link to="/books" className={buttonVariants({ variant: "outline" })}>
              Cancel
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
