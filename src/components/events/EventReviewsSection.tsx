import { useState } from "react";
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  reviewerName: string;
  createdAt: string;
};

type Props = {
  eventId: string;
  reviews: Review[];
  reviewsOpen: boolean;
  onSubmitted: () => void;
};

export function EventReviewsSection({ eventId, reviews, reviewsOpen, onSubmitted }: Props) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);

  const avg =
    reviews.length > 0
      ? (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length).toFixed(1)
      : null;

  async function submit() {
    setBusy(true);
    try {
      await apiJson(`/events/${eventId}/reviews`, {
        method: "POST",
        body: JSON.stringify({ rating, comment: comment.trim() || null }),
      });
      setComment("");
      onSubmitted();
      Alert.alert("Thank you", "Your review was submitted.");
    } catch (e) {
      Alert.alert("Review", e instanceof Error ? e.message : "Could not submit review");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        Reviews {avg ? `· ${avg} ★` : ""}
      </Text>

      {reviews.length === 0 ? (
        <Text style={styles.muted}>No reviews yet.</Text>
      ) : (
        reviews.slice(0, 5).map((r) => (
          <View key={r.id} style={styles.reviewCard}>
            <View style={styles.reviewHead}>
              <Text style={styles.reviewer}>{r.reviewerName}</Text>
              <Text style={styles.stars}>{"★".repeat(r.rating)}</Text>
            </View>
            {r.comment ? <Text style={styles.comment}>{r.comment}</Text> : null}
            <Text style={styles.date}>{new Date(r.createdAt).toLocaleDateString()}</Text>
          </View>
        ))
      )}

      {reviewsOpen ? (
        <View style={styles.form}>
          <Text style={styles.formTitle}>Write a review</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
                <Ionicons
                  name={n <= rating ? "star" : "star-outline"}
                  size={28}
                  color={n <= rating ? "#f59e0b" : colors.textMuted}
                />
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder="Share your experience (optional)"
            multiline
            textAlignVertical="top"
          />
          <PrimaryButton label={busy ? "Submitting…" : "Submit review"} disabled={busy} onPress={() => void submit()} />
        </View>
      ) : (
        <Text style={styles.hint}>Reviews open when the event starts.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: spacing.sm },
  muted: { color: colors.textMuted, fontSize: 14 },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  reviewer: { fontWeight: "700", color: colors.navy },
  stars: { color: "#f59e0b", fontSize: 12 },
  comment: { marginTop: 6, fontSize: 14, color: colors.textMuted, lineHeight: 20 },
  date: { marginTop: 4, fontSize: 11, color: colors.textMuted },
  form: { marginTop: spacing.lg },
  formTitle: { fontWeight: "700", color: colors.navy, marginBottom: spacing.sm },
  starRow: { flexDirection: "row", gap: 4, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    minHeight: 80,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  hint: { marginTop: spacing.md, fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
});
