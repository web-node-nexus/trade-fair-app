import {
  useCallback,
  useLayoutEffect,
  useState,
  type ReactNode,
} from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { BrandSplash } from "@/components/splash/BrandSplash";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { hasCompletedOnboarding } from "@/lib/onboardingStorage";

SplashScreen.preventAutoHideAsync().catch(() => {});

type Phase = "splash" | "onboarding" | "ready";

export function IntroGateProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>("splash");

  useLayoutEffect(() => {
    void SplashScreen.hideAsync().catch(() => {});
  }, []);

  const onSplashDone = useCallback(() => {
    void hasCompletedOnboarding()
      .then((done) => setPhase(done ? "ready" : "onboarding"))
      .catch(() => setPhase("onboarding"));
  }, []);

  const onOnboardingDone = useCallback(() => {
    setPhase("ready");
  }, []);

  if (phase === "splash") {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
        <BrandSplash onFinish={onSplashDone} />
      </View>
    );
  }
  if (phase === "onboarding") {
    return (
      <View style={{ flex: 1 }}>
        <OnboardingFlow onComplete={onOnboardingDone} />
      </View>
    );
  }

  return <>{children}</>;
}
