import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";
import { adminStyles } from "./adminStyles";

type Summary = {
  gmvMinor: string;
  platformFeeMinor: string;
  refundsMinor: string;
  netMinor: string;
  counts: {
    paymentsCaptured: number;
    refundsProcessed: number;
    totalUsers: number;
    newUsers30d: number;
    stallBookings: { confirmed: number; pending: number };
    ticketOrders: { paid: number; pending: number };
    serviceBookings: { confirmed: number; pendingPayment: number };
  };
};

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={adminStyles.statCard}>
      <Text style={adminStyles.statLabel}>{label}</Text>
      <Text style={adminStyles.statValue}>{value}</Text>
    </View>
  );
}

export function AdminOverviewScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [growth, setGrowth] = useState<{ day: string; count: number }[]>([]);
  const [featured, setFeatured] = useState<
    { id: string; entityType: string; entityId: string; label: string | null; eventTitle?: string | null; active: boolean }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, g, f] = await Promise.all([
      apiJson<{ summary: Summary }>("/admin/analytics/summary"),
      apiJson<{ series: { day: string; count: number }[] }>("/admin/analytics/users-growth?days=30"),
      apiJson<{
        featured: {
          id: string;
          entityType: string;
          entityId: string;
          label: string | null;
          eventTitle?: string | null;
          active: boolean;
        }[];
      }>("/admin/featured").catch(() => ({ featured: [] })),
    ]);
    setSummary(s.summary);
    setGrowth(g.series ?? []);
    setFeatured(f.featured ?? []);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenShell title="Overview" subtitle="Platform summary">
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  if (err || !summary) {
    return (
      <ScreenShell title="Overview" subtitle="Platform summary">
        <Text style={adminStyles.err}>{err ?? "No data"}</Text>
      </ScreenShell>
    );
  }

  const c = summary.counts;

  return (
    <ScreenShell title="Overview" subtitle="GMV, fees & volume">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={styles.grid}>
          <StatCard label="GMV (captured)" value={formatInrFromMinor(summary.gmvMinor)} />
          <StatCard label="Platform fees" value={formatInrFromMinor(summary.platformFeeMinor)} />
          <StatCard label="Refunds" value={formatInrFromMinor(summary.refundsMinor)} />
          <StatCard label="Net" value={formatInrFromMinor(summary.netMinor)} />
        </View>

        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Users</Text>
          <Text style={adminStyles.sub}>Total: {c.totalUsers}</Text>
          <Text style={adminStyles.sub}>New (30d): {c.newUsers30d}</Text>
          <Text style={adminStyles.sub}>Payments captured: {c.paymentsCaptured}</Text>
          <Text style={adminStyles.sub}>Refunds processed: {c.refundsProcessed}</Text>
        </View>

        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Bookings</Text>
          <Text style={adminStyles.sub}>
            Stalls — confirmed {c.stallBookings.confirmed}, pending {c.stallBookings.pending}
          </Text>
          <Text style={adminStyles.sub}>
            Tickets — paid {c.ticketOrders.paid}, pending {c.ticketOrders.pending}
          </Text>
          <Text style={adminStyles.sub}>
            Services — confirmed {c.serviceBookings.confirmed}, awaiting payment{" "}
            {c.serviceBookings.pendingPayment}
          </Text>
        </View>

        {growth.length > 0 ? (
          <View style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>Signups (last 30 days)</Text>
            {growth.slice(-14).map((row) => (
              <View key={row.day} style={styles.growthRow}>
                <Text style={adminStyles.sub}>{row.day}</Text>
                <Text style={styles.growthCount}>{row.count}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Featured listings</Text>
          {featured.filter((x) => x.active).length === 0 ? (
            <Text style={adminStyles.sub}>No active featured listings.</Text>
          ) : (
            featured
              .filter((x) => x.active)
              .slice(0, 8)
              .map((x) => (
                <Text key={x.id} style={adminStyles.sub}>
                  {x.eventTitle ?? x.label ?? `${x.entityType} #${x.entityId}`} · {x.entityType}:{x.entityId}
                </Text>
              ))
          )}
        </View>
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  growthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  growthCount: { fontWeight: "800", color: colors.navy },
});
