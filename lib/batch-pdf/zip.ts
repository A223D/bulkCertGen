import JSZip from "jszip";
import { Readable } from "node:stream";
import { createRequire } from "node:module";
import type { Archiver } from "archiver";

// archiver (v7) is CommonJS exporting a factory function. Its ESM default
// interop is unreliable across our loaders (Next bundler vs. esbuild/vitest),
// so load it via require to get the real callable module.exports.
type ArchiverFactory = (
  format: string,
  options?: { zlib?: { level?: number } },
) => Archiver;
const require = createRequire(import.meta.url);
const archiver = require("archiver") as unknown as ArchiverFactory;

/**
 * Appends one file's bytes to the streaming archive. Implementations copy the
 * bytes into the archive's pipeline so the caller may drop its reference.
 */
export type ZipAppend = (filename: string, bytes: Uint8Array) => void;

/**
 * Builds a ZIP as a streaming Web ReadableStream instead of buffering the whole
 * archive in memory. `produce` is invoked with an `append` callback; it should
 * render and append each file as it becomes ready (dropping the bytes after),
 * then resolve once every file has been appended. The archive is finalized
 * automatically.
 *
 * Because the response streams as it is built, an error thrown by `produce`
 * after the first bytes have flushed truncates the archive (the HTTP status is
 * already committed). Callers should validate up front (e.g. preflight) so that
 * render-time failures are rare.
 */
export function createPdfZipStream(
  produce: (append: ZipAppend) => Promise<void>,
): ReadableStream<Uint8Array> {
  const archive = archiver("zip", { zlib: { level: 6 } });

  const append: ZipAppend = (filename, bytes) => {
    // Buffer.from copies into archiver's pipeline; the source array can now be
    // garbage collected once the caller releases it.
    archive.append(Buffer.from(bytes), { name: filename });
  };

  void (async () => {
    try {
      await produce(append);
      await archive.finalize();
    } catch (error) {
      archive.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return Readable.toWeb(archive) as unknown as ReadableStream<Uint8Array>;
}

export async function createPdfZip(
  files: Array<{
    filename: string;
    bytes: Uint8Array;
  }>,
): Promise<Uint8Array> {
  if (files.length === 0) {
    throw new Error("Add at least one PDF before creating a ZIP.");
  }

  const zip = new JSZip();

  for (const file of files) {
    zip.file(file.filename, file.bytes);
  }

  return zip.generateAsync({ type: "uint8array" });
}
