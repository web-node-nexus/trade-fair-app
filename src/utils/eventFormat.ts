import type { PublicEvent } from "@/api/client";

export function formatDateBadge(iso: string) {
  const d = new Date(iso);
  return {
    day: d.getDate().toString().padStart(2, "0"),
    mon: d.toLocaleString("en", { month: "short" }).toUpperCase(),
  };
}

export function formatEventDateRange(startsAt: string, endsAt?: string) {
  const s = new Date(startsAt);
  const sPart = s.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  if (endsAt) {
    const e = new Date(endsAt);
    const ePart = e.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
    return `${sPart} – ${ePart}`;
  }
  return s.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function eventLocation(e: PublicEvent) {
  const city = e.venueCity?.trim();
  if (city) return `${e.venueName}, ${city}`;
  return e.venueName || "Venue TBA";
}

/** Prefer city (and state) so cards always surface location clearly. */
export function eventCityLabel(e: PublicEvent) {
  const city = e.venueCity?.trim();
  const state = e.venueState?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return e.venueName?.trim() || "Venue TBA";
}

export function formatPriceINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}
