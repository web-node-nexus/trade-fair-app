import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiJson } from "@/lib/authFetch";
import { formatDateTimeDdMmYyyy } from "@/lib/formatDate";
import { useAnnouncementUnread } from "@/hooks/useAnnouncementUnread";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";

type NotificationItem = {
  id: string;
  channel: string;
  status: string;
  unread?: boolean;
  createdAt: string;
  template: { code: string; title: string; body: string } | null;
  payload: Record<string, unknown> | null;
};

function routeForPayload(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;
  if (typeof payload.route === "string") return payload.route;
  if (typeof payload.eventId === "string") return `/event/${payload.eventId}`;
  if (typeof payload.bookingId === "string") return `/dashboard/exhibitor/bookings/${payload.bookingId}`;
  if (typeof payload.ticketId === "string") return `/dashboard/visitor/tickets/${payload.ticketId}`;
  return null;
}

export function NotificationsScreen() {
  const router = useRouter();
  const { refreshUnread } = useAnnouncementUnread();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ notifications: NotificationItem[] }>("/notifications/me");
    setItems(data.notifications ?? []);
    try {
      await apiJson("/notifications/me/read", { method: "POST", body: "{}" });
      await refreshUnread();
    } catch {
      /* non-blocking */
    }
  }, [refreshUnread]);

  useEffect(() => {
    void load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      void load().catch(() => {});
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  function openItem(item: NotificationItem) {
    const route = routeForPayload(item.payload);
    if (route) router.push(route as never);
    else if (item.template?.body.includes("http")) {
      const url = item.template.body.match(/https?:\/\/[^\s]+/)?.[0];
      if (url) void Linking.openURL(url);
    }
  }

  return (
    <ScreenShell title="Announcements" subtitle="Organizer & platform updates">
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(n) => n.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <EmptyState
              icon="megaphone-outline"
              title="No announcements"
              message="When organizers or the platform send updates, they will show here."
              compact
            />
          }
          renderItem={({ item }) => {
            const title = item.template?.title ?? "Announcement";
            const body = item.template?.body ?? "";
            const actionable = !!routeForPayload(item.payload);
            return (
              <Pressable
                style={[styles.card, item.unread && styles.cardUnread, actionable && styles.cardActionable]}
                onPress={() => openItem(item)}
                disabled={!actionable && !body.includes("http")}
              >
                <View style={styles.iconWrap}>
                  <Ionicons name="megaphone-outline" size={20} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>
                    {title}
                    {item.unread ? " · New" : ""}
                  </Text>
                  {body ? (
                    <Text style={styles.body} numberOfLines={3}>
                      {body}
                    </Text>
                  ) : null}
                  <Text style={styles.time}>{formatDateTimeDdMmYyyy(item.createdAt)}</Text>
                </View>
                {actionable ? <Ionicons name="chevron-forward" size={18} color={colors.emerald} /> : null}
              </Pressable>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardUnread: { borderColor: colors.emerald, backgroundColor: "#f0fdf4" },
  cardActionable: { borderColor: colors.emerald },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontWeight: "800", color: colors.navy, fontSize: 15, fontFamily: appFontFamily },
  body: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19, fontFamily: appFontFamily },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 6, fontFamily: appFontFamily },
});
