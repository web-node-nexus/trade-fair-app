import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { EventCategory, EventMedia, EventOrganizer, PublicEvent, TicketType } from "@/api/types";
import { EventContactsCard } from "@/components/events/EventContactsCard";
import type { EventContact } from "@/api/types";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { fetchCategories } from "@/api/client";
import { publicJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { EventReviewsSection } from "@/components/events/EventReviewsSection";
import { eventLocation, formatEventDateRange } from "@/utils/eventFormat";
import { parseEventOrganizer } from "@/utils/parseEventOrganizer";
import { useImageZoom } from "@/context/ImageZoomContext";

const { width: SW } = Dimensions.get("window");

export function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [announcements, setAnnouncements] = useState<{ title: string; body: string }[]>([]);
  const [reviews, setReviews] = useState<
    { id: string; rating: number; comment: string | null; reviewerName: string; createdAt: string }[]
  >([]);
  const [organizer, setOrganizer] = useState<EventOrganizer | null>(null);
  const [contacts, setContacts] = useState<EventContact[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [bannerIdx, setBannerIdx] = useState(0);
  const { openImage } = useImageZoom();

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [data, cats] = await Promise.all([
        publicJson<{
          event: PublicEvent;
          organizer?: EventOrganizer | null;
          contacts?: EventContact[];
          ticketTypes: TicketType[];
          media: EventMedia[];
          announcements: { title: string; body: string }[];
          reviews?: { id: string; rating: number; comment: string | null; reviewerName: string; createdAt: string }[];
        }>(`/events/${id}`),
        fetchCategories().catch(() => [] as EventCategory[]),
      ]);
      setEvent(data.event);
      setOrganizer(parseEventOrganizer(data));
      setContacts(data.contacts ?? data.event.contacts ?? []);
      setTickets(data.ticketTypes ?? []);
      setMedia(data.media ?? []);
      setAnnouncements(data.announcements ?? []);
      setReviews(data.reviews ?? []);
      if (cats.length) setCategories(cats);
    } catch {
      setEvent(null);
      setOrganizer(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryNames = useMemo(() => {
    if (!event) return [];
    const ids =
      event.categoryIds?.length ? event.categoryIds
      : event.categoryId != null ? [event.categoryId]
      : [];
    if (!ids.length) return [];
    const byId = new Map(categories.map((c) => [c.id, c.name]));
    return ids.map((cid) => byId.get(cid)).filter((n): n is string => Boolean(n));
  }, [event, categories]);

  const tagList = useMemo(() => {
    if (!event?.tags?.length) return [];
    return event.tags.map((t) => String(t).trim()).filter(Boolean);
  }, [event]);

  if (loading) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={colors.cta} />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.err}>Event not found</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const images = [
    resolveMediaUrl(event.coverImageUrl ?? null),
    ...media.filter((m) => m.mediaType === "image").map((m) => resolveMediaUrl(m.url)),
  ].filter(Boolean) as string[];

  const minPrice = tickets.reduce((min, t) => {
    const p = Number(t.priceMinor);
    if (p <= 0) return min;
    return min === null || p < min ? p : min;
  }, null as number | null);

  const showVerified = Boolean(event.organizerVerified ?? event.isVerified ?? organizer?.verified);

  const ticketsForSale = tickets.some((t) => Math.max(0, Number(t.quota) - Number(t.soldCount)) > 0);
  const bookTicketsDisabled = tickets.length === 0 || !ticketsForSale;

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        refreshControl={refreshControl}
      >
        <View style={styles.heroWrap}>
          {images.length > 0 ? (
            <>
              <FlatList
                horizontal
                pagingEnabled
                data={images}
                keyExtractor={(u, i) => `${i}-${u}`}
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={(e) => {
                  const i = Math.round(e.nativeEvent.contentOffset.x / SW);
                  setBannerIdx(i);
                }}
                renderItem={({ item }) => (
                  <Pressable onPress={() => openImage(item)}>
                    <Image source={{ uri: item }} style={styles.heroImg} contentFit="cover" transition={300} />
                  </Pressable>
                )}
              />
              {images.length > 1 ? (
                <View style={styles.dots}>
                  {images.map((_, i) => (
                    <View key={i} style={[styles.dot, i === bannerIdx && styles.dotActive]} />
                  ))}
                </View>
              ) : null}
            </>
          ) : (
            <View style={[styles.heroImg, styles.heroFallback]} />
          )}
          <Pressable style={[styles.backFab, { top: insets.top + 8 }]} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text style={[styles.title, showVerified && styles.titleWithBadge]}>{event.title}</Text>
            {showVerified ? (
              <View style={styles.verifiedPill}>
                <Ionicons name="shield-checkmark" size={12} color="#fff" />
                <Text style={styles.verifiedPillText}>Verified</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.cta} />
            <Text style={styles.meta}>{eventLocation(event)}</Text>
          </View>
          <Text style={styles.dates}>{formatEventDateRange(event.startsAt, event.endsAt)}</Text>

          {(categoryNames.length > 0 || tagList.length > 0 || event.isB2b || event.isB2c) && (
            <View style={styles.tagsBlock}>
              {categoryNames.length > 0 ? (
                <View style={styles.tagGroup}>
                  <Text style={styles.tagGroupLabel}>Category</Text>
                  <View style={styles.badges}>
                    {categoryNames.map((name) => (
                      <View key={`cat-${name}`} style={styles.categoryPill}>
                        <Text style={styles.categoryPillText}>{name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {tagList.length > 0 ? (
                <View style={styles.tagGroup}>
                  <Text style={styles.tagGroupLabel}>Tags</Text>
                  <View style={styles.badges}>
                    {tagList.map((tag) => (
                      <View key={`tag-${tag}`} style={styles.tagPill}>
                        <Text style={styles.tagPillText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              ) : null}
              {(event.isB2b || event.isB2c) && (
                <View style={styles.badges}>
                  {event.isB2b ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>B2B</Text>
                    </View>
                  ) : null}
                  {event.isB2c ? (
                    <View style={[styles.badge, styles.badgeB2c]}>
                      <Text style={styles.badgeText}>B2C</Text>
                    </View>
                  ) : null}
                </View>
              )}
            </View>
          )}

          {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

          {contacts.length > 0 || organizer ? (
            <EventContactsCard contacts={contacts} organizer={organizer} organizerVerified={showVerified} />
          ) : null}

          {announcements.length > 0 ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Announcements</Text>
              {announcements.slice(0, 3).map((a, i) => (
                <View key={i} style={styles.annCard}>
                  <Text style={styles.annTitle}>{a.title}</Text>
                  <Text style={styles.annBody} numberOfLines={3}>{a.body}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Visitor tickets</Text>
            {tickets.length === 0 ? (
              <Text style={styles.muted}>Tickets not on sale yet.</Text>
            ) : (
              tickets.map((t) => {
                const price = Number(t.priceMinor);
                const left = Math.max(0, t.quota - t.soldCount);
                return (
                  <View key={t.id} style={styles.ticketCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.ticketName}>{t.name}</Text>
                      {left <= 0 ? <Text style={styles.ticketMeta}>Sold out</Text> : null}
                    </View>
                    <Text style={styles.ticketPrice}>{price > 0 ? `₹${(price / 100).toLocaleString("en-IN")}` : "FREE"}</Text>
                  </View>
                );
              })
            )}
          </View>

          {id ? (
            <EventReviewsSection
              eventId={id}
              reviews={reviews}
              reviewsOpen={new Date(event.startsAt).getTime() <= Date.now()}
              onSubmitted={() => {
                void publicJson<{ reviews?: typeof reviews }>(`/events/${id}`).then((d) => setReviews(d.reviews ?? []));
              }}
            />
          ) : null}

          {event.stallBookingEnabled !== false ? (
            <AnimatedPressable style={styles.stallCard} onPress={() => router.push(user ? "/dashboard/exhibitor/book" : "/(auth)/register")}>
              <Ionicons name="grid-outline" size={22} color={colors.emerald} />
              <View style={{ flex: 1 }}>
                <Text style={styles.stallTitle}>Exhibitor stalls</Text>
                <Text style={styles.stallSub}>Book booth space for this fair</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </AnimatedPressable>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.footerLabel}>{t("event.from")}</Text>
          <Text style={styles.footerPrice}>
            {minPrice != null ? `₹${(minPrice / 100).toLocaleString("en-IN")}` : tickets.some((tt) => Number(tt.priceMinor) === 0) ? "FREE" : "—"}
          </Text>
        </View>
        <PrimaryButton
          label={bookTicketsDisabled ? t("event.ticketsUnavailable") : t("event.bookTickets")}
          variant="cta"
          disabled={bookTicketsDisabled}
          style={{ flex: 1, maxWidth: 220 }}
          onPress={() => {
            if (bookTicketsDisabled) return;
            if (!user) router.push("/(auth)/login");
            else router.push(`/event/${id}/book` as never);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { fontSize: 16, color: colors.textMuted },
  backLink: { marginTop: 12, color: colors.cta, fontWeight: "700" },
  heroWrap: { position: "relative", backgroundColor: colors.navy },
  heroImg: { width: SW, height: 280 },
  heroFallback: { backgroundColor: colors.navyLight },
  backFab: {
    position: "absolute",
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { position: "absolute", bottom: 12, alignSelf: "center", flexDirection: "row", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.4)" },
  dotActive: { width: 18, backgroundColor: "#fff" },
  body: { padding: spacing.lg, marginTop: -16, backgroundColor: colors.background, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  title: { fontSize: 24, fontWeight: "800", color: colors.navy, lineHeight: 30, flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "flex-start", gap: 8, flexWrap: "wrap" },
  titleWithBadge: { minWidth: "60%" },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginTop: 2,
  },
  verifiedPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  meta: { flex: 1, color: colors.textMuted, fontSize: 14 },
  dates: { marginTop: 6, color: colors.emeraldDark, fontSize: 13, fontWeight: "600" },
  tagsBlock: { marginTop: spacing.md, gap: spacing.sm },
  tagGroup: { gap: 6 },
  tagGroupLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  badge: { backgroundColor: colors.navy, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  badgeB2c: { backgroundColor: colors.emerald },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  categoryPill: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  categoryPillText: { color: colors.emeraldDark, fontSize: 12, fontWeight: "700" },
  tagPill: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  tagPillText: { color: colors.navy, fontSize: 12, fontWeight: "600" },
  desc: { marginTop: spacing.lg, fontSize: 15, lineHeight: 22, color: colors.textMuted },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 14 },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketName: { fontWeight: "700", color: colors.navy },
  ticketMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  ticketPrice: { fontSize: 17, fontWeight: "800", color: colors.cta },
  annCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.border },
  annTitle: { fontWeight: "700", color: colors.navy },
  annBody: { marginTop: 4, fontSize: 13, color: colors.textMuted, lineHeight: 19 },
  stallCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stallTitle: { fontWeight: "700", color: colors.navy, fontSize: 15 },
  stallSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 8,
  },
  footerLabel: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  footerPrice: { fontSize: 20, fontWeight: "800", color: colors.navy },
});
