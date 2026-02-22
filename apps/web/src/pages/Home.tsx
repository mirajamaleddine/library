import { Footer } from "@/components/layout/footer";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Grainient from "@/components/ui/grainient";
import { ApiStatusCard } from "@/features/system/ApiStatusCard";
import { cn } from "@/lib/cn";
import { SignedIn, SignedOut, UserButton } from "@clerk/clerk-react";
import { Link, NavLink, useNavigate } from "react-router-dom";

export function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Top nav */}
      <header className="fixed top-0 z-40 w-full">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <NavLink to="/" className="flex items-center gap-2">
            <span className="font-semibold text-white text-shadow-hero tracking-tight">
              Shelfbase
            </span>
          </NavLink>

          <div className="flex items-center gap-3">
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
      </header>

      {/* Page content */}
      <main className="flex-1">
        <div className="w-full h-[50vh] relative">
          <div className="absolute top-0 left-0 w-full h-full">
            <Grainient
              color1="#FF9FFC"
              color2="#c4a768"
              color3="#98aee1"
              timeSpeed={0.25}
              colorBalance={0}
              warpStrength={1}
              warpFrequency={5}
              warpSpeed={2}
              warpAmplitude={50}
              blendAngle={0}
              blendSoftness={0.05}
              rotationAmount={500}
              noiseScale={2}
              grainAmount={0.1}
              grainScale={2}
              grainAnimated={false}
              contrast={1.5}
              gamma={1}
              saturation={1}
              centerX={0}
              centerY={0}
              zoom={0.9}
            />
          </div>
          <div className="flex flex-col items-center justify-center h-full w-full relative gap-2">
            <h1 className="noto-serif-display !italic text-6xl font-bold text-shadow text-white">
              Your library, in order
            </h1>
            <p className="text-white text-lg text-shadow-sm">
              Organize, track, and discover your book collection
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Home</h1>
              <p className="mt-1 text-muted-foreground">Welcome to the Assessment App scaffold.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Get started</CardTitle>
                  <CardDescription>
                    This scaffold includes React Router, shadcn/ui components, Tailwind CSS, and a
                    typed API client. Add your features in{" "}
                    <code className="text-xs">src/features/</code>.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/dashboard")}>Go to Dashboard</Button>
                </CardContent>
              </Card>

              <ApiStatusCard />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
