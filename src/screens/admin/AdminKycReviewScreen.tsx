import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { adminStyles } from "./adminStyles";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type KycRow = {
  id: string;
  userEmail?: string;
  docType: string;
  status: string;
  roleCode: string;
};

function docLabel(docType: string) {
  return docType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AdminKycReviewScreen() {
  const [rows, setRows] = useState<KycRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>("/admin/kyc?status=submitted");
    setRows(extractList(data) as KycRow[]);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function review(docId: string, decision: "approved" | "rejected") {
    setBusy(docId);
    try {
      await apiJson(`/admin/kyc/${docId}/review`, {
        method: "PATCH",
        body: JSON.stringify({
          decision,
          remarks: decision === "rejected" ? "Rejected from mobile review" : null,
        }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Review failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <ScreenShell title="KYC queue" subtitle={`${rows.length} pending reviews`}>
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          style={{ flex: 1, marginHorizontal: -spacing.screen }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.md }}
          data={rows}
          keyExtractor={(r) => r.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <EmptyState
              icon="shield-checkmark-outline"
              title="No pending KYC"
              message="Submitted documents will appear here for review."
              compact
            />
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.iconWrap}>
                  <Ionicons name="document-text-outline" size={22} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.email} numberOfLines={1}>{item.userEmail ?? "User"}</Text>
                  <Text style={styles.doc}>{docLabel(item.docType)}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="person-outline" size={14} color={colors.textMuted} />
                <Text style={styles.meta}>{item.roleCode.replace(/_/g, " ")}</Text>
              </View>

              <View style={adminStyles.actions}>
                <Pressable
                  style={[adminStyles.btn, adminStyles.approve]}
                  disabled={busy === item.id}
                  onPress={() => void review(item.id, "approved")}
                >
                  <Ionicons name="checkmark" size={16} color="#fff" />
                  <Text style={adminStyles.btnText}> Approve</Text>
                </Pressable>
                <Pressable
                  style={[adminStyles.btn, adminStyles.reject]}
                  disabled={busy === item.id}
                  onPress={() => void review(item.id, "rejected")}
                >
                  <Ionicons name="close" size={16} color="#fff" />
                  <Text style={adminStyles.btnText}> Reject</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  cardTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  email: { fontSize: 15, fontWeight: "800", color: colors.navy },
  doc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  pendingBadge: {
    backgroundColor: "#fff7ed",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  pendingText: { fontSize: 10, fontWeight: "800", color: "#ea580c", textTransform: "uppercase" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  meta: { fontSize: 12, color: colors.textMuted, fontWeight: "600" },
});
