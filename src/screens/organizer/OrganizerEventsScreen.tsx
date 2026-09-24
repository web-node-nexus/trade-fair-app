import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { apiJson } from "@/lib/authFetch";
import { withSubscriptionReturnTo, ORGANIZER_SUBSCRIPTION_PATH } from "@/lib/subscriptionReturn";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Ev = {
  id: string;
  title: string;
  status: string;
  venueName: string;
  startsAt: string;
  endsAt: string;
  adminDisabled?: boolean;
  adminDisabledReason?: string | null;
};

export function OrganizerEventsScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const { profile } = useAuth();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const kycLocked = profile?.roles.includes("ORGANIZER") && profile.organizerKycApproved !== true;
  const sub = profile?.subscriptionByRole?.ORGANIZER;
  const freePlanOnly = sub?.active && !sub.premiumActive;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ events: Ev[] }>("/organizer/events");
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell
      title="My events"
      subtitle="Manage stalls, tickets & gate entry"
      right={
        <Pressable
          onPress={() => {
            if (kycLocked) return;
            router.push("/dashboard/organizer/events/new");
          }}
          disabled={kycLocked}
        >
          <Ionicons name="add-circle" size={28} color={kycLocked ? "rgba(255,255,255,0.4)" : "#fff"} />
        </Pressable>
      }
    >
      {kycLocked ? (
        <View style={styles.bannerWarn}>
          <Text style={styles.bannerTitle}>KYC required</Text>
          <Text style={styles.bannerBody}>Upload and get organizer KYC approved before creating events.</Text>
          <PrimaryButton label="Complete KYC" variant="cta" compact onPress={() => router.push("/dashboard/organizer/kyc")} />
        </View>
      ) : null}
      {freePlanOnly ? (
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerTitle}>Free listing plan</Text>
          <Text style={styles.bannerBody}>
            Upgrade to a paid plan to unlock stall bookings, tickets, and premium event tools.
          </Text>
          <PrimaryButton
            label="View plans"
            variant="outline"
            compact
            onPress={() =>
              router.push(withSubscriptionReturnTo(ORGANIZER_SUBSCRIPTION_PATH, pathname) as never)
            }
          />
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={
            <EmptyState
              icon="calendar-outline"
              title="No events yet"
              message="Create your first trade fair to get started."
              actionLabel={kycLocked ? undefined : "Create event"}
              onAction={kycLocked ? undefined : () => router.push("/dashboard/organizer/events/new")}
              compact
            />
          }
          renderItem={({ item }) => {
            const endPassed =
              item.status === "published" && item.endsAt && new Date(item.endsAt).getTime() <= Date.now();
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/dashboard/organizer/events/${item.id}` as never)}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.title}>{item.title}</Text>
                  <Text style={styles.sub}>ID · {item.id}</Text>
                  <Text style={styles.sub}>{item.venueName}</Text>
                  {item.adminDisabled ? (
                    <Text style={styles.hiddenWarn}>
                      Disabled by admin — hidden from website and app.
                      {item.adminDisabledReason ? ` Reason: ${item.adminDisabledReason}` : ""}
                    </Text>
                  ) : endPassed ? (
                    <Text style={styles.hiddenWarn}>
                      Hidden from homepage — end date has passed. Edit and set a future end date.
                    </Text>
                  ) : null}
                  <View style={[styles.statusPill, item.status === "published" && styles.statusPub]}>
                    <Text style={styles.statusText}>
                      {item.adminDisabled ? "disabled by admin" : item.status}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </Pressable>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: colors.textMuted },
  bannerWarn: {
    backgroundColor: "rgba(245,158,11,0.12)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.35)",
  },
  bannerInfo: {
    backgroundColor: "rgba(14,165,233,0.08)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "rgba(14,165,233,0.25)",
  },
  bannerTitle: { fontWeight: "800", color: colors.navy, marginBottom: 4 },
  bannerBody: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginBottom: spacing.sm },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.navy },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  hiddenWarn: {
    marginTop: 6,
    fontSize: 11,
    color: "#b45309",
    lineHeight: 16,
  },
  statusPill: {
    alignSelf: "flex-start",
    marginTop: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.background,
  },
  statusPub: { backgroundColor: "rgba(16,185,129,0.15)" },
  statusText: { fontSize: 10, fontWeight: "800", color: colors.emeraldDark, textTransform: "uppercase" },
});
