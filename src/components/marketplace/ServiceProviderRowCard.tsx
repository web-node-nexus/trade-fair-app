import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceListing } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  service: ServiceListing;
  onPress?: () => void;
};

export function ServiceProviderRowCard({ service, onPress }: Props) {
  const imageUrl = resolveMediaUrl(service.coverImageUrl ?? service.imageUrls?.[0] ?? null);
  const rating = service.exhibitorRatingAvg;
  const reviews = service.exhibitorRatingCount ?? 0;

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.96 }]}>
      <View style={styles.logoWrap}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={styles.logo} contentFit="cover" />
        ) : (
          <View style={[styles.logo, styles.logoFb]}>
            <Text style={{ fontSize: 22 }}>🔧</Text>
          </View>
        )}
      </View>
      <View style={styles.main}>
        <Text style={styles.name} numberOfLines={1}>
          {service.companyName ?? service.title}
        </Text>
        <Text style={styles.cat} numberOfLines={1}>
          {service.categoryName ?? "Service provider"}
          {service.serviceArea ? ` · ${service.serviceArea}` : ""}
        </Text>
        {rating != null ? (
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={12} color="#f59e0b" />
            <Text style={styles.rating}>
              {rating.toFixed(1)} ({reviews} reviews)
            </Text>
          </View>
        ) : (
          <Text style={styles.ratingMuted}>New on platform</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable style={styles.contactBtn} onPress={onPress}>
          <Text style={styles.contactText}>Contact</Text>
        </Pressable>
        <Pressable
          style={styles.waBtn}
          onPress={() => void Linking.openURL("https://wa.me/?text=Hi, I need a quote for exhibition services")}
        >
          <Ionicons name="logo-whatsapp" size={16} color="#fff" />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
    gap: 10,
  },
  logoWrap: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  logo: { width: "100%", height: "100%" },
  logoFb: { backgroundColor: "#f0fdf4", alignItems: "center", justifyContent: "center" },
  main: { flex: 1 },
  name: { fontSize: 14, fontWeight: "800", color: colors.navy },
  cat: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 4 },
  rating: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  ratingMuted: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  actions: { alignItems: "flex-end", gap: 6 },
  contactBtn: {
    borderWidth: 1,
    borderColor: colors.emerald,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  contactText: { fontSize: 11, fontWeight: "700", color: colors.emerald },
  waBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
});
