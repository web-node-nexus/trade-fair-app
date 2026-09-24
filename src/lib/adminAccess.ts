/** Mirrors web adminNav + adminAccess for mobile hub filtering. APIs remain authoritative. */

export type AuthMe = {
  roles: string[];
  permissions: string[];
  subAdminScopes?: string[];
};

export function hasPermission(me: AuthMe | null, code: string): boolean {
  return !!me?.permissions?.includes(code);
}

export function hasScopedModule(me: AuthMe | null, scopeCode: string): boolean {
  if (!me?.roles?.length) return false;
  const roles = new Set(me.roles.map((r) => r.toUpperCase()));
  if (roles.has("SUPER_ADMIN")) return true;
  if (roles.has("SUB_ADMIN")) return (me.subAdminScopes ?? []).includes(scopeCode);
  return false;
}

export function can(me: AuthMe | null, permission: string, moduleScope?: string): boolean {
  if (!me || !hasPermission(me, permission)) return false;
  if (!moduleScope) return true;
  return hasScopedModule(me, moduleScope);
}

type AdminPerm = { perm: string; scope?: string };

const ADMIN_ROUTE_PERMS: Record<string, AdminPerm> = {
  "/dashboard/admin/overview": { perm: "admin.analytics.read" },
  "/dashboard/admin/users": { perm: "admin.users.read" },
  "/dashboard/admin/rbac": { perm: "admin.users.read" },
  "/dashboard/admin/sub-admins": { perm: "admin.sub_admins.write", scope: "sub_admins" },
  "/dashboard/admin/kyc": { perm: "admin.kyc.read", scope: "kyc" },
  "/dashboard/admin/monetization": { perm: "admin.monetization.read" },
  "/dashboard/admin/transactions": { perm: "admin.transactions.read" },
  "/dashboard/admin/refunds": { perm: "admin.monetization.read" },
  "/dashboard/admin/disputes": { perm: "admin.monetization.read" },
  "/dashboard/admin/support": { perm: "admin.support.read", scope: "support" },
  "/dashboard/admin/contact-queries": { perm: "admin.support.read", scope: "support" },
  "/dashboard/admin/moderation": { perm: "admin.moderation.read", scope: "moderation" },
  "/dashboard/admin/featured": { perm: "admin.featured.read" },
  "/dashboard/admin/banners": { perm: "admin.settings.read", scope: "settings" },
  "/dashboard/admin/notifications": { perm: "admin.notifications.write", scope: "notifications" },
  "/dashboard/admin/analytics": { perm: "admin.analytics.read" },
  "/dashboard/admin/reports": { perm: "admin.reports.export" },
  "/dashboard/admin/settings": { perm: "admin.settings.read", scope: "settings" },
};

export function canAccessAdminRoute(me: AuthMe | null, route: string): boolean {
  const rule = ADMIN_ROUTE_PERMS[route];
  if (!rule) return true;
  return can(me, rule.perm, rule.scope);
}
