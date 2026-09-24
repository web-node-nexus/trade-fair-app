import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

type Flag = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  createdAt: string;
};

type DraftEvent = {
  id: string;
  title: string;
  organizerEmail: string;
};

type DraftService = {
  id: string;
  title: string;
  providerEmail: string;
};

type PublishedEvent = {
  id: string;
  title: string;
  organizerEmail: string;
  adminDisabled: boolean;
  adminDisabledReason: string | null;
};

function matches(hay: string, q: string) {
  if (!q.trim()) return true;
  return hay.toLowerCase().includes(q.trim().toLowerCase());
}

export function AdminModerationScreen() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [draftEvents, setDraftEvents] = useState<DraftEvent[]>([]);
  const [draftServices, setDraftServices] = useState<DraftService[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<PublishedEvent[]>([]);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    const qs = filter ? `?status=${encodeURIComponent(filter)}` : "";
    const [flagsRes, catRes] = await Promise.all([
      apiJson<{ flags: Flag[] }>(`/admin/moderation/flags${qs}`),
      apiJson<{
        draftEvents: DraftEvent[];
        draftServices: DraftService[];
        publishedEvents: PublishedEvent[];
      }>("/admin/catalog/drafts"),
    ]);
    setFlags(flagsRes.flags ?? []);
    setDraftEvents(catRes.draftEvents ?? []);
    setDraftServices(catRes.draftServices ?? []);
    setPublishedEvents(catRes.publishedEvents ?? []);
  }, [filter]);

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  const filteredDraftEvents = useMemo(
    () => draftEvents.filter((e) => matches(`${e.title} ${e.organizerEmail} ${e.id}`, search)),
    [draftEvents, search]
  );
  const filteredPublished = useMemo(
    () => publishedEvents.filter((e) => matches(`${e.title} ${e.organizerEmail} ${e.id}`, search)),
    [publishedEvents, search]
  );
  const filteredServices = useMemo(
    () => draftServices.filter((s) => matches(`${s.title} ${s.providerEmail} ${s.id}`, search)),
    [draftServices, search]
  );
  const filteredFlags = useMemo(
    () => flags.filter((f) => matches(`${f.entityType} ${f.entityId} ${f.status} ${f.id}`, search)),
    [flags, search]
  );

  async function resolveFlag(flagId: string, status: "approved" | "rejected") {
    setBusy(flagId);
    try {
      await apiJson(`/admin/moderation/flags/${flagId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function publishEvent(eventId: string) {
    setBusy(eventId);
    try {
      await apiJson(`/admin/catalog/events/${eventId}/publish`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function publishService(serviceId: string) {
    setBusy(serviceId);
    try {
      await apiJson(`/admin/catalog/services/${serviceId}/publish`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function disableEvent(eventId: string) {
    setBusy(`disable-${eventId}`);
    try {
      await apiJson(`/admin/catalog/events/${eventId}/disable`, {
        method: "POST",
        body: JSON.stringify({ reason: null }),
      });
      await load();
    } finally {
      setBusy(null);
    }
  }

  async function enableEvent(eventId: string) {
    setBusy(`enable-${eventId}`);
    try {
      await apiJson(`/admin/catalog/events/${eventId}/enable`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const header = (
    <View>
      <TextInput
        style={adminStyles.input}
        value={search}
        onChangeText={setSearch}
        placeholder="Search title, email, id…"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <View style={adminStyles.section}>
        <Text style={adminStyles.sectionTitle}>Draft events</Text>
        {filteredDraftEvents.length === 0 ? (
          <Text style={adminStyles.sub}>No draft events.</Text>
        ) : (
          filteredDraftEvents.map((e) => (
            <View key={e.id} style={{ marginBottom: 8 }}>
              <Text style={adminStyles.title}>{e.title}</Text>
              <Text style={adminStyles.sub}>
                {e.organizerEmail} · #{e.id}
              </Text>
              <Pressable
                style={[adminStyles.btn, adminStyles.approve, { marginTop: 6 }]}
                disabled={busy === e.id}
                onPress={() => void publishEvent(e.id)}
              >
                <Text style={adminStyles.btnText}>Publish</Text>
              </Pressable>
            </View>
          ))
        )}
        <Text style={[adminStyles.sectionTitle, { marginTop: 12 }]}>Published events</Text>
        <Text style={adminStyles.sub}>Disable to hide from website & app. Organizer sees disabled status.</Text>
        {filteredPublished.length === 0 ? (
          <Text style={adminStyles.sub}>No published events.</Text>
        ) : (
          filteredPublished.map((e) => (
            <View key={e.id} style={{ marginBottom: 8 }}>
              <Text style={adminStyles.title}>
                {e.title}
                {e.adminDisabled ? " · DISABLED" : ""}
              </Text>
              <Text style={adminStyles.sub}>
                {e.organizerEmail} · #{e.id}
              </Text>
              {e.adminDisabled && e.adminDisabledReason ? (
                <Text style={adminStyles.sub}>Reason: {e.adminDisabledReason}</Text>
              ) : null}
              {e.adminDisabled ? (
                <Pressable
                  style={[adminStyles.btn, adminStyles.approve, { marginTop: 6 }]}
                  disabled={busy === `enable-${e.id}`}
                  onPress={() => void enableEvent(e.id)}
                >
                  <Text style={adminStyles.btnText}>Re-enable</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[adminStyles.btn, adminStyles.reject, { marginTop: 6 }]}
                  disabled={busy === `disable-${e.id}`}
                  onPress={() => void disableEvent(e.id)}
                >
                  <Text style={adminStyles.btnText}>Disable</Text>
                </Pressable>
              )}
            </View>
          ))
        )}
        <Text style={[adminStyles.sectionTitle, { marginTop: 12 }]}>Draft services</Text>
        {filteredServices.length === 0 ? (
          <Text style={adminStyles.sub}>No draft services.</Text>
        ) : (
          filteredServices.map((s) => (
            <View key={s.id} style={{ marginBottom: 8 }}>
              <Text style={adminStyles.title}>{s.title}</Text>
              <Text style={adminStyles.sub}>
                {s.providerEmail} · #{s.id}
              </Text>
              <Pressable
                style={[adminStyles.btn, adminStyles.approve, { marginTop: 6 }]}
                disabled={busy === s.id}
                onPress={() => void publishService(s.id)}
              >
                <Text style={adminStyles.btnText}>Publish</Text>
              </Pressable>
            </View>
          ))
        )}
      </View>
      <Text style={adminStyles.sectionTitle}>User flags</Text>
      <View style={adminStyles.row}>
        {["", "open", "approved", "rejected"].map((s) => (
          <Pressable
            key={s || "all"}
            style={[adminStyles.chip, filter === s && adminStyles.chipActive]}
            onPress={() => setFilter(s)}
          >
            <Text style={adminStyles.chipText}>{s || "All"}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenShell title="Moderation" subtitle="Drafts & content flags">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={filteredFlags}
          keyExtractor={(f) => f.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No flags." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>
                {item.entityType} · {item.entityId}
              </Text>
              <Text style={adminStyles.sub}>
                {item.status.toUpperCase()} · {new Date(item.createdAt).toLocaleString()}
              </Text>
              {item.status === "open" ? (
                <View style={adminStyles.actions}>
                  <Pressable
                    style={[adminStyles.btn, adminStyles.approve]}
                    disabled={busy === item.id}
                    onPress={() => void resolveFlag(item.id, "approved")}
                  >
                    <Text style={adminStyles.btnText}>Approve</Text>
                  </Pressable>
                  <Pressable
                    style={[adminStyles.btn, adminStyles.reject]}
                    disabled={busy === item.id}
                    onPress={() => void resolveFlag(item.id, "rejected")}
                  >
                    <Text style={adminStyles.btnText}>Reject</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
