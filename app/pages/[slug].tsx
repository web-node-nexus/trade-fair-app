import { NativeMarketingScreen } from "@/screens/marketing/NativeMarketingScreen";
import { useLocalSearchParams } from "expo-router";

export default function MarketingSlugPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  return <NativeMarketingScreen slug={slug} />;
}
