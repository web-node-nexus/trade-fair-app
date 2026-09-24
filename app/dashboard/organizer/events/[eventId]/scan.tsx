import { useLocalSearchParams, useRouter } from "expo-router";
import { GateScanScreen } from "@/screens/shared/GateScanScreen";

export default function OrganizerEventScanRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  return (
    <GateScanScreen
      title="Organizer gate scan"
      scanApiPath={`/organizer/events/${eventId}/entry/scan`}
      onBack={() => router.back()}
    />
  );
}
