import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";
import type { PublicEvent, VisitorTicket } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { BANNER_COLORS } from "@/data/mock";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { formatEventDateRange } from "@/utils/eventFormat";

const THUMB = 56;

type Props = {
  ticket: VisitorTicket;
  event?: PublicEvent;
  colorIndex?: number;
  onViewPass: () => void;
};

export function PastVisitPassRow({ ticket, event, colorIndex = 0, onViewPass }: Props) {
  const imageUrl = resolveMediaUrl(event?.coverImageUrl ?? event?.imageUrls?.[0] ?? null);
  const fallback = BANNER_COLORS[colorIndex % BANNER_COLORS.length];
  const dateRange = ticket.eventStartsAt
    ? formatEventDateRange(ticket.eventStartsAt, event?.endsAt ?? undefined)
    : "";

  return (
    <View style={styles.card}>
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
          <Ionicons name="location-outline" size={10} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {ticket.venueName ?? "Venue"}
          </Text>
        </View>
        {dateRange ? (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={10} color={colors.textMuted} />
            <Text style={styles.meta}>{dateRange}</Text>
          </View>
        ) : null}
      </View>

      {ticket.qrPayload ? (
        <View style={styles.qrWrap}>
          <QRCode value={ticket.qrPayload} size={44} backgroundColor="#fff" color={colors.navy} />
        </View>
      ) : null}

      <Pressable style={styles.viewBtn} onPress={onViewPass}>
        <Text style={styles.viewBtnText}>View Pass</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm,
    overflow: "hidden",
    backgroundColor: colors.navyLight,
  },
  thumb: { width: "100%", height: "100%" },
  info: { flex: 1 },
  title: { fontSize: 12, fontWeight: "800", color: colors.navy, lineHeight: 16 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  meta: { flex: 1, fontSize: 9, color: colors.textMuted },
  qrWrap: { padding: 2, backgroundColor: "#fff", borderRadius: 6, borderWidth: 1, borderColor: "rgba(10,31,61,0.06)" },
  viewBtn: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.sm + 2,
  },
  viewBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
});
