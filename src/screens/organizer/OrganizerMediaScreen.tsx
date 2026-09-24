import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams } from "expo-router";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { ZoomableImage } from "@/context/ImageZoomContext";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type MediaItem = { id: string; url: string; mediaType: string };

export function OrganizerMediaScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [rows, setRows] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");

  const load = useCallback(async () => {
    const data = await apiJson<{ media: MediaItem[] }>(`/organizer/events/${eventId}/media`);
    setRows(data.media ?? []);
  }, [eventId]);

  useEffect(() => {
    void load()
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function addByUrl() {
    if (!mediaUrl.trim()) {
      Alert.alert("Required", "Enter an image or video URL.");
      return;
    }
    setBusy(true);
    try {
      await apiJson(`/organizer/events/${eventId}/media`, {
        method: "POST",
        body: JSON.stringify({ url: mediaUrl.trim(), mediaType: "image" }),
      });
      setMediaUrl("");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function pickAndUpload(kind: "banner" | "gallery") {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85, mediaTypes: ImagePicker.MediaTypeOptions.Images });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setBusy(true);
    try {
      await uploadMultipart(
        `/organizer/events/${eventId}/media/upload?kind=${encodeURIComponent(kind)}`,
        {},
        { uri: asset.uri, name: asset.fileName ?? "photo.jpg", type: asset.mimeType ?? "image/jpeg" }
      );
      await load();
      Alert.alert("Uploaded", `${kind === "banner" ? "Banner" : "Gallery"} image added.`);
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    Alert.alert("Remove media?", undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            setBusy(true);
            try {
              await apiJson(`/organizer/events/${eventId}/media/${id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            } finally {
              setBusy(false);
            }
          })();
        },
      },
    ]);
  }

  return (
    <ScreenShell title="Event media" subtitle="Banners, gallery & URLs">
      <View style={styles.uploadRow}>
        <PrimaryButton
          label="Upload banner"
          variant="outline"
          compact
          disabled={busy}
          onPress={() => void pickAndUpload("banner")}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          label="Upload gallery"
          variant="outline"
          compact
          disabled={busy}
          onPress={() => void pickAndUpload("gallery")}
          style={{ flex: 1 }}
        />
      </View>
      <Text style={styles.label}>Or add by URL</Text>
      <TextInput
        style={styles.input}
        value={mediaUrl}
        onChangeText={setMediaUrl}
        placeholder="https://…"
        autoCapitalize="none"
      />
      <PrimaryButton label={busy ? "Adding…" : "Add URL"} variant="cta" disabled={busy} onPress={() => void addByUrl()} />

      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={rows}
          keyExtractor={(m) => m.id}
          style={{ marginTop: spacing.lg }}
          ListEmptyComponent={<EmptyState title="No media yet." compact />}
          renderItem={({ item }) => {
            const src = resolveMediaUrl(item.url);
            return (
              <View style={styles.card}>
                {src && item.mediaType === "image" ? (
                  <ZoomableImage uri={src} style={styles.thumb} contentFit="cover" />
                ) : null}
                <Text style={styles.url} numberOfLines={2}>
                  {item.url}
                </Text>
                <Pressable onPress={() => void remove(item.id)}>
                  <Text style={styles.danger}>Remove</Text>
                </Pressable>
              </View>
            );
          }}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  uploadRow: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  empty: { textAlign: "center", color: colors.textMuted, marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: { width: "100%", height: 140, borderRadius: radius.md, marginBottom: spacing.sm },
  url: { fontSize: 12, color: colors.textMuted },
  danger: { color: colors.cta, fontWeight: "700", marginTop: spacing.sm },
});
