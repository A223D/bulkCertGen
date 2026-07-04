const CONTROL_CHARS_EXCEPT_TAB = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g;
const LINE_BREAKS = /\r\n|\r|\n/g;
const SPACES = /[ \t]+/g;

export function normalizePrintableText(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .replace(LINE_BREAKS, " ")
    .replace(CONTROL_CHARS_EXCEPT_TAB, " ")
    .replace(SPACES, " ")
    .trim();
}
