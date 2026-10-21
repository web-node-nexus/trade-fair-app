import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Clipboard,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { LoadingView } from "@/components/ui/LoadingView";
import { apiJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { getWebBaseUrl } from "@/lib/webBaseUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Me = {
  id?: string;
  email: string;
  fullName: string;
  phone: string | null;
  phoneVerifiedAt: string | null;
  profilePhotoUrl?: string | null;
  roles?: string[];
  referralWallet?: {
    code: string;
    pointsBalance: number;
    pointsValueMinor: number;
    rewardPerReferral: number;
    minorPerPoint: number;
  } | null;
};

function withCacheBust(url: string): string {
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}t=${Date.now()}`;
}

export function AccountScreen() {
  const router = useRouter();
  const { refreshMe } = useAuth();
  const { t } = useI18n();
  const [me, setMe] = useState<Me | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [verifyBusy, setVerifyBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const load = useCallback(async () => {
    const d = await apiJson<Me>("/auth/me");
    setMe(d);
    setFullName(d.fullName ?? "");
    setPhone(d.phone ?? "");
    const resolved = resolveMediaUrl(d.profilePhotoUrl ?? null);
    setPhotoUrl(resolved ?? d.profilePhotoUrl ?? null);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  async function save() {
    setSaving(true);
    setMsg(null);
    try {
      const j = await apiJson<Me>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ fullName: fullName.trim(), phone: phone.trim() || null }),
      });
      setMe(j);
      setMsg("Profile updated");
      await refreshMe();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to change your profile picture.");
      return;
    }
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setPhotoBusy(true);
    setMsg(null);
    setPhotoUrl(asset.uri);
    try {
      const uploaded = await uploadMultipart(
        "/auth/me/profile-photo",
        {},
        {
          uri: asset.uri,
          name: asset.fileName ?? `profile-${Date.now()}.jpg`,
          type: asset.mimeType ?? "image/jpeg",
        },
        "profilePhoto"
      );
      const raw = typeof uploaded.profilePhotoUrl === "string" ? uploaded.profilePhotoUrl : null;
      if (raw) {
        const resolved = resolveMediaUrl(raw) ?? raw;
        setPhotoUrl(withCacheBust(resolved));
        setMe((prev) => (prev ? { ...prev, profilePhotoUrl: raw } : prev));
      } else {
        await load();
      }
      setMsg("Profile photo updated");
      await refreshMe();
    } catch (e) {
      await load();
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function requestPhoneOtp() {
    if (!phone.trim()) {
      Alert.alert("Phone required", "Save your phone number first.");
      return;
    }
    setVerifyBusy(true);
    try {
      await apiJson("/auth/phone/request-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim() }),
      });
      setOtpSent(true);
      Alert.alert("OTP sent", "Stub mode: use 123456");
    } catch (e) {
      Alert.alert("OTP", e instanceof Error ? e.message : "Request failed");
    } finally {
      setVerifyBusy(false);
    }
  }

  async function verifyPhoneOtp() {
    setVerifyBusy(true);
    try {
      const j = await apiJson<Me>("/auth/phone/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone: phone.trim(), otp: otp.trim() }),
      });
      setMe(j);
      setOtpSent(false);
      setOtp("");
      setMsg("Phone verified");
      await refreshMe();
    } catch (e) {
      Alert.alert("Verify failed", e instanceof Error ? e.message : "Invalid OTP");
    } finally {
      setVerifyBusy(false);
    }
  }

  if (loading) return <LoadingView label="Loading profile…" />;

  const verified = !!me?.phoneVerifiedAt;

  return (
    <ScreenShell title={t("account.title")} subtitle={t("account.languageHint")} scroll onRefresh={load}>
      <LanguageSwitcher />
      <View style={styles.photoRow}>
        <View style={styles.avatarWrap}>
          {photoUrl ? (
            <Image source={{ uri: photoUrl }} style={styles.avatar} contentFit="cover" />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarText}>{(fullName[0] ?? me?.email[0] ?? "?").toUpperCase()}</Text>
            </View>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.photoLabel}>{photoBusy ? "Uploading…" : "Profile photo"}</Text>
          <Text style={styles.photoHint}>JPG or PNG · tap Change photo</Text>
          <Pressable onPress={() => void pickPhoto()} disabled={photoBusy} hitSlop={8}>
            <Text style={styles.changePhoto}>{photoBusy ? "Please wait…" : "Change photo"}</Text>
          </Pressable>
        </View>
      </View>

      <TextField label={t("account.userId")} value={me?.id ?? "—"} editable={false} />
      <TextField label={t("account.email")} value={me?.email ?? ""} editable={false} />
      <TextField label={t("account.fullName")} value={fullName} onChangeText={setFullName} />
      <TextField label={t("account.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      {me?.referralWallet ? (
        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <Ionicons name="gift" size={20} color="#5b21b6" />
            <Text style={styles.walletTitle}>Refer & earn · {me.referralWallet.rewardPerReferral} pts</Text>
          </View>
          <Text style={styles.walletCode}>{me.referralWallet.code}</Text>
          <Text style={styles.walletHint}>
            Share code — earn {me.referralWallet.rewardPerReferral} points per friend (1 pt = 20 paise)
          </Text>
          <Text style={styles.walletBalance}>
            Balance: {me.referralWallet.pointsBalance} pts · ₹{(me.referralWallet.pointsValueMinor / 100).toFixed(2)}
          </Text>
          <View style={styles.walletActions}>
            <Pressable
              style={styles.walletBtn}
              onPress={() => {
                Clipboard.setString(me.referralWallet!.code);
                Alert.alert("Copied", "Referral code copied.");
              }}
            >
              <Text style={styles.walletBtnText}>Copy code</Text>
            </Pressable>
            <Pressable
              style={[styles.walletBtn, styles.walletBtnPrimary]}
              onPress={() => {
                const w = me.referralWallet!;
                void Share.share({
                  title: "Trade Fair Wala referral",
                  message: `Use my code ${w.code} on Trade Fair Wala — I get ${w.rewardPerReferral} points!\n${getWebBaseUrl()}/register?ref=${encodeURIComponent(w.code)}`,
                });
              }}
            >
              <Text style={[styles.walletBtnText, styles.walletBtnTextPrimary]}>Share</Text>
            </Pressable>
          </View>
          <Pressable onPress={() => router.push("/dashboard/referral" as never)}>
            <Text style={styles.walletLink}>Open referral rewards →</Text>
          </Pressable>
        </View>
      ) : null}

      {verified ? (
        <Text style={styles.verified}>Phone verified</Text>
      ) : (
        <View style={styles.verifyBox}>
          <Text style={styles.verifyTitle}>Verify phone</Text>
          {!otpSent ? (
            <PrimaryButton
              label={verifyBusy ? "Sending…" : "Send OTP"}
              variant="outline"
              disabled={verifyBusy}
              onPress={() => void requestPhoneOtp()}
            />
          ) : (
            <>
              <TextField label="OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" />
              <PrimaryButton
                label={verifyBusy ? "Verifying…" : "Verify OTP"}
                disabled={verifyBusy}
                onPress={() => void verifyPhoneOtp()}
              />
            </>
          )}
        </View>
      )}

      {me?.roles?.length ? (
        <Text style={styles.roles}>Roles: {me.roles.join(", ")}</Text>
      ) : null}

      {msg ? <Text style={styles.msg}>{msg}</Text> : null}
      <PrimaryButton label={saving ? t("common.saving") : t("common.save")} onPress={() => void save()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  photoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarWrap: { width: 64, height: 64, borderRadius: 32, overflow: "hidden" },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  avatarFallback: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  photoLabel: { fontWeight: "700", color: colors.navy },
  photoHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  changePhoto: { marginTop: 6, fontSize: 13, fontWeight: "700", color: colors.emerald },
  verified: { color: colors.emerald, fontWeight: "700", marginBottom: spacing.md },
  verifyBox: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  verifyTitle: { fontWeight: "700", color: colors.navy, marginBottom: spacing.sm },
  roles: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  walletCard: {
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: "rgba(139,92,246,0.08)",
    borderWidth: 1,
    borderColor: "rgba(139,92,246,0.25)",
  },
  walletHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  walletTitle: { fontWeight: "800", color: colors.navy, fontSize: 14 },
  walletCode: {
    marginTop: 8,
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: "#5b21b6",
    fontFamily: "monospace",
  },
  walletHint: { marginTop: 4, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  walletBalance: { marginTop: 6, fontSize: 13, fontWeight: "600", color: colors.navy },
  walletActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  walletBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.emerald,
    alignItems: "center",
  },
  walletBtnPrimary: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  walletBtnText: { fontWeight: "700", color: colors.emerald, fontSize: 13 },
  walletBtnTextPrimary: { color: "#fff" },
  walletLink: { marginTop: spacing.sm, fontSize: 13, fontWeight: "700", color: colors.emerald },
  msg: { marginBottom: spacing.md, color: colors.emerald, fontWeight: "600" },
});
