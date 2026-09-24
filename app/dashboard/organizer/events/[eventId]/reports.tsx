import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { downloadAndShareAuthenticated } from "@/lib/downloadAuthenticated";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function OrganizerReportsRoute() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [summary, setSummary] = useState<Record<string, string | number> | null>(null);
  const [exportBusy, setExportBusy] = useState(false);

  useEffect(() => {
    void apiJson<{ summary: Record<string, string | number> }>(`/organizer/events/${eventId}/reports/summary`)
      .then((d) => setSummary(d.summary))
      .catch(() => setSummary(null));
  }, [eventId]);

  async function exportCsv() {
    setExportBusy(true);
    try {
      await downloadAndShareAuthenticated({
        path: `/organizer/events/${eventId}/reports/export.csv`,
        filename: `event_${eventId}_report.csv`,
        mimeType: "text/csv",
        dialogTitle: "Share event report CSV",
      });
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setExportBusy(false);
    }
  }

  if (!summary) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} />
      </View>
    );
  }

  const rupees = (minor: string | number) => `₹${(Number(minor) / 100).toFixed(2)}`;

  return (
    <ScreenShell title="Reports" subtitle="Revenue & check-in summary">
      <PrimaryButton
        label={exportBusy ? "Exporting…" : "Export CSV"}
        variant="cta"
        disabled={exportBusy}
        onPress={() => void exportCsv()}
        style={{ marginBottom: spacing.lg }}
      />
      <View style={styles.card}>
        <Text style={styles.label}>Stall revenue</Text>
        <Text style={styles.val}>{rupees(summary.stallRevenueMinor ?? 0)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Ticket revenue</Text>
        <Text style={styles.val}>{rupees(summary.ticketRevenueMinor ?? 0)}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.label}>Tickets sold / checked in</Text>
        <Text style={styles.val}>
          {summary.ticketsSoldTotal ?? 0} / {summary.ticketsCheckedIn ?? 0}
        </Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
  val: { fontSize: 22, fontWeight: "800", color: colors.navy, marginTop: 4 },
});
