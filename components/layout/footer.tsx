/**
 * Footer Component
 *
 * Optional footer for authenticated pages.
 * Displays copyright and version information.
 */

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t bg-background">
      <div className="container flex h-16 items-center justify-between px-4 text-sm text-muted-foreground">
        <div>
          <p>© {currentYear} 営業日報システム. All rights reserved.</p>
        </div>
        <div className="flex items-center gap-4">
          <span>Version 1.0.0</span>
        </div>
      </div>
    </footer>
  );
}
