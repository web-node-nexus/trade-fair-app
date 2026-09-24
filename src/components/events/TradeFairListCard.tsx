import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/types";
import { resolveEventCoverUrl } from "@/lib/mediaUrl";
import { BANNER_COLORS } from "@/data/mock";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { eventLocation, formatDateBadge, formatEventDateRange } from "@/utils/eventFormat";

const THUMB = 88;

type Props = {
  event: PublicEvent;
  colorIndex?: number;
  onPress?: () => void;
  onBookStall?: () => void;
  onGetPass?: () => void;
};

export function TradeFairListCard({ event, colorIndex = 0, onPress, onBookStall, onGetPass }: Props) {
  const badge = formatDateBadge(event.startsAt);
  const imageUrl = resolveEventCoverUrl(event.coverImageUrl, event.imageUrls);
  const fallback = BANNER_COLORS[colorIndex % BANNER_COLORS.length];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.98 }]}>
      <View style={styles.thumbWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, { backgroundColor: fallback }]} />
        )}
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{badge.day}</Text>
          <Text style={styles.dateMon}>{badge.mon}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.metaRow}>
          <Ionicons name="location-outline" size={11} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {eventLocation(event)}
          </Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
          <Text style={styles.meta} numberOfLines={1}>
            {formatEventDateRange(event.startsAt, event.endsAt ?? undefined)}
          </Text>
        </View>

        {event.stallCount ? (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Ionicons name="storefront-outline" size={10} color={colors.emerald} />
              <Text style={styles.stat}>{event.stallCount}+ Exhibitors</Text>
            </View>
          </View>
        ) : null}

        <View style={styles.actions}>
          {event.stallBookingEnabled !== false ? (
            <Pressable style={styles.primaryBtn} onPress={onBookStall}>
              <Text style={styles.primaryBtnText}>Book Stall</Text>
            </Pressable>
          ) : null}
          <Pressable style={[styles.outlineBtn, event.stallBookingEnabled === false && styles.outlineBtnFull]} onPress={onGetPass}>
            <Text style={styles.outlineBtnText}>Get Pass</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
    gap: 10,
    alignItems: "flex-start",
  },
  thumbWrap: {
    width: THUMB,
    height: THUMB,
    borderRadius: radius.sm + 2,
    overflow: "hidden",
    backgroundColor: colors.navyLight,
  },
  thumb: { width: "100%", height: "100%" },
  dateBadge: {
    position: "absolute",
    top: 4,
    left: 4,
    backgroundColor: colors.cta,
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 2,
    alignItems: "center",
    minWidth: 34,
  },
  dateDay: { color: "#fff", fontSize: 11, fontWeight: "800", lineHeight: 13 },
  dateMon: { color: "rgba(255,255,255,0.9)", fontSize: 7, fontWeight: "700" },
  body: { flex: 1, minHeight: THUMB, justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "800", color: colors.navy, lineHeight: 17, marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  meta: { flex: 1, fontSize: 10, color: colors.textMuted },
  statsRow: { flexDirection: "row", gap: 8, marginTop: 2, marginBottom: 4 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  stat: { fontSize: 9, color: colors.textMuted, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 6, paddingTop: 4 },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.emerald,
    paddingVertical: 7,
    borderRadius: radius.sm + 2,
    alignItems: "center",
  },
  primaryBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  outlineBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    paddingVertical: 7,
    borderRadius: radius.sm + 2,
    alignItems: "center",
  },
  outlineBtnFull: { flex: 1 },
  outlineBtnText: { color: colors.emerald, fontSize: 10, fontWeight: "700" },
});
