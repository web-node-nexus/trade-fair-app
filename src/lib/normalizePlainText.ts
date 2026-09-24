/**
 * Force clipboard / typed text into the app’s normal plain text.
 * Fancy Unicode “fonts” (Canva, Instagram, WhatsApp styles) are mapped to A–Z / a–z / 0–9.
 */

function mapMathAlphanumeric(code: number): string | null {
  if (code >= 0x1d400 && code <= 0x1d419) return String.fromCharCode(0x41 + (code - 0x1d400));
  if (code >= 0x1d41a && code <= 0x1d433) return String.fromCharCode(0x61 + (code - 0x1d41a));
  if (code >= 0x1d434 && code <= 0x1d44d) return String.fromCharCode(0x41 + (code - 0x1d434));
  if (code >= 0x1d44e && code <= 0x1d467) return String.fromCharCode(0x61 + (code - 0x1d44e));
  if (code >= 0x1d468 && code <= 0x1d481) return String.fromCharCode(0x41 + (code - 0x1d468));
  if (code >= 0x1d482 && code <= 0x1d49b) return String.fromCharCode(0x61 + (code - 0x1d482));
  const letterBlocks: Array<[number, number, number]> = [
    [0x1d49c, 0x1d4b5, 0x41],
    [0x1d4b6, 0x1d4cf, 0x61],
    [0x1d4d0, 0x1d4e9, 0x41],
    [0x1d4ea, 0x1d503, 0x61],
    [0x1d504, 0x1d51d, 0x41],
    [0x1d51e, 0x1d537, 0x61],
    [0x1d538, 0x1d551, 0x41],
    [0x1d552, 0x1d56b, 0x61],
    [0x1d56c, 0x1d585, 0x41],
    [0x1d586, 0x1d59f, 0x61],
    [0x1d5a0, 0x1d5b9, 0x41],
    [0x1d5ba, 0x1d5d3, 0x61],
    [0x1d5d4, 0x1d5ed, 0x41],
    [0x1d5ee, 0x1d607, 0x61],
    [0x1d608, 0x1d621, 0x41],
    [0x1d622, 0x1d63b, 0x61],
    [0x1d63c, 0x1d655, 0x41],
    [0x1d656, 0x1d66f, 0x61],
    [0x1d670, 0x1d689, 0x41],
    [0x1d68a, 0x1d6a3, 0x61],
  ];
  for (const [start, end, base] of letterBlocks) {
    if (code >= start && code <= end) return String.fromCharCode(base + (code - start));
  }
  const digitBlocks: Array<[number, number]> = [
    [0x1d7ce, 0x1d7d7],
    [0x1d7d8, 0x1d7e1],
    [0x1d7e2, 0x1d7eb],
    [0x1d7ec, 0x1d7f5],
    [0x1d7f6, 0x1d7ff],
  ];
  for (const [start, end] of digitBlocks) {
    if (code >= start && code <= end) return String.fromCharCode(0x30 + (code - start));
  }
  return null;
}

function stripHtml(raw: string): string {
  return raw
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/g, "'");
}

export function normalizePlainText(input: string): string {
  if (!input) return input;
  let s = stripHtml(String(input));
  try {
    s = s.normalize("NFKC");
  } catch {
    /* ignore */
  }
  s = s.replace(/[\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u2069\uFEFF]/g, "");

  let out = "";
  for (const ch of s) {
    const code = ch.codePointAt(0);
    if (code == null) continue;
    if (code >= 0x1d400 && code <= 0x1d7ff) {
      out += mapMathAlphanumeric(code) ?? "";
      continue;
    }
    if (code >= 0x24b6 && code <= 0x24cf) {
      out += String.fromCharCode(0x41 + (code - 0x24b6));
      continue;
    }
    if (code >= 0x24d0 && code <= 0x24e9) {
      out += String.fromCharCode(0x61 + (code - 0x24d0));
      continue;
    }
    out += ch;
  }
  return out;
}
