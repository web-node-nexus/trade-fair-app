/** Milliseconds when an event is considered finished (uses endsAt, else startsAt). */
export function eventEndMs(ev: { endsAt?: string | null; startsAt: string }): number {
  const raw = ev.endsAt?.trim() || ev.startsAt;
  return new Date(raw).getTime();
}

/** True when the event has not ended yet. */
export function isUpcomingEvent(ev: { endsAt?: string | null; startsAt: string }, at = Date.now()): boolean {
  const end = eventEndMs(ev);
  return Number.isFinite(end) && end > at;
}

export function filterUpcomingEvents<T extends { endsAt?: string | null; startsAt: string }>(list: T[]): T[] {
  return list.filter(isUpcomingEvent);
}
