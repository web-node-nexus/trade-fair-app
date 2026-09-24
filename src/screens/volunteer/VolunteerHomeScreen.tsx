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
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Ev = {
  id: string;
  title: string;
  venueName: string;
  venueCity: string | null;
  startsAt: string;
  endsAt: string | null;
};

type Profile = { fullName: string; phone: string; photoUrl: string | null };

export function VolunteerHomeScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [evJ, meJ] = await Promise.all([
      apiJson<{ events: Ev[] }>("/volunteer/events"),
      apiJson<{ profile: Profile }>("/volunteer/me"),
    ]);
    setEvents(evJ.events ?? []);
    setProfile(meJ.profile);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => {
        setEvents([]);
        setProfile(null);
      })
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <ScreenShell title="Volunteer gate" subtitle="Assigned fairs only">
      {profile ? (
        <View style={styles.profile}>
          {profile.photoUrl ? (
            <Image source={{ uri: resolveMediaUrl(profile.photoUrl) }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{profile.fullName.slice(0, 1).toUpperCase()}</Text>
            </View>
          )}
          <View>
            <Text style={styles.profileName}>{profile.fullName}</Text>
            <Text style={styles.profilePhone}>{profile.phone}</Text>
          </View>
        </View>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void load().finally(() => setRefreshing(false));
              }}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon="people-outline"
              title="No assigned events"
              message="Ask your organiser to add you as a gate volunteer."
              compact
            />
          }
          renderItem={({ item }) => {
            const loc = [item.venueName, item.venueCity].filter(Boolean).join(" · ");
            return (
              <View style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.sub}>{loc}</Text>
                <Text style={styles.date}>
                  {new Date(item.startsAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                </Text>
                <PrimaryButton
                  label="Scan tickets"
                  variant="cta"
                  style={{ marginTop: spacing.md }}
                  onPress={() => router.push(`/dashboard/volunteer/events/${item.id}/scan` as never)}
                />
              </View>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  profile: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: "#ecfdf5",
    padding: spacing.lg,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  avatar: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "800" },
  profileName: { fontWeight: "800", color: colors.navy, fontSize: 16 },
  profilePhone: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  empty: { color: colors.textMuted, textAlign: "center", marginTop: 40, lineHeight: 21 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontWeight: "800", color: colors.navy, fontSize: 16 },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: 13 },
  date: { color: colors.textMuted, marginTop: 4, fontSize: 12 },
});
