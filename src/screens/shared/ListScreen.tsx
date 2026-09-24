import { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingView } from "@/components/ui/LoadingView";
import { apiJson } from "@/lib/authFetch";
import { extractList } from "@/lib/extractList";
import { appStyles } from "@/theme/appStyles";

type Props = {
  title: string;
  subtitle?: string;
  endpoint: string;
  emptyMessage: string;
  keyField?: string;
  labelField?: string;
  subField?: string;
  onItemPress?: (item: Record<string, unknown>) => void;
};

export function ListScreen({
  title,
  subtitle,
  endpoint,
  emptyMessage,
  keyField = "id",
  labelField = "title",
  subField,
  onItemPress,
}: Props) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiJson<Record<string, unknown>>(endpoint);
      setItems(extractList(data));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) return <LoadingView />;

  return (
    <ScreenShell title={title} subtitle={subtitle} scroll onRefresh={load}>
      {error ? (
        <EmptyState icon="cloud-offline-outline" title="Could not load" message={error} actionLabel="Retry" onAction={() => void load()} compact />
      ) : (
        <FlatList
          data={items}
          scrollEnabled={false}
          keyExtractor={(item, i) => String(item[keyField] ?? i)}
          ListEmptyComponent={<EmptyState title={emptyMessage} icon="folder-open-outline" compact />}
          renderItem={({ item }) => {
            const body = (
              <>
                <Text style={appStyles.cardTitle}>{String(item[labelField] ?? "—")}</Text>
                {subField && item[subField] != null ? (
                  <Text style={appStyles.cardSub}>{String(item[subField])}</Text>
                ) : null}
              </>
            );
            if (onItemPress) {
              return (
                <Pressable style={appStyles.card} onPress={() => onItemPress(item)}>
                  {body}
                </Pressable>
              );
            }
            return <View style={appStyles.card}>{body}</View>;
          }}
        />
      )}
    </ScreenShell>
  );
}
