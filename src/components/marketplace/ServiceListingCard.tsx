import { Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import type { ServiceListing } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cardShadowSoft } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  service: ServiceListing;
  width?: number;
  onPress?: () => void;
};

export const SERVICE_LISTING_CARD_W = 168;
export const SERVICE_LISTING_CARD_H = 188;

export function ServiceListingCard({ service, width = SERVICE_LISTING_CARD_W, onPress }: Props) {
  const imageUrl = resolveMediaUrl(service.coverImageUrl ?? service.imageUrls?.[0] ?? null);
  const price = service.priceMinor ? Number(service.priceMinor) : 0;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { width, height: SERVICE_LISTING_CARD_H },
        pressed && styles.pressed,
        cardShadowSoft,
      ]}
    >
      <View style={styles.imageWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.image} contentFit="cover" transition={250} />
        ) : (
          <View style={[styles.image, styles.imageFallback]}>
            <Text style={styles.emoji}>🔧</Text>
          </View>
        )}
        {service.categoryName ? (
          <View style={styles.catPill}>
            <Text style={styles.catText} numberOfLines={1}>
              {service.categoryName}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {service.title}
        </Text>
        <Text style={styles.company} numberOfLines={1}>
          {service.companyName ?? "Service provider"}
        </Text>
        <Text style={styles.price} numberOfLines={1}>
          {price > 0
            ? `From ₹${(price / 100).toLocaleString("en-IN")}${service.currency ? ` ${service.currency}` : ""}`
            : "Enquire"}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: "hidden",
    marginRight: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    flexDirection: "column",
  },
  pressed: { opacity: 0.92 },
  imageWrap: { position: "relative", height: 100 },
  image: { width: "100%", height: "100%" },
  imageFallback: {
    backgroundColor: "#ede9fe",
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 28 },
  catPill: {
    position: "absolute",
    left: 8,
    top: 8,
    maxWidth: "80%",
    backgroundColor: "rgba(255,255,255,0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
  },
  catText: { fontSize: 9, fontWeight: "800", color: colors.emeraldDark, textTransform: "uppercase" },
  body: { flex: 1, padding: spacing.sm + 2, gap: 3, justifyContent: "space-between" },
  title: { fontSize: 13, fontWeight: "800", color: colors.navy, lineHeight: 17 },
  company: { fontSize: 11, color: colors.textMuted },
  price: { marginTop: 2, fontSize: 12, fontWeight: "800", color: colors.cta },
});
