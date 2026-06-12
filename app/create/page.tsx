import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BatchPdfClient } from "./BatchPdfClient";

export const metadata: Metadata = {
  title: "Create PDFs | Very Simple Batch PDF",
  description:
    "Choose a starter template and prepare the CSV to PDF generation flow.",
};

export default function CreatePage() {
  return (
    <AppShell>
      <BatchPdfClient />
    </AppShell>
  );
}
