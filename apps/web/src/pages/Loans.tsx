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

type ListState =
  | { status: "loading" }
  | { status: "success"; loans: LoanOut[] }
  | { status: "error"; message: string };

export function Loans() {
  const authedFetch = useAuthedFetch();
  const authedFetchRef = useRef(authedFetch);
  authedFetchRef.current = authedFetch;

  const isAdmin = useIsAdmin();
  const [showAll, setShowAll] = useState(false);
  const [listState, setListState] = useState<ListState>({ status: "loading" });
  const [returningId, setReturningId] = useState<string | null>(null);

  async function load(all: boolean) {
    setListState({ status: "loading" });
    try {
      const loans = await listMyLoans(authedFetchRef.current, all);
      setListState({ status: "success", loans });
    } catch (err) {
      setListState({
        status: "error",
        message: err instanceof HttpError ? err.error.message : "Failed to load loans.",
      });
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { void load(showAll); }, [showAll]);

  async function handleReturn(loan: LoanOut) {
    if (!window.confirm(`Return "${loan.bookTitle}"?`)) return;
    setReturningId(loan.id);
    try {
      await returnLoan(authedFetchRef.current, loan.id);
      await load(showAll);
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Failed to return loan.");
    } finally {
      setReturningId(null);
    }
  }

  const activeLoans =
    listState.status === "success"
      ? listState.loans.filter((l) => l.status === "borrowed")
      : [];
  const returnedLoans =
    listState.status === "success"
      ? listState.loans.filter((l) => l.status === "returned")
      : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Loans</h1>
          <p className="mt-1 text-muted-foreground">Books you have borrowed.</p>
        </div>
        {isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAll((v) => !v)}
          >
            {showAll ? "Show my loans" : "Show all loans"}
          </Button>
        )}
      </div>

      {listState.status === "loading" && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      )}
      {listState.status === "error" && (
        <p className="text-sm text-destructive">{listState.message}</p>
      )}

      {listState.status === "success" && (
        <>
          {/* Active loans */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold">
              Active{" "}
              {activeLoans.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs font-normal">
                  {activeLoans.length}
                </Badge>
              )}
            </h2>

            {activeLoans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active loans.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {activeLoans.map((loan) => (
                  <LoanCard
                    key={loan.id}
                    loan={loan}
                    showBorrower={showAll}
                    action={
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={returningId === loan.id}
                        onClick={() => void handleReturn(loan)}
                      >
                        {returningId === loan.id ? "Returning…" : "Return"}
                      </Button>
                    }
                  />
                ))}
              </div>
            )}
          </section>

          <Separator />

          {/* Returned loans */}
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-muted-foreground">
              Returned{" "}
              {returnedLoans.length > 0 && (
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {returnedLoans.length}
                </Badge>
              )}
            </h2>

            {returnedLoans.length === 0 ? (
              <p className="text-sm text-muted-foreground">No returned loans yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {returnedLoans.map((loan) => (
                  <LoanCard key={loan.id} loan={loan} showBorrower={showAll} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

// ── Loan card ─────────────────────────────────────────────────────────────────

function LoanCard({
  loan,
  showBorrower,
  action,
}: {
  loan: LoanOut;
  showBorrower: boolean;
  action?: React.ReactNode;
}) {
  const [imgBroken, setImgBroken] = useState(false);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex gap-3">
          {/* Cover thumbnail */}
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
          <Badge variant={loan.status === "borrowed" ? "default" : "secondary"} className="text-xs">
            {loan.status}
          </Badge>
          {action}
        </div>
      </CardContent>
    </Card>
  );
}
