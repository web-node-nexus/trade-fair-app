import { Redirect } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { ready } = useAuth();
  if (!ready) return null;
  return <Redirect href="/(tabs)" />;
}
