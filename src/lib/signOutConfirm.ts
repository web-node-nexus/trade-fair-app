import { Alert } from "react-native";

export function confirmSignOut(onConfirm: () => void | Promise<void>) {
  Alert.alert(
    "Sign out?",
    "You will need to sign in again to access your workspace.",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void onConfirm() },
    ]
  );
}
