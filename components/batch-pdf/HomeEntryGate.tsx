"use client";

import { HeroCsvCard } from "@/components/batch-pdf/HeroCsvCard";
import { DesktopOnlyNotice } from "@/components/DesktopOnlyNotice";
import { useDesktopGate } from "@/lib/use-desktop-gate";

export function HomeEntryGate() {
  const { status, allowAnyway } = useDesktopGate();

  if (status === "pending") {
    // Reserve roughly the card's footprint to avoid layout shift / content flash.
    return <div aria-hidden="true" style={{ minHeight: 460 }} />;
  }

  if (status === "blocked") {
    return <DesktopOnlyNotice variant="card" onContinueAnyway={allowAnyway} />;
  }

  return <HeroCsvCard />;
}
