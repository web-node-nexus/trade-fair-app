import { ReactNode } from "react";
import { Platform, Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
  contentStyle?: ViewStyle;
  onRefresh?: () => void | Promise<void>;
};

export function AuthScreenLayout({
  title,
  subtitle,
  children,
  contentStyle,
  onRefresh = async () => {},
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshControl } = usePullToRefresh(onRefresh);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color={colors.navy} />
        </Pressable>
        <BrandLogo size="auth" showTagline={false} style={styles.logo} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.form,
          { paddingBottom: insets.bottom + spacing.xxl },
          contentStyle,
        ]}
        extraScrollHeight={Platform.OS === "android" ? 32 : 20}
        refreshControl={refreshControl}
      >
        {children}
      </KeyboardAwareScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
    marginBottom: spacing.sm,
  },
  logo: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.4,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  form: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    marginTop: -12,
  },
});
