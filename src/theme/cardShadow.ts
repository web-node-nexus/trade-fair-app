import { Platform, ViewStyle } from "react-native";
import { colors } from "@/theme/colors";

export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
  },
  android: { elevation: 3 },
  default: {},
}) as ViewStyle;

export const cardShadowSoft: ViewStyle = Platform.select({
  ios: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  android: { elevation: 2 },
  default: {},
}) as ViewStyle;
