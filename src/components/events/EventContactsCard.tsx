import { Linking, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { EventContact } from "@/utils/eventContacts";
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
      <Ionicons name={icon} size={16} color={colors.emerald} />
      <View style={{ flex: 1 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={[styles.rowValue, link && styles.rowLink]}>{value}</Text>
      </View>
    </View>
  );
  if (onPress) return <Pressable onPress={onPress}>{inner}</Pressable>;
  return inner;
}

function ContactBlock({ contact }: { contact: EventContact }) {
  return (
    <View style={styles.card}>
      {contact.roleLabel ? <Text style={styles.role}>{contact.roleLabel}</Text> : null}
      <Text style={styles.name}>{contact.name}</Text>
      <Row
        icon="call-outline"
        label="Phone"
        value={contact.phone}
        onPress={() => void Linking.openURL(`tel:${contact.phone}`)}
        link
      />
      {contact.email ? (
        <Row
          icon="mail-outline"
          label="Email"
          value={contact.email}
          onPress={() => void Linking.openURL(`mailto:${contact.email}`)}
          link
        />
      ) : null}
    </View>
  );
}

function OrganizerBlock({ organizer }: { organizer: EventOrganizer }) {
  return (
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
  );
}

export function EventContactsCard({
  contacts,
  organizer,
  organizerVerified,
}: {
  contacts?: EventContact[] | null;
  organizer?: EventOrganizer | null;
  organizerVerified?: boolean;
}) {
  const list = (contacts ?? []).filter((c) => c.name?.trim() && c.phone?.trim());
  if (!list.length && !organizer) return null;
  const verified = Boolean(organizerVerified ?? organizer?.verified);

  return (
    <View style={styles.wrap}>
      <View style={styles.headingRow}>
        <Text style={styles.heading}>{list.length ? "Event contacts" : "Organiser contact"}</Text>
        {verified ? (
          <View style={styles.verifiedPill}>
            <Ionicons name="shield-checkmark" size={12} color="#fff" />
            <Text style={styles.verifiedPillText}>Verified</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.hint}>Call or email — no login needed</Text>
      {list.length ?
        list.map((c) => <ContactBlock key={c.id ?? `${c.name}-${c.phone}`} contact={c} />)
      : organizer ?
        <OrganizerBlock organizer={organizer} />
      : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: spacing.lg },
  headingRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8 },
  heading: { fontSize: 18, fontWeight: "800", color: colors.navy },
  verifiedPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.emerald,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  verifiedPillText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  hint: { fontSize: 13, color: colors.textMuted, marginTop: 4, marginBottom: spacing.sm },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  role: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.emerald,
    textTransform: "uppercase",
  },
  name: { fontSize: 16, fontWeight: "700", color: colors.navy },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  rowLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted, textTransform: "uppercase" },
  rowValue: { fontSize: 15, fontWeight: "600", color: colors.navy, marginTop: 2 },
  rowLink: { color: colors.cta },
});
