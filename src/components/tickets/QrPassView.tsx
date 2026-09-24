import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  payload: string;
  title: string;
  subtitle?: string;
  size?: number;
};

export function QrPassView({ payload, title, subtitle, size = 220 }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.accentBar} />
      <Text style={styles.eyebrow}>Gate pass</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <View style={styles.qrWrap}>
        <QRCode value={payload} size={size} backgroundColor="#fff" color={colors.navy} />
      </View>
      <Text style={styles.hint}>Show this QR at the gate for entry</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl + 2,
    padding: spacing.xl,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    overflow: "hidden",
    ...cardShadow,
  },
  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.emerald,
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: "800",
    color: colors.emerald,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: "800", color: colors.navy, textAlign: "center", letterSpacing: -0.3 },
  sub: { marginTop: 6, fontSize: 14, color: colors.textMuted, textAlign: "center" },
  qrWrap: {
    marginTop: spacing.xl,
    padding: spacing.lg,
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(16,185,129,0.25)",
    ...cardShadow,
  },
  hint: { marginTop: spacing.lg, fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 18 },
});
