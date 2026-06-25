import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Privacy",
  description: "How Batch, Please handles uploaded CSVs, designs, and generated files.",
  alternates: { canonical: "/legal/privacy" },
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
          Your CSV and design are used only for the current batch. We do not store
          uploaded spreadsheets, uploaded designs, or generated PDF files.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          CSV parsing and design setup happen in your browser. When you export, the
          design and batch data are sent to the server only to generate the requested
          PDF or ZIP. The generated download is returned directly and is not retained.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          There are no accounts or saved projects. Your CSV is held temporarily in
          this browser session while you move from the homepage into the creation
          flow, and it is cleared after a successful export.
        </p>
      </article>
    </AppShell>
  );
}
