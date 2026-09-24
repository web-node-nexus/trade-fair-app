import { Pressable, StyleSheet, Text, View, Platform } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useWorkspaceNav } from "@/context/WorkspaceNavContext";
import { routeWithSubscriptionReturn } from "@/lib/subscriptionReturn";
import { colors } from "@/theme/colors";

export const WORKSPACE_BOTTOM_BAR_HEIGHT = Platform.OS === "ios" ? 56 : 52;

export function WorkspaceBottomBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { active, bottomTabs, openDrawer } = useWorkspaceNav();

  if (!active || bottomTabs.length === 0) return null;

  const showMenuTab = bottomTabs.length >= 4;
  const barHeight = WORKSPACE_BOTTOM_BAR_HEIGHT + insets.bottom;

  function shortLabel(title: string) {
    // Avoid truncating to useless words like "My" / "Inbox"
    const cleaned = title
      .replace(/^My\s+/i, "")
      .replace(/\b(inbox|notifications|announcements)\b/gi, "Alerts")
      .trim();
    if (cleaned.length <= 10) return cleaned;
    const first = cleaned.split(/\s+/)[0] ?? cleaned;
    return first.length <= 10 ? first : first.slice(0, 9);
  }

  return (
    <View style={[styles.bar, { height: barHeight, paddingBottom: insets.bottom }]}>
      {bottomTabs.slice(0, showMenuTab ? 4 : bottomTabs.length).map((tab) => {
        const activeTab = pathname === tab.route || pathname.startsWith(`${tab.route}/`);
        const label = shortLabel(tab.title);
        return (
          <Pressable
            key={tab.route}
            style={styles.item}
            onPress={() => router.push(routeWithSubscriptionReturn(tab.route, pathname) as never)}
          >
            <Ionicons name={tab.icon} size={21} color={activeTab ? colors.emerald : colors.textMuted} />
            <Text style={[styles.label, activeTab && styles.labelActive]} numberOfLines={1}>
              {label}
            </Text>
          </Pressable>
        );
      })}
      <Pressable style={styles.item} onPress={openDrawer}>
        <Ionicons name="menu" size={21} color={colors.navy} />
        <Text style={styles.label}>Menu</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingTop: 6,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingTop: 2,
  },
  label: { fontSize: 10, fontWeight: "600", color: colors.textMuted, maxWidth: 72, textAlign: "center" },
  labelActive: { color: colors.emerald, fontWeight: "800" },
});
