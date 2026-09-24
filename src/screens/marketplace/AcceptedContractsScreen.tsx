import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ContractRow = {
  contractId: string;
  requestId: string;
  acceptedAt: string;
  serviceTitle: string;
  serviceDescription: string;
  durationDays: number;
  peopleCount: number;
  providerDisplayName?: string;
  exhibitorDisplayName?: string;
  eventTitle?: string | null;
};

export function AcceptedContractsScreen({ apiScope }: { apiScope: "exhibitor" | "provider" }) {
  const router = useRouter();
  const endpoint =
    apiScope === "exhibitor"
      ? "/exhibitor/marketplace/accepted-contracts"
      : "/provider/marketplace/accepted-contracts";
  const [rows, setRows] = useState<ContractRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<{ contracts: ContractRow[] }>(endpoint);
    setRows(data.contracts ?? []);
  }, [endpoint]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  return (
    <ScreenShell
      title="Accepted contracts"
      subtitle={apiScope === "exhibitor" ? "Confirmed service deals" : "Deals you accepted"}
    >
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(c) => c.contractId}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyState title="No accepted contracts yet." compact />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => {
                if (apiScope === "provider") {
                  router.push(`/dashboard/service-provider/accepted-contracts/${item.contractId}` as never);
                } else {
                  router.push(`/dashboard/marketplace/my-enquiries/${item.requestId}` as never);
                }
              }}
            >
              <Text style={styles.title}>{item.serviceTitle}</Text>
              <Text style={styles.sub} numberOfLines={2}>
                {item.serviceDescription}
              </Text>
              <Text style={styles.meta}>
                {item.durationDays} days · {item.peopleCount} people
              </Text>
              {item.eventTitle ? <Text style={styles.event}>Fair: {item.eventTitle}</Text> : null}
              <Text style={styles.peer}>
                {apiScope === "exhibitor"
                  ? `Provider: ${item.providerDisplayName ?? "—"}`
                  : `Exhibitor: ${item.exhibitorDisplayName ?? "—"}`}
              </Text>
              <Text style={styles.date}>Accepted {new Date(item.acceptedAt).toLocaleString()}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  muted: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { fontSize: 16, fontWeight: "800", color: colors.navy },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  meta: { fontSize: 12, fontWeight: "600", color: colors.emerald, marginTop: 8 },
  event: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  peer: { fontSize: 12, fontWeight: "700", color: colors.navy, marginTop: 6 },
  date: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
