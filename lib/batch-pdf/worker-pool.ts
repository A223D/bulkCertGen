// Bounded worker-thread pool for the separate-files export path. Spreads per-row
// PDF rendering across CPU cores. Disabled by default and gated behind an env
// flag; callers fall back to the in-process bounded path when it is off or the
// batch is too small to amortize worker startup.
//
// Land this only after the per-row image embedding is reused (see
// createSeparateFileRenderer) so workers don't each repeat the full image
// decode and multiply memory.

import os from "node:os";
import path from "node:path";
import { Worker } from "node:worker_threads";
import type { CsvRow } from "./types.ts";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "./custom/types.ts";
import type {
  RenderWorkerJob,
  RenderWorkerMessage,
} from "./render-worker.ts";

// Below this row count, in-process rendering beats worker startup overhead.
export const WORKER_ROW_THRESHOLD = 50;

const DEFAULT_POOL_SIZE = 4;

function cpuCount(): number {
  return Math.max(1, os.cpus().length);
}

/** Workers are opt-in: enabled only when CUSTOM_EXPORT_WORKERS is truthy. */
export function workersEnabled(): boolean {
  const raw = process.env.CUSTOM_EXPORT_WORKERS;
  if (!raw) return false;
  const normalized = raw.trim().toLowerCase();
  return normalized !== "" && normalized !== "0" && normalized !== "false";
}

/**
 * Pool size from CUSTOM_EXPORT_WORKERS: a positive integer is used directly
 * (capped at the CPU count); any other truthy value falls back to the default.
 */
export function getWorkerPoolSize(): number {
  const raw = process.env.CUSTOM_EXPORT_WORKERS;
  const parsed = raw ? Number.parseInt(raw, 10) : Number.NaN;
  const limit = Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POOL_SIZE;
  return Math.min(limit, cpuCount());
}

// Resolve the worker source on disk. The worker runs raw .ts via Node's native
// TypeScript support, so the path must point at the real source file (not a
// bundled chunk). In this self-hosted setup the process runs from the repo root.
function resolveWorkerPath(): string {
  const override = process.env.CUSTOM_EXPORT_WORKER_PATH;
  if (override) return override;
  return path.join(process.cwd(), "lib", "batch-pdf", "render-worker.ts");
}

/**
 * Renders one PDF per row across a worker pool. `onResult` is invoked on the
 * main thread as each PDF arrives (with its original row index), so callers can
 * stream it into a ZIP and drop the bytes. Resolves once every row is rendered.
 */
export async function renderSeparateFilesWithWorkers(args: {
  designBytes: Uint8Array;
  designAsset: DesignAsset;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  rows: CsvRow[];
  poolSize: number;
  onResult: (index: number, bytes: Uint8Array) => void;
}): Promise<void> {
  const {
    designBytes,
    designAsset,
    fieldBoxes,
    exportOptions,
    rows,
    poolSize,
    onResult,
  } = args;

  if (rows.length === 0) return;

  const size = Math.max(1, Math.min(poolSize, rows.length));

  // Round-robin assignment so each worker gets an interleaved slice of rows —
  // keeps load even when per-row cost varies.
  const chunks: Array<Array<{ index: number; row: CsvRow }>> = Array.from(
    { length: size },
    () => [],
  );
  for (let i = 0; i < rows.length; i++) {
    chunks[i % size].push({ index: i, row: rows[i] });
  }

  const workerPath = resolveWorkerPath();

  await Promise.all(
    chunks
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => runChunk(chunk, workerPath)),
  );

  function runChunk(
    chunk: Array<{ index: number; row: CsvRow }>,
    filePath: string,
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      // Each worker gets its own copy of the design bytes (transfer detaches the
      // buffer). slice() allocates an exact-sized standalone ArrayBuffer.
      const copy = designBytes.slice();
      const designBuffer = copy.buffer;

      const job: RenderWorkerJob = {
        designBuffer,
        designAsset,
        fieldBoxes,
        exportOptions,
        chunk,
      };

      const worker = new Worker(filePath, {
        workerData: job,
        transferList: [designBuffer],
        // Native TS loading from a typeless package warns about a reparse; mute it.
        execArgv: ["--disable-warning=MODULE_TYPELESS_PACKAGE_JSON"],
      });

      let settled = false;
      const finish = (fn: () => void) => {
        if (settled) return;
        settled = true;
        void worker.terminate();
        fn();
      };

      worker.on("message", (message: RenderWorkerMessage) => {
        if (message.type === "result") {
          onResult(message.index, new Uint8Array(message.buffer));
        } else if (message.type === "done") {
          finish(resolve);
        } else if (message.type === "error") {
          finish(() => reject(new Error(message.message)));
        }
      });

      worker.on("error", (error) => finish(() => reject(error)));
      worker.on("exit", (code) => {
        if (code !== 0) {
          finish(() => reject(new Error(`render worker exited with code ${code}`)));
        }
      });
    });
  }
}
