import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Pressable, Text, TextInput, View} from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { adminStyles } from "./adminStyles";

type Dispute = {
  id: string;
  paymentId: string | null;
  status: "open" | "resolved" | "closed";
  createdAt: string;
  payment: {
    payerUserId: string | null;
    amountMinor: string | null;
    currency: string | null;
    paymentStatus: string | null;
  } | null;
};

export function AdminDisputesScreen() {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const p = new URLSearchParams();
    if (status.trim()) p.set("status", status.trim());
    const qs = p.toString();
    const j = await apiJson<{ disputes: Dispute[] }>(`/admin/disputes${qs ? `?${qs}` : ""}`);
    setItems(j.disputes ?? []);
  }, [status]);

  useEffect(() => {
    void load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function patch(id: string, next: "resolved" | "closed") {
    setBusy(id);
    try {
      await apiJson(`/admin/disputes/${id}`, { method: "PATCH", body: JSON.stringify({ status: next }) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const header = (
    <TextInput
      style={adminStyles.input}
      value={status}
      onChangeText={setStatus}
      placeholder="Filter: open / resolved / closed"
      onSubmitEditing={() => void load()}
    />
  );

  return (
    <ScreenShell title="Disputes" subtitle="Payment dispute queue">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={items}
          keyExtractor={(d) => d.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No disputes." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>Dispute #{item.id}</Text>
              <Text style={adminStyles.sub}>
                {new Date(item.createdAt).toLocaleString()} · payment {item.paymentId ?? "—"}
              </Text>
              {item.payment?.amountMinor ? (
                <Text style={adminStyles.sub}>
                  {formatInrFromMinor(item.payment.amountMinor)} {item.payment.currency ?? ""} · {item.payment.paymentStatus}
                </Text>
              ) : null}
              <Text style={adminStyles.sub}>Status: {item.status}</Text>
              {item.status === "open" ? (
                <View style={adminStyles.actions}>
                  <Pressable style={[adminStyles.btn, adminStyles.approve]} disabled={busy === item.id} onPress={() => void patch(item.id, "resolved")}>
                    <Text style={adminStyles.btnText}>Resolve</Text>
                  </Pressable>
                  <Pressable style={[adminStyles.btn, adminStyles.neutral]} disabled={busy === item.id} onPress={() => void patch(item.id, "closed")}>
                    <Text style={adminStyles.btnText}>Close</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
