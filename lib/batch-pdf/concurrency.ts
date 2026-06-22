/**
 * Maps over `items` running at most `limit` invocations of `fn` concurrently.
 *
 * Results are returned in the same order as `items` regardless of completion
 * order. The first rejection aborts the run (in-flight work still settles, but
 * its results are discarded) and is re-thrown to the caller.
 *
 * This bounds peak memory for CPU/allocation-heavy per-item work (e.g. building
 * one PDFDocument per row) where an unbounded `Promise.all` would hold every
 * intermediate result in memory at once.
 */
export async function mapWithConcurrency<T, R>(
  items: readonly T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const effectiveLimit = Math.max(1, Math.floor(limit));
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker(): Promise<void> {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= items.length) return;
      results[index] = await fn(items[index], index);
    }
  }

  const workerCount = Math.min(effectiveLimit, items.length);
  const workers: Array<Promise<void>> = [];
  for (let i = 0; i < workerCount; i++) {
    workers.push(worker());
  }

  await Promise.all(workers);
  return results;
}
