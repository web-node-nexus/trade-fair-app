import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import type { VisitorTicket } from "@/api/types";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function VisitorTicketsScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<VisitorTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [demoBusy, setDemoBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ tickets: VisitorTicket[] }>("/visitor/tickets");
      setRows(data.tickets ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function createDemoTicket() {
    setDemoBusy(true);
    try {
      const data = await apiJson<{ ticket?: { id: string } }>("/visitor/tickets/demo", { method: "POST", body: "{}" });
      await load();
      if (data.ticket?.id) {
        router.push(`/dashboard/visitor/tickets/${data.ticket.id}` as never);
      } else {
        Alert.alert("Demo pass", "Demo ticket created.");
      }
    } catch (e) {
      Alert.alert("Demo ticket", e instanceof Error ? e.message : "Not available");
    } finally {
      setDemoBusy(false);
    }
  }

  return (
    <ScreenShell title="My passes" subtitle="Tap a pass to show QR at gate">
      {rows.length === 0 && !loading ? (
        <PrimaryButton
          label={demoBusy ? "Creating…" : "Get demo pass (dev)"}
          variant="outline"
          disabled={demoBusy}
          onPress={() => void createDemoTicket()}
          style={{ marginBottom: spacing.md }}
        />
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon="qr-code-outline"
          title="No passes yet"
          message="Book visitor tickets for any trade fair and your QR passes appear here."
          actionLabel="Browse fairs"
          onAction={() => router.push("/(tabs)/trade-fairs")}
        />
      ) : (
        <RefreshableFlatList
          data={rows}
          keyExtractor={(t) => t.id}
          onRefresh={load}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <DashboardListCard
              title={item.eventTitle}
              subtitle={item.ticketTypeName ?? "Visitor pass"}
              status={item.status}
              icon="qr-code"
              iconColor={colors.emerald}
              iconBg="rgba(16,185,129,0.12)"
              onPress={() => router.push(`/dashboard/visitor/tickets/${item.id}` as never)}
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
