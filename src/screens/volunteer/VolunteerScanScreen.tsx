import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
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
import { CameraView, useCameraPermissions } from "expo-camera";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Ev = { id: string; title: string; venueName: string };

export function VolunteerScanScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ events: Ev[] }>("/volunteer/events");
    setEvents(data.events ?? []);
  }, []);

  useEffect(() => {
    void load().catch(() => setEvents([]));
  }, [load]);

  async function handleScan(payload: string) {
    if (!selectedId || busy) return;
    setBusy(true);
    setResult(null);
    try {
      const data = await apiJson<{ result: string; message?: string }>(
        `/volunteer/events/${selectedId}/entry/scan`,
        { method: "POST", body: JSON.stringify({ qrPayload: payload.trim() }) }
      );
      setResult(data.message ?? data.result);
    } catch (e) {
      setResult(e instanceof Error ? e.message : "Scan failed");
    } finally {
      setBusy(false);
    }
  }

  if (!selectedId) {
    return (
      <ScreenShell title="Gate scan" subtitle="Pick an assigned fair">
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          refreshControl={<RefreshControl refreshing={false} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyState title="No events assigned yet." compact />}
          renderItem={({ item }) => (
            <Pressable style={styles.eventCard} onPress={() => setSelectedId(item.id)}>
              <Text style={styles.eventTitle}>{item.title}</Text>
              <Text style={styles.eventSub}>{item.venueName}</Text>
              <View style={styles.scanCta}>
                <Ionicons name="scan-outline" size={18} color={colors.emerald} />
                <Text style={styles.scanCtaText}>Open scanner</Text>
              </View>
            </Pressable>
          )}
        />
      </ScreenShell>
    );
  }

  const selected = events.find((e) => e.id === selectedId);

  if (!permission?.granted) {
    return (
      <ScreenShell title="Camera access" onBack={() => setSelectedId(null)}>
        <Text style={styles.muted}>Camera permission is required to scan visitor QR passes.</Text>
        <Pressable style={styles.permBtn} onPress={() => void requestPermission()}>
          <Text style={styles.permBtnText}>Allow camera</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <View style={styles.scanRoot}>
      <View style={styles.scanHeader}>
        <Pressable onPress={() => { setSelectedId(null); setScanning(false); setResult(null); }}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={styles.scanTitle} numberOfLines={1}>{selected?.title ?? "Scan"}</Text>
          <Text style={styles.scanSub}>Point at visitor QR code</Text>
        </View>
      </View>

      {scanning ? (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => {
            setScanning(false);
            void handleScan(data);
          }}
        />
      ) : (
        <View style={styles.cameraPlaceholder}>
          {busy ? <ActivityIndicator color={colors.emerald} size="large" /> : (
            <>
              <Ionicons name="qr-code-outline" size={64} color={colors.emerald} />
              <Pressable style={styles.startBtn} onPress={() => setScanning(true)}>
                <Text style={styles.startBtnText}>Start scanning</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {result ? (
        <View style={styles.resultBar}>
          <Text style={styles.resultText}>{result}</Text>
          <Pressable onPress={() => { setResult(null); setScanning(true); }}>
            <Text style={styles.scanAgain}>Scan again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  muted: { color: colors.textMuted, fontSize: 14, marginTop: spacing.lg },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventTitle: { fontSize: 16, fontWeight: "800", color: colors.navy },
  eventSub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  scanCta: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.md },
  scanCtaText: { color: colors.emerald, fontWeight: "700" },
  permBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.emerald,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: "center",
  },
  permBtnText: { color: "#fff", fontWeight: "700" },
  scanRoot: { flex: 1, backgroundColor: "#000" },
  scanHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.navy,
  },
  scanTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  scanSub: { color: colors.textOnDarkMuted, fontSize: 12, marginTop: 2 },
  camera: { flex: 1 },
  cameraPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  startBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.cta,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  startBtnText: { color: "#fff", fontWeight: "800" },
  resultBar: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  resultText: { fontSize: 15, fontWeight: "600", color: colors.navy },
  scanAgain: { marginTop: 8, color: colors.emerald, fontWeight: "700" },
});
