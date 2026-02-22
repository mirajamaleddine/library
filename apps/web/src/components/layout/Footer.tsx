export function Footer() {
  return (
    <footer className="bg-background">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <p className="text-center text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Shelfbase. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
