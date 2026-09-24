import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, StyleSheet } from "react-native";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Review = {
  id: string;
  rating?: number;
  comment?: string | null;
  reviewerName?: string;
  serviceTitle?: string;
  createdAt?: string;
};

function starLabel(rating?: number) {
  const r = rating ?? 0;
  return `${"★".repeat(r)}${"☆".repeat(5 - r)}`;
}

export function ProviderReviewsScreen() {
  const [rows, setRows] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>("/provider/reviews");
    setRows(extractList(data) as Review[]);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <ScreenShell title="Reviews" subtitle="Customer feedback">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          onRefresh={load}
          data={rows}
          keyExtractor={(r) => r.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No reviews yet." compact />}
          renderItem={({ item }) => (
            <DashboardListCard
              title={item.serviceTitle ?? "Service"}
              subtitle={item.comment ?? undefined}
              meta={
                [
                  starLabel(item.rating),
                  item.reviewerName ? `By ${item.reviewerName}` : null,
                  item.createdAt ? new Date(item.createdAt).toLocaleDateString() : null,
                ]
                  .filter(Boolean)
                  .join(" · ") || undefined
              }
              icon="star"
              iconColor="#f59e0b"
              iconBg="rgba(245,158,11,0.12)"
            />
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingBottom: spacing.xl },
});
