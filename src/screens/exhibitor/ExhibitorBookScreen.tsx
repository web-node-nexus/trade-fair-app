import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { EventPickerCarousel } from "@/components/exhibitor/EventPickerCarousel";
import { StallMapReadOnly } from "@/components/exhibitor/StallMapReadOnly";
import { StallNumberPicker } from "@/components/exhibitor/StallNumberPicker";
import { DashboardSectionLabel } from "@/components/dashboard/DashboardSectionLabel";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { WorkspaceFooter } from "@/components/workspace/WorkspaceFooter";
import { apiJson } from "@/lib/authFetch";
import { isImageStallLayout } from "@/lib/stallLayout";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { cardShadowSoft } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Ev = {
  id: string;
  title: string;
  venueName: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
};
type Stall = {
  id: string;
  label: string;
  status: string;
  stallTypeId: string;
  gridRow: number | null;
  gridCol: number | null;
};
type StallType = { id: string; code: string; name: string };
type CatalogEvent = {
  stallBookingEnabled?: boolean;
  stallLayoutMode?: "grid" | "image";
  stallLayoutImageUrl?: string | null;
  stallNumberCount?: number | null;
};

export function ExhibitorBookScreen() {
  const params = useLocalSearchParams<{ eventId?: string }>();
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [eventId, setEventId] = useState(params.eventId ?? "");
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [stallTypes, setStallTypes] = useState<StallType[]>([]);
  const [catalogEvent, setCatalogEvent] = useState<CatalogEvent | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [held, setHeld] = useState<Set<string>>(new Set());
  const [showMap, setShowMap] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadEvents = useCallback(async () => {
    const d = await apiJson<{ events: Ev[] }>("/exhibitor/events");
    const list = d.events ?? [];
    setEvents(list);
    setEventId((prev) => prev || list[0]?.id || "");
  }, []);

  useEffect(() => {
    void loadEvents().finally(() => setLoading(false));
  }, [loadEvents]);

  const loadStalls = useCallback(async () => {
    if (!eventId) return;
    const data = await apiJson<{
      stalls: Stall[];
      stallTypes: StallType[];
      event: CatalogEvent;
    }>(`/exhibitor/events/${eventId}/catalog`);
    if (data.event?.stallBookingEnabled === false) {
      setStalls([]);
      setCatalogEvent(data.event);
      Alert.alert("Stall booking off", "This event does not accept online stall bookings.");
      return;
    }
    setCatalogEvent(data.event ?? null);
    setStalls(data.stalls ?? []);
    setStallTypes(data.stallTypes ?? []);
    setSelected(new Set());
  }, [eventId]);

  useEffect(() => {
    if (eventId) void loadStalls().catch(() => setStalls([]));
  }, [eventId, loadStalls]);

  const available = useMemo(
    () => stalls.filter((s) => s.status === "available" || held.has(s.id)),
    [stalls, held]
  );

  const eventItems = useMemo(
    () =>
      events.map((e, index) => ({
        id: e.id,
        title: e.title,
        subtitle: e.venueName,
        imageUrl: resolveMediaUrl(e.coverImageUrl ?? e.imageUrls?.[0] ?? null),
        colorIndex: index,
      })),
    [events]
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  async function holdStall(stallId: string) {
    setBusy(true);
    try {
      await apiJson(`/exhibitor/stalls/${stallId}/hold`, { method: "POST" });
      setHeld((prev) => new Set(prev).add(stallId));
      setSelected((prev) => new Set(prev).add(stallId));
      await loadStalls();
      Alert.alert("Held", "Stall held for 10 minutes.");
    } catch (e) {
      Alert.alert("Hold failed", e instanceof Error ? e.message : "Stall unavailable");
    } finally {
      setBusy(false);
    }
  }

  async function book() {
    if (!eventId || selected.size === 0) {
      Alert.alert("Select stalls", "Pick an event and at least one available stall.");
      return;
    }
    setBusy(true);
    try {
      const data = await apiJson<{
        bookingId: string;
        payNowMinor: string;
        razorpayOrderId: string | null;
        awaitsOrganizerApproval?: boolean;
      }>(`/exhibitor/events/${eventId}/bookings`, {
        method: "POST",
        body: JSON.stringify({ stallIds: Array.from(selected) }),
      });

      if (data.awaitsOrganizerApproval) {
        Alert.alert("Submitted", "Organizer must approve before payment.", [
          { text: "My bookings", onPress: () => router.push("/dashboard/exhibitor/bookings") },
        ]);
        await loadStalls();
        return;
      }

      if (!data.razorpayOrderId || Number(data.payNowMinor) === 0) {
        Alert.alert("Confirmed", "Booking confirmed.", [
          { text: "My bookings", onPress: () => router.push("/dashboard/exhibitor/bookings") },
        ]);
        await loadStalls();
        return;
      }

      router.push({
        pathname: "/dashboard/exhibitor/checkout",
        params: { bookingId: data.bookingId },
      } as never);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Booking failed");
    } finally {
      setBusy(false);
    }
  }

  const imageLayout = isImageStallLayout(catalogEvent) && Boolean(catalogEvent?.stallLayoutImageUrl);

  function selectStallId(id: string) {
    setSelected(id ? new Set([id]) : new Set());
  }

  const listHeader = (
    <View style={styles.headerBlock}>
      <DashboardSectionLabel label="Select event" />
      <EventPickerCarousel
        events={eventItems}
        selectedId={eventId}
        onSelect={setEventId}
        emptyLabel="No fairs open for booking"
      />

      {eventId && imageLayout && catalogEvent?.stallLayoutImageUrl ? (
        <View style={styles.mapWrap}>
          <StallNumberPicker
            imageUrl={catalogEvent.stallLayoutImageUrl}
            stalls={stalls}
            selectedId={selected.size === 1 ? Array.from(selected)[0] : ""}
            onSelect={selectStallId}
          />
        </View>
      ) : null}

      {eventId && !imageLayout ? (
        <Pressable onPress={() => setShowMap((v) => !v)} style={styles.mapToggle}>
          <View style={styles.mapToggleIcon}>
            <Ionicons name="map-outline" size={16} color={colors.emerald} />
          </View>
          <Text style={styles.mapToggleText}>{showMap ? "Hide floor map" : "Show floor map"}</Text>
          <Ionicons name={showMap ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
        </Pressable>
      ) : null}

      {showMap && eventId && !imageLayout ? (
        <View style={styles.mapWrap}>
          <StallMapReadOnly stalls={stalls} stallTypes={stallTypes} />
        </View>
      ) : null}

      <DashboardSectionLabel
        label={imageLayout ? "Selected stall" : "Available stalls"}
        count={selected.size}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.emerald} size="large" />
      </View>
    );
  }

  if (imageLayout) {
    return (
      <ScreenShell title="Book stalls" subtitle="Pick your stall number from the layout map">
        <View style={styles.root}>
          <RefreshableFlatList
            style={styles.list}
            contentContainerStyle={styles.listContent}
            onRefresh={() => void loadStalls()}
            data={[]}
            keyExtractor={() => "empty"}
            ListHeaderComponent={listHeader}
            renderItem={() => null}
          />
          <WorkspaceFooter>
            <PrimaryButton
              label={
                busy
                  ? "Booking…"
                  : selected.size > 0
                    ? "Book selected stall"
                    : "Select a stall number to continue"
              }
              variant="emerald"
              disabled={busy || selected.size === 0}
              onPress={() => void book()}
            />
          </WorkspaceFooter>
        </View>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Book stalls" subtitle="Hold & select stalls">
      <View style={styles.root}>
        <RefreshableFlatList
          style={styles.list}
          contentContainerStyle={styles.listContent}
          onRefresh={() => void loadStalls()}
          data={available}
          keyExtractor={(s) => s.id}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={
            <EmptyState
              icon={eventId ? "grid-outline" : "calendar-outline"}
              title={eventId ? "No stalls available" : "Pick an event first"}
              message={
                eventId
                  ? "All stalls may be booked or holds expired. Pull to refresh."
                  : "Choose a fair from the cards above to see available stalls."
              }
              compact
            />
          }
          renderItem={({ item }) => {
            const on = selected.has(item.id);
            const isHeld = held.has(item.id);
            return (
              <Pressable
                style={[styles.stallRow, on && styles.stallRowOn]}
                onPress={() => toggle(item.id)}
              >
                <View style={[styles.stallIcon, on && styles.stallIconOn]}>
                  <Ionicons name="grid-outline" size={18} color={on ? colors.emeraldDark : colors.textMuted} />
                </View>
                <View style={styles.stallBody}>
                  <Text style={styles.stallLabel}>{item.label}</Text>
                  <View style={styles.stallMeta}>
                    <StatusBadge label={on ? "selected" : item.status} />
                    {isHeld ? <Text style={styles.heldTag}>Held</Text> : null}
                  </View>
                </View>
                {!isHeld && item.status === "available" ? (
                  <Pressable style={styles.holdBtn} onPress={() => void holdStall(item.id)}>
                    <Text style={styles.holdBtnText}>Hold</Text>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          }}
        />

        <WorkspaceFooter>
          <PrimaryButton
            label={
              busy
                ? "Booking…"
                : selected.size > 0
                  ? `Continue · ${selected.size} stall${selected.size > 1 ? "s" : ""}`
                  : "Select stalls to continue"
            }
            variant="emerald"
            disabled={busy || selected.size === 0}
            onPress={() => void book()}
          />
        </WorkspaceFooter>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  list: { flex: 1 },
  listContent: { paddingBottom: spacing.md },
  headerBlock: { marginBottom: spacing.sm },
  mapToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
  },
  mapToggleIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mapToggleText: { flex: 1, color: colors.navy, fontWeight: "700", fontSize: 14 },
  mapWrap: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...cardShadowSoft,
  },
  stallRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    ...cardShadowSoft,
  },
  stallRowOn: { borderColor: colors.emerald, backgroundColor: "rgba(16,185,129,0.06)" },
  stallIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  stallIconOn: { backgroundColor: "rgba(16,185,129,0.14)" },
  stallBody: { flex: 1, minWidth: 0 },
  stallLabel: { fontWeight: "800", color: colors.navy, fontSize: 15 },
  stallMeta: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: 6 },
  heldTag: { fontSize: 11, fontWeight: "700", color: colors.emeraldDark },
  holdBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
  },
  holdBtnText: { color: "#fff", fontSize: 11, fontWeight: "800" },
});
