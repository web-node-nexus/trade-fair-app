import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";

/** Role-priority redirect — same as web /dashboard */
export default function DashboardIndexRoute() {
  const router = useRouter();
  const { ready, user, primaryDashboard } = useAuth();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/(auth)/login" as never);
      return;
    }
    router.replace(primaryDashboard as never);
  }, [ready, user, primaryDashboard, router]);

  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
      <ActivityIndicator color={colors.cta} size="large" />
    </View>
  );
}
