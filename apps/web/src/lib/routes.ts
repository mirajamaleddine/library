import type { LucideIcon } from "lucide-react";
import { BookOpen, LayoutDashboard, Library } from "lucide-react";

/**
 * Single source of truth for app shell routes: paths and titles.
 * Used by App.tsx (Route paths), AppShell (breadcrumbs, sidebar nav).
 */

export const ROUTES = {
  books: {
    path: "books",
    title: "Explore books",
    nav: true,
    children: {
      new: { path: "new", title: "New book" },
      id: { path: ":id", title: "Book" },
    },
  },
  loans: {
    path: "loans",
    title: "Loans",
    nav: true,
  },
  dashboard: {
    path: "dashboard",
    title: "Dashboard",
    nav: true,
  },
} as const;

/** Absolute paths for links and redirects. */
export const PATHS = {
  home: "/",
  books: "/books",
  bookNew: "/books/new",
  bookDetail: (id: string) => `/books/${id}`,
  loans: "/loans",
  dashboard: "/dashboard",
} as const;

/** Segment -> breadcrumb title (path segment string -> label). */
export const SEGMENT_TITLES: Record<string, string> = {
  [ROUTES.books.path]: ROUTES.books.title,
  [ROUTES.books.children.new.path]: ROUTES.books.children.new.title,
  [ROUTES.loans.path]: ROUTES.loans.title,
  [ROUTES.dashboard.path]: ROUTES.dashboard.title,
};

/** Title for dynamic segments (e.g. :id UUID). */
export const DYNAMIC_SEGMENT_TITLE = ROUTES.books.children.id.title;

type NavItem = {
  path: string;
  title: string;
  icon: LucideIcon;
};

/** Sidebar nav items (path + title + icon), in display order. */
export const NAV_ITEMS: readonly NavItem[] = [
  { path: PATHS.books, title: ROUTES.books.title, icon: BookOpen },
  { path: PATHS.loans, title: ROUTES.loans.title, icon: Library },
  { path: PATHS.dashboard, title: ROUTES.dashboard.title, icon: LayoutDashboard },
] as const;
