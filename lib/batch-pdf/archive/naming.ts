/**
 * Remote filenames for archived exports.
 *
 * The UTC creation time is encoded in the name so retention can be decided
 * without trusting FTP server mtimes (which vary by timezone and are rewritten
 * by some cPanel file managers). The distinctive prefix also means pruning can
 * never touch a file this app did not write.
 */

export const ARCHIVE_FILE_PREFIX = "bcg-output-";
export const ARCHIVE_FILE_EXTENSION = ".zip";
export const ARCHIVE_PARTIAL_SUFFIX = ".part";

const NAME_PATTERN =
  /^bcg-output-(\d{4})(\d{2})(\d{2})-(\d{2})(\d{2})(\d{2})-[0-9a-f]{8}\.zip$/;

function pad(value: number, width: number): string {
  return String(value).padStart(width, "0");
}

function randomHex(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  }
  return Math.random().toString(16).slice(2, 10).padEnd(8, "0");
}

/**
 * Builds a collision-resistant remote filename. The random suffix matters:
 * two exports can finish in the same second, and an overwrite would destroy
 * evidence of one of them.
 */
export function makeArchiveFilename(nowMs: number = Date.now()): string {
  const date = new Date(nowMs);
  const stamp =
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1, 2)}${pad(date.getUTCDate(), 2)}` +
    `-${pad(date.getUTCHours(), 2)}${pad(date.getUTCMinutes(), 2)}${pad(date.getUTCSeconds(), 2)}`;
  return `${ARCHIVE_FILE_PREFIX}${stamp}-${randomHex()}${ARCHIVE_FILE_EXTENSION}`;
}

/** True when the name was written by this app (and is therefore prunable). */
export function isArchiveFilename(name: string): boolean {
  return NAME_PATTERN.test(name);
}

/** True for an in-flight or abandoned upload written by this app. */
export function isArchivePartialFilename(name: string): boolean {
  return (
    name.endsWith(ARCHIVE_PARTIAL_SUFFIX) &&
    isArchiveFilename(name.slice(0, -ARCHIVE_PARTIAL_SUFFIX.length))
  );
}

/**
 * Extracts the UTC creation time encoded in an archive filename, or null when
 * the name is not ours.
 */
export function parseArchiveTimestamp(name: string): number | null {
  const base = name.endsWith(ARCHIVE_PARTIAL_SUFFIX)
    ? name.slice(0, -ARCHIVE_PARTIAL_SUFFIX.length)
    : name;
  const match = NAME_PATTERN.exec(base);
  if (!match) return null;

  const [, year, month, day, hour, minute, second] = match;
  const ms = Date.UTC(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
    Number(second),
  );
  return Number.isFinite(ms) ? ms : null;
}
