import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiStatusCard } from "@/features/system/ApiStatusCard";
import { WhoamiCard } from "@/features/system/WhoamiCard";

const PLACEHOLDER_STATS = [
  { label: "Assessments", value: "—" },
  { label: "Participants", value: "—" },
  { label: "Completed", value: "—" },
] as const;

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">Overview of your workspace.</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 sm:grid-cols-3">
        {PLACEHOLDER_STATS.map(({ label, value }) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-2xl">{value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Separator />

      {/* System + identity */}
      <div className="grid gap-4 sm:grid-cols-2">
        <ApiStatusCard />
        <WhoamiCard />
      </div>

      {/* Recent activity */}
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
    </div>
  );
}
