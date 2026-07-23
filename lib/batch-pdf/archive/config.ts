/**
 * Configuration for the FTPS output archive.
 *
 * Every successful export is copied to a private folder on the NixiHost FTP
 * server for abuse investigation. The archive is short-lived: files older than
 * the retention window are deleted, and the folder is capped in total size.
 *
 * The feature is entirely optional. When credentials are absent or the config
 * is invalid, `getArchiveConfig()` returns null and the export route behaves
 * exactly as it did before — archiving must never be able to break an export.
 */

export const ARCHIVE_DEFAULTS = {
  /** Files older than this are deleted on the next upload or prune run. */
  retentionDays: 7,
  /** Hard ceiling on everything stored in the remote folder. */
  totalCapBytes: 5 * 1024 * 1024 * 1024,
  /**
   * Largest single archive we will upload.
   *
   * Stops one pathological batch from evicting a week of files, and is bounded
   * by two platform limits: Vercel gives roughly 512 MB of writable /tmp for the
   * streaming spool, and the transfer has to finish inside the time budget
   * below. At the few MB/s that FTP to shared hosting typically manages, 256 MB
   * takes on the order of two minutes — inside the budget, with room for a slow
   * day. Raise it if measured throughput supports it; the trade-off is that
   * batches above the ceiling are skipped, and large batches are the ones most
   * worth being able to investigate.
   */
  maxArchiveBytes: 256 * 1024 * 1024,
  /**
   * Per-FTP-operation socket timeout. This is an *inactivity* timeout, not a
   * transfer budget, so it does not scale with the per-file ceiling — a healthy
   * upload keeps the data socket busy no matter how large it is. Kept short so a
   * dead socket is detected quickly rather than idling away the whole budget.
   */
  operationTimeoutMs: 20_000,
  /**
   * Whole-upload budget, including listing and pruning. Deliberately well under
   * the route's `maxDuration` (300s on Vercel Hobby, the plan's ceiling) so this
   * timeout fires — and removes the partial upload — before the platform kills
   * the invocation. The remaining headroom is what rendering and the response
   * get, since `after()` shares the same invocation.
   */
  totalTimeoutMs: 240_000,
  /** Interrupted uploads leave `.part` files; sweep them after this long. */
  partialMaxAgeMs: 24 * 60 * 60 * 1000,
} as const;

export type ArchiveConfig = {
  host: string;
  user: string;
  password: string;
  verifyCertificate: boolean;
  remoteDir: string;
  retentionDays: number;
  totalCapBytes: number;
  maxArchiveBytes: number;
  operationTimeoutMs: number;
  totalTimeoutMs: number;
  partialMaxAgeMs: number;
};

function readPositiveInt(name: string, fallback: number): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;

  // Deliberately stricter than parseInt, which reads "1.5.2" as 1 and "1e999"
  // as 1. Silently reinterpreting a typo would quietly shorten the retention
  // window we promise users, or shrink the size ceiling to nothing.
  const parsed = /^\d+$/.test(raw) ? Number(raw) : Number.NaN;

  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    console.warn(
      JSON.stringify({ evt: "output_archive_config_ignored", name }),
    );
    return fallback;
  }
  return parsed;
}

/**
 * Rejects paths that would place user output somewhere web-servable. Mirrors
 * the guard in duesoon-site's backup workflow.
 */
export function isSafeRemoteDir(dir: string): boolean {
  if (!dir.startsWith("/")) return false;
  if (dir.includes("..")) return false;
  if (dir.includes("\\") || dir.includes("\n") || dir.includes("\r")) return false;
  const lowered = dir.toLowerCase();
  if (lowered.includes("public_html")) return false;
  if (lowered.includes("/www/") || lowered.endsWith("/www")) return false;
  if (lowered.includes("/public/")) return false;
  return true;
}

/** Strips a trailing slash so callers can always join with `/`. */
export function normalizeRemoteDir(dir: string): string {
  const trimmed = dir.trim().replace(/\/+$/, "");
  return trimmed === "" ? "/" : trimmed;
}

let warnedInvalid = false;

/**
 * Resolves archive configuration from the environment, or null when the
 * feature is disabled or misconfigured. Never throws.
 */
export function getArchiveConfig(): ArchiveConfig | null {
  if (process.env.OUTPUT_ARCHIVE_ENABLED === "false") return null;

  const host = process.env.NIXIHOST_FTPS_HOST?.trim();
  const user = process.env.NIXIHOST_FTPS_USER?.trim();
  const password = process.env.NIXIHOST_FTPS_PASSWORD;

  if (!host || !user || !password) return null;

  const remoteDir = normalizeRemoteDir(
    process.env.NIXIHOST_OUTPUT_DIR?.trim() || "/bulkCertGenOutputs",
  );

  if (!isSafeRemoteDir(remoteDir)) {
    // Log once per instance rather than on every export.
    if (!warnedInvalid) {
      warnedInvalid = true;
      console.error(
        JSON.stringify({
          evt: "output_archive_disabled",
          reason: "unsafe_remote_dir",
        }),
      );
    }
    return null;
  }

  const totalCapBytes = readPositiveInt(
    "OUTPUT_ARCHIVE_TOTAL_CAP_BYTES",
    ARCHIVE_DEFAULTS.totalCapBytes,
  );
  const maxArchiveBytes = Math.min(
    readPositiveInt(
      "OUTPUT_ARCHIVE_MAX_FILE_BYTES",
      ARCHIVE_DEFAULTS.maxArchiveBytes,
    ),
    totalCapBytes,
  );

  return {
    host,
    user,
    password,
    // Defaults to strict verification; only opt out after confirming a
    // hostname/certificate mismatch with the host.
    verifyCertificate: process.env.NIXIHOST_FTPS_VERIFY_CERTIFICATE !== "false",
    remoteDir,
    retentionDays: readPositiveInt(
      "OUTPUT_ARCHIVE_RETENTION_DAYS",
      ARCHIVE_DEFAULTS.retentionDays,
    ),
    totalCapBytes,
    maxArchiveBytes,
    operationTimeoutMs: ARCHIVE_DEFAULTS.operationTimeoutMs,
    totalTimeoutMs: ARCHIVE_DEFAULTS.totalTimeoutMs,
    partialMaxAgeMs: ARCHIVE_DEFAULTS.partialMaxAgeMs,
  };
}

/** Joins the configured directory with a child name. */
export function remotePath(dir: string, child: string): string {
  return dir === "/" ? `/${child}` : `${dir}/${child}`;
}
