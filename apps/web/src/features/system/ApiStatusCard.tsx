import { useEffect, useState } from "react";
import { apiFetch, HttpError } from "@/api/http";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

type Status =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok" }
  | { state: "error"; message: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export function ApiStatusCard() {
  const [status, setStatus] = useState<Status>({ state: "idle" });

  const check = () => {
    setStatus({ state: "loading" });
    apiFetch<{ status: string }>(`${API_BASE}/health`)
      .then(() => setStatus({ state: "ok" }))
      .catch((err) => {
        const message = err instanceof HttpError ? err.error.message : "Unreachable";
        setStatus({ state: "error", message });
      });
  };

  useEffect(() => {
    check();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>API Status</CardTitle>
          <StatusBadge status={status} />
        </div>
        <CardDescription>{API_BASE}/health</CardDescription>
      </CardHeader>

      {status.state === "error" && (
        <CardContent>
          <p className="text-sm text-destructive">{status.message}</p>
        </CardContent>
      )}

      <CardFooter>
        <Button variant="outline" size="sm" onClick={check} disabled={status.state === "loading"}>
          {status.state === "loading" ? "Checking…" : "Re-check"}
        </Button>
      </CardFooter>
    </Card>
  );
}

function StatusBadge({ status }: { status: Status }) {
  switch (status.state) {
    case "ok":
      return <Badge variant="success">ok</Badge>;
    case "error":
      return <Badge variant="destructive">error</Badge>;
    case "loading":
      return <Badge variant="secondary">checking</Badge>;
    default:
      return <Badge variant="outline">—</Badge>;
  }
}
