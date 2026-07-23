import { describe, expect, it } from "vitest";

import {
  isSafeRemoteDir,
  normalizeRemoteDir,
  remotePath,
} from "@/lib/batch-pdf/archive/config";
import {
  isArchiveFilename,
  isArchivePartialFilename,
  makeArchiveFilename,
  parseArchiveTimestamp,
} from "@/lib/batch-pdf/archive/naming";
import { planRetention, type RemoteEntry } from "@/lib/batch-pdf/archive/retention";

const DAY_MS = 24 * 60 * 60 * 1000;
const NOW = Date.UTC(2026, 6, 23, 12, 0, 0);
const MB = 1024 * 1024;
const GB = 1024 * MB;

function archiveName(nowMs: number): string {
  return makeArchiveFilename(nowMs);
}

function entry(
  name: string,
  sizeBytes: number,
  modifiedAtMs: number | null = null,
): RemoteEntry {
  return { name, sizeBytes, modifiedAtMs };
}

function plan(input: {
  entries: RemoteEntry[];
  incomingBytes?: number;
  nowMs?: number;
  retentionDays?: number;
  totalCapBytes?: number;
  partialMaxAgeMs?: number;
}) {
  return planRetention({
    entries: input.entries,
    incomingBytes: input.incomingBytes ?? 0,
    nowMs: input.nowMs ?? NOW,
    retentionDays: input.retentionDays ?? 7,
    totalCapBytes: input.totalCapBytes ?? 5 * GB,
    partialMaxAgeMs: input.partialMaxAgeMs ?? DAY_MS,
  });
}

describe("archive filenames", () => {
  it("round-trips the UTC timestamp encoded in the name", () => {
    const name = makeArchiveFilename(NOW);
    expect(isArchiveFilename(name)).toBe(true);
    // Second-level resolution is all the name carries.
    expect(parseArchiveTimestamp(name)).toBe(NOW);
  });

  it("produces distinct names within the same second", () => {
    const names = new Set(
      Array.from({ length: 50 }, () => makeArchiveFilename(NOW)),
    );
    expect(names.size).toBe(50);
  });

  it("does not claim files written by anything else", () => {
    for (const name of [
      "backup.zip",
      "bcg-output.zip",
      "bcg-output-20260723-120000.zip",
      "bcg-output-20260723-120000-XYZ.zip",
      "reminders-prod-daily-2026-07-23-0337.tar.gz.gpg",
      "../../etc/passwd",
    ]) {
      expect(isArchiveFilename(name)).toBe(false);
    }
  });

  it("recognises partial uploads and their timestamps", () => {
    const partial = `${makeArchiveFilename(NOW)}.part`;
    expect(isArchivePartialFilename(partial)).toBe(true);
    expect(isArchiveFilename(partial)).toBe(false);
    expect(parseArchiveTimestamp(partial)).toBe(NOW);
  });
});

describe("remote directory safety", () => {
  it("rejects web-servable and traversing paths", () => {
    for (const dir of [
      "bulkCertGenOutputs",
      "/home/user/public_html/outputs",
      "/home/user/www/outputs",
      "/outputs/../public_html",
      "/outputs\n/evil",
      "/public/outputs",
    ]) {
      expect(isSafeRemoteDir(dir)).toBe(false);
    }
  });

  it("accepts an absolute private path", () => {
    expect(isSafeRemoteDir("/bulkCertGenOutputs")).toBe(true);
    expect(isSafeRemoteDir("/home/user/private/bulkCertGenOutputs")).toBe(true);
  });

  it("normalizes trailing slashes and joins without doubling", () => {
    expect(normalizeRemoteDir("/outputs/")).toBe("/outputs");
    expect(normalizeRemoteDir("/")).toBe("/");
    expect(remotePath("/outputs", "a.zip")).toBe("/outputs/a.zip");
    expect(remotePath("/", "a.zip")).toBe("/a.zip");
  });
});

describe("planRetention", () => {
  it("keeps files inside the retention window", () => {
    const result = plan({
      entries: [
        entry(archiveName(NOW - 1 * DAY_MS), 10 * MB),
        entry(archiveName(NOW - 6 * DAY_MS), 10 * MB),
      ],
    });

    expect(result.deleteNames).toEqual([]);
    expect(result.retainedBytes).toBe(20 * MB);
  });

  it("deletes files older than the retention window", () => {
    const stale = archiveName(NOW - 8 * DAY_MS);
    const result = plan({
      entries: [entry(stale, 10 * MB), entry(archiveName(NOW - 2 * DAY_MS), 10 * MB)],
    });

    expect(result.deleteNames).toEqual([stale]);
    expect(result.expiredCount).toBe(1);
    expect(result.retainedBytes).toBe(10 * MB);
  });

  it("treats the boundary as inclusive of the retention window", () => {
    const exactly7Days = archiveName(NOW - 7 * DAY_MS);
    expect(plan({ entries: [entry(exactly7Days, MB)] }).deleteNames).toEqual([]);

    const justOver = archiveName(NOW - 7 * DAY_MS - 1000);
    expect(plan({ entries: [entry(justOver, MB)] }).deleteNames).toEqual([justOver]);
  });

  it("never deletes files it did not write", () => {
    const foreign = entry("someone-elses-backup.zip", 10 * MB);
    const result = plan({ entries: [foreign] });

    expect(result.deleteNames).toEqual([]);
    // Foreign files still consume the quota.
    expect(result.retainedBytes).toBe(10 * MB);
  });

  it("evicts oldest first when the incoming file would breach the cap", () => {
    const oldest = archiveName(NOW - 5 * DAY_MS);
    const middle = archiveName(NOW - 3 * DAY_MS);
    const newest = archiveName(NOW - 1 * DAY_MS);

    const result = plan({
      entries: [entry(newest, 2 * GB), entry(oldest, 2 * GB), entry(middle, 1 * GB)],
      incomingBytes: 1 * GB,
      totalCapBytes: 5 * GB,
    });

    expect(result.deleteNames).toEqual([oldest]);
    expect(result.evictedCount).toBe(1);
    expect(result.canUpload).toBe(true);
    expect(result.retainedBytes + 1 * GB).toBeLessThanOrEqual(5 * GB);
  });

  it("evicts as many as needed and no more", () => {
    const entries = [
      entry(archiveName(NOW - 5 * DAY_MS), 2 * GB),
      entry(archiveName(NOW - 4 * DAY_MS), 2 * GB),
      entry(archiveName(NOW - 3 * DAY_MS), 1 * GB),
    ];

    const result = plan({ entries, incomingBytes: 3 * GB, totalCapBytes: 5 * GB });

    expect(result.evictedCount).toBe(2);
    expect(result.retainedBytes).toBe(1 * GB);
    expect(result.canUpload).toBe(true);
  });

  it("refuses an upload that cannot fit even after emptying the folder", () => {
    const result = plan({
      entries: [entry(archiveName(NOW - DAY_MS), 1 * GB)],
      incomingBytes: 6 * GB,
      totalCapBytes: 5 * GB,
    });

    expect(result.canUpload).toBe(false);
    expect(result.skipReason).toBe("too_large_for_cap");
  });

  it("refuses an upload when un-deletable foreign files fill the cap", () => {
    const result = plan({
      entries: [entry("huge-foreign-file.bin", 5 * GB)],
      incomingBytes: 10 * MB,
      totalCapBytes: 5 * GB,
    });

    expect(result.deleteNames).toEqual([]);
    expect(result.canUpload).toBe(false);
    expect(result.skipReason).toBe("foreign_files_exceed_cap");
  });

  it("sweeps abandoned partial uploads but spares in-flight ones", () => {
    const abandoned = `${archiveName(NOW - 3 * DAY_MS)}.part`;
    const inFlight = `${archiveName(NOW - 60 * 1000)}.part`;

    const result = plan({ entries: [entry(abandoned, 5 * MB), entry(inFlight, 5 * MB)] });

    expect(result.deleteNames).toEqual([abandoned]);
    expect(result.partialCount).toBe(1);
    // The in-flight partial still counts against the cap while it uploads.
    expect(result.retainedBytes).toBe(5 * MB);
  });

  it("never evicts a partial upload to make room", () => {
    const inFlight = `${archiveName(NOW - 60 * 1000)}.part`;
    const result = plan({
      entries: [entry(inFlight, 4 * GB)],
      incomingBytes: 2 * GB,
      totalCapBytes: 5 * GB,
    });

    expect(result.deleteNames).toEqual([]);
    expect(result.canUpload).toBe(false);
  });

  it("always allows a prune-only pass", () => {
    const result = plan({
      entries: [entry("huge-foreign-file.bin", 9 * GB)],
      incomingBytes: 0,
      totalCapBytes: 5 * GB,
    });

    expect(result.canUpload).toBe(true);
    expect(result.skipReason).toBe(null);
  });

  it("expires before evicting, so a full week of expiry frees the cap", () => {
    const entries = [
      entry(archiveName(NOW - 9 * DAY_MS), 3 * GB),
      entry(archiveName(NOW - 8 * DAY_MS), 2 * GB),
      entry(archiveName(NOW - DAY_MS), 1 * GB),
    ];

    const result = plan({ entries, incomingBytes: 3 * GB, totalCapBytes: 5 * GB });

    expect(result.expiredCount).toBe(2);
    expect(result.evictedCount).toBe(0);
    expect(result.canUpload).toBe(true);
  });

  it("ignores nonsense sizes rather than corrupting the total", () => {
    const result = plan({
      entries: [
        entry(archiveName(NOW - DAY_MS), Number.NaN),
        entry(archiveName(NOW - DAY_MS), -1),
        entry(archiveName(NOW - DAY_MS), 5 * MB),
      ],
    });

    expect(result.retainedBytes).toBe(5 * MB);
  });

  it("is deterministic for same-second uploads", () => {
    const a = "bcg-output-20260720-120000-aaaaaaaa.zip";
    const b = "bcg-output-20260720-120000-bbbbbbbb.zip";

    const result = plan({
      entries: [entry(b, 3 * GB), entry(a, 3 * GB)],
      incomingBytes: 1 * GB,
      totalCapBytes: 5 * GB,
    });

    expect(result.deleteNames).toEqual([a]);
  });
});
