import { Redirect } from "expo-router";
import { defaultRouteForHub } from "@/lib/workspaceNav";

export default function ExhibitorHub() {
  return <Redirect href={defaultRouteForHub("/dashboard/exhibitor")} />;
}
