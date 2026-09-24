import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import {
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Image, type ImageContentFit } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SW, height: SH } = Dimensions.get("window");

type ImageZoomContextValue = {
  openImage: (uri: string) => void;
};

const ImageZoomContext = createContext<ImageZoomContextValue | null>(null);

export function ImageZoomProvider({ children }: { children: ReactNode }) {
  const [uri, setUri] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  const openImage = useCallback((nextUri: string) => {
    if (nextUri.trim()) setUri(nextUri);
  }, []);

  const close = useCallback(() => setUri(null), []);

  return (
    <ImageZoomContext.Provider value={{ openImage }}>
      {children}
      <Modal visible={uri != null} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <Pressable style={[styles.closeBtn, { top: insets.top + 8 }]} onPress={close} hitSlop={12}>
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {uri ? (
            Platform.OS === "ios" ? (
              <ScrollView
                style={styles.zoomScroll}
                contentContainerStyle={styles.zoomContent}
                maximumZoomScale={4}
                minimumZoomScale={1}
                centerContent
                showsHorizontalScrollIndicator={false}
                showsVerticalScrollIndicator={false}
              >
                <Image source={{ uri }} style={styles.zoomImage} contentFit="contain" />
              </ScrollView>
            ) : (
              <View style={styles.androidWrap}>
                <Image source={{ uri }} style={styles.androidImage} contentFit="contain" />
                <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close preview" />
              </View>
            )
          ) : null}
        </View>
      </Modal>
    </ImageZoomContext.Provider>
  );
}

export function useImageZoom(): ImageZoomContextValue {
  const ctx = useContext(ImageZoomContext);
  if (!ctx) throw new Error("useImageZoom must be used within ImageZoomProvider");
  return ctx;
}

type ZoomableImageProps = {
  uri: string | null | undefined;
  style?: object;
  contentFit?: ImageContentFit;
};

/** Tap image to open full-screen preview (pinch zoom on iOS). */
export function ZoomableImage({ uri, style, contentFit = "cover" }: ZoomableImageProps) {
  const { openImage } = useImageZoom();
  const src = uri?.trim();
  if (!src) return null;

  return (
    <Pressable onPress={() => openImage(src)} accessibilityRole="imagebutton" accessibilityLabel="View image">
      <Image source={{ uri: src }} style={style} contentFit={contentFit} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.92)",
    justifyContent: "center",
    alignItems: "center",
  },
  closeBtn: {
    position: "absolute",
    right: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  zoomScroll: {
    width: SW,
    height: SH,
  },
  zoomContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  zoomImage: {
    width: SW,
    height: SH * 0.82,
  },
  androidWrap: {
    width: SW,
    height: SH * 0.85,
    justifyContent: "center",
    alignItems: "center",
  },
  androidImage: {
    width: SW,
    height: SH * 0.85,
  },
});
