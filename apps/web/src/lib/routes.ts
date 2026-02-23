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

/** Sidebar nav items (path + title), in display order. */
export const NAV_ITEMS = [
  { path: PATHS.books, title: ROUTES.books.title },
  { path: PATHS.loans, title: ROUTES.loans.title },
  { path: PATHS.dashboard, title: ROUTES.dashboard.title },
] as const;
