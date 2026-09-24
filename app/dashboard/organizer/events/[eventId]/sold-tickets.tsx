import { useLocalSearchParams } from "expo-router";
import { OrganizerEventSectionScreen } from "@/screens/organizer/OrganizerEventSectionScreen";

export default function OrganizerSoldTicketsRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  return (
    <OrganizerEventSectionScreen
      title="Visitor tickets sold"
      endpoint={`/organizer/events/${eventId}/tickets`}
      emptyMessage="No visitor tickets sold yet."
      labelField="ticketTypeName"
      subField="visitorEmail"
    />
  );
}
