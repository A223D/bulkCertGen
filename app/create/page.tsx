import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { BatchPdfClient } from "./BatchPdfClient";

export const metadata: Metadata = {
  title: "Create Batch PDFs | Very Simple Batch PDF",
  description:
    "Upload a CSV, choose a template, map columns, preview rows, and generate a free ZIP of up to 10 PDFs.",
  openGraph: {
    title: "Create Batch PDFs | Very Simple Batch PDF",
    description:
      "Upload a CSV, choose a template, map columns, preview rows, and generate a free ZIP of PDFs.",
  },
};

export default function CreatePage() {
  return (
    <AppShell>
      <BatchPdfClient />
    </AppShell>
  );
}
