import { useState } from "react";
import { Alert, Linking, Pressable, StyleSheet, Text, View } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useRouter } from "expo-router";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { getApiBase } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { spacing } from "@/theme/spacing";

/** API enum values (lowercase) — matches backend contactRoleEnum */
const ROLES = [
  { value: "organizer", label: "Organizer" },
  { value: "exhibitor", label: "Exhibitor" },
  { value: "visitor", label: "Visitor" },
  { value: "service_provider", label: "Service Provider" },
  { value: "other", label: "Other" },
] as const;

const SUBJECTS = [
  "General inquiry",
  "Sales",
  "Support",
  "Partnership",
  "Other",
] as const;

const SUPPORT_EMAIL = "contact.tradefairwala@gmail.com";

export function ContactFormScreen() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [role, setRole] = useState<(typeof ROLES)[number]["value"]>("visitor");
  const [subject, setSubject] = useState<(typeof SUBJECTS)[number]>("General inquiry");
  const [eventName, setEventName] = useState("");
  const [message, setMessage] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [attachment, setAttachment] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const a = result.assets[0];
    setAttachment({ uri: a.uri, name: a.name, type: a.mimeType ?? "application/octet-stream" });
  }

  async function submit() {
    if (!fullName.trim() || !email.trim() || !mobile.trim() || !message.trim()) {
      Alert.alert("Required", "Name, email, mobile and message are required.");
      return;
    }
    if (!agreed) {
      Alert.alert("Agreement", "Please accept terms and privacy policy.");
      return;
    }
    setBusy(true);
    try {
      if (attachment) {
        const form = new FormData();
        form.append("fullName", fullName.trim());
        form.append("company", company.trim());
        form.append("email", email.trim().toLowerCase());
        form.append("mobile", mobile.trim());
        form.append("role", role);
        form.append("subject", subject);
        form.append("eventName", eventName.trim());
        form.append("message", message.trim());
        form.append("agreed", "true");
        form.append("attachment", {
          uri: attachment.uri,
          name: attachment.name,
          type: attachment.type,
        } as unknown as Blob);
        const res = await fetch(`${getApiBase()}/contact`, { method: "POST", body: form });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(j.message ?? "Submit failed");
        }
      } else {
        const res = await fetch(`${getApiBase()}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullName: fullName.trim(),
            company: company.trim() || null,
            email: email.trim().toLowerCase(),
            mobile: mobile.trim(),
            role,
            subject,
            eventName: eventName.trim() || null,
            message: message.trim(),
            agreed: true,
          }),
        });
        if (!res.ok) {
          const j = (await res.json().catch(() => ({}))) as { message?: string };
          throw new Error(j.message ?? "Submit failed");
        }
      }
      Alert.alert("Thank you", "Your message was sent. We will reply soon.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to send");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScreenShell
      title="Contact us"
      subtitle="Reach the Trade Fair Wala team"
      scroll
      onRefresh={async () => {}}
    >
      <TextField label="Full name" value={fullName} onChangeText={setFullName} />
      <TextField label="Company (optional)" value={company} onChangeText={setCompany} />
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField label="Mobile" value={mobile} onChangeText={setMobile} keyboardType="phone-pad" />
      <Text style={styles.label}>Your role</Text>
      <View style={styles.chips}>
        {ROLES.map((r) => (
          <Pressable
            key={r.value}
            style={[styles.chip, role === r.value && styles.chipOn]}
            onPress={() => setRole(r.value)}
          >
            <Text style={[styles.chipText, role === r.value && styles.chipTextOn]}>{r.label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.label}>Subject</Text>
      <View style={styles.chips}>
        {SUBJECTS.map((s) => (
          <Pressable
            key={s}
            style={[styles.chip, subject === s && styles.chipOn]}
            onPress={() => setSubject(s)}
          >
            <Text style={[styles.chipText, subject === s && styles.chipTextOn]}>{s}</Text>
          </Pressable>
        ))}
      </View>
      <TextField label="Event name (optional)" value={eventName} onChangeText={setEventName} />
      <TextField label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={5} />
      <Pressable onPress={() => void pickFile()} style={styles.attach}>
        <Text style={styles.attachText}>{attachment ? attachment.name : "+ Attach file (optional)"}</Text>
      </Pressable>
      <Pressable style={styles.checkRow} onPress={() => setAgreed((v) => !v)}>
        <View style={[styles.check, agreed && styles.checkOn]} />
        <Text style={styles.checkLabel}>
          I agree to the{" "}
          <Text style={styles.inlineLink} onPress={() => router.push("/pages/terms-of-service" as never)}>
            Terms
          </Text>
          ,{" "}
          <Text style={styles.inlineLink} onPress={() => router.push("/pages/privacy-policy" as never)}>
            Privacy Policy
          </Text>
          {" & "}
          <Text
            style={styles.inlineLink}
            onPress={() => router.push("/pages/payment-refund-policy" as never)}
          >
            Payment & Refund Policy
          </Text>
        </Text>
      </Pressable>
      <PrimaryButton
        label={busy ? "Sending…" : "Send message"}
        variant="cta"
        disabled={busy}
        onPress={() => void submit()}
      />

      <View style={styles.sidebar}>
        <Text style={styles.sidebarTitle}>Email</Text>
        <Pressable onPress={() => void Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}>
          <Text style={styles.sidebarLink}>{SUPPORT_EMAIL}</Text>
        </Pressable>
        <Text style={styles.sidebarTitle}>Support hours</Text>
        <Text style={styles.sidebarText}>Mon–Sat · 10:00 AM – 6:00 PM IST</Text>
        <Text style={styles.sidebarTitle}>Response time</Text>
        <Text style={styles.sidebarText}>We usually reply within 1–2 business days.</Text>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  label: { fontWeight: "700", color: colors.navy, marginBottom: spacing.sm, marginTop: spacing.sm },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.border },
  chipOn: { backgroundColor: colors.navy, borderColor: colors.navy },
  chipText: { fontSize: 12, fontWeight: "600", color: colors.text },
  chipTextOn: { color: "#fff" },
  attach: { marginVertical: spacing.md },
  attachText: { color: colors.emerald, fontWeight: "700", flexShrink: 1 },
  checkRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: spacing.md },
  check: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    marginTop: 2,
    flexShrink: 0,
  },
  checkOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  checkLabel: { flex: 1, fontSize: 13, lineHeight: 18, color: colors.textMuted },
  inlineLink: { color: colors.emerald, fontWeight: "700" },
  sidebar: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sidebarTitle: { fontWeight: "800", color: colors.navy, marginTop: spacing.sm, marginBottom: 2 },
  sidebarText: { fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 19 },
  sidebarLink: { color: colors.emerald, fontWeight: "700", marginTop: 6 },
});
