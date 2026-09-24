import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/client";
import { BANNER_COLORS } from "@/data/mock";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { eventLocation, formatDateBadge } from "@/utils/eventFormat";

type Props = {
  event: PublicEvent;
  categoryLabel?: string;
  colorIndex?: number;
  onPress?: () => void;
};

export function EventCardCompact({ event, categoryLabel, colorIndex = 0, onPress }: Props) {
  const badge = formatDateBadge(event.startsAt);
  const bannerColor = BANNER_COLORS[colorIndex % BANNER_COLORS.length];

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.95 }]}>
      <View style={[styles.banner, { backgroundColor: bannerColor }]}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{badge.day}</Text>
          <Text style={styles.dateMon}>{badge.mon}</Text>
        </View>
        {categoryLabel ? (
          <View style={styles.categoryPill}>
            <Text style={styles.categoryText}>{categoryLabel}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={colors.textMuted} />
          <Text style={styles.location} numberOfLines={1}>
            {eventLocation(event)}
          </Text>
        </View>
        {event.stallCount ? (
          <View style={styles.stallPill}>
            <Text style={styles.stallText}>{event.stallCount}+ stalls</Text>
          </View>
        ) : null}
        <View style={styles.footer}>
          <View style={{ flex: 1 }} />
          <PrimaryButton label="Book Stall" compact variant="emerald" style={styles.bookBtn} />
        </View>
      </View>
    </Pressable>
  );
}

const CARD_WIDTH = 280;

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginRight: spacing.lg,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  banner: {
    height: 130,
    padding: spacing.md,
    justifyContent: "space-between",
    flexDirection: "row",
  },
  dateBadge: {
    backgroundColor: "rgba(16, 185, 129, 0.92)",
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignItems: "center",
    minWidth: 48,
  },
  dateDay: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    lineHeight: 20,
  },
  dateMon: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  categoryText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "600",
  },
  body: {
    padding: spacing.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    lineHeight: 22,
    marginBottom: 6,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  location: {
    flex: 1,
    fontSize: 13,
    color: colors.textMuted,
  },
  stallPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: 12,
  },
  stallText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
  },
  bookBtn: {
    minWidth: 110,
  },
});
