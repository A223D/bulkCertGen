"use client";

import type { ReactNode } from "react";
import { DesktopOnlyNotice } from "@/components/DesktopOnlyNotice";
import { useDesktopGate } from "@/lib/use-desktop-gate";

export function CreateGate({ children }: { children: ReactNode }) {
  const { status, allowAnyway } = useDesktopGate();

  if (status === "pending") {
    return <div className="min-h-screen bg-[#FAF8F3]" aria-hidden="true" />;
  }

  if (status === "blocked") {
    return <DesktopOnlyNotice variant="fullscreen" onContinueAnyway={allowAnyway} />;
  }

  return <>{children}</>;
}
