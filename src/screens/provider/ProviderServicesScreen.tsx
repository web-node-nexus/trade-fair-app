import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { DashboardListCard } from "@/components/dashboard/DashboardListCard";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { normalizePlainText } from "@/lib/normalizePlainText";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";
import { appFontFamily } from "@/theme/typography";

type Service = {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  categoryName?: string;
  priceMinor?: string;
};

export function ProviderServicesScreen() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [editing, setEditing] = useState<Service | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("1000");
  const [categoryId, setCategoryId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [portfolioRaw, setPortfolioRaw] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [svc, cats] = await Promise.all([
      apiJson<{ services: Service[] }>("/provider/services"),
      apiJson<{ categories: { id: number; name: string }[] }>("/service-categories").catch(() => ({
        categories: [] as { id: number; name: string }[],
      })),
    ]);
    setServices(svc.services ?? []);
    setCategories(cats.categories ?? []);
    if (!categoryId && cats.categories?.[0]) setCategoryId(String(cats.categories[0].id));
  }, [categoryId]);

  useEffect(() => {
    void load()
      .catch(() => setServices([]))
      .finally(() => setLoading(false));
  }, [load]);

  function openEdit(s: Service) {
    setEditing(s);
    setTitle(s.title);
    setDescription(s.description ?? "");
    setPrice(s.priceMinor ? String(Number(s.priceMinor) / 100) : "1000");
    setStatus(s.status === "published" ? "published" : "draft");
    setPortfolioRaw("");
    setServiceArea("");
    setLeadTimeDays("");
    setDeliveryNotes("");
    setMode("edit");
  }

  function portfolioUrls() {
    return portfolioRaw
      .split(/\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  async function saveCreate() {
    const minor = Math.round(Number(price) * 100);
    if (!title.trim() || !categoryId || !Number.isFinite(minor)) {
      Alert.alert("Required", "Title, category, and valid price are required.");
      return;
    }
    const ltRaw = leadTimeDays.trim();
    const lt = ltRaw === "" ? null : Number(ltRaw);
    if (lt !== null && (!Number.isFinite(lt) || lt < 0 || lt > 365)) {
      Alert.alert("Lead time", "Enter 0–365 days or leave blank.");
      return;
    }
    const urls = portfolioUrls();
    setBusy(true);
    try {
      await apiJson("/provider/services", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          categoryId: Number(categoryId),
          priceMinor: minor,
          portfolioUrls: urls.length ? urls : null,
          serviceArea: serviceArea.trim() || null,
          leadTimeDays: lt,
          deliveryNotes: deliveryNotes.trim() || null,
          status: "published",
        }),
      });
      setMode("list");
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveEdit() {
    if (!editing) return;
    const minor = Math.round(Number(price) * 100);
    const ltRaw = leadTimeDays.trim();
    const lt = ltRaw === "" ? null : Number(ltRaw);
    const urls = portfolioUrls();
    setBusy(true);
    try {
      await apiJson(`/provider/services/${editing.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          priceMinor: minor,
          status,
          portfolioUrls: urls.length ? urls : null,
          serviceArea: serviceArea.trim() || null,
          leadTimeDays: lt,
          deliveryNotes: deliveryNotes.trim() || null,
        }),
      });
      setMode("list");
      setEditing(null);
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  async function deleteService(s: Service) {
    Alert.alert("Delete service?", `Remove "${s.title}" from your listings?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await apiJson(`/provider/services/${s.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "draft" }),
              });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
            }
          })();
        },
      },
    ]);
  }

  async function unpublish(s: Service) {
    Alert.alert("Unpublish service?", s.title, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Set to draft",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await apiJson(`/provider/services/${s.id}`, {
                method: "PATCH",
                body: JSON.stringify({ status: "draft" }),
              });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Failed");
            }
          })();
        },
      },
    ]);
  }

  async function uploadImage(serviceId: string) {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setBusy(true);
    try {
      await uploadMultipart(
        `/provider/services/${serviceId}/images/upload`,
        {},
        {
          uri: asset.uri,
          name: asset.fileName ?? "service.jpg",
          type: asset.mimeType ?? "image/jpeg",
        }
      );
      await load();
      Alert.alert("Uploaded", "Image added to service gallery.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  if (mode === "create" || mode === "edit") {
    return (
      <ScreenShell title={mode === "create" ? "New service" : "Edit service"} scroll>
        <View style={styles.formCard}>
          <SectionHeader title="Basic details" />
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={(t) => setTitle(normalizePlainText(t))}
            placeholder="Service title"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={(t) => setDescription(normalizePlainText(t))}
            multiline
            textAlignVertical="top"
            placeholder="Describe your service"
            placeholderTextColor={colors.textMuted}
          />
          {mode === "create" ? (
            <>
              <Text style={styles.label}>Category ID</Text>
              <TextInput style={styles.input} value={categoryId} onChangeText={setCategoryId} keyboardType="number-pad" />
            </>
          ) : (
            <Pressable
              style={styles.statusChip}
              onPress={() => setStatus((s) => (s === "published" ? "draft" : "published"))}
            >
              <Text style={styles.statusText}>Status: {status}</Text>
            </Pressable>
          )}
          <Text style={styles.label}>Price (INR)</Text>
          <TextInput style={styles.input} value={price} onChangeText={setPrice} keyboardType="decimal-pad" />
        </View>

        <View style={styles.formCard}>
          <SectionHeader title="Delivery & portfolio" />
          <Text style={styles.label}>Portfolio URLs (one per line)</Text>
          <TextInput
            style={[styles.input, styles.textAreaSm]}
            value={portfolioRaw}
            onChangeText={setPortfolioRaw}
            multiline
            textAlignVertical="top"
            placeholder="https://…"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Service area</Text>
          <TextInput
            style={styles.input}
            value={serviceArea}
            onChangeText={(t) => setServiceArea(normalizePlainText(t))}
            placeholder="Pan India, Delhi NCR…"
            placeholderTextColor={colors.textMuted}
          />
          <Text style={styles.label}>Lead time (days)</Text>
          <TextInput style={styles.input} value={leadTimeDays} onChangeText={setLeadTimeDays} keyboardType="number-pad" />
          <Text style={styles.label}>Delivery notes</Text>
          <TextInput
            style={[styles.input, styles.textAreaSm]}
            value={deliveryNotes}
            onChangeText={(t) => setDeliveryNotes(normalizePlainText(t))}
            multiline
            textAlignVertical="top"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        {mode === "edit" && editing ? (
          <PrimaryButton label="Upload cover / gallery image" variant="outline" disabled={busy} onPress={() => void uploadImage(editing.id)} />
        ) : null}
        <PrimaryButton
          label={busy ? "Saving…" : mode === "create" ? "Create service" : "Save changes"}
          variant="cta"
          disabled={busy}
          onPress={() => void (mode === "create" ? saveCreate() : saveEdit())}
        />
        <Pressable onPress={() => { setMode("list"); setEditing(null); }} style={styles.cancelWrap}>
          <Text style={styles.link}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="My services" subtitle="Marketplace listings">
      <Pressable style={styles.addBtn} onPress={() => { setTitle(""); setDescription(""); setMode("create"); }}>
        <Ionicons name="add-circle" size={22} color={colors.emerald} />
        <Text style={styles.addText}>Add service</Text>
      </Pressable>
      {loading ? (
        <ActivityIndicator color={colors.emerald} style={styles.loader} />
      ) : (
        <RefreshableFlatList
          data={services}
          keyExtractor={(s) => s.id}
          onRefresh={load}
          contentContainerStyle={styles.list}
          ListEmptyComponent={<EmptyState title="No services yet." compact />}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <DashboardListCard
                title={item.title}
                subtitle={item.categoryName ?? "Marketplace service"}
                amount={item.priceMinor ? formatInrFromMinor(item.priceMinor) : undefined}
                status={item.status}
                icon="construct-outline"
                iconColor={colors.navy}
                iconBg="rgba(10,31,61,0.08)"
              />
              <View style={styles.actions}>
                <Pressable style={styles.actionBtn} onPress={() => openEdit(item)}>
                  <Text style={styles.action}>Edit</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => void uploadImage(item.id)}>
                  <Text style={styles.action}>Upload image</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => void unpublish(item)}>
                  <Text style={[styles.action, styles.actionDanger]}>Unpublish</Text>
                </Pressable>
                <Pressable style={styles.actionBtn} onPress={() => void deleteService(item)}>
                  <Text style={[styles.action, styles.actionDanger]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  loader: { marginTop: 40 },
  list: { paddingBottom: spacing.xl },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.lg,
    paddingVertical: spacing.sm,
  },
  addText: { color: colors.emerald, fontWeight: "800", fontSize: 15 },
  listItem: { marginBottom: spacing.xs },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
  },
  actionBtn: { paddingVertical: 4 },
  action: { color: colors.emerald, fontWeight: "700", fontSize: 13 },
  actionDanger: { color: colors.cta },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6, fontSize: 13 },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.background,
    fontSize: 15,
    fontFamily: appFontFamily,
    color: colors.navy,
  },
  textArea: { minHeight: 90 },
  textAreaSm: { minHeight: 70 },
  link: { color: colors.emerald, fontWeight: "700", textAlign: "center" },
  cancelWrap: { marginTop: spacing.md, marginBottom: spacing.lg },
  statusChip: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.navy,
    marginBottom: spacing.md,
  },
  statusText: { color: "#fff", fontWeight: "700", fontSize: 12 },
});
