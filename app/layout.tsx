import type { Metadata, Viewport } from "next";
import { Manrope, JetBrains_Mono, DM_Serif_Display } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Batch, Please — CSV to PDF Generator",
    template: "%s | Batch, Please",
  },
  description:
    "Upload a CSV, choose a template, and generate certificates, labels, badges, cards, or simple PDFs in bulk.",
  applicationName: "Batch, Please",
  category: "productivity",
  creator: "Batch, Please",
  openGraph: {
    type: "website",
    locale: "en_CA",
    siteName: "Batch, Please",
    title: "Batch, Please — CSV to PDF Generator",
    description:
      "Turn spreadsheet rows into personalized certificates, badges, cards, labels, and PDFs.",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "Batch, Please turns spreadsheet rows into polished personalized PDFs",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Batch, Please — CSV to PDF Generator",
    description:
      "Turn spreadsheet rows into personalized certificates, badges, cards, labels, and PDFs.",
    images: [
      {
        url: "/twitter-image.png",
        width: 1200,
        height: 630,
        alt: "Batch, Please turns spreadsheet rows into polished personalized PDFs",
      },
    ],
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
      : undefined,
  },
};

export const viewport: Viewport = {
  colorScheme: "light",
  themeColor: "#faf8f3",
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
