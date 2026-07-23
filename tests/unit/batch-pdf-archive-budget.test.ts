import { describe, expect, it } from "vitest";

import { ARCHIVE_DEFAULTS } from "@/lib/batch-pdf/archive/config";
import { maxDuration } from "@/app/api/generate-custom-pdf/route";

/**
 * The archive's time and size budget is derived from Vercel Hobby's limits, and
 * those limits live in three places that can drift apart: the route's
 * `maxDuration`, the archive's own timeouts, and the per-file ceiling.
 *
 * These assertions pin the derivation rather than the numbers, so raising one
 * without the others fails here instead of in production — where the failure
 * mode is a platform kill mid-upload, which leaves an orphaned `.part` file
 * behind because our own timeout never got to clean it up.
 */

/** Vercel Hobby: 300s is both the default and the ceiling under fluid compute. */
const HOBBY_MAX_DURATION_S = 300;

/** Roughly what Vercel gives a function as writable /tmp, used by the spool. */
const VERCEL_TMP_BYTES = 512 * 1024 * 1024;

/**
 * Pessimistic FTP throughput to shared hosting. The real figure is a few MB/s;
 * this is the floor the ceiling has to remain feasible at.
 */
const SLOW_FTP_BYTES_PER_SECOND = 2 * 1024 * 1024;

describe("archive time budget", () => {
  it("keeps the route inside the Hobby function ceiling", () => {
    expect(maxDuration).toBeLessThanOrEqual(HOBBY_MAX_DURATION_S);
  });

  it("finishes archiving before the platform would kill the invocation", () => {
    // `after()` runs inside the invocation, so the archive shares the budget
    // with rendering and the response.
    expect(ARCHIVE_DEFAULTS.totalTimeoutMs).toBeLessThan(maxDuration * 1000);
  });

  it("leaves rendering and the response a usable share of the invocation", () => {
    const headroomMs = maxDuration * 1000 - ARCHIVE_DEFAULTS.totalTimeoutMs;

    // A 500-row export renders in well under a second, but the streamed ZIP
    // still has to reach the client before the spool can be uploaded.
    expect(headroomMs).toBeGreaterThanOrEqual(30_000);
  });

  it("detects a dead socket well inside the whole-upload budget", () => {
    expect(ARCHIVE_DEFAULTS.operationTimeoutMs).toBeLessThan(
      ARCHIVE_DEFAULTS.totalTimeoutMs / 2,
    );
  });

  it("does not sweep `.part` files that a running upload could still finish", () => {
    // The sweeper must never race an in-flight upload of the largest archive
    // we allow, or a slow transfer would delete its own target.
    expect(ARCHIVE_DEFAULTS.partialMaxAgeMs).toBeGreaterThan(
      ARCHIVE_DEFAULTS.totalTimeoutMs,
    );
  });
});

describe("archive size ceiling", () => {
  it("can be transferred within the budget at pessimistic throughput", () => {
    const transferSeconds =
      ARCHIVE_DEFAULTS.maxArchiveBytes / SLOW_FTP_BYTES_PER_SECOND;

    // Raising the per-file ceiling past what the budget can move would not
    // capture bigger batches — it would just burn the whole budget and fail.
    expect(transferSeconds * 1000).toBeLessThan(ARCHIVE_DEFAULTS.totalTimeoutMs);
  });

  it("leaves room in /tmp for the streaming spool", () => {
    // The spool writes the whole archive to disk before uploading it, and it is
    // not the only thing using /tmp.
    expect(ARCHIVE_DEFAULTS.maxArchiveBytes * 2).toBeLessThanOrEqual(
      VERCEL_TMP_BYTES,
    );
  });

  it("never allows a single file to exceed the folder cap", () => {
    expect(ARCHIVE_DEFAULTS.maxArchiveBytes).toBeLessThan(
      ARCHIVE_DEFAULTS.totalCapBytes,
    );
  });
});
