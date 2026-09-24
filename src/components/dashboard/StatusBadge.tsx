import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import { radius } from "@/theme/spacing";

type Tone = "success" | "warning" | "danger" | "neutral" | "info";

const TONES: Record<Tone, { bg: string; text: string }> = {
  success: { bg: "#d1fae5", text: "#065f46" },
  warning: { bg: "#fef3c7", text: "#92400e" },
  danger: { bg: "#fee2e2", text: "#b91c1c" },
  neutral: { bg: "#f1f5f9", text: "#475569" },
  info: { bg: "#dbeafe", text: "#1d4ed8" },
};

export function statusTone(raw: string): Tone {
  const s = raw.toLowerCase();
  if (["captured", "paid", "confirmed", "published", "active", "completed", "approved"].some((x) => s.includes(x))) {
    return "success";
  }
  if (["pending", "draft", "processing", "awaiting"].some((x) => s.includes(x))) {
    return "warning";
  }
  if (["cancelled", "canceled", "failed", "rejected", "refunded"].some((x) => s.includes(x))) {
    return "danger";
  }
  if (["used"].some((x) => s.includes(x))) return "neutral";
  return "info";
}

type Props = {
  label: string;
  tone?: Tone;
};

export function StatusBadge({ label, tone = statusTone(label) }: Props) {
  const palette = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: palette.bg }]}>
      <Text style={[styles.text, { color: palette.text }]}>{label.replace(/_/g, " ")}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  text: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
});
