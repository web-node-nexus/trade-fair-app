import { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWorkspaceNavOptional } from "@/context/WorkspaceNavContext";
import { colors } from "@/theme/colors";
import { cardShadow } from "@/theme/cardShadow";
import { spacing } from "@/theme/spacing";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
};

/** Sticky bottom bar for workspace screens (above tab bar). */
export function WorkspaceFooter({ children, style }: Props) {
  const insets = useSafeAreaInsets();
  const ws = useWorkspaceNavOptional();
  const bottomPad = ws?.active ? spacing.sm : insets.bottom + spacing.sm;

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: spacing.md,
    paddingHorizontal: 0,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    ...cardShadow,
  },
});
