import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Booking = {
  id: string;
  eventId: string;
  eventTitle: string;
  status: string;
  subtotalMinor: string;
  payNowMinor: string;
  balanceDueMinor: string;
  currency: string;
  createdAt: string;
  refundRequestedAt: string | null;
  razorpayOrderId: string | null;
};

export function ExhibitorBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ bookings: Booking[] }>("/exhibitor/bookings");
    setBooking(data.bookings?.find((b) => b.id === bookingId) ?? null);
  }, [bookingId]);

  useEffect(() => {
    void load()
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [load]);

  async function requestRefund() {
    if (!bookingId) return;
    setBusy(true);
    try {
      await apiJson(`/exhibitor/bookings/${bookingId}/refund-request`, { method: "POST" });
      await load();
      Alert.alert("Submitted", "Refund request submitted for manual review.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (!booking) {
    return (
      <ScreenShell title="Booking">
        <Text style={styles.muted}>Booking not found.</Text>
      </ScreenShell>
    );
  }

  const payAmount = Number(booking.payNowMinor ?? booking.subtotalMinor);

  return (
    <ScreenShell title={`Booking #${booking.id}`} subtitle={booking.eventTitle} scroll onRefresh={load}>
      <View style={styles.summaryCard}>
        <Text style={styles.totalLabel}>Total amount</Text>
        <Text style={styles.totalValue}>{formatInrFromMinor(booking.subtotalMinor)}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={booking.status} />
        </View>
      </View>

      <View style={styles.detailsCard}>
        {Number(booking.balanceDueMinor) > 0 ? (
          <>
            <Detail label="Pay now" value={formatInrFromMinor(booking.payNowMinor)} highlight />
            <Detail label="Balance offline" value={formatInrFromMinor(booking.balanceDueMinor)} />
          </>
        ) : null}
        <Detail label="Created" value={new Date(booking.createdAt).toLocaleString()} last />
      </View>

      {booking.refundRequestedAt ? (
        <Text style={styles.refundNote}>
          Refund requested {new Date(booking.refundRequestedAt).toLocaleString()}
        </Text>
      ) : null}

      <PrimaryButton
        label="View event"
        variant="outline"
        style={{ marginTop: spacing.lg }}
        onPress={() => router.push(`/dashboard/exhibitor/events/${booking.eventId}` as never)}
      />

      {booking.status === "pending" && payAmount > 0 && booking.razorpayOrderId ? (
        <PrimaryButton
          label="Pay now"
          variant="cta"
          style={{ marginTop: spacing.md }}
          onPress={() => router.push({ pathname: "/dashboard/exhibitor/checkout", params: { bookingId } } as never)}
        />
      ) : null}

      {booking.status === "confirmed" && !booking.refundRequestedAt ? (
        <PrimaryButton
          label={busy ? "Submitting…" : "Request refund / cancellation"}
          variant="outline"
          disabled={busy}
          style={{ marginTop: spacing.md }}
          onPress={() => void requestRefund()}
        />
      ) : null}
    </ScreenShell>
  );
}

function Detail({ label, value, highlight, last }: { label: string; value: string; highlight?: boolean; last?: boolean }) {
  return (
    <View style={[styles.row, last && styles.rowLast]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, highlight && styles.valueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },
  summaryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  totalLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  totalValue: { fontSize: 28, fontWeight: "800", color: colors.navy, marginTop: 4, letterSpacing: -0.5 },
  badgeRow: { marginTop: spacing.md },
  detailsCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.06)",
  },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { fontWeight: "700", color: colors.navy, fontSize: 14 },
  valueHighlight: { color: colors.cta, fontWeight: "800" },
  rowLast: { borderBottomWidth: 0 },
  refundNote: { marginTop: spacing.md, color: "#b45309", fontSize: 13 },
});
