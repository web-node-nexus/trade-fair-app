import { Alert, Pressable, Share, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import type { PublicEvent, VisitorTicket } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { BANNER_COLORS } from "@/data/mock";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { formatEventDateRange } from "@/utils/eventFormat";

const THUMB = 72;

type Props = {
  ticket: VisitorTicket;
  event?: PublicEvent;
  colorIndex?: number;
  onViewPass: () => void;
};

function passCode(ticket: VisitorTicket) {
  const raw = ticket.qrPayload?.split(".")[1] ?? ticket.id;
  const suffix = String(raw).replace(/\D/g, "").slice(-5).padStart(5, "0");
  return `TFW${suffix}`;
}

async function downloadPass(ticket: VisitorTicket) {
  const shareMessage = `Trade Fair Wala gate pass\nEvent: ${ticket.eventTitle}\nTicket: ${ticket.id}\nType: ${ticket.ticketTypeName ?? "Visitor"}\nStatus: ${ticket.status}`;
  try {
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Gate Pass</title></head><body><h1>${ticket.eventTitle}</h1><p>${ticket.ticketTypeName ?? "Visitor"}</p><p>ID: ${ticket.id}</p><p>${ticket.qrPayload ?? ""}</p></body></html>`;
    const htmlPath = `${FileSystem.cacheDirectory}pass-${ticket.id}.html`;
    await FileSystem.writeAsStringAsync(htmlPath, html);
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(htmlPath, { mimeType: "text/html", dialogTitle: "Download pass" });
    } else {
      await Share.share({ message: shareMessage });
    }
  } catch (e) {
    Alert.alert("Download failed", e instanceof Error ? e.message : "Could not export pass");
  }
}

export function UpcomingPassCard({ ticket, event, colorIndex = 0, onViewPass }: Props) {
  const imageUrl = resolveMediaUrl(event?.coverImageUrl ?? event?.imageUrls?.[0] ?? null);
  const fallback = BANNER_COLORS[colorIndex % BANNER_COLORS.length];
  const dateRange = ticket.eventStartsAt
    ? formatEventDateRange(ticket.eventStartsAt, event?.endsAt ?? undefined)
    : "Date TBA";

  return (
    <View style={styles.card}>
      <View style={styles.confirmedBadge}>
        <Text style={styles.confirmedText}>Confirmed</Text>
      </View>

      <View style={styles.topRow}>
        <View style={styles.thumbWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="cover" />
          ) : (
            <View style={[styles.thumb, { backgroundColor: fallback }]} />
          )}
        </View>

        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={2}>
            {ticket.eventTitle}
          </Text>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={11} color={colors.textMuted} />
            <Text style={styles.meta} numberOfLines={1}>
              {ticket.venueName ?? event?.venueName ?? "Venue TBA"}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
            <Text style={styles.meta}>{dateRange}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="ticket-outline" size={11} color={colors.textMuted} />
            <Text style={styles.meta}>{ticket.ticketTypeName ?? "Visitor Pass"}</Text>
          </View>
        </View>

        {ticket.qrPayload ? (
          <View style={styles.qrCol}>
            <QRCode value={ticket.qrPayload} size={64} backgroundColor="#fff" color={colors.navy} />
            <Text style={styles.passId}>{passCode(ticket)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.actions}>
        <Pressable style={styles.primaryBtn} onPress={onViewPass}>
          <Text style={styles.primaryBtnText}>View Pass</Text>
        </Pressable>
        <Pressable style={styles.outlineBtn} onPress={() => void downloadPass(ticket)}>
          <Ionicons name="download-outline" size={14} color={colors.emerald} />
          <Text style={styles.outlineBtnText}>Download Pass</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
    shadowColor: "#0a1f3d",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  confirmedBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: "#d1fae5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  confirmedText: { fontSize: 9, fontWeight: "800", color: colors.emerald },
  topRow: { flexDirection: "row", gap: 10, alignItems: "flex-start", paddingRight: 56 },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm + 2,
    overflow: "hidden",
    backgroundColor: colors.navyLight,
  },
  thumb: { width: "100%", height: "100%" },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "800", color: colors.navy, lineHeight: 18, marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  meta: { flex: 1, fontSize: 10, color: colors.textMuted },
  qrCol: { alignItems: "center", gap: 3 },
  passId: { fontSize: 8, fontWeight: "800", color: colors.navy, letterSpacing: 0.3 },
  actions: { flexDirection: "row", gap: 8, marginTop: spacing.sm },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.emerald,
    paddingVertical: 9,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  outlineBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    paddingVertical: 9,
    borderRadius: radius.md,
  },
  outlineBtnText: { color: colors.emerald, fontSize: 11, fontWeight: "700" },
});
