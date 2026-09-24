import { useCallback, useEffect, useState } from "react";
import { Alert, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { LoadingView } from "@/components/ui/LoadingView";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Booking = {
  id: string;
  eventTitle: string;
  status: string;
  subtotalMinor: string;
  payNowMinor: string;
  balanceDueMinor: string;
  currency: string;
  razorpayOrderId: string | null;
};

export function ExhibitorCheckoutScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [keyId, setKeyId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ bookings: Booking[]; razorpayKeyId?: string }>("/exhibitor/bookings");
    setKeyId(data.razorpayKeyId ?? "");
    setBooking(data.bookings?.find((b) => b.id === bookingId) ?? null);
  }, [bookingId]);

  useEffect(() => {
    void load()
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [load]);

  async function payNow() {
    if (!booking?.razorpayOrderId || !keyId) return;
    const payAmount = Number(booking.payNowMinor ?? booking.subtotalMinor);
    const balance = Number(booking.balanceDueMinor ?? 0);
    setBusy(true);
    try {
      const response = await openRazorpayCheckout({
        keyId,
        orderId: booking.razorpayOrderId,
        amountMinor: payAmount,
        description: booking.eventTitle,
      });
      await apiJson(`/exhibitor/bookings/${bookingId}/pay/verify`, {
        method: "POST",
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      Alert.alert(
        "Paid",
        balance > 0 ? "Token paid. Balance due offline to organizer." : "Booking confirmed.",
        [{ text: "OK", onPress: () => router.replace("/dashboard/exhibitor/bookings") }]
      );
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      Alert.alert("Payment failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingView />;

  if (!booking) {
    return (
      <ScreenShell title="Checkout">
        <Text style={styles.muted}>Booking not found.</Text>
      </ScreenShell>
    );
  }

  const payAmount = Number(booking.payNowMinor ?? booking.subtotalMinor);
  const balance = Number(booking.balanceDueMinor ?? 0);

  return (
    <ScreenShell title="Review & pay" subtitle={booking.eventTitle} scroll onRefresh={load}>
      <View style={styles.payCard}>
        <Text style={styles.payLabel}>Amount due now</Text>
        <Text style={styles.payAmount}>{formatInrFromMinor(String(payAmount))}</Text>
        <View style={styles.badgeRow}>
          <StatusBadge label={booking.status} />
        </View>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.row}>
          <Text style={styles.label}>Total</Text>
          <Text style={styles.value}>{formatInrFromMinor(booking.subtotalMinor)}</Text>
        </View>
        {balance > 0 ? (
          <View style={styles.row}>
            <Text style={styles.label}>Balance (offline)</Text>
            <Text style={styles.value}>{formatInrFromMinor(String(balance))}</Text>
          </View>
        ) : null}
        <View style={[styles.row, styles.rowLast]}>
          <Text style={styles.label}>Booking</Text>
          <Text style={styles.value}>#{booking.id}</Text>
        </View>
      </View>

      {booking.status === "pending" && payAmount > 0 && booking.razorpayOrderId ? (
        <PrimaryButton
          label={busy ? "Processing…" : "Pay securely"}
          variant="cta"
          style={{ marginTop: spacing.xl }}
          disabled={busy}
          onPress={() => void payNow()}
        />
      ) : (
        <PrimaryButton
          label="View my bookings"
          style={{ marginTop: spacing.xl }}
          onPress={() => router.replace("/dashboard/exhibitor/bookings")}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  muted: { fontSize: 14, lineHeight: 21, color: colors.textMuted },
  payCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  payLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  payAmount: {
    fontSize: 32,
    fontWeight: "800",
    color: colors.cta,
    marginTop: 4,
    letterSpacing: -0.5,
  },
  badgeRow: { marginTop: spacing.md },
  summaryCard: {
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
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(10,31,61,0.06)",
  },
  rowLast: { borderBottomWidth: 0 },
  label: { color: colors.textMuted, fontSize: 14 },
  value: { fontWeight: "800", color: colors.navy, fontSize: 14 },
});
