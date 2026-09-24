import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { apiJson } from "@/lib/authFetch";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { kycDocTypeLabel } from "@/lib/kycDocLabels";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type KycItem = {
  id: string;
  docType: string;
  status: string;
  remarks: string | null;
  createdAt: string;
};

const ORGANIZER_DOCS = [
  { docType: "organizer_business_proof", label: "Business proof", required: true },
  { docType: "organizer_gst", label: "GST certificate", required: false },
  { docType: "organizer_pan", label: "PAN card", required: false },
];

const EXHIBITOR_DOCS = [{ docType: "exhibitor_id", label: "ID proof", required: false }];

const PROVIDER_DOCS = [
  { docType: "provider_business_proof", label: "Business proof", required: true },
  { docType: "provider_gst", label: "GST certificate", required: false },
];

function statusStyle(status: string) {
  if (status === "approved") return { bg: "#ecfdf5", color: colors.emeraldDark, label: "Approved" };
  if (status === "rejected") return { bg: "#fef2f2", color: "#ef4444", label: "Rejected" };
  if (status === "submitted") return { bg: "#fff7ed", color: "#ea580c", label: "Under review" };
  return { bg: colors.background, color: colors.textMuted, label: status };
}

function latestDocByType(items: KycItem[]) {
  const map = new Map<string, KycItem>();
  for (const item of items) {
    if (!map.has(item.docType)) map.set(item.docType, item);
  }
  return map;
}

function canUploadDocType(items: KycItem[], docType: string) {
  const existing = latestDocByType(items).get(docType);
  if (!existing) return true;
  return existing.status === "rejected";
}

export function RoleKycScreen({
  roleCode,
  title,
}: {
  roleCode: "ORGANIZER" | "EXHIBITOR" | "SERVICE_PROVIDER";
  title: string;
}) {
  const docs =
    roleCode === "ORGANIZER" ? ORGANIZER_DOCS : roleCode === "EXHIBITOR" ? EXHIBITOR_DOCS : PROVIDER_DOCS;
  const [items, setItems] = useState<KycItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [kycApproved, setKycApproved] = useState(false);

  const load = useCallback(async () => {
    const data = await apiJson<{ kyc: KycItem[] }>(`/kyc/me?roleCode=${encodeURIComponent(roleCode)}`);
    setItems(data.kyc ?? []);
    if (roleCode === "ORGANIZER") {
      const me = await apiJson<{ organizerKycApproved?: boolean }>("/auth/me");
      setKycApproved(Boolean(me.organizerKycApproved));
    }
  }, [roleCode]);

  useEffect(() => {
    void load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function pickAndUpload(docType: string) {
    if (!canUploadDocType(items, docType)) {
      Alert.alert("Already submitted", "This document is already under review. Wait for admin review before uploading again.");
      return;
    }
    Alert.alert("Upload document", "Choose source", [
      { text: "PDF / document", onPress: () => void uploadFromDocument(docType) },
      { text: "Photo library", onPress: () => void uploadFromPicker(docType, "library") },
      { text: "Camera", onPress: () => void uploadFromPicker(docType, "camera") },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function uploadFromDocument(docType: string) {
    const pick = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setBusy(docType);
    try {
      await uploadMultipart(
        "/kyc/documents/upload",
        { docType, roleCode },
        { uri: asset.uri, name: asset.name, type: asset.mimeType ?? "application/pdf" }
      );
      await load();
      Alert.alert("Uploaded", "Document submitted for review.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(null);
    }
  }

  async function uploadFromPicker(docType: string, source: "library" | "camera") {
    const perm =
      source === "camera"
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow access to continue.");
      return;
    }
    const result =
      source === "camera"
        ? await ImagePicker.launchCameraAsync({ quality: 0.85 })
        : await ImagePicker.launchImageLibraryAsync({ quality: 0.85 });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    await doUpload(docType, asset.uri, asset.fileName ?? "photo.jpg", asset.mimeType ?? "image/jpeg");
  }

  async function doUpload(docType: string, uri: string, name: string, type: string) {
    setBusy(docType);
    try {
      await uploadMultipart("/kyc/documents/upload", { docType, roleCode }, { uri, name, type });
      await load();
      Alert.alert("Uploaded", "Document submitted for review.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <ScreenShell title={title} subtitle="Verification documents">
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={title} subtitle={kycApproved ? "Verification complete" : "Upload documents for verification"} scroll onRefresh={load}>
      {kycApproved ? (
        <View style={styles.approvedBanner}>
          <Ionicons name="shield-checkmark" size={20} color={colors.emeraldDark} />
          <Text style={styles.approvedText}>
            Your KYC is approved. You do not need to upload documents again unless admin asks for an update.
          </Text>
        </View>
      ) : null}
      <Text style={styles.sectionTitle}>Submitted documents</Text>
      {items.length === 0 ? (
        <EmptyState
          icon="folder-open-outline"
          title="No documents yet"
          message="Upload verification documents below to get started."
          compact
        />
      ) : (
        items.map((k) => {
          const st = statusStyle(k.status);
          return (
            <View key={k.id} style={styles.docCard}>
              <View style={styles.docTop}>
                <View style={styles.docIcon}>
                  <Ionicons name="document-attach-outline" size={20} color={colors.emerald} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.docName}>{kycDocTypeLabel(k.docType)}</Text>
                  {k.remarks ? <Text style={styles.remarks}>{k.remarks}</Text> : null}
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {!kycApproved ? (
        <>
      <Text style={[styles.sectionTitle, { marginTop: spacing.lg }]}>Upload new</Text>
      {docs.map((d) => {
        const blocked = !canUploadDocType(items, d.docType);
        return (
        <Pressable
          key={d.docType}
          style={[styles.uploadCard, blocked && styles.uploadCardDisabled]}
          disabled={busy !== null || blocked}
          onPress={() => void pickAndUpload(d.docType)}
        >
          <View style={styles.uploadIcon}>
            <Ionicons name="cloud-upload-outline" size={22} color={colors.emerald} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadTitle}>
              {d.label}
              {d.required ? " *" : ""}
            </Text>
            <Text style={styles.uploadSub}>
              {busy === d.docType
                ? "Uploading…"
                : blocked
                  ? "Already submitted — under review"
                  : "Tap to upload PDF or photo"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </Pressable>
        );
      })}
        </>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: "800", color: colors.navy, marginBottom: spacing.sm },
  approvedBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: "#ecfdf5",
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  approvedText: { flex: 1, fontSize: 13, lineHeight: 19, color: colors.emeraldDark, fontWeight: "600" },
  empty: {
    alignItems: "center",
    padding: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  emptyText: { marginTop: spacing.sm, color: colors.textMuted },
  docCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  docTop: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  docName: { fontWeight: "700", color: colors.navy, textTransform: "capitalize" },
  remarks: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontWeight: "800", textTransform: "uppercase" },
  uploadCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  uploadCardDisabled: { opacity: 0.55 },
  uploadIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { fontWeight: "800", color: colors.navy, fontSize: 14 },
  uploadSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
});
