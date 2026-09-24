import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Booking = {
  id: string;
  serviceTitle: string;
  amountMinor: string;
  currency: string;
  status: string;
  scheduledAt: string | null;
};

export function ServiceBookingDetailScreen() {
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [paymentId, setPaymentId] = useState("");
  const [refundNotes, setRefundNotes] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ bookings: Booking[] }>("/marketplace/my-bookings");
    const found = data.bookings?.find((b) => b.id === bookingId) ?? null;
    setBooking(found);
    if (found?.status === "confirmed" || found?.status === "completed") {
      try {
        const receipts = await apiJson<{ receipts: { id: string }[] }>("/visitor/receipts");
        const match = receipts.receipts?.[0];
        if (match) setPaymentId(match.id);
      } catch {
        /* optional */
      }
    }
  }, [bookingId]);

  useEffect(() => {
    void load()
      .catch(() => setBooking(null))
      .finally(() => setLoading(false));
  }, [load]);

  async function startPay() {
    if (!bookingId) return;
    setBusy(true);
    try {
      const order = await apiJson<{
        razorpayOrderId: string;
        razorpayKeyId: string;
        amountMinor: string;
      }>(`/marketplace/service-bookings/${bookingId}/pay-order`, { method: "POST" });
      const response = await openRazorpayCheckout({
        keyId: order.razorpayKeyId,
        orderId: order.razorpayOrderId,
        amountMinor: Number(order.amountMinor),
        description: booking?.serviceTitle ?? "Service booking",
      });
      await apiJson(`/marketplace/service-bookings/${bookingId}/verify-pay`, {
        method: "POST",
        body: JSON.stringify({
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      await load();
      Alert.alert("Paid", "Payment verified successfully.");
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      Alert.alert("Payment", e instanceof Error ? e.message : "Could not complete payment");
    } finally {
      setBusy(false);
    }
  }

  async function submitReview() {
    if (!bookingId) return;
    setBusy(true);
    try {
      await apiJson(`/marketplace/service-bookings/${bookingId}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      Alert.alert("Thanks", "Your review was submitted.");
      setComment("");
      await load();
    } catch (e) {
      Alert.alert("Review", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function requestRefund() {
    if (!paymentId.trim()) {
      Alert.alert("Payment ID required", "Enter the payment ID from your receipt.");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/marketplace/refund-requests", {
        method: "POST",
        body: JSON.stringify({
          paymentId: paymentId.trim(),
          notes: refundNotes.trim() || null,
        }),
      });
      Alert.alert("Submitted", "Refund request submitted for admin review.");
      setRefundNotes("");
    } catch (e) {
      Alert.alert("Refund", e instanceof Error ? e.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
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

  return (
    <ScreenShell title={booking.serviceTitle} subtitle={`Status: ${booking.status.replace(/_/g, " ")}`} scroll onRefresh={load}>
          <View style={styles.row}>
            <Text style={styles.label}>Amount</Text>
            <Text style={styles.value}>{formatInrFromMinor(booking.amountMinor)}</Text>
          </View>
          {booking.scheduledAt ? (
            <View style={styles.row}>
              <Text style={styles.label}>Scheduled</Text>
              <Text style={styles.value}>{new Date(booking.scheduledAt).toLocaleString()}</Text>
            </View>
          ) : null}

          {booking.status === "pending_payment" ? (
            <PrimaryButton
              label={busy ? "Loading…" : "Pay now"}
              variant="cta"
              disabled={busy}
              onPress={() => void startPay()}
              style={{ marginTop: spacing.lg }}
            />
          ) : null}

          {booking.status === "completed" || booking.status === "confirmed" || booking.status === "pending_payment" ? (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Leave a review</Text>
              <Text style={styles.hint}>You can rate this provider anytime — booking does not need to be completed.</Text>
              <TextInput
                style={styles.input}
                value={String(rating)}
                onChangeText={(t) => setRating(Math.min(5, Math.max(1, Number(t) || 1)))}
                keyboardType="number-pad"
                placeholder="Rating 1–5"
              />
              <TextInput
                style={[styles.input, { minHeight: 80 }]}
                value={comment}
                onChangeText={setComment}
                placeholder="Comment (optional)"
                multiline
                textAlignVertical="top"
              />
              <PrimaryButton label="Submit review" disabled={busy} onPress={() => void submitReview()} />
            </View>
          ) : null}

          {(booking.status === "confirmed" || booking.status === "completed") && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request refund</Text>
              <TextInput
                style={styles.input}
                value={paymentId}
                onChangeText={setPaymentId}
                placeholder="Payment ID (from receipt)"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, { minHeight: 70 }]}
                value={refundNotes}
                onChangeText={setRefundNotes}
                placeholder="Reason (optional)"
                multiline
                textAlignVertical="top"
              />
              <PrimaryButton
                label="Submit refund request"
                variant="outline"
                disabled={busy}
                onPress={() => void requestRefund()}
              />
            </View>
          )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 13 },
  value: { fontWeight: "700", color: colors.navy },
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.navy, marginBottom: spacing.sm },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
});
