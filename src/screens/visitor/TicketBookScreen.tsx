import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { EventMedia, TicketType } from "@/api/types";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { LoadingView } from "@/components/ui/LoadingView";
import { useAuth } from "@/context/AuthContext";
import { publicJson, apiJson } from "@/lib/authFetch";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { ZoomableImage } from "@/context/ImageZoomContext";
import { appStyles } from "@/theme/appStyles";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { eventLocation, formatEventDateRange } from "@/utils/eventFormat";
import type { PublicEvent } from "@/api/types";

export function TicketBookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [media, setMedia] = useState<EventMedia[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) return;
    const data = await publicJson<{
      event: PublicEvent;
      ticketTypes: TicketType[];
      media: EventMedia[];
    }>(`/events/${id}`);
    setEvent(data.event);
    setTickets(data.ticketTypes ?? []);
    setMedia(data.media ?? []);
    const first = data.ticketTypes?.find((t) => t.quota - t.soldCount > 0) ?? data.ticketTypes?.[0];
    if (first) setSelectedId(first.id);
  }, [id]);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  const selected = tickets.find((t) => t.id === selectedId);
  const maxQty = selected ? Math.max(0, Math.min(10, selected.quota - selected.soldCount)) : 0;
  const priceMinor = selected ? Number(selected.priceMinor) : 0;
  const isPaid = priceMinor > 0;

  async function checkout() {
    if (!user) {
      router.push("/(auth)/login");
      return;
    }
    if (!selectedId || maxQty < 1) {
      Alert.alert("Unavailable", "This ticket type is sold out.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiJson<{
        ticketOrderId: string;
        totalMinor: string;
        razorpayOrderId: string | null;
        razorpayKeyId: string | null;
        tickets?: { id: string }[];
      }>(`/visitor/events/${id}/ticket-orders`, {
        method: "POST",
        body: JSON.stringify({ ticketTypeId: selectedId, quantity: qty }),
      });

      if (data.tickets?.length || !data.razorpayOrderId) {
        Alert.alert("Confirmed", "Your passes are ready.", [
          { text: "View passes", onPress: () => router.replace("/dashboard/visitor/tickets") },
        ]);
        return;
      }

      if (data.razorpayOrderId && data.razorpayKeyId) {
        const response = await openRazorpayCheckout({
          keyId: data.razorpayKeyId,
          orderId: data.razorpayOrderId,
          amountMinor: Number(data.totalMinor),
          description: event?.title ?? "Event tickets",
        });
        await apiJson(`/visitor/ticket-orders/${data.ticketOrderId}/pay/verify`, {
          method: "POST",
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          }),
        });
        router.replace("/dashboard/visitor/tickets");
      }
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      Alert.alert("Error", e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <LoadingView label="Loading tickets…" />;

  if (!event) {
    return (
      <ScreenShell title="Book tickets">
        <Text style={appStyles.muted}>Event not found.</Text>
      </ScreenShell>
    );
  }

  const cover = resolveMediaUrl(event.coverImageUrl ?? media[0]?.url ?? null);

  return (
    <ScreenShell title="Book tickets" subtitle={event.title} scroll onRefresh={load}>
      <View style={styles.eventCard}>
        {cover ? (
          <ZoomableImage uri={cover} style={styles.cover} contentFit="cover" />
        ) : null}
        <View style={styles.eventMeta}>
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.emerald} />
            <Text style={styles.meta}>{eventLocation(event)}</Text>
          </View>
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.emerald} />
            <Text style={styles.meta}>{formatEventDateRange(event.startsAt, event.endsAt)}</Text>
          </View>
        </View>
      </View>

      <SectionHeader title="Select ticket" />
      {tickets.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={appStyles.muted}>No tickets on sale yet.</Text>
        </View>
      ) : (
        tickets.map((t) => {
          const left = Math.max(0, t.quota - t.soldCount);
          const active = t.id === selectedId;
          const price = Number(t.priceMinor);
          return (
            <Pressable
              key={t.id}
              style={[styles.ticketRow, active && styles.ticketRowActive, left === 0 && styles.ticketDisabled]}
              disabled={left === 0}
              onPress={() => setSelectedId(t.id)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.ticketName}>{t.name}</Text>
                {left === 0 ? <Text style={styles.ticketMeta}>Sold out</Text> : null}
              </View>
              <Text style={styles.ticketPrice}>{price > 0 ? `₹${(price / 100).toLocaleString("en-IN")}` : "FREE"}</Text>
              {active ? <Ionicons name="checkmark-circle" size={24} color={colors.emerald} /> : null}
            </Pressable>
          );
        })
      )}

      {maxQty > 0 ? (
        <View style={styles.qtyCard}>
          <SectionHeader title="Quantity" />
          <View style={styles.stepper}>
            <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.max(1, q - 1))}>
              <Ionicons name="remove" size={18} color={colors.navy} />
            </Pressable>
            <Text style={styles.qtyVal}>{qty}</Text>
            <Pressable style={styles.stepBtn} onPress={() => setQty((q) => Math.min(maxQty, q + 1))}>
              <Ionicons name="add" size={18} color={colors.navy} />
            </Pressable>
          </View>
        </View>
      ) : null}

      <PrimaryButton
        label={
          busy
            ? "Processing…"
            : tickets.length === 0 || maxQty < 1
              ? "Tickets not for sale"
              : isPaid
                ? `Pay ₹${((priceMinor * qty) / 100).toLocaleString("en-IN")}`
                : "Confirm free tickets"
        }
        onPress={() => void checkout()}
        disabled={busy || !selectedId || maxQty < 1 || tickets.length === 0}
        style={{ marginTop: spacing.xl }}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    overflow: "hidden",
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  cover: { width: "100%", height: 180 },
  eventMeta: { padding: spacing.lg, gap: spacing.sm },
  metaRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  meta: { fontSize: 14, color: colors.textMuted, flex: 1 },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.lg + 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    marginBottom: spacing.sm,
    ...cardShadow,
  },
  ticketRowActive: { borderColor: colors.emerald, backgroundColor: "#ecfdf5" },
  ticketDisabled: { opacity: 0.5 },
  ticketName: { fontWeight: "800", color: colors.navy, fontSize: 15 },
  ticketMeta: { fontSize: 12, color: colors.textMuted, marginTop: 3 },
  ticketPrice: { fontWeight: "800", color: colors.navy, fontSize: 16 },
  qtyCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  stepper: { flexDirection: "row", alignItems: "center", gap: spacing.lg },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyVal: { fontSize: 20, fontWeight: "800", color: colors.navy, minWidth: 28, textAlign: "center" },
});
