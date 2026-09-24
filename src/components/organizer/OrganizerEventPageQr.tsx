import QRCode from "react-native-qrcode-svg";
import { useMemo, useState } from "react";
import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { eventPageLink } from "@/lib/appLinks";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export function OrganizerEventPageQr({ eventId, eventTitle }: { eventId: string; eventTitle: string }) {
  const [copied, setCopied] = useState(false);
  const eventUrl = useMemo(() => eventPageLink(eventId), [eventId]);

  async function copyLink() {
    try {
      await Share.share({ message: `Book tickets for ${eventTitle}: ${eventUrl}`, url: eventUrl });
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      Alert.alert("Event link", eventUrl);
    }
  }

  return (
    <View style={styles.box}>
      <Text style={styles.label}>Event page QR</Text>
      <Text style={styles.hint}>
        Visitors scan to open <Text style={styles.bold}>{eventTitle}</Text> in the app and buy tickets.
      </Text>
      <View style={styles.row}>
        <View style={styles.qrWrap}>
          <QRCode value={eventUrl} size={120} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.url} selectable>
            {eventUrl}
          </Text>
          <Pressable style={styles.copyBtn} onPress={() => void copyLink()}>
            <Text style={styles.copyText}>{copied ? "Shared" : "Share link"}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: "#ecfdf5",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  label: { fontSize: 11, fontWeight: "800", color: colors.emerald, textTransform: "uppercase", letterSpacing: 0.5 },
  hint: { marginTop: 4, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
  bold: { fontWeight: "700", color: colors.navy },
  row: { flexDirection: "row", gap: spacing.md, marginTop: spacing.md, alignItems: "flex-start" },
  qrWrap: {
    padding: spacing.sm,
    backgroundColor: "#fff",
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  url: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  copyBtn: {
    marginTop: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.emerald,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
  },
  copyText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
