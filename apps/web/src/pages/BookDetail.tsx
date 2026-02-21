import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getBook } from "@/features/books/api";
import { type BookOut } from "@/features/books/types";

type State =
  | { status: "loading" }
  | { status: "success"; book: BookOut }
  | { status: "error"; message: string };

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const [state, setState] = useState<State>({ status: "loading" });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!id) return;
    setState({ status: "loading" });
    getBook(authedFetchRef.current, id)
      .then((book) => setState({ status: "success", book }))
      .catch((err) =>
        setState({
          status: "error",
          message: err instanceof HttpError ? err.error.message : "Failed to load book.",
        }),
      );
  }, [id]);

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" asChild>
        <Link to="/books">← Back to books</Link>
      </Button>

      {state.status === "loading" && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      )}

      {state.status === "error" && (
        <p className="text-sm text-destructive">{state.message}</p>
      )}

      {state.status === "success" && <BookCard book={state.book} />}
    </div>
  );
}

function BookCard({ book }: { book: BookOut }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex gap-5 items-start">
          {book.coverImageUrl && (
            <CoverImage url={book.coverImageUrl} title={book.title} />
          )}
          <div>
            <CardTitle className="text-2xl">{book.title}</CardTitle>
            <p className="text-muted-foreground mt-1">{book.author}</p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {book.description && <p className="text-sm leading-relaxed">{book.description}</p>}

        <Separator />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
          <Detail label="ISBN" value={book.isbn ?? "—"} />
          <Detail label="Published" value={book.publishedYear?.toString() ?? "—"} />
          <Detail
            label="Available"
            value={
              <Badge variant={book.availableCopies > 0 ? "success" : "secondary"}>
                {book.availableCopies} {book.availableCopies === 1 ? "copy" : "copies"}
              </Badge>
            }
          />
        </dl>

        <Separator />

        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs text-muted-foreground">
          <Detail label="ID" value={<span className="font-mono">{book.id}</span>} />
          <Detail label="Added" value={new Date(book.createdAt).toLocaleDateString()} />
          <Detail label="Updated" value={new Date(book.updatedAt).toLocaleDateString()} />
        </dl>
      </CardContent>
    </Card>
  );
}

function CoverImage({ url, title }: { url: string; title: string }) {
  const [broken, setBroken] = useState(false);

  if (broken) return null;

  return (
    <img
      src={url}
      alt={`Cover of ${title}`}
      className="max-w-[120px] rounded-md shadow object-cover border border-border shrink-0"
      onError={() => setBroken(true)}
    />
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground mb-0.5">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
