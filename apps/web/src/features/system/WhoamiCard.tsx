import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCurrentUser } from "@/features/auth/useCurrentUser";

export function WhoamiCard() {
  const { state, userId, permissions, refetch } = useCurrentUser();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity (whoami)</CardTitle>
        <CardDescription>
          User and permissions returned by the backend for the current session.
        </CardDescription>
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
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-0.5">User ID</dt>
              <dd className="font-mono text-xs break-all">{userId ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground mb-1.5">Permissions</dt>
              <dd className="flex flex-wrap gap-1">
                {permissions.length === 0 ? (
                  <span className="text-muted-foreground text-xs">None</span>
                ) : (
                  permissions.map((p) => (
                    <Badge key={p} variant="secondary" className="font-mono text-xs">
                      {p}
                    </Badge>
                  ))
                )}
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
