import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/client";
import { BANNER_COLORS } from "@/data/mock";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import {
  eventLocation,
  formatDateBadge,
  formatEventDateRange,
  formatPriceINR,
} from "@/utils/eventFormat";

type Props = {
  event: PublicEvent;
  tags: string[];
  colorIndex?: number;
  onPress?: () => void;
  /** Compact layout for fair listing screens */
  compact?: boolean;
};

export function EventCardFull({ event, tags, colorIndex = 0, onPress, compact }: Props) {
  const badge = formatDateBadge(event.startsAt);
  const bannerColor = BANNER_COLORS[colorIndex % BANNER_COLORS.length];
  const tagColors = ["#dbeafe", "#ede9fe", "#d1fae5"];

  if (compact) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.compactCard, pressed && { opacity: 0.96 }]}
      >
        <View style={[styles.compactBanner, { backgroundColor: bannerColor }]}>
          <View style={styles.compactDate}>
            <Text style={styles.compactDateDay}>{badge.day}</Text>
            <Text style={styles.compactDateMon}>{badge.mon}</Text>
          </View>
        </View>
        <View style={styles.compactBody}>
          <Text style={styles.compactTitle} numberOfLines={2}>
            {event.title}
          </Text>
          <View style={styles.compactMetaRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text style={styles.compactMeta} numberOfLines={1}>
              {eventLocation(event)}
            </Text>
          </View>
          <View style={styles.compactFooter}>
            <Text style={styles.compactPrice}>
              {event.minStallPrice ? formatPriceINR(event.minStallPrice) : "On request"}
            </Text>
            <View style={styles.compactBook}>
              <Text style={styles.compactBookText}>View</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.emerald} />
            </View>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.98 }]}>
      <View style={[styles.banner, { backgroundColor: bannerColor }]}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{badge.day}</Text>
          <Text style={styles.dateMon}>{badge.mon}</Text>
        </View>
        {event.isVerified ? (
          <View style={styles.verified}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{event.title}</Text>
        <View style={styles.tags}>
          {tags.slice(0, 3).map((tag, i) => (
            <View key={tag} style={[styles.tag, { backgroundColor: tagColors[i % tagColors.length] }]}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
        <Text style={styles.meta}>
          {formatEventDateRange(event.startsAt, event.endsAt)}
          {event.stallCount ? `  ·  ${event.stallCount}+ stalls` : ""}
          {event.rating ? `  ·  ★ ${event.rating}` : ""}
        </Text>
        <View style={styles.priceRow}>
          <View>
            <Text style={styles.priceLabel}>Stalls from</Text>
            <Text style={styles.price}>
              {event.minStallPrice ? formatPriceINR(event.minStallPrice) : "On request"}
            </Text>
          </View>
          <PrimaryButton label="Book Stall" variant="navy" compact style={styles.bookBtn} />
        </View>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {eventLocation(event)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.xl,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  banner: {
    height: 160,
    padding: spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  dateBadge: {
    backgroundColor: colors.emerald,
    borderRadius: radius.sm,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    minWidth: 52,
  },
  dateDay: { color: "#fff", fontSize: 20, fontWeight: "800" },
  dateMon: { color: "rgba(255,255,255,0.92)", fontSize: 11, fontWeight: "700" },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(16, 185, 129, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    alignSelf: "flex-end",
    marginTop: "auto",
  },
  verifiedText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  body: { padding: spacing.lg },
  title: { fontSize: 18, fontWeight: "700", color: colors.text, lineHeight: 24, marginBottom: 10 },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill },
  tagText: { fontSize: 12, fontWeight: "600", color: colors.navy },
  meta: { fontSize: 13, color: colors.textMuted, marginBottom: 14, lineHeight: 18 },
  priceRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  priceLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  price: { fontSize: 22, fontWeight: "800", color: colors.emerald },
  bookBtn: { minWidth: 120 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  location: { flex: 1, fontSize: 13, color: colors.textMuted },
  compactCard: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 96,
  },
  compactBanner: {
    width: 72,
    alignItems: "center",
    justifyContent: "center",
  },
  compactDate: {
    backgroundColor: "rgba(255,255,255,0.22)",
    borderRadius: radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 44,
  },
  compactDateDay: { color: "#fff", fontSize: 16, fontWeight: "800" },
  compactDateMon: { color: "rgba(255,255,255,0.9)", fontSize: 9, fontWeight: "700" },
  compactBody: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    justifyContent: "center",
  },
  compactTitle: { fontSize: 14, fontWeight: "700", color: colors.navy, lineHeight: 18 },
  compactMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  compactMeta: { flex: 1, fontSize: 11, color: colors.textMuted },
  compactFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  compactPrice: { fontSize: 13, fontWeight: "800", color: colors.emerald },
  compactBook: { flexDirection: "row", alignItems: "center", gap: 2 },
  compactBookText: { fontSize: 12, fontWeight: "700", color: colors.emerald },
});
