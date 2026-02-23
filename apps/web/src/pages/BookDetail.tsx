import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { useBook } from "@/features/books/hooks";
import { type BookOut } from "@/features/books/types";
import { useCheckoutBook, useLoans, useReturnLoan } from "@/features/loans/hooks";
import { type LoanOut } from "@/features/loans/types";
import { useUsers } from "@/features/users/hooks";
import { cn } from "@/lib/cn";
import { ChevronLeftIcon } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

export function BookDetail() {
  const { id } = useParams<{ id: string }>();

  const { permissions } = useCurrentUser();
  const canManageLoans = permissions.includes("manage_loans");

  const bookQuery = useBook(id);

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button variant="ghost" size="sm">
          <Link to="/books">
            <ChevronLeftIcon />
          </Link>
        </Button>
        <span className="text-lg font-medium tracking-tight">Book Details</span>
      </div>

      {bookQuery.isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      )}
      {bookQuery.isError && (
        <p className="text-sm text-destructive">
          {bookQuery.error instanceof HttpError
            ? bookQuery.error.error.message
            : "Failed to load book."}
        </p>
      )}
      {bookQuery.isSuccess && (
        <>
          <BookCard book={bookQuery.data} />
          {canManageLoans && (
            <div className="flex flex-row gap-4 w-full">
              <ActiveLoansSection bookId={bookQuery.data.id} />
              <CheckoutSection book={bookQuery.data} />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function BookCard({ book }: { book: BookOut }) {
  return (
    <div className="flex flex-row gap-4 w-full">
      <div className="flex-auto">
        {book.coverImageUrl && <CoverImage url={book.coverImageUrl} title={book.title} />}
      </div>
      <div className="flex flex-col gap-4 flex-auto">
        <div className="flex flex-col">
          <span className="text-2xl font-medium tracking-tight">{book.title}</span>
          <span className="text-muted-foreground">{book.author}</span>
        </div>

        {book.description && <p className="text-sm leading-relaxed">{book.description}</p>}
      </div>
      <div className="flex shrink-0 flex-col gap-2 text-sm bg-muted p-6 w-60 rounded-md">
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
      </div>
    </div>
  );
}

type BorrowerType = "user" | "anonymous";

function CheckoutSection({ book }: { book: BookOut }) {
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");

  const usersQuery = useUsers(borrowerType === "user");
  const checkoutMutation = useCheckoutBook();

  const unavailable = book.availableCopies <= 0;
  const inputEmpty = borrowerType === "user" ? !selectedUserId : !borrowerName.trim();

  function handleTypeChange(t: BorrowerType) {
    setBorrowerType(t);
    checkoutMutation.reset();
    setSelectedUserId("");
    setBorrowerName("");
  }

  async function handleCheckout() {
    try {
      await checkoutMutation.mutateAsync({
        bookId: book.id,
        borrowerUserId: borrowerType === "user" ? selectedUserId : undefined,
        borrowerName: borrowerType === "anonymous" ? borrowerName.trim() : undefined,
      });
      setSelectedUserId("");
      setBorrowerName("");
    } catch {
      // error is captured in checkoutMutation.error
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Check Out</CardTitle>
        <p className="text-sm text-muted-foreground">
          {unavailable
            ? "No copies are currently available."
            : `${book.availableCopies} ${book.availableCopies === 1 ? "copy" : "copies"} available`}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex gap-2">
          {(["user", "anonymous"] as BorrowerType[]).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                borrowerType === t
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {t === "user" ? "Registered User" : "Anonymous"}
            </button>
          ))}
        </div>

        {borrowerType === "user" ? (
          <Field label="Borrower">
            {usersQuery.isLoading ? (
              <p className="text-sm text-muted-foreground animate-pulse">Loading users…</p>
            ) : (
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1",
                  "text-sm shadow-sm transition-colors",
                  "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                  "disabled:cursor-not-allowed disabled:opacity-50",
                )}
              >
                <option value="">Select a user…</option>
                {(usersQuery.data ?? []).map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.displayName}
                    {u.email ? ` — ${u.email}` : ""}
                  </option>
                ))}
              </select>
            )}
          </Field>
        ) : (
          <Field label="Borrower Name">
            <Input
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
              placeholder="Jane Smith"
            />
          </Field>
        )}

        {checkoutMutation.isSuccess && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Checked out successfully! View in{" "}
            <Link to="/loans" className="underline underline-offset-2 font-medium">
              Loans
            </Link>
            .
          </p>
        )}
        {checkoutMutation.isError && (
          <p className="text-sm text-destructive">
            {checkoutMutation.error instanceof HttpError
              ? checkoutMutation.error.error.message
              : "Checkout failed."}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          disabled={unavailable || inputEmpty || checkoutMutation.isPending}
          onClick={() => void handleCheckout()}
        >
          {checkoutMutation.isPending ? "Processing…" : "Check Out"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function ActiveLoansSection({ bookId }: { bookId: string }) {
  const loansQuery = useLoans({ bookId, status: "borrowed", limit: 50 });
  const returnMutation = useReturnLoan();

  const loans = loansQuery.data?.pages.flatMap((p) => p.items) ?? [];

  async function handleCheckIn(loan: LoanOut) {
    if (
      !window.confirm(
        `Check in "${loan.bookTitle}" for ${loan.borrowerUserId ?? loan.borrowerName}?`,
      )
    )
      return;
    try {
      await returnMutation.mutateAsync(loan.id);
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Check-in failed.");
    }
  }

  if (!loansQuery.isLoading && loans.length === 0 && !loansQuery.isError) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Currently Checked Out</CardTitle>
      </CardHeader>
      <CardContent>
        {loansQuery.isLoading && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        )}
        {loansQuery.isError && (
          <p className="text-sm text-destructive">Failed to load active loans.</p>
        )}
        {!loansQuery.isLoading && loans.length > 0 && (
          <ul className="space-y-2">
            {loans.map((loan, i) => (
              <li key={loan.id}>
                {i > 0 && <Separator className="mb-2" />}
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {loan.borrowerUserId ?? loan.borrowerName ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Since {new Date(loan.borrowedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={returnMutation.isPending && returnMutation.variables === loan.id}
                    onClick={() => void handleCheckIn(loan)}
                  >
                    {returnMutation.isPending && returnMutation.variables === loan.id
                      ? "Returning…"
                      : "Check In"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
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

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="font-medium text-muted-foreground mb-0.5">{label}</dt>
      <dd>{value}</dd>
    </div>
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
