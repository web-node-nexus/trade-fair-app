import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Alert, Pressable, Text, TextInput, View} from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles, SUB_ADMIN_SCOPE_OPTIONS } from "./adminStyles";

type SubAdminRow = {
  userId: string;
  email: string;
  fullName: string;
  status: string;
  scopes: string[];
};

export function AdminSubAdminsScreen() {
  const [list, setList] = useState<SubAdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"new" | "promote">("new");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [promoteUserId, setPromoteUserId] = useState("");
  const [editId, setEditId] = useState("");
  const [editScopes, setEditScopes] = useState<string[]>([...SUB_ADMIN_SCOPE_OPTIONS]);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const j = await apiJson<{ subAdmins: SubAdminRow[] }>("/admin/sub-admins");
    setList(j.subAdmins ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function createSubAdmin() {
    setBusy(true);
    try {
      const body =
        mode === "promote"
          ? { userId: promoteUserId.trim() }
          : {
              email: email.trim(),
              password,
              fullName: fullName.trim(),
              phone: phone.trim() || null,
            };
      await apiJson("/admin/sub-admins", { method: "POST", body: JSON.stringify(body) });
      setEmail("");
      setPassword("");
      setFullName("");
      setPhone("");
      setPromoteUserId("");
      await load();
      Alert.alert("Done", mode === "promote" ? "User promoted." : "Sub-admin created.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  async function saveScopes() {
    if (!editId.trim()) return;
    setBusy(true);
    try {
      await apiJson(`/admin/sub-admins/${editId.trim()}/scopes`, {
        method: "PUT",
        body: JSON.stringify({ scopes: editScopes }),
      });
      await load();
      Alert.alert("Saved", "Scopes updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  function toggleScope(code: string) {
    setEditScopes((prev) => (prev.includes(code) ? prev.filter((s) => s !== code) : [...prev, code]));
  }

  const header = (
    <View>
      <View style={adminStyles.row}>
        <Pressable style={[adminStyles.chip, mode === "new" && adminStyles.chipActive]} onPress={() => setMode("new")}>
          <Text style={adminStyles.chipText}>New account</Text>
        </Pressable>
        <Pressable style={[adminStyles.chip, mode === "promote" && adminStyles.chipActive]} onPress={() => setMode("promote")}>
          <Text style={adminStyles.chipText}>Promote user</Text>
        </Pressable>
      </View>

      <View style={adminStyles.section}>
        {mode === "promote" ? (
          <TextInput style={adminStyles.input} value={promoteUserId} onChangeText={setPromoteUserId} placeholder="Existing user id" />
        ) : (
          <>
            <TextInput style={adminStyles.input} value={fullName} onChangeText={setFullName} placeholder="Full name" />
            <TextInput style={adminStyles.input} value={email} onChangeText={setEmail} placeholder="Email" autoCapitalize="none" keyboardType="email-address" />
            <TextInput style={adminStyles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
            <TextInput style={adminStyles.input} value={phone} onChangeText={setPhone} placeholder="Phone (optional)" />
          </>
        )}
        <PrimaryButton label={busy ? "Working…" : mode === "promote" ? "Promote" : "Create sub-admin"} variant="cta" disabled={busy} onPress={() => void createSubAdmin()} />
      </View>

      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Edit scopes</Text>
        <TextInput style={adminStyles.input} value={editId} onChangeText={setEditId} placeholder="Sub-admin user id" />
        <View style={adminStyles.row}>
          {SUB_ADMIN_SCOPE_OPTIONS.map((code) => (
            <Pressable key={code} style={[adminStyles.chip, editScopes.includes(code) && adminStyles.chipActive]} onPress={() => toggleScope(code)}>
              <Text style={adminStyles.chipText}>{code}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Save scopes" variant="outline" disabled={busy} onPress={() => void saveScopes()} />
      </View>
    </View>
  );

  return (
    <ScreenShell title="Sub-admins" subtitle="Team accounts & scopes">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={list}
          keyExtractor={(u) => u.userId}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No sub-admins." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>{item.email}</Text>
              <Text style={adminStyles.sub}>
                {item.fullName} · {item.status} · ID {item.userId}
              </Text>
              <Text style={adminStyles.sub}>Scopes: {item.scopes.join(", ") || "—"}</Text>
              <View style={adminStyles.actions}>
                <Pressable
                  style={adminStyles.chip}
                  onPress={() => {
                    setEditId(item.userId);
                    setEditScopes(item.scopes.length ? item.scopes : [...SUB_ADMIN_SCOPE_OPTIONS]);
                  }}
                >
                  <Text style={adminStyles.chipText}>Edit scopes</Text>
                </Pressable>
                <Pressable
                  style={[adminStyles.btn, adminStyles.reject]}
                  onPress={() => {
                    Alert.alert(
                      "Delete sub-admin?",
                      `Remove admin access for ${item.fullName}? Account stays; scopes are cleared.`,
                      [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => {
                            void (async () => {
                              try {
                                await apiJson(`/admin/sub-admins/${item.userId}`, { method: "DELETE" });
                                if (editId === item.userId) setEditId("");
                                await load();
                                Alert.alert("Removed", "Sub-admin access removed.");
                              } catch (e) {
                                Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
                              }
                            })();
                          },
                        },
                      ]
                    );
                  }}
                >
                  <Text style={adminStyles.btnText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
