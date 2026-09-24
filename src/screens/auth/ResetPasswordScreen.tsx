import { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { apiJson } from "@/lib/authFetch";
import { useToast } from "@/components/ui/ToastProvider";
import { isValidPassword } from "@/lib/validation";
import { spacing } from "@/theme/spacing";
import { colors } from "@/theme/colors";

export function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { showError, showSuccess } = useToast();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!token) {
      showError("Reset token missing. Open the link from your email again.");
      return;
    }

    const passwordErr = isValidPassword(password);
    if (passwordErr) {
      showError(passwordErr);
      return;
    }
    if (password !== confirm) {
      showError("Passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      await apiJson("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      showSuccess("Password updated. Sign in with your new password.");
      setTimeout(() => router.replace("/(auth)/login" as never), 1200);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Reset failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthScreenLayout title="Reset password" subtitle="Choose a new password">
      {!token ? <Text style={styles.err}>Invalid or expired reset link.</Text> : null}
      <TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry />
      <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry />
      <PrimaryButton
        label={busy ? "Saving…" : "Update password"}
        variant="cta"
        disabled={busy || !token}
        onPress={() => void submit()}
      />
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  err: { color: "#ef4444", marginBottom: spacing.md },
});
