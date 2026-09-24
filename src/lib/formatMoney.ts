export function formatInrFromMinor(minor: string | number): string {
  const n = Number(minor);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${(n / 100).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}
