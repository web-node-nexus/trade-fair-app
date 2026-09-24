import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { BANNER_COLORS } from "@/data/mock";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { eventLocation, formatEventDateRange, formatPriceINR } from "@/utils/eventFormat";

const THUMB = 72;

export type EventTicketPricing = {
  minPriceMinor: number | null;
  isFree: boolean;
};

type Props = {
  event: PublicEvent;
  pricing: EventTicketPricing;
  colorIndex?: number;
  onPress: () => void;
};

export function AvailableEventPassRow({ event, pricing, colorIndex = 0, onPress }: Props) {
  const imageUrl = resolveMediaUrl(event.coverImageUrl ?? event.imageUrls?.[0] ?? null);
  const fallback = BANNER_COLORS[colorIndex % BANNER_COLORS.length];
  const isFree = pricing.isFree || pricing.minPriceMinor === 0;
  const priceLabel = isFree
    ? "FREE ENTRY"
    : pricing.minPriceMinor != null
      ? formatPriceINR(pricing.minPriceMinor / 100)
      : "Tickets available";

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
          <Text style={styles.meta}>{formatEventDateRange(event.startsAt, event.endsAt ?? undefined)}</Text>
        </View>
      </View>

      <View style={styles.ctaCol}>
        <Text style={[styles.price, isFree ? styles.priceFree : styles.pricePaid]}>{priceLabel}</Text>
        <Pressable style={isFree ? styles.primaryBtn : styles.outlineBtn} onPress={onPress}>
          <Text style={isFree ? styles.primaryBtnText : styles.outlineBtnText}>
            {isFree ? "Get Free Pass" : "Buy Ticket"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
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
    borderRadius: radius.sm + 2,
    overflow: "hidden",
    backgroundColor: colors.navyLight,
  },
  thumb: { width: "100%", height: "100%" },
  info: { flex: 1 },
  title: { fontSize: 13, fontWeight: "800", color: colors.navy, lineHeight: 17, marginBottom: 3 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 2 },
  meta: { flex: 1, fontSize: 10, color: colors.textMuted },
  ctaCol: { alignItems: "flex-end", gap: 6, minWidth: 88 },
  price: { fontSize: 10, fontWeight: "800", letterSpacing: 0.2 },
  priceFree: { color: colors.emerald },
  pricePaid: { color: colors.cta },
  primaryBtn: {
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm + 2,
  },
  primaryBtnText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: radius.sm + 2,
  },
  outlineBtnText: { color: colors.emerald, fontSize: 10, fontWeight: "700" },
});
