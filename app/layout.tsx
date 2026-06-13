import type { Metadata } from "next";
import { Manrope, JetBrains_Mono, DM_Serif_Display } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "CSV to PDF Generator | Very Simple Batch PDF",
  description:
    "Upload a CSV, choose a template, and generate certificates, labels, badges, cards, or simple PDFs in bulk.",
};

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} ${dmSerifDisplay.variable}`}>
        {children}
      </body>
    </html>
  );
}
