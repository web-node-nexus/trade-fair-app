import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Alert, Pressable, Text, TextInput, View} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { ZoomableImage } from "@/context/ImageZoomContext";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { adminStyles } from "./adminStyles";

const MAX_BANNERS = 10;

type Banner = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  active: boolean;
  sortOrder: number;
};

export function AdminBannersScreen() {
  const [items, setItems] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkEdits, setLinkEdits] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const data = await apiJson<{ banners: Banner[] }>("/admin/home-banners");
    setItems(data.banners ?? []);
    const edits: Record<string, string> = {};
    for (const b of data.banners ?? []) edits[b.id] = b.linkUrl ?? "";
    setLinkEdits(edits);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function pickAndUpload() {
    if (items.length >= MAX_BANNERS) {
      Alert.alert("Limit", `Maximum ${MAX_BANNERS} banners allowed.`);
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission", "Photo library access is required.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setBusy(true);
    try {
      const fields: Record<string, string> = {};
      if (linkUrl.trim()) fields.linkUrl = linkUrl.trim();
      await uploadMultipart(
        "/admin/home-banners/upload",
        fields,
        {
          uri: asset.uri,
          name: asset.fileName ?? "banner.jpg",
          type: asset.mimeType ?? "image/jpeg",
        }
      );
      setLinkUrl("");
      await load();
      Alert.alert("Uploaded", "Banner added.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveLink(id: string) {
    try {
      await apiJson(`/admin/home-banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ linkUrl: (linkEdits[id] ?? "").trim() }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function toggleActive(id: string, active: boolean) {
    try {
      await apiJson(`/admin/home-banners/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !active }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    }
  }

  async function remove(id: string) {
    Alert.alert("Remove banner?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await apiJson(`/admin/home-banners/${id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
            }
          })();
        },
      },
    ]);
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = items.findIndex((x) => x.id === id);
    if (idx < 0) return;
    const next = idx + dir;
    if (next < 0 || next >= items.length) return;
    const reordered = [...items];
    const [removed] = reordered.splice(idx, 1);
    reordered.splice(next, 0, removed);
    try {
      await apiJson("/admin/home-banners/reorder", {
        method: "PUT",
        body: JSON.stringify({ orderedIds: reordered.map((x) => x.id) }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Reorder failed");
    }
  }

  const header = (
    <View style={adminStyles.section}>
      <Text style={adminStyles.sectionTitle}>Add banner ({items.length}/{MAX_BANNERS})</Text>
      <TextInput style={adminStyles.input} value={linkUrl} onChangeText={setLinkUrl} placeholder="Optional link URL" autoCapitalize="none" />
      <PrimaryButton label={busy ? "Uploading…" : "Pick image & upload"} variant="cta" disabled={busy || items.length >= MAX_BANNERS} onPress={() => void pickAndUpload()} />
    </View>
  );

  return (
    <ScreenShell title="Home banners" subtitle="Promo slider images">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={items}
          keyExtractor={(b) => b.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No banners yet." compact />}
          renderItem={({ item, index }) => (
            <View style={adminStyles.card}>
              <ZoomableImage
                uri={resolveMediaUrl(item.imageUrl)}
                style={{ width: "100%", height: 120, borderRadius: 8, marginBottom: 8 }}
                contentFit="cover"
              />
              <Text style={adminStyles.sub}>Order {index + 1} · {item.active ? "Visible" : "Hidden"}</Text>
              <TextInput
                style={adminStyles.input}
                value={linkEdits[item.id] ?? ""}
                onChangeText={(v) => setLinkEdits((prev) => ({ ...prev, [item.id]: v }))}
                placeholder="Link URL"
                autoCapitalize="none"
                onBlur={() => void saveLink(item.id)}
              />
              <View style={adminStyles.row}>
                <Pressable style={adminStyles.chip} disabled={index === 0} onPress={() => void move(item.id, -1)}>
                  <Text style={adminStyles.chipText}>↑ Up</Text>
                </Pressable>
                <Pressable style={adminStyles.chip} disabled={index === items.length - 1} onPress={() => void move(item.id, 1)}>
                  <Text style={adminStyles.chipText}>↓ Down</Text>
                </Pressable>
                <Pressable style={adminStyles.chip} onPress={() => void toggleActive(item.id, item.active)}>
                  <Text style={adminStyles.chipText}>{item.active ? "Hide" : "Show"}</Text>
                </Pressable>
                <Pressable style={[adminStyles.chip, { borderColor: "#ef4444" }]} onPress={() => void remove(item.id)}>
                  <Text style={[adminStyles.chipText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
