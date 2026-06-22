import { describe, expect, it } from "vitest";
import { mapWithConcurrency } from "../../lib/batch-pdf/concurrency.ts";

describe("mapWithConcurrency", () => {
  it("preserves input order regardless of completion order", async () => {
    const items = [30, 10, 20, 5];
    const results = await mapWithConcurrency(items, 2, async (value) => {
      await new Promise((resolve) => setTimeout(resolve, value));
      return value * 2;
    });
    expect(results).toEqual([60, 20, 40, 10]);
  });

  it("never exceeds the concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;
    const items = Array.from({ length: 20 }, (_, i) => i);

    await mapWithConcurrency(items, 3, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return value;
    });

    expect(maxActive).toBeLessThanOrEqual(3);
    expect(maxActive).toBeGreaterThan(1);
  });

  it("returns an empty array for empty input without invoking fn", async () => {
    let calls = 0;
    const results = await mapWithConcurrency([], 4, async (value) => {
      calls += 1;
      return value;
    });
    expect(results).toEqual([]);
    expect(calls).toBe(0);
  });

  it("propagates the first rejection", async () => {
    await expect(
      mapWithConcurrency([1, 2, 3], 2, async (value) => {
        if (value === 2) throw new Error("boom");
        return value;
      }),
    ).rejects.toThrow("boom");
  });

  it("treats limits below 1 as a single worker", async () => {
    let active = 0;
    let maxActive = 0;
    await mapWithConcurrency([1, 2, 3], 0, async (value) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 1));
      active -= 1;
      return value;
    });
    expect(maxActive).toBe(1);
  });
});
