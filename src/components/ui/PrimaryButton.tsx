import { Pressable, StyleSheet, Text, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/spacing";

type Props = {
  label: string;
  onPress?: () => void;
  variant?: "emerald" | "navy" | "outline" | "cta";
  style?: ViewStyle;
  compact?: boolean;
  disabled?: boolean;
};

export function PrimaryButton({ label, onPress, variant = "emerald", style, compact, disabled }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        compact && styles.compact,
        variant === "emerald" && styles.emerald,
        variant === "navy" && styles.navy,
        variant === "cta" && styles.cta,
        variant === "outline" && styles.outline,
        (pressed && !disabled) && styles.pressed,
        disabled && styles.disabled,
        disabled && variant === "outline" && styles.disabledOutline,
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          variant === "outline" && styles.outlineLabel,
          compact && styles.compactLabel,
          disabled && styles.disabledLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  compact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  emerald: {
    backgroundColor: colors.emerald,
  },
  navy: {
    backgroundColor: colors.navy,
  },
  cta: {
    backgroundColor: colors.cta,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: colors.emerald,
  },
  pressed: {
    opacity: 0.88,
  },
  disabled: {
    opacity: 1,
    backgroundColor: "#cbd5e1",
  },
  disabledOutline: {
    backgroundColor: "transparent",
    borderColor: "#cbd5e1",
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  compactLabel: {
    fontSize: 13,
  },
  outlineLabel: {
    color: colors.emerald,
  },
  disabledLabel: {
    color: "#64748b",
  },
});
