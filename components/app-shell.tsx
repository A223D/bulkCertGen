import Link from "next/link";

type AppShellProps = {
  children: React.ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fffdf8_0%,#f5f1e8_50%,#efe7d8_100%)]">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-8 sm:px-8 lg:px-10">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/"
              className="text-sm font-semibold tracking-[0.2em] text-ink uppercase"
            >
              BCG MVP
            </Link>
            <p className="mt-2 text-sm text-stone-600">
              Frontend-first certificate layout builder
            </p>
          </div>
          <nav className="flex items-center gap-3 text-sm text-stone-600">
            <Link href="/" className="hover:text-accent">
              Home
            </Link>
            <Link href="/app" className="hover:text-accent">
              Generator App
            </Link>
          </nav>
        </header>

        <main className="flex-1 space-y-8">{children}</main>
      </div>
    </div>
  );
}
