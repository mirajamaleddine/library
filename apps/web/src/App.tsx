import { useEffect, useState } from "react";
import { apiFetch, HttpError } from "@/api/http";
import { cn } from "@/lib/cn";

type ApiStatus =
  | { state: "idle" }
  | { state: "loading" }
  | { state: "ok" }
  | { state: "error"; message: string };

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

export default function App() {
  const [apiStatus, setApiStatus] = useState<ApiStatus>({ state: "idle" });

  useEffect(() => {
    setApiStatus({ state: "loading" });

    apiFetch<{ status: string }>(`${API_BASE}/health`)
      .then(() => setApiStatus({ state: "ok" }))
      .catch((err) => {
        const message =
          err instanceof HttpError ? err.error.message : "Unknown error";
        setApiStatus({ state: "error", message });
      });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">
            Assessment App
          </h1>
          <p className="text-muted-foreground text-sm">
            Monorepo scaffold — React + FastAPI
          </p>
        </div>

        {/* Primary action */}
        <div className="flex justify-center">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-6 py-2.5",
              "bg-primary text-primary-foreground font-medium text-sm",
              "shadow-sm transition-opacity hover:opacity-90 focus:outline-none",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            )}
            onClick={() => window.location.reload()}
          >
            Refresh Status
          </button>
        </div>

        {/* API status */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            API Health
          </p>

          {apiStatus.state === "idle" && (
            <p className="text-sm text-muted-foreground">—</p>
          )}

          {apiStatus.state === "loading" && (
            <p className="text-sm text-muted-foreground animate-pulse">
              Checking…
            </p>
          )}

          {apiStatus.state === "ok" && (
            <p className="text-sm font-medium text-green-600">API: ok</p>
          )}

          {apiStatus.state === "error" && (
            <p className="text-sm font-medium text-destructive">
              API error: {apiStatus.message}
            </p>
          )}

          <p className="text-xs text-muted-foreground break-all">
            {API_BASE}/health
          </p>
        </div>

        {/* Quick links */}
        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <a
            href={`${API_BASE}/docs`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-2 transition-colors"
          >
            API Docs
          </a>
          <a
            href={`${API_BASE}/v1/ping`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-foreground underline underline-offset-2 transition-colors"
          >
            Ping
          </a>
        </div>
      </div>
    </div>
  );
}
