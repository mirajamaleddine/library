import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/cn";

const NAV_LINKS = [
  { to: "/", label: "Home", end: true },
  { to: "/books", label: "Books", end: false },
  { to: "/dashboard", label: "Dashboard", end: false },
] as const;

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="font-semibold text-foreground tracking-tight">Shelfbase</span>
          </NavLink>

          <div className="flex items-center gap-3">
            {/* Page links */}
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

            <Separator orientation="vertical" className="h-5" />

            {/* Auth controls */}
            <SignedOut>
              <Link
                to="/sign-in"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Sign in
              </Link>
            </SignedOut>

            <SignedIn>
              {/* Clerk's UserButton renders avatar + dropdown with sign-out */}
              <UserButton />
            </SignedIn>
          </div>
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
