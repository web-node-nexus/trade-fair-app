import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export default function ProviderAcceptedContractDetailRoute() {
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    void apiJson<Record<string, unknown>>(`/provider/marketplace/accepted-contracts/${contractId}`)
      .then(setData)
      .catch(() => setData(null));
  }, [contractId]);

  if (!data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} />
      </View>
    );
  }

  const contract = data.contract as Record<string, unknown> | undefined;
  const exhibitor = data.exhibitor as Record<string, unknown> | undefined;
  const booking = data.booking as Record<string, unknown> | null | undefined;

  return (
    <ScreenShell title="Contract detail" subtitle="Accepted deal">
      <ScrollView>
        <View style={styles.card}>
          <Text style={styles.label}>Service</Text>
          <Text style={styles.val}>{String((data.serviceListing as { title?: string })?.title ?? "—")}</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.label}>Exhibitor</Text>
          <Text style={styles.val}>{String(exhibitor?.name ?? exhibitor?.email ?? "—")}</Text>
        </View>
        {contract ? (
          <View style={styles.card}>
            <Text style={styles.label}>Contract</Text>
            <Text style={styles.val}>{String(contract.serviceDescription ?? "")}</Text>
            <Text style={styles.sub}>
              {String(contract.durationDays)} days · {String(contract.peopleCount)} people
            </Text>
            <Text style={styles.sub}>Status: {String(contract.status)}</Text>
          </View>
        ) : null}
        {booking ? (
          <View style={styles.card}>
            <Text style={styles.label}>Booking</Text>
            <Text style={styles.val}>
              ₹{(Number(booking.amountMinor) / 100).toFixed(2)} · {String(booking.status)}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  val: { fontSize: 15, fontWeight: "800", color: colors.navy, marginTop: 4 },
  sub: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
});
