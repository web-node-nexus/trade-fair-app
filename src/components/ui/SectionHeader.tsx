import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  dark?: boolean;
  /** Wrap with horizontal screen padding */
  inset?: boolean;
};

export function SectionHeader({ title, actionLabel, onAction, dark, inset }: Props) {
  return (
    <View style={[styles.row, inset && styles.inset]}>
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      {actionLabel ? (
        <Pressable onPress={onAction} hitSlop={8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inset: { paddingHorizontal: spacing.screen },
  title: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.3,
  },
  titleDark: {
    color: colors.textOnDark,
  },
  action: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.emerald,
  },
});
