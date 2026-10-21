import { Pressable, StyleSheet, Text, View } from "react-native";
import { useI18n } from "@/context/I18nContext";
import type { Locale } from "@/lib/i18n";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const OPTIONS: { value: Locale; short: string; labelKey: "common.english" | "common.hindi" }[] = [
  { value: "en", short: "EN", labelKey: "common.english" },
  { value: "hi", short: "हिं", labelKey: "common.hindi" },
];

type Props = {
  /** Compact pill for headers (guests + logged-in). */
  compact?: boolean;
};

export function LanguageSwitcher({ compact = false }: Props) {
  const { locale, setLocale, t } = useI18n();

  if (compact) {
    return (
      <View style={styles.compactRow} accessibilityRole="radiogroup" accessibilityLabel={t("common.language")}>
        {OPTIONS.map((opt) => {
          const active = locale === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setLocale(opt.value)}
              style={[styles.compactBtn, active && styles.compactBtnActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              hitSlop={6}
            >
              <Text style={[styles.compactText, active && styles.compactTextActive]}>{opt.short}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.wrap} accessibilityRole="radiogroup" accessibilityLabel={t("common.language")}>
      <Text style={styles.label}>{t("common.language")}</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = locale === opt.value;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setLocale(opt.value)}
              style={[styles.btn, active && styles.btnActive]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
            >
              <Text style={[styles.btnText, active && styles.btnTextActive]}>{t(opt.labelKey)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  row: { flexDirection: "row", gap: spacing.sm },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  btnActive: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
  },
  btnText: { fontWeight: "700", fontSize: 14, color: colors.navy },
  btnTextActive: { color: "#fff" },
  compactRow: {
    flexDirection: "row",
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  compactBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 36,
    alignItems: "center",
  },
  compactBtnActive: {
    backgroundColor: colors.emerald,
  },
  compactText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.navy,
  },
  compactTextActive: {
    color: "#fff",
  },
});
