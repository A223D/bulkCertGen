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
          your uploaded spreadsheet or your uploaded design file, and there is no
          long-term storage of anything you make here.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          CSV parsing and design setup happen in your browser. When you export, the
          design and batch data are sent to the server only to generate the requested
          PDF or ZIP.
        </p>
        <h2 className="mt-8 text-lg font-semibold">Short-term copy of your export</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          This tool is free and needs no account, which makes it a target for
          misuse — for example, generating fake identity documents or credentials.
          To be able to investigate reports of abuse, we keep a copy of the
          generated PDF or ZIP on our own private server for a short period.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          These copies are <strong>deleted automatically after 7 days</strong>. They
          are stored in a private, non-public folder, are never used for marketing,
          analytics, training, or profiling, and are never sold or shared with
          anyone except where we are legally required to. The copy contains the
          finished documents only — your original spreadsheet file and your original
          design file are still never kept.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          There are no accounts or saved projects. Your CSV is held temporarily in
          this browser session while you move from the homepage into the creation
          flow, and it is cleared after a successful export.
        </p>
        <h2 className="mt-8 text-lg font-semibold">Third-party services</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          Font previews in the editor are loaded from Google Fonts. When you
          export, the server fetches the selected font files from the Google
          Fonts CDN to embed them in your PDF. These requests expose your IP
          address to Google, but no CSV data, design content, or generated
          output is ever sent to Google.
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          When Upstash credentials are configured, the server keeps an
          anonymous daily counter of completed exports (a number per day,
          nothing else). No CSV values, names, design contents, filenames, or
          identifiers are stored in that counter.
        </p>
      </article>
    </AppShell>
  );
}
