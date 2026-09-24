import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { PublicEvent } from "@/api/types";
import { fetchEvents } from "@/api/client";
import { TradeFairListCard } from "@/components/events/TradeFairListCard";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const SQM_OPTIONS = [9, 18, 27, 36, 54];
const RATE_PER_SQM = 5000;

const STEPS = [
  { icon: "search" as const, label: "Choose Exhibition" },
  { icon: "grid" as const, label: "Select Stall" },
  { icon: "card" as const, label: "Confirm & Pay" },
];

export function BookStallHubScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [sqm, setSqm] = useState(18);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const ev = await fetchEvents({ search: search.trim() || undefined });
    setEvents(ev);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    void load();
  }, [load]);

  const estimate = useMemo(() => sqm * RATE_PER_SQM, [sqm]);
  const top = events.slice(0, 6);
  const compare = events.slice(0, 2);

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        <LinearGradient
          colors={["#047857", "#065f46", "#0a1f3d"]}
          style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
        >
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.heroTitle}>Find Your Next Exhibition</Text>
          <View style={styles.steps}>
            {STEPS.map((s, i) => (
              <View key={s.label} style={styles.step}>
                <View style={styles.stepIcon}>
                  <Ionicons name={s.icon} size={16} color="#fff" />
                </View>
                <Text style={styles.stepLabel}>{s.label}</Text>
                {i < STEPS.length - 1 ? <Text style={styles.stepArrow}>→</Text> : null}
              </View>
            ))}
          </View>
          <View style={styles.searchBox}>
            <Ionicons name="search" size={17} color={colors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search exhibitions to book stall…"
              placeholderTextColor={colors.textMuted}
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => void load()}
            />
          </View>
        </LinearGradient>

        <View style={styles.body}>
          <SectionHeader title="Recommended Exhibitions" inset />
          {loading ? (
            <ActivityIndicator color={colors.emerald} style={{ marginVertical: 16 }} />
          ) : (
            top.map((ev, i) => (
              <TradeFairListCard
                key={ev.id}
                event={ev}
                colorIndex={i}
                onPress={() => router.push(`/event/${ev.id}` as never)}
                onBookStall={() => router.push(`/event/${ev.id}/book` as never)}
                onGetPass={() => router.push(`/event/${ev.id}` as never)}
              />
            ))
          )}

          <View style={styles.calcCard}>
            <Text style={styles.calcTitle}>Stall Calculator</Text>
            <Text style={styles.calcSub}>Select stall size (sqm)</Text>
            <View style={styles.sqmRow}>
              {SQM_OPTIONS.map((n) => (
                <Pressable
                  key={n}
                  style={[styles.sqmChip, sqm === n && styles.sqmChipOn]}
                  onPress={() => setSqm(n)}
                >
                  <Text style={[styles.sqmText, sqm === n && styles.sqmTextOn]}>{n}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={styles.estimateLabel}>Estimated cost</Text>
            <Text style={styles.estimate}>₹{estimate.toLocaleString("en-IN")}</Text>
            <Pressable style={styles.enquireBtn} onPress={() => router.push("/pages/contact" as never)}>
              <Text style={styles.enquireText}>Enquire Now</Text>
            </Pressable>
          </View>

          {compare.length >= 2 ? (
            <View style={styles.compareSection}>
              <SectionHeader title="Compare Exhibitions" inset />
              <View style={styles.compareRow}>
                {compare.map((ev) => (
                  <View key={ev.id} style={styles.compareCard}>
                    <Text style={styles.compareTitle} numberOfLines={2}>
                      {ev.title}
                    </Text>
                    <Text style={styles.compareMeta}>{ev.venueCity ?? ev.venueName}</Text>
                    <Text style={styles.compareStat}>
                      {ev.stallCount ? `${ev.stallCount}+ stalls` : "Stalls available"}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#f4f7f6" },
  hero: { paddingHorizontal: spacing.screen, paddingBottom: spacing.md },
  backBtn: { marginBottom: spacing.sm },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff", marginBottom: spacing.md },
  steps: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: spacing.md },
  step: { flexDirection: "row", alignItems: "center", gap: 4 },
  stepIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  stepLabel: { fontSize: 10, color: "rgba(255,255,255,0.9)", fontWeight: "600", maxWidth: 72 },
  stepArrow: { color: "rgba(255,255,255,0.5)", fontSize: 12, marginRight: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 10, color: colors.text },
  body: { paddingTop: spacing.sm },
  calcCard: {
    marginHorizontal: spacing.screen,
    marginTop: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  calcTitle: { fontSize: 16, fontWeight: "800", color: colors.navy },
  calcSub: { fontSize: 12, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  sqmRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sqmChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  sqmChipOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  sqmText: { fontSize: 13, fontWeight: "700", color: colors.navy },
  sqmTextOn: { color: "#fff" },
  estimateLabel: { fontSize: 12, color: colors.textMuted, marginTop: spacing.md },
  estimate: { fontSize: 24, fontWeight: "800", color: colors.emerald, marginTop: 4 },
  enquireBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.navy,
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: "center",
  },
  enquireText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  compareSection: { marginTop: spacing.md },
  compareRow: { flexDirection: "row", gap: spacing.sm, paddingHorizontal: spacing.screen },
  compareCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    borderWidth: 1,
    borderColor: "rgba(10,31,61,0.06)",
  },
  compareTitle: { fontSize: 13, fontWeight: "800", color: colors.navy, minHeight: 36 },
  compareMeta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  compareStat: { fontSize: 11, color: colors.emerald, fontWeight: "700", marginTop: 6 },
});
