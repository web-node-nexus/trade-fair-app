import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  title?: string;
  scanApiPath: string;
  eventTitle?: string;
  onBack?: () => void;
};

export function GateScanScreen({ title = "Gate scan", scanApiPath, eventTitle, onBack }: Props) {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const lastScan = useRef(0);

  const handleScan = useCallback(
    async (payload: string) => {
      const now = Date.now();
      if (busy || now - lastScan.current < 2000) return;
      lastScan.current = now;
      setBusy(true);
      setScanning(false);
      setResult(null);
      try {
        const data = await apiJson<{ result: string; message?: string }>(scanApiPath, {
          method: "POST",
          body: JSON.stringify({ qrPayload: payload.trim() }),
        });
        setResult(data.message ?? data.result);
      } catch (e) {
        setResult(e instanceof Error ? e.message : "Scan failed");
      } finally {
        setBusy(false);
      }
    },
    [busy, scanApiPath]
  );

  if (!permission?.granted) {
    return (
      <ScreenShell title={title} subtitle={eventTitle} onBack={onBack} scroll onRefresh={async () => {}}>
        <Text style={styles.muted}>Camera permission required for QR scanning.</Text>
        <Pressable style={styles.btn} onPress={() => void requestPermission()}>
          <Text style={styles.btnText}>Allow camera</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          {eventTitle ? <Text style={styles.headerSub}>{eventTitle}</Text> : null}
        </View>
      </View>

      {scanning ? (
        <CameraView
          style={styles.camera}
          barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          onBarcodeScanned={({ data }) => void handleScan(data)}
        />
      ) : (
        <View style={styles.placeholder}>
          {busy ? (
            <ActivityIndicator color={colors.emerald} size="large" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={72} color={colors.emerald} />
              <Pressable style={styles.btn} onPress={() => setScanning(true)}>
                <Text style={styles.btnText}>Start scanning</Text>
              </Pressable>
            </>
          )}
        </View>
      )}

      {result ? (
        <View style={styles.result}>
          <Text style={styles.resultText}>{result}</Text>
          <Pressable onPress={() => { setResult(null); setScanning(true); }}>
            <Text style={styles.again}>Scan again</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    paddingTop: 56,
    backgroundColor: colors.navy,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  headerSub: { color: colors.textOnDarkMuted, fontSize: 12, marginTop: 2 },
  camera: { flex: 1 },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#111" },
  btn: {
    marginTop: spacing.lg,
    backgroundColor: colors.cta,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: radius.pill,
  },
  btnText: { color: "#fff", fontWeight: "800" },
  muted: { color: colors.textMuted, lineHeight: 22 },
  result: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  resultText: { fontSize: 15, fontWeight: "600", color: colors.navy },
  again: { marginTop: 8, color: colors.emerald, fontWeight: "700" },
});
