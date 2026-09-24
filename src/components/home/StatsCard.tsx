import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const STATS = [
  { value: "500+", label: "Upcoming Events" },
  { value: "10,000+", label: "Exhibitors" },
  { value: "5,00,000+", label: "Business Visitors" },
];

export function StatsCard() {
  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        {STATS.map((s, i) => (
          <View key={s.label} style={[styles.col, i < STATS.length - 1 && styles.colBorder]}>
            <Text style={styles.value}>{s.value}</Text>
            <Text style={styles.label}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: -28,
    paddingHorizontal: spacing.lg,
    zIndex: 2,
  },
  card: {
    flexDirection: "row",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 6,
  },
  col: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  colBorder: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
  },
  value: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: 4,
  },
  label: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 14,
  },
});
