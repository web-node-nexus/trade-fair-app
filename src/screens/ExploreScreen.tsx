import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { ServiceListing } from "@/api/types";
import { fetchServiceCategories, fetchServices, type ServiceCategory } from "@/api/client";
import { ServiceProviderRowCard } from "@/components/marketplace/ServiceProviderRowCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useI18n } from "@/context/I18nContext";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const FALLBACK_CATEGORIES: ServiceCategory[] = [
  { id: 1, name: "Stall Design", slug: "stall-design" },
  { id: 2, name: "AV & Lighting", slug: "av-lighting" },
  { id: 3, name: "Catering", slug: "catering" },
  { id: 4, name: "Logistics", slug: "logistics" },
  { id: 5, name: "Photography", slug: "photography" },
  { id: 6, name: "Printing", slug: "printing" },
  { id: 7, name: "Furniture", slug: "furniture" },
  { id: 8, name: "Security", slug: "security" },
  { id: 9, name: "Cleaning", slug: "cleaning" },
  { id: 10, name: "Marketing", slug: "marketing" },
  { id: 11, name: "Travel", slug: "travel" },
  { id: 12, name: "Insurance", slug: "insurance" },
];

const CAT_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  stall: "grid-outline",
  design: "color-palette-outline",
  av: "bulb-outline",
  light: "bulb-outline",
  cater: "restaurant-outline",
  logist: "car-outline",
  transport: "car-outline",
  photo: "camera-outline",
  video: "videocam-outline",
  print: "print-outline",
  furniture: "bed-outline",
  security: "shield-outline",
  clean: "sparkles-outline",
  market: "megaphone-outline",
  travel: "airplane-outline",
  insur: "document-text-outline",
};

function iconForCategory(name: string): keyof typeof Ionicons.glyphMap {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(CAT_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "construct-outline";
}

export function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const router = useRouter();
  const { t } = useI18n();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cats, svc] = await Promise.all([fetchServiceCategories(), fetchServices()]);
      setCategories(cats.length ? cats : FALLBACK_CATEGORIES);
      setServices(svc);
    } catch {
      setCategories(FALLBACK_CATEGORIES);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>{t("explore.title")}</Text>
        <Text style={styles.headerSub}>{t("explore.subtitle")}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + spacing.lg }}
        refreshControl={refreshControl}
      >
        <View style={styles.section}>
          <SectionHeader title={t("explore.browseCategory")} inset />
          <View style={styles.catGrid}>
            {categories.slice(0, 12).map((cat) => (
              <Pressable
                key={cat.id}
                style={styles.catTile}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/marketplace",
                    params: { categoryId: String(cat.id) },
                  } as never)
                }
              >
                <View style={styles.catIcon}>
                  <Ionicons name={iconForCategory(cat.name)} size={20} color={colors.emerald} />
                </View>
                <Text style={styles.catLabel} numberOfLines={2}>
                  {cat.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionHeader
            title={t("explore.topProviders")}
            actionLabel={t("explore.viewAll")}
            inset
            onAction={() => router.push("/dashboard/marketplace")}
          />
          {loading ? (
            <ActivityIndicator color={colors.emerald} style={{ marginVertical: 24 }} />
          ) : services.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="construct-outline" size={32} color={colors.textMuted} />
              <Text style={styles.emptyText}>{t("explore.noServices")}</Text>
            </View>
          ) : (
            <View style={styles.providerList}>
              {services.slice(0, 8).map((s) => (
                <ServiceProviderRowCard
                  key={s.id}
                  service={s}
                  onPress={() => router.push(`/dashboard/marketplace/${s.id}` as never)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f6" },
  header: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.08)",
  },
  headerTitle: { fontSize: 20, fontWeight: "800", color: colors.navy },
  headerSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 17 },
  section: { marginTop: spacing.md },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: spacing.screen,
    gap: spacing.sm,
  },
  catTile: {
    width: "22%",
    minWidth: 72,
    alignItems: "center",
    marginBottom: 4,
  },
  catIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.15)",
  },
  catLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.navy,
    textAlign: "center",
    lineHeight: 13,
  },
  providerList: { paddingHorizontal: spacing.screen },
  emptyBox: {
    marginHorizontal: spacing.screen,
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  emptyText: { marginTop: spacing.sm, textAlign: "center", color: colors.textMuted, fontSize: 13 },
});
