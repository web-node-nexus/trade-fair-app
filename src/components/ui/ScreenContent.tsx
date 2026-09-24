import { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { spacing } from "@/theme/spacing";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  noTop?: boolean;
};

/** Consistent horizontal screen padding for tab & list screens. */
export function ScreenContent({ children, style, noTop }: Props) {
  return (
    <View style={[styles.wrap, !noTop && styles.top, style]}>{children}</View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.screen },
  top: { paddingTop: spacing.md },
});
