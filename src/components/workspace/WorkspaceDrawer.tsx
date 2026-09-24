import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "@/context/AuthContext";
import { useAnnouncementUnread } from "@/hooks/useAnnouncementUnread";
import { defaultRouteForHub } from "@/lib/workspaceNav";
import { hubSwitchLabel } from "@/lib/dashboardNav";
import { useWorkspaceNav } from "@/context/WorkspaceNavContext";
import { routeWithSubscriptionReturn } from "@/lib/subscriptionReturn";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";

export function WorkspaceDrawer() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { user, workspaces } = useAuth();
  const { unreadCount } = useAnnouncementUnread();
  const { drawerOpen, closeDrawer, drawerItems, meta, hubPath } = useWorkspaceNav();

  if (!hubPath || !meta) return null;

  function go(route: string) {
    closeDrawer();
    router.push(routeWithSubscriptionReturn(route, pathname) as never);
  }

  return (
    <Modal visible={drawerOpen} transparent animationType="fade" onRequestClose={closeDrawer}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeDrawer} />
        <View style={styles.panel}>
          <LinearGradient
            colors={meta.gradient}
            style={[styles.header, { paddingTop: insets.top + spacing.xs }]}
          >
            <Text style={styles.eyebrow}>Menu</Text>
            <Text style={styles.title}>{meta.title}</Text>
            {user ? (
              <Text style={styles.user} numberOfLines={1}>
                {user.fullName || user.email}
              </Text>
            ) : null}
          </LinearGradient>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{ paddingBottom: insets.bottom + spacing.md }}
            showsVerticalScrollIndicator={false}
          >
            {drawerItems.map((item) => {
              const isAnnouncements = item.route === "/dashboard/notifications";
              const badge = isAnnouncements && unreadCount > 0 ? unreadCount : 0;
              return (
                <Pressable key={item.route + item.title} style={styles.row} onPress={() => go(item.route)}>
                  <View style={styles.rowIcon}>
                    <Ionicons name={item.icon} size={18} color={colors.emerald} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.rowTitleRow}>
                      <Text style={styles.rowTitle}>
                        {badge > 0 ? `Announcements (${badge > 99 ? "99+" : badge})` : item.title}
                      </Text>
                      {badge > 0 ? (
                        <View style={styles.badge}>
                          <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.rowSub}>
                      {badge > 0 ? `${badge} new · ${item.subtitle}` : item.subtitle}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
                </Pressable>
              );
            })}

            {workspaces.length > 1 ? (
              <>
                <Text style={styles.section}>Switch workspace</Text>
                {workspaces.map((ws) => (
                  <Pressable
                    key={ws.href}
                    style={styles.row}
                    onPress={() => go(defaultRouteForHub(ws.href))}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name="swap-horizontal" size={18} color={colors.navy} />
                    </View>
                    <Text style={styles.rowTitle}>{hubSwitchLabel(ws.href)}</Text>
                  </Pressable>
                ))}
              </>
            ) : null}

            <Pressable style={styles.homeRow} onPress={() => go("/(tabs)")}>
              <Ionicons name="home-outline" size={18} color={colors.navy} />
              <Text style={styles.homeText}>Back to app home</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: "row" },
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)" },
  panel: {
    width: "82%",
    maxWidth: 320,
    height: "100%",
    backgroundColor: colors.surface,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 16,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  scroll: { flex: 1 },
  eyebrow: {
    fontSize: 10,
    fontWeight: "800",
    color: "rgba(248,250,252,0.7)",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    fontFamily: appFontFamily,
  },
  title: { fontSize: 20, fontWeight: "800", color: "#fff", marginTop: 2, fontFamily: appFontFamily },
  user: { fontSize: 12, color: "rgba(248,250,252,0.75)", marginTop: 4, fontFamily: appFontFamily },
  section: {
    fontSize: 10,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: 4,
    fontFamily: appFontFamily,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rowTitle: { fontSize: 14, fontWeight: "700", color: colors.navy, fontFamily: appFontFamily },
  rowSub: { fontSize: 11, color: colors.textMuted, marginTop: 1, fontFamily: appFontFamily },
  badge: {
    minWidth: 20,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 6,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800", fontFamily: appFontFamily },
  homeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.background,
  },
  homeText: { fontSize: 14, fontWeight: "700", color: colors.navy, fontFamily: appFontFamily },
});
