import { useLocalSearchParams } from "expo-router";
import { OrganizerEventFormScreen } from "@/screens/organizer/OrganizerEventFormScreen";

export default function OrganizerEditEventRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return <OrganizerEventFormScreen eventId={eventId} />;
}
