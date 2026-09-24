import { useEffect, useRef, useState } from "react";
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import type { HomeBanner } from "@/api/types";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const { width: SCREEN_W } = Dimensions.get("window");
const BANNER_W = SCREEN_W - spacing.screen * 2;
const BANNER_H = Math.round(BANNER_W * 0.42);

type Props = {
  banners: HomeBanner[];
};

export function BannerCarousel({ banners }: Props) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % banners.length;
        scrollRef.current?.scrollTo({ x: next * (BANNER_W + spacing.md), animated: true });
        return next;
      });
    }, 4500);
    return () => clearInterval(t);
  }, [banners.length]);

  if (!banners.length) return null;

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (BANNER_W + spacing.md));
    if (i >= 0 && i < banners.length) setIndex(i);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled={false}
        snapToInterval={BANNER_W + spacing.md}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scroll}
      >
        {banners.map((b) => {
          const src = resolveMediaUrl(b.imageUrl);
          return (
            <AnimatedPressable
              key={b.id}
              style={styles.banner}
              onPress={() => {
                if (!b.linkUrl) return;
                if (b.linkUrl.startsWith("/")) {
                  router.push(b.linkUrl as never);
                } else if (b.linkUrl.startsWith("http")) {
                  void Linking.openURL(b.linkUrl);
                }
              }}
            >
              {src ? (
                <Image source={{ uri: src }} style={styles.image} contentFit="cover" transition={300} />
              ) : (
                <View style={[styles.image, styles.placeholder]} />
              )}
            </AnimatedPressable>
          );
        })}
      </ScrollView>
      {banners.length > 1 ? (
        <View style={styles.dots}>
          {banners.map((b, i) => (
            <View key={b.id} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  scroll: { paddingHorizontal: spacing.screen, gap: spacing.md },
  banner: {
    width: BANNER_W,
    height: BANNER_H,
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.navyLight,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 6,
  },
  image: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: colors.navyLight },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginTop: spacing.sm,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(10,31,61,0.2)",
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.emerald,
  },
});
