import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Pressable, Text, TextInput, View} from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

type ContactQuery = {
  id: string;
  referenceId: string;
  fullName: string;
  email: string;
  mobile: string;
  subject: string;
  message: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

export function AdminContactQueriesScreen() {
  const [queries, setQueries] = useState<ContactQuery[]>([]);
  const [selected, setSelected] = useState<ContactQuery | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (search.trim()) params.set("search", search.trim());
    const qs = params.toString();
    const data = await apiJson<{ queries: ContactQuery[] }>(`/admin/contact-queries${qs ? `?${qs}` : ""}`);
    setQueries(data.queries ?? []);
  }, [statusFilter, search]);

  useEffect(() => {
    void load()
      .catch(() => setQueries([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function loadDetail(id: string) {
    const data = await apiJson<{ query: ContactQuery }>(`/admin/contact-queries/${id}`);
    setSelected(data.query);
    setAdminNotes(data.query.adminNotes ?? "");
  }

  async function patchQuery(id: string, patch: { status?: string; adminNotes?: string | null }) {
    setBusy(true);
    try {
      await apiJson(`/admin/contact-queries/${id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await load();
      if (selected?.id === id) await loadDetail(id);
    } finally {
      setBusy(false);
    }
  }

  if (selected) {
    return (
      <ScreenShell title={selected.fullName} subtitle={`Ref ${selected.referenceId}`}>
        <Text style={adminStyles.sub}>{selected.email} · {selected.mobile}</Text>
        <Text style={adminStyles.sub}>{selected.subject} · {selected.status}</Text>
        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Message</Text>
          <Text style={adminStyles.sub}>{selected.message}</Text>
        </View>
        <Text style={adminStyles.label}>Admin notes</Text>
        <TextInput style={[adminStyles.input, { minHeight: 80 }]} value={adminNotes} onChangeText={setAdminNotes} multiline textAlignVertical="top" />
        <View style={adminStyles.row}>
          {["new", "in_progress", "resolved"].map((st) => (
            <Pressable key={st} style={adminStyles.chip} disabled={busy} onPress={() => void patchQuery(selected.id, { status: st, adminNotes: adminNotes.trim() || null })}>
              <Text style={adminStyles.chipText}>{st}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label="Save notes" variant="cta" disabled={busy} onPress={() => void patchQuery(selected.id, { adminNotes: adminNotes.trim() || null })} />
        <Pressable onPress={() => setSelected(null)}>
          <Text style={adminStyles.backLink}>← All queries</Text>
        </Pressable>
      </ScreenShell>
    );
  }

  const header = (
    <View>
      <TextInput style={adminStyles.input} value={search} onChangeText={setSearch} placeholder="Search" />
      <View style={adminStyles.row}>
        {["", "new", "in_progress", "resolved"].map((s) => (
          <Pressable key={s || "all"} style={[adminStyles.chip, statusFilter === s && adminStyles.chipActive]} onPress={() => setStatusFilter(s)}>
            <Text style={adminStyles.chipText}>{s || "All"}</Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton label="Apply" variant="outline" compact onPress={() => void load()} />
    </View>
  );

  return (
    <ScreenShell title="Contact queries" subtitle="Form submissions">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={queries}
          keyExtractor={(q) => q.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No queries." compact />}
          renderItem={({ item }) => (
            <Pressable style={adminStyles.card} onPress={() => void loadDetail(item.id)}>
              <Text style={adminStyles.title}>{item.fullName}</Text>
              <Text style={adminStyles.sub}>{item.subject} · {item.status}</Text>
              <Text style={adminStyles.sub}>{new Date(item.createdAt).toLocaleString()}</Text>
            </Pressable>
          )}
        />
      )}
    </ScreenShell>
  );
}
