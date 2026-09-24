import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { downloadAuthenticatedFile } from "@/lib/downloadAuthFile";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ScanRow = {
  id: string;
  ticketId: string | null;
  result: string;
  scannedAt: string;
  scannerEmail: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
  ticketTypeName?: string | null;
};

export function OrganizerEntryScansScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<ScanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [source, setSource] = useState<"scans" | "logs">("scans");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const path =
        source === "scans"
          ? `/organizer/events/${eventId}/entry-scans`
          : `/organizer/events/${eventId}/entry/logs`;
      const data = await apiJson<{ scans?: ScanRow[]; logs?: ScanRow[] }>(path);
      setRows(data.scans ?? data.logs ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [eventId, source]);

  useEffect(() => {
    void load();
  }, [load]);

  async function downloadExcel() {
    if (!eventId) return;
    setDownloading(true);
    try {
      await downloadAuthenticatedFile(
        `/organizer/events/${eventId}/entry-scans/export.csv`,
        `event_${eventId}_entry_scans.csv`
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <ScreenShell title="Entry scans" subtitle="Recent gate check-ins">
      <View style={styles.tabs}>
        {(["scans", "logs"] as const).map((s) => (
          <Pressable key={s} style={[styles.tab, source === s && styles.tabActive]} onPress={() => setSource(s)}>
            <Text style={[styles.tabText, source === s && styles.tabTextActive]}>{s === "scans" ? "Scans" : "Logs"}</Text>
          </Pressable>
        ))}
        <Pressable onPress={() => void load()} style={styles.refresh}>
          <Text style={styles.link}>Refresh</Text>
        </Pressable>
      </View>

      <PrimaryButton
        label={downloading ? "Downloading…" : "Download Excel"}
        variant="cta"
        disabled={downloading}
        onPress={() => void downloadExcel()}
      />

      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(r) => r.id}
          ListEmptyComponent={<EmptyState title="No entry scans yet." compact />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.result}>{item.result}</Text>
              <Text style={styles.name}>{item.visitorName ?? "Unknown visitor"}</Text>
              <Text style={styles.sub}>
                {new Date(item.scannedAt).toLocaleString()}
                {item.visitorEmail ? ` · ${item.visitorEmail}` : ""}
                {item.visitorPhone ? ` · ${item.visitorPhone}` : ""}
                {item.ticketTypeName ? ` · ${item.ticketTypeName}` : ""}
              </Text>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.md },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.navy, textTransform: "capitalize" },
  tabTextActive: { color: "#fff" },
  refresh: { marginLeft: "auto" },
  link: { color: colors.emerald, fontWeight: "700" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  result: { fontWeight: "800", color: colors.emeraldDark, textTransform: "capitalize" },
  name: { fontWeight: "700", color: colors.navy, marginTop: 4 },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
