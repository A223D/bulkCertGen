import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Terms",
  description: "Terms for using the free Batch, Please utility.",
  alternates: { canonical: "/legal/terms" },
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
          Batch, Please is a free utility for turning CSV rows and image
          designs into personalized PDF files. You are responsible for the files you
          upload and must have the right to use their contents.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Do not use the service for unlawful, deceptive, abusive, or infringing
          material. The service is provided as available, without a guarantee that it
          will meet every production, archival, or regulatory requirement. Review
          generated files before relying on or distributing them.
        </p>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Uploaded source files and generated downloads are not stored as projects.
          We may change or discontinue the utility and may limit requests that threaten
          the service or other users.
        </p>
      </article>
    </AppShell>
  );
}
