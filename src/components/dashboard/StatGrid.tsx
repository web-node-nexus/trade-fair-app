import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export type StatCell = {
  label: string;
  value: number | string;
  route?: string;
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  bg: string;
};

type Props = {
  cells: StatCell[];
  loading?: boolean;
  onPress?: (route: string) => void;
};

export function StatGrid({ cells, loading, onPress }: Props) {
  if (loading) {
    return (
      <View style={styles.grid}>
        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={[styles.cell, styles.skeleton]} />
        ))}
      </View>
    );
  }

  return (
    <View style={styles.grid}>
      {cells.map((cell) => {
        const inner = (
          <>
            <View style={[styles.icon, { backgroundColor: cell.bg }]}>
              <Ionicons name={cell.icon} size={18} color={cell.tint} />
            </View>
            <Text style={styles.value}>{cell.value}</Text>
            <Text style={styles.label}>{cell.label}</Text>
          </>
        );

        if (cell.route && onPress) {
          return (
            <Pressable
              key={cell.label}
              style={({ pressed }) => [styles.cell, pressed && styles.pressed]}
              onPress={() => onPress(cell.route!)}
            >
              {inner}
            </Pressable>
          );
        }

        return (
          <View key={cell.label} style={styles.cell}>
            {inner}
          </View>
        );
      })}
    </View>
  );
}

export function StatGridLoader() {
  return (
    <View style={styles.loaderWrap}>
      <ActivityIndicator color={colors.emerald} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  cell: {
    width: "48%",
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  pressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
  skeleton: { height: 96, backgroundColor: colors.border },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  value: { fontSize: 26, fontWeight: "800", color: colors.navy, letterSpacing: -0.5 },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  loaderWrap: { paddingVertical: spacing.xl, alignItems: "center" },
});
