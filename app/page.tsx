import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { getAllTemplates } from "@/lib/batch-pdf/template-registry";

const workflowSteps = [
  "Upload a CSV with a header row",
  "Choose a fixed template",
  "Map spreadsheet columns to document fields",
  "Preview a row before export",
  "Generate a ZIP of PDFs",
];

export default function HomePage() {
  const templates = getAllTemplates();

  return (
    <AppShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Very Simple Batch PDF
          </p>
          <div className="space-y-4">
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
              Turn a spreadsheet into PDFs in minutes.
            </h1>
            <p className="max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
              Upload a CSV, choose a template, map your columns, and generate
              certificates, labels, badges, cards, or simple documents in bulk.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/create"
              className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-panel hover:bg-accent"
            >
              Create PDFs
            </Link>
            <a
              href="#templates"
              className="rounded-lg border border-line px-5 py-3 text-sm font-medium hover:border-accent hover:text-accent"
            >
              See templates
            </a>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
            Batch document flow
          </p>
          <ol className="mt-5 space-y-4">
            {workflowSteps.map((step, index) => (
              <li key={step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent">
                  {index + 1}
                </span>
                <p className="pt-1 text-sm leading-6 text-muted-foreground">
                  {step}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3" aria-label="How it works">
        {workflowSteps.slice(0, 3).map((step, index) => (
          <div key={step} className="rounded-lg border border-line bg-panel p-5">
            <p className="text-sm font-semibold text-accent">0{index + 1}</p>
            <h2 className="mt-3 text-lg font-semibold">{step}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              The MVP keeps each step clear and deterministic, with fixed
              templates instead of a custom designer.
            </p>
          </div>
        ))}
      </section>

      <section id="templates" className="space-y-4">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Starter templates
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Pick the document shape first.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Template metadata drives the picker, field list, validation, sample
            CSVs, preview labels, and future PDF renderers.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {templates.map((template) => (
            <article key={template.id} className="rounded-lg border border-line bg-panel p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">{template.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {template.description}
                  </p>
                </div>
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {template.category}
                </span>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                {template.fields.length} fields,{" "}
                {template.fields.filter((field) => field.required).length} required
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-lg border border-line bg-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Pricing
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Start free, expand later.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The planned free flow generates up to 10 PDFs per batch. A later
            one-time full-batch export can unlock larger runs without accounts
            or subscriptions.
          </p>
        </div>
        <div className="rounded-lg border border-line bg-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            Privacy
          </p>
          <h2 className="mt-2 text-2xl font-semibold">Built for single-session work.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Your CSV is used only to generate your PDFs. We do not store
            uploaded spreadsheets or generated PDF files.
          </p>
        </div>
      </section>

      <section className="space-y-4" aria-label="FAQ">
        <h2 className="text-2xl font-semibold">FAQ</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-panel p-5">
            <h3 className="font-semibold">What is a CSV?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              A CSV is a spreadsheet export where each row becomes one document.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-panel p-5">
            <h3 className="font-semibold">Can I use my own design?</h3>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Not in the MVP. Fixed templates keep generation reliable and fast.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-line bg-ink p-6 text-panel">
        <h2 className="text-2xl font-semibold">Create your first batch.</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-panel/80">
          The Phase 1 shell is ready for template selection. CSV upload and PDF
          export will be added in later phases.
        </p>
        <Link
          href="/create"
          className="mt-5 inline-flex rounded-lg bg-panel px-5 py-3 text-sm font-medium text-ink hover:bg-accent-soft"
        >
          Create PDFs
        </Link>
      </section>
    </AppShell>
  );
}
