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
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ZoomableImage } from "@/context/ImageZoomContext";
import { apiJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Stall = {
  id: string;
  stallTypeId: string;
  label: string;
  gridRow: number | null;
  gridCol: number | null;
  status: string;
};

type StallType = { id: string; code: string; name: string };

function statusColor(status: string): string {
  switch (status) {
    case "available":
      return colors.emerald;
    case "held":
      return "#f59e0b";
    case "booked":
      return "#3b82f6";
    case "blocked":
      return colors.textMuted;
    default:
      return colors.border;
  }
}

export function OrganizerStallFloorScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [types, setTypes] = useState<StallType[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [stallTypeId, setStallTypeId] = useState("");
  const [stallLabel, setStallLabel] = useState("A1");
  const [gridRow, setGridRow] = useState("");
  const [gridCol, setGridCol] = useState("");
  const [showBulk, setShowBulk] = useState(false);
  const [bulkPrefix, setBulkPrefix] = useState("A");
  const [bulkFrom, setBulkFrom] = useState("1");
  const [bulkTo, setBulkTo] = useState("10");
  const [bulkGridRow, setBulkGridRow] = useState("0");
  const [bulkGridColStart, setBulkGridColStart] = useState("0");
  const [layoutMode, setLayoutMode] = useState<"grid" | "image">("grid");
  const [layoutImageUrl, setLayoutImageUrl] = useState("");
  const [stallNumberCount, setStallNumberCount] = useState("57");

  const load = useCallback(async () => {
    const [st, ss, ev] = await Promise.all([
      apiJson<{ stalls: Stall[] }>(`/organizer/events/${eventId}/stalls`),
      apiJson<{ stallTypes: StallType[] }>(`/organizer/events/${eventId}/stall-types`),
      apiJson<{
        event: {
          stallLayoutMode?: "grid" | "image";
          stallLayoutImageUrl?: string | null;
          stallNumberCount?: number | null;
        };
      }>(`/organizer/events/${eventId}`),
    ]);
    setStalls(st.stalls ?? []);
    const typeList = ss.stallTypes ?? [];
    setTypes(typeList);
    setStallTypeId((prev) => prev || typeList[0]?.id || "");
    const e = ev.event;
    setLayoutMode(e?.stallLayoutMode === "image" ? "image" : "grid");
    setLayoutImageUrl(e?.stallLayoutImageUrl ?? "");
    if (e?.stallNumberCount != null) setStallNumberCount(String(e.stallNumberCount));
  }, [eventId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => {
        setStalls([]);
        setTypes([]);
      })
      .finally(() => setLoading(false));
  }, [load]);

  async function toggleBlocked(s: Stall) {
    if (s.status === "held" || s.status === "booked") {
      Alert.alert("Cannot change", "Held or booked stalls cannot be toggled.");
      return;
    }
    const next = s.status === "blocked" ? "available" : "blocked";
    setBusy(s.id);
    try {
      await apiJson(`/organizer/events/${eventId}/stalls/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function addStall() {
    if (!stallTypeId) {
      Alert.alert("Required", "Select a stall type first.");
      return;
    }
    setBusy("add");
    try {
      const gr = gridRow.trim();
      const gc = gridCol.trim();
      await apiJson(`/organizer/events/${eventId}/stalls`, {
        method: "POST",
        body: JSON.stringify({
          stallTypeId,
          label: stallLabel.trim(),
          gridRow: gr === "" ? null : Number(gr),
          gridCol: gc === "" ? null : Number(gc),
        }),
      });
      setShowAdd(false);
      setStallLabel("A1");
      setGridRow("");
      setGridCol("");
      await load();
      Alert.alert("Done", "Stall added.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(null);
    }
  }

  async function pickLayoutImage() {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const a = pick.assets[0];
    setBusy("upload");
    try {
      const data = await uploadMultipart(
        `/organizer/events/${eventId}/stall-layout/upload`,
        {},
        { uri: a.uri, name: a.fileName ?? "stall-layout.jpg", type: a.mimeType ?? "image/jpeg" }
      );
      const url = String(data.url ?? "");
      setLayoutImageUrl(url);
      setLayoutMode("image");
      await load();
      Alert.alert("Uploaded", "Stall layout image saved.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Could not upload image");
    } finally {
      setBusy(null);
    }
  }

  async function saveImageLayout() {
    if (layoutMode === "image" && !layoutImageUrl.trim()) {
      Alert.alert("Image required", "Upload a layout image first.");
      return;
    }
    const count = Number(stallNumberCount);
    if (layoutMode === "image" && (!Number.isFinite(count) || count < 1 || count > 100)) {
      Alert.alert("Invalid count", "Enter stall count between 1 and 100.");
      return;
    }
    if (layoutMode === "image" && !stallTypeId) {
      Alert.alert("Required", "Select a stall type first.");
      return;
    }
    setBusy("layout");
    try {
      await apiJson(`/organizer/events/${eventId}/stall-layout`, {
        method: "PUT",
        body: JSON.stringify({
          mode: layoutMode,
          stallNumberCount: layoutMode === "image" ? count : undefined,
          stallTypeId: layoutMode === "image" ? stallTypeId : undefined,
        }),
      });
      await load();
      Alert.alert("Saved", layoutMode === "image" ? "Image layout saved." : "Grid layout mode saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(null);
    }
  }

  async function bulkCreate() {
    if (!stallTypeId) {
      Alert.alert("Required", "Select a stall type first.");
      return;
    }
    const from = Number(bulkFrom);
    const to = Number(bulkTo);
    const row = Number(bulkGridRow);
    const colStart = Number(bulkGridColStart);
    if (!Number.isFinite(from) || !Number.isFinite(to) || from < 1 || to < from || to - from > 499) {
      Alert.alert("Invalid range", "Enter a valid range (max 500 stalls).");
      return;
    }
    const stallsPayload = [];
    for (let i = from; i <= to; i += 1) {
      stallsPayload.push({
        stallTypeId,
        label: `${bulkPrefix.trim()}${i}`,
        gridRow: Number.isFinite(row) ? row : null,
        gridCol: Number.isFinite(colStart) ? colStart + (i - from) : null,
      });
    }
    setBusy("bulk");
    try {
      await apiJson(`/organizer/events/${eventId}/stalls/bulk`, {
        method: "POST",
        body: JSON.stringify({ stalls: stallsPayload }),
      });
      setShowBulk(false);
      await load();
      Alert.alert("Done", `${stallsPayload.length} stalls created.`);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Bulk create failed");
    } finally {
      setBusy(null);
    }
  }

  const placed = stalls.filter((s) => s.gridRow != null && s.gridCol != null);
  let maxR = 0;
  let maxC = 0;
  for (const s of placed) {
    maxR = Math.max(maxR, (s.gridRow ?? 0) + 1);
    maxC = Math.max(maxC, (s.gridCol ?? 0) + 1);
  }
  const typeCode = (id: string) => types.find((t) => t.id === id)?.code ?? "?";

  if (showBulk) {
    return (
      <ScreenShell title="Bulk add stalls">
        <Text style={styles.label}>Stall type</Text>
        <View style={styles.row}>
          {types.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.chip, stallTypeId === t.id && styles.chipActive]}
              onPress={() => setStallTypeId(t.id)}
            >
              <Text style={[styles.chipText, stallTypeId === t.id && styles.chipTextActive]}>
                {t.code} · {t.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Label prefix" value={bulkPrefix} onChange={setBulkPrefix} />
        <Field label="From number" value={bulkFrom} onChange={setBulkFrom} keyboard="number-pad" />
        <Field label="To number" value={bulkTo} onChange={setBulkTo} keyboard="number-pad" />
        <Field label="Grid row" value={bulkGridRow} onChange={setBulkGridRow} keyboard="number-pad" />
        <Field label="Grid col start" value={bulkGridColStart} onChange={setBulkGridColStart} keyboard="number-pad" />
        <PrimaryButton label={busy === "bulk" ? "Creating…" : "Create stalls"} variant="cta" disabled={busy === "bulk"} onPress={() => void bulkCreate()} />
        <Pressable onPress={() => setShowBulk(false)} style={{ marginTop: spacing.md }}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  if (showAdd) {
    return (
      <ScreenShell title="Add stall">
        <Text style={styles.label}>Stall type</Text>
        <View style={styles.row}>
          {types.map((t) => (
            <Pressable
              key={t.id}
              style={[styles.chip, stallTypeId === t.id && styles.chipActive]}
              onPress={() => setStallTypeId(t.id)}
            >
              <Text style={[styles.chipText, stallTypeId === t.id && styles.chipTextActive]}>
                {t.code} · {t.name}
              </Text>
            </Pressable>
          ))}
        </View>
        <Field label="Label" value={stallLabel} onChange={setStallLabel} />
        <Field label="Grid row (optional)" value={gridRow} onChange={setGridRow} keyboard="number-pad" />
        <Field label="Grid col (optional)" value={gridCol} onChange={setGridCol} keyboard="number-pad" />
        <PrimaryButton label={busy === "add" ? "Adding…" : "Add stall"} variant="cta" disabled={busy === "add"} onPress={() => void addStall()} />
        <Pressable onPress={() => setShowAdd(false)} style={{ marginTop: spacing.md }}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  const layoutSrc = resolveMediaUrl(layoutImageUrl);

  return (
    <ScreenShell title="Stall floor" subtitle="Grid map or upload a layout image">
      <View style={styles.layoutCard}>
        <Text style={styles.section}>Layout mode</Text>
        <View style={styles.row}>
          <Pressable
            style={[styles.chip, layoutMode === "grid" && styles.chipActive]}
            onPress={() => setLayoutMode("grid")}
          >
            <Text style={[styles.chipText, layoutMode === "grid" && styles.chipTextActive]}>Grid & columns</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, layoutMode === "image" && styles.chipActive]}
            onPress={() => setLayoutMode("image")}
          >
            <Text style={[styles.chipText, layoutMode === "image" && styles.chipTextActive]}>Layout image</Text>
          </Pressable>
        </View>

        {layoutMode === "image" ? (
          <>
            <Text style={styles.muted}>
              Upload your floor plan. Exhibitors pick a stall number (1–100) from a list; booked stalls show as disabled.
            </Text>
            <Pressable
              style={styles.uploadBtn}
              disabled={busy === "upload"}
              onPress={() => void pickLayoutImage()}
            >
              <Text style={styles.uploadBtnText}>{busy === "upload" ? "Uploading…" : "Upload layout image"}</Text>
            </Pressable>
            {layoutSrc ? (
              <ZoomableImage uri={layoutSrc} style={styles.layoutPreview} contentFit="contain" />
            ) : null}
            <Field
              label="Number of stalls (max 100)"
              value={stallNumberCount}
              onChange={setStallNumberCount}
              keyboard="number-pad"
            />
            <Text style={styles.label}>Stall type for numbered stalls</Text>
            <View style={styles.row}>
              {types.map((t) => (
                <Pressable
                  key={t.id}
                  style={[styles.chip, stallTypeId === t.id && styles.chipActive]}
                  onPress={() => setStallTypeId(t.id)}
                >
                  <Text style={[styles.chipText, stallTypeId === t.id && styles.chipTextActive]}>
                    {t.code} · {t.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </>
        ) : (
          <Text style={styles.muted}>Use row/col grid below to place stalls on the floor map.</Text>
        )}

        <PrimaryButton
          label={busy === "layout" ? "Saving…" : "Save layout setup"}
          variant="cta"
          disabled={busy === "layout"}
          onPress={() => void saveImageLayout()}
        />
      </View>

      {layoutMode === "grid" ? (
        <>
          <Pressable style={styles.addRow} onPress={() => setShowAdd(true)}>
            <Text style={styles.addText}>+ Add stall</Text>
          </Pressable>
          <Pressable style={styles.addRow} onPress={() => setShowBulk(true)}>
            <Text style={styles.addText}>+ Bulk create stalls</Text>
          </Pressable>
        </>
      ) : null}
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
          {layoutMode === "image" && layoutSrc ? (
            <View style={styles.layoutCard}>
              <Text style={styles.section}>Layout preview</Text>
              <ZoomableImage uri={layoutSrc} style={styles.layoutPreview} contentFit="contain" />
            </View>
          ) : null}

          {layoutMode === "grid" && placed.length > 0 && maxR > 0 && maxC > 0 ? (
            <View style={styles.grid}>
              {Array.from({ length: maxR }, (_, r) => (
                <View key={r} style={styles.gridRow}>
                  {Array.from({ length: maxC }, (_, c) => {
                    const s = placed.find((x) => x.gridRow === r && x.gridCol === c);
                    if (!s) {
                      return <View key={c} style={styles.cellEmpty} />;
                    }
                    return (
                      <Pressable
                        key={c}
                        style={[styles.cell, { borderColor: statusColor(s.status), opacity: busy === s.id ? 0.5 : 1 }]}
                        disabled={busy === s.id}
                        onPress={() => void toggleBlocked(s)}
                      >
                        <Text style={styles.cellLabel}>{s.label}</Text>
                        <Text style={styles.cellSub}>{typeCode(s.stallTypeId)}</Text>
                        <Text style={[styles.cellStatus, { color: statusColor(s.status) }]}>{s.status}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          ) : layoutMode === "grid" ? (
            <Text style={styles.muted}>No stalls on grid yet. Add stalls with row/col coordinates.</Text>
          ) : null}

          <Text style={styles.section}>All stalls</Text>
          {stalls.map((s) => (
            <View key={s.id} style={styles.card}>
              <Text style={styles.cardTitle}>
                {s.label} · {typeCode(s.stallTypeId)}
              </Text>
              <Text style={styles.muted}>
                {s.status}
                {s.gridRow != null && s.gridCol != null ? ` · R${s.gridRow}C${s.gridCol}` : " · unplaced"}
              </Text>
              {s.status === "available" || s.status === "blocked" ? (
                <Pressable onPress={() => void toggleBlocked(s)} style={{ marginTop: 8 }}>
                  <Text style={styles.link}>{s.status === "blocked" ? "Unblock" : "Block"}</Text>
                </Pressable>
              ) : null}
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "default" | "number-pad";
}) {
  return (
    <View style={{ marginBottom: spacing.md }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  layoutCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  layoutPreview: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
    backgroundColor: colors.background,
  },
  uploadBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
  },
  uploadBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  addRow: { marginBottom: spacing.md },
  addText: { color: colors.cta, fontWeight: "800" },
  muted: { fontSize: 13, color: colors.textMuted },
  section: { fontSize: 15, fontWeight: "800", color: colors.navy, marginTop: spacing.xl, marginBottom: spacing.sm },
  grid: { gap: 4 },
  gridRow: { flexDirection: "row", gap: 4 },
  cellEmpty: { flex: 1, minHeight: 56, backgroundColor: colors.background, borderRadius: 8 },
  cell: {
    flex: 1,
    minHeight: 56,
    borderWidth: 2,
    borderRadius: 8,
    padding: 6,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  cellLabel: { fontSize: 11, fontWeight: "800", color: colors.navy },
  cellSub: { fontSize: 9, color: colors.textMuted },
  cellStatus: { fontSize: 9, fontWeight: "700", textTransform: "uppercase" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: "800", color: colors.navy },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
  },
  link: { color: colors.emerald, fontWeight: "700" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 12, fontWeight: "700", color: colors.navy },
  chipTextActive: { color: "#fff" },
});
