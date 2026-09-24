import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = { label?: string };

export function LoadingView({ label }: Props) {
  return (
    <View style={styles.wrap}>
      <ActivityIndicator size="large" color={colors.emerald} />
      {label ? <Text style={styles.label}>{label}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  label: { fontSize: 14, color: colors.textMuted, fontWeight: "600" },
});
