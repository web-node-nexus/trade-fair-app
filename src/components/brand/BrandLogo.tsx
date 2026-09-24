import { Image, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

const TFW_LOGO = require("../../../assets/tfw-logo.png");

export const BRAND_TAGLINE = "India's Exhibition Marketplace";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg" | "auth";
  showTagline?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
};

const sizeMap = {
  sm: { width: 48, height: 48, tagline: 10 },
  md: { width: 56, height: 56, tagline: 11 },
  lg: { width: 68, height: 68, tagline: 12 },
  /** Full mark + wordmark for login / register headers */
  auth: { width: 132, height: 102, tagline: 12 },
} as const;

export function BrandLogo({ size = "md", showTagline = true, onPress, style }: BrandLogoProps) {
  const s = sizeMap[size];

  const content = (
    <View style={[styles.col, style]}>
      <Image
        source={TFW_LOGO}
        style={{ width: s.width, height: s.height }}
        resizeMode="contain"
        accessibilityLabel="Trade Fair Wala"
      />
      {showTagline ? <Text style={[styles.tagline, { fontSize: s.tagline }]}>{BRAND_TAGLINE}</Text> : null}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Trade Fair Wala home">
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  col: { alignItems: "flex-start", gap: 0 },
  tagline: { marginTop: -2, color: colors.textMuted, fontWeight: "500", lineHeight: 12 },
});
