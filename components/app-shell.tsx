import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold uppercase tracking-[0.16em] text-ink"
            >
              Very Simple Batch PDF
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              CSV to PDFs for simple batch documents
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <Link href="/create" className="hover:text-accent">
              Create
            </Link>
            <Link href="/legal/privacy" className="hover:text-accent">
              Privacy
            </Link>
          </nav>
        </header>

        <main className="flex-1 space-y-8">{children}</main>
      </div>
    </div>
  );
}
