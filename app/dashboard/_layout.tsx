import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Stack, useRouter } from "expo-router";
import { WorkspaceBottomBar } from "@/components/workspace/WorkspaceBottomBar";
import { WorkspaceDrawer } from "@/components/workspace/WorkspaceDrawer";
import { useAuth } from "@/context/AuthContext";
import { WorkspaceNavProvider } from "@/context/WorkspaceNavContext";
import { colors } from "@/theme/colors";

export default function DashboardLayout() {
  const router = useRouter();
  const { ready, user } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/(auth)/login" as never);
    }
  }, [ready, user, router]);

  if (!ready || !user) {
    return (
      <View style={styles.gate}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  return (
    <WorkspaceNavProvider>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: "slide_from_right",
          }}
        />
        <WorkspaceBottomBar />
        <WorkspaceDrawer />
      </View>
    </WorkspaceNavProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  gate: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
