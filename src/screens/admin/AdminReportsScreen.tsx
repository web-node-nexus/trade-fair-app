import { useCallback, useEffect, useState } from "react";
import { Alert, Text, TextInput, View } from "react-native";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { downloadAuthenticatedFile } from "@/lib/downloadAuthFile";
import { adminStyles } from "./adminStyles";

type ScanRow = {
  id: string;
  result: string;
  scannedAt: string;
  visitorName?: string | null;
  visitorEmail?: string | null;
  visitorPhone?: string | null;
};

export function AdminReportsScreen() {
  const [busy, setBusy] = useState(false);
  const [eventId, setEventId] = useState("");
  const [scans, setScans] = useState<ScanRow[]>([]);
  const [eventTitle, setEventTitle] = useState<string | null>(null);

  const loadScans = useCallback(async () => {
    if (!eventId.trim()) {
      setScans([]);
      setEventTitle(null);
      return;
    }
    try {
      const data = await apiJson<{ scans: ScanRow[]; event?: { title?: string } }>(
        `/admin/events/${eventId.trim()}/entry-scans`
      );
      setScans(data.scans ?? []);
      setEventTitle(data.event?.title ?? null);
    } catch {
      setScans([]);
      setEventTitle(null);
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId.trim()) return;
    const t = setTimeout(() => void loadScans(), 400);
    return () => clearTimeout(t);
  }, [eventId, loadScans]);

  async function downloadLedger() {
    setBusy(true);
    try {
      await downloadAuthenticatedFile(
        "/admin/reports/ledger.csv?limit=500",
        `ledger_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  async function downloadEntryScans() {
    if (!eventId.trim()) {
      Alert.alert("Required", "Enter an event ID first.");
      return;
    }
    setBusy(true);
    try {
      await downloadAuthenticatedFile(
        `/admin/events/${eventId.trim()}/entry-scans/export.csv`,
        `event_${eventId.trim()}_entry_scans.csv`
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Download failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell title="Reports" subtitle="CSV / Excel exports" scroll onRefresh={async () => {}}>
      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Payment ledger (CSV)</Text>
        <Text style={adminStyles.sub}>Last 500 rows by default.</Text>
        <PrimaryButton label={busy ? "Downloading…" : "Download ledger CSV"} variant="cta" disabled={busy} onPress={() => void downloadLedger()} />
      </View>

      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Entry scans (Excel)</Text>
        <Text style={adminStyles.sub}>Name, email, phone, and scan datetime for gate check-ins.</Text>
        <Text style={adminStyles.label}>Event ID</Text>
        <TextInput
          style={adminStyles.input}
          value={eventId}
          onChangeText={setEventId}
          placeholder="e.g. 12"
          keyboardType="number-pad"
        />
        <PrimaryButton
          label={busy ? "Downloading…" : "Download Excel"}
          variant="cta"
          disabled={busy || !eventId.trim()}
          onPress={() => void downloadEntryScans()}
        />
        {eventTitle ? (
          <Text style={[adminStyles.sub, { marginTop: 8 }]}>
            {eventTitle} · {scans.length} scan{scans.length === 1 ? "" : "s"}
          </Text>
        ) : null}
        {scans.slice(0, 10).map((r) => (
          <View key={r.id} style={{ marginTop: 8 }}>
            <Text style={adminStyles.sub}>
              {r.visitorName ?? "Visitor"} · {new Date(r.scannedAt).toLocaleString()}
            </Text>
          </View>
        ))}
      </View>

      <Text style={adminStyles.sub}>Open CSV files in Excel or Google Sheets.</Text>
    </ScreenShell>
  );
}
