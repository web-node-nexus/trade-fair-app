import { useCallback, useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { apiJson } from "@/lib/authFetch";
import { StatGrid, type StatCell } from "@/components/dashboard/StatGrid";
import { colors } from "@/theme/colors";

const STAT_STYLES = {
  bookings: { tint: colors.emeraldDark, bg: "rgba(16,185,129,0.18)" },
  favorites: { tint: colors.cta, bg: "rgba(226,55,68,0.12)" },
  payments: { tint: colors.navyLight, bg: "rgba(19,45,82,0.1)" },
  awaiting: { tint: "#b45309", bg: "rgba(245,158,11,0.16)" },
} as const;

const FALLBACK_CELLS: StatCell[] = [
  { label: "Stall bookings", value: 0, route: "/dashboard/exhibitor/bookings", icon: "bookmark-outline", ...STAT_STYLES.bookings },
  { label: "Saved fairs", value: 0, route: "/dashboard/exhibitor/events", icon: "heart-outline", ...STAT_STYLES.favorites },
  { label: "Payments", value: 0, route: "/dashboard/exhibitor/payments", icon: "card-outline", ...STAT_STYLES.payments },
  { label: "Awaiting pay", value: 0, route: "/dashboard/exhibitor/bookings", icon: "time-outline", ...STAT_STYLES.awaiting },
];

export function ExhibitorHomeOverview({ refreshKey = 0 }: { refreshKey?: number }) {
  const router = useRouter();
  const [cells, setCells] = useState<StatCell[] | null>(null);

  const load = useCallback(async () => {
    try {
      const [bookings, favEvents, pays] = await Promise.all([
        apiJson<{ bookings: { status: string; subtotalMinor: string; payNowMinor?: string }[] }>(
          "/exhibitor/bookings"
        ),
        apiJson<{ events: unknown[] }>("/exhibitor/events?favorites=1"),
        apiJson<{ payments: unknown[] }>("/exhibitor/payments"),
      ]);
      const pendingPay = bookings.bookings.filter(
        (b) => b.status === "pending" && Number(b.payNowMinor ?? b.subtotalMinor) > 0
      ).length;
      setCells([
        {
          label: "Stall bookings",
          value: bookings.bookings.length,
          route: "/dashboard/exhibitor/bookings",
          icon: "bookmark-outline",
          ...STAT_STYLES.bookings,
        },
        {
          label: "Saved fairs",
          value: favEvents.events?.length ?? 0,
          route: "/dashboard/exhibitor/events",
          icon: "heart-outline",
          ...STAT_STYLES.favorites,
        },
        {
          label: "Payments",
          value: pays.payments?.length ?? 0,
          route: "/dashboard/exhibitor/payments",
          icon: "card-outline",
          ...STAT_STYLES.payments,
        },
        {
          label: "Awaiting pay",
          value: pendingPay,
          route: "/dashboard/exhibitor/bookings",
          icon: "time-outline",
          ...STAT_STYLES.awaiting,
        },
      ]);
    } catch {
      setCells(FALLBACK_CELLS);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <StatGrid
      cells={cells ?? []}
      loading={!cells}
      onPress={(route) => router.push(route as never)}
    />
  );
}
