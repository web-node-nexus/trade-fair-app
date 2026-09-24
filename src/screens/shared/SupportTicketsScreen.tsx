import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Ticket = {
  id: string;
  subject: string;
  status: string;
  category?: string;
  priority?: string;
  assignedToUserId?: string | null;
  assigneeEmail?: string | null;
  createdAt: string;
};
type Response = { id: string; body: string; isStaffResponse: boolean; createdAt: string };
type Attachment = { id: string; fileUrl: string; fileName: string; mimeType: string };

const CATEGORIES = ["general", "technical", "billing", "stall_booking", "ticket_booking", "dispute"] as const;
const PRIORITIES = ["low", "normal", "high"] as const;
const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;

export function SupportTicketsScreen({ adminMode }: { adminMode?: boolean }) {
  const router = useRouter();
  const params = useLocalSearchParams<{ ticketId?: string }>();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("general");
  const [priority, setPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [disputeId, setDisputeId] = useState("");
  const [reply, setReply] = useState("");
  const [adminPriority, setAdminPriority] = useState<(typeof PRIORITIES)[number]>("normal");
  const [adminStatus, setAdminStatus] = useState<(typeof STATUSES)[number]>("open");
  const [assigneeId, setAssigneeId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);

  const listEndpoint = adminMode ? "/admin/support/tickets" : "/support/tickets/me";

  const loadTickets = useCallback(async () => {
    const data = await apiJson<Record<string, unknown>>(listEndpoint);
    setTickets(extractList(data) as Ticket[]);
  }, [listEndpoint]);

  const loadDetail = useCallback(
    async (ticket: Ticket) => {
      const endpoint = adminMode ? `/admin/support/tickets/${ticket.id}` : `/support/tickets/${ticket.id}`;
      const data = await apiJson<{ responses: Response[]; attachments: Attachment[]; ticket?: Ticket }>(endpoint);
      setSelected(ticket);
      setResponses(data.responses ?? []);
      setAttachments(data.attachments ?? []);
      if (adminMode) {
        setAdminPriority((ticket.priority as typeof adminPriority) ?? "normal");
        setAdminStatus((ticket.status as typeof adminStatus) ?? "open");
        setAssigneeId(ticket.assignedToUserId ?? "");
      }
    },
    [adminMode]
  );

  const refreshDetail = useCallback(async () => {
    if (selected) await loadDetail(selected);
  }, [selected, loadDetail]);
  const { refreshControl: detailRefreshControl } = usePullToRefresh(refreshDetail);

  useEffect(() => {
    void loadTickets()
      .catch(() => setTickets([]))
      .finally(() => setLoading(false));
  }, [loadTickets]);

  useEffect(() => {
    if (params.ticketId && tickets.length) {
      const t = tickets.find((x) => x.id === params.ticketId);
      if (t) void loadDetail(t).catch(() => undefined);
    }
  }, [params.ticketId, tickets, loadDetail]);

  async function createTicket() {
    if (!subject.trim() || !body.trim()) {
      Alert.alert("Required", "Subject and message are required.");
      return;
    }
    setBusy(true);
    try {
      await apiJson("/support/tickets", {
        method: "POST",
        body: JSON.stringify({
          subject: subject.trim(),
          body: body.trim(),
          category,
          priority,
          disputeId: category === "dispute" && disputeId.trim() ? disputeId.trim() : null,
        }),
      });
      setSubject("");
      setBody("");
      setDisputeId("");
      setCreating(false);
      await loadTickets();
      Alert.alert("Created", "Support ticket submitted.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendReply() {
    if (!selected || !reply.trim()) return;
    setBusy(true);
    try {
      const endpoint = adminMode
        ? `/admin/support/tickets/${selected.id}/responses`
        : `/support/tickets/${selected.id}/responses`;
      await apiJson(endpoint, { method: "POST", body: JSON.stringify({ body: reply.trim() }) });
      setReply("");
      await loadDetail(selected);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function uploadAttachment() {
    if (!selected) return;
    const pick = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setBusy(true);
    try {
      const path = adminMode
        ? `/admin/support/tickets/${selected.id}/attachments`
        : `/support/tickets/${selected.id}/attachments`;
      await uploadMultipart(path, {}, {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType ?? "application/octet-stream",
      });
      await loadDetail(selected);
      Alert.alert("Uploaded", "Attachment added.");
    } catch (e) {
      Alert.alert("Upload failed", e instanceof Error ? e.message : "Try again");
    } finally {
      setBusy(false);
    }
  }

  async function saveAdminPatch() {
    if (!selected || !adminMode) return;
    setBusy(true);
    try {
      await apiJson(`/admin/support/tickets/${selected.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: adminStatus,
          priority: adminPriority,
          assignedToUserId: assigneeId.trim() || null,
        }),
      });
      await loadTickets();
      await loadDetail({ ...selected, status: adminStatus, priority: adminPriority });
      Alert.alert("Updated", "Ticket updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  function ChipRow<T extends string>({
    options,
    value,
    onChange,
  }: {
    options: readonly T[];
    value: T;
    onChange: (v: T) => void;
  }) {
    return (
      <View style={styles.chipRow}>
        {options.map((opt) => (
          <Pressable
            key={opt}
            style={[styles.chip, value === opt && styles.chipActive]}
            onPress={() => onChange(opt)}
          >
            <Text style={[styles.chipText, value === opt && styles.chipTextActive]}>{opt.replace(/_/g, " ")}</Text>
          </Pressable>
        ))}
      </View>
    );
  }

  if (selected) {
    return (
      <ScreenShell title={selected.subject} subtitle={`${selected.status}${selected.priority ? ` · ${selected.priority}` : ""}`}>
        {adminMode ? (
          <View style={styles.adminBox}>
            <Text style={styles.label}>Status</Text>
            <ChipRow options={STATUSES} value={adminStatus} onChange={setAdminStatus} />
            <Text style={styles.label}>Priority</Text>
            <ChipRow options={PRIORITIES} value={adminPriority} onChange={setAdminPriority} />
            <Text style={styles.label}>Assign to user ID</Text>
            <TextInput style={styles.input} value={assigneeId} onChangeText={setAssigneeId} placeholder="User ID or empty" />
            <PrimaryButton label="Save ticket settings" variant="outline" disabled={busy} onPress={() => void saveAdminPatch()} />
          </View>
        ) : null}
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <FlatList
            data={responses}
            keyExtractor={(r) => r.id}
            refreshControl={detailRefreshControl}
            ListHeaderComponent={
              attachments.length ? (
                <View style={{ marginBottom: spacing.sm }}>
                  <Text style={styles.label}>Attachments</Text>
                  {attachments.map((a) => (
                    <Pressable key={a.id} onPress={() => void Linking.openURL(resolveMediaUrl(a.fileUrl) ?? a.fileUrl)}>
                      <Text style={styles.link}>{a.fileName}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null
            }
            ListEmptyComponent={<EmptyState title="No replies yet." compact />}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.isStaffResponse ? styles.staff : styles.user]}>
                <Text style={styles.bubbleBody}>{item.body}</Text>
                <Text style={styles.bubbleTime}>{new Date(item.createdAt).toLocaleString()}</Text>
              </View>
            )}
          />
          <View style={styles.composer}>
            <TextInput style={styles.input} placeholder="Reply…" value={reply} onChangeText={setReply} multiline />
            <PrimaryButton label="Send" variant="cta" disabled={busy} onPress={() => void sendReply()} />
          </View>
          <Pressable style={styles.attachBtn} onPress={() => void uploadAttachment()}>
            <Ionicons name="attach-outline" size={18} color={colors.emerald} />
            <Text style={styles.attachText}>Add attachment</Text>
          </Pressable>
          <Pressable onPress={() => setSelected(null)} style={{ marginTop: spacing.sm }}>
            <Text style={styles.backLink}>← All tickets</Text>
          </Pressable>
        </KeyboardAvoidingView>
      </ScreenShell>
    );
  }

  if (creating) {
    return (
      <ScreenShell title="New ticket">
        <Text style={styles.label}>Category</Text>
        <ChipRow options={CATEGORIES} value={category} onChange={setCategory} />
        {category === "dispute" ? (
          <>
            <Text style={styles.label}>Dispute ID</Text>
            <TextInput style={styles.input} value={disputeId} onChangeText={setDisputeId} placeholder="Payment dispute ID" />
          </>
        ) : null}
        <Text style={styles.label}>Priority</Text>
        <ChipRow options={PRIORITIES} value={priority} onChange={setPriority} />
        <Text style={styles.label}>Subject</Text>
        <TextInput style={styles.input} value={subject} onChangeText={setSubject} />
        <Text style={styles.label}>Message</Text>
        <TextInput style={[styles.input, { minHeight: 100 }]} value={body} onChangeText={setBody} multiline textAlignVertical="top" />
        <PrimaryButton label={busy ? "Submitting…" : "Submit ticket"} variant="cta" disabled={busy} onPress={() => void createTicket()} />
        <Pressable onPress={() => setCreating(false)} style={{ marginTop: spacing.md }}>
          <Text style={styles.backLink}>Cancel</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title={adminMode ? "Support queue" : "Support"} subtitle="Get help from our team">
      {!adminMode ? (
        <Pressable style={styles.newBtn} onPress={() => setCreating(true)}>
          <Ionicons name="add-circle-outline" size={20} color={colors.cta} />
          <Text style={styles.newBtnText}>New ticket</Text>
        </Pressable>
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.cta} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void loadTickets()}
          data={tickets}
          keyExtractor={(t) => t.id}
          ListEmptyComponent={<EmptyState title="No tickets." compact />}
          renderItem={({ item }) => (
            <Pressable style={styles.card} onPress={() => void loadDetail(item)}>
              <Text style={styles.cardTitle}>{item.subject}</Text>
              <Text style={styles.cardSub}>
                {item.status}
                {item.category ? ` · ${item.category}` : ""}
                {item.priority ? ` · ${item.priority}` : ""}
              </Text>
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  newBtn: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.md },
  newBtnText: { color: colors.cta, fontWeight: "800" },
  muted: { color: colors.textMuted, textAlign: "center", marginTop: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontWeight: "800", color: colors.navy },
  cardSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 11, fontWeight: "700", color: colors.navy, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  bubble: { padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm, maxWidth: "90%" },
  staff: { alignSelf: "flex-start", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  user: { alignSelf: "flex-end", backgroundColor: colors.emerald },
  bubbleBody: { color: colors.text, lineHeight: 20 },
  bubbleTime: { fontSize: 10, color: colors.textMuted, marginTop: 4 },
  composer: { flexDirection: "row", gap: spacing.sm, alignItems: "flex-end", marginTop: spacing.sm },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: spacing.sm },
  attachText: { color: colors.emerald, fontWeight: "700" },
  link: { color: colors.emerald, fontWeight: "600", marginBottom: 4 },
  backLink: { color: colors.emerald, fontWeight: "700" },
  adminBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
