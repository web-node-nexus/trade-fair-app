import { Platform } from "react-native";
import { spacing } from "@/theme/spacing";
import { WORKSPACE_BOTTOM_BAR_HEIGHT } from "@/components/workspace/WorkspaceBottomBar";

/** Visible tab bar content height (icons + labels), excluding safe-area inset. */
export const TAB_BAR_CONTENT_HEIGHT = 56;

/** Bottom padding for tab bar — gesture nav, 3-button nav, and iOS home indicator. */
export function tabBarBottomInset(insetsBottom: number): number {
  if (insetsBottom > 0) return insetsBottom;
  return Platform.OS === "android" ? 24 : 0;
}

export function tabBarTotalHeight(insetsBottom: number): number {
  return TAB_BAR_CONTENT_HEIGHT + tabBarBottomInset(insetsBottom);
}

/** Bottom sheets / modals — clears Android gesture bar even when Modal reports inset 0. */
export function modalBottomInset(insetsBottom: number): number {
  const inset = insetsBottom > 0 ? insetsBottom : Platform.OS === "android" ? 28 : 20;
  return inset + spacing.md;
}

/** Scroll content padding for stack/marketing screens (clears system nav bar). */
export function screenScrollBottomPad(insetsBottom: number): number {
  const inset = insetsBottom > 0 ? insetsBottom : Platform.OS === "android" ? 48 : 34;
  return inset + spacing.xxl + spacing.lg;
}

/** Scroll content padding above workspace bottom bar in dashboard routes. */
export function workspaceScrollBottomPad(insetsBottom: number): number {
  return WORKSPACE_BOTTOM_BAR_HEIGHT + tabBarBottomInset(insetsBottom) + spacing.lg;
}
