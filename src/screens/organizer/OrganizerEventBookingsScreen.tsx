import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type BookingItem = {
  itemId: string;
  stallId: string;
  label: string | null;
  unitPriceMinor: string;
};

type Booking = {
  id: string;
  exhibitorUserId?: string;
  exhibitorEmail?: string;
  exhibitorName?: string | null;
  exhibitorCompanyName?: string;
  status: string;
  stallLabels?: string[];
  subtotalMinor?: string;
  payNowMinor?: string;
  balanceDueMinor?: string;
  totalMinor?: string;
  currency?: string;
  createdAt?: string;
  refundRequestedAt?: string | null;
  paymentId?: string | null;
  refundStatus?: string | null;
  refundAmountMinor?: string | null;
  items?: BookingItem[];
};

function refundNote(item: Booking): string | null {
  if (item.refundStatus) {
    const amt = item.refundAmountMinor ? ` · ₹${(Number(item.refundAmountMinor) / 100).toFixed(2)}` : "";
    return `Refund ${item.refundStatus}${amt}`;
  }
  if (item.refundRequestedAt) {
    return `Refund requested ${new Date(item.refundRequestedAt).toLocaleString()}`;
  }
  if (item.status === "cancelled" && item.paymentId) {
    return "Cancelled — paid booking may need refund";
  }
  return null;
}

type StallOption = {
  id: string;
  label: string | null;
  gridRow: string | null;
  gridCol: string | null;
  status: string;
};

function money(minor: string | undefined, cur = "INR") {
  return `₹${(Number(minor ?? 0) / 100).toFixed(2)} ${cur}`;
}

function stallLabel(s: StallOption) {
  const g =
    s.gridRow != null && s.gridCol != null
      ? ` R${s.gridRow}C${s.gridCol}`
      : s.gridRow != null
        ? ` row ${s.gridRow}`
        : s.gridCol != null
          ? ` col ${s.gridCol}`
          : "";
  return `${s.label ?? s.id.slice(0, 8)}${g}`;
}

export function OrganizerEventBookingsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<Booking[]>([]);
  const [stalls, setStalls] = useState<StallOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [stallPicks, setStallPicks] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const [b, st] = await Promise.all([
      apiJson<{ bookings: Booking[] }>(`/organizer/events/${eventId}/bookings`),
      apiJson<{ stalls: StallOption[] }>(`/organizer/events/${eventId}/stalls`),
    ]);
    setRows(b.bookings ?? []);
    setStalls(st.stalls ?? []);
  }, [eventId]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function approve(bookingId: string) {
    setBusy(bookingId);
    try {
      const out = await apiJson<{ ok: boolean; razorpayOrderId: string | null }>(
        `/organizer/events/${eventId}/bookings/${bookingId}/approve`,
        { method: "POST", body: JSON.stringify({}) }
      );
      await load();
      Alert.alert(
        "Approved",
        out.razorpayOrderId
          ? "Razorpay order created — exhibitor can pay from My bookings."
          : "Free booking confirmed."
      );
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(bookingId: string) {
    Alert.alert("Reject booking?", "Cancel and release stall holds?", [
      { text: "No", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(bookingId);
            try {
              await apiJson(`/organizer/events/${eventId}/bookings/${bookingId}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(null);
            }
          })();
        },
      },
    ]);
  }

  async function reassign(bookingId: string, bookingItemId: string, newStallId: string, pickKey: string) {
    setBusy(pickKey);
    try {
      await apiJson(`/organizer/events/${eventId}/bookings/${bookingId}/reassign-stall`, {
        method: "POST",
        body: JSON.stringify({ bookingItemId, newStallId }),
      });
      setStallPicks((prev) => {
        const next = { ...prev };
        delete next[pickKey];
        return next;
      });
      await load();
      Alert.alert("Done", "Stall reassigned.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScreenShell title="Stall bookings" subtitle="Approve, reject & reassign stalls">
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(b) => b.id}
          ListEmptyComponent={<EmptyState title="No bookings." compact />}
          renderItem={({ item }) => {
            const cur = item.currency ?? "INR";
            const canReassign =
              item.status === "confirmed" || item.status === "pending" || item.status === "pending_approval";
            const label = item.exhibitorEmail ?? item.exhibitorCompanyName ?? item.exhibitorName ?? "Exhibitor";
            return (
              <View style={styles.card}>
                <Text style={styles.title}>{label}</Text>
                <Text style={styles.sub}>
                  {item.status.toUpperCase()} · {money(item.subtotalMinor ?? item.totalMinor, cur)}
                </Text>
                {Number(item.balanceDueMinor ?? 0) > 0 ? (
                  <Text style={styles.token}>
                    Token {money(item.payNowMinor, cur)} · balance offline {money(item.balanceDueMinor, cur)}
                  </Text>
                ) : null}
                {item.createdAt ? (
                  <Text style={styles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>
                ) : null}
                {refundNote(item) ? (
                  <Text style={styles.refund}>{refundNote(item)}</Text>
                ) : null}

                {item.items?.length ? (
                  <View style={styles.items}>
                    {item.items.map((it) => {
                      const pickKey = it.itemId ?? `${item.id}-${it.stallId}`;
                      const effectiveStall = stallPicks[pickKey] ?? it.stallId;
                      const opts = stalls.filter((s) => s.status === "available" || s.id === it.stallId);
                      return (
                        <View key={pickKey} style={styles.itemRow}>
                          <Text style={styles.itemText}>
                            Stall {it.label ?? it.stallId.slice(0, 8)} · {money(it.unitPriceMinor, cur)}
                          </Text>
                          {canReassign && it.itemId && opts.length > 0 ? (
                            <View style={styles.reassign}>
                              {opts.map((s) => (
                                <Pressable
                                  key={s.id}
                                  style={[styles.stallChip, effectiveStall === s.id && styles.stallChipActive]}
                                  onPress={() => setStallPicks((prev) => ({ ...prev, [pickKey]: s.id }))}
                                >
                                  <Text
                                    style={[
                                      styles.stallChipText,
                                      effectiveStall === s.id && styles.stallChipTextActive,
                                    ]}
                                  >
                                    {stallLabel(s)}
                                  </Text>
                                </Pressable>
                              ))}
                              <Pressable
                                style={[styles.applyBtn, (busy === pickKey || effectiveStall === it.stallId) && { opacity: 0.5 }]}
                                disabled={busy === pickKey || effectiveStall === it.stallId}
                                onPress={() => void reassign(item.id, it.itemId, effectiveStall, pickKey)}
                              >
                                <Text style={styles.applyText}>{busy === pickKey ? "…" : "Apply move"}</Text>
                              </Pressable>
                            </View>
                          ) : null}
                        </View>
                      );
                    })}
                  </View>
                ) : item.stallLabels?.length ? (
                  <Text style={styles.sub}>Stalls: {item.stallLabels.join(", ")}</Text>
                ) : null}

                <View style={styles.actions}>
                  {item.status === "pending_approval" ? (
                    <Pressable
                      style={[styles.btn, busy === item.id && { opacity: 0.5 }]}
                      disabled={busy === item.id}
                      onPress={() => void approve(item.id)}
                    >
                      <Text style={styles.btnText}>Approve</Text>
                    </Pressable>
                  ) : null}
                  {item.status !== "cancelled" ? (
                    <Pressable onPress={() => void reject(item.id)} disabled={busy === item.id}>
                      <Text style={styles.danger}>Reject / cancel</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
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
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: "800", color: colors.navy },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  refund: { fontSize: 12, color: "#6d28d9", marginTop: 4, fontWeight: "700" },
  token: { fontSize: 12, color: colors.emeraldDark, marginTop: 4, fontWeight: "600" },
  items: { marginTop: spacing.sm, borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: spacing.sm },
  itemRow: { marginBottom: spacing.sm },
  itemText: { fontSize: 12, color: colors.textMuted },
  reassign: { marginTop: 6, gap: 4 },
  stallChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 4,
  },
  stallChipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  stallChipText: { fontSize: 11, color: colors.navy },
  stallChipTextActive: { color: "#fff" },
  applyBtn: { alignSelf: "flex-start", marginTop: 4 },
  applyText: { fontSize: 12, fontWeight: "700", color: colors.emerald },
  actions: { flexDirection: "row", alignItems: "center", gap: spacing.lg, marginTop: spacing.md },
  btn: {
    backgroundColor: colors.emerald,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.md,
  },
  btnText: { color: "#fff", fontWeight: "800" },
  danger: { color: colors.cta, fontWeight: "700" },
});
