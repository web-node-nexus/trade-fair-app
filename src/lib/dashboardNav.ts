export type DashboardNavItem = { href: string; label: string };

const ORGANIZER_ITEM: DashboardNavItem = { href: "/dashboard/organizer", label: "Dashboard" };
const EXHIBITOR_ITEM: DashboardNavItem = { href: "/dashboard/exhibitor", label: "Dashboard" };
const SERVICE_PROVIDER_ITEM: DashboardNavItem = { href: "/dashboard/service-provider", label: "Dashboard" };
const VOLUNTEER_ITEM: DashboardNavItem = { href: "/dashboard/volunteer", label: "Dashboard" };
const ADMIN_ITEM: DashboardNavItem = { href: "/dashboard/admin", label: "Dashboard" };

/** Role name for workspace switchers when multiple hubs share the "Dashboard" label. */
export function hubSwitchLabel(href: string): string {
  if (href.includes("/admin")) return "Admin";
  if (href.includes("/organizer")) return "Organizer";
  if (href.includes("/exhibitor")) return "Exhibitor";
  if (href.includes("/service-provider")) return "Service provider";
  if (href.includes("/volunteer")) return "Volunteer";
  if (href.includes("/visitor")) return "Visitor";
  if (href.includes("/marketplace")) return "Marketplace";
  return "Dashboard";
}

function dedupePush(out: DashboardNavItem[], item: DashboardNavItem) {
  if (!out.some((x) => x.href === item.href)) out.push(item);
}

export function buildDashboardNavItems(roleCodes: string[] | undefined | null): DashboardNavItem[] {
  const rolesUpper = new Set((roleCodes ?? []).map((r) => String(r).trim().toUpperCase()).filter(Boolean));
  const out: DashboardNavItem[] = [];

  if (rolesUpper.has("ORGANIZER")) {
    dedupePush(out, ORGANIZER_ITEM);
    dedupePush(out, { href: "/dashboard/marketplace", label: "Service providers" });
  }
  if (rolesUpper.has("EXHIBITOR")) {
    dedupePush(out, EXHIBITOR_ITEM);
    dedupePush(out, { href: "/dashboard/exhibitor/bookings", label: "My bookings" });
    dedupePush(out, { href: "/dashboard/marketplace/my-enquiries", label: "Service enquiries" });
  }
  if (rolesUpper.has("SERVICE_PROVIDER")) {
    dedupePush(out, SERVICE_PROVIDER_ITEM);
    dedupePush(out, { href: "/dashboard/service-provider/subscription", label: "Subscription" });
  }
  if (rolesUpper.has("VOLUNTEER")) dedupePush(out, VOLUNTEER_ITEM);
  if (rolesUpper.has("SUPER_ADMIN") || rolesUpper.has("SUB_ADMIN")) dedupePush(out, ADMIN_ITEM);

  dedupePush(out, { href: "/dashboard/notifications", label: "Announcements" });

  return out;
}
