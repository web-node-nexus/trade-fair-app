import { useMemo } from "react";
import { Image } from "expo-image";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Stall = {
  id: string;
  label: string;
  status: string;
};

type Props = {
  imageUrl: string;
  stallNumberCount: number;
  stalls: Stall[];
  selectedId: string;
  onSelect: (stallId: string) => void;
};

export function StallNumberPicker({ imageUrl, stallNumberCount, stalls, selectedId, onSelect }: Props) {
  const stallByLabel = useMemo(() => {
    const m = new Map<string, Stall>();
    for (const s of stalls) m.set(s.label.trim(), s);
    return m;
  }, [stalls]);

  const count = Math.min(100, Math.max(1, stallNumberCount || 100));
  const src = resolveMediaUrl(imageUrl);

  return (
    <View style={styles.wrap}>
      {src ? (
        <Image source={{ uri: src }} style={styles.map} contentFit="contain" transition={200} />
      ) : null}

      <Text style={styles.hint}>Tap an available stall number. Booked stalls are disabled.</Text>

      <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {Array.from({ length: count }, (_, i) => i + 1).map((n) => {
          const stall = stallByLabel.get(String(n));
          const unavailable =
            !stall || stall.status === "booked" || stall.status === "held" || stall.status === "blocked";
          const active = stall?.id === selectedId;
          let statusLabel = "Available";
          if (!stall) statusLabel = "Not set up";
          else if (stall.status === "booked") statusLabel = "Booked";
          else if (stall.status === "held") statusLabel = "Held";
          else if (stall.status === "blocked") statusLabel = "Blocked";

          return (
            <Pressable
              key={n}
              disabled={unavailable}
              onPress={() => stall && onSelect(stall.id)}
              style={[
                styles.row,
                active && styles.rowActive,
                unavailable && styles.rowDisabled,
              ]}
            >
              <Text style={[styles.num, unavailable && styles.textMuted]}>Stall {n}</Text>
              <Text style={[styles.status, unavailable && styles.textMuted]}>{statusLabel}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  map: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.navyLight,
  },
  hint: { fontSize: 12, color: colors.textMuted },
  list: { maxHeight: 280 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
    marginBottom: 6,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.08)",
    backgroundColor: colors.surface,
  },
  rowActive: {
    borderColor: colors.emerald,
    backgroundColor: "#ecfdf5",
  },
  rowDisabled: { opacity: 0.55 },
  num: { fontSize: 14, fontWeight: "800", color: colors.navy },
  status: { fontSize: 12, fontWeight: "600", color: colors.emerald },
  textMuted: { color: colors.textMuted },
});
