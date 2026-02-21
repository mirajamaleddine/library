import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { getBook } from "@/features/books/api";
import { type BookOut } from "@/features/books/types";
import { checkoutBook, listLoans, returnLoan } from "@/features/loans/api";
import { type LoanOut } from "@/features/loans/types";
import { listUsers } from "@/features/users/api";
import { type ClerkUser } from "@/features/users/types";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { cn } from "@/lib/cn";

type BookState =
  | { status: "loading" }
  | { status: "success"; book: BookOut }
  | { status: "error"; message: string };

export function BookDetail() {
  const { id } = useParams<{ id: string }>();
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const { permissions } = useCurrentUser();
  const canManageLoans = permissions.includes("manage_loans");
  const [state, setState] = useState<BookState>({ status: "loading" });
  // Incrementing this triggers the ActiveLoansSection to re-fetch.
  const [loansKey, setLoansKey] = useState(0);

  async function loadBook() {
    if (!id) return;
    setState({ status: "loading" });
    try {
      const book = await getBook(authedFetchRef.current, id);
      setState({ status: "success", book });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof HttpError ? err.error.message : "Failed to load book.",
      });
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void loadBook(); }, [id]);

  function handleLoanChange() {
    void loadBook();            // refresh available_copies
    setLoansKey((k) => k + 1); // refresh active loans list
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
          {canManageLoans && (
            <>
              <CheckoutSection book={state.book} onSuccess={handleLoanChange} />
              <ActiveLoansSection
                bookId={state.book.id}
                loansKey={loansKey}
                onCheckIn={handleLoanChange}
              />
            </>
          )}
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

// ── Checkout section (staff only) ─────────────────────────────────────────────

type BorrowerType = "user" | "anonymous";
type CheckoutState = "idle" | "processing" | "success" | "error";

function CheckoutSection({
  book,
  onSuccess,
}: {
  book: BookOut;
  onSuccess: () => void;
}) {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const [borrowerType, setBorrowerType] = useState<BorrowerType>("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [borrowerName, setBorrowerName] = useState("");
  const [checkoutState, setCheckoutState] = useState<CheckoutState>("idle");
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Users for the dropdown
  const [users, setUsers] = useState<ClerkUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    if (borrowerType !== "user") return;
    setUsersLoading(true);
    listUsers(authedFetchRef.current)
      .then(setUsers)
      .catch(() => setUsers([]))
      .finally(() => setUsersLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [borrowerType]);

  const unavailable = book.availableCopies <= 0;
  const inputEmpty =
    borrowerType === "user" ? !selectedUserId : !borrowerName.trim();

  function handleTypeChange(t: BorrowerType) {
    setBorrowerType(t);
    setCheckoutState("idle");
    setCheckoutError(null);
    setSelectedUserId("");
    setBorrowerName("");
  }

  async function handleCheckout() {
    setCheckoutState("processing");
    setCheckoutError(null);
    try {
      await checkoutBook(authedFetchRef.current, {
        bookId: book.id,
        borrowerUserId: borrowerType === "user" ? selectedUserId : undefined,
        borrowerName: borrowerType === "anonymous" ? borrowerName.trim() : undefined,
      });
      setCheckoutState("success");
      setSelectedUserId("");
      setBorrowerName("");
      onSuccess();
    } catch (err) {
      setCheckoutState("error");
      setCheckoutError(
        err instanceof HttpError ? err.error.message : "Checkout failed.",
      );
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
        {/* Borrower type toggle */}
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

        {/* Borrower input */}
        {borrowerType === "user" ? (
          <Field label="Borrower">
            {usersLoading ? (
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
                {users.map((u) => (
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

        {/* Feedback */}
        {checkoutState === "success" && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Checked out successfully! View in{" "}
            <Link to="/loans" className="underline underline-offset-2 font-medium">
              Loans
            </Link>
            .
          </p>
        )}
        {checkoutState === "error" && checkoutError && (
          <p className="text-sm text-destructive">{checkoutError}</p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          disabled={unavailable || inputEmpty || checkoutState === "processing"}
          onClick={() => void handleCheckout()}
        >
          {checkoutState === "processing" ? "Processing…" : "Check Out"}
        </Button>
      </CardFooter>
    </Card>
  );
}

// ── Active loans section (staff only) ────────────────────────────────────────

function ActiveLoansSection({
  bookId,
  loansKey,
  onCheckIn,
}: {
  bookId: string;
  loansKey: number;
  onCheckIn: () => void;
}) {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const [loans, setLoans] = useState<LoanOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const result = await listLoans(authedFetchRef.current, {
          bookId,
          status: "borrowed",
          limit: 50,
        });
        if (!cancelled) setLoans(result.items);
      } catch {
        if (!cancelled) setError("Failed to load active loans.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId, loansKey]);

  async function handleCheckIn(loan: LoanOut) {
    if (!window.confirm(`Check in "${loan.bookTitle}" for ${loan.borrowerUserId ?? loan.borrowerName}?`)) return;
    setCheckingInId(loan.id);
    try {
      await returnLoan(authedFetchRef.current, loan.id);
      onCheckIn();
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Check-in failed.");
    } finally {
      setCheckingInId(null);
    }
  }

  // Hide the whole section if loading done and nothing is out
  if (!loading && loans.length === 0 && !error) return null;

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-base">Currently Checked Out</CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && loans.length > 0 && (
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
                    disabled={checkingInId === loan.id}
                    onClick={() => void handleCheckIn(loan)}
                  >
                    {checkingInId === loan.id ? "Returning…" : "Check In"}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
