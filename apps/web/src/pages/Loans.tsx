import { useState } from "react";
import { Link } from "react-router-dom";
import { HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCurrentUser } from "@/features/auth/useCurrentUser";
import { useLoans, useReturnLoan } from "@/features/loans/hooks";
import { type LoanOut } from "@/features/loans/types";
import { cn } from "@/lib/cn";

type StatusFilter = "all" | "borrowed" | "returned";

const STATUS_LABELS: Record<StatusFilter, string> = {
  all: "All",
  borrowed: "Checked Out",
  returned: "Returned",
};

export function Loans() {
  const { permissions } = useCurrentUser();
  const canManageLoans = permissions.includes("manage_loans");
  const canViewAllLoans = permissions.includes("view_all_loans");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const loansQuery = useLoans({
    status: statusFilter === "all" ? undefined : statusFilter,
    limit: 20,
  });

  const returnMutation = useReturnLoan();

  const loans = loansQuery.data?.pages.flatMap((p) => p.items) ?? [];

  async function handleReturn(loan: LoanOut) {
    if (!window.confirm(`Return "${loan.bookTitle}"?`)) return;
    try {
      await returnMutation.mutateAsync(loan.id);
    } catch (err) {
      alert(err instanceof HttpError ? err.error.message : "Failed to return loan.");
    }
  }

  const pageTitle = canViewAllLoans ? "All Loans" : "My Loans";
  const pageDescription = canViewAllLoans
    ? "All active and returned loans."
    : "Books currently checked out to you.";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
        <p className="mt-1 text-muted-foreground">{pageDescription}</p>
      </div>

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

      {loansQuery.isLoading && (
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      )}
      {loansQuery.isError && (
        <p className="text-sm text-destructive">
          {loansQuery.error instanceof HttpError
            ? loansQuery.error.error.message
            : "Failed to load loans."}
        </p>
      )}
      {loansQuery.isSuccess && loans.length === 0 && (
        <p className="text-sm text-muted-foreground">No loans found.</p>
      )}

      {loans.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2">
          {loans.map((loan) => (
            <LoanCard
              key={loan.id}
              loan={loan}
              showBorrower={canViewAllLoans}
              returning={returnMutation.isPending && returnMutation.variables === loan.id}
              onReturn={
                canManageLoans && loan.status === "borrowed"
                  ? () => void handleReturn(loan)
                  : undefined
              }
            />
          ))}
        </div>
      )}

      {loansQuery.hasNextPage && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => void loansQuery.fetchNextPage()}
            disabled={loansQuery.isFetchingNextPage}
          >
            {loansQuery.isFetchingNextPage ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}

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

  const borrowerLabel = loan.borrowerUserId
    ? loan.borrowerUserId
    : (loan.borrowerName ?? "—");

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
          <span>Checked out {new Date(loan.borrowedAt).toLocaleDateString()}</span>
          {loan.returnedAt && (
            <span>· Returned {new Date(loan.returnedAt).toLocaleDateString()}</span>
          )}
        </div>

        {showBorrower && (
          <p className="text-xs text-muted-foreground truncate">
            <span className="font-medium">Borrower:</span>{" "}
            <span className="font-mono">{borrowerLabel}</span>
          </p>
        )}

        <div className="flex items-center justify-between gap-2 pt-1">
          <Badge
            variant={loan.status === "borrowed" ? "default" : "secondary"}
            className="text-xs"
          >
            {loan.status === "borrowed" ? "Checked Out" : "Returned"}
          </Badge>
          {onReturn && (
            <Button size="sm" variant="outline" disabled={returning} onClick={onReturn}>
              {returning ? "Returning…" : "Check In"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
