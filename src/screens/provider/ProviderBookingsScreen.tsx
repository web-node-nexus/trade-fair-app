import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Booking = {
  id: string;
  serviceId: string;
  serviceTitle: string;
  customerUserId: string;
  customerName: string;
  amountMinor: string;
  status: string;
  scheduledAt: string | null;
};

type Svc = { id: string; title: string };

export function ProviderBookingsScreen() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [services, setServices] = useState<Svc[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    serviceId: "",
    customerUserId: "",
    amountInr: "1000",
    requestId: "",
    scheduledAt: "",
  });
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [j, sv] = await Promise.all([
      apiJson<{ bookings: Booking[] }>("/provider/service-bookings"),
      apiJson<{ services: Svc[] }>("/provider/services"),
    ]);
    setRows(j.bookings ?? []);
    setServices(sv.services ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function createBooking() {
    const minor = Math.round(Number(form.amountInr) * 100);
    if (!form.serviceId || !form.customerUserId || !Number.isFinite(minor) || minor <= 0) {
      Alert.alert("Required", "Service, customer user ID, and amount are required.");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/provider/service-bookings", {
        method: "POST",
        body: JSON.stringify({
          serviceId: form.serviceId,
          customerUserId: form.customerUserId.trim(),
          serviceRequestId: form.requestId.trim() || null,
          amountMinor: minor,
          scheduledAt: form.scheduledAt.trim() ? new Date(form.scheduledAt).toISOString() : null,
        }),
      });
      setCreating(false);
      setForm({ serviceId: "", customerUserId: "", amountInr: "1000", requestId: "", scheduledAt: "" });
      await load();
      Alert.alert("Created", "Customer can pay from My service bookings.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function patchBooking(id: string, body: Record<string, unknown>) {
    setBusy(true);
    try {
      await apiJson(`/provider/service-bookings/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  if (creating) {
    return (
      <ScreenShell title="New booking" scroll>
        <View style={styles.formCard}>
          <SectionHeader title="Service" />
          {services.map((s) => (
            <Pressable
              key={s.id}
              style={[styles.chip, form.serviceId === s.id && styles.chipOn]}
              onPress={() => setForm((f) => ({ ...f, serviceId: s.id }))}
            >
              <Text style={[styles.chipText, form.serviceId === s.id && styles.chipTextOn]}>{s.title}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.formCard}>
          <SectionHeader title="Booking details" />
          <Text style={styles.label}>Customer user ID</Text>
          <TextInput style={styles.input} value={form.customerUserId} onChangeText={(t) => setForm((f) => ({ ...f, customerUserId: t }))} placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Linked request ID (optional)</Text>
          <TextInput style={styles.input} value={form.requestId} onChangeText={(t) => setForm((f) => ({ ...f, requestId: t }))} placeholderTextColor={colors.textMuted} />
          <Text style={styles.label}>Amount (INR)</Text>
          <TextInput style={styles.input} value={form.amountInr} onChangeText={(t) => setForm((f) => ({ ...f, amountInr: t }))} keyboardType="decimal-pad" />
          <Text style={styles.label}>Schedule (YYYY-MM-DD HH:MM, optional)</Text>
          <TextInput style={styles.input} value={form.scheduledAt} onChangeText={(t) => setForm((f) => ({ ...f, scheduledAt: t }))} placeholderTextColor={colors.textMuted} />
        </View>

        <PrimaryButton label={busy ? "Creating…" : "Create booking"} variant="cta" disabled={busy} onPress={() => void createBooking()} />
        <Pressable onPress={() => setCreating(false)} style={styles.cancelWrap}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Bookings" subtitle="Confirmed jobs">
      <Pressable style={styles.addBtn} onPress={() => setCreating(true)}>
        <Ionicons name="add-circle" size={22} color={colors.emerald} />
        <Text style={styles.add}>Create booking</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          data={rows}
          keyExtractor={(b) => b.id}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No bookings yet." compact />}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <DashboardListCard
                title={item.serviceTitle}
                subtitle={item.customerName}
                amount={formatInrFromMinor(item.amountMinor)}
                status={item.status}
                icon="calendar-outline"
                iconColor={colors.emerald}
                iconBg="rgba(16,185,129,0.12)"
              />
              <View style={styles.actions}>
                {item.status === "pending_payment" ? (
                  <Pressable onPress={() => void patchBooking(item.id, { status: "cancelled" })}>
                    <Text style={[styles.action, styles.actionDanger]}>Cancel</Text>
                  </Pressable>
                ) : null}
                {item.status === "confirmed" ? (
                  <Pressable onPress={() => void patchBooking(item.id, { status: "completed" })}>
                    <Text style={styles.action}>Mark completed</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingBottom: spacing.xl },
  addBtn: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginBottom: spacing.lg },
  add: { color: colors.emerald, fontWeight: "800", fontSize: 15 },
  listItem: { marginBottom: spacing.xs },
  actions: { flexDirection: "row", gap: spacing.lg, paddingHorizontal: spacing.sm, paddingBottom: spacing.sm },
  action: { color: colors.emerald, fontWeight: "700", fontSize: 13 },
  actionDanger: { color: colors.cta },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.navy,
  },
  chip: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  chipOn: { borderColor: colors.emerald, backgroundColor: "#ecfdf5" },
  chipText: { fontWeight: "600", color: colors.navy },
  chipTextOn: { color: colors.emeraldDark },
  link: { color: colors.emerald, fontWeight: "700", textAlign: "center" },
  cancelWrap: { marginTop: spacing.md, marginBottom: spacing.lg },
});
