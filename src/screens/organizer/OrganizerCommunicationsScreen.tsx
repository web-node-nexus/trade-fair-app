import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type CommLog = {
  id: string;
  channel: string;
  audience: string;
  body: string;
  recipientCount: number;
  createdAt: string;
};

export function OrganizerCommunicationsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [logs, setLogs] = useState<CommLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [channel, setChannel] = useState<"email" | "whatsapp" | "in_app">("in_app");
  const [audience, setAudience] = useState<"both" | "exhibitors" | "visitors">("both");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [lastResult, setLastResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiJson<{ communications: CommLog[] }>(`/organizer/events/${eventId}/communications/log`);
    setLogs(data.communications ?? []);
  }, [eventId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function sendBulk() {
    if (!body.trim()) return;
    setBusy(true);
    setLastResult(null);
    try {
      const data = await apiJson<{ recipientCount: number; message: string }>(
        `/organizer/events/${eventId}/communications/bulk`,
        {
          method: "POST",
          body: JSON.stringify({
            channel,
            audience,
            subject: subject.trim() || undefined,
            body: body.trim(),
          }),
        }
      );
      setLastResult(`Queued for ${data.recipientCount} recipients. ${data.message}`);
      setBody("");
      setSubject("");
      await load();
    } catch (e) {
      setLastResult(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell title="Bulk communications" subtitle="Email, WhatsApp or in-app outreach">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <Text style={styles.hint}>Sends are logged with recipient counts.</Text>
        <Text style={styles.label}>Channel</Text>
        <PickerRow value={channel} options={["in_app", "email", "whatsapp"]} onChange={setChannel} />
        <Text style={styles.label}>Audience</Text>
        <PickerRow value={audience} options={["both", "exhibitors", "visitors"]} onChange={setAudience} />
        <Text style={styles.label}>Subject (email)</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Optional" />
        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, { minHeight: 100, textAlignVertical: "top" }]}
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Your message…"
        />
        <PrimaryButton label={busy ? "Sending…" : "Send bulk message"} variant="cta" disabled={busy} onPress={() => void sendBulk()} />
        {lastResult ? <Text style={styles.result}>{lastResult}</Text> : null}

        <Text style={styles.section}>Recent log</Text>
        {loading ? (
          <ActivityIndicator color={colors.cta} />
        ) : logs.length === 0 ? (
          <Text style={styles.hint}>No outreach logged yet.</Text>
        ) : (
          logs.map((l) => (
            <View key={l.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {new Date(l.createdAt).toLocaleString()} · {l.channel} · {l.audience} · {l.recipientCount} recipients
              </Text>
              <Text style={styles.cardBody} numberOfLines={4}>
                {l.body}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
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
          <Text style={[styles.chipText, value === o && styles.chipTextActive]}>{o.replace("_", " ")}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  result: { marginTop: spacing.sm, fontSize: 13, color: colors.emeraldDark },
  section: { fontSize: 15, fontWeight: "800", color: colors.navy, marginTop: spacing.xl, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 12, fontWeight: "700", color: colors.navy },
  cardBody: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
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
