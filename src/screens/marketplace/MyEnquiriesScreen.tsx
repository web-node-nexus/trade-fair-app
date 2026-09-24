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
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Row = { id: string; serviceTitle?: string; status: string; lastMessagePreview?: string };

export function MyEnquiriesScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiJson<{ requests: Row[] }>("/marketplace/my-requests");
      setRows(data.requests ?? []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ScreenShell title="My enquiries" subtitle="Chat with service providers">
      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void load()} />}
          ListEmptyComponent={<EmptyState title="No enquiries yet." compact />}
          renderItem={({ item }) => (
            <Pressable
              style={styles.card}
              onPress={() => router.push(`/dashboard/marketplace/my-enquiries/${item.id}` as never)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.serviceTitle ?? "Service enquiry"}</Text>
                <Text style={styles.status}>{item.status}</Text>
                {item.lastMessagePreview ? (
                  <Text style={styles.preview} numberOfLines={1}>{item.lastMessagePreview}</Text>
                ) : null}
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
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
  title: { fontWeight: "800", color: colors.navy, fontSize: 15 },
  status: { fontSize: 11, fontWeight: "700", color: colors.emerald, marginTop: 4, textTransform: "uppercase" },
  preview: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
