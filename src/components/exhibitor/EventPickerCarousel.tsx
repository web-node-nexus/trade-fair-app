import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { BANNER_COLORS } from "@/data/mock";
import { cardShadowSoft } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export type EventPickerItem = {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string | null;
  colorIndex?: number;
};

type Props = {
  events: EventPickerItem[];
  selectedId: string;
  onSelect: (id: string) => void;
  emptyLabel?: string;
};

const CARD_WIDTH = 156;
const IMAGE_HEIGHT = 88;
const BODY_HEIGHT = 54;
const CARD_HEIGHT = IMAGE_HEIGHT + BODY_HEIGHT;

export function EventPickerCarousel({
  events,
  selectedId,
  onSelect,
  emptyLabel = "No events available",
}: Props) {
  if (events.length === 0) {
    return (
      <View style={styles.empty}>
        <Ionicons name="calendar-outline" size={22} color={colors.textMuted} />
        <Text style={styles.emptyText}>{emptyLabel}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {events.map((event, index) => {
        const active = selectedId === event.id;
        const fallback = BANNER_COLORS[(event.colorIndex ?? index) % BANNER_COLORS.length];

        return (
          <Pressable
            key={event.id}
            onPress={() => onSelect(event.id)}
            style={({ pressed }) => [
              styles.card,
              active && styles.cardActive,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.imageWrap}>
              {event.imageUrl ? (
                <Image
                  source={{ uri: event.imageUrl }}
                  style={styles.image}
                  contentFit="cover"
                  transition={200}
                  recyclingKey={event.id}
                />
              ) : (
                <View style={[styles.image, styles.imageFallback, { backgroundColor: fallback }]}>
                  <Ionicons name="storefront-outline" size={22} color="rgba(255,255,255,0.85)" />
                </View>
              )}
              {active ? (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#fff" />
                </View>
              ) : null}
            </View>

            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              {event.subtitle ? (
                <View style={styles.subRow}>
                  <Ionicons name="location-outline" size={10} color={colors.textMuted} />
                  <Text style={styles.subtitle} numberOfLines={1}>
                    {event.subtitle}
                  </Text>
                </View>
              ) : (
                <View style={styles.subRow} />
              )}
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    paddingRight: spacing.sm,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    overflow: "hidden",
    ...cardShadowSoft,
  },
  cardActive: {
    borderColor: colors.emerald,
    borderWidth: 2,
  },
  pressed: { opacity: 0.94 },
  imageWrap: {
    height: IMAGE_HEIGHT,
    backgroundColor: colors.navyLight,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  imageFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  selectedBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: colors.emerald,
    borderRadius: 12,
    padding: 1,
  },
  body: {
    height: BODY_HEIGHT,
    paddingHorizontal: 10,
    paddingTop: 7,
    paddingBottom: 8,
    justifyContent: "flex-start",
  },
  title: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.navy,
    lineHeight: 16,
    height: 32,
  },
  subRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    height: 14,
    marginTop: 2,
  },
  subtitle: {
    flex: 1,
    fontSize: 10,
    color: colors.textMuted,
  },
  empty: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  emptyText: { fontSize: 13, color: colors.textMuted, fontWeight: "600" },
});
