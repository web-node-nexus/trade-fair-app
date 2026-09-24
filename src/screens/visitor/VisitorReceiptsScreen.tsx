import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Receipt = {
  id: string;
  amountMinor: string;
  currency: string;
  status: string;
  createdAt: string;
  invoiceNumber: string | null;
  ticketOrderId: string | null;
  bookingId: string | null;
  payerName: string;
  payerEmail: string;
  metadata?: { commissionMinor?: string; gstMinor?: string };
};

export function VisitorReceiptsScreen() {
  const [rows, setRows] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Receipt | null>(null);

  const load = useCallback(async () => {
    const data = await apiJson<{ receipts: Receipt[] }>("/visitor/receipts");
    setRows(data.receipts ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  function description(r: Receipt) {
    if (r.ticketOrderId) return `Ticket order #${r.ticketOrderId}`;
    if (r.bookingId) return `Stall booking #${r.bookingId}`;
    return "Platform payment";
  }

  return (
    <ScreenShell title="Receipts" subtitle="Payment history">
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          data={rows}
          keyExtractor={(r) => r.id}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <EmptyState
              icon="receipt-outline"
              title="No receipts yet"
              message="Your payment history will appear here after you book."
              compact
            />
          }
          renderItem={({ item }) => (
            <DashboardListCard
              title={item.invoiceNumber ?? `Payment #${item.id}`}
              amount={`${formatInrFromMinor(item.amountMinor)} ${item.currency}`}
              meta={new Date(item.createdAt).toLocaleString()}
              status={item.status}
              icon="receipt-outline"
              iconColor={colors.navy}
              iconBg="rgba(10,31,61,0.08)"
              onPress={() => setSelected(item)}
            />
          )}
        />
      )}

      <BottomSheetModal
        visible={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.invoiceNumber ?? (selected ? `Payment #${selected.id}` : undefined)}
        maxHeight="85%"
      >
        {selected ? (
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.detailCard}>
              <DetailRow label="Amount" value={`${formatInrFromMinor(selected.amountMinor)} ${selected.currency}`} />
              <DetailRow label="Status" value={selected.status} />
              <DetailRow label="Date" value={new Date(selected.createdAt).toLocaleString()} />
              <DetailRow label="Payer" value={selected.payerName} />
              <DetailRow label="Email" value={selected.payerEmail} />
              <DetailRow label="Description" value={description(selected)} />
              <DetailRow label="Payment ID" value={selected.id} />
              {selected.metadata?.commissionMinor ? (
                <DetailRow label="Commission" value={formatInrFromMinor(selected.metadata.commissionMinor)} />
              ) : null}
              {selected.metadata?.gstMinor ? (
                <DetailRow label="GST" value={formatInrFromMinor(selected.metadata.gstMinor)} />
              ) : null}
            </View>
            <Pressable style={styles.closeBtn} onPress={() => setSelected(null)}>
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </BottomSheetModal>
    </ScreenShell>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingBottom: spacing.xl },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(10,31,61,0.55)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.xl + 4,
    borderTopRightRadius: radius.xl + 4,
    padding: spacing.xl,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 22, fontWeight: "800", color: colors.navy, marginBottom: spacing.lg, letterSpacing: -0.3 },
  detailCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  detailRow: { marginBottom: spacing.md },
  detailLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, color: colors.navy, marginTop: 2, fontWeight: "600" },
  closeBtn: {
    marginTop: spacing.lg,
    padding: spacing.md,
    alignItems: "center",
    backgroundColor: colors.navy,
    borderRadius: radius.lg,
    ...cardShadow,
  },
  closeText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
