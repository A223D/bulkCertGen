"use client";

import { useState } from "react";
import { Monitor } from "lucide-react";

function BrandMark() {
  return (
    <span style={{ position: "relative", width: 34, height: 34, display: "inline-block", flexShrink: 0 }} aria-hidden="true">
      <span style={{ position: "absolute", inset: 0, background: "#F2B01E", borderRadius: 9, transform: "rotate(-6deg)" }} />
      <span style={{ position: "absolute", left: 7, top: 6, width: 17, height: 21, background: "#FFFFFF", borderRadius: 3, boxShadow: "4px 4px 0 #1A1916" }} />
    </span>
  );
}

export function DesktopOnlyNotice({
  variant,
  onContinueAnyway,
}: {
  variant: "card" | "fullscreen";
  onContinueAnyway: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Fullscreen is a standalone page (its only heading), so it owns the h1;
  // the card variant is embedded in the homepage, which already has an h1.
  const Heading = variant === "fullscreen" ? "h1" : "h2";

  const panel = (
    <div
      className="mx-auto w-full max-w-md rounded-[22px] border border-[#E7E2D6] bg-white p-7 text-center text-[#1A1916] shadow-[0_30px_60px_-34px_rgba(26,25,22,0.32)]"
    >
      <div className="mb-4 flex justify-center">
        <span className="inline-flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#FBEFCB]">
          <Monitor className="h-7 w-7 text-[#8A6A12]" aria-hidden="true" />
        </span>
      </div>
      <Heading className="text-[22px] font-extrabold leading-snug tracking-[-0.02em]">
        This tool works best on a computer
      </Heading>
      <p className="mt-2 text-[15px] leading-[1.55] text-[#6E6A61]">
        Placing fields on your design needs a larger screen and a mouse. Open this page on a
        laptop or desktop to build your PDFs.
      </p>

      <button
        type="button"
        onClick={copyLink}
        className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1A1916] px-6 py-[14px] text-[15px] font-bold text-white transition hover:bg-[#3A372F]"
      >
        {copied ? "Link copied" : "Copy link for your computer"}
      </button>

      <p className="mt-4 flex items-center justify-center gap-2 text-[12px] leading-[1.5] text-[#8A857A]">
        <span className="text-[#2E8B57]">🔒</span>
        Your CSV and design are used only for the current batch and are never stored.
      </p>

      <button
        type="button"
        onClick={onContinueAnyway}
        className="mt-5 text-[12.5px] font-medium text-[#A39B8A] underline decoration-[#D8D1C2] underline-offset-2 transition hover:text-[#6E6A61]"
      >
        Using an older or smaller device? Continue anyway →
      </button>
    </div>
  );

  if (variant === "fullscreen") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-[#FAF8F3] px-5 py-16">
        <div className="flex items-center gap-[11px]">
          <BrandMark />
          <span className="text-[17px] font-extrabold tracking-[-0.02em] text-[#1A1916]">
            Batch, <span className="italic text-[#F2B01E]">Please</span>
          </span>
        </div>
        {panel}
      </div>
    );
  }

  return panel;
}
