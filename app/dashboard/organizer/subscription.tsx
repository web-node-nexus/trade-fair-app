import { SubscriptionPlansScreen } from "@/screens/shared/SubscriptionPlansScreen";

export default function OrganizerSubscription() {
  return (
    <SubscriptionPlansScreen roleCode="ORGANIZER" title="Organizer subscription" requireOrganizerKyc />
  );
}
