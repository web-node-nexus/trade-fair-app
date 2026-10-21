import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/context/I18nContext";
import { IntroGateProvider } from "@/context/IntroGateContext";
import { ImageZoomProvider } from "@/context/ImageZoomContext";

export default function RootLayout() {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ToastProvider>
        <I18nProvider>
          <ImageZoomProvider>
            <AuthProvider>
              <IntroGateProvider>
                <StatusBar style="dark" />
                <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="(auth)" options={{ presentation: "modal" }} />
                  <Stack.Screen name="event/[id]" options={{ presentation: "card" }} />
                  <Stack.Screen name="dashboard" />
                  <Stack.Screen name="pages" />
                </Stack>
              </IntroGateProvider>
            </AuthProvider>
          </ImageZoomProvider>
        </I18nProvider>
      </ToastProvider>
    </SafeAreaProvider>
  );
}
