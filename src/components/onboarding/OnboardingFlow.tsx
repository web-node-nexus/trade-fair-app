import { useCallback, useEffect, useRef, useState } from "react";
import {
  Dimensions,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { completeOnboarding } from "@/lib/onboardingStorage";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import {
  BookIllustration,
  ConnectIllustration,
  DiscoverIllustration,
  NavigateIllustration,
} from "./OnboardingIllustrations";

const { width: SCREEN_W } = Dimensions.get("window");
const TOTAL = 4;

const SLIDES = [
  {
    key: "discover",
    step: "01",
    title: "Discover Trade Fairs Near You",
    body: "Browse nearby exhibitions and trade fairs in one place",
    Illustration: DiscoverIllustration,
  },
  {
    key: "book",
    step: "02",
    title: "Book Your Stall Instantly",
    body: "Book a stall at any trade fair directly in the app — no hassle",
    Illustration: BookIllustration,
  },
  {
    key: "navigate",
    step: "03",
    title: "Live Map & Navigation",
    body: "Never get lost inside the venue — find every stall easily on the live map",
    Illustration: NavigateIllustration,
  },
  {
    key: "connect",
    step: "04",
    title: "Connect with Exhibitors",
    body: "Connect directly with exhibitors — grow your business and seize opportunities",
    Illustration: ConnectIllustration,
  },
] as const;

type Props = { onComplete: () => void };

function SlideContent({
  item,
  visible,
}: {
  item: (typeof SLIDES)[number];
  visible: boolean;
}) {
  const progress = useSharedValue(visible ? 0 : 1);

  useEffect(() => {
    progress.value = 0;
    if (visible) {
      progress.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    }
  }, [visible, progress]);

  const artStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [24, 0]) },
      { scale: interpolate(progress.value, [0, 1], [0.94, 1]) },
    ],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.2, 1], [0, 1]),
    transform: [{ translateY: interpolate(progress.value, [0.2, 1], [16, 0]) }],
  }));

  const Illustration = item.Illustration;

  return (
    <View style={[styles.slide, { width: SCREEN_W }]}>
      <Text style={styles.stepCounter}>
        {item.step} / 0{TOTAL}
      </Text>

      <Animated.View style={[styles.artCard, artStyle]}>
        <Illustration />
      </Animated.View>

      <Animated.View style={[styles.copy, copyStyle]}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
      </Animated.View>
    </View>
  );
}

export function OnboardingFlow({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
      if (i !== index) setIndex(i);
    },
    [index]
  );

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const i = viewableItems[0]?.index;
    if (typeof i === "number") setIndex(i);
  }).current;

  const goNext = useCallback(async () => {
    if (index < SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: index + 1, animated: true });
      return;
    }
    await completeOnboarding();
    onComplete();
  }, [index, onComplete]);

  const skip = useCallback(async () => {
    await completeOnboarding();
    onComplete();
  }, [onComplete]);

  const isLast = index === SLIDES.length - 1;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <FlatList
        ref={listRef}
        data={SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScroll}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
        keyExtractor={(s) => s.key}
        getItemLayout={(_, i) => ({ length: SCREEN_W, offset: SCREEN_W * i, index: i })}
        renderItem={({ item, index: slideIndex }) => (
          <SlideContent item={item} visible={slideIndex === index} />
        )}
      />

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? "Get started" : "Next slide"}
          onPress={() => void goNext()}
          style={({ pressed }) => [
            styles.nextBtn,
            isLast && styles.nextBtnSolid,
            { transform: [{ scale: pressed ? 0.94 : 1 }] },
          ]}
        >
          <Ionicons
            name={isLast ? "checkmark" : "arrow-forward"}
            size={22}
            color={isLast ? "#ffffff" : colors.emerald}
          />
        </Pressable>

        {!isLast ? (
          <Pressable onPress={() => void skip()} hitSlop={12} style={styles.skipWrap}>
            <Text style={styles.skip}>Skip</Text>
          </Pressable>
        ) : (
          <View style={styles.skipWrap} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#ffffff" },
  slide: {
    flex: 1,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    alignItems: "center",
  },
  stepCounter: {
    alignSelf: "flex-start",
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: spacing.lg,
  },
  artCard: {
    width: 260,
    height: 260,
    borderRadius: 32,
    backgroundColor: "#f0fdf4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d1fae5",
  },
  copy: { alignItems: "center", maxWidth: 320, paddingHorizontal: spacing.sm },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: colors.navy,
    textAlign: "center",
    letterSpacing: -0.4,
    lineHeight: 30,
  },
  body: {
    marginTop: spacing.sm,
    fontSize: 15,
    lineHeight: 23,
    color: colors.textMuted,
    textAlign: "center",
  },
  footer: {
    alignItems: "center",
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.md,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    width: 28,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.emerald,
  },
  nextBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.emerald,
    backgroundColor: "#ffffff",
  },
  nextBtnSolid: {
    backgroundColor: colors.emerald,
    borderColor: colors.emerald,
    shadowColor: colors.emerald,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 6,
  },
  skipWrap: { minHeight: 24, justifyContent: "center" },
  skip: { color: colors.textMuted, fontSize: 14, fontWeight: "600" },
});
