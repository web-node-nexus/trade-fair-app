import { useCallback, useEffect } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { LoadingView } from "@/components/ui/LoadingView";
import { useAuth } from "@/context/AuthContext";
import { confirmSignOut } from "@/lib/signOutConfirm";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const MENU = [
  { label: "Refer & earn · 100 pts", icon: "gift-outline" as const, route: "/dashboard/referral" },
  { label: "Account settings", icon: "person-outline" as const, route: "/dashboard/account" },
  { label: "Announcements", icon: "notifications-outline" as const, route: "/dashboard/notifications" },
  { label: "Browse fairs", icon: "calendar-outline" as const, route: "/(tabs)/trade-fairs" },
  { label: "Explore industries", icon: "grid-outline" as const, route: "/(tabs)/explore" },
];

const HELP_LINKS = [
  { label: "FAQ", route: "/pages/faq" },
  { label: "Contact us", route: "/pages/contact" },
];

const LEGAL_LINKS = [
  { label: "Privacy policy", route: "/pages/privacy-policy" },
  { label: "Terms & Conditions", route: "/pages/terms-of-service" },
  { label: "Payment & refund policy", route: "/pages/payment-refund-policy" },
  { label: "Cookie policy", route: "/pages/cookie-policy" },
];

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout, primaryDashboard, refreshMe, ready } = useAuth();
  const reload = useCallback(async () => {
    await refreshMe();
  }, [refreshMe]);
  const { refreshControl } = usePullToRefresh(reload);

  // Guests tapping Account/Profile go straight to login
  useEffect(() => {
    if (ready && !user) {
      router.replace("/(auth)/login" as never);
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return <LoadingView label="Opening sign in…" />;
  }

  const menuItems = MENU.filter((m) => {
    if (m.route === "/dashboard/referral") return Boolean(user);
    return true;
  });

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.screenTitle}>Profile</Text>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(user.fullName?.[0] ?? user.email?.[0] ?? "U").toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name}>{user.fullName ?? "User"}</Text>
          <Text style={styles.email}>{user.email}</Text>
          {user.id ? <Text style={styles.userId}>User ID · {user.id}</Text> : null}
          {user.roles?.length ? (
            <View style={styles.roles}>
              {user.roles.map((r) => (
                <View key={r} style={styles.rolePill}>
                  <Text style={styles.roleText}>{r.replace(/_/g, " ")}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.body}>
        <PrimaryButton
          label="Open workspace"
          onPress={() => router.push(primaryDashboard as never)}
        />
        {menuItems.map((m) => (
          <Pressable
            key={m.route}
            style={styles.menuRow}
            onPress={() => router.push(m.route as never)}
          >
            <Ionicons name={m.icon} size={22} color={colors.emerald} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
        <Text style={styles.sectionTitle}>Support</Text>
        {HELP_LINKS.map((m) => (
          <Pressable
            key={m.route}
            style={styles.menuRow}
            onPress={() => router.push(m.route as never)}
          >
            <Ionicons name="help-circle-outline" size={22} color={colors.emerald} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
        <Text style={styles.sectionTitle}>Legal</Text>
        {LEGAL_LINKS.map((m) => (
          <Pressable
            key={m.route}
            style={styles.menuRow}
            onPress={() => router.push(m.route as never)}
          >
            <Ionicons name="document-text-outline" size={22} color={colors.emerald} />
            <Text style={styles.menuLabel}>{m.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
        <Pressable style={styles.logout} onPress={() => confirmSignOut(() => logout())}>
          <Ionicons name="log-out-outline" size={20} color="#ef4444" />
          <Text style={styles.logoutText}>Sign out</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.4,
    marginBottom: spacing.lg,
  },
  profileCard: { alignItems: "center", paddingBottom: spacing.sm },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#fff" },
  name: { fontSize: 20, fontWeight: "800", color: colors.navy },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 4 },
  userId: { fontSize: 12, color: colors.textMuted, marginTop: 6, fontFamily: "monospace" },
  roles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: spacing.md,
    justifyContent: "center",
  },
  rolePill: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  roleText: { fontSize: 10, fontWeight: "700", color: colors.navy, textTransform: "uppercase" },
  body: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.navy },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  logout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: spacing.xxl,
    padding: spacing.lg,
  },
  logoutText: { color: "#ef4444", fontWeight: "700" },
});
