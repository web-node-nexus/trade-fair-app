import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Profile = {
  companyName: string | null;
  tagline: string | null;
  city: string | null;
  state: string | null;
};

export function ProviderProfileScreen() {
  const [companyName, setCompanyName] = useState("");
  const [tagline, setTagline] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await apiJson<{ profile: Profile | null }>("/provider/profile");
    const p = d.profile;
    setCompanyName(p?.companyName ?? "");
    setTagline(p?.tagline ?? "");
    setCity(p?.city ?? "");
    setState(p?.state ?? "");
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function save() {
    if (!companyName.trim()) {
      Alert.alert("Required", "Company name is required.");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/provider/profile", {
        method: "PUT",
        body: JSON.stringify({
          companyName: companyName.trim(),
          tagline: tagline.trim() || null,
          city: city.trim() || null,
          state: state.trim() || null,
        }),
      });
      Alert.alert("Saved", "Provider profile updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  return (
    <ScreenShell title="Business profile" subtitle="Shown on marketplace listings">
      <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        <View style={styles.formCard}>
          <SectionHeader title="Company details" />
          <Field label="Company name" value={companyName} onChange={setCompanyName} />
          <Field label="Tagline" value={tagline} onChange={setTagline} placeholder="Short pitch for your business" />
        </View>
        <View style={styles.formCard}>
          <SectionHeader title="Location" />
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State" value={state} onChange={setState} />
        </View>
        <PrimaryButton label={busy ? "Saving…" : "Save profile"} variant="cta" disabled={busy} onPress={() => void save()} />
      </ScrollView>
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.navy,
  },
});
