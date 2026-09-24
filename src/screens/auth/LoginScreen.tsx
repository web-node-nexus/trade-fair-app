import { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { AuthScreenLayout } from "@/components/ui/AuthScreenLayout";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/ui/ToastProvider";
import { isValidEmail, required } from "@/lib/validation";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

export function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: string; next?: string }>();
  const { login, primaryDashboard } = useAuth();
  const { showError } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onEmailSubmit() {
    const emailErr = required(email, "Email");
    if (emailErr) {
      showError(emailErr);
      return;
    }
    if (!isValidEmail(email)) {
      showError("Enter a valid email address.");
      return;
    }
    if (!password) {
      showError("Password is required.");
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      const next = typeof params.next === "string" ? params.next : "";
      // Never send guests straight into create-event; role dashboards only after auth via primary
      if (next.startsWith("/") && !next.includes("/dashboard") && !next.includes("login")) {
        router.replace(next as never);
      } else {
        router.replace(primaryDashboard as never);
      }
    } catch (e) {
      showError(e instanceof Error ? e.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthScreenLayout title="Welcome back" subtitle="Welcome back to TradeFairWala">
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      <Pressable onPress={() => router.push("/(auth)/forgot-password" as never)} style={styles.forgot}>
        <Text style={styles.forgotText}>Forgot password?</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginVertical: 12 }} />
      ) : (
        <PrimaryButton label="Sign in" onPress={() => void onEmailSubmit()} />
      )}

      <Pressable
        onPress={() =>
          router.push({
            pathname: "/(auth)/register",
            params: params.accountType ? { accountType: String(params.accountType) } : undefined,
          } as never)
        }
        style={styles.link}
      >
        <Text style={styles.linkBold}>Register</Text>
      </Pressable>
    </AuthScreenLayout>
  );
}

const styles = StyleSheet.create({
  link: { marginTop: spacing.xl, alignItems: "center" },
  linkText: { fontSize: 14, color: colors.textMuted },
  linkBold: { color: colors.emerald, fontWeight: "700" },
  forgot: { alignSelf: "flex-end", marginBottom: spacing.md },
  forgotText: { color: colors.emerald, fontWeight: "600", fontSize: 13 },
});
