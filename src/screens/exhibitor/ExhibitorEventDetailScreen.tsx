import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { StallMapReadOnly } from "@/components/exhibitor/StallMapReadOnly";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { isImageStallLayout } from "@/lib/stallLayout";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { ZoomableImage } from "@/context/ImageZoomContext";
import { EventContactsCard } from "@/components/events/EventContactsCard";
import type { EventContact } from "@/api/types";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Event = {
  id: string;
  title: string;
  description: string | null;
  venueName: string;
  venueCity: string | null;
  venueState: string | null;
  startsAt: string;
  endsAt: string;
  stallBookingEnabled?: boolean;
  organizerVerified?: boolean;
  isVerified?: boolean;
  stallLayoutMode?: "grid" | "image";
  stallLayoutImageUrl?: string | null;
  stallNumberCount?: number | null;
};

export function ExhibitorEventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [stallTypes, setStallTypes] = useState<
    { id: string; code: string; name: string; priceMinor: string; currency: string }[]
  >([]);
  const [stalls, setStalls] = useState<
    { id: string; label: string; status: string; gridRow: number | null; gridCol: number | null; stallTypeId: string }[]
  >([]);
  const [media, setMedia] = useState<{ url: string; mediaType: string }[]>([]);
  const [announcements, setAnnouncements] = useState<{ title: string; body: string }[]>([]);
  const [isFav, setIsFav] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favBusy, setFavBusy] = useState(false);
  const [services, setServices] = useState<
    { id: string; title: string; categoryName: string; priceMinor: string; companyName: string | null }[]
  >([]);
  const [contacts, setContacts] = useState<EventContact[]>([]);

  const load = useCallback(async () => {
    if (!eventId) return;
    const [cat, list, svc] = await Promise.all([
      apiJson<{
        event: Event;
        stallTypes: typeof stallTypes;
        stalls: typeof stalls;
        media: typeof media;
        announcements: typeof announcements;
        contacts?: EventContact[];
      }>(`/exhibitor/events/${eventId}/catalog`),
      apiJson<{ favoriteEventIds?: string[] }>("/exhibitor/events").catch(() => ({ favoriteEventIds: [] })),
      apiJson<{ services: typeof services }>(`/exhibitor/events/${eventId}/marketplace-services`).catch(() => ({
        services: [],
      })),
    ]);
    setEvent(cat.event);
    setStallTypes(cat.stallTypes ?? []);
    setStalls(cat.stalls ?? []);
    setMedia(cat.media ?? []);
    setAnnouncements(cat.announcements ?? []);
    setContacts(cat.contacts ?? []);
    setServices(svc.services ?? []);
    setIsFav((list.favoriteEventIds ?? []).includes(eventId));
  }, [eventId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => setEvent(null))
      .finally(() => setLoading(false));
  }, [load]);

  async function toggleFavorite() {
    if (!eventId) return;
    setFavBusy(true);
    try {
      if (isFav) {
        await apiJson(`/exhibitor/favorites/${eventId}`, { method: "DELETE" });
        setIsFav(false);
      } else {
        await apiJson(`/exhibitor/favorites/${eventId}`, { method: "POST" });
        setIsFav(true);
      }
    } finally {
      setFavBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <ScreenShell title="Event">
        <Text style={styles.muted}>Event not found.</Text>
      </ScreenShell>
    );
  }

  const stallBookingEnabled = event.stallBookingEnabled !== false;
  const cover = media.find((m) => m.mediaType === "image" || m.mediaType === "other")?.url;
  const galleryImages = media
    .filter((m) => m.mediaType === "image" || m.mediaType === "other")
    .map((m) => resolveMediaUrl(m.url))
    .filter(Boolean) as string[];
  const venue = [event.venueName, event.venueCity, event.venueState].filter(Boolean).join(" · ");
  const showVerified = Boolean(event.organizerVerified ?? event.isVerified);
  const imageLayout = isImageStallLayout(event) && Boolean(event.stallLayoutImageUrl);
  const layoutSrc = resolveMediaUrl(event.stallLayoutImageUrl);

  return (
    <ScreenShell
      title={event.title}
      subtitle={`ID · ${event.id}${venue ? ` · ${venue}` : ""}`}
      right={
        <Pressable onPress={() => void toggleFavorite()} disabled={favBusy} hitSlop={8}>
          <Ionicons name={isFav ? "heart" : "heart-outline"} size={22} color={isFav ? colors.cta : "#fff"} />
        </Pressable>
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {showVerified ? (
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.verifiedPillText}>Verified organiser</Text>
          </View>
        ) : null}
        {cover ? (
          <ZoomableImage uri={resolveMediaUrl(cover)} style={styles.cover} contentFit="cover" />
        ) : null}

        <View style={styles.dateCard}>
          <Ionicons name="calendar-outline" size={18} color={colors.emeraldDark} />
          <Text style={styles.dates}>
            {new Date(event.startsAt).toLocaleString()} — {new Date(event.endsAt).toLocaleString()}
          </Text>
        </View>

        {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

        {contacts.length > 0 ? <EventContactsCard contacts={contacts} organizerVerified={showVerified} /> : null}

        {galleryImages.length > 0 ? (
          <>
            <Text style={styles.section}>Gallery</Text>
            <FlatList
              horizontal
              data={galleryImages}
              keyExtractor={(u, i) => `${i}-${u}`}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <ZoomableImage uri={item} style={styles.galleryImg} contentFit="cover" />
              )}
            />
          </>
        ) : null}

        {stallBookingEnabled ? (
          <>
            <Text style={styles.section}>Stall types & pricing</Text>
            {stallTypes.map((t) => (
              <DashboardListCard
                key={t.id}
                title={`${t.code} · ${t.name}`}
                amount={formatInrFromMinor(t.priceMinor)}
                icon="grid-outline"
                iconColor={colors.emeraldDark}
                iconBg="rgba(16,185,129,0.12)"
              />
            ))}

            <Text style={styles.section}>Stall map</Text>
            {imageLayout && layoutSrc ? (
              <View style={styles.mapWrap}>
                <ZoomableImage uri={layoutSrc} style={styles.layoutMap} contentFit="contain" />
                <Text style={styles.muted}>
                  {event.stallNumberCount ?? 100} numbered stalls — book from the Book stalls screen.
                </Text>
              </View>
            ) : (
              <View style={styles.mapWrap}>
                <StallMapReadOnly stalls={stalls} stallTypes={stallTypes} />
              </View>
            )}
          </>
        ) : (
          <Text style={styles.muted}>Stall booking is disabled for this event.</Text>
        )}

        {announcements.length > 0 ? (
          <>
            <Text style={styles.section}>Updates from organizer</Text>
            {announcements.map((a, i) => (
              <DashboardListCard
                key={i}
                title={a.title}
                subtitle={a.body}
                icon="megaphone-outline"
                iconColor={colors.navyLight}
                iconBg="rgba(19,45,82,0.1)"
              />
            ))}
          </>
        ) : null}

        <Pressable style={styles.linkRow} onPress={() => router.push("/dashboard/marketplace")}>
          <Ionicons name="construct-outline" size={20} color={colors.emerald} />
          <Text style={styles.linkText}>Browse all service providers</Text>
        </Pressable>

        {services.length > 0 ? (
          <>
            <Text style={styles.section}>Services for this fair</Text>
            {services.slice(0, 6).map((s) => (
              <DashboardListCard
                key={s.id}
                title={s.title}
                subtitle={`${s.categoryName}${s.companyName ? ` · ${s.companyName}` : ""}`}
                amount={formatInrFromMinor(s.priceMinor)}
                icon="construct-outline"
                iconColor={colors.emeraldDark}
                iconBg="rgba(16,185,129,0.12)"
                onPress={() => router.push(`/dashboard/marketplace/${s.id}` as never)}
              />
            ))}
          </>
        ) : null}

        {stallBookingEnabled ? (
          <PrimaryButton
            label="Book a stall"
            variant="cta"
            style={{ marginTop: spacing.lg, marginBottom: spacing.xl }}
            onPress={() => router.push({ pathname: "/dashboard/exhibitor/book", params: { eventId } } as never)}
          />
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted, lineHeight: 21 },
  verifiedPill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  verifiedPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  cover: { width: "100%", height: 180, borderRadius: radius.lg + 2, marginBottom: spacing.md, ...cardShadow },
  galleryImg: {
    width: 140,
    height: 100,
    borderRadius: radius.md,
    marginRight: spacing.sm,
  },
  dateCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  dates: { flex: 1, fontSize: 13, color: colors.emeraldDark, fontWeight: "600", lineHeight: 18 },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 21, marginBottom: spacing.lg },
  section: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  mapWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  layoutMap: {
    width: "100%",
    height: 240,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    marginBottom: spacing.sm,
  },
  linkRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: spacing.xl },
  linkText: { color: colors.emerald, fontWeight: "700" },
});
