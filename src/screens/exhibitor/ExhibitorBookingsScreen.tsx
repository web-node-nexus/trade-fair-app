import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";

type Row = {
  id: string;
  eventId: string;
  eventTitle: string;
  status: string;
  subtotalMinor: string;
  payNowMinor: string;
  createdAt: string;
};

export function ExhibitorBookingsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<{ bookings: Row[] }>("/exhibitor/bookings");
    setRows(data.bookings ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenShell title="My bookings" subtitle="Stall reservations">
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="My bookings" subtitle="Stall reservations">
      <RefreshableFlatList
        data={rows}
        keyExtractor={(r) => r.id}
        onRefresh={() => void load().catch(() => setRows([]))}
        ListEmptyComponent={<EmptyState title="No stall bookings yet." compact />}
        renderItem={({ item }) => (
          <DashboardListCard
            title={item.eventTitle}
            subtitle={`Booking #${item.id}`}
            amount={formatInrFromMinor(item.subtotalMinor)}
            status={item.status}
            meta={new Date(item.createdAt).toLocaleString()}
            icon="bookmark-outline"
            iconColor={colors.emeraldDark}
            iconBg="rgba(16,185,129,0.12)"
            onPress={() => router.push(`/dashboard/exhibitor/bookings/${item.id}` as never)}
          />
        )}
      />
    </ScreenShell>
  );
}
