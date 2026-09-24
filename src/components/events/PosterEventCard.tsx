import { Dimensions, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/types";
import { resolveEventCoverUrl } from "@/lib/mediaUrl";
import { BANNER_COLORS } from "@/data/mock";
import { cardShadowSoft } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { eventCityLabel, formatDateBadge, formatEventDateRange } from "@/utils/eventFormat";

const { width: SW } = Dimensions.get("window");
export const POSTER_CARD_W = Math.round(SW * 0.44);
/** Tighter card so the strip does not dominate the home feed. */
export const POSTER_CARD_H = 198;

type Props = {
  event: PublicEvent;
  categoryLabel?: string;
  colorIndex?: number;
  width?: number;
  featured?: boolean;
  onPress?: () => void;
  onBook?: () => void;
  onFavorite?: () => void;
};

export function PosterEventCard({
  event,
  categoryLabel,
  colorIndex = 0,
  width = POSTER_CARD_W,
  featured = false,
  onPress,
  onBook,
  onFavorite,
}: Props) {
  const badge = formatDateBadge(event.startsAt);
  const imageUrl = resolveEventCoverUrl(event.coverImageUrl, event.imageUrls);
  const fallback = BANNER_COLORS[colorIndex % BANNER_COLORS.length];
  const city = eventCityLabel(event);

  return (
    <View style={[styles.card, { width, height: POSTER_CARD_H }, cardShadowSoft]}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.tapArea, pressed && styles.pressed]}
      >
        <View style={styles.posterWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.poster} contentFit="cover" transition={250} />
          ) : (
            <View style={[styles.poster, { backgroundColor: fallback }]} />
          )}
          <View style={styles.dateBadge}>
            <Text style={styles.dateDay}>{badge.day}</Text>
            <Text style={styles.dateMon}>{badge.mon}</Text>
          </View>
          {featured ? (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>FEATURED</Text>
            </View>
          ) : null}
          {onFavorite ? (
            <Pressable style={[styles.heartBtn, featured && styles.heartBtnWithFeatured]} onPress={onFavorite} hitSlop={8}>
              <Ionicons name="heart-outline" size={16} color="#fff" />
            </Pressable>
          ) : null}
          {categoryLabel ? (
            <View style={styles.catPill}>
              <Text style={styles.catText} numberOfLines={1}>
                {categoryLabel}
              </Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {event.title}
          </Text>
          <View style={styles.locRow}>
            <Ionicons name="location-outline" size={11} color={colors.emerald} />
            <Text style={styles.city} numberOfLines={1} ellipsizeMode="tail">
              {city}
            </Text>
          </View>
          <View style={styles.locRow}>
            <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
            <Text style={styles.loc} numberOfLines={1} ellipsizeMode="tail">
              {formatEventDateRange(event.startsAt, event.endsAt ?? undefined)}
            </Text>
          </View>
        </View>
      </Pressable>

      <View style={styles.actions}>
        {onBook ? (
          <Pressable
            onPress={onBook}
            style={({ pressed }) => [styles.bookBtn, pressed && styles.bookPressed]}
          >
            <Text style={styles.bookLabel}>Book Ticket</Text>
          </Pressable>
        ) : null}
        <Pressable
          onPress={onPress}
          style={({ pressed }) => [styles.detailsBtn, pressed && styles.bookPressed]}
        >
          <Text style={styles.detailsLabel}>View Details</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginRight: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    flexDirection: "column",
  },
  tapArea: {
    flex: 1,
    minHeight: 0,
  },
  pressed: { opacity: 0.94 },
  posterWrap: {
    height: 88,
    backgroundColor: colors.navyLight,
  },
  poster: { width: "100%", height: "100%" },
  dateBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: colors.cta,
    borderRadius: radius.sm,
    paddingHorizontal: 7,
    paddingVertical: 4,
    alignItems: "center",
    minWidth: 40,
  },
  dateDay: { color: "#fff", fontSize: 14, fontWeight: "800", lineHeight: 16 },
  dateMon: { color: "rgba(255,255,255,0.9)", fontSize: 8, fontWeight: "700" },
  featuredBadge: {
    position: "absolute",
    top: 8,
    left: 52,
    backgroundColor: colors.emerald,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  featuredText: { color: "#fff", fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  heartBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartBtnWithFeatured: {},
  catPill: {
    position: "absolute",
    bottom: 8,
    left: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  catText: { color: "#fff", fontSize: 9, fontWeight: "600" },
  body: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 10,
    paddingTop: 6,
    paddingBottom: 2,
    gap: 2,
    overflow: "hidden",
  },
  title: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.navy,
    lineHeight: 16,
    flexShrink: 1,
  },
  locRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 0,
  },
  city: {
    flex: 1,
    fontSize: 11,
    fontWeight: "700",
    color: colors.navy,
    lineHeight: 13,
  },
  loc: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
    lineHeight: 12,
  },
  actions: {
    flexShrink: 0,
    flexDirection: "row",
    gap: 6,
    marginHorizontal: 8,
    marginTop: 2,
    marginBottom: 8,
  },
  bookBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.emerald,
  },
  detailsBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.emerald,
    backgroundColor: "transparent",
  },
  bookPressed: { opacity: 0.9 },
  bookLabel: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  detailsLabel: {
    color: colors.emerald,
    fontSize: 10,
    fontWeight: "800",
  },
});
