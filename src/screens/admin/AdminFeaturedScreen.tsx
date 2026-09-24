import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {ActivityIndicator, Alert, Pressable, Switch, Text, TextInput, View} from "react-native";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

type Featured = {
  id: string;
  entityType: string;
  entityId: string;
  label: string | null;
  eventTitle?: string | null;
  active: boolean;
};

export function AdminFeaturedScreen() {
  const [items, setItems] = useState<Featured[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityType, setEntityType] = useState("event");
  const [entityId, setEntityId] = useState("");
  const [label, setLabel] = useState("");
  const [active, setActive] = useState(true);

  const load = useCallback(async () => {
    const data = await apiJson<{ featured: Featured[] }>("/admin/featured");
    setItems(data.featured ?? []);
  }, []);

  useEffect(() => {
    void load()
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function upsert() {
    if (!entityId.trim()) {
      Alert.alert("Required", "Entity id is required.");
      return;
    }
    try {
      await apiJson("/admin/featured", {
        method: "PUT",
        body: JSON.stringify({
          entityType: entityType.trim(),
          entityId: entityId.trim(),
          label: label.trim() || null,
          startsAt: null,
          endsAt: null,
          active,
        }),
      });
      setEntityId("");
      setLabel("");
      await load();
      Alert.alert("Saved", "Featured listing saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function remove(id: string) {
    Alert.alert("Remove?", "Delete this featured row?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await apiJson(`/admin/featured/${id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
            }
          })();
        },
      },
    ]);
  }

  const header = (
    <View style={adminStyles.section}>
      <Text style={adminStyles.sectionTitle}>Upsert featured</Text>
      <TextInput style={adminStyles.input} value={entityType} onChangeText={setEntityType} placeholder="entity_type (e.g. event)" />
      <TextInput style={adminStyles.input} value={entityId} onChangeText={setEntityId} placeholder="entity_id" />
      <TextInput style={adminStyles.input} value={label} onChangeText={setLabel} placeholder="Label (optional)" />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Switch value={active} onValueChange={setActive} />
        <Text style={adminStyles.sub}>Active</Text>
      </View>
      <PrimaryButton label="Save" variant="cta" onPress={() => void upsert()} />
    </View>
  );

  return (
    <ScreenShell title="Featured" subtitle="Promoted events & services">
      {loading ? (
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          data={items}
          keyExtractor={(x) => x.id}
          ListHeaderComponent={header}
          ListEmptyComponent={<EmptyState title="No featured listings." compact />}
          renderItem={({ item }) => (
            <View style={adminStyles.card}>
              <Text style={adminStyles.title}>
                {item.eventTitle ?? item.label ?? `${item.entityType} #${item.entityId}`}
              </Text>
              <Text style={adminStyles.sub}>
                {item.entityType}:{item.entityId} · {item.active ? "on" : "off"}
              </Text>
              <Pressable style={[adminStyles.chip, { borderColor: "#ef4444", alignSelf: "flex-start" }]} onPress={() => void remove(item.id)}>
                <Text style={[adminStyles.chipText, { color: "#ef4444" }]}>Delete</Text>
              </Pressable>
            </View>
          )}
        />
      )}
    </ScreenShell>
  );
}
