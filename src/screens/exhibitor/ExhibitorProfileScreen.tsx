import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { PRODUCT_CATEGORIES } from "@/lib/locationOptions";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Profile = {
  companyName: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  interests: string[] | null;
  productCategories: string[] | null;
};

export function ExhibitorProfileScreen() {
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [interests, setInterests] = useState("");
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const d = await apiJson<{ profile: Profile | null }>("/exhibitor/profile");
    const p = d.profile;
    setCompanyName(p?.companyName ?? "");
    setCity(p?.city ?? "");
    setState(p?.state ?? "");
    setCountry(p?.country ?? "India");
    setInterests((p?.interests ?? []).join(", "));
    setProductCategories(p?.productCategories ?? []);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  function toggleProductCategory(value: string) {
    setProductCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  async function save() {
    setBusy(true);
    try {
      const interestList = interests
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      await apiJson("/exhibitor/profile", {
        method: "PATCH",
        body: JSON.stringify({
          companyName: companyName || null,
          city: city || null,
          state: state || null,
          country: country || null,
          interests: interestList.length ? interestList : null,
          productCategories: productCategories.length ? productCategories : null,
        }),
      });
      Alert.alert("Saved", "Company profile updated.");
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
    <ScreenShell title="Company profile" subtitle="Help organizers match you to fairs">
      <ScrollView refreshControl={refreshControl} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Company</Text>
        <View style={styles.section}>
          <Field label="Company name" value={companyName} onChange={setCompanyName} />
        </View>

        <Text style={styles.sectionLabel}>Location</Text>
        <View style={styles.section}>
          <Field label="City" value={city} onChange={setCity} />
          <Field label="State" value={state} onChange={setState} />
          <Field label="Country" value={country} onChange={setCountry} />
        </View>

        <Text style={styles.sectionLabel}>Product categories</Text>
        <View style={styles.section}>
          <Text style={styles.hint}>Product lines you showcase at trade fairs.</Text>
          <View style={styles.chipGrid}>
            {PRODUCT_CATEGORIES.map((c) => {
              const on = productCategories.includes(c.value);
              return (
                <Pressable
                  key={c.value}
                  style={[styles.chip, on && styles.chipOn]}
                  onPress={() => toggleProductCategory(c.value)}
                >
                  <Text style={[styles.chipText, on && styles.chipTextOn]}>{c.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={styles.sectionLabel}>Preferences</Text>
        <View style={styles.section}>
          <Field
            label="Interests"
            hint="Comma-separated categories"
            value={interests}
            onChange={setInterests}
            multiline
          />
        </View>

        <PrimaryButton
          label={busy ? "Saving…" : "Save profile"}
          variant="cta"
          disabled={busy}
          onPress={() => void save()}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </ScreenShell>
  );
}

function Field({
  label,
  hint,
  value,
  onChange,
  multiline,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChange}
        multiline={multiline}
        placeholderTextColor={colors.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "700", color: colors.navy, marginBottom: 4 },
  hint: { fontSize: 11, color: colors.textMuted, marginBottom: 6 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.08)",
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: colors.background,
  },
  chipOn: { borderColor: colors.emerald, backgroundColor: "#ecfdf5" },
  chipText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  chipTextOn: { color: colors.emeraldDark },
});
