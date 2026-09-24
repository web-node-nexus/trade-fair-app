import { ListScreen } from "@/screens/shared/ListScreen";

/** Generic list wrapper for organizer event sub-sections (bookings, tickets, reports). */
export function OrganizerEventSectionScreen({
  title,
  endpoint,
  emptyMessage,
  labelField = "id",
  subField,
}: {
  title: string;
  endpoint: string;
  emptyMessage: string;
  labelField?: string;
  subField?: string;
}) {
  return (
    <ListScreen
      title={title}
      endpoint={endpoint}
      emptyMessage={emptyMessage}
      labelField={labelField}
      subField={subField}
    />
  );
}
