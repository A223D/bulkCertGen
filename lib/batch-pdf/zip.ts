import JSZip from "jszip";
import { PassThrough, Readable, type Writable } from "node:stream";
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
 *
 * An optional `tap` receives a second copy of the archive bytes (used to spool
 * a copy for the output archive). It is a peer pipe destination, so Node
 * applies backpressure from whichever consumer is slower and neither copy is
 * buffered without bound. A failing tap is unpiped and never affects the
 * response.
 */
export function createPdfZipStream(
  produce: (append: ZipAppend) => Promise<void>,
  options?: { tap?: Writable },
): ReadableStream<Uint8Array> {
  const archive = archiver("zip", { zlib: { level: 6 } });
  const tap = options?.tap;

  const append: ZipAppend = (filename, bytes) => {
    // Buffer.from copies into archiver's pipeline; the source array can now be
    // garbage collected once the caller releases it.
    archive.append(Buffer.from(bytes), { name: filename });
  };

  // With a tap, the response reads from a passthrough rather than the archiver
  // itself, so both destinations are ordinary pipe targets.
  let output: Readable = archive;

  if (tap) {
    const passthrough = new PassThrough();
    archive.pipe(passthrough);
    archive.pipe(tap);

    // `pipe()` does not forward source errors to its destinations. Without this
    // handler an archiver failure would leave the response stream open forever
    // (the reader never sees end or error) and the process would crash on an
    // unhandled 'error' event.
    archive.on("error", (error: Error) => {
      passthrough.destroy(error);
      // A truncated archive must never be retained as if it were complete.
      tap.destroy(error);
    });

    // Losing the tap (disk full, size ceiling hit) must not disturb the
    // response, and a cancelled response must not leave the tap half-written.
    tap.on("error", () => archive.unpipe(tap));
    passthrough.on("error", () => archive.unpipe(passthrough));
    output = passthrough;
  }

  void (async () => {
    try {
      await produce(append);
      await archive.finalize();
    } catch (error) {
      archive.destroy(error instanceof Error ? error : new Error(String(error)));
    }
  })();

  return Readable.toWeb(output) as unknown as ReadableStream<Uint8Array>;
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
