import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";
import {
  BookOpen,
  BookX,
  Library,
  Loader2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { useAnalyticsSummary } from "./hooks";
import type { DormantBook, LowStockAlert, TrendingBook } from "./types";

// ── Stat card ─────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: boolean;
}

function StatCard({ label, value, icon, accent }: StatCardProps) {
  return (
    <Card className={cn(accent && "border-primary/40 bg-primary/5")}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

// ── Trending list ─────────────────────────────────────────────────────────────

function TrendingList({ items }: { items: TrendingBook[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No data for this period.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.bookId} className="flex items-center justify-between gap-2 text-sm">
          <div className="min-w-0">
            <p className="font-medium truncate">{b.title}</p>
            <p className="text-muted-foreground truncate">{b.author}</p>
          </div>
          <Badge variant="secondary" className="shrink-0">
            {b.borrowCount} loan{b.borrowCount !== 1 ? "s" : ""}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

// ── Low stock list ─────────────────────────────────────────────────────────────

function LowStockList({ items }: { items: LowStockAlert[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">All books are well stocked.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.bookId} className="flex items-center justify-between gap-2 text-sm">
          <div className="min-w-0">
            <p className="font-medium truncate">{b.title}</p>
            <p className="text-muted-foreground truncate">{b.author}</p>
          </div>
          <Badge variant={b.availableCopies === 0 ? "destructive" : "outline"} className="shrink-0">
            {b.availableCopies} left
          </Badge>
        </li>
      ))}
    </ul>
  );
}

// ── Dormant list ───────────────────────────────────────────────────────────────

function DormantList({ items }: { items: DormantBook[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted-foreground py-2">No dormant books.</p>;
  }
  return (
    <ul className="space-y-2">
      {items.map((b) => (
        <li key={b.bookId} className="flex items-center justify-between gap-2 text-sm">
          <div className="min-w-0">
            <p className="font-medium truncate">{b.title}</p>
            <p className="text-muted-foreground truncate">{b.author}</p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {b.lastBorrowedAt
              ? new Date(b.lastBorrowedAt).toLocaleDateString()
              : "Never"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ── AI insights box ────────────────────────────────────────────────────────────

interface AiBoxProps {
  summary: string;
  insights: string[];
  recommendedActions: string[];
}

function AiBox({ summary, insights, recommendedActions }: AiBoxProps) {
  const isConfigured = summary !== "AI insights not configured.";

  if (!isConfigured) {
    return (
      <Card className="border-dashed">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            AI insights are not configured. Add{" "}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">OPENAI_API_KEY</code>{" "}
            to your backend environment to enable this feature.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-background">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-relaxed">{summary}</p>

        {insights.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Insights
            </p>
            <ul className="space-y-1">
              {insights.map((insight, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 text-primary shrink-0">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}

        {recommendedActions.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Recommended Actions
            </p>
            <ul className="space-y-1">
              {recommendedActions.map((action, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="mt-0.5 text-primary shrink-0">→</span>
                  {action}
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────────

interface AnalyticsPanelProps {
  days?: number;
}

export function AnalyticsPanel({ days = 30 }: AnalyticsPanelProps) {
  const { data, isLoading, isError, error } = useAnalyticsSummary(days);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading analytics…
      </div>
    );
  }

  if (isError) {
    const msg =
      error instanceof Error ? error.message : "Failed to load analytics.";
    return (
      <Card className="border-destructive/40">
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">{msg}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const { metrics, ai } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Library Analytics</h2>
          <p className="text-sm text-muted-foreground">Last {data.windowDays} days</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Books"
          value={metrics.totalBooks}
          icon={<Library className="h-4 w-4" />}
        />
        <StatCard
          label="Active Loans"
          value={metrics.activeLoans}
          icon={<BookOpen className="h-4 w-4" />}
          accent={metrics.activeLoans > 0}
        />
        <StatCard
          label="Loans This Period"
          value={metrics.totalLoans}
          icon={<TrendingUp className="h-4 w-4" />}
        />
        <StatCard
          label="Available Copies"
          value={metrics.totalAvailableCopies}
          icon={<BookX className="h-4 w-4" />}
        />
      </div>

      <Separator />

      {/* Book lists */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Trending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TrendingList items={metrics.trendingBooks} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-orange-500" />
              Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <LowStockList items={metrics.lowStockAlerts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <BookX className="h-4 w-4 text-muted-foreground" />
              Dormant
            </CardTitle>
          </CardHeader>
          <CardContent>
            <DormantList items={metrics.dormantBooks} />
          </CardContent>
        </Card>
      </div>

      {/* AI insights */}
      <AiBox
        summary={ai.summary}
        insights={ai.insights}
        recommendedActions={ai.recommendedActions}
      />
    </div>
  );
}
