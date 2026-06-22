// Worker-thread entry for the separate-files export path. Runs on a fresh Node
// thread (loaded via Node's native TypeScript support), builds a renderer that
// embeds the background once, and streams each rendered PDF back to the parent
// as it is produced so the main thread can append + release it immediately.

import { parentPort, workerData } from "node:worker_threads";
import { createSeparateFileRenderer } from "./custom/compositor.ts";
import type { CsvRow } from "./types.ts";
import type {
  CustomFieldBox,
  DesignAsset,
  ExportOptions,
} from "./custom/types.ts";

export type RenderWorkerJob = {
  designBuffer: ArrayBuffer;
  designAsset: DesignAsset;
  fieldBoxes: CustomFieldBox[];
  exportOptions: ExportOptions;
  chunk: Array<{ index: number; row: CsvRow }>;
};

export type RenderWorkerMessage =
  | { type: "result"; index: number; buffer: ArrayBuffer }
  | { type: "done" }
  | { type: "error"; message: string };

async function run(): Promise<void> {
  const port = parentPort;
  if (!port) throw new Error("render-worker must run as a worker thread");

  const { designBuffer, designAsset, fieldBoxes, exportOptions, chunk } =
    workerData as RenderWorkerJob;

  const renderer = await createSeparateFileRenderer({
    designBytes: new Uint8Array(designBuffer),
    designAsset,
    fieldBoxes,
    exportOptions,
  });

  for (const { index, row } of chunk) {
    const bytes = await renderer.renderRow(row);
    // Copy into a standalone ArrayBuffer so it can be transferred (not cloned).
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    const message: RenderWorkerMessage = { type: "result", index, buffer };
    port.postMessage(message, [buffer]);
  }

  const done: RenderWorkerMessage = { type: "done" };
  port.postMessage(done);
}

run().catch((error) => {
  const message: RenderWorkerMessage = {
    type: "error",
    message: error instanceof Error ? error.message : String(error),
  };
  parentPort?.postMessage(message);
});
