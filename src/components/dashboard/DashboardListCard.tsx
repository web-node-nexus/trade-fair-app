import { Pressable, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { cardShadow } from "@/theme/cardShadow";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  amount?: string;
  status?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  iconBg?: string;
  imageUrl?: string | null;
  onPress?: () => void;
  style?: ViewStyle;
};

export function DashboardListCard({
  title,
  subtitle,
  meta,
  amount,
  status,
  icon = "document-text-outline",
  iconColor = colors.emerald,
  iconBg = "rgba(16,185,129,0.12)",
  imageUrl,
  onPress,
  style,
}: Props) {
  const thumb = imageUrl ? (
    <Image source={{ uri: imageUrl }} style={styles.thumb} contentFit="cover" transition={200} />
  ) : (
    <View style={[styles.iconWrap, { backgroundColor: iconBg }]}>
      <Ionicons name={icon} size={22} color={iconColor} />
    </View>
  );

  const body = (
    <>
      {thumb}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.subtitle} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {amount ? <Text style={styles.amount}>{amount}</Text> : null}
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
        {status ? (
          <View style={styles.badgeRow}>
            <StatusBadge label={status} />
          </View>
        ) : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textMuted} /> : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={[styles.card, style]}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg + 2,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,31,61,0.06)",
    ...cardShadow,
  },
  pressed: { opacity: 0.92, transform: [{ scale: 0.992 }] },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.navyLight,
  },
  content: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: "800", color: colors.navy, lineHeight: 20 },
  subtitle: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },
  amount: { fontSize: 17, fontWeight: "800", color: colors.cta, marginTop: 6 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  badgeRow: { marginTop: 8 },
});
