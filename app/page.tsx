import Link from "next/link";
import { AppShell } from "@/components/app-shell";

const setupSteps = [
  "Upload a certificate background image",
  "Import CSV data with recipient columns",
  "Position dynamic text fields on the design",
  "Preview a single row before bulk export",
];

export default function HomePage() {
  return (
    <AppShell>
      <section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-accent">
            Bulk Certificate Generator
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Build certificate layouts now, wire up data flows later.
            </h1>
            <p className="max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
              This MVP foundation is set up for a frontend-first workflow: define
              routes, shape the UI, and iterate quickly before CSV parsing,
              uploads, or PDF export are added.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/generator"
              className="rounded-full bg-ink px-5 py-3 text-sm font-medium text-white hover:bg-stone-800"
            >
              Open generator workspace
            </Link>
            <a
              href="#mvp-scope"
              className="rounded-full border border-line px-5 py-3 text-sm font-medium hover:border-accent hover:text-accent"
            >
              Review MVP scope
            </a>
          </div>
        </div>

        <div className="rounded-[2rem] border border-line bg-panel p-6 shadow-card">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-stone-500">
            Planned flow
          </p>
          <ol className="mt-5 space-y-4">
            {setupSteps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-stone-700">{step}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="mvp-scope"
        className="grid gap-4 rounded-[2rem] border border-line bg-panel p-6 shadow-card sm:grid-cols-3"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Included now
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            App Router structure, TypeScript, Tailwind, shared shell, and route
            placeholders for the landing page and generator.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Deferred
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            CSV parsing, image upload, PDF generation, persistence, auth, and
            backend logic remain intentionally out of scope.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
            Next build step
          </p>
          <p className="mt-2 text-sm leading-6 text-stone-700">
            Implement the generator UI inside the feature folder without needing
            to restructure the app again.
          </p>
        </div>
      </section>
    </AppShell>
  );
}
