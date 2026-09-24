import { Redirect } from "expo-router";

/** Visitors use the public Trade Fair Wala tabs; keep this hub as a redirect. */
export default function VisitorHub() {
  return <Redirect href="/(tabs)" />;
}
