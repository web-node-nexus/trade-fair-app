import { Redirect } from "expo-router";
import { defaultRouteForHub } from "@/lib/workspaceNav";

export default function AdminHub() {
  return <Redirect href={defaultRouteForHub("/dashboard/admin")} />;
}
