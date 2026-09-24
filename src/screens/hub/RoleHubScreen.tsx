import { useCallback, useMemo } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WorkspaceHero } from "@/components/dashboard/WorkspaceHero";
import { FeatureCard } from "@/components/ui/FeatureCard";
import { useAuth } from "@/context/AuthContext";
import { canAccessAdminRoute } from "@/lib/adminAccess";
import { featuresForHubPath, hubMetaForPath } from "@/lib/roleFeatures";
import { routeWithSubscriptionReturn } from "@/lib/subscriptionReturn";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Props = { hubPath: string };

export function RoleHubScreen({ hubPath }: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { profile, refreshMe } = useAuth();
  const reload = useCallback(async () => {
    await refreshMe();
  }, [refreshMe]);
  const { refreshControl } = usePullToRefresh(reload);
  const meta = hubMetaForPath(hubPath);
  const features = useMemo(() => {
    const items = featuresForHubPath(hubPath, { includeReferral: Boolean(profile) });
    if (!hubPath.includes("/admin")) return items;
    return items.filter((item) => canAccessAdminRoute(profile, item.route));
  }, [hubPath, profile]);

  return (
    <View style={styles.root}>
      <WorkspaceHero
        eyebrow="Workspace"
        title={meta.title}
        subtitle={meta.subtitle}
        gradient={meta.gradient}
      />
      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={refreshControl}
      >
        {features.map((item) => (
          <FeatureCard
            key={item.route + item.title}
            item={item}
            onPress={() => router.push(routeWithSubscriptionReturn(item.route, pathname) as never)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  list: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
  },
});
