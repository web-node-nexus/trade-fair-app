import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const CITY_ICONS: Record<string, keyof typeof MaterialCommunityIcons.glyphMap> = {
  delhi: "city-variant-outline",
  mumbai: "office-building-outline",
  bengaluru: "domain",
  bangalore: "domain",
  ahmedabad: "home-city-outline",
  hyderabad: "bank-outline",
  chennai: "ferry",
  kolkata: "bridge",
  pune: "map-marker-outline",
  jaipur: "castle",
};

function iconForCity(city: string): keyof typeof MaterialCommunityIcons.glyphMap {
  const key = city.toLowerCase().split(",")[0]?.trim() ?? "";
  for (const [k, icon] of Object.entries(CITY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return "map-marker-outline";
}

type Props = {
  city: string;
  onPress?: () => void;
  /** vertical card with icon on top (trade fairs page) */
  variant?: "chip" | "card";
};

export function PopularCityChip({ city, onPress, variant = "chip" }: Props) {
  if (variant === "card") {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        <View style={styles.cardIcon}>
          <MaterialCommunityIcons name={iconForCity(city)} size={22} color={colors.textMuted} />
        </View>
        <Text style={styles.cardLabel} numberOfLines={2}>
          {city}
        </Text>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <MaterialCommunityIcons name={iconForCity(city)} size={18} color={colors.emerald} />
      <Text style={styles.label} numberOfLines={1}>
        {city}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.08)",
  },
  card: {
    width: 72,
    alignItems: "center",
    marginRight: spacing.sm,
    paddingVertical: 8,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f4f7f6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
    textAlign: "center",
    lineHeight: 13,
  },
  pressed: { opacity: 0.9 },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.navy,
    maxWidth: 110,
  },
});
