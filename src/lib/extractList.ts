/** Extract array payload from common API response shapes. */
export function extractList(data: Record<string, unknown>): Record<string, unknown>[] {
  const keys = [
    "tickets",
    "receipts",
    "events",
    "bookings",
    "services",
    "requests",
    "notifications",
    "users",
    "transactions",
    "refunds",
    "flags",
    "banners",
    "plans",
    "reviews",
    "payments",
    "documents",
    "kyc",
    "tickets",
    "items",
    "stallTypes",
    "stalls",
    "ticketTypes",
    "announcements",
    "reminders",
    "volunteers",
    "messages",
    "queries",
    "disputes",
    "featured",
    "subAdmins",
    "templates",
    "codes",
    "ledger",
    "draftEvents",
    "draftServices",
  ];
  for (const k of keys) {
    const v = data[k];
    if (Array.isArray(v)) return v as Record<string, unknown>[];
  }
  return [];
}

export function extractObject(data: Record<string, unknown>, key: string): Record<string, unknown> | null {
  const v = data[key];
  if (v && typeof v === "object" && !Array.isArray(v)) return v as Record<string, unknown>;
  return null;
}
