import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceListing } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  service: ServiceListing;
  onPress?: () => void;
  onContact?: () => void;
};

export function FeaturedServiceCard({ service, onPress, onContact }: Props) {
  const imageUrl = resolveMediaUrl(service.coverImageUrl ?? service.imageUrls?.[0] ?? null);
  const rating = service.exhibitorRatingAvg ?? null;
  const reviewCount = service.exhibitorRatingCount ?? 0;
  const company = service.companyName ?? service.title;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.topRow}>
        <View style={styles.logoWrap}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.logo} contentFit="cover" />
          ) : (
            <View style={[styles.logo, styles.logoFallback]}>
              <Text style={styles.logoEmoji}>🔧</Text>
            </View>
          )}
        </View>
        <View style={styles.meta}>
          <Text style={styles.company} numberOfLines={1}>
            {company}
          </Text>
          {rating != null ? (
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color="#f59e0b" />
              <Text style={styles.ratingText}>
                {rating.toFixed(1)}
                {reviewCount > 0 ? ` (${reviewCount})` : ""}
              </Text>
            </View>
          ) : (
            <Text style={styles.ratingMuted}>New provider</Text>
          )}
        </View>
      </View>
      {service.categoryName ? (
        <Text style={styles.category} numberOfLines={1}>
          {service.categoryName}
        </Text>
      ) : null}
      <Pressable
        style={({ pressed }) => [styles.contactBtn, pressed && { opacity: 0.9 }]}
        onPress={() => (onContact ?? onPress)?.()}
      >
        <Ionicons name="call-outline" size={14} color={colors.emerald} />
        <Text style={styles.contactText}>Contact</Text>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 188,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.08)",
    padding: spacing.sm + 2,
  },
  pressed: { opacity: 0.94 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  logo: { width: "100%", height: "100%" },
  logoFallback: {
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 20 },
  meta: { flex: 1 },
  company: { fontSize: 13, fontWeight: "800", color: colors.navy },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  ratingText: { fontSize: 11, fontWeight: "600", color: colors.textMuted },
  ratingMuted: { fontSize: 10, color: colors.textMuted, marginTop: 2 },
  category: {
    marginTop: 8,
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  contactBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.emerald,
    borderRadius: radius.pill,
    paddingVertical: 7,
  },
  contactText: { fontSize: 12, fontWeight: "700", color: colors.emerald },
});
