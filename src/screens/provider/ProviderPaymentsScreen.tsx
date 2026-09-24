import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, StyleSheet } from "react-native";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Payment = { id: string; amountMinor?: string; status?: string; serviceTitle?: string; createdAt?: string };

export function ProviderPaymentsScreen() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>("/provider/payments");
    setRows(extractList(data) as Payment[]);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <ScreenShell title="Payments" subtitle="Earnings from service bookings">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          onRefresh={load}
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No payments yet." compact />}
          renderItem={({ item }) => (
            <DashboardListCard
              title={item.serviceTitle ?? "Service payment"}
              amount={formatInrFromMinor(item.amountMinor ?? "0")}
              meta={item.createdAt ? new Date(item.createdAt).toLocaleString() : undefined}
              status={item.status ?? "—"}
              icon="wallet-outline"
              iconColor={colors.emerald}
              iconBg="rgba(16,185,129,0.12)"
            />
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingBottom: spacing.xl },
});
