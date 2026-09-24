import { useCallback } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { defaultRouteForHub } from "@/lib/workspaceNav";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export function WorkspaceScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, workspaces, primaryDashboard, refreshMe } = useAuth();
  const reload = useCallback(async () => {
    await refreshMe();
  }, [refreshMe]);
  const { refreshControl } = usePullToRefresh(reload);

  if (!user) {
    return (
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ flexGrow: 1 }}
        refreshControl={refreshControl}
      >
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.iconCircle}>
            <Ionicons name="briefcase-outline" size={28} color={colors.emerald} />
          </View>
          <Text style={styles.title}>Your workspace</Text>
          <Text style={styles.sub}>
            Sign in to book stalls, manage events, tickets, services, and more.
          </Text>
        </View>
        <View style={styles.cta}>
          <PrimaryButton label="Sign in" onPress={() => router.push("/(auth)/login" as never)} />
          <Pressable onPress={() => router.push("/(auth)/register" as never)} style={styles.secondary}>
            <Text style={styles.secondaryText}>Register</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <Text style={styles.greet}>Welcome back</Text>
        <Text style={styles.name}>{user.fullName || user.email}</Text>
        <Text style={styles.sub}>Pick a workspace to continue</Text>
      </View>
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {workspaces.map((ws) => (
          <Pressable
            key={ws.href}
            onPress={() => router.push(defaultRouteForHub(ws.href) as never)}
            style={({ pressed }) => [styles.wsCard, pressed && { opacity: 0.9 }]}
          >
            <View style={styles.wsIcon}>
              <Ionicons name="grid-outline" size={22} color={colors.emerald} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.wsTitle}>{ws.label}</Text>
              <Text style={styles.wsPath}>{ws.href.replace("/dashboard/", "")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
          </Pressable>
        ))}
        <Pressable
          onPress={() => router.push(primaryDashboard as never)}
          style={styles.primaryWs}
        >
          <Text style={styles.primaryWsText}>Open primary workspace →</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  greet: { fontSize: 13, color: colors.emerald, fontWeight: "700" },
  name: { fontSize: 24, fontWeight: "800", color: colors.navy, marginTop: 4 },
  sub: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  cta: { padding: spacing.screen, gap: spacing.lg },
  secondary: { alignItems: "center", padding: spacing.md },
  secondaryText: { color: colors.emerald, fontWeight: "700", fontSize: 15 },
  list: { paddingHorizontal: spacing.screen, paddingTop: spacing.lg },
  wsCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  wsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  wsTitle: { fontSize: 16, fontWeight: "700", color: colors.navy },
  wsPath: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  primaryWs: {
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.navy,
    alignItems: "center",
  },
  primaryWsText: { color: "#fff", fontWeight: "700" },
});
