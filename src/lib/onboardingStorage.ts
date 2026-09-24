import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "@tradefair/onboarding_complete";

/** Once completed, intro slides are not shown again (no version-forced replay). */
export async function hasCompletedOnboarding(): Promise<boolean> {
  try {
    const done = await AsyncStorage.getItem(KEY);
    return done === "1";
  } catch {
    return false;
  }
}

export async function completeOnboarding(): Promise<void> {
  await AsyncStorage.setItem(KEY, "1");
}
