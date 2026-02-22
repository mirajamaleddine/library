import { AppShell } from "@/components/layout/AppShell";
import { PATHS, ROUTES } from "@/lib/routes";
import { BookDetail } from "@/pages/BookDetail";
import { Books } from "@/pages/Books";
import { Dashboard } from "@/pages/Dashboard";
import { Home } from "@/pages/Home";
import { Loans } from "@/pages/Loans";
import { NewBook } from "@/pages/NewBook";
import { Settings } from "@/pages/Settings";
import { SignIn, SignUp, useAuth } from "@clerk/clerk-react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

/** Protects the app shell without remount flicker on sub-route navigation. */
function ProtectedShellRoute() {
  const { isLoaded, isSignedIn } = useAuth();

  // Prevent redirect/render jitter while Clerk is hydrating auth state.
  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Navigate to="/home" replace />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Clerk auth pages — outside the app shell */}
        <Route
          path="/sign-in/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <SignIn routing="path" path="/sign-in" />
            </div>
          }
        />
        <Route
          path="/sign-up/*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <SignUp routing="path" path="/sign-up" />
            </div>
          }
        />
        <Route path="/home" element={<Home />} />
        {/* App shell routes — paths from @/lib/routes */}
        <Route path="/" element={<ProtectedShellRoute />}>
          <Route index element={<Books />} />
          <Route path={ROUTES.books.path}>
            <Route index element={<Books />} />
            <Route path={ROUTES.books.children.id.path} element={<BookDetail />} />
            <Route path={ROUTES.books.children.new.path} element={<NewBook />} />
          </Route>
          <Route path={ROUTES.loans.path} element={<Loans />} />
          <Route path={ROUTES.dashboard.path} element={<Dashboard />} />
          <Route path={ROUTES.settings.path} element={<Settings />} />
          <Route path="*" element={<Navigate to={PATHS.home} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
