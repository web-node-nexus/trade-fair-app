import { useState } from "react";
import { LayoutAnimation, Platform, Pressable, ScrollView, StyleSheet, Text, UIManager, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { FAQ_SECTIONS } from "@/data/faqContent";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { screenScrollBottomPad } from "@/lib/tabBarInsets";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function FaqAccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.item}>
      <Pressable
        style={styles.itemHead}
        onPress={() => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setOpen((v) => !v);
        }}
      >
        <Text style={styles.question}>{question}</Text>
        <Ionicons name={open ? "chevron-up" : "chevron-down"} size={18} color={colors.emerald} />
      </Pressable>
      {open ? <Text style={styles.answer}>{answer}</Text> : null}
    </View>
  );
}

export function FaqScreen() {
  const insets = useSafeAreaInsets();
  const { refreshControl } = usePullToRefresh(async () => {});
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{
        paddingTop: insets.top + spacing.lg,
        paddingBottom: screenScrollBottomPad(insets.bottom),
        paddingHorizontal: spacing.screen,
      }}
      refreshControl={refreshControl}
    >
      <Text style={styles.title}>Frequently Asked Questions</Text>
      <Text style={styles.subtitle}>Organizers, exhibitors, visitors & service providers</Text>
      {FAQ_SECTIONS.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item) => (
            <FaqAccordionItem key={item.question} question={item.question} answer={item.answer} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 26, fontWeight: "800", color: colors.navy, letterSpacing: -0.3 },
  subtitle: { marginTop: 6, fontSize: 14, color: colors.textMuted, lineHeight: 20, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: colors.emeraldDark, marginBottom: spacing.sm },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  itemHead: { flexDirection: "row", alignItems: "center", gap: spacing.sm, padding: spacing.md },
  question: { flex: 1, fontSize: 14, fontWeight: "700", color: colors.navy, lineHeight: 20 },
  answer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 21,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
});
