import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { openRazorpayCheckout } from "@/lib/razorpayCheckout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { parseReturnToParam } from "@/lib/subscriptionReturn";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Plan = {
  id: number;
  name: string;
  description: string | null;
  priceMinor: string;
  durationDays: number;
  limitations?: Record<string, unknown> | null;
  stallBookingCommissionBps?: number;
};

type MeSub = {
  active: boolean;
  planName?: string;
  priceMinor?: string;
  endsAt?: string;
  limitations?: Record<string, unknown> | null;
  stallBookingCommissionBps?: number;
};

const PLAN_LIMIT_KEYS = ["maxPublishedEvents", "maxEventsTotal", "maxPublishedServices", "maxServicesTotal"] as const;

/** Missing limit means unlimited. */
function planLimit(limitations: Record<string, unknown> | null | undefined, key: string): number | null {
  const v = limitations?.[key];
  if (typeof v === "number" && Number.isFinite(v) && v >= 0) return Math.floor(v);
  if (typeof v === "string" && /^\d+$/.test(v)) return Number(v);
  return null;
}

type ReferralWallet = {
  code: string;
  pointsBalance: number;
  pointsValueMinor: number;
  rewardPerReferral: number;
  minorPerPoint: number;
};

export function SubscriptionPlansScreen({
  roleCode,
  title,
  requireOrganizerKyc,
}: {
  roleCode: "ORGANIZER" | "SERVICE_PROVIDER";
  title: string;
  requireOrganizerKyc?: boolean;
}) {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string | string[] }>();
  const returnTo = parseReturnToParam(params.returnTo);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [current, setCurrent] = useState<MeSub | null>(null);
  const [kycOk, setKycOk] = useState(!requireOrganizerKyc);
  const [referralCode, setReferralCode] = useState("");
  const [referralWallet, setReferralWallet] = useState<ReferralWallet | null>(null);
  const [pointsToUse, setPointsToUse] = useState("0");
  const [loading, setLoading] = useState(true);
  const [busyPlanId, setBusyPlanId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [pl, me] = await Promise.all([
      apiJson<{ plans: Plan[] }>(`/subscription/plans?roleCode=${encodeURIComponent(roleCode)}`),
      apiJson<{
        organizerKycApproved?: boolean;
        subscriptionByRole?: Record<string, MeSub>;
        referralWallet?: ReferralWallet | null;
      }>("/auth/me"),
    ]);
    setPlans(pl.plans ?? []);
    if (requireOrganizerKyc) setKycOk(Boolean(me.organizerKycApproved));
    setCurrent(me.subscriptionByRole?.[roleCode] ?? { active: false });
    setReferralWallet(me.referralWallet ?? null);
  }, [roleCode, requireOrganizerKyc]);

  const finishCheckoutSuccess = useCallback(
    async (title: string, message: string) => {
      await load();
      Alert.alert(title, message, [
        {
          text: "OK",
          onPress: () => {
            if (returnTo) router.replace(returnTo as never);
          },
        },
      ]);
    },
    [load, returnTo, router]
  );

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  function currentPriceMinor() {
    if (!current?.active) return 0;
    if (current.priceMinor != null && current.priceMinor !== "") return Number(current.priceMinor);
    const match = plans.find((p) => p.name === current.planName);
    return match ? Number(match.priceMinor) : 0;
  }

  function isLowerThanCurrent(plan: Plan) {
    const curPrice = currentPriceMinor();
    if (!current?.active || curPrice <= 0 || current.planName === plan.name) return false;
    if (Number(plan.priceMinor) <= curPrice) return true;
    if ((plan.stallBookingCommissionBps ?? 0) > (current.stallBookingCommissionBps ?? 0)) return true;
    return PLAN_LIMIT_KEYS.some((k) => {
      const next = planLimit(plan.limitations, k);
      const cur = planLimit(current.limitations, k);
      return next != null && (cur == null || next < cur);
    });
  }

  async function buyPlan(plan: Plan) {
    if (isLowerThanCurrent(plan)) {
      Alert.alert("Plan stays active", "A lower plan cannot replace your current subscription.");
      return;
    }
    if (requireOrganizerKyc && !kycOk) {
      Alert.alert("KYC required", "Complete organizer KYC before subscribing.", [
        { text: "Go to KYC", onPress: () => router.push("/dashboard/organizer/kyc" as never) },
        { text: "Cancel", style: "cancel" },
      ]);
      return;
    }
    setBusyPlanId(plan.id);
    try {
      const code = referralCode.trim();
      const redeemPoints = Math.max(
        0,
        Math.min(referralWallet?.pointsBalance ?? 0, Number(pointsToUse) || 0)
      );
      const checkout = await apiJson<{
        free?: boolean;
        subscriptionId?: string;
        paymentId?: string;
        razorpayOrderId?: string;
        razorpayKeyId?: string;
        amountMinor?: string;
      }>("/subscription/checkout", {
        method: "POST",
        body: JSON.stringify({
          planId: plan.id,
          ...(code ? { referralCode: code } : {}),
          ...(redeemPoints > 0 ? { pointsToUse: redeemPoints } : {}),
        }),
      });

      if (checkout.free && checkout.subscriptionId) {
        await finishCheckoutSuccess("Activated", "Free plan is now active.");
        return;
      }

      if (!checkout.razorpayOrderId || !checkout.paymentId || !checkout.razorpayKeyId) {
        throw new Error("Checkout did not return payment details");
      }

      const response = await openRazorpayCheckout({
        keyId: checkout.razorpayKeyId,
        orderId: checkout.razorpayOrderId,
        amountMinor: Number(checkout.amountMinor ?? plan.priceMinor),
        description: plan.name,
      });
      await apiJson("/subscription/verify", {
        method: "POST",
        body: JSON.stringify({
          paymentId: checkout.paymentId,
          razorpayOrderId: response.razorpay_order_id,
          razorpayPaymentId: response.razorpay_payment_id,
          razorpaySignature: response.razorpay_signature,
        }),
      });
      await finishCheckoutSuccess("Success", "Subscription activated.");
    } catch (e) {
      if (e instanceof Error && e.message === "cancelled") return;
      Alert.alert("Checkout failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusyPlanId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  return (
    <ScreenShell title={title} subtitle={current?.active ? `Active: ${current.planName}` : "Choose a plan"} scroll onRefresh={load}>
        {!kycOk ? (
          <Pressable style={styles.warn} onPress={() => router.push("/dashboard/organizer/kyc" as never)}>
            <Text style={styles.warnText}>Organizer KYC must be approved before checkout.</Text>
          </Pressable>
        ) : null}

        <Text style={styles.label}>Referral code (optional)</Text>
        <TextInput
          style={styles.input}
          value={referralCode}
          onChangeText={setReferralCode}
          placeholder="Enter code"
          autoCapitalize="characters"
        />

        {referralWallet ? (
          <View style={styles.walletCard}>
            <Text style={styles.walletTitle}>Your referral rewards</Text>
            <Text style={styles.walletCode}>Code: {referralWallet.code}</Text>
            <Text style={styles.walletHint}>
              Earn {referralWallet.rewardPerReferral} points per friend · 1 point = 20 paise off subscription
            </Text>
            <Text style={styles.walletBalance}>
              Balance: {referralWallet.pointsBalance} pts (₹{(referralWallet.pointsValueMinor / 100).toFixed(2)})
            </Text>
            {referralWallet.pointsBalance > 0 ? (
              <>
                <Text style={[styles.label, { marginTop: spacing.sm }]}>Points to redeem</Text>
                <TextInput
                  style={styles.input}
                  value={pointsToUse}
                  onChangeText={setPointsToUse}
                  keyboardType="number-pad"
                  placeholder="0"
                />
                <Pressable onPress={() => setPointsToUse(String(referralWallet.pointsBalance))}>
                  <Text style={styles.useAll}>Use all points</Text>
                </Pressable>
              </>
            ) : null}
          </View>
        ) : null}

        <FlatList
          data={plans}
          keyExtractor={(p) => String(p.id)}
          scrollEnabled={false}
          ListEmptyComponent={<EmptyState title="No plans available." compact />}
          renderItem={({ item }) => {
            const downgrade = isLowerThanCurrent(item);
            return (
            <View style={styles.planCard}>
              <Text style={styles.planName}>{item.name}</Text>
              <Text style={styles.planPrice}>₹{(Number(item.priceMinor) / 100).toFixed(0)}</Text>
              {item.description ? (
                <Text style={styles.planDesc}>{item.description.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()}</Text>
              ) : null}
              <Text style={styles.planDur}>{item.durationDays} days</Text>
              <PrimaryButton
                label={
                  busyPlanId === item.id ? "Processing…" : downgrade ? "Lower plan unavailable" : "Subscribe"
                }
                variant="cta"
                disabled={busyPlanId !== null || downgrade}
                onPress={() => void buyPlan(item)}
                style={{ marginTop: spacing.sm }}
              />
            </View>
            );
          }}
        />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  warn: {
    backgroundColor: "rgba(234,179,8,0.15)",
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.md,
  },
  warnText: { color: "#92400e", fontWeight: "600" },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
  },
  walletCard: {
    backgroundColor: "rgba(139,92,246,0.08)",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },
  walletTitle: { fontWeight: "800", color: colors.navy, fontSize: 14 },
  walletCode: { marginTop: 4, fontFamily: "monospace", fontWeight: "700", color: "#5b21b6" },
  walletHint: { marginTop: 4, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  walletBalance: { marginTop: 6, fontSize: 13, fontWeight: "600", color: colors.navy },
  useAll: { color: colors.emerald, fontWeight: "700", marginTop: -spacing.sm, marginBottom: spacing.md },
  muted: { color: colors.textMuted, textAlign: "center", marginTop: 20 },
  planCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  planName: { fontSize: 18, fontWeight: "800", color: colors.navy },
  planPrice: { fontSize: 22, fontWeight: "800", color: colors.cta, marginTop: 4 },
  planDesc: { color: colors.textMuted, marginTop: 6, lineHeight: 20 },
  planDur: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
