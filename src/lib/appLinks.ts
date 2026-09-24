import * as Linking from "expo-linking";

/** Deep link to open an event inside the mobile app (not web). */
export function eventPageLink(eventId: string): string {
  return Linking.createURL(`/event/${eventId}`);
}
