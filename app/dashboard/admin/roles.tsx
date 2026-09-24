import { Redirect } from "expo-router";

/** Legacy web route alias → RBAC matrix. */
export default function AdminRolesLegacyRoute() {
  return <Redirect href="/dashboard/admin/rbac" />;
}
