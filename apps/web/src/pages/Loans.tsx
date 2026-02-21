import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAuthedFetch } from "@/api/client";
import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { listMyLoans, returnLoan } from "@/features/loans/api";
import { type LoanOut } from "@/features/loans/types";
import { useIsAdmin } from "@/features/auth/useIsAdmin";
import { cn } from "@/lib/cn";

type StatusFilter = "all" | "borrowed" | "returned";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  borrowed: "Borrowed",
  returned: "Returned",
};

export function Loans() {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const isAdmin = useIsAdmin();

  // ── Filter state ────────────────────────────────────────────────────────────
  const [showAll, setShowAll] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  // ── List state ──────────────────────────────────────────────────────────────
  const [loans, setLoans] = useState<LoanOut[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returningId, setReturningId] = useState<string | null>(null);

  // ── Load first page ─────────────────────────────────────────────────────────
  useEffect(() => {
    async function fetchFirst() {
      setLoading(true);
      setError(null);
      setLoans([]);
      setNextCursor(null);
      try {
        const result = await listMyLoans(authedFetchRef.current, {
          showAll,
          status: statusFilter === "all" ? undefined : statusFilter,
          limit: 20,
        });
        setLoans(result.items);
        setNextCursor(result.nextCursor);
      } catch (err) {
        setError(err instanceof HttpError ? err.error.message : "Failed to load loans.");
      } finally {
        setLoading(false);
      }
    }
    void fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, statusFilter]);

  // ── Load more ───────────────────────────────────────────────────────────────
  async function loadMore() {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const result = await listMyLoans(authedFetchRef.current, {
        showAll,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 20,
        cursor: nextCursor,
      });
      setLoans((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch {
      // silently ignore
    } finally {
      setLoadingMore(false);
    }
  }

  // ── Return a loan ───────────────────────────────────────────────────────────
  async function handleReturn(loan: LoanOut) {
    if (!window.confirm(`Return "${loan.bookTitle}"?`)) return;
    setReturningId(loan.id);
    try {
      await returnLoan(authedFetchRef.current, loan.id);
      // Reload page 1 so available_copies reflect correctly.
      const result = await listMyLoans(authedFetchRef.current, {
        showAll,
        status: statusFilter === "all" ? undefined : statusFilter,
        limit: 20,
      });
      setLoans(result.items);
      setNextCursor(result.nextCursor);
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Failed to return loan.");
    } finally {
      setReturningId(null);
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
          <p className="mt-1 text-muted-foreground">Books you have borrowed.</p>
        </div>
        {isAdmin && (
          <Button variant="outline" size="sm" onClick={() => setShowAll((v) => !v)}>
            {showAll ? "Show my loans" : "Show all loans"}
          </Button>
        )}
      </div>

      {/* Status filter buttons */}
      <div className="flex gap-1.5">
        {(Object.entries(STATUS_LABELS) as [StatusFilter, string][]).map(([value, label]) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={cn(
              "rounded-full px-3 py-1 text-sm font-medium transition-colors",
              statusFilter === value
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <Separator />

      {/* List */}
      {loading && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      )}
      {!loading && error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      {!loading && !error && loans.length === 0 && (
        <p className="text-sm text-muted-foreground">No loans found.</p>
      )}

      {loans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showBorrower={showAll}
              returning={returningId === loan.id}
              onReturn={loan.status === "borrowed" ? () => void handleReturn(loan) : undefined}
            />
          ))}
        </div>
      )}

      {/* Load more */}
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

// ── Loan card ─────────────────────────────────────────────────────────────────

function LoanCard({
  loan,
  showBorrower,
  returning,
  onReturn,
}: {
  loan: LoanOut;
  showBorrower: boolean;
  returning: boolean;
  onReturn?: () => void;
}) {
  const [imgBroken, setImgBroken] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-3">
          {loan.bookCoverImageUrl && !imgBroken ? (
            <img
              src={loan.bookCoverImageUrl}
              alt="cover"
              className="h-16 w-12 shrink-0 rounded object-cover border border-border"
              onError={() => setImgBroken(true)}
            />
          ) : (
            <div className="h-16 w-12 shrink-0 rounded bg-muted flex items-center justify-center">
              <span className="text-[9px] text-muted-foreground text-center leading-tight px-1">
                No Cover
              </span>
            </div>
          )}
          <div className="min-w-0">
            <CardTitle className="text-sm font-semibold leading-snug">
              <Link
                to={`/books/${loan.bookId}`}
                className="hover:underline underline-offset-2"
              >
                {loan.bookTitle}
              </Link>
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{loan.bookAuthor}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span>Borrowed {new Date(loan.borrowedAt).toLocaleDateString()}</span>
          {loan.returnedAt && (
            <span>· Returned {new Date(loan.returnedAt).toLocaleDateString()}</span>
          )}
        </div>
        {showBorrower && (
          <p className="text-xs font-mono text-muted-foreground truncate">{loan.borrowerId}</p>
        )}
        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge
            variant={loan.status === "borrowed" ? "default" : "secondary"}
            className="text-xs"
          >
            {loan.status}
          </Badge>
          {onReturn && (
            <Button size="sm" variant="outline" disabled={returning} onClick={onReturn}>
              {returning ? "Returning…" : "Return"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
