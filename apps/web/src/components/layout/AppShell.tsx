import { NavLink, Outlet } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/dashboard", label: "Dashboard" },
] as const;

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="font-semibold text-foreground tracking-tight">Assessment App</span>
          </NavLink>

          {/* Nav links */}
          <nav className="flex items-center gap-1" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
        <Separator />
      </header>

      {/* Page content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
