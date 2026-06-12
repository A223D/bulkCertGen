import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV to PDF Generator | Very Simple Batch PDF",
  description:
    "Upload a CSV, choose a template, and generate certificates, labels, badges, cards, or simple PDFs in bulk.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
