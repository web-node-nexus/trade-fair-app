import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";

type Payment = {
  id: string;
  amountMinor?: string;
  status?: string;
  createdAt?: string;
  bookingId?: string;
};

export function ExhibitorPaymentsScreen() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>("/exhibitor/payments");
    setRows(extractList(data) as Payment[]);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenShell title="Payments" subtitle="Stall booking transactions">
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Payments" subtitle="Stall booking transactions">
      <RefreshableFlatList
        onRefresh={() => void load().catch(() => setRows([]))}
        data={rows}
        keyExtractor={(r) => r.id}
        ListEmptyComponent={<EmptyState title="No payments recorded." compact />}
        renderItem={({ item }) => (
          <DashboardListCard
            title="Payment"
            subtitle={item.bookingId ? `Booking #${item.bookingId}` : undefined}
            amount={formatInrFromMinor(item.amountMinor ?? "0")}
            status={item.status}
            meta={item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined}
            icon="card-outline"
            iconColor={colors.navyLight}
            iconBg="rgba(19,45,82,0.1)"
          />
        )}
      />
    </ScreenShell>
  );
}
