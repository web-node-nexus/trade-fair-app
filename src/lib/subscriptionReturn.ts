/** Safe internal return path after subscription checkout (mobile). */

export const ORGANIZER_SUBSCRIPTION_PATH = "/dashboard/organizer/subscription";
export const SERVICE_PROVIDER_SUBSCRIPTION_PATH = "/dashboard/service-provider/subscription";

const SUBSCRIPTION_PATHS = [ORGANIZER_SUBSCRIPTION_PATH, SERVICE_PROVIDER_SUBSCRIPTION_PATH] as const;

export type AppHref = string | { pathname: string; params?: Record<string, string> };

export function isSubscriptionPath(path: string): boolean {
  const bare = path.split("?")[0] ?? path;
  return SUBSCRIPTION_PATHS.some((p) => bare === p || bare.startsWith(`${p}/`));
}

export function isSafeAppReturnPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  if (path.includes("://")) return false;
  return true;
}

export function subscriptionPathForRole(role: "ORGANIZER" | "SERVICE_PROVIDER"): string {
  return role === "ORGANIZER" ? ORGANIZER_SUBSCRIPTION_PATH : SERVICE_PROVIDER_SUBSCRIPTION_PATH;
}

export function withSubscriptionReturnTo(subscriptionPath: string, returnTo?: string | null): AppHref {
  const base = (subscriptionPath.split("?")[0] || subscriptionPath).trim() || ORGANIZER_SUBSCRIPTION_PATH;
  const from = (returnTo ?? "").trim();
  if (!from || !isSafeAppReturnPath(from) || isSubscriptionPath(from)) return base;
  return { pathname: base, params: { returnTo: from } };
}

export function parseReturnToParam(raw: string | string[] | null | undefined): string | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return null;
  let decoded = value.trim();
  try {
    decoded = decodeURIComponent(decoded);
  } catch {
    /* keep raw */
  }
  if (!isSafeAppReturnPath(decoded) || isSubscriptionPath(decoded)) return null;
  return decoded;
}

/** If `route` is a subscription screen, attach returnTo from the current path. */
export function routeWithSubscriptionReturn(route: string, currentPath?: string | null): AppHref {
  if (!isSubscriptionPath(route)) return route;
  return withSubscriptionReturnTo(route, currentPath);
}
