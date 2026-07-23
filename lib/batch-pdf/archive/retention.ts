/**
 * Pure retention planning for the remote output folder.
 *
 * Kept free of I/O so the eviction rules — which decide what gets deleted from
 * a live server — are directly unit-testable.
 *
 * Rules, in order:
 *   1. Files this app wrote that are older than the retention window go.
 *   2. Abandoned `.part` uploads older than the partial window go.
 *   3. If the folder would still exceed the size cap once the new archive
 *      lands, the oldest remaining archives are evicted until it fits.
 *   4. If it still does not fit, the upload is skipped rather than allowing
 *      the folder to grow past the cap.
 *
 * Files this app did not write are never deleted, but they DO count against
 * the cap — the cap is about disk consumed, and silently overshooting it
 * because someone dropped an unrelated file in the folder would be worse.
 */

import {
  isArchiveFilename,
  isArchivePartialFilename,
  parseArchiveTimestamp,
} from "./naming";

export type RemoteEntry = {
  name: string;
  sizeBytes: number;
  /** Server-reported mtime, used only when the name carries no timestamp. */
  modifiedAtMs: number | null;
};

export type RetentionPlan = {
  /** Names to delete, ordered oldest first. */
  deleteNames: string[];
  /** False when the incoming archive cannot fit even after every eviction. */
  canUpload: boolean;
  skipReason: "too_large_for_cap" | "foreign_files_exceed_cap" | null;
  /** Bytes retained after deletions, excluding the incoming archive. */
  retainedBytes: number;
  expiredCount: number;
  partialCount: number;
  evictedCount: number;
};

export type PlanRetentionInput = {
  entries: RemoteEntry[];
  /** Size of the archive about to be uploaded; 0 for a prune-only pass. */
  incomingBytes: number;
  nowMs: number;
  retentionDays: number;
  totalCapBytes: number;
  partialMaxAgeMs: number;
};

type Aged = RemoteEntry & { ageSortKey: number };

function sizeOf(entry: RemoteEntry): number {
  return Number.isFinite(entry.sizeBytes) && entry.sizeBytes > 0
    ? entry.sizeBytes
    : 0;
}

export function planRetention(input: PlanRetentionInput): RetentionPlan {
  const {
    entries,
    incomingBytes,
    nowMs,
    retentionDays,
    totalCapBytes,
    partialMaxAgeMs,
  } = input;

  const retentionMs = retentionDays * 24 * 60 * 60 * 1000;
  const deleteNames: string[] = [];

  let foreignBytes = 0;
  let expiredCount = 0;
  let partialCount = 0;
  const survivors: Aged[] = [];

  for (const entry of entries) {
    const size = sizeOf(entry);

    if (isArchivePartialFilename(entry.name)) {
      // A `.part` belonging to an upload still in flight must survive; only
      // sweep ones old enough that their upload certainly died.
      const stamp = parseArchiveTimestamp(entry.name) ?? entry.modifiedAtMs;
      const age = stamp === null ? Number.POSITIVE_INFINITY : nowMs - stamp;
      if (age > partialMaxAgeMs) {
        deleteNames.push(entry.name);
        partialCount += 1;
      } else {
        foreignBytes += size;
      }
      continue;
    }

    if (!isArchiveFilename(entry.name)) {
      foreignBytes += size;
      continue;
    }

    const stamp = parseArchiveTimestamp(entry.name);
    if (stamp === null) {
      // Unreachable for names that pass isArchiveFilename, but treat an
      // unparseable timestamp as un-evictable rather than guessing.
      foreignBytes += size;
      continue;
    }

    if (nowMs - stamp > retentionMs) {
      deleteNames.push(entry.name);
      expiredCount += 1;
      continue;
    }

    survivors.push({ ...entry, sizeBytes: size, ageSortKey: stamp });
  }

  // Oldest first, name as a stable tiebreak for same-second uploads.
  survivors.sort((a, b) =>
    a.ageSortKey === b.ageSortKey
      ? a.name.localeCompare(b.name)
      : a.ageSortKey - b.ageSortKey,
  );

  let retainedBytes =
    foreignBytes + survivors.reduce((sum, entry) => sum + entry.sizeBytes, 0);
  let evictedCount = 0;
  let index = 0;

  while (retainedBytes + incomingBytes > totalCapBytes && index < survivors.length) {
    const victim = survivors[index];
    deleteNames.push(victim.name);
    retainedBytes -= victim.sizeBytes;
    evictedCount += 1;
    index += 1;
  }

  const fits = retainedBytes + incomingBytes <= totalCapBytes;
  const canUpload = incomingBytes === 0 || fits;

  return {
    deleteNames,
    canUpload,
    // When the upload cannot proceed, distinguish "this one file is simply too
    // big" from "files we are not allowed to delete are holding the quota" —
    // the two need different responses from the operator.
    skipReason: canUpload
      ? null
      : incomingBytes > totalCapBytes
        ? "too_large_for_cap"
        : "foreign_files_exceed_cap",
    retainedBytes,
    expiredCount,
    partialCount,
    evictedCount,
  };
}
