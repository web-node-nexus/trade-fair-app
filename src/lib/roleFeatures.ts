import type { Ionicons } from "@expo/vector-icons";

export type FeatureItem = {
  title: string;
  subtitle: string;
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent?: string;
};

export const SHARED_FEATURES: FeatureItem[] = [
  {
    title: "FAQ",
    subtitle: "Common questions",
    route: "/pages/faq",
    icon: "help-circle-outline",
  },
  {
    title: "Alerts",
    subtitle: "Organizer & platform updates",
    route: "/dashboard/notifications",
    icon: "notifications-outline",
    accent: "#5b21b6",
  },
  {
    title: "Account",
    subtitle: "Profile & settings",
    route: "/dashboard/account",
    icon: "person-circle-outline",
  },
];

/** Logged-in only — append in profile / hub drawers when authenticated. */
export const REFERRAL_FEATURE: FeatureItem = {
  title: "Refer & earn",
  subtitle: "Share code · get 100 points",
  route: "/dashboard/referral",
  icon: "gift-outline",
  accent: "#5b21b6",
};

export const VISITOR_FEATURES: FeatureItem[] = [
  {
    title: "Fairs",
    subtitle: "Discover exhibitions",
    route: "/(tabs)/trade-fairs",
    icon: "calendar-outline",
    accent: "#0369a1",
  },
  {
    title: "Passes",
    subtitle: "QR tickets for gate entry",
    route: "/dashboard/visitor/tickets",
    icon: "qr-code-outline",
    accent: "#059669",
  },
  {
    title: "Receipts",
    subtitle: "Payment history",
    route: "/dashboard/visitor/receipts",
    icon: "receipt-outline",
    accent: "#e23744",
  },
  {
    title: "Support",
    subtitle: "Help & tickets",
    route: "/dashboard/visitor/support",
    icon: "help-circle-outline",
    accent: "#0f766e",
  },
];

export const EXHIBITOR_FEATURES: FeatureItem[] = [
  {
    title: "Events",
    subtitle: "Find fairs to exhibit",
    route: "/dashboard/exhibitor/events",
    icon: "search-outline",
    accent: "#059669",
  },
  {
    title: "Book stalls",
    subtitle: "Reserve booth space",
    route: "/dashboard/exhibitor/book",
    icon: "grid-outline",
    accent: "#0f766e",
  },
  {
    title: "Bookings",
    subtitle: "Stall reservations",
    route: "/dashboard/exhibitor/bookings",
    icon: "bookmark-outline",
    accent: "#0369a1",
  },
  {
    title: "Payments",
    subtitle: "Transactions & invoices",
    route: "/dashboard/exhibitor/payments",
    icon: "card-outline",
    accent: "#e23744",
  },
  {
    title: "Profile",
    subtitle: "Company & catalog",
    route: "/dashboard/exhibitor/profile",
    icon: "business-outline",
    accent: "#065f46",
  },
  {
    title: "Service enquiries",
    subtitle: "Messages with providers",
    route: "/dashboard/marketplace/my-enquiries",
    icon: "chatbox-ellipses-outline",
    accent: "#7c3aed",
  },
  {
    title: "Accepted contracts",
    subtitle: "Confirmed service deals",
    route: "/dashboard/exhibitor/accepted-contracts",
    icon: "document-text-outline",
  },
  {
    title: "Support",
    subtitle: "Get help",
    route: "/dashboard/exhibitor/support",
    icon: "help-buoy-outline",
  },
];

export const ORGANIZER_FEATURES: FeatureItem[] = [
  {
    title: "Events",
    subtitle: "Manage trade fairs",
    route: "/dashboard/organizer/events",
    icon: "calendar-outline",
  },
  {
    title: "All Exhibitors List",
    subtitle: "Contact stall bookers",
    route: "/dashboard/organizer/exhibitors",
    icon: "people-outline",
  },
  {
    title: "Create event",
    subtitle: "Publish a new fair",
    route: "/dashboard/organizer/events/new",
    icon: "add-circle-outline",
  },
  {
    title: "KYC",
    subtitle: "Verification documents",
    route: "/dashboard/organizer/kyc",
    icon: "document-text-outline",
  },
  {
    title: "Payouts",
    subtitle: "Bank & settlement",
    route: "/dashboard/organizer/payouts",
    icon: "wallet-outline",
  },
  {
    title: "Subscription",
    subtitle: "Plans & billing",
    route: "/dashboard/organizer/subscription",
    icon: "ribbon-outline",
  },
  {
    title: "Support",
    subtitle: "Organizer help desk",
    route: "/dashboard/organizer/support",
    icon: "headset-outline",
  },
];

export const SERVICE_PROVIDER_FEATURES: FeatureItem[] = [
  {
    title: "Services",
    subtitle: "Listings & pricing",
    route: "/dashboard/service-provider/services",
    icon: "layers-outline",
    accent: "#5b21b6",
  },
  {
    title: "Enquiries",
    subtitle: "Incoming requests",
    route: "/dashboard/service-provider/requests",
    icon: "mail-unread-outline",
    accent: "#7c3aed",
  },
  {
    title: "Accepted contracts",
    subtitle: "Confirmed deals",
    route: "/dashboard/service-provider/accepted-contracts",
    icon: "document-text-outline",
    accent: "#059669",
  },
  {
    title: "Bookings",
    subtitle: "Confirmed jobs",
    route: "/dashboard/service-provider/bookings",
    icon: "checkmark-done-outline",
    accent: "#0369a1",
  },
  {
    title: "Payments",
    subtitle: "Earnings",
    route: "/dashboard/service-provider/payments",
    icon: "cash-outline",
    accent: "#e23744",
  },
  {
    title: "Reviews",
    subtitle: "Ratings from clients",
    route: "/dashboard/service-provider/reviews",
    icon: "star-outline",
    accent: "#b45309",
  },
  {
    title: "Subscription",
    subtitle: "Provider plan",
    route: "/dashboard/service-provider/subscription",
    icon: "diamond-outline",
  },
  {
    title: "Profile",
    subtitle: "Public provider page",
    route: "/dashboard/service-provider/profile",
    icon: "id-card-outline",
  },
  {
    title: "KYC",
    subtitle: "Verification documents",
    route: "/dashboard/service-provider/kyc",
    icon: "shield-checkmark-outline",
  },
  {
    title: "Support",
    subtitle: "Contact platform",
    route: "/dashboard/service-provider/support",
    icon: "help-circle-outline",
  },
];

export const VOLUNTEER_FEATURES: FeatureItem[] = [
  {
    title: "Assigned events",
    subtitle: "Fairs you support",
    route: "/dashboard/volunteer",
    icon: "people-outline",
  },
  {
    title: "Gate scan",
    subtitle: "QR entry scanning",
    route: "/dashboard/volunteer/scan",
    icon: "scan-outline",
  },
];

export const ADMIN_FEATURES: FeatureItem[] = [
  { title: "Overview", subtitle: "Platform summary", route: "/dashboard/admin/overview", icon: "speedometer-outline" },
  { title: "Users", subtitle: "Accounts", route: "/dashboard/admin/users", icon: "people-outline" },
  { title: "KYC queue", subtitle: "Verification", route: "/dashboard/admin/kyc", icon: "shield-checkmark-outline" },
  { title: "Sub-admins", subtitle: "Team & scopes", route: "/dashboard/admin/sub-admins", icon: "person-add-outline" },
  { title: "RBAC", subtitle: "Permission matrix", route: "/dashboard/admin/rbac", icon: "key-outline" },
  { title: "Transactions", subtitle: "Ledger", route: "/dashboard/admin/transactions", icon: "swap-horizontal-outline" },
  { title: "Refunds", subtitle: "Pending refunds", route: "/dashboard/admin/refunds", icon: "return-down-back-outline" },
  { title: "Disputes", subtitle: "Payment disputes", route: "/dashboard/admin/disputes", icon: "alert-circle-outline" },
  { title: "Monetization", subtitle: "Plans & codes", route: "/dashboard/admin/monetization", icon: "ribbon-outline" },
  { title: "Support", subtitle: "Tickets", route: "/dashboard/admin/support", icon: "ticket-outline" },
  { title: "Contact queries", subtitle: "Form submissions", route: "/dashboard/admin/contact-queries", icon: "mail-outline" },
  { title: "Moderation", subtitle: "Content review", route: "/dashboard/admin/moderation", icon: "eye-outline" },
  { title: "Featured", subtitle: "Promoted listings", route: "/dashboard/admin/featured", icon: "star-outline" },
  { title: "Banners", subtitle: "Home promos", route: "/dashboard/admin/banners", icon: "images-outline" },
  { title: "Notifications", subtitle: "Templates & broadcast", route: "/dashboard/admin/notifications", icon: "megaphone-outline" },
  { title: "Analytics", subtitle: "Charts & metrics", route: "/dashboard/admin/analytics", icon: "bar-chart-outline" },
  { title: "Reports", subtitle: "CSV export", route: "/dashboard/admin/reports", icon: "document-outline" },
  { title: "Settings", subtitle: "System config", route: "/dashboard/admin/settings", icon: "settings-outline" },
];

export const VISITOR_FEATURES_EXTENDED: FeatureItem[] = [
  ...VISITOR_FEATURES,
];

export function featuresForHubPath(hubPath: string, opts?: { includeReferral?: boolean }): FeatureItem[] {
  const shared = opts?.includeReferral ? [REFERRAL_FEATURE, ...SHARED_FEATURES] : SHARED_FEATURES;
  if (hubPath.includes("/visitor")) return [...VISITOR_FEATURES_EXTENDED, ...shared];
  if (hubPath.includes("/exhibitor")) return [...EXHIBITOR_FEATURES, ...shared];
  if (hubPath.includes("/organizer")) return [...ORGANIZER_FEATURES, ...shared];
  if (hubPath.includes("/service-provider")) return [...SERVICE_PROVIDER_FEATURES, ...shared];
  if (hubPath.includes("/volunteer")) return [...VOLUNTEER_FEATURES, ...shared];
  if (hubPath.includes("/admin")) return [...ADMIN_FEATURES, ...shared];
  if (hubPath.includes("/marketplace")) {
    return [
      {
        title: "Browse",
        subtitle: "Hire for your booth",
        route: "/dashboard/marketplace",
        icon: "storefront-outline",
      },
      {
        title: "Enquiries",
        subtitle: "Active conversations",
        route: "/dashboard/marketplace/my-enquiries",
        icon: "chatbubbles-outline",
      },
      ...shared,
    ];
  }
  return shared;
}

export function hubMetaForPath(hubPath: string): { title: string; subtitle: string; gradient: [string, string] } {
  if (hubPath.includes("/admin"))
    return {
      title: "Dashboard",
      subtitle: "Platform operations & moderation",
      gradient: ["#1e1b4b", "#312e81"],
    };
  if (hubPath.includes("/organizer"))
    return {
      title: "Dashboard",
      subtitle: "Events, stalls, tickets & gate entry",
      gradient: ["#0a1f3d", "#134e4a"],
    };
  if (hubPath.includes("/exhibitor"))
    return {
      title: "Dashboard",
      subtitle: "Discover fairs, book stalls, grow business",
      gradient: ["#0a1f3d", "#065f46"],
    };
  if (hubPath.includes("/service-provider"))
    return {
      title: "Dashboard",
      subtitle: "List services, enquiries & bookings",
      gradient: ["#4c1d95", "#5b21b6"],
    };
  if (hubPath.includes("/volunteer"))
    return {
      title: "Dashboard",
      subtitle: "Gate entry & event support",
      gradient: ["#0f172a", "#1e3a5f"],
    };
  if (hubPath.includes("/marketplace"))
    return {
      title: "Marketplace",
      subtitle: "Services for exhibitions",
      gradient: ["#064e3b", "#0a1f3d"],
    };
  return {
    title: "Dashboard",
    subtitle: "Discover fairs, book tickets, network",
    gradient: ["#0a1f3d", "#0f766e"],
  };
}
