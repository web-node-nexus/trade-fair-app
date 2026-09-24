import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Row = { id: string; serviceTitle?: string; status: string; lastMessagePreview?: string };

export function ProviderRequestsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ requests: Row[] }>("/provider/service-requests");
      setRows(data.requests ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell title="Enquiries" subtitle="Respond to customer messages">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          data={rows}
          keyExtractor={(r) => r.id}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No enquiries yet." compact />}
          renderItem={({ item }) => (
            <DashboardListCard
              title={item.serviceTitle ?? "Enquiry"}
              subtitle={item.lastMessagePreview ?? "Tap to view conversation"}
              status={item.status}
              icon="chatbubbles-outline"
              iconColor={colors.emerald}
              iconBg="rgba(16,185,129,0.12)"
              onPress={() => router.push(`/dashboard/service-provider/requests/${item.id}` as never)}
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
