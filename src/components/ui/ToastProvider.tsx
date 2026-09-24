import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { registerToastHandlers } from "@/lib/toastBridge";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ToastType = "error" | "success" | "info";

type ToastPayload = {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
};

type ToastContextValue = {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  error: "alert-circle",
  success: "checkmark-circle",
  info: "information-circle",
};

const ACCENTS: Record<ToastType, string> = {
  error: "#ef4444",
  success: colors.emerald,
  info: colors.navy,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastPayload | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -12, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [opacity, translateY]);

  const show = useCallback(
    (payload: ToastPayload) => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      setToast(payload);
      opacity.setValue(0);
      translateY.setValue(-12);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
      hideTimer.current = setTimeout(hide, payload.duration ?? 3500);
    },
    [hide, opacity, translateY]
  );

  const showError = useCallback(
    (message: string, title = "Error") => show({ type: "error", title, message }),
    [show]
  );
  const showSuccess = useCallback(
    (message: string, title = "Success") => show({ type: "success", title, message, duration: 2500 }),
    [show]
  );
  const showInfo = useCallback(
    (message: string, title = "Info") => show({ type: "info", title, message }),
    [show]
  );

  useEffect(() => {
    registerToastHandlers({ showError, showSuccess, showInfo });
  }, [showError, showSuccess, showInfo]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, []);

  const value: ToastContextValue = { showError, showSuccess, showInfo };

  registerToastHandlers(value);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[
            styles.host,
            { top: insets.top + spacing.sm, opacity, transform: [{ translateY }] },
          ]}
        >
          <Pressable style={[styles.toast, { borderLeftColor: ACCENTS[toast.type] }]} onPress={hide}>
            <Ionicons name={ICONS[toast.type]} size={22} color={ACCENTS[toast.type]} />
            <View style={styles.copy}>
              <Text style={styles.title}>{toast.title}</Text>
              {toast.message ? <Text style={styles.message}>{toast.message}</Text> : null}
            </View>
            <Ionicons name="close" size={18} color={colors.textMuted} />
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  host: {
    position: "absolute",
    left: spacing.screen,
    right: spacing.screen,
    zIndex: 9999,
    elevation: 20,
  },
  toast: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  copy: { flex: 1 },
  title: { fontSize: 14, fontWeight: "800", color: colors.navy },
  message: { marginTop: 2, fontSize: 13, color: colors.textMuted, lineHeight: 18 },
});
