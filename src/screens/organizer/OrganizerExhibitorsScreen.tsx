import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { PRODUCT_CATEGORIES, productCategoryLabel } from "@/lib/locationOptions";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ExhibitorRow = {
  exhibitorUserId: string;
  name: string | null;
  email: string;
  phone: string | null;
  companyName: string | null;
  businessCategory?: string | null;
  productCategories?: string[];
  designation?: string | null;
  gstNumber?: string | null;
  city?: string | null;
  state?: string | null;
  eventTitles: string;
  bookingStatuses?: string;
  bookingCount: number;
};

function locationKey(r: ExhibitorRow) {
  return [r.city?.trim(), r.state?.trim()].filter(Boolean).join(", ");
}

export function OrganizerExhibitorsScreen() {
  const [rows, setRows] = useState<ExhibitorRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setErr(null);
    const data = await apiJson<{ exhibitors: ExhibitorRow[] }>("/organizer/exhibitors");
    setRows(data.exhibitors ?? []);
    setSelectedIds(new Set());
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Load failed"))
      .finally(() => setLoading(false));
  }, [load]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      const key = locationKey(r);
      if (key) set.add(key);
    }
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [rows]);

  const categoryOptions = useMemo(() => {
    const present = new Set<string>();
    for (const r of rows) {
      for (const c of r.productCategories ?? []) present.add(c);
    }
    return PRODUCT_CATEGORIES.filter((c) => present.has(c.value));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      if (categoryFilter && !(r.productCategories ?? []).includes(categoryFilter)) return false;
      if (locationFilter && locationKey(r) !== locationFilter) return false;
      return true;
    });
  }, [rows, categoryFilter, locationFilter]);

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((r) => selectedIds.has(r.exhibitorUserId));

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAllFiltered() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const r of filteredRows) next.delete(r.exhibitorUserId);
      } else {
        for (const r of filteredRows) next.add(r.exhibitorUserId);
      }
      return next;
    });
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
      title="Exhibitors"
      subtitle="Filter by category or city/state. Select exhibitors for outreach from an event hub."
      scroll
      onRefresh={load}
    >
      {err ? <Text style={styles.err}>{err}</Text> : null}

      <View style={styles.filters}>
        <Text style={styles.filterLabel}>Product category</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, !categoryFilter && styles.chipActive]}
            onPress={() => setCategoryFilter("")}
          >
            <Text style={[styles.chipText, !categoryFilter && styles.chipTextActive]}>All</Text>
          </Pressable>
          {categoryOptions.map((c) => (
            <Pressable
              key={c.value}
              style={[styles.chip, categoryFilter === c.value && styles.chipActive]}
              onPress={() => setCategoryFilter(c.value)}
            >
              <Text style={[styles.chipText, categoryFilter === c.value && styles.chipTextActive]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={[styles.filterLabel, { marginTop: spacing.sm }]}>City / state</Text>
        <View style={styles.chipRow}>
          <Pressable
            style={[styles.chip, !locationFilter && styles.chipActive]}
            onPress={() => setLocationFilter("")}
          >
            <Text style={[styles.chipText, !locationFilter && styles.chipTextActive]}>All</Text>
          </Pressable>
          {locationOptions.map((loc) => (
            <Pressable
              key={loc}
              style={[styles.chip, locationFilter === loc && styles.chipActive]}
              onPress={() => setLocationFilter(loc)}
            >
              <Text style={[styles.chipText, locationFilter === loc && styles.chipTextActive]}>
                {loc}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {filteredRows.length > 0 ? (
        <Pressable style={styles.selectAll} onPress={toggleAllFiltered}>
          <Ionicons
            name={allFilteredSelected ? "checkbox" : "square-outline"}
            size={22}
            color={colors.emerald}
          />
          <Text style={styles.selectAllText}>
            {allFilteredSelected ? "Deselect all" : "Select all"} ({filteredRows.length})
            {selectedIds.size > 0 ? ` · ${selectedIds.size} selected` : ""}
          </Text>
        </Pressable>
      ) : null}

      {filteredRows.length === 0 ? (
        <EmptyState
          title={rows.length ? "No matches" : "No exhibitors yet"}
          message={
            rows.length
              ? "Try a different category or city/state filter."
              : "Users with the exhibitor role will appear here."
          }
        />
      ) : (
        filteredRows.map((r) => {
          const location = locationKey(r);
          const cats = (r.productCategories ?? []).map(productCategoryLabel).join(", ");
          const checked = selectedIds.has(r.exhibitorUserId);
          return (
            <Pressable
              key={r.exhibitorUserId}
              style={[styles.card, checked && styles.cardSelected]}
              onPress={() => toggleOne(r.exhibitorUserId)}
            >
              <View style={styles.cardTop}>
                <Ionicons
                  name={checked ? "checkbox" : "square-outline"}
                  size={22}
                  color={colors.emerald}
                />
                <View style={styles.cardBody}>
                  <Text style={styles.name}>{r.name || "Unnamed exhibitor"}</Text>
                  {r.companyName ? <Text style={styles.company}>{r.companyName}</Text> : null}
                  {location ? <Text style={styles.detail}>Location: {location}</Text> : null}
                  {cats ? <Text style={styles.detail}>Categories: {cats}</Text> : null}
                  {r.designation ? <Text style={styles.detail}>Designation: {r.designation}</Text> : null}
                  {r.gstNumber ? <Text style={styles.detail}>GST: {r.gstNumber}</Text> : null}
                  <Text style={styles.meta} numberOfLines={2}>
                    {r.bookingCount > 0
                      ? `${r.eventTitles || "Your fairs"} · ${r.bookingCount} booking${r.bookingCount === 1 ? "" : "s"}`
                      : "No bookings on your fairs yet"}
                    {r.bookingStatuses ? ` · ${r.bookingStatuses.replace(/_/g, " ")}` : ""}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={(e) => {
                    e.stopPropagation?.();
                    void Linking.openURL(`mailto:${r.email}`);
                  }}
                >
                  <Ionicons name="mail-outline" size={16} color={colors.emerald} />
                  <Text style={styles.actionText} numberOfLines={1}>
                    {r.email}
                  </Text>
                </Pressable>
                {r.phone ? (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void Linking.openURL(`tel:${r.phone}`);
                    }}
                  >
                    <Ionicons name="call-outline" size={16} color={colors.emerald} />
                    <Text style={styles.actionText}>{r.phone}</Text>
                  </Pressable>
                ) : (
                  <Text style={styles.noPhone}>No phone on file</Text>
                )}
              </View>
            </Pressable>
          );
        })
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: "#dc2626", marginBottom: spacing.md, fontSize: 13 },
  filters: { marginBottom: spacing.md },
  filterLabel: { fontSize: 12, fontWeight: "600", color: colors.textMuted, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 12, color: colors.navy, fontWeight: "500" },
  chipTextActive: { color: "#fff" },
  selectAll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  selectAllText: { fontSize: 13, fontWeight: "600", color: colors.navy },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.emerald, backgroundColor: "#ecfdf5" },
  cardTop: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  cardBody: { flex: 1 },
  name: { fontSize: 16, fontWeight: "700", color: colors.navy },
  company: { marginTop: 2, fontSize: 13, color: colors.textMuted },
  detail: { marginTop: 4, fontSize: 12, color: colors.textMuted },
  meta: { marginTop: 6, fontSize: 12, color: colors.textMuted, lineHeight: 17 },
  actions: { marginTop: spacing.sm, gap: spacing.xs, paddingLeft: 32 },
  actionBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  actionText: { flex: 1, fontSize: 13, color: colors.emerald, fontWeight: "600" },
  noPhone: { fontSize: 12, color: colors.textMuted, fontStyle: "italic" },
});
