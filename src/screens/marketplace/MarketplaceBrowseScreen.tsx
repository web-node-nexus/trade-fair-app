import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { publicJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import type { ServiceListing } from "@/api/types";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

export function MarketplaceBrowseScreen() {
  const router = useRouter();
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await publicJson<{ services: ServiceListing[] }>("/services");
      setServices(data.services ?? []);
    } catch {
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell title="Marketplace" subtitle="Hire services for your booth">
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(s) => s.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyState title="No services listed yet." compact />}
          renderItem={({ item }) => {
            const img = resolveMediaUrl(item.imageUrls?.[0] ?? null);
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/dashboard/marketplace/${item.id}` as never)}
              >
                {img ? (
                  <Image source={{ uri: img }} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
                  {item.categoryName ? <Text style={styles.cat}>{item.categoryName}</Text> : null}
                  {item.priceMinor ? (
                    <Text style={styles.price}>From ₹{(Number(item.priceMinor) / 100).toLocaleString("en-IN")}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  card: {
    flexDirection: "row",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: 72, height: 72, borderRadius: radius.md },
  thumbFallback: { backgroundColor: colors.navyLight },
  title: { fontSize: 15, fontWeight: "800", color: colors.navy },
  cat: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  price: { fontSize: 13, fontWeight: "700", color: colors.cta, marginTop: 6 },
});
