import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Very Simple Batch PDF",
    short_name: "Batch PDF",
    description:
      "Turn CSV spreadsheet rows into personalized certificates, badges, cards, labels, and PDFs.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#faf8f3",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
