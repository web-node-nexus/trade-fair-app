function escapeCell(value: unknown): string {
  const s = value == null ? "" : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(rows: Record<string, unknown>[]): string {
  if (!rows.length) return "";
  const keys = [...new Set(rows.flatMap((r) => Object.keys(r)))];
  const header = keys.map(escapeCell).join(",");
  const body = rows.map((row) => keys.map((k) => escapeCell(row[k])).join(",")).join("\n");
  return `${header}\n${body}`;
}
