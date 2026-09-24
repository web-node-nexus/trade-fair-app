import type { EventOrganizer } from "@/api/types";

type EventDetailApi = {
  organizer?: EventOrganizer | null;
  event?: { organizer?: EventOrganizer | null } | null;
};

/** Read organiser from GET /events/:id — supports top-level or nested on event. */
export function parseEventOrganizer(data: EventDetailApi): EventOrganizer | null {
  const o = data.organizer ?? data.event?.organizer ?? null;
  if (!o) return null;
  if (!o.name && !o.email && !o.phone) return null;
  return o;
}
