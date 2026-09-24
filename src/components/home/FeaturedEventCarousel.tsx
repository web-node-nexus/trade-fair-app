import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Linking,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import type { HomeBanner, PublicEvent } from "@/api/types";
import { resolveEventCoverUrl, resolveMediaUrl } from "@/lib/mediaUrl";
import { eventCityLabel, formatEventDateRange } from "@/utils/eventFormat";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const { width: SW } = Dimensions.get("window");
const CARD_W = SW - spacing.screen * 2;
/** Shorter featured hero — ~48% of card width (was 62%). */
const CARD_ASPECT = 0.48;

type Slide =
  | { kind: "event"; event: PublicEvent }
  | { kind: "banner"; banner: HomeBanner }
  | { kind: "default" };

type Props = {
  events: PublicEvent[];
  banners?: HomeBanner[];
  /** Kept for callers; featured cards always show Book Ticket + View Details. */
  ctaMode?: "dual" | "details";
  /** When false, parent already applies horizontal screen padding (e.g. inside a padded FlatList). */
  inset?: boolean;
};

export function FeaturedEventCarousel({
  events,
  banners = [],
  ctaMode: _ctaMode = "dual",
  inset = true,
}: Props) {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);

  const slides = useMemo<Slide[]>(() => {
    const out: Slide[] = events.map((event) => ({ kind: "event", event }));
    if (!out.length) {
      for (const banner of banners) {
        out.push({ kind: "banner", banner });
      }
    }
    if (!out.length) out.push({ kind: "default" });
    return out;
  }, [events, banners]);

  const cardW = inset ? CARD_W : SW - spacing.screen * 2;
  const slideStride = cardW + spacing.sm;

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => {
      setIndex((prev) => {
        const next = (prev + 1) % slides.length;
        scrollRef.current?.scrollTo({ x: next * slideStride, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(t);
  }, [slides.length, slideStride]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / slideStride);
    if (i >= 0 && i < slides.length) setIndex(i);
  };

  const scrollPad = inset ? spacing.screen : 0;

  return (
    <View style={styles.wrap}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={slideStride}
        decelerationRate="fast"
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.scroll, { paddingHorizontal: scrollPad }]}
      >
        {slides.map((slide, i) => {
          const cardStyle = [styles.card, { width: cardW, height: Math.round(cardW * CARD_ASPECT) }];
          if (slide.kind === "event") {
            const event = slide.event;
            const src = resolveEventCoverUrl(event.coverImageUrl, event.imageUrls);
            const city = eventCityLabel(event);
            return (
              <View key={`ev-${event.id}`} style={cardStyle}>
                {src ? (
                  <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
                )}
                <LinearGradient
                  colors={["rgba(10,31,61,0.08)", "rgba(10,31,61,0.5)", "rgba(10,31,61,0.94)"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.content}>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>FEATURED</Text>
                  </View>
                  <Text style={styles.title} numberOfLines={1}>
                    {event.title}
                  </Text>
                  <View style={styles.metaRow}>
                    <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.95)" />
                    <Text style={styles.cityText} numberOfLines={1}>
                      {city}
                    </Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.9)" />
                    <Text style={styles.metaText}>
                      {formatEventDateRange(event.startsAt, event.endsAt ?? undefined)}
                    </Text>
                  </View>
                  <View style={styles.actions}>
                    <Pressable
                      style={styles.primaryBtn}
                      onPress={() => router.push(`/event/${event.id}/book` as never)}
                    >
                      <Text style={styles.primaryBtnText}>Book Ticket</Text>
                    </Pressable>
                    <Pressable
                      style={styles.secondaryBtn}
                      onPress={() => router.push(`/event/${event.id}` as never)}
                    >
                      <Text style={styles.secondaryBtnText}>View Details</Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          }

          if (slide.kind === "banner") {
            const src = resolveMediaUrl(slide.banner.imageUrl);
            return (
              <Pressable
                key={`bn-${slide.banner.id}`}
                style={cardStyle}
                onPress={() => {
                  const url = slide.banner.linkUrl;
                  if (!url) return;
                  if (url.startsWith("/")) router.push(url as never);
                  else if (url.startsWith("http")) void Linking.openURL(url);
                }}
              >
                {src ? (
                  <Image source={{ uri: src }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <View style={[StyleSheet.absoluteFill, styles.placeholder]} />
                )}
                <LinearGradient
                  colors={["transparent", "rgba(10,31,61,0.35)"]}
                  style={StyleSheet.absoluteFill}
                />
              </Pressable>
            );
          }

          return (
            <View key="default" style={cardStyle}>
              <LinearGradient
                colors={["#0f766e", "#0a1f3d", "#0a1f3d"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.content}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>TRADE FAIR WALA</Text>
                </View>
                <Text style={styles.title}>Discover exhibitions across India</Text>
                <Text style={styles.metaText}>
                  Book stalls, visitor passes & booth services — all in one place.
                </Text>
                <View style={styles.actions}>
                  <Pressable
                    style={styles.primaryBtn}
                    onPress={() => router.push("/(tabs)/trade-fairs" as never)}
                  >
                    <Text style={styles.primaryBtnText}>Browse Fairs</Text>
                  </Pressable>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => router.push("/(tabs)/explore" as never)}
                  >
                    <Text style={styles.secondaryBtnText}>Find Services</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      {slides.length > 1 ? (
        <View style={styles.dots}>
          {slides.map((s, i) => (
            <View
              key={s.kind === "event" ? s.event.id : s.kind === "banner" ? s.banner.id : "default"}
              style={[styles.dot, i === index && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.sm },
  scroll: { gap: spacing.sm },
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
    backgroundColor: colors.navy,
  },
  placeholder: { backgroundColor: colors.navyLight },
  content: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: colors.emerald,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.pill,
    marginBottom: 5,
  },
  badgeText: {
    color: "#fff",
    fontSize: 8,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 20,
    marginBottom: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 2,
  },
  cityText: {
    flex: 1,
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 15,
  },
  metaText: {
    flex: 1,
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "500",
    lineHeight: 14,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.emerald,
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    paddingVertical: 8,
    borderRadius: radius.md,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 5,
    marginTop: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(10,31,61,0.2)",
  },
  dotActive: {
    width: 16,
    backgroundColor: colors.emerald,
  },
});
