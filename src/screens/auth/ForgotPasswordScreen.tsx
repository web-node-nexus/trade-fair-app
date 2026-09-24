import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useRouter } from "expo-router";
import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { apiJson } from "@/lib/authFetch";
import { useToast } from "@/components/ui/ToastProvider";
import { getWebBaseUrl } from "@/lib/webBaseUrl";
import { isValidEmail, required } from "@/lib/validation";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function ForgotPasswordScreen() {
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  async function submit() {
    const emailErr = required(email, "Email");
    if (emailErr) {
      showError(emailErr);
      return;
    }
    if (!isValidEmail(email)) {
      showError("Enter a valid email address.");
      return;
    }

    setBusy(true);
    try {
      await apiJson("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          resetBaseUrl: getWebBaseUrl(),
        }),
      });
      setSent(true);
      showSuccess("If an account exists, reset instructions were sent.");
    } catch (e) {
      showError(e instanceof Error ? e.message : "Failed to send reset link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenLayout title="Forgot password" subtitle="We will email reset instructions">
      {sent ? (
        <Text style={styles.ok}>If an account exists for {email}, reset instructions were sent.</Text>
      ) : (
        <>
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <PrimaryButton
            label={busy ? "Sending…" : "Send reset link"}
            variant="cta"
            disabled={busy}
            onPress={() => void submit()}
          />
        </>
      )}
      <PrimaryButton
        label="Back to sign in"
        variant="outline"
        onPress={() => router.back()}
        style={{ marginTop: spacing.lg }}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  ok: { color: colors.emerald, lineHeight: 22, marginBottom: spacing.lg },
});
