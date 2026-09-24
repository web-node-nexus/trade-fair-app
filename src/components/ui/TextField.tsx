import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";
import { normalizePlainText } from "@/lib/normalizePlainText";

type Props = TextInputProps & {
  label?: string;
  error?: string;
  dark?: boolean;
};

export function TextField({ label, error, dark, style, secureTextEntry, onChangeText, ...props }: Props) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const isPassword = Boolean(secureTextEntry);

  return (
    <View style={styles.wrap}>
      {label ? <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text> : null}
      <View style={styles.inputWrap}>
        <TextInput
          placeholderTextColor={dark ? "rgba(248,250,252,0.4)" : colors.textMuted}
          style={[
            styles.input,
            dark && styles.inputDark,
            error && styles.inputError,
            isPassword && styles.inputWithToggle,
            style,
          ]}
          secureTextEntry={isPassword ? hidden : false}
          onChangeText={(t) => onChangeText?.(isPassword ? t : normalizePlainText(t))}
          {...props}
        />
        {isPassword ? (
          <Pressable
            onPress={() => setHidden((v) => !v)}
            style={styles.toggle}
            accessibilityRole="button"
            accessibilityLabel={hidden ? "Show password" : "Hide password"}
          >
            <Ionicons name={hidden ? "eye-outline" : "eye-off-outline"} size={20} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: appFontFamily,
    color: colors.navy,
    marginBottom: 6,
  },
  labelDark: { color: colors.textOnDarkMuted },
  inputWrap: { position: "relative" },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: appFontFamily,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  inputWithToggle: {
    paddingRight: 44,
  },
  inputDark: {
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.08)",
    color: colors.textOnDark,
    fontFamily: appFontFamily,
  },
  inputError: { borderColor: "#ef4444" },
  toggle: {
    position: "absolute",
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  error: { marginTop: 4, fontSize: 12, color: "#ef4444", fontFamily: appFontFamily },
});
