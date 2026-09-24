import { ReactNode } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { useWorkspaceNavOptional } from "@/context/WorkspaceNavContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { screenScrollBottomPad, workspaceScrollBottomPad } from "@/lib/tabBarInsets";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: ReactNode;
  children: ReactNode;
  contentStyle?: ViewStyle;
  scroll?: boolean;
  keyboardAvoid?: boolean;
  largeTitle?: boolean;
  onRefresh?: () => void | Promise<void>;
};

export function ScreenShell({
  title,
  subtitle,
  onBack,
  right,
  children,
  contentStyle,
  scroll = false,
  keyboardAvoid = false,
  largeTitle = true,
  onRefresh,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const ws = useWorkspaceNavOptional();
  const inWorkspace = Boolean(ws?.active);
  const showBack =
    Boolean(onBack) || (inWorkspace && ws?.isDetailRoute) || (!inWorkspace && router.canGoBack());
  const scrollBottomPad = inWorkspace
    ? workspaceScrollBottomPad(insets.bottom)
    : screenScrollBottomPad(insets.bottom);
  const { refreshControl } = usePullToRefresh(onRefresh);

  const useScroll = scroll || Boolean(onRefresh);
  const useKeyboardScroll = keyboardAvoid;

  const body = (
    <View
      style={[
        styles.body,
        useScroll && styles.bodyInScroll,
        contentStyle,
        !useScroll && { paddingBottom: scrollBottomPad },
      ]}
    >
      {children}
    </View>
  );

  const scrollableBody = useScroll ? (
    useKeyboardScroll ? (
      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        viewIsInsideTabBar={inWorkspace}
        refreshControl={refreshControl}
      >
        {body}
      </KeyboardAwareScrollView>
    ) : (
      <ScrollView
        style={styles.flex}
        contentContainerStyle={{ paddingBottom: scrollBottomPad }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {body}
      </ScrollView>
    )
  ) : useKeyboardScroll ? (
    <KeyboardAwareScrollView
      style={styles.flex}
      contentContainerStyle={{ paddingBottom: scrollBottomPad }}
      viewIsInsideTabBar={inWorkspace}
    >
      {body}
    </KeyboardAwareScrollView>
  ) : (
    body
  );

  function handleBack() {
    if (onBack) onBack();
    else router.back();
  }

  return (
    <View style={styles.root}>
      <View style={[styles.nav, { paddingTop: insets.top + spacing.xs }]}>
        {showBack ? (
          <Pressable onPress={handleBack} style={styles.iconBtn} hitSlop={12}>
            <Ionicons name="chevron-back" size={26} color={colors.navy} />
          </Pressable>
        ) : (
          <View style={styles.iconSpacer} />
        )}

        {!largeTitle ? (
          <Text style={styles.navTitle} numberOfLines={1}>
            {title}
          </Text>
        ) : (
          <View style={{ flex: 1 }} />
        )}

        {right ?? <View style={styles.iconSpacer} />}
      </View>

      {largeTitle ? (
        <View style={styles.titleBlock}>
          <Text style={styles.largeTitle}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
      ) : null}

      {scrollableBody}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  nav: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.screen - 4,
    paddingBottom: spacing.xs,
    backgroundColor: colors.background,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  iconSpacer: { width: 40 },
  navTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "700",
    color: colors.navy,
  },
  titleBlock: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  largeTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: colors.navy,
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: colors.textMuted,
  },
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
  },
  bodyInScroll: {
    flexGrow: 0,
    flexShrink: 0,
  },
});
