import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnalyticsPanel } from "@/features/analytics/AnalyticsPanel";
import { useCurrentUser } from "@/features/auth/useCurrentUser";

export function Dashboard() {
  const { hasPermission, isLoading: authLoading } = useCurrentUser();
  const canViewAnalytics = hasPermission("view_all_loans");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your workspace.</p>
      </div>

      {/* Analytics — visible to admins and librarians only */}
      {!authLoading &&
        (canViewAnalytics ? (
          <AnalyticsPanel days={30} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
              <CardDescription>No activity yet.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Activity will appear here once features are implemented.
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
