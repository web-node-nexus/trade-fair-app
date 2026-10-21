import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { EventCategory, HomeBanner, PublicEvent } from "@/api/types";
import {
  fetchCategories,
  fetchEvents,
  fetchFeaturedEvents,
  fetchHomeBanners,
  fetchVenueCities,
} from "@/api/client";
import { FeaturedEventCarousel } from "@/components/home/FeaturedEventCarousel";
import { PopularCityChip } from "@/components/home/PopularCityChip";
import { TradeFairListCard } from "@/components/events/TradeFairListCard";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuth } from "@/context/AuthContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useI18n } from "@/context/I18nContext";
import { filterUpcomingEvents } from "@/utils/eventDates";
import {
  INDIAN_STATES,
  PINNED_FILTER_CITIES,
  buildPinnedCityOptions,
  citiesForState,
} from "@/lib/locationOptions";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";

type FilterChip = "city" | "industry" | "date";
type SortMode = "date_asc" | "date_desc" | "name";

const CHIP_ICONS: Record<FilterChip, keyof typeof Ionicons.glyphMap> = {
  city: "location-outline",
  industry: "business-outline",
  date: "calendar-outline",
};

export function TradeFairsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useI18n();
  const params = useLocalSearchParams<{ search?: string; city?: string; categoryId?: string }>();

  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [featuredEvents, setFeaturedEvents] = useState<PublicEvent[]>([]);
  const [homeBanners, setHomeBanners] = useState<HomeBanner[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [apiCities, setApiCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(String(params.search ?? ""));
  const [venueState, setVenueState] = useState("");
  const [venueCity, setVenueCity] = useState(String(params.city ?? ""));
  const [activeCategory, setActiveCategory] = useState<number | "all">(
    params.categoryId ? Number(params.categoryId) : "all"
  );
  const [b2bOnly, setB2bOnly] = useState(false);
  const [b2cOnly, setB2cOnly] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [picker, setPicker] = useState<"state" | "city" | null>(null);
  const [activeSheet, setActiveSheet] = useState<FilterChip | "sort" | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("date_asc");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [ev, featured, banners, cats, cityList] = await Promise.all([
        fetchEvents({
          search,
          categoryId: activeCategory === "all" ? undefined : String(activeCategory),
          venueState: venueState || undefined,
          venueCity: venueCity || undefined,
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          b2bOnly,
          b2cOnly,
        }),
        fetchFeaturedEvents(),
        fetchHomeBanners(),
        fetchCategories(),
        fetchVenueCities(),
      ]);
      setEvents(ev);
      setFeaturedEvents(featured);
      setHomeBanners(banners);
      setCategories(cats);
      setApiCities(cityList);
    } finally {
      setLoading(false);
    }
  }, [search, activeCategory, venueState, venueCity, dateFrom, dateTo, b2bOnly, b2cOnly]);

  useEffect(() => {
    void load();
  }, [load]);

  const cityCatalog = useMemo(() => buildPinnedCityOptions(apiCities), [apiCities]);

  const popularCities = useMemo(
    () => PINNED_FILTER_CITIES.map((c) => ({ label: c.label, value: c.value })),
    []
  );

  const cityOptions = useMemo(() => {
    if (!venueState) return cityCatalog.all;
    const stateCities = citiesForState(venueState);
    const pinnedInState = cityCatalog.pinned
      .map((c) => c.value)
      .filter((v) => stateCities.some((sc) => sc.toLowerCase() === v.toLowerCase()));
    const rest = stateCities
      .filter((c) => !pinnedInState.some((p) => p.toLowerCase() === c.toLowerCase()))
      .sort((a, b) => a.localeCompare(b, "en-IN"));
    return [...pinnedInState, ...rest];
  }, [venueState, cityCatalog]);

  const filteredEvents = useMemo(() => {
    const featuredIds = new Set(featuredEvents.map((e) => e.id));
    const upcoming = filterUpcomingEvents(events);
    const featured = upcoming.filter((e) => featuredIds.has(e.id) || Boolean(e.isFeatured));
    const featuredIdSet = new Set(featured.map((e) => e.id));
    const rest = upcoming.filter((e) => !featuredIdSet.has(e.id));
    const sortList = (list: typeof upcoming) => {
      const copy = [...list];
      if (sortMode === "date_asc") {
        copy.sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
      } else if (sortMode === "date_desc") {
        copy.sort((a, b) => new Date(b.startsAt).getTime() - new Date(a.startsAt).getTime());
      } else {
        copy.sort((a, b) => a.title.localeCompare(b.title));
      }
      return copy;
    };
    // Featured always first; sort within featured / rest by selected mode
    return [...sortList(featured), ...sortList(rest)];
  }, [events, featuredEvents, sortMode]);

  const sortLabel = sortMode === "date_asc" ? "Date ↑" : sortMode === "date_desc" ? "Date ↓" : "Name";

  const chipLabel = (key: FilterChip) => {
    if (key === "city") return venueCity || venueState || "City";
    if (key === "industry") {
      if (activeCategory === "all") return "Industry";
      return categories.find((c) => c.id === activeCategory)?.name ?? "Industry";
    }
    if (key === "date") return dateFrom || dateTo ? "Date ✓" : "Date";
    return "";
  };

  const chipActive = (key: FilterChip) => {
    if (key === "city") return !!(venueCity || venueState);
    if (key === "industry") return activeCategory !== "all";
    if (key === "date") return !!(dateFrom || dateTo);
    return false;
  };

  const clearSheet = () => {
    if (activeSheet === "city") {
      setVenueState("");
      setVenueCity("");
    } else if (activeSheet === "industry") {
      setActiveCategory("all");
    } else if (activeSheet === "date") {
      setDateFrom("");
      setDateTo("");
    }
  };

  const listHeader = (
    <View>
      <FeaturedEventCarousel events={featuredEvents} banners={homeBanners} ctaMode="details" inset={false} />
      <SectionHeader
        title="Upcoming Exhibitions"
        actionLabel={`Sort · ${sortLabel}`}
        inset
        onAction={() => setActiveSheet("sort")}
      />
    </View>
  );

  const listFooter = (
    <View style={styles.citiesSection}>
      <SectionHeader title="Popular Cities" inset />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cityRow}>
        {popularCities.map((city) => (
          <PopularCityChip
            key={city.value}
            city={city.label}
            variant="card"
            onPress={() => {
              setVenueCity(city.value);
              void load();
            }}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>{t("tradeFairs.title")}</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <LanguageSwitcher compact />
            <Pressable
              hitSlop={12}
              onPress={() => {
                if (!user) router.push("/(auth)/login");
                else router.push("/dashboard/exhibitor/events" as never);
              }}
            >
              <Ionicons name="heart-outline" size={22} color={colors.navy} />
            </Pressable>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search" size={17} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("tradeFairs.searchPlaceholder")}
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={() => void load()}
          />
          <Pressable hitSlop={8} onPress={() => setActiveSheet("city")}>
            <Ionicons name="options-outline" size={18} color={colors.navy} />
          </Pressable>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
          {(["city", "industry", "date"] as FilterChip[]).map((key) => (
            <Pressable
              key={key}
              style={[styles.chip, chipActive(key) && styles.chipOn]}
              onPress={() => setActiveSheet(key)}
            >
              <Ionicons
                name={CHIP_ICONS[key]}
                size={13}
                color={chipActive(key) ? "#fff" : colors.textMuted}
              />
              <Text style={[styles.chipText, chipActive(key) && styles.chipTextOn]}>{chipLabel(key)}</Text>
              <Ionicons
                name="chevron-down"
                size={11}
                color={chipActive(key) ? "#fff" : colors.textMuted}
              />
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={colors.emerald} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={filteredEvents}
          keyExtractor={(e) => e.id}
          ListHeaderComponent={listHeader}
          ListFooterComponent={listFooter}
          contentContainerStyle={{
            paddingHorizontal: spacing.screen,
            paddingTop: spacing.sm,
            paddingBottom: tabBarHeight + spacing.md,
          }}
          ListEmptyComponent={<EmptyState title={t("tradeFairs.noEvents")} compact />}
          renderItem={({ item, index }) => (
            <TradeFairListCard
              event={item}
              colorIndex={index}
              onPress={() => router.push(`/event/${item.id}` as never)}
              onBookStall={() => router.push(`/event/${item.id}/book` as never)}
              onGetPass={() => router.push(`/event/${item.id}` as never)}
            />
          )}
        />
      )}

      <BottomSheetModal
        visible={activeSheet === "sort"}
        onClose={() => setActiveSheet(null)}
        title="Sort exhibitions"
      >
        {(
          [
            { id: "date_asc" as const, label: "Date — soonest first" },
            { id: "date_desc" as const, label: "Date — latest first" },
            { id: "name" as const, label: "Name A–Z" },
          ] as const
        ).map((opt) => (
          <Pressable
            key={opt.id}
            style={styles.modalRow}
            onPress={() => {
              setSortMode(opt.id);
              setActiveSheet(null);
            }}
          >
            <Text style={[styles.modalRowText, sortMode === opt.id && styles.modalRowOn]}>{opt.label}</Text>
          </Pressable>
        ))}
      </BottomSheetModal>

      <BottomSheetModal
        visible={activeSheet === "city"}
        onClose={() => setActiveSheet(null)}
        title="Filter by city"
        footer={
          <View style={styles.sheetActions}>
            <Pressable style={styles.clearBtn} onPress={clearSheet}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
            <PrimaryButton
              label="Apply"
              onPress={() => {
                setActiveSheet(null);
                void load();
              }}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <Pressable style={styles.sheetField} onPress={() => setPicker("state")}>
          <Text style={styles.sheetFieldText}>{venueState || "All states"}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
        <Pressable style={styles.sheetField} onPress={() => setPicker("city")}>
          <Text style={styles.sheetFieldText}>{venueCity || "Select city"}</Text>
          <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
        </Pressable>
      </BottomSheetModal>

      <BottomSheetModal
        visible={activeSheet === "industry"}
        onClose={() => setActiveSheet(null)}
        title="Filter by industry"
        footer={
          <View style={styles.sheetActions}>
            <Pressable style={styles.clearBtn} onPress={clearSheet}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
            <PrimaryButton
              label="Apply"
              onPress={() => {
                setActiveSheet(null);
                void load();
              }}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <ScrollView style={{ maxHeight: 360 }}>
          <Pressable
            style={styles.modalRow}
            onPress={() => setActiveCategory("all")}
          >
            <Text style={[styles.modalRowText, activeCategory === "all" && styles.modalRowOn]}>All industries</Text>
          </Pressable>
          {(() => {
            const withEvents = categories.filter((c) => (c.eventCount ?? 0) > 0);
            const list =
              withEvents.length > 0
                ? withEvents
                : categories.filter((c) =>
                    events.some(
                      (e) =>
                        e.categoryId === c.id ||
                        (e.categoryIds?.includes(c.id) ?? false)
                    )
                  );
            return list.map((cat) => (
              <Pressable key={cat.id} style={styles.modalRow} onPress={() => setActiveCategory(cat.id)}>
                <Text style={[styles.modalRowText, activeCategory === cat.id && styles.modalRowOn]}>{cat.name}</Text>
              </Pressable>
            ));
          })()}
        </ScrollView>
      </BottomSheetModal>

      <BottomSheetModal
        visible={activeSheet === "date"}
        onClose={() => setActiveSheet(null)}
        title="Filter by date"
        footer={
          <View style={styles.sheetActions}>
            <Pressable style={styles.clearBtn} onPress={clearSheet}>
              <Text style={styles.clearBtnText}>Clear</Text>
            </Pressable>
            <PrimaryButton
              label="Apply"
              onPress={() => {
                setActiveSheet(null);
                void load();
              }}
              style={{ flex: 1 }}
            />
          </View>
        }
      >
        <View style={styles.dateRow}>
          <TextInput
            style={styles.dateInput}
            placeholder="From YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={dateFrom}
            onChangeText={setDateFrom}
          />
          <TextInput
            style={styles.dateInput}
            placeholder="To YYYY-MM-DD"
            placeholderTextColor={colors.textMuted}
            value={dateTo}
            onChangeText={setDateTo}
          />
        </View>
      </BottomSheetModal>

      <BottomSheetModal
        visible={picker !== null}
        onClose={() => setPicker(null)}
        title={picker === "state" ? "Select state" : "Select city"}
        maxHeight="70%"
      >
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
          {picker === "state" ? (
            ["", ...INDIAN_STATES].map((opt) => (
              <Pressable
                key={opt || "all"}
                style={styles.modalRow}
                onPress={() => {
                  setVenueState(opt);
                  setVenueCity("");
                  setPicker(null);
                }}
              >
                <Text style={[styles.modalRowText, venueState === opt && styles.modalRowOn]}>
                  {opt || "All states"}
                </Text>
              </Pressable>
            ))
          ) : (
            <>
              <Pressable
                style={styles.modalRow}
                onPress={() => {
                  setVenueCity("");
                  setPicker(null);
                }}
              >
                <Text style={[styles.modalRowText, !venueCity && styles.modalRowOn]}>All cities</Text>
              </Pressable>
              {!venueState ? (
                <>
                  <Text style={styles.citySectionLabel}>Top cities</Text>
                  {cityCatalog.pinned.map((c) => (
                    <Pressable
                      key={`pin-${c.value}`}
                      style={styles.modalRow}
                      onPress={() => {
                        setVenueCity(c.value);
                        setPicker(null);
                      }}
                    >
                      <Text style={[styles.modalRowText, venueCity === c.value && styles.modalRowOn]}>
                        {c.label}
                      </Text>
                    </Pressable>
                  ))}
                  <Text style={styles.citySectionLabel}>All cities</Text>
                  {cityCatalog.rest.map((opt) => (
                    <Pressable
                      key={opt}
                      style={styles.modalRow}
                      onPress={() => {
                        setVenueCity(opt);
                        setPicker(null);
                      }}
                    >
                      <Text style={[styles.modalRowText, venueCity === opt && styles.modalRowOn]}>{opt}</Text>
                    </Pressable>
                  ))}
                </>
              ) : (
                cityOptions.map((opt) => (
                  <Pressable
                    key={opt}
                    style={styles.modalRow}
                    onPress={() => {
                      setVenueCity(opt);
                      setPicker(null);
                    }}
                  >
                    <Text style={[styles.modalRowText, venueCity === opt && styles.modalRowOn]}>{opt}</Text>
                  </Pressable>
                ))
              )}
            </>
          )}
        </ScrollView>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f6" },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.08)",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.navy },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#f4f7f6",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: 11, fontSize: 14, fontFamily: appFontFamily, color: colors.text },
  chipRow: { gap: 8, paddingBottom: 4 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.1)",
    backgroundColor: "#fff",
  },
  chipOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.navy },
  chipTextOn: { color: "#fff" },
  citiesSection: { marginTop: spacing.md, marginBottom: spacing.sm },
  cityRow: { paddingLeft: spacing.screen, paddingRight: spacing.sm, paddingBottom: spacing.sm },
  sheetField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sheetFieldText: { fontSize: 15, fontWeight: "600", color: colors.navy },
  toggleRow: { flexDirection: "row", gap: spacing.sm },
  toggleChip: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  toggleChipOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  toggleText: { fontSize: 13, fontWeight: "700", color: colors.textMuted },
  toggleTextOn: { color: "#fff" },
  dateRow: { flexDirection: "row", gap: spacing.sm },
  dateInput: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 13,
    backgroundColor: colors.background,
    color: colors.text,
  },
  sheetActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.lg, alignItems: "center" },
  clearBtn: { paddingVertical: 14, paddingHorizontal: spacing.md },
  clearBtnText: { color: colors.textMuted, fontWeight: "700" },
  modalRow: {
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowText: { fontSize: 15, color: colors.navy },
  modalRowOn: { color: colors.emerald, fontWeight: "800" },
  citySectionLabel: {
    marginTop: spacing.md,
    marginBottom: 4,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    color: colors.textMuted,
  },
});
