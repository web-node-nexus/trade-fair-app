import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Booking = {
  id: string;
  serviceTitle: string;
  amountMinor: string;
  currency: string;
  status: string;
  scheduledAt: string | null;
};

export function MyServiceBookingsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ bookings: Booking[] }>("/marketplace/my-bookings");
    setRows(data.bookings ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <ScreenShell title="My service bookings" subtitle="Pay and track provider jobs">
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(b) => b.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void onRefresh()} />}
          ListEmptyComponent={
            <EmptyState
              icon="bag-outline"
              title="No service bookings"
              message="Browse the marketplace to hire booth services."
              actionLabel="Browse marketplace"
              onAction={() => router.push("/dashboard/marketplace")}
              compact
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/dashboard/marketplace/my-bookings/${item.id}` as never)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.serviceTitle}</Text>
                <Text style={styles.sub}>
                  {formatInrFromMinor(item.amountMinor)} · {item.status.replace(/_/g, " ")}
                </Text>
                {item.scheduledAt ? (
                  <Text style={styles.date}>
                    Scheduled {new Date(item.scheduledAt).toLocaleString()}
                  </Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: "center", paddingTop: 48, gap: 8 },
  emptyText: { color: colors.textMuted, textAlign: "center" },
  emptyLink: { color: colors.emerald, fontWeight: "700", marginTop: 8 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: "800", color: colors.navy, fontSize: 15 },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4, textTransform: "capitalize" },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
