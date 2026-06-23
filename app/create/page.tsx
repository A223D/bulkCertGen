import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BatchPdfClient } from "./BatchPdfClient";

export const metadata: Metadata = {
  title: "Create Batch PDFs",
  description:
    "Upload a CSV, choose a design, place fields, preview rows, and generate a combined PDF or ZIP for up to 500 rows.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CreatePage() {
  return (
    <AppShell>
      <BatchPdfClient />
    </AppShell>
  );
}
