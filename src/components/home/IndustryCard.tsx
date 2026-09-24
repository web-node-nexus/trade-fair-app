import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  "trade-commerce": "storefront-outline",
  technology: "chip",
  "electronics-technology": "chip",
  footwear: "shoe-formal",
  agriculture: "sprout",
  healthcare: "hospital-box-outline",
  "healthcare-medical": "hospital-box-outline",
  "food-beverage": "food-apple-outline",
  "textiles-apparel": "tshirt-crew-outline",
  "automobile-ev": "car-outline",
  "beauty-wellness": "spa-outline",
  "jewellery-gems": "diamond-stone",
};

type Props = {
  name: string;
  slug: string;
  bgColor: string;
  onPress?: () => void;
};

export function IndustryCard({ name, slug, bgColor, onPress }: Props) {
  const icon = ICONS[slug] ?? "domain";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={[styles.iconWrap, { backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name={icon} size={24} color={colors.navy} />
      </View>
      <Text style={styles.label} numberOfLines={2}>
        {name}
      </Text>
    </Pressable>
  );
}

const CARD_W = 88;

const styles = StyleSheet.create({
  card: {
    width: CARD_W,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 6,
    marginRight: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 96,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: radius.sm + 2,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 2,
  },
});
