import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useWhoami } from "./useWhoami";

export function WhoamiCard() {
  const { state, refetch } = useWhoami();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity (whoami)</CardTitle>
        <CardDescription>Claims returned by the backend for the current session.</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {state.status === "loading" && (
          <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
        )}

        {state.status === "error" && (
          <p className="text-sm text-destructive">{state.message}</p>
        )}

        {state.status === "success" && (
          <dl className="space-y-3 text-sm">
            <Row label="User ID" value={state.data.userId ?? "—"} />
            <Row label="Email" value={state.data.email ?? "—"} />
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-1.5">Claim keys</dt>
              <dd className="flex flex-wrap gap-1">
                {state.data.claimsKeys.map((key) => (
                  <Badge key={key} variant="secondary" className="font-mono text-xs">
                    {key}
                  </Badge>
                ))}
              </dd>
            </div>
          </dl>
        )}
      </CardContent>

      <CardFooter>
        <Button
          variant="outline"
          size="sm"
          onClick={() => void refetch()}
          disabled={state.status === "loading"}
        >
          {state.status === "loading" ? "Loading…" : "Refresh"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 font-mono text-xs break-all">{value}</dd>
    </div>
  );
}
