import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ExhibitorRow = {
  exhibitorUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  bookingCount: number;
};

export function OrganizerEventEmailExhibitorsScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [eventTitle, setEventTitle] = useState("");
  const [exhibitors, setExhibitors] = useState<ExhibitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    if (!eventId) return;
    const [ev, ex] = await Promise.all([
      apiJson<{ event: { title: string } }>(`/organizer/events/${eventId}`),
      apiJson<{ exhibitors: ExhibitorRow[] }>(`/organizer/events/${eventId}/exhibitors`),
    ]);
    setEventTitle(ev.event.title);
    setExhibitors(ex.exhibitors ?? []);
    setSubject((prev) => prev || `Update from ${ev.event.title}`);
  }, [eventId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  async function sendEmail() {
    if (!body.trim()) {
      Alert.alert("Message required", "Write a message for exhibitors.");
      return;
    }
    if (!exhibitors.length) {
      Alert.alert("No exhibitors", "No stall bookers on this event yet.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiJson<{ recipientCount: number; message: string }>(
        `/organizer/events/${eventId}/communications/bulk`,
        {
          method: "POST",
          body: JSON.stringify({
            channel: "email",
            audience: "exhibitors",
            subject: subject.trim() || `Message from organizer — ${eventTitle}`,
            body: body.trim(),
          }),
        }
      );
      Alert.alert("Sent", `Email sent to ${data.recipientCount} exhibitor(s).\n${data.message}`);
      setBody("");
    } catch (e) {
      Alert.alert("Failed", e instanceof Error ? e.message : "Could not send email");
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
    <ScreenShell
      title="Email exhibitors"
      subtitle={eventTitle ? `${eventTitle} · ${exhibitors.length} recipient(s)` : "Send message by email"}
      scroll
      onRefresh={load}
    >
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={styles.infoBanner}>
          <Ionicons name="mail-outline" size={20} color={colors.emerald} />
          <Text style={styles.infoText}>
            Your message will be emailed to every exhibitor who booked a stall on this fair.
          </Text>
        </View>

        {exhibitors.length === 0 ? (
          <Text style={styles.empty}>No exhibitors have booked stalls yet.</Text>
        ) : (
          <View style={styles.list}>
            {exhibitors.map((r) => (
              <View key={r.exhibitorUserId} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rowName}>{r.name || r.companyName || "Exhibitor"}</Text>
                  <Pressable onPress={() => void Linking.openURL(`mailto:${r.email}`)}>
                    <Text style={styles.rowEmail}>{r.email}</Text>
                  </Pressable>
                  {r.phone ? (
                    <Pressable onPress={() => void Linking.openURL(`tel:${r.phone}`)}>
                      <Text style={styles.rowPhone}>{r.phone}</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles.label}>Email subject</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} placeholder="Subject line" />

        <Text style={styles.label}>Message</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          value={body}
          onChangeText={setBody}
          multiline
          placeholder="Write your message…"
          textAlignVertical="top"
        />

        <PrimaryButton
          label={busy ? "Sending…" : `Send email to ${exhibitors.length} exhibitor(s)`}
          variant="cta"
          disabled={busy || !exhibitors.length}
          onPress={() => void sendEmail()}
        />
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  infoBanner: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "flex-start",
    backgroundColor: "rgba(16,185,129,0.1)",
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },
  infoText: { flex: 1, fontSize: 13, color: colors.navy, lineHeight: 18 },
  empty: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.lg },
  list: { marginBottom: spacing.lg },
  row: {
    flexDirection: "row",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowName: { fontWeight: "700", color: colors.navy, fontSize: 14 },
  rowEmail: { marginTop: 2, fontSize: 13, color: colors.emerald, fontWeight: "600" },
  rowPhone: { marginTop: 2, fontSize: 12, color: colors.textMuted },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  textarea: { minHeight: 120 },
});
