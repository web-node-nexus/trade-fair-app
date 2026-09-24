import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { adminStyles } from "./adminStyles";

type TxRow = {
  id: string;
  createdAt: string;
  payerUserId: string;
  payerName?: string | null;
  payerEmail?: string | null;
  amountMinor: string;
  currency: string;
  status: string;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  bookingId: string | null;
  ticketOrderId: string | null;
  serviceBookingId: string | null;
  invoiceNumber: string | null;
};

type TxDetail = TxRow & {
  metadata?: Record<string, unknown> | null;
  refunds?: { id: string; amountMinor: string; status: string }[];
};

function payerLabel(row: { payerName?: string | null; payerEmail?: string | null; payerUserId: string }) {
  if (row.payerName) return row.payerName;
  if (row.payerEmail) return row.payerEmail;
  return `User #${row.payerUserId}`;
}

export function AdminTransactionsScreen() {
  const [rows, setRows] = useState<TxRow[]>([]);
  const [selected, setSelected] = useState<TxDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ transactions?: TxRow[]; ledger?: TxRow[]; payments?: TxRow[] }>(
      "/admin/transactions/ledger?limit=100"
    );
    setRows(data.ledger ?? data.transactions ?? data.payments ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function openDetail(id: string) {
    setDetailLoading(true);
    try {
      const data = await apiJson<{ transaction?: TxDetail; payment?: TxDetail }>(`/admin/transactions/${id}`);
      setSelected(data.transaction ?? data.payment ?? null);
    } catch {
      setSelected(null);
    } finally {
      setDetailLoading(false);
    }
  }

  if (selected) {
    return (
      <ScreenShell title={`Transaction #${selected.id}`} subtitle={selected.status}>
        {detailLoading ? (
          <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
        ) : (
          <View>
            <Text style={adminStyles.sub}>{new Date(selected.createdAt).toLocaleString()}</Text>
            <Text style={adminStyles.sub}>
              {formatInrFromMinor(selected.amountMinor)} {selected.currency}
            </Text>
            <Text style={adminStyles.sub}>Payer: {payerLabel(selected)}</Text>
            {selected.payerEmail ? <Text style={adminStyles.sub}>{selected.payerEmail}</Text> : null}
            <Text style={adminStyles.sub}>Razorpay order: {selected.razorpayOrderId ?? "—"}</Text>
            <Text style={adminStyles.sub}>Razorpay payment: {selected.razorpayPaymentId ?? "—"}</Text>
            <Text style={adminStyles.sub}>Booking: {selected.bookingId ?? "—"}</Text>
            <Text style={adminStyles.sub}>Ticket order: {selected.ticketOrderId ?? "—"}</Text>
            <Text style={adminStyles.sub}>Service booking: {selected.serviceBookingId ?? "—"}</Text>
            <Text style={adminStyles.sub}>Invoice: {selected.invoiceNumber ?? "—"}</Text>
            {(selected.refunds ?? []).length > 0 ? (
              <View style={adminStyles.section}>
                <Text style={adminStyles.sectionTitle}>Refunds</Text>
                {selected.refunds!.map((r) => (
                  <Text key={r.id} style={adminStyles.sub}>
                    #{r.id} · {formatInrFromMinor(r.amountMinor)} · {r.status}
                  </Text>
                ))}
              </View>
            ) : null}
            <Pressable onPress={() => setSelected(null)}>
              <Text style={adminStyles.backLink}>← All transactions</Text>
            </Pressable>
          </View>
        )}
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Transactions" subtitle="Payment ledger">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(r) => r.id}
          ListEmptyComponent={<EmptyState title="No transactions." compact />}
          renderItem={({ item }) => (
            <Pressable style={adminStyles.card} onPress={() => void openDetail(item.id)}>
              <Text style={adminStyles.title}>#{item.id}</Text>
              <Text style={adminStyles.sub}>
                {formatInrFromMinor(item.amountMinor)} {item.currency} · {item.status}
              </Text>
              <Text style={adminStyles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>
              <Text style={adminStyles.sub}>Payer {payerLabel(item)}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}
