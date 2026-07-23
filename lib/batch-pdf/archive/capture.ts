import { Writable } from "node:stream";
import { createWriteStream, type WriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after } from "next/server";

import { getArchiveConfig, type ArchiveConfig } from "./config";
import { uploadArchive, type ArchiveOutcome, type ArchiveSource } from "./ftp-transport";
import { createPdfZip } from "../zip";

/**
 * Capture layer between the export route and the FTPS transport.
 *
 * Two shapes of output exist in the route:
 *
 *   - buffered  — a combined PDF, a single-row PDF, or a small ZIP that is
 *                 already fully in memory;
 *   - streamed  — the separate-files ZIP, which is deliberately never held in
 *                 memory and streams straight to the client.
 *
 * Buffered output is handed over directly. Streamed output is spooled to a
 * temp file as it passes through to the user, then uploaded from disk once the
 * response has been fully written.
 *
 * All work is deferred to `after()` so the user's download is never blocked or
 * slowed by the FTP round trip, and every failure path is swallowed: an
 * unreachable FTP server must not turn a successful export into an error.
 */

const SPOOL_PREFIX = "bcg-archive-";

function logOutcome(outcome: ArchiveOutcome, source: "buffered" | "streamed"): void {
  const base = { evt: "output_archive", source };

  if (outcome.status === "uploaded") {
    console.log(
      JSON.stringify({
        ...base,
        status: outcome.status,
        sizeBytes: outcome.sizeBytes,
        expired: outcome.plan.expiredCount,
        evicted: outcome.plan.evictedCount,
        partials: outcome.plan.partialCount,
        retainedBytes: outcome.plan.retainedBytes,
      }),
    );
    return;
  }

  console.warn(
    JSON.stringify({ ...base, status: outcome.status, reason: outcome.reason }),
  );
}

/**
 * Queues an upload of output that is already fully in memory.
 *
 * `alreadyZip` avoids re-compressing an archive we just built — a ZIP of a ZIP
 * would cost CPU and memory for no benefit. A bare PDF is wrapped so that
 * everything in the remote folder is uniformly a `.zip`, which keeps retention
 * and the nightly prune working on a single file shape.
 */
export function scheduleBufferedArchive(input: {
  bytes: Uint8Array;
  /** Name the file gets inside the ZIP when wrapping is needed. */
  innerFilename: string;
  alreadyZip: boolean;
}): void {
  const config = getArchiveConfig();
  if (!config) return;

  // Cheap pre-check before we commit to holding these bytes past the response.
  if (input.bytes.byteLength <= 0 || input.bytes.byteLength > config.maxArchiveBytes) {
    return;
  }

  try {
    after(async () => {
      try {
        const bytes = input.alreadyZip
          ? input.bytes
          : await createPdfZip([
              { filename: input.innerFilename, bytes: input.bytes },
            ]);

        const outcome = await uploadArchive(config, { kind: "bytes", bytes });
        logOutcome(outcome, "buffered");
      } catch (error) {
        logOutcome(
          {
            status: "failed",
            reason: error instanceof Error ? error.message.slice(0, 120) : "unknown",
          },
          "buffered",
        );
      }
    });
  } catch {
    // `after()` throws if called outside a request scope (e.g. in tests).
    // Archiving is optional; carry on.
  }
}

export type ArchiveSpool = {
  /** Pipe the ZIP stream into this to capture a copy on disk. */
  writable: Writable;
  /** Resolves to the spooled file once complete, or null if it was abandoned. */
  done: Promise<{ path: string; sizeBytes: number } | null>;
  /** Abandons the capture and removes the temp file. */
  abort(error?: Error): void;
};

/**
 * Creates a temp-file sink for the streaming ZIP path.
 *
 * The sink enforces its own byte ceiling. Vercel gives roughly 512 MB of
 * writable `/tmp`, and a 500-row batch with a large background can exceed
 * that, so an oversized export abandons its capture instead of filling the
 * disk out from under the running function.
 *
 * Returns null when no temp file can be opened, which disables capture without
 * affecting the export.
 */
export function createArchiveSpool(config: ArchiveConfig): ArchiveSpool | null {
  const path = join(
    tmpdir(),
    `${SPOOL_PREFIX}${process.pid}-${Date.now()}-${Math.random()
      .toString(16)
      .slice(2, 10)}.zip`,
  );

  let file: WriteStream;
  try {
    file = createWriteStream(path);
  } catch {
    return null;
  }

  let written = 0;
  let settled = false;
  let abandoned = false;
  let resolveDone: (value: { path: string; sizeBytes: number } | null) => void;

  const done = new Promise<{ path: string; sizeBytes: number } | null>((resolve) => {
    resolveDone = resolve;
  });

  const cleanup = () => {
    unlink(path).catch(() => {});
  };

  const settle = (value: { path: string; sizeBytes: number } | null) => {
    if (settled) return;
    settled = true;
    if (value === null) cleanup();
    resolveDone(value);
  };

  const abort = (error?: Error) => {
    if (settled) return;
    abandoned = true;
    file.destroy(error);
    settle(null);
  };

  const writable = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      if (abandoned) {
        callback();
        return;
      }

      written += chunk.length;

      if (written > config.maxArchiveBytes) {
        // Stop consuming disk immediately; the user's download is unaffected
        // because this sink is a separate pipe destination.
        abort();
        callback();
        return;
      }

      // Forwarding the callback to the file stream propagates backpressure, so
      // a slow disk throttles the archiver rather than buffering in memory.
      file.write(chunk, (error) => callback(error ?? null));
    },
    final(callback) {
      if (abandoned) {
        callback();
        return;
      }
      file.end(() => {
        settle({ path, sizeBytes: written });
        callback();
      });
    },
    destroy(error, callback) {
      if (!settled) {
        abandoned = true;
        file.destroy();
        settle(null);
      }
      callback(error);
    },
  });

  file.on("error", () => abort());
  // The sink owns its own failure handling: an unhandled 'error' on a Writable
  // takes down the process, and this stream must never be able to do that.
  writable.on("error", () => settle(null));

  return { writable, done, abort };
}

/**
 * Queues the upload of a spooled streaming export. Must be called during the
 * request so `after()` registers, but resolves only once the response stream
 * has finished writing the spool.
 */
export function scheduleSpooledArchive(
  config: ArchiveConfig,
  spool: ArchiveSpool,
): void {
  try {
    after(async () => {
      let spooled: { path: string; sizeBytes: number } | null = null;
      try {
        spooled = await spool.done;

        if (!spooled) {
          logOutcome({ status: "skipped", reason: "spool_abandoned" }, "streamed");
          return;
        }

        const source: ArchiveSource = {
          kind: "file",
          path: spooled.path,
          sizeBytes: spooled.sizeBytes,
        };
        logOutcome(await uploadArchive(config, source), "streamed");
      } catch (error) {
        logOutcome(
          {
            status: "failed",
            reason: error instanceof Error ? error.message.slice(0, 120) : "unknown",
          },
          "streamed",
        );
      } finally {
        if (spooled) await unlink(spooled.path).catch(() => {});
      }
    });
  } catch {
    spool.abort();
  }
}

/** Convenience for the route: spool only when archiving is actually enabled. */
export function beginStreamedArchive(): {
  config: ArchiveConfig;
  spool: ArchiveSpool;
} | null {
  const config = getArchiveConfig();
  if (!config) return null;

  const spool = createArchiveSpool(config);
  if (!spool) return null;

  return { config, spool };
}
