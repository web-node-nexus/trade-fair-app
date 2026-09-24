import { useLocalSearchParams, useRouter } from "expo-router";
import { GateScanScreen } from "@/screens/shared/GateScanScreen";

export default function VolunteerEventScanRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();

  return (
    <GateScanScreen
      title="Scan visitor tickets"
      scanApiPath={`/volunteer/events/${eventId}/entry/scan`}
      onBack={() => router.back()}
    />
  );
}
