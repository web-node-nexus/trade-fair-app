import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";
import { adminStyles } from "./adminStyles";

type Summary = {
  gmvMinor: string;
  platformFeeMinor: string;
  refundsMinor: string;
  netMinor: string;
  counts?: {
    paymentsCaptured?: number;
    refundsProcessed?: number;
    totalUsers?: number;
    newUsers30d?: number;
    activeUsers30dLogins?: number;
    stallBookings?: { confirmed?: number; pending?: number };
    ticketOrders?: { paid?: number; pending?: number };
    serviceBookings?: { confirmed?: number; pendingPayment?: number };
  };
};

function GrowthBars({ series }: { series: { day: string; count: number }[] }) {
  const max = Math.max(1, ...series.map((s) => s.count));
  const last = series.slice(-14);
  return (
    <View style={styles.bars}>
      {last.map((s) => {
        const h = Math.max(2, Math.round((s.count / max) * 80));
        return (
          <View key={s.day} style={styles.barCol}>
            <View style={[styles.bar, { height: h }]} />
            <Text style={styles.barLabel}>{s.day.slice(5)}</Text>
          </View>
        );
      })}
    </View>
  );
}

export function AdminAnalyticsScreen() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [growth, setGrowth] = useState<{ day: string; count: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [s, g] = await Promise.all([
      apiJson<{ summary: Summary }>("/admin/analytics/summary"),
      apiJson<{ series: { day: string; count: number }[] }>("/admin/analytics/users-growth?days=30"),
    ]);
    setSummary(s.summary);
    setGrowth(g.series ?? []);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Failed"))
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenShell title="Analytics" subtitle="Metrics & growth">
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  if (err || !summary) {
    return (
      <ScreenShell title="Analytics" subtitle="Metrics & growth">
        <Text style={adminStyles.err}>{err ?? "No data"}</Text>
      </ScreenShell>
    );
  }

  const c = summary.counts ?? {};

  return (
    <ScreenShell title="Analytics" subtitle="Payments, refunds & activity">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={styles.grid}>
          <View style={adminStyles.statCard}>
            <Text style={adminStyles.statLabel}>GMV</Text>
            <Text style={adminStyles.statValue}>{formatInrFromMinor(summary.gmvMinor)}</Text>
          </View>
          <View style={adminStyles.statCard}>
            <Text style={adminStyles.statLabel}>Platform fee</Text>
            <Text style={adminStyles.statValue}>{formatInrFromMinor(summary.platformFeeMinor)}</Text>
          </View>
          <View style={adminStyles.statCard}>
            <Text style={adminStyles.statLabel}>Refunds</Text>
            <Text style={adminStyles.statValue}>{formatInrFromMinor(summary.refundsMinor)}</Text>
          </View>
          <View style={adminStyles.statCard}>
            <Text style={adminStyles.statLabel}>Net</Text>
            <Text style={adminStyles.statValue}>{formatInrFromMinor(summary.netMinor)}</Text>
          </View>
        </View>

        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Counts</Text>
          <Text style={adminStyles.sub}>Payments captured: {c.paymentsCaptured ?? 0}</Text>
          <Text style={adminStyles.sub}>Refunds processed: {c.refundsProcessed ?? 0}</Text>
          <Text style={adminStyles.sub}>Total users: {c.totalUsers ?? 0}</Text>
          <Text style={adminStyles.sub}>New users (30d): {c.newUsers30d ?? 0}</Text>
          <Text style={adminStyles.sub}>Active logins (30d): {c.activeUsers30dLogins ?? 0}</Text>
          <Text style={adminStyles.sub}>
            Stall bookings — {c.stallBookings?.confirmed ?? 0} confirmed, {c.stallBookings?.pending ?? 0} pending
          </Text>
          <Text style={adminStyles.sub}>
            Ticket orders — {c.ticketOrders?.paid ?? 0} paid, {c.ticketOrders?.pending ?? 0} pending
          </Text>
          <Text style={adminStyles.sub}>
            Service bookings — {c.serviceBookings?.confirmed ?? 0} confirmed, {c.serviceBookings?.pendingPayment ?? 0} awaiting payment
          </Text>
        </View>

        {growth.length > 0 ? (
          <View style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>User signups (14 days)</Text>
            <GrowthBars series={growth} />
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  bars: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginTop: 8, height: 100 },
  barCol: { alignItems: "center", flex: 1 },
  bar: { width: "100%", backgroundColor: colors.emerald, borderRadius: 4 },
  barLabel: { fontSize: 8, color: colors.textMuted, marginTop: 4 },
});
