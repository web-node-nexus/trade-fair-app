import { Redirect } from "expo-router";
import { defaultRouteForHub } from "@/lib/workspaceNav";

export default function ServiceProviderHub() {
  return <Redirect href={defaultRouteForHub("/dashboard/service-provider")} />;
}
