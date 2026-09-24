import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent, TicketType, VisitorTicket } from "@/api/types";
import { fetchEvents } from "@/api/client";
import {
  AvailableEventPassRow,
  type EventTicketPricing,
} from "@/components/visitor/AvailableEventPassRow";
import { PastVisitPassRow } from "@/components/visitor/PastVisitPassRow";
import { UpcomingPassCard } from "@/components/visitor/UpcomingPassCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { apiJson, publicJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const { width: SW } = Dimensions.get("window");
const PASS_W = SW - spacing.screen * 2;

async function fetchEventPricing(eventId: string): Promise<EventTicketPricing> {
  try {
    const data = await publicJson<{ ticketTypes: TicketType[] }>(`/events/${eventId}/ticket-types`);
    const types = data.ticketTypes ?? [];
    if (!types.length) return { minPriceMinor: null, isFree: false };
    const prices = types.map((t) => Number(t.priceMinor)).filter((p) => !Number.isNaN(p));
    const min = prices.length ? Math.min(...prices) : null;
    const isFree = prices.length > 0 && prices.every((p) => p <= 0);
    return { minPriceMinor: min, isFree };
  } catch {
    return { minPriceMinor: null, isFree: false };
  }
}

export function VisitorPassesHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const passScrollRef = useRef<ScrollView>(null);

  const [search, setSearch] = useState("");
  const [tickets, setTickets] = useState<VisitorTicket[]>([]);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [pricingMap, setPricingMap] = useState<Record<string, EventTicketPricing>>({});
  const [loading, setLoading] = useState(true);
  const [passIndex, setPassIndex] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await fetchEvents({ search: search.trim() || undefined });
    setEvents(list);

    const pricingEntries = await Promise.all(
      list.slice(0, 10).map(async (e) => [e.id, await fetchEventPricing(e.id)] as const)
    );
    setPricingMap(Object.fromEntries(pricingEntries));

    if (user) {
      try {
        const data = await apiJson<{ tickets: VisitorTicket[] }>("/visitor/tickets");
        setTickets(data.tickets ?? []);
      } catch {
        setTickets([]);
      }
    } else {
      setTickets([]);
    }
    setLoading(false);
  }, [user, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const eventById = useMemo(() => {
    const m = new Map<string, PublicEvent>();
    for (const e of events) m.set(e.id, e);
    return m;
  }, [events]);

  const now = Date.now();
  const upcoming = useMemo(
    () =>
      tickets.filter((t) => {
        if (!t.eventStartsAt) return true;
        return new Date(t.eventStartsAt).getTime() >= now;
      }),
    [tickets, now]
  );
  const past = useMemo(
    () =>
      tickets.filter((t) => t.eventStartsAt && new Date(t.eventStartsAt).getTime() < now),
    [tickets, now]
  );

  const availableEvents = useMemo(() => {
    const q = search.trim().toLowerCase();
    let list = events;
    if (q) {
      list = list.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.venueCity ?? "").toLowerCase().includes(q) ||
          (e.venueName ?? "").toLowerCase().includes(q)
      );
    }
    return list.slice(0, 10);
  }, [events, search]);

  const onPassScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    const i = Math.round(x / (PASS_W + spacing.sm));
    if (i >= 0 && i < upcoming.length) setPassIndex(i);
  };

  const openTicket = (id: string) => router.push(`/dashboard/visitor/tickets/${id}` as never);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={22} color={colors.navy} />
        </Pressable>
        <Text style={styles.headerTitle}>Visitor Passes</Text>
        <Pressable hitSlop={12} onPress={() => router.push("/dashboard/visitor/tickets" as never)}>
          <Ionicons name="calendar-outline" size={22} color={colors.navy} />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exhibition, city, industry…"
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void load()}
            returnKeyType="search"
          />
          <Pressable hitSlop={8}>
            <Ionicons name="options-outline" size={18} color={colors.navy} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {user && upcoming.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="My Upcoming Passes"
              actionLabel="View All"
              inset
              onAction={() => router.push("/dashboard/visitor/tickets" as never)}
            />
            <ScrollView
              ref={passScrollRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={PASS_W + spacing.sm}
              decelerationRate="fast"
              onScroll={onPassScroll}
              scrollEventThrottle={16}
              contentContainerStyle={styles.passScroll}
            >
              {upcoming.map((t, i) => (
                <View key={t.id} style={{ width: PASS_W, marginRight: spacing.sm }}>
                  <UpcomingPassCard
                    ticket={t}
                    event={eventById.get(t.eventId)}
                    colorIndex={i}
                    onViewPass={() => openTicket(t.id)}
                  />
                </View>
              ))}
            </ScrollView>
            {upcoming.length > 1 ? (
              <View style={styles.dots}>
                {upcoming.map((t, i) => (
                  <View key={t.id} style={[styles.dot, i === passIndex && styles.dotActive]} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Available Events" inset />
          {loading ? (
            <ActivityIndicator color={colors.emerald} style={{ marginVertical: 20 }} />
          ) : (
            availableEvents.map((ev, i) => (
              <AvailableEventPassRow
                key={ev.id}
                event={ev}
                pricing={pricingMap[ev.id] ?? { minPriceMinor: null, isFree: false }}
                colorIndex={i}
                onPress={() => router.push(`/event/${ev.id}` as never)}
              />
            ))
          )}
        </View>

        {user && past.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader
              title="Past Visits"
              actionLabel="View All"
              inset
              onAction={() => router.push("/dashboard/visitor/tickets" as never)}
            />
            {past.map((t, i) => (
              <PastVisitPassRow
                key={t.id}
                ticket={t}
                event={eventById.get(t.eventId)}
                colorIndex={i}
                onViewPass={() => openTicket(t.id)}
              />
            ))}
          </View>
        ) : null}

        {!user ? (
          <Pressable style={styles.loginBanner} onPress={() => router.push("/(auth)/login")}>
            <Ionicons name="ticket-outline" size={20} color="#fff" style={{ marginBottom: 6 }} />
            <Text style={styles.loginText}>Login to see your saved passes</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    backgroundColor: "#fff",
  },
  headerTitle: { fontSize: 17, fontWeight: "800", color: colors.navy },
  searchWrap: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.08)",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f7f6",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.08)",
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, color: colors.text },
  section: { marginTop: spacing.md },
  passScroll: { paddingHorizontal: spacing.screen },
  dots: { flexDirection: "row", justifyContent: "center", gap: 5, marginTop: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(10,31,61,0.15)" },
  dotActive: { width: 18, backgroundColor: colors.emerald },
  loginBanner: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    alignItems: "center",
  },
  loginText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
