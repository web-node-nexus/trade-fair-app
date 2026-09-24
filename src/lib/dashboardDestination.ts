export type SignupAccountType = "visitor" | "exhibitor" | "organizer" | "service_provider";

import { defaultRouteForHub, defaultRouteForRoles } from "@/lib/workspaceNav";

export function dashboardPathForRoles(roles: string[] | undefined | null): string {
  return defaultRouteForRoles(roles);
}

export function dashboardPathForAccountType(accountType: SignupAccountType): string {
  switch (accountType) {
    case "organizer":
      return defaultRouteForHub("/dashboard/organizer");
    case "exhibitor":
      return defaultRouteForHub("/dashboard/exhibitor");
    case "service_provider":
      return defaultRouteForHub("/dashboard/service-provider");
    case "visitor":
    default:
      return "/(tabs)";
  }
}
