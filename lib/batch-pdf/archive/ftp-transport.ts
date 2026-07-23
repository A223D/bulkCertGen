import { Client, type FileInfo } from "basic-ftp";
import { Readable } from "node:stream";

import { type ArchiveConfig, remotePath } from "./config";
import { ARCHIVE_PARTIAL_SUFFIX, makeArchiveFilename } from "./naming";
import { planRetention, type RemoteEntry, type RetentionPlan } from "./retention";

/**
 * Explicit-FTPS transport for the output archive.
 *
 * Mirrors the connection settings duesoon-site uses for the same NixiHost
 * account: `ftp://` on port 21 with AUTH TLS, passive mode, and certificate
 * verification on by default.
 *
 * Every exported function resolves rather than throws. Archiving is a
 * best-effort side channel; a dead FTP server must never surface to a user who
 * is just trying to download their PDFs.
 */

export type ArchiveOutcome =
  | { status: "uploaded"; filename: string; sizeBytes: number; plan: RetentionPlan }
  | { status: "skipped"; reason: string }
  | { status: "failed"; reason: string };

export type ArchiveSource =
  | { kind: "file"; path: string; sizeBytes: number }
  | { kind: "bytes"; bytes: Uint8Array };

function connectionSettings(config: ArchiveConfig) {
  return {
    host: config.host,
    port: 21,
    user: config.user,
    password: config.password,
    // `true` is explicit FTPS (AUTH TLS on the control port), matching the
    // `ftp:ssl-force` + port 21 setup used for the database backups.
    secure: true as const,
    secureOptions: {
      rejectUnauthorized: config.verifyCertificate,
      servername: config.host,
    },
  };
}

function toRemoteEntries(listing: FileInfo[]): RemoteEntry[] {
  return listing
    .filter((item) => item.isFile)
    .map((item) => ({
      name: item.name,
      sizeBytes: item.size,
      modifiedAtMs: item.modifiedAt ? item.modifiedAt.getTime() : null,
    }));
}

/** Rejects after `ms`, so a hung socket cannot pin the serverless function. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function reasonOf(error: unknown): string {
  if (error instanceof Error) {
    // FTP errors can echo the server banner; keep only a short, safe token.
    return error.message.slice(0, 120).replace(/\s+/g, " ");
  }
  return "unknown_error";
}

function sourceSize(source: ArchiveSource): number {
  return source.kind === "file" ? source.sizeBytes : source.bytes.byteLength;
}

async function deletePlanned(
  client: Client,
  config: ArchiveConfig,
  names: string[],
): Promise<number> {
  let deleted = 0;
  for (const name of names) {
    try {
      // `true` ignores "no such file" — a concurrent export may have already
      // removed it, which is not an error worth aborting the run for.
      await client.remove(remotePath(config.remoteDir, name), true);
      deleted += 1;
    } catch {
      // Keep pruning; one undeletable file should not block the rest.
    }
  }
  return deleted;
}

/**
 * Connects, prunes to satisfy the retention window and size cap, then uploads
 * the archive under a `.part` name and renames it into place. The rename is
 * what makes an interrupted upload harmless: readers and the pruner only ever
 * see complete archives under the final name.
 */
export async function uploadArchive(
  config: ArchiveConfig,
  source: ArchiveSource,
  nowMs: number = Date.now(),
): Promise<ArchiveOutcome> {
  const incomingBytes = sourceSize(source);

  if (incomingBytes <= 0) {
    return { status: "skipped", reason: "empty_archive" };
  }

  if (incomingBytes > config.maxArchiveBytes) {
    return { status: "skipped", reason: "exceeds_max_file_bytes" };
  }

  const client = new Client(config.operationTimeoutMs);
  client.ftp.verbose = false;

  const run = async (): Promise<ArchiveOutcome> => {
    await client.access(connectionSettings(config));
    await client.ensureDir(config.remoteDir);

    let entries: RemoteEntry[] = [];
    try {
      entries = toRemoteEntries(await client.list(config.remoteDir));
    } catch {
      // A folder we just created can list as an error on some servers. Treat an
      // unreadable listing as empty: we lose one pruning pass, and the nightly
      // workflow is the backstop. We do NOT skip the upload for this.
      entries = [];
    }

    const plan = planRetention({
      entries,
      incomingBytes,
      nowMs,
      retentionDays: config.retentionDays,
      totalCapBytes: config.totalCapBytes,
      partialMaxAgeMs: config.partialMaxAgeMs,
    });

    await deletePlanned(client, config, plan.deleteNames);

    if (!plan.canUpload) {
      return { status: "skipped", reason: plan.skipReason ?? "cap_exceeded" };
    }

    const filename = makeArchiveFilename(nowMs);
    const finalPath = remotePath(config.remoteDir, filename);
    const partialPath = `${finalPath}${ARCHIVE_PARTIAL_SUFFIX}`;

    try {
      if (source.kind === "file") {
        await client.uploadFrom(source.path, partialPath);
      } else {
        await client.uploadFrom(Readable.from([Buffer.from(source.bytes)]), partialPath);
      }
      await client.rename(partialPath, finalPath);
    } catch (error) {
      // Leave nothing half-written behind; the sweeper would eventually get it,
      // but an immediate cleanup keeps the cap accounting honest.
      await client.remove(partialPath, true).catch(() => {});
      throw error;
    }

    return { status: "uploaded", filename, sizeBytes: incomingBytes, plan };
  };

  try {
    return await withTimeout(run(), config.totalTimeoutMs, "ftp_archive");
  } catch (error) {
    return { status: "failed", reason: reasonOf(error) };
  } finally {
    client.close();
  }
}

/**
 * Prune-only pass: applies the retention window and size cap without uploading.
 * Used by the scheduled workflow and available for manual runs.
 */
export async function pruneArchive(
  config: ArchiveConfig,
  nowMs: number = Date.now(),
): Promise<
  | { status: "pruned"; deleted: number; plan: RetentionPlan }
  | { status: "failed"; reason: string }
> {
  const client = new Client(config.operationTimeoutMs);
  client.ftp.verbose = false;

  const run = async () => {
    await client.access(connectionSettings(config));
    await client.ensureDir(config.remoteDir);

    const entries = toRemoteEntries(await client.list(config.remoteDir));
    const plan = planRetention({
      entries,
      incomingBytes: 0,
      nowMs,
      retentionDays: config.retentionDays,
      totalCapBytes: config.totalCapBytes,
      partialMaxAgeMs: config.partialMaxAgeMs,
    });

    const deleted = await deletePlanned(client, config, plan.deleteNames);
    return { status: "pruned" as const, deleted, plan };
  };

  try {
    return await withTimeout(run(), config.totalTimeoutMs, "ftp_prune");
  } catch (error) {
    return { status: "failed" as const, reason: reasonOf(error) };
  } finally {
    client.close();
  }
}
