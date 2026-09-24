import { Redirect } from "expo-router";
import { defaultRouteForHub } from "@/lib/workspaceNav";

export default function OrganizerHub() {
  return <Redirect href={defaultRouteForHub("/dashboard/organizer")} />;
}
