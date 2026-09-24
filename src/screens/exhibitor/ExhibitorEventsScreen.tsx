import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";

type Ev = {
  id: string;
  title: string;
  venueName: string;
  venueCity?: string | null;
  startsAt: string;
  coverImageUrl?: string | null;
  imageUrls?: string[];
};

function formatEventDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function ExhibitorEventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Ev[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await apiJson<{ events: Ev[] }>("/exhibitor/events");
      setEvents(data.events ?? []);
    } catch {
      setEvents([]);
    }
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <ScreenShell title="Discover events" subtitle="Find fairs and book stalls">
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Discover events" subtitle="Find fairs and book stalls">
      <RefreshableFlatList
        data={events}
        keyExtractor={(e) => e.id}
        onRefresh={() => void load()}
        ListEmptyComponent={<EmptyState title="No published events right now." compact />}
        renderItem={({ item }) => (
          <DashboardListCard
            title={item.title}
            subtitle={`${item.venueName}${item.venueCity ? ` · ${item.venueCity}` : ""}`}
            meta={formatEventDate(item.startsAt)}
            imageUrl={resolveMediaUrl(item.coverImageUrl ?? item.imageUrls?.[0] ?? null)}
            icon="calendar-outline"
            iconColor={colors.emeraldDark}
            iconBg="rgba(16,185,129,0.12)"
            onPress={() => router.push(`/dashboard/exhibitor/events/${item.id}` as never)}
          />
        )}
      />
    </ScreenShell>
  );
}
