import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { adminStyles } from "./adminStyles";

type RefundRow = {
  id: string;
  paymentId: string;
  amountMinor: string;
  paymentAmountMinor?: string;
  notes: string | null;
  createdAt: string;
  payerUserId: string;
  payerName?: string | null;
  payerEmail?: string | null;
  requestedByUserId?: string;
  requestedByName?: string | null;
  requestedByEmail?: string | null;
  razorpayPaymentId?: string | null;
  bookingId?: string | null;
  serviceBookingId?: string | null;
  ticketOrderId?: string | null;
  kind?: string;
  contextLabel?: string;
  eventId?: string | null;
  eventTitle?: string | null;
};

type StallRefundRow = {
  bookingId: string;
  eventId?: string;
  eventTitle: string;
  exhibitorEmail: string;
  exhibitorName?: string | null;
  status: string;
  refundRequestedAt: string | null;
  subtotalMinor: string;
  refundStatus: string | null;
  paymentId: string | null;
};

export function AdminRefundsScreen() {
  const [refunds, setRefunds] = useState<RefundRow[]>([]);
  const [stallRefunds, setStallRefunds] = useState<StallRefundRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [paymentId, setPaymentId] = useState("");
  const [amountInr, setAmountInr] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    const [data, stall] = await Promise.all([
      apiJson<{ refunds: RefundRow[] }>("/admin/refunds/pending"),
      apiJson<{ stallRefunds: StallRefundRow[] }>("/admin/stall-booking-refunds").catch(() => ({
        stallRefunds: [],
      })),
    ]);
    setRefunds(data.refunds ?? []);
    setStallRefunds(stall.stallRefunds ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRefunds([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function createRequest() {
    if (!paymentId.trim()) {
      Alert.alert("Required", "Payment id is required.");
      return;
    }
    setBusy("create");
    try {
      const body: { amountMinor?: number; notes?: string | null } = {};
      if (amountInr.trim()) {
        const minor = Math.round(Number(amountInr) * 100);
        if (!Number.isFinite(minor) || minor <= 0) throw new Error("Invalid amount");
        body.amountMinor = minor;
      }
      body.notes = notes.trim() || null;
      await apiJson(`/admin/refunds/${paymentId.trim()}`, { method: "POST", body: JSON.stringify(body) });
      setPaymentId("");
      setAmountInr("");
      setNotes("");
      await load();
      Alert.alert("Created", "Refund request created.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function queueStall(row: StallRefundRow) {
    if (!row.paymentId) {
      Alert.alert("No payment", "No captured payment on this booking.");
      return;
    }
    setBusy(`stall-${row.bookingId}`);
    try {
      await apiJson(`/admin/refunds/${row.paymentId}`, {
        method: "POST",
        body: JSON.stringify({
          notes: `Stall booking refund · booking #${row.bookingId} · ${row.eventTitle}`,
        }),
      });
      await load();
      Alert.alert("Queued", "Refund is now in Pending — approve to process.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function approve(refundId: string) {
    setBusy(refundId);
    try {
      await apiJson(`/admin/refunds/${refundId}/approve`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function reject(refundId: string) {
    setBusy(refundId);
    try {
      await apiJson(`/admin/refunds/${refundId}/reject`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Reject failed");
    } finally {
      setBusy(null);
    }
  }

  const header = (
    <>
      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Stall booking refunds</Text>
        {stallRefunds.length === 0 ? (
          <Text style={adminStyles.sub}>No stall refund activity yet.</Text>
        ) : (
          stallRefunds.slice(0, 12).map((r) => (
            <View key={r.bookingId} style={{ marginBottom: 10 }}>
              <Text style={adminStyles.title}>
                #{r.bookingId} · {r.eventTitle}
              </Text>
              <Text style={adminStyles.sub}>
                {r.exhibitorName ?? r.exhibitorEmail} · {r.status}
                {r.paymentId ? ` · pay #${r.paymentId}` : " · no payment"}
                {r.refundStatus ? ` · ${r.refundStatus}` : ""}
                {r.eventId ? ` · event #${r.eventId}` : ""}
              </Text>
              {r.paymentId && (!r.refundStatus || r.refundStatus === "rejected") ? (
                <Pressable
                  style={[adminStyles.btn, adminStyles.approve, { marginTop: 6 }]}
                  disabled={busy === `stall-${r.bookingId}`}
                  onPress={() => void queueStall(r)}
                >
                  <Text style={adminStyles.btnText}>Queue pending refund</Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </View>
      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Create refund request</Text>
        <TextInput style={adminStyles.input} value={paymentId} onChangeText={setPaymentId} placeholder="Payment id" />
        <TextInput
          style={adminStyles.input}
          value={amountInr}
          onChangeText={setAmountInr}
          placeholder="Amount INR (optional partial)"
          keyboardType="decimal-pad"
        />
        <TextInput style={adminStyles.input} value={notes} onChangeText={setNotes} placeholder="Notes" />
        <PrimaryButton
          label={busy === "create" ? "Creating…" : "Create request"}
          variant="cta"
          disabled={busy === "create"}
          onPress={() => void createRequest()}
        />
      </View>
      <Text style={[adminStyles.sectionTitle, { marginBottom: 8 }]}>Pending ({refunds.length})</Text>
    </>
  );

  return (
    <ScreenShell title="Refunds" subtitle="Review & process refund requests">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={refunds}
          keyExtractor={(r) => r.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No pending refunds." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>
                {item.contextLabel ?? `Refund #${item.id}`} · {formatInrFromMinor(item.amountMinor)}
              </Text>
              <Text style={adminStyles.sub}>
                {(item.kind ?? "other").replace(/_/g, " ")} · refund #{item.id}
              </Text>
              <Text style={adminStyles.sub}>
                Requested by {item.requestedByName ?? "—"} ({item.requestedByEmail ?? "—"}) · user #
                {item.requestedByUserId}
              </Text>
              <Text style={adminStyles.sub}>
                Payer {item.payerName ?? "—"} ({item.payerEmail ?? "—"}) · user #{item.payerUserId}
              </Text>
              <Text style={adminStyles.sub}>
                Payment #{item.paymentId}
                {item.paymentAmountMinor ? ` · paid ${formatInrFromMinor(item.paymentAmountMinor)}` : ""}
              </Text>
              {item.razorpayPaymentId ? (
                <Text style={adminStyles.sub}>Razorpay: {item.razorpayPaymentId}</Text>
              ) : (
                <Text style={adminStyles.sub}>No Razorpay payment id</Text>
              )}
              {item.bookingId ? <Text style={adminStyles.sub}>Stall booking #{item.bookingId}</Text> : null}
              {item.serviceBookingId ? (
                <Text style={adminStyles.sub}>Service booking #{item.serviceBookingId}</Text>
              ) : null}
              {item.ticketOrderId ? <Text style={adminStyles.sub}>Ticket order #{item.ticketOrderId}</Text> : null}
              {item.eventId ? (
                <Text style={adminStyles.sub}>
                  Event #{item.eventId}
                  {item.eventTitle ? ` · ${item.eventTitle}` : ""}
                </Text>
              ) : null}
              <Text style={adminStyles.sub}>{item.notes ?? "—"}</Text>
              <Text style={adminStyles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>
              <View style={adminStyles.actions}>
                <Pressable
                  style={[adminStyles.btn, adminStyles.approve]}
                  disabled={busy === item.id}
                  onPress={() => void approve(item.id)}
                >
                  <Text style={adminStyles.btnText}>Approve & process</Text>
                </Pressable>
                <Pressable
                  style={[adminStyles.btn, adminStyles.reject]}
                  disabled={busy === item.id}
                  onPress={() => void reject(item.id)}
                >
                  <Text style={adminStyles.btnText}>Reject</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
