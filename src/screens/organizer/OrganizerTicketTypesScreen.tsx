import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type TicketType = {
  id: string;
  name: string;
  priceMinor: string;
  quota: number;
  soldCount: number;
};

function rupeesFieldToMinor(rupees: string): number {
  const n = Number(String(rupees).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function minorToRupees(minor: string): string {
  return String(Number(minor) / 100);
}

export function OrganizerTicketTypesScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState("General");
  const [price, setPrice] = useState("0");
  const [quota, setQuota] = useState("500");
  const [entryQrAllowReentry, setEntryQrAllowReentry] = useState(false);
  const [entryQrSaving, setEntryQrSaving] = useState(false);

  const load = useCallback(async () => {
    const [ticketData, eventData] = await Promise.all([
      apiJson<{ ticketTypes: TicketType[] }>(`/organizer/events/${eventId}/ticket-types`),
      apiJson<{ event: { entryQrAllowReentry?: boolean } }>(`/organizer/events/${eventId}`),
    ]);
    setRows(ticketData.ticketTypes ?? []);
    setEntryQrAllowReentry(Boolean(eventData.event?.entryQrAllowReentry));
  }, [eventId]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  function startEdit(t: TicketType) {
    setEditId(t.id);
    setName(t.name);
    setPrice(minorToRupees(t.priceMinor));
    setQuota(String(t.quota));
    setCreating(true);
  }

  async function saveReentry(next: boolean) {
    setEntryQrAllowReentry(next);
    setEntryQrSaving(true);
    try {
      await apiJson(`/organizer/events/${eventId}`, {
        method: "PATCH",
        body: JSON.stringify({ entryQrAllowReentry: next }),
      });
    } catch (e) {
      setEntryQrAllowReentry(!next);
      Alert.alert("Error", e instanceof Error ? e.message : "Could not update scan setting");
    } finally {
      setEntryQrSaving(false);
    }
  }

  async function save() {
    const priceMinor = rupeesFieldToMinor(price);
    if (!Number.isFinite(priceMinor)) {
      Alert.alert("Invalid price", "Enter a valid price in rupees (0 for free).");
      return;
    }
    setBusy(true);
    try {
      const body = { name: name.trim(), priceMinor, quota: Number(quota) };
      if (editId) {
        await apiJson(`/organizer/events/${eventId}/ticket-types/${editId}`, {
          method: "PATCH",
          body: JSON.stringify(body),
        });
      } else {
        await apiJson(`/organizer/events/${eventId}/ticket-types`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }
      setCreating(false);
      setEditId(null);
      setName("General");
      setPrice("0");
      setQuota("500");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    Alert.alert("Remove ticket type?", "Only allowed if no tickets sold.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await apiJson(`/organizer/events/${eventId}/ticket-types/${id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  if (creating) {
    return (
      <ScreenShell title={editId ? "Edit ticket type" : "Add ticket type"}>
        <Field label="Name" value={name} onChange={setName} />
        <Field label="Price (₹)" value={price} onChange={setPrice} keyboard="decimal-pad" />
        <Field label="Max tickets" value={quota} onChange={setQuota} keyboard="number-pad" />
        <View style={styles.scanCard}>
          <View style={{ flex: 1, marginRight: spacing.md }}>
            <Text style={styles.scanLabel}>Allow multiple scans</Text>
            <Text style={styles.scanHint}>Off: first scan marks ticket used. On: same QR works for re-entry.</Text>
          </View>
          <Switch
            value={entryQrAllowReentry}
            disabled={entryQrSaving}
            onValueChange={(v) => void saveReentry(v)}
            trackColor={{ true: colors.emerald }}
          />
        </View>
        <PrimaryButton label={busy ? "Saving…" : "Save"} variant="cta" disabled={busy} onPress={() => void save()} />
        <Pressable
          onPress={() => {
            setCreating(false);
            setEditId(null);
          }}
          style={{ marginTop: spacing.md }}
        >
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Ticket types" subtitle="Visitor pass pricing & quota">
      <View style={styles.scanCard}>
        <View style={{ flex: 1, marginRight: spacing.md }}>
          <Text style={styles.scanLabel}>Allow multiple scans</Text>
          <Text style={styles.scanHint}>Applies to all visitor tickets on this event.</Text>
        </View>
        <Switch
          value={entryQrAllowReentry}
          disabled={entryQrSaving || loading}
          onValueChange={(v) => void saveReentry(v)}
          trackColor={{ true: colors.emerald }}
        />
      </View>
      <Pressable style={styles.addRow} onPress={() => setCreating(true)}>
        <Text style={styles.addText}>+ Add ticket type</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(t) => t.id}
          ListEmptyComponent={<EmptyState title="No ticket types yet." compact />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={styles.sub}>
                ₹{(Number(item.priceMinor) / 100).toFixed(2)} · {item.soldCount}/{item.quota} sold
              </Text>
              <View style={styles.actions}>
                <Pressable onPress={() => startEdit(item)}>
                  <Text style={styles.link}>Edit</Text>
                </Pressable>
                <Pressable onPress={() => void remove(item.id)}>
                  <Text style={styles.danger}>Remove</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "default" | "decimal-pad" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType={keyboard} />
    </View>
  );
}

const styles = StyleSheet.create({
  addRow: { marginBottom: spacing.md },
  addText: { color: colors.cta, fontWeight: "800" },
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
  actions: { flexDirection: "row", gap: spacing.lg, marginTop: spacing.sm },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  link: { color: colors.emerald, fontWeight: "700" },
  danger: { color: colors.cta, fontWeight: "700" },
  scanCard: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(16,185,129,0.35)",
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  scanLabel: { fontSize: 14, fontWeight: "700", color: colors.navy },
  scanHint: { fontSize: 12, color: colors.textMuted, marginTop: 4, lineHeight: 16 },
});
