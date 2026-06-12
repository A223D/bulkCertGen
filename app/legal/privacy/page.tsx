import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Privacy | Very Simple Batch PDF",
};

export default function PrivacyPage() {
  return (
    <AppShell>
      <article className="max-w-3xl rounded-lg border border-line bg-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Privacy
        </p>
        <h1 className="mt-2 text-3xl font-semibold">Privacy-first batch documents</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Very Simple Batch PDF is planned as a single-session utility. Uploaded
          spreadsheets and generated PDF files should not be stored by the app.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Phase 1 does not process CSV files, generate PDFs, create accounts, or
          persist user data.
        </p>
      </article>
    </AppShell>
  );
}
