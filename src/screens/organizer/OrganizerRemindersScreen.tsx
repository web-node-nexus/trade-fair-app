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
import { useLocalSearchParams } from "expo-router";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Reminder = {
  id: string;
  remindAt: string;
  channel: string;
  title: string;
  body: string;
  audience: string;
  status: string;
};

export function OrganizerRemindersScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [when, setWhen] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"both" | "exhibitors" | "visitors">("both");

  const load = useCallback(async () => {
    const data = await apiJson<{ reminders: Reminder[] }>(`/organizer/events/${eventId}/reminders`);
    setRows(data.reminders ?? []);
  }, [eventId]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function create() {
    const iso = new Date(when);
    if (Number.isNaN(iso.getTime())) {
      Alert.alert("Invalid date", "Use format YYYY-MM-DDTHH:mm");
      return;
    }
    if (!body.trim()) {
      Alert.alert("Required", "Message body is required.");
      return;
    }
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/reminders`, {
        method: "POST",
        body: JSON.stringify({
          remindAt: iso.toISOString(),
          body: body.trim(),
          audience,
          channel: "email",
          title: "",
        }),
      });
      setCreating(false);
      setWhen("");
      setBody("");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function cancelReminder(id: string) {
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/reminders/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "cancelled" }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteReminder(id: string) {
    Alert.alert("Delete reminder?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await apiJson(`/organizer/events/${eventId}/reminders/${id}`, { method: "DELETE" });
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
      <ScreenShell title="Schedule reminder">
        <Field label="When (YYYY-MM-DDTHH:mm)" value={when} onChange={setWhen} placeholder="2026-06-14T09:00" />
        <Text style={styles.label}>Audience</Text>
        <PickerRow value={audience} options={["both", "exhibitors", "visitors"]} onChange={setAudience} />
        <Field label="Message" value={body} onChange={setBody} multiline />
        <PrimaryButton label={busy ? "Saving…" : "Schedule"} variant="cta" disabled={busy} onPress={() => void create()} />
        <Pressable onPress={() => setCreating(false)} style={{ marginTop: spacing.md }}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Reminders" subtitle="Pre-event nudges by email">
      <Pressable style={styles.addRow} onPress={() => setCreating(true)}>
        <Text style={styles.addText}>+ Schedule reminder</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(r) => r.id}
          ListEmptyComponent={<EmptyState title="No reminders scheduled." compact />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>{new Date(item.remindAt).toLocaleString()}</Text>
              <Text style={styles.sub}>
                {item.audience} · {item.status}
              </Text>
              <Text style={styles.body}>{item.body}</Text>
              <View style={styles.actions}>
                {item.status === "scheduled" ? (
                  <Pressable onPress={() => void cancelReminder(item.id)}>
                    <Text style={styles.link}>Cancel</Text>
                  </Pressable>
                ) : null}
                <Pressable onPress={() => void deleteReminder(item.id)}>
                  <Text style={styles.danger}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

function PickerRow<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: T[];
  onChange: (v: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((o) => (
        <Pressable key={o} style={[styles.chip, value === o && styles.chipActive]} onPress={() => onChange(o)}>
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
      />
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
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  body: { fontSize: 14, color: colors.text, marginTop: 8 },
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
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.navy, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
});
