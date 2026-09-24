import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, View } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

const SETTINGS_KEYS = [
  { key: "fees.platform", label: "Platform fees (JSON)" },
  { key: "fees.gst", label: "GST / tax (JSON)" },
  { key: "branding", label: "Branding (JSON)" },
  { key: "contact", label: "Contact info (JSON)" },
] as const;

export function AdminSettingsScreen() {
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const next: Record<string, string> = {};
    for (const { key } of SETTINGS_KEYS) {
      try {
        const data = await apiJson<{ setting: { value: unknown } | null }>(
          `/admin/settings/${encodeURIComponent(key)}`
        );
        next[key] = data.setting?.value != null ? JSON.stringify(data.setting.value, null, 2) : "{}";
      } catch {
        next[key] = "{}";
      }
    }
    setValues(next);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  async function saveKey(key: string) {
    setBusy(key);
    try {
      const parsed = JSON.parse(values[key] ?? "{}") as unknown;
      await apiJson(`/admin/settings/${encodeURIComponent(key)}`, {
        method: "PUT",
        body: JSON.stringify({ value: parsed }),
      });
      Alert.alert("Saved", `${key} updated.`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed — check JSON");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <ScreenShell title="Settings" subtitle="System config">
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Settings" subtitle="Key-based JSON settings">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {SETTINGS_KEYS.map(({ key, label }) => (
          <View key={key} style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>{label}</Text>
            <Text style={adminStyles.sub}>{key}</Text>
            <TextInput
              style={[adminStyles.input, { minHeight: 120, fontFamily: "monospace", fontSize: 12 }]}
              value={values[key] ?? ""}
              onChangeText={(v) => setValues((prev) => ({ ...prev, [key]: v }))}
              multiline
              textAlignVertical="top"
              autoCapitalize="none"
            />
            <PrimaryButton
              label={busy === key ? "Saving…" : "Save"}
              variant="cta"
              compact
              disabled={busy === key}
              onPress={() => void saveKey(key)}
            />
          </View>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}
