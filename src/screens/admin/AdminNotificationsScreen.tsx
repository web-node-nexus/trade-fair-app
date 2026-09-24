import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Alert, Pressable, Text, TextInput, View} from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

type Template = {
  id: string;
  code: string;
  title: string;
  body: string;
  audience: string;
};

type NotifLog = { id: string; status: string; createdAt: string };

export function AdminNotificationsScreen() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [log, setLog] = useState<NotifLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState("all");
  const [sendTemplateId, setSendTemplateId] = useState("");
  const [sendAudience, setSendAudience] = useState("all");

  const load = useCallback(async () => {
    const [t, n] = await Promise.all([
      apiJson<{ templates: Template[] }>("/admin/notification-templates"),
      apiJson<{ notifications: NotifLog[] }>("/admin/notifications?limit=50"),
    ]);
    setTemplates(t.templates ?? []);
    setLog(n.notifications ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  async function saveTemplate() {
    if (!code.trim() || !title.trim() || !body.trim()) {
      Alert.alert("Required", "Code, title, and body required.");
      return;
    }
    try {
      await apiJson("/admin/notification-templates", {
        method: "PUT",
        body: JSON.stringify({
          ...(editId ? { id: editId } : {}),
          code: code.trim(),
          title: title.trim(),
          body: body.trim(),
          audience,
        }),
      });
      setCode("");
      setTitle("");
      setBody("");
      setEditId(null);
      await load();
      Alert.alert("Saved", "Template saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function deleteTemplate(id: string) {
    try {
      await apiJson(`/admin/notification-templates/${id}`, { method: "DELETE" });
      if (editId === id) setEditId(null);
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function sendBroadcast() {
    try {
      await apiJson("/admin/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          templateId: sendTemplateId || null,
          audience: sendAudience,
          payload: null,
        }),
      });
      await load();
      Alert.alert("Queued", "Broadcast queued.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Send failed");
    }
  }

  const audiences = ["all", "organizers", "exhibitors", "visitors"];

  const header = (
    <View>
      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>{editId ? "Edit template" : "Save template"}</Text>
        <TextInput style={adminStyles.input} value={code} onChangeText={setCode} placeholder="code (unique)" autoCapitalize="none" />
        <TextInput style={adminStyles.input} value={title} onChangeText={setTitle} placeholder="Title" />
        <TextInput style={[adminStyles.input, { minHeight: 80 }]} value={body} onChangeText={setBody} placeholder="Body" multiline textAlignVertical="top" />
        <View style={adminStyles.row}>
          {audiences.map((a) => (
            <Pressable key={a} style={[adminStyles.chip, audience === a && adminStyles.chipActive]} onPress={() => setAudience(a)}>
              <Text style={adminStyles.chipText}>{a}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label={editId ? "Update template" : "Upsert template"} variant="cta" onPress={() => void saveTemplate()} />
      </View>

      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Send broadcast</Text>
        <Text style={adminStyles.label}>Template (optional)</Text>
        <View style={adminStyles.row}>
          <Pressable style={[adminStyles.chip, !sendTemplateId && adminStyles.chipActive]} onPress={() => setSendTemplateId("")}>
            <Text style={adminStyles.chipText}>None</Text>
          </Pressable>
          {templates.map((t) => (
            <Pressable key={t.id} style={[adminStyles.chip, sendTemplateId === t.id && adminStyles.chipActive]} onPress={() => setSendTemplateId(t.id)}>
              <Text style={adminStyles.chipText}>{t.code}</Text>
            </Pressable>
          ))}
        </View>
        <View style={adminStyles.row}>
          {audiences.map((a) => (
            <Pressable key={a} style={[adminStyles.chip, sendAudience === a && adminStyles.chipActive]} onPress={() => setSendAudience(a)}>
              <Text style={adminStyles.chipText}>{a}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Queue broadcast" variant="navy" onPress={() => void sendBroadcast()} />
      </View>

      <Text style={adminStyles.sectionTitle}>Recent sends</Text>
      {log.slice(0, 5).map((n) => (
        <Text key={n.id} style={adminStyles.sub}>
          {n.status} · {new Date(n.createdAt).toLocaleString()}
        </Text>
      ))}
    </View>
  );

  return (
    <ScreenShell title="Notifications" subtitle="Templates & broadcast">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={templates}
          keyExtractor={(t) => t.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No templates." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>{item.code}</Text>
              <Text style={adminStyles.sub}>{item.title} ({item.audience})</Text>
              <View style={adminStyles.row}>
                <Pressable
                  style={adminStyles.chip}
                  onPress={() => {
                    setEditId(item.id);
                    setCode(item.code);
                    setTitle(item.title);
                    setBody(item.body);
                    setAudience(item.audience);
                  }}
                >
                  <Text style={adminStyles.chipText}>Edit</Text>
                </Pressable>
                <Pressable style={[adminStyles.chip, { borderColor: "#ef4444" }]} onPress={() => void deleteTemplate(item.id)}>
                  <Text style={[adminStyles.chipText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
