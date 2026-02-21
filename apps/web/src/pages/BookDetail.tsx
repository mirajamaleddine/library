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
import { borrowBook, listMyLoans } from "@/features/loans/api";

type BookState =
  | { status: "loading" }
  | { status: "success"; book: BookOut }
  | { status: "error"; message: string };

type BorrowState =
  | "checking"         // initial load — checking if already borrowed
  | "idle"             // ready to borrow
  | "already_borrowed" // user has an active loan for this book
  | "borrowing"        // request in flight
  | "success"          // just borrowed
  | "error";           // request failed

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const [state, setState] = useState<BookState>({ status: "loading" });
  const [borrowState, setBorrowState] = useState<BorrowState>("checking");
  const [borrowError, setBorrowError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setState({ status: "loading" });
    setBorrowState("checking");
    try {
      // Fetch book details and active loans for this book in parallel.
      const [book, myLoansForBook] = await Promise.all([
        getBook(authedFetchRef.current, id),
        listMyLoans(authedFetchRef.current, false, id),
      ]);
      setState({ status: "success", book });
      const hasActiveLoan = myLoansForBook.some((l) => l.status === "borrowed");
      setBorrowState(hasActiveLoan ? "already_borrowed" : "idle");
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof HttpError ? err.error.message : "Failed to load book.",
      });
      setBorrowState("idle");
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(); }, [id]);

  async function handleBorrow() {
    if (!id) return;
    setBorrowState("borrowing");
    setBorrowError(null);
    try {
      await borrowBook(authedFetchRef.current, { bookId: id });
      // Refresh everything so available_copies and borrow state are consistent.
      await load();
      // Override borrow state to show the success message.
      setBorrowState("success");
    } catch (err) {
      const message = err instanceof HttpError ? err.error.message : "Failed to borrow book.";
      // Gracefully handle the already-borrowed case even if the page check missed it.
      if (err instanceof HttpError && err.error.code === "ALREADY_BORROWED") {
        setBorrowState("already_borrowed");
      } else {
        setBorrowState("error");
        setBorrowError(message);
      }
    }
  }

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
      {state.status === "success" && (
        <>
          <BookCard book={state.book} />
          <BorrowSection
            book={state.book}
            borrowState={borrowState}
            borrowError={borrowError}
            onBorrow={() => void handleBorrow()}
          />
        </>
      )}
    </div>
  );
}

// ── Book detail card ──────────────────────────────────────────────────────────

function BookCard({ book }: { book: BookOut }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <div className="flex gap-5 items-start">
          {book.coverImageUrl && <CoverImage url={book.coverImageUrl} title={book.title} />}
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

// ── Borrow section ────────────────────────────────────────────────────────────

function BorrowSection({
  book,
  borrowState,
  borrowError,
  onBorrow,
}: {
  book: BookOut;
  borrowState: BorrowState;
  borrowError: string | null;
  onBorrow: () => void;
}) {
  const unavailable = book.availableCopies <= 0;
  const alreadyBorrowed = borrowState === "already_borrowed";
  const isChecking = borrowState === "checking";

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-medium">Borrow this book</p>
          <p className="text-sm text-muted-foreground">
            {alreadyBorrowed
              ? "You already have this book on loan."
              : unavailable
              ? "No copies are currently available."
              : `${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"} available`}
          </p>
        </div>

        <Button
          disabled={unavailable || alreadyBorrowed || isChecking || borrowState === "borrowing"}
          onClick={onBorrow}
          variant={alreadyBorrowed ? "secondary" : "default"}
        >
          {borrowState === "borrowing"
            ? "Borrowing…"
            : isChecking
            ? "Loading…"
            : alreadyBorrowed
            ? "Already borrowed"
            : "Borrow"}
        </Button>
      </CardContent>

      {borrowState === "success" && (
        <CardContent className="pt-0">
          <p className="text-sm text-green-600 dark:text-green-400">
            Borrowed successfully! Find it in{" "}
            <Link to="/loans" className="underline underline-offset-2 font-medium">
              My Loans
            </Link>
            .
          </p>
        </CardContent>
      )}
      {alreadyBorrowed && (
        <CardContent className="pt-0">
          <p className="text-sm text-muted-foreground">
            Return it first from{" "}
            <Link to="/loans" className="underline underline-offset-2 font-medium">
              My Loans
            </Link>{" "}
            before borrowing again.
          </p>
        </CardContent>
      )}
      {borrowState === "error" && borrowError && (
        <CardContent className="pt-0">
          <p className="text-sm text-destructive">{borrowError}</p>
        </CardContent>
      )}
    </Card>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground mb-0.5">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
