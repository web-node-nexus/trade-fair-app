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
  stalls: Stall[];
  selectedId: string;
  onSelect: (stallId: string) => void;
};

function stallSortValue(label: string): number | null {
  const match = label.trim().match(/^(?:stall\s*(?:no\.?|number|#)?\s*)?0*(\d+)$/i);
  if (!match) return null;
  const n = Number(match[1]);
  return Number.isFinite(n) ? n : null;
}

function displayStallNo(label: string): string {
  const t = label.trim();
  if (!t) return "Stall";
  if (/^stall\b/i.test(t)) return t;
  return `Stall ${t}`;
}

export function StallNumberPicker({ imageUrl, stalls, selectedId, onSelect }: Props) {
  const ordered = useMemo(
    () =>
      [...stalls].sort((a, b) => {
        const na = stallSortValue(a.label);
        const nb = stallSortValue(b.label);
        if (na != null && nb != null && na !== nb) return na - nb;
        if (na != null && nb == null) return -1;
        if (na == null && nb != null) return 1;
        return a.label.localeCompare(b.label, undefined, { numeric: true });
      }),
    [stalls]
  );
  const src = resolveMediaUrl(imageUrl);

  return (
    <View style={styles.wrap}>
      {src ? (
        <Image source={{ uri: src }} style={styles.map} contentFit="contain" transition={200} />
      ) : null}

      <Text style={styles.hint}>Tap an available stall number. Booked stalls are disabled.</Text>

      <ScrollView style={styles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {ordered.length === 0 ? (
          <Text style={styles.hint}>No stall numbers yet.</Text>
        ) : null}
        {ordered.map((stall) => {
          const unavailable = stall.status !== "available";
          const active = stall.id === selectedId;
          const statusLabel =
            stall.status === "available"
              ? "Available"
              : stall.status.charAt(0).toUpperCase() + stall.status.slice(1);

          return (
            <Pressable
              key={stall.id}
              disabled={unavailable}
              onPress={() => onSelect(stall.id)}
              style={[
                styles.row,
                active && styles.rowActive,
                unavailable && styles.rowDisabled,
              ]}
            >
              <Text style={[styles.num, unavailable && styles.textMuted]}>{displayStallNo(stall.label)}</Text>
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
