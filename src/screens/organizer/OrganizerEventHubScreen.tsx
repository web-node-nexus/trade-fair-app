import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { OrganizerEventPageQr } from "@/components/organizer/OrganizerEventPageQr";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

const ACTIONS = [
  { label: "Email exhibitors", icon: "mail-outline" as const, section: "email-exhibitors", highlight: true },
  { label: "Gate scan", icon: "scan-outline" as const, route: "scan" },
  { label: "Stall bookings", icon: "bookmark-outline" as const, section: "bookings" },
  { label: "Ticket types", icon: "ticket-outline" as const, section: "ticket-types" },
  { label: "Tickets sold", icon: "receipt-outline" as const, section: "sold-tickets" },
  { label: "Stall floor", icon: "grid-outline" as const, section: "stalls" },
  { label: "Stall types", icon: "layers-outline" as const, section: "stall-types" },
  { label: "Event media", icon: "images-outline" as const, section: "media" },
  { label: "Reminders", icon: "alarm-outline" as const, section: "reminders" },
  { label: "Entry scans", icon: "list-outline" as const, section: "entry-scans" },
  { label: "Communications", icon: "mail-outline" as const, section: "communications" },
  { label: "Reports", icon: "bar-chart-outline" as const, section: "reports" },
  { label: "Announcements", icon: "megaphone-outline" as const, section: "announcements" },
  { label: "Volunteers", icon: "people-outline" as const, section: "volunteers" },
  { label: "Edit event", icon: "create-outline" as const, route: "edit" },
];

export function OrganizerEventHubScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const [title, setTitle] = useState("Event");
  const [status, setStatus] = useState("");
  const [adminDisabled, setAdminDisabled] = useState(false);
  const [adminDisabledReason, setAdminDisabledReason] = useState<string | null>(null);
  const [summary, setSummary] = useState<{ stallBookingsTotal?: number; ticketsSoldTotal?: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    if (!eventId) return;
    const [ev, rep] = await Promise.all([
      apiJson<{
        event: { title: string; status: string; adminDisabled?: boolean; adminDisabledReason?: string | null };
      }>(`/organizer/events/${eventId}`),
      apiJson<{ summary: { stallBookingsTotal?: number; ticketsSoldTotal?: number } }>(
        `/organizer/events/${eventId}/reports/summary`
      ).catch(() => ({ summary: {} })),
    ]);
    setTitle(ev.event.title);
    setStatus(ev.event.status);
    setAdminDisabled(ev.event.adminDisabled === true);
    setAdminDisabledReason(ev.event.adminDisabledReason ?? null);
    setSummary(rep.summary);
  }, [eventId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function publishEvent() {
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/publish`, { method: "POST" });
      setStatus("published");
      Alert.alert("Published", "Event is now live.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteEvent() {
    Alert.alert(
      "Delete event?",
      "Delete this event and all related stalls, tickets, bookings, and scans? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              setBusy(true);
              try {
                await apiJson(`/organizer/events/${eventId}`, { method: "DELETE" });
                router.replace("/dashboard/organizer/events" as never);
              } catch (e) {
                Alert.alert("Error", e instanceof Error ? e.message : "Failed");
              } finally {
                setBusy(false);
              }
            })();
          },
        },
      ]
    );
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
      title={title}
      subtitle={
        adminDisabled
          ? `ID · ${eventId} · Disabled by admin`
          : `ID · ${eventId} · Status: ${status}`
      }
    >
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {adminDisabled ? (
          <View style={styles.adminDisabledBanner}>
            <Text style={styles.adminDisabledTitle}>Disabled by admin</Text>
            <Text style={styles.adminDisabledBody}>
              This fair is hidden from the website and app.
              {adminDisabledReason ? ` Reason: ${adminDisabledReason}` : ""}
            </Text>
          </View>
        ) : null}
        {status === "published" && eventId ? (
          <OrganizerEventPageQr eventId={eventId} eventTitle={title} />
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{summary?.stallBookingsTotal ?? 0}</Text>
            <Text style={styles.statLabel}>Stall bookings</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statVal}>{summary?.ticketsSoldTotal ?? 0}</Text>
            <Text style={styles.statLabel}>Tickets sold</Text>
          </View>
        </View>

        <View style={styles.actionBtns}>
          {status !== "published" ? (
            <PrimaryButton
              label={busy ? "Publishing…" : "Publish event"}
              variant="cta"
              compact
              disabled={busy}
              onPress={() => void publishEvent()}
              style={{ flex: 1 }}
            />
          ) : null}
          <PrimaryButton
            label="Delete event"
            variant="outline"
            compact
            disabled={busy}
            onPress={() => void deleteEvent()}
            style={{ flex: 1 }}
          />
        </View>

        <PrimaryButton
          label="Email exhibitors"
          variant="cta"
          onPress={() => router.push(`/dashboard/organizer/events/${eventId}/email-exhibitors` as never)}
          style={{ marginBottom: spacing.lg }}
        />

        <Text style={styles.section}>Manage</Text>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            style={[styles.actionRow, "highlight" in a && a.highlight ? styles.actionRowHighlight : null]}
            onPress={() => {
              if (a.route === "scan") router.push(`/dashboard/organizer/events/${eventId}/scan` as never);
              else if (a.route === "edit") router.push(`/dashboard/organizer/events/${eventId}/edit` as never);
              else router.push(`/dashboard/organizer/events/${eventId}/${a.section}` as never);
            }}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon} size={20} color={colors.emerald} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </Pressable>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  statsRow: { flexDirection: "row", gap: spacing.md, marginBottom: spacing.md },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
  },
  statVal: { fontSize: 24, fontWeight: "800", color: colors.cta },
  statLabel: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  actionBtns: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.lg },
  section: { fontSize: 16, fontWeight: "800", color: colors.navy, marginBottom: spacing.sm },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionRowHighlight: {
    borderColor: colors.emerald,
    backgroundColor: "rgba(16,185,129,0.06)",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: "700", color: colors.navy },
  adminDisabledBanner: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  adminDisabledTitle: { fontSize: 14, fontWeight: "800", color: "#991b1b" },
  adminDisabledBody: { marginTop: 4, fontSize: 12, color: "#7f1d1d", lineHeight: 18 },
});
