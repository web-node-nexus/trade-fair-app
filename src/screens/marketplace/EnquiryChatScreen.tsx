import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { TextField } from "@/components/ui/TextField";
import { apiJson } from "@/lib/authFetch";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

/** Contract forms disabled — enquiry chat stays enabled. */
const ENABLE_SERVICE_CONTRACT_FORM = false;

type Msg = { id: string; fromUserId: string; fromName: string | null; body: string; createdAt: string };

type Contract = {
  id: string;
  status: string;
  serviceDescription: string;
  durationDays: number;
  peopleCount: number;
  exhibitorNotes: string | null;
  providerNotes: string | null;
  sentAt: string;
  acceptedAt: string | null;
} | null;

type Thread = {
  request: { id: string; serviceTitle: string; status: string };
  viewerIsCustomer: boolean;
  customerLabel: string;
  initial: { body: string; createdAt: string; fromUserId: string };
  messages: Msg[];
  contract: Contract;
  viewerMaySendContract: boolean;
  viewerMayAcceptContract: boolean;
  viewerMayRateAsExhibitor?: boolean;
  myExhibitorRating?: { stars: number; comment: string | null } | null;
  provider?: { userId: string; displayName: string; exhibitorRatingAvg: number | null; exhibitorRatingCount: number };
  dealStage?: string;
};

export function EnquiryChatScreen({ apiScope = "marketplace" }: { apiScope?: "marketplace" | "provider" }) {
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const base =
    apiScope === "provider"
      ? `/provider/service-requests/${requestId}/messages`
      : `/marketplace/service-requests/${requestId}/messages`;

  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showSendContract, setShowSendContract] = useState(false);
  const [showAcceptContract, setShowAcceptContract] = useState(false);
  const [durationDays, setDurationDays] = useState("3");
  const [peopleCount, setPeopleCount] = useState("100");
  const [exhibitorNotes, setExhibitorNotes] = useState("");
  const [manpower, setManpower] = useState("10");
  const [providerNotes, setProviderNotes] = useState("");
  const [machineryName, setMachineryName] = useState("");
  const [machineryCount, setMachineryCount] = useState("1");
  const [ratingStars, setRatingStars] = useState("5");
  const [ratingComment, setRatingComment] = useState("");
  const listRef = useRef<FlatList>(null);

  const load = useCallback(async () => {
    const j = await apiJson<Thread>(base);
    setThread(j);
  }, [base]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => setThread(null))
      .finally(() => setLoading(false));
    const t = setInterval(() => void load().catch(() => undefined), 20000);
    return () => clearInterval(t);
  }, [load]);

  async function send() {
    if (!draft.trim() || sending) return;
    setSending(true);
    try {
      await apiJson(base, { method: "POST", body: JSON.stringify({ body: draft.trim() }) });
      setDraft("");
      await load();
      listRef.current?.scrollToEnd({ animated: true });
    } finally {
      setSending(false);
    }
  }

  async function patchStatus(status: string) {
    if (apiScope !== "provider" || !requestId) return;
    try {
      await apiJson(`/provider/service-requests/${requestId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      Alert.alert("Status", e instanceof Error ? e.message : "Update failed");
    }
  }

  async function sendContract() {
    if (!requestId) return;
    setSending(true);
    try {
      await apiJson(`/marketplace/service-requests/${requestId}/contract`, {
        method: "POST",
        body: JSON.stringify({
          durationDays: Number(durationDays),
          peopleCount: Number(peopleCount),
          exhibitorNotes: exhibitorNotes.trim() || null,
        }),
      });
      setShowSendContract(false);
      await load();
      Alert.alert("Sent", "Contract sent to provider.");
    } catch (e) {
      Alert.alert("Contract", e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  async function acceptContract() {
    if (!requestId || !machineryName.trim()) {
      Alert.alert("Required", "Add at least one machine/equipment name.");
      return;
    }
    setSending(true);
    try {
      await apiJson(`/provider/service-requests/${requestId}/contract/accept`, {
        method: "POST",
        body: JSON.stringify({
          manpowerAvailable: Number(manpower),
          providerNotes: providerNotes.trim() || null,
          machinery: [{ name: machineryName.trim(), count: Number(machineryCount), details: null }],
        }),
      });
      setShowAcceptContract(false);
      await load();
      Alert.alert("Accepted", "Contract accepted — deal done.");
    } catch (e) {
      Alert.alert("Contract", e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  async function declineContract() {
    if (!requestId) return;
    try {
      await apiJson(`/provider/service-requests/${requestId}/contract/decline`, {
        method: "POST",
        body: JSON.stringify({ providerNotes: providerNotes.trim() || null }),
      });
      await load();
      Alert.alert("Declined", "Contract declined.");
    } catch (e) {
      Alert.alert("Contract", e instanceof Error ? e.message : "Failed");
    }
  }

  async function submitRating() {
    if (!thread?.provider?.userId) return;
    const stars = Number(ratingStars);
    if (!Number.isFinite(stars) || stars < 1 || stars > 5) {
      Alert.alert("Rating", "Enter stars between 1 and 5.");
      return;
    }
    setSending(true);
    try {
      await apiJson(`/marketplace/providers/${thread.provider.userId}/exhibitor-rating`, {
        method: "PUT",
        body: JSON.stringify({ stars, comment: ratingComment.trim() || null }),
      });
      await load();
      Alert.alert("Thanks", "Rating saved.");
    } catch (e) {
      Alert.alert("Rating", e instanceof Error ? e.message : "Failed");
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  if (!thread) {
    return (
      <ScreenShell title="Enquiry">
        <Text style={styles.muted}>Could not load chat.</Text>
      </ScreenShell>
    );
  }

  const allMessages: Msg[] = [
    {
      id: "initial",
      fromUserId: thread.initial.fromUserId,
      fromName: null,
      body: thread.initial.body,
      createdAt: thread.initial.createdAt,
    },
    ...thread.messages,
  ];

  return (
    <ScreenShell
      title={thread.request.serviceTitle}
      subtitle={`${thread.request.status}${thread.dealStage ? ` · ${thread.dealStage.replace(/_/g, " ")}` : ""}`}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 120, marginBottom: spacing.sm }}>
        {apiScope === "provider" ? (
          <>
            <Pressable style={styles.actionBtn} onPress={() => void patchStatus("in_progress")}>
              <Text style={styles.actionText}>In progress</Text>
            </Pressable>
            <Pressable style={styles.actionBtn} onPress={() => void patchStatus("closed")}>
              <Text style={styles.actionText}>Close</Text>
            </Pressable>
          </>
        ) : null}
        {ENABLE_SERVICE_CONTRACT_FORM && thread.viewerMaySendContract ? (
          <Pressable style={styles.actionBtn} onPress={() => setShowSendContract((v) => !v)}>
            <Text style={styles.actionText}>{showSendContract ? "Hide contract form" : "Send contract"}</Text>
          </Pressable>
        ) : null}
        {ENABLE_SERVICE_CONTRACT_FORM && thread.viewerMayAcceptContract ? (
          <Pressable style={styles.actionBtn} onPress={() => setShowAcceptContract((v) => !v)}>
            <Text style={styles.actionText}>{showAcceptContract ? "Hide accept form" : "Accept contract"}</Text>
          </Pressable>
        ) : null}
        {ENABLE_SERVICE_CONTRACT_FORM && thread.viewerMayAcceptContract ? (
          <Pressable style={styles.actionBtn} onPress={() => void declineContract()}>
            <Text style={[styles.actionText, { color: "#ef4444" }]}>Decline</Text>
          </Pressable>
        ) : null}
      </ScrollView>

      {ENABLE_SERVICE_CONTRACT_FORM && thread.contract ? (
        <View style={styles.contractBox}>
          <Text style={styles.contractTitle}>Contract · {thread.contract.status}</Text>
          <Text style={styles.contractLine}>{thread.contract.serviceDescription}</Text>
          <Text style={styles.contractMeta}>
            {thread.contract.durationDays} days · {thread.contract.peopleCount} people
          </Text>
        </View>
      ) : null}

      {ENABLE_SERVICE_CONTRACT_FORM && showSendContract ? (
        <View style={styles.formBox}>
          <TextField label="Duration (days)" value={durationDays} onChangeText={setDurationDays} keyboardType="number-pad" />
          <TextField label="People count" value={peopleCount} onChangeText={setPeopleCount} keyboardType="number-pad" />
          <TextField label="Notes for provider" value={exhibitorNotes} onChangeText={setExhibitorNotes} multiline />
          <PrimaryButton label="Send contract" variant="cta" disabled={sending} onPress={() => void sendContract()} />
        </View>
      ) : null}

      {ENABLE_SERVICE_CONTRACT_FORM && showAcceptContract ? (
        <View style={styles.formBox}>
          <TextField label="Manpower available" value={manpower} onChangeText={setManpower} keyboardType="number-pad" />
          <TextField label="Machine / equipment name" value={machineryName} onChangeText={setMachineryName} />
          <TextField label="Count" value={machineryCount} onChangeText={setMachineryCount} keyboardType="number-pad" />
          <TextField label="Provider notes" value={providerNotes} onChangeText={setProviderNotes} multiline />
          <PrimaryButton label="Accept contract" variant="cta" disabled={sending} onPress={() => void acceptContract()} />
        </View>
      ) : null}

      {thread.viewerMayRateAsExhibitor && thread.provider ? (
        <View style={styles.formBox}>
          <Text style={styles.rateLabel}>
            Rate {thread.provider.displayName}
            {thread.provider.exhibitorRatingCount
              ? ` (${thread.provider.exhibitorRatingAvg?.toFixed(1)} avg)`
              : ""}
          </Text>
          {thread.myExhibitorRating ? (
            <Text style={styles.muted}>Your rating: {thread.myExhibitorRating.stars}★</Text>
          ) : (
            <>
              <TextField label="Stars (1–5)" value={ratingStars} onChangeText={setRatingStars} keyboardType="number-pad" />
              <TextField label="Comment (optional)" value={ratingComment} onChangeText={setRatingComment} multiline />
              <PrimaryButton label="Submit rating" variant="outline" disabled={sending} onPress={() => void submitRating()} />
            </>
          )}
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <FlatList
          ref={listRef}
          data={allMessages}
          keyExtractor={(m) => m.id}
          refreshControl={refreshControl}
          contentContainerStyle={{ paddingBottom: spacing.md }}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = thread.viewerIsCustomer
              ? item.fromUserId === thread.initial.fromUserId
              : item.fromUserId !== thread.initial.fromUserId;
            return (
              <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                {!mine && item.fromName ? <Text style={styles.sender}>{item.fromName}</Text> : null}
                <Text style={[styles.body, mine && styles.bodyMine]}>{item.body}</Text>
                <Text style={[styles.time, mine && styles.timeMine]}>
                  {new Date(item.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            );
          }}
        />
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            value={draft}
            onChangeText={setDraft}
            multiline
          />
          <Pressable style={[styles.sendBtn, sending && { opacity: 0.5 }]} onPress={() => void send()} disabled={sending}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },
  bubble: {
    maxWidth: "82%",
    padding: spacing.md,
    borderRadius: radius.lg,
    marginBottom: spacing.sm,
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleMine: { alignSelf: "flex-end", backgroundColor: colors.emerald, borderColor: colors.emerald },
  sender: { fontSize: 11, fontWeight: "700", color: colors.textMuted, marginBottom: 4 },
  body: { fontSize: 15, color: colors.text, lineHeight: 21 },
  bodyMine: { color: "#fff" },
  time: { fontSize: 10, color: colors.textMuted, marginTop: 4, alignSelf: "flex-end" },
  timeMine: { color: "rgba(255,255,255,0.75)" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: colors.surface,
  },
  sendBtn: {
    backgroundColor: colors.cta,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  sendText: { color: "#fff", fontWeight: "800" },
  actionBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  actionText: { fontWeight: "700", color: colors.navy, fontSize: 12 },
  contractBox: {
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.25)",
  },
  contractTitle: { fontWeight: "800", color: colors.emeraldDark, fontSize: 13 },
  contractLine: { marginTop: 4, fontSize: 13, color: colors.navy },
  contractMeta: { marginTop: 4, fontSize: 11, color: colors.textMuted },
  formBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rateLabel: { fontWeight: "700", color: colors.navy, marginBottom: spacing.sm },
});
