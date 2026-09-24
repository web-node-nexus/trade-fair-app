import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type PoolVolunteer = {
  id: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  loginEmail: string;
};

type EventVolunteer = {
  volunteerId: string;
  fullName: string;
  phone: string;
  photoUrl: string | null;
  loginEmail: string;
  assignedAt: string;
};

export function OrganizerVolunteersScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [pool, setPool] = useState<PoolVolunteer[]>([]);
  const [assigned, setAssigned] = useState<EventVolunteer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [pickId, setPickId] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const load = useCallback(async () => {
    const [poolJ, evJ] = await Promise.all([
      apiJson<{ volunteers: PoolVolunteer[] }>("/organizer/volunteers"),
      apiJson<{ volunteers: EventVolunteer[] }>(`/organizer/events/${eventId}/volunteers`),
    ]);
    setPool(poolJ.volunteers ?? []);
    setAssigned(evJ.volunteers ?? []);
    const assignedIds = new Set((evJ.volunteers ?? []).map((a) => a.volunteerId));
    const first = (poolJ.volunteers ?? []).find((v) => !assignedIds.has(v.id));
    setPickId((prev) => (prev && !assignedIds.has(prev) ? prev : first?.id ?? ""));
  }, [eventId]);

  useEffect(() => {
    void load()
      .catch(() => {
        setPool([]);
        setAssigned([]);
      })
      .finally(() => setLoading(false));
  }, [load]);

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.volunteerId)), [assigned]);
  const unassigned = useMemo(() => pool.filter((v) => !assignedIds.has(v.id)), [pool, assignedIds]);

  async function assignExisting() {
    if (!pickId || assignedIds.has(pickId)) return;
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/volunteers/assign`, {
        method: "POST",
        body: JSON.stringify({ volunteerId: pickId }),
      });
      await load();
      Alert.alert("Assigned", "Volunteer added to this event.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function createAndAssign() {
    if (!fullName.trim() || !phone.trim() || !email.trim() || password.length < 8) {
      Alert.alert("Required", "Fill all fields. Password must be at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/volunteers`, {
        method: "POST",
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          email: email.trim(),
          password,
        }),
      });
      setFullName("");
      setPhone("");
      setEmail("");
      setPassword("");
      setMode("existing");
      await load();
      Alert.alert("Created", "Volunteer created and assigned.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function unassign(volunteerId: string) {
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/volunteers/${volunteerId}`, { method: "DELETE" });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
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

  return (
    <ScreenShell title="Volunteers" subtitle="Gate staff for QR scanning" scroll onRefresh={load}>
        {assigned.map((v) => (
          <View key={v.volunteerId} style={styles.card}>
            <Text style={styles.title}>{v.fullName}</Text>
            <Text style={styles.sub}>
              {v.phone} · {v.loginEmail}
            </Text>
            <Pressable onPress={() => void unassign(v.volunteerId)} disabled={busy}>
              <Text style={styles.danger}>Remove from event</Text>
            </Pressable>
          </View>
        ))}
        {assigned.length === 0 ? <Text style={styles.hint}>No volunteers on this event yet.</Text> : null}

        <View style={styles.tabs}>
          {(["existing", "new"] as const).map((m) => (
            <Pressable key={m} style={[styles.tab, mode === m && styles.tabActive]} onPress={() => setMode(m)}>
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {m === "existing" ? "Existing" : "New volunteer"}
              </Text>
            </Pressable>
          ))}
        </View>

        {mode === "existing" ? (
          <>
            {pool.length === 0 ? (
              <Text style={styles.hint}>No team volunteers yet — create one below.</Text>
            ) : (
              <>
                <Text style={styles.label}>Choose from your team</Text>
                {pool.map((v) => {
                  const onEvent = assignedIds.has(v.id);
                  return (
                    <Pressable
                      key={v.id}
                      style={[styles.pickRow, pickId === v.id && styles.pickActive, onEvent && styles.pickDisabled]}
                      disabled={onEvent}
                      onPress={() => setPickId(v.id)}
                    >
                      <Text style={styles.pickText}>
                        {v.fullName} · {v.phone}
                        {onEvent ? " (assigned)" : ""}
                      </Text>
                    </Pressable>
                  );
                })}
                {unassigned.length === 0 ? (
                  <Text style={styles.warn}>All team volunteers are already on this event.</Text>
                ) : null}
                <PrimaryButton
                  label={busy ? "Assigning…" : "Assign to event"}
                  variant="cta"
                  disabled={busy || !pickId || assignedIds.has(pickId)}
                  onPress={() => void assignExisting()}
                  style={{ marginTop: spacing.md }}
                />
              </>
            )}
          </>
        ) : (
          <>
            <TextField label="Full name" value={fullName} onChangeText={setFullName} />
            <TextField label="Phone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextField label="Login email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <TextField label="Password (min 8)" value={password} onChangeText={setPassword} secureTextEntry />
            <PrimaryButton
              label={busy ? "Creating…" : "Create & assign"}
              variant="cta"
              disabled={busy}
              onPress={() => void createAndAssign()}
            />
          </>
        )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: "800", color: colors.navy },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  danger: { color: colors.cta, fontWeight: "700", marginTop: spacing.sm },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md },
  warn: { fontSize: 12, color: "#b45309", marginBottom: spacing.sm },
  tabs: { flexDirection: "row", gap: spacing.sm, marginVertical: spacing.lg },
  tab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  tabText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  tabTextActive: { color: "#fff" },
  label: { fontWeight: "700", color: colors.navy, marginBottom: spacing.sm },
  pickRow: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
  },
  pickActive: { borderColor: colors.emerald, backgroundColor: "rgba(16,185,129,0.08)" },
  pickDisabled: { opacity: 0.5 },
  pickText: { fontSize: 14, color: colors.navy },
});
