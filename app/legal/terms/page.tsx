import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Terms | Very Simple Batch PDF",
};

export default function TermsPage() {
  return (
    <AppShell>
      <article className="max-w-3xl rounded-lg border border-line bg-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Terms
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Simple utility terms</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          This placeholder page reserves the terms route for launch readiness.
          Detailed legal copy can be added before public release.
        </p>
      </article>
    </AppShell>
  );
}
