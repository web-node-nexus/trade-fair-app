import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

type Profile = {
  accountHolderName: string;
  bankAccountNumber: string | null;
  ifsc: string | null;
  upiId: string | null;
  razorpayLinkedAccountId: string | null;
};

type PutPayoutResponse = {
  ok: boolean;
  razorpayLinkedAccountId: string | null;
  routeOnboarding: string;
  routeOnboardingDetail?: string;
};

function validatePayoutForm(input: {
  bankAccountNumber: string;
  ifsc: string;
  upiId: string;
  stakeholderPan: string;
}): string | null {
  const bankNum = input.bankAccountNumber.replace(/\s/g, "");
  const ifsc = input.ifsc.trim().toUpperCase();
  const upi = input.upiId.trim();
  const pan = input.stakeholderPan.trim().toUpperCase();

  if (!bankNum && !upi) {
    return "Add your UPI ID, or bank account number with IFSC.";
  }
  if (bankNum && !/^\d{9,18}$/.test(bankNum)) {
    return "Bank account number must be 9–18 digits.";
  }
  if (ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc)) {
    return "IFSC must look like ABCD0123456.";
  }
  if (bankNum && !ifsc) return "IFSC is required when bank account number is set.";
  if (ifsc && !bankNum) return "Bank account number is required when IFSC is set.";
  if (upi && !/^[\w.\-+]{2,64}@[\w.-]{2,64}$/.test(upi)) {
    return "UPI ID looks invalid (e.g. name@paytm).";
  }
  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
    return "PAN must look like ABCDE1234F (10 characters).";
  }
  return null;
}

function payoutSuccessMessage(out: PutPayoutResponse): string {
  if (out.routeOnboarding === "created") {
    return out.razorpayLinkedAccountId
      ? `Saved. Razorpay linked account ready: ${out.razorpayLinkedAccountId}.`
      : "Saved. Razorpay linked account ready.";
  }
  if (out.routeOnboarding === "failed") {
    return out.routeOnboardingDetail
      ? `Bank / UPI saved, but Razorpay setup failed: ${out.routeOnboardingDetail}`
      : "Bank / UPI saved, but Razorpay setup failed.";
  }
  if (out.routeOnboarding === "skipped_missing_contact") {
    return "Saved. For Razorpay auto-setup, add email and phone in Account settings, then save again.";
  }
  return "Payout profile saved.";
}

export function OrganizerPayoutsScreen() {
  const [accountHolderName, setAccountHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [ifsc, setIfsc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [stakeholderPan, setStakeholderPan] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    const data = await apiJson<{ profile: Profile | null }>("/organizer/payout-profile");
    const p = data.profile;
    if (p) {
      setAccountHolderName(p.accountHolderName ?? "");
      setBankAccountNumber(p.bankAccountNumber ?? "");
      setIfsc(p.ifsc ?? "");
      setUpiId(p.upiId ?? "");
    }
  }, []);

  useEffect(() => {
    void load()
      .catch((e) => Alert.alert("Error", e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [load]);

  async function save() {
    Keyboard.dismiss();
    const validationError = validatePayoutForm({
      bankAccountNumber,
      ifsc,
      upiId,
      stakeholderPan,
    });
    if (validationError) {
      Alert.alert("Check details", validationError);
      return;
    }

    setBusy(true);
    setMsg(null);
    try {
      const out = await apiJson<PutPayoutResponse>("/organizer/payout-profile", {
        method: "PUT",
        body: JSON.stringify({
          accountHolderName: accountHolderName.trim(),
          bankAccountNumber: bankAccountNumber.trim() || null,
          ifsc: ifsc.trim() || null,
          upiId: upiId.trim() || null,
          stakeholderPan: stakeholderPan.trim().toUpperCase() || null,
        }),
      });
      const successMsg = payoutSuccessMessage(out);
      setMsg(successMsg);
      Alert.alert("Saved", successMsg);
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
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
    <ScreenShell
      title="Payouts"
      subtitle="Bank / UPI for settlements"
      scroll
      keyboardAvoid
      onRefresh={load}
    >
      <Field label="Account holder name" value={accountHolderName} onChange={setAccountHolderName} />
      <Field label="Bank account number" value={bankAccountNumber} onChange={setBankAccountNumber} keyboard="number-pad" />
      <Field label="IFSC" value={ifsc} onChange={setIfsc} autoCapitalize="characters" />
      <Field label="UPI ID" value={upiId} onChange={setUpiId} />
      <Field
        label="Stakeholder PAN"
        value={stakeholderPan}
        onChange={setStakeholderPan}
        autoCapitalize="characters"
        returnKeyType="done"
        onSubmitEditing={() => void save()}
      />
      <PrimaryButton
        label={busy ? "Saving…" : "Save payout profile"}
        variant="cta"
        disabled={busy}
        style={styles.saveBtn}
        onPress={() => void save()}
      />
      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
    </ScreenShell>
  );
}

function Field({
  label,
  value,
  onChange,
  keyboard,
  autoCapitalize,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  keyboard?: "default" | "number-pad";
  autoCapitalize?: "none" | "characters";
  returnKeyType?: "done" | "next";
  onSubmitEditing?: () => void;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        autoCapitalize={autoCapitalize ?? "sentences"}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        blurOnSubmit={returnKeyType === "done"}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  field: { marginBottom: spacing.md },
  label: { fontSize: 13, fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    fontSize: 15,
    color: colors.text,
  },
  saveBtn: { marginTop: spacing.sm },
  msg: { marginTop: spacing.md, color: colors.emerald, fontWeight: "600" },
});
