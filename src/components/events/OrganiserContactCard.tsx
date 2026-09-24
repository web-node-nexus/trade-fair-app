import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EventOrganizer } from "@/api/types";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

function Row({
  icon,
  label,
  value,
  onPress,
  link,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onPress?: () => void;
  link?: boolean;
}) {
  const inner = (
    <View style={styles.row}>
      <Ionicons name={icon} size={18} color={colors.emeraldDark} />
      <View style={{ flex: 1 }}>
        <Text style={styles.label}>{label}</Text>
        <Text style={[styles.value, link && styles.link]}>{value}</Text>
      </View>
    </View>
  );
  return onPress ? <Pressable onPress={onPress}>{inner}</Pressable> : inner;
}

export function OrganiserContactCard({ organizer }: { organizer: EventOrganizer }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.heading}>Organiser contact</Text>
      <Text style={styles.hint}>Call or email — no login needed</Text>
      <View style={styles.card}>
        <Row icon="person-outline" label="Name" value={organizer.name || "—"} />
        <Row
          icon="mail-outline"
          label="Email"
          value={organizer.email || "Not provided"}
          onPress={organizer.email ? () => void Linking.openURL(`mailto:${organizer.email}`) : undefined}
          link={Boolean(organizer.email)}
        />
        <Row
          icon="call-outline"
          label="Phone"
          value={organizer.phone || "Not provided"}
          onPress={organizer.phone ? () => void Linking.openURL(`tel:${organizer.phone}`) : undefined}
          link={Boolean(organizer.phone)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  heading: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: 4 },
  hint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  card: {
    backgroundColor: "#ecfdf5",
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#6ee7b7",
    gap: spacing.md,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: spacing.sm },
  label: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  value: { marginTop: 2, fontSize: 15, fontWeight: "700", color: colors.navy },
  link: { color: colors.cta },
});
