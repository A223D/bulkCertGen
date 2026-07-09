/**
 * Decodes CSV file bytes with encoding detection.
 *
 * The browser's FileReader.readAsText defaults to UTF-8. Windows Excel's plain
 * "CSV (Comma delimited)" format uses Windows-1252/ANSI, which corrupts accented
 * characters when decoded as UTF-8 (producing U+FFFD replacement chars).
 *
 * Strategy:
 *   1. If the file starts with a UTF-8 BOM (EF BB BF), decode as UTF-8, strip BOM.
 *   2. Else, try strict UTF-8 decode; if it fails or produces U+FFFD, fall back to Windows-1252.
 */

export function decodeCsvBytes(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);

  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return new TextDecoder("utf-8").decode(bytes.slice(3));
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    if (!text.includes("\ufffd")) {
      return text;
    }
  } catch {
    // UTF-8 fatal decode threw — invalid UTF-8 byte sequence
  }

  return new TextDecoder("windows-1252").decode(bytes);
}
