import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";

export const metadata: Metadata = {
  title: "Refund Policy | Very Simple Batch PDF",
};

export default function RefundPolicyPage() {
  return (
    <AppShell>
      <article className="max-w-3xl rounded-lg border border-line bg-panel p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-accent">
          Refund policy
        </p>
        <h1 className="mt-2 text-3xl font-semibold">One-time export placeholder</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          Paid export is not implemented in Phase 1. This route is present so
          the later one-time purchase flow has a clear policy destination.
        </p>
      </article>
    </AppShell>
  );
}
