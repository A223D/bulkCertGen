export function ValidationSummary() {
  return (
    <section className="rounded-lg border border-line bg-panel p-4">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Validation
      </p>
      <h2 className="mt-2 text-lg font-semibold">No CSV loaded</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Phase 1 does not inspect files or rows. Validation details will appear
        here after CSV parsing and field mapping are added.
      </p>
    </section>
  );
}
