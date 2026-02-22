import { Outlet } from "react-router-dom";

export function LoggedInAppShell() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Page content */}
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
