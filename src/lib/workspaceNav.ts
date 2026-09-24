import type { AuthProfile } from "@/context/AuthContext";
import { canAccessAdminRoute } from "@/lib/adminAccess";
import {
  type FeatureItem,
  featuresForHubPath,
  hubMetaForPath,
} from "@/lib/roleFeatures";

export type WorkspaceHubPath =
  | "/dashboard/admin"
  | "/dashboard/organizer"
  | "/dashboard/exhibitor"
  | "/dashboard/visitor"
  | "/dashboard/service-provider"
  | "/dashboard/volunteer"
  | "/dashboard/marketplace";

const HUB_PREFIXES: { prefix: string; hub: WorkspaceHubPath }[] = [
  { prefix: "/dashboard/admin", hub: "/dashboard/admin" },
  { prefix: "/dashboard/organizer", hub: "/dashboard/organizer" },
  { prefix: "/dashboard/exhibitor", hub: "/dashboard/exhibitor" },
  { prefix: "/dashboard/visitor", hub: "/dashboard/visitor" },
  { prefix: "/dashboard/service-provider", hub: "/dashboard/service-provider" },
  { prefix: "/dashboard/volunteer", hub: "/dashboard/volunteer" },
  { prefix: "/dashboard/marketplace", hub: "/dashboard/marketplace" },
];

const DEFAULT_ROUTE: Record<WorkspaceHubPath, string> = {
  "/dashboard/admin": "/dashboard/admin/overview",
  "/dashboard/organizer": "/dashboard/organizer/events",
  "/dashboard/exhibitor": "/dashboard/exhibitor/events",
  "/dashboard/visitor": "/dashboard/visitor/tickets",
  "/dashboard/service-provider": "/dashboard/service-provider/services",
  "/dashboard/volunteer": "/dashboard/volunteer",
  "/dashboard/marketplace": "/dashboard/marketplace",
};

const BOTTOM_TABS: Record<WorkspaceHubPath, string[]> = {
  "/dashboard/admin": [
    "/dashboard/admin/overview",
    "/dashboard/admin/users",
    "/dashboard/admin/kyc",
    "/dashboard/admin/transactions",
    "/dashboard/admin/support",
  ],
  "/dashboard/organizer": [
    "/dashboard/organizer/events",
    "/dashboard/organizer/events/new",
    "/dashboard/organizer/kyc",
    "/dashboard/organizer/payouts",
    "/dashboard/organizer/support",
  ],
  "/dashboard/exhibitor": [
    "/dashboard/exhibitor/events",
    "/dashboard/exhibitor/book",
    "/dashboard/exhibitor/bookings",
    "/dashboard/exhibitor/payments",
    "/dashboard/marketplace",
  ],
  "/dashboard/visitor": [
    "/(tabs)/trade-fairs",
    "/dashboard/visitor/tickets",
    "/dashboard/visitor/receipts",
    "/dashboard/visitor/support",
  ],
  "/dashboard/service-provider": [
    "/dashboard/service-provider/services",
    "/dashboard/service-provider/requests",
    "/dashboard/service-provider/bookings",
    "/dashboard/service-provider/payments",
    "/dashboard/service-provider/support",
  ],
  "/dashboard/volunteer": [
    "/dashboard/volunteer",
    "/dashboard/volunteer/scan",
  ],
  "/dashboard/marketplace": [
    "/dashboard/marketplace",
    "/dashboard/account",
  ],
};

function filterAdmin(items: FeatureItem[], profile: AuthProfile | null) {
  return items.filter((item) => canAccessAdminRoute(profile, item.route));
}

function pickByRoutes(all: FeatureItem[], routes: string[]): FeatureItem[] {
  const map = new Map(all.map((item) => [item.route, item]));
  return routes.map((route) => map.get(route)).filter(Boolean) as FeatureItem[];
}

export function hubPathFromPathname(pathname: string): WorkspaceHubPath | null {
  if (pathname === "/dashboard/account" || pathname === "/dashboard/notifications") return null;
  for (const { prefix, hub } of HUB_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return hub;
  }
  return null;
}

export function defaultRouteForHub(hubPath: string): string {
  if (hubPath in DEFAULT_ROUTE) {
    return DEFAULT_ROUTE[hubPath as WorkspaceHubPath];
  }
  const detected = hubPathFromPathname(hubPath);
  if (detected) return DEFAULT_ROUTE[detected];
  return hubPath;
}

export function defaultRouteForRoles(roles: string[] | undefined | null): string {
  const set = new Set((roles ?? []).map((r) => r.trim().toUpperCase()));
  if (set.has("SUPER_ADMIN") || set.has("SUB_ADMIN")) return DEFAULT_ROUTE["/dashboard/admin"];
  if (set.has("ORGANIZER")) return DEFAULT_ROUTE["/dashboard/organizer"];
  if (set.has("EXHIBITOR")) return DEFAULT_ROUTE["/dashboard/exhibitor"];
  if (set.has("SERVICE_PROVIDER")) return DEFAULT_ROUTE["/dashboard/service-provider"];
  if (set.has("VOLUNTEER")) return DEFAULT_ROUTE["/dashboard/volunteer"];
  // Pure visitors land on Trade Fair Wala public home tabs.
  return "/(tabs)";
}

export function bottomTabsForHub(hubPath: WorkspaceHubPath, profile: AuthProfile | null): FeatureItem[] {
  // Referral stays in drawer / profile — never on the bottom bar
  const all = featuresForHubPath(hubPath, { includeReferral: false });
  const filtered = hubPath === "/dashboard/admin" ? filterAdmin(all, profile) : all;
  const routes = BOTTOM_TABS[hubPath];
  const tabs = pickByRoutes(filtered, routes);
  if (hubPath === "/dashboard/admin") {
    return filterAdmin(tabs, profile);
  }
  return tabs;
}

export function drawerItemsForHub(
  hubPath: WorkspaceHubPath,
  profile: AuthProfile | null
): FeatureItem[] {
  const all = featuresForHubPath(hubPath, { includeReferral: Boolean(profile) });
  const filtered = hubPath === "/dashboard/admin" ? filterAdmin(all, profile) : all;
  const bottomRoutes = new Set(BOTTOM_TABS[hubPath]);
  return filtered.filter((item) => !bottomRoutes.has(item.route));
}

export function isWorkspaceDetailRoute(pathname: string, hubPath: WorkspaceHubPath): boolean {
  if (pathname === hubPath) return false;
  const defaultRoute = defaultRouteForHub(hubPath);
  if (pathname === defaultRoute) return false;
  if (BOTTOM_TABS[hubPath].includes(pathname)) return false;
  return true;
}

export function workspaceMeta(hubPath: WorkspaceHubPath) {
  return hubMetaForPath(hubPath);
}

export { hubMetaForPath };
