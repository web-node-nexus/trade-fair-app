import type { ReactNode } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import {
  initialWindowMetrics,
  SafeAreaProvider,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { modalBottomInset } from "@/lib/tabBarInsets";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  maxHeight?: `${number}%` | number;
  sheetStyle?: StyleProp<ViewStyle>;
};

function SheetContent({ onClose, title, children, footer, maxHeight, sheetStyle }: Omit<Props, "visible">) {
  const insets = useSafeAreaInsets();
  const bottomPad = modalBottomInset(insets.bottom);

  return (
    <Pressable style={styles.backdrop} onPress={onClose}>
      <Pressable
        style={[styles.sheet, { paddingBottom: bottomPad, maxHeight }, sheetStyle]}
        onPress={(e) => e.stopPropagation()}
      >
        <View style={styles.handle} />
        {title ? <Text style={styles.title}>{title}</Text> : null}
        {children}
        {footer}
      </Pressable>
    </Pressable>
  );
}

/** Bottom sheet with handle, safe-area padding above gesture / 3-button nav on all devices. */
export function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
  footer,
  maxHeight = "78%",
  sheetStyle,
}: Props) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <SheetContent
          onClose={onClose}
          title={title}
          footer={footer}
          maxHeight={maxHeight}
          sheetStyle={sheetStyle}
        >
          {children}
        </SheetContent>
      </SafeAreaProvider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.screen,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: "center",
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: spacing.md,
  },
});
