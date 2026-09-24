import { Platform } from "react-native";
import {
  KeyboardAwareScrollView as LibKeyboardAwareScrollView,
  type KeyboardAwareScrollViewProps,
} from "react-native-keyboard-aware-scroll-view";
import { WORKSPACE_BOTTOM_BAR_HEIGHT } from "@/components/workspace/WorkspaceBottomBar";
import { useWorkspaceNavOptional } from "@/context/WorkspaceNavContext";

type Props = KeyboardAwareScrollViewProps & {
  /** Extra lift when a sticky footer sits above the keyboard (e.g. wizard Next button). */
  stickyFooterHeight?: number;
};

export function KeyboardAwareScrollView({
  extraScrollHeight,
  extraHeight,
  viewIsInsideTabBar,
  stickyFooterHeight = 0,
  enableOnAndroid = true,
  enableAutomaticScroll = true,
  keyboardShouldPersistTaps = "handled",
  showsVerticalScrollIndicator = false,
  enableResetScrollToCoords = false,
  ...props
}: Props) {
  const ws = useWorkspaceNavOptional();
  const inWorkspace = Boolean(ws?.active);
  const tabBarOffset = viewIsInsideTabBar ?? inWorkspace ? WORKSPACE_BOTTOM_BAR_HEIGHT : 0;
  const scrollLift = (extraScrollHeight ?? 20) + stickyFooterHeight;

  return (
    <LibKeyboardAwareScrollView
      enableOnAndroid={enableOnAndroid}
      enableAutomaticScroll={enableAutomaticScroll}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      enableResetScrollToCoords={enableResetScrollToCoords}
      viewIsInsideTabBar={viewIsInsideTabBar ?? inWorkspace}
      extraScrollHeight={scrollLift + (inWorkspace ? tabBarOffset * 0.25 : 0)}
      extraHeight={extraHeight ?? (Platform.OS === "android" ? 140 + stickyFooterHeight : undefined)}
      {...props}
    />
  );
}
