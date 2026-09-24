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
import { extractList } from "@/lib/extractList";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Section = "announcements" | "stall-types";

export function OrganizerEventManageScreen({ section }: { section: Section }) {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [price, setPrice] = useState("");
  const listPath = section === "announcements" ? "announcements" : "stall-types";

  const screenTitle = section === "announcements" ? "Announcements" : "Stall types";

  const load = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>(`/organizer/events/${eventId}/${listPath}`);
    setRows(extractList(data));
  }, [eventId, listPath]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function create() {
    setBusy(true);
    try {
      if (section === "announcements") {
        if (!body.trim()) {
          Alert.alert("Required", "Announcement body is required.");
          return;
        }
        await apiJson(`/organizer/events/${eventId}/announcements`, {
          method: "POST",
          body: JSON.stringify({ title: title.trim(), body: body.trim(), audience: "both" }),
        });
      } else {
        if (!name.trim() || !code.trim()) {
          Alert.alert("Required", "Name and code are required.");
          return;
        }
        const minor = Math.round(Number(price) * 100);
        if (!Number.isFinite(minor) || minor < 0) {
          Alert.alert("Invalid price", "Enter price in INR.");
          return;
        }
        await apiJson(`/organizer/events/${eventId}/stall-types`, {
          method: "POST",
          body: JSON.stringify({
            name: name.trim(),
            code: code.trim().toUpperCase(),
            priceMinor: minor,
            currency: "INR",
          }),
        });
      }
      setTitle("");
      setBody("");
      setName("");
      setCode("");
      setPrice("");
      setCreating(false);
      await load();
      Alert.alert("Done", "Saved successfully.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (creating) {
    return (
      <ScreenShell title={`Add ${screenTitle.slice(0, -1)}`}>
        {section === "announcements" ? (
          <>
            <Field label="Title (optional)" value={title} onChange={setTitle} />
            <Field label="Message" value={body} onChange={setBody} multiline />
          </>
        ) : null}
        {section === "stall-types" ? (
          <>
            <Field label="Name" value={name} onChange={setName} placeholder="Standard 3x3" />
            <Field label="Code" value={code} onChange={setCode} placeholder="STD" autoCapitalize="characters" />
            <Field label="Price (INR)" value={price} onChange={setPrice} keyboard="decimal-pad" />
          </>
        ) : null}
        <PrimaryButton label={busy ? "Saving…" : "Save"} variant="cta" disabled={busy} onPress={() => void create()} />
        <Pressable onPress={() => setCreating(false)} style={{ marginTop: spacing.md }}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={screenTitle}>
      <Pressable style={styles.addRow} onPress={() => setCreating(true)}>
        <Text style={styles.addText}>+ Add</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(r, i) => String(r.id ?? i)}
          ListEmptyComponent={<EmptyState title="Nothing here yet." compact />}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                {String(
                  item.title ?? item.name ?? item.email ?? item.label ?? item.id ?? "—"
                )}
              </Text>
              <Text style={styles.cardSub}>
                {String(item.body ?? item.status ?? item.priceMinor ?? item.docType ?? "")}
              </Text>
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
  placeholder,
  multiline,
  keyboard,
  autoCapitalize,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboard?: "default" | "decimal-pad";
  autoCapitalize?: "none" | "characters" | "sentences";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && { minHeight: 90, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        multiline={multiline}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize ?? "sentences"}
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
  cardTitle: { fontWeight: "800", color: colors.navy },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  link: { color: colors.emerald, fontWeight: "700" },
});
