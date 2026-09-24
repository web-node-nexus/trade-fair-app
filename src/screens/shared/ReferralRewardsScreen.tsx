import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Clipboard,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { getWebBaseUrl } from "@/lib/webBaseUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ReferralWallet = {
  code: string;
  pointsBalance: number;
  pointsValueMinor: number;
  rewardPerReferral: number;
  minorPerPoint: number;
};

const ELIGIBLE_ROLES = new Set(["VISITOR", "ORGANIZER", "SERVICE_PROVIDER"]);

function isEligible(roles?: string[]) {
  return roles?.some((r) => ELIGIBLE_ROLES.has(String(r).trim().toUpperCase()));
}

export function ReferralRewardsScreen() {
  const [wallet, setWallet] = useState<ReferralWallet | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const me = await apiJson<{ roles?: string[]; referralWallet?: ReferralWallet | null }>("/auth/me");
    setRoles(me.roles ?? []);
    setWallet(me.referralWallet ?? null);
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => setErr(e instanceof Error ? e.message : "Could not load"))
      .finally(() => setLoading(false));
  }, [load]);

  const shareMessage = wallet
    ? `Join Trade Fair Wala with my referral code ${wallet.code} and explore exhibitions across India. I earn ${wallet.rewardPerReferral} reward points when you sign up!\n\nRegister: ${getWebBaseUrl()}/register?ref=${encodeURIComponent(wallet.code)}`
    : "";

  async function copyCode() {
    if (!wallet?.code) return;
    Clipboard.setString(wallet.code);
    Alert.alert("Copied", "Referral code copied to clipboard.");
  }

  async function shareCode() {
    if (!wallet?.code) return;
    try {
      await Share.share({ message: shareMessage, title: "Trade Fair Wala referral" });
    } catch {
      /* user dismissed */
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  if (!isEligible(roles)) {
    return (
      <ScreenShell title="Refer & earn" subtitle="Reward program">
        <View style={styles.emptyCard}>
          <Ionicons name="gift-outline" size={40} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Not available for your account type</Text>
          <Text style={styles.emptyHint}>
            Referral rewards are for Visitor, Organizer and Service Provider accounts.
          </Text>
        </View>
      </ScreenShell>
    );
  }

  if (err || !wallet) {
    return (
      <ScreenShell title="Refer & earn" subtitle="Reward program" onRefresh={load}>
        <Text style={styles.err}>{err ?? "Could not load your referral wallet."}</Text>
        <PrimaryButton label="Retry" onPress={() => void load()} />
      </ScreenShell>
    );
  }

  const rupeeValue = (wallet.pointsValueMinor / 100).toFixed(2);

  return (
    <ScreenShell title="Refer & earn" subtitle="Share your code · get 100 points per friend" scroll onRefresh={load}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="gift" size={28} color="#fff" />
        </View>
        <Text style={styles.heroTitle}>Earn {wallet.rewardPerReferral} points</Text>
        <Text style={styles.heroSub}>
          When someone registers with your referral code, you earn {wallet.rewardPerReferral} points.
        </Text>
      </View>

      <View style={styles.codeCard}>
        <Text style={styles.codeLabel}>Your referral code</Text>
        <Text style={styles.codeValue} selectable>
          {wallet.code}
        </Text>
        <View style={styles.codeActions}>
          <Pressable style={styles.codeBtn} onPress={() => void copyCode()}>
            <Ionicons name="copy-outline" size={18} color={colors.emerald} />
            <Text style={styles.codeBtnText}>Copy</Text>
          </Pressable>
          <Pressable style={[styles.codeBtn, styles.codeBtnPrimary]} onPress={() => void shareCode()}>
            <Ionicons name="share-social-outline" size={18} color="#fff" />
            <Text style={[styles.codeBtnText, styles.codeBtnTextPrimary]}>Share</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Points balance</Text>
        <Text style={styles.balanceValue}>{wallet.pointsBalance}</Text>
        <Text style={styles.balanceHint}>
          Worth ₹{rupeeValue} off subscription · 1 point = 20 paise
        </Text>
      </View>

      <View style={styles.steps}>
        <Text style={styles.stepsTitle}>How it works</Text>
        <Step n={1} text="Share your code with friends (WhatsApp, SMS, email)." />
        <Step n={2} text={`They enter your code at signup — you get ${wallet.rewardPerReferral} points.`} />
        <Step n={3} text="Redeem points at subscription checkout to reduce your bill." />
      </View>
    </ScreenShell>
  );
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepNum}>
        <Text style={styles.stepNumText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  err: { color: "#dc2626", marginBottom: spacing.md, fontSize: 14 },
  emptyCard: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: { marginTop: spacing.md, fontWeight: "800", color: colors.navy, fontSize: 16, textAlign: "center" },
  emptyHint: { marginTop: spacing.sm, fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 19 },
  hero: {
    backgroundColor: "#5b21b6",
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  heroTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  heroSub: { marginTop: 6, fontSize: 13, color: "rgba(255,255,255,0.88)", lineHeight: 19 },
  codeCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  codeLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase", letterSpacing: 0.6 },
  codeValue: {
    marginTop: spacing.sm,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: 2,
    color: "#5b21b6",
    fontFamily: "monospace",
  },
  codeActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  codeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.emerald,
    backgroundColor: "rgba(5,150,105,0.06)",
  },
  codeBtnPrimary: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  codeBtnText: { fontWeight: "700", color: colors.emerald, fontSize: 14 },
  codeBtnTextPrimary: { color: "#fff" },
  balanceCard: {
    backgroundColor: "rgba(5,150,105,0.08)",
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(5,150,105,0.25)",
    marginBottom: spacing.md,
  },
  balanceLabel: { fontSize: 12, fontWeight: "700", color: colors.textMuted },
  balanceValue: { marginTop: 4, fontSize: 36, fontWeight: "800", color: colors.navy },
  balanceHint: { marginTop: 4, fontSize: 13, color: colors.textMuted },
  steps: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepsTitle: { fontWeight: "800", fontSize: 15, color: colors.navy, marginBottom: spacing.md },
  stepRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  stepText: { flex: 1, fontSize: 13, color: colors.navy, lineHeight: 19 },
});
