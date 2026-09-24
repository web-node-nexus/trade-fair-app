import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { WorkspaceHero } from "@/components/dashboard/WorkspaceHero";
import { ExhibitorHomeOverview } from "@/screens/exhibitor/ExhibitorHomeOverview";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuth } from "@/context/AuthContext";
import { featuresForHubPath, hubMetaForPath } from "@/lib/roleFeatures";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function ExhibitorIndexScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();
  const meta = hubMetaForPath("/dashboard/exhibitor");
  const features = featuresForHubPath("/dashboard/exhibitor", { includeReferral: Boolean(profile) });
  const [refreshKey, setRefreshKey] = useState(0);
  const onRefresh = useCallback(async () => {
    setRefreshKey((k) => k + 1);
  }, []);
  const { refreshControl } = usePullToRefresh(onRefresh);

  return (
    <View style={styles.root}>
      <WorkspaceHero
        eyebrow="Exhibitor workspace"
        title={meta.title}
        subtitle={meta.subtitle}
        gradient={meta.gradient}
        footer={
          <View>
            <Text style={styles.statsLabel}>At a glance</Text>
            <ExhibitorHomeOverview refreshKey={refreshKey} />
          </View>
        }
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: spacing.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        <Text style={styles.sectionTitle}>Quick actions</Text>
        <View style={styles.list}>
          {features.map((item) => (
            <FeatureCard
              key={item.route + item.title}
              item={{ ...item, accent: colors.emerald }}
              onPress={() => router.push(item.route as never)}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  statsLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "rgba(248,250,252,0.65)",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: spacing.screen,
    marginBottom: spacing.sm,
  },
  list: { paddingHorizontal: spacing.screen },
});
