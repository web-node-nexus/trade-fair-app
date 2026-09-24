import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { EventCategory, HomeBanner, PublicEvent, ServiceListing } from "@/api/types";
import {
  fetchCategories,
  fetchEvents,
  fetchFeaturedEvents,
  fetchHomeBanners,
  fetchServices,
} from "@/api/client";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { FeaturedEventCarousel } from "@/components/home/FeaturedEventCarousel";
import { PopularCityChip } from "@/components/home/PopularCityChip";
import {
  SERVICE_LISTING_CARD_H,
  SERVICE_LISTING_CARD_W,
  ServiceListingCard,
} from "@/components/marketplace/ServiceListingCard";
import { PosterEventCard, POSTER_CARD_H, POSTER_CARD_W } from "@/components/events/PosterEventCard";
import { IndustryCard } from "@/components/home/IndustryCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { AnimatedPressable } from "@/components/ui/AnimatedPressable";
import { useAuth } from "@/context/AuthContext";
import { INDUSTRY_COLORS } from "@/data/mock";
import { filterUpcomingEvents } from "@/utils/eventDates";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PINNED_FILTER_CITIES } from "@/lib/locationOptions";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";

const QUICK_ACTIONS = [
  {
    label: "Organizers",
    icon: "business" as const,
    route: "/pages/for-organizers",
    dashboard: "/dashboard/organizer",
    role: "ORGANIZER",
    accountType: "organizer",
    tint: "#ccfbf1",
    iconColor: "#0f766e",
  },
  {
    label: "Exhibitors",
    icon: "storefront" as const,
    route: "/pages/for-exhibitors",
    dashboard: "/dashboard/exhibitor",
    role: "EXHIBITOR",
    accountType: "exhibitor",
    tint: "#d1fae5",
    iconColor: "#065f46",
  },
  {
    label: "Service Providers",
    icon: "construct" as const,
    route: "/pages/for-service-providers",
    dashboard: "/dashboard/service-provider",
    role: "SERVICE_PROVIDER",
    accountType: "service_provider",
    tint: "#ede9fe",
    iconColor: "#5b21b6",
  },
  {
    label: "Visitors",
    icon: "ticket" as const,
    route: "/pages/for-visitors",
    dashboard: "/dashboard/visitor",
    role: "VISITOR",
    accountType: "visitor",
    tint: "#dbeafe",
    iconColor: "#0369a1",
  },
] as const;

const SERVICE_STRIP_H = SERVICE_LISTING_CARD_H;
const INDUSTRY_STRIP_H = 108;

export function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const roles = user?.roles ?? [];

  const openRoleTab = useCallback(
    (a: (typeof QUICK_ACTIONS)[number]) => {
      // Guest: must sign in / register before role dashboards or create-event flows
      if (!user) {
        router.push({
          pathname: "/(auth)/login",
          params: { accountType: a.accountType, next: a.route },
        } as never);
        return;
      }
      if (roles.includes(a.role)) {
        router.push(a.dashboard as never);
        return;
      }
      // Logged in but without this role — show marketing / how to join
      router.push(a.route as never);
    },
    [user, roles, router]
  );
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<PublicEvent[]>([]);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);

  const load = useCallback(async () => {
    const [c, e, featured, b, s] = await Promise.all([
      fetchCategories(),
      fetchEvents(),
      fetchFeaturedEvents(),
      fetchHomeBanners(),
      fetchServices(),
    ]);
    setCategories(c);
    setEvents(e);
    setFeaturedEvents(featured);
    setHomeBanners(b);
    setServices(s);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  const categoryById = useMemo(() => {
    const m = new Map<number, EventCategory>();
    for (const c of categories) m.set(c.id, c);
    return m;
  }, [categories]);

  const onSearch = useCallback(() => {
    router.push({
      pathname: "/(tabs)/trade-fairs",
      params: { search: search.trim() },
    });
  }, [router, search]);

  const onCityPress = useCallback(
    (city: string) => {
      router.push({
        pathname: "/(tabs)/trade-fairs",
        params: { city },
      });
    },
    [router]
  );

  const featuredIds = useMemo(() => new Set(featuredEvents.map((e) => e.id)), [featuredEvents]);
  const upcomingEvents = useMemo(() => {
    const upcoming = filterUpcomingEvents(events);
    const featured = upcoming.filter((e) => featuredIds.has(e.id) || Boolean(e.isFeatured));
    const featuredIdSet = new Set(featured.map((e) => e.id));
    const rest = upcoming.filter((e) => !featuredIdSet.has(e.id));
    return [...featured, ...rest].slice(0, 12);
  }, [events, featuredIds]);
  const topServices = services.slice(0, 10);
  const topCategories = (() => {
    const withEvents = categories.filter((c) => (c.eventCount ?? 0) > 0);
    if (withEvents.length) return withEvents.slice(0, 12);
    const usedIds = new Set<number>();
    for (const e of events) {
      if (e.categoryIds?.length) e.categoryIds.forEach((id) => usedIds.add(id));
      else if (e.categoryId != null) usedIds.add(e.categoryId);
    }
    return categories.filter((c) => usedIds.has(c.id)).slice(0, 12);
  })();

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + spacing.sm }}
        refreshControl={refreshControl}
      >
        <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
          <View style={styles.brandRow}>
            <BrandLogo size="md" style={{ flex: 1 }} />
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push(user ? "/dashboard/notifications" : "/(auth)/login")}
            >
              <Ionicons name="notifications-outline" size={20} color={colors.navy} />
            </Pressable>
            <Pressable
              style={styles.iconBtn}
              onPress={() => router.push(user ? "/(tabs)/profile" : "/(auth)/login")}
            >
              <Ionicons name="person-circle-outline" size={22} color={colors.navy} />
            </Pressable>
          </View>

          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              placeholder="Search city, industry, exhibition…"
              placeholderTextColor={colors.textMuted}
              style={styles.input}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              onSubmitEditing={onSearch}
            />
            <Pressable style={styles.searchGo} onPress={onSearch}>
              <Ionicons name="arrow-forward" size={15} color="#fff" />
            </Pressable>
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.quickRow}>
            {QUICK_ACTIONS.map((a) => (
              <AnimatedPressable
                key={a.label}
                style={styles.quickItem}
                onPress={() => openRoleTab(a)}
              >
                <View style={[styles.quickIcon, { backgroundColor: a.tint }]}>
                  <Ionicons name={a.icon} size={18} color={a.iconColor} />
                </View>
                <Text style={styles.quickLabel} numberOfLines={2}>
                  {a.label}
                </Text>
              </AnimatedPressable>
            ))}
          </View>

          <FeaturedEventCarousel events={featuredEvents} banners={homeBanners} />

          <SectionHeader
            title="Upcoming Trade Fairs"
            actionLabel="View all"
            inset
            onAction={() => router.push("/(tabs)/trade-fairs")}
          />
          <View style={[styles.stripWrap, { height: POSTER_CARD_H }]}>
            <ScrollView
              horizontal
              nestedScrollEnabled
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={POSTER_CARD_W + spacing.sm + 2}
              contentContainerStyle={styles.hList}
            >
              {upcomingEvents.map((item, index) => (
                <PosterEventCard
                  key={item.id}
                  event={item}
                  featured={featuredIds.has(item.id) || Boolean(item.isFeatured)}
                  colorIndex={index}
                  categoryLabel={item.categoryId ? categoryById.get(item.categoryId)?.name : undefined}
                  onPress={() => router.push(`/event/${item.id}` as never)}
                  onBook={() => router.push(`/event/${item.id}/book` as never)}
                  onFavorite={() => router.push(user ? "/dashboard/exhibitor/events" : "/(auth)/login")}
                />
              ))}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Booth & Event Services"
              actionLabel="View all"
              inset
              onAction={() => router.push("/(tabs)/explore")}
            />
            {topServices.length > 0 ? (
              <View style={[styles.stripWrap, { height: SERVICE_STRIP_H }]}>
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  decelerationRate="fast"
                  snapToInterval={SERVICE_LISTING_CARD_W + spacing.md}
                  contentContainerStyle={styles.hList}
                >
                  {topServices.map((item) => (
                    <ServiceListingCard
                      key={item.id}
                      service={item}
                      onPress={() => router.push(`/dashboard/marketplace/${item.id}` as never)}
                    />
                  ))}
                </ScrollView>
              </View>
            ) : (
              <Text style={styles.emptyHint}>Service providers coming soon — list yours from Workspace.</Text>
            )}
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Browse by Industry"
              actionLabel="View all"
              inset
              onAction={() => router.push("/(tabs)/trade-fairs")}
            />
            <View style={[styles.stripWrap, { height: INDUSTRY_STRIP_H }]}>
              <ScrollView
                horizontal
                nestedScrollEnabled
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.hListTight}
              >
                {topCategories.map((item, index) => (
                  <IndustryCard
                    key={item.id}
                    name={item.name}
                    slug={item.slug}
                    bgColor={INDUSTRY_COLORS[index % INDUSTRY_COLORS.length]}
                    onPress={() =>
                      router.push({
                        pathname: "/(tabs)/trade-fairs",
                        params: { categoryId: String(item.id) },
                      })
                    }
                  />
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.section}>
            <SectionHeader
              title="Popular Cities"
              actionLabel="View all"
              inset
              onAction={() => router.push("/(tabs)/trade-fairs")}
            />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.hListTight}
            >
              {PINNED_FILTER_CITIES.map((city) => (
                <PopularCityChip
                  key={city.value}
                  city={city.label}
                  onPress={() => onCityPress(city.value)}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f6" },
  header: {
    backgroundColor: "#fff",
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.08)",
  },
  body: { paddingTop: spacing.sm },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f4f7f6",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f4f7f6",
    borderRadius: radius.pill,
    paddingLeft: spacing.sm + 2,
    paddingRight: 3,
    paddingVertical: 3,
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  input: { flex: 1, fontSize: 14, fontFamily: appFontFamily, color: colors.text, paddingVertical: 8 },
  searchGo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cta,
    alignItems: "center",
    justifyContent: "center",
  },
  quickRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  quickItem: { alignItems: "center", width: "23%" },
  quickIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  quickLabel: { fontSize: 8, fontWeight: "700", color: colors.navy, textAlign: "center", lineHeight: 10 },
  section: { marginTop: spacing.md },
  stripWrap: { flexGrow: 0, overflow: "hidden" },
  hList: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen,
    paddingBottom: 4,
  },
  hListTight: {
    paddingLeft: spacing.screen,
    paddingRight: spacing.screen,
    paddingBottom: 2,
  },
  emptyHint: {
    paddingHorizontal: spacing.screen,
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
});
