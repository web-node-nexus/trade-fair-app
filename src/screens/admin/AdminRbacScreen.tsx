import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles } from "./adminStyles";

type Role = { id: string; code: string; name: string };
type Perm = { id: string; code: string; description?: string | null };
type MatrixPayload = {
  roles: Role[];
  permissions: Perm[];
  matrix: Record<string, Record<string, boolean>>;
};

function buildDraft(data: MatrixPayload): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const r of data.roles) {
    const row = data.matrix[r.id] ?? {};
    out[r.id] = data.permissions.filter((p) => row[p.code]).map((p) => p.code);
  }
  return out;
}

export function AdminRbacScreen() {
  const [matrixData, setMatrixData] = useState<MatrixPayload | null>(null);
  const [draft, setDraft] = useState<Record<string, string[]>>({});
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const loadMatrix = useCallback(async () => {
    const data = await apiJson<MatrixPayload>("/admin/rbac/matrix");
    setMatrixData(data);
    setDraft(buildDraft(data));
    setSelectedRoleId((prev) => prev ?? data.roles[0]?.id ?? null);
  }, []);

  const { refreshControl } = usePullToRefresh(loadMatrix);

  useEffect(() => {
    void loadMatrix()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [loadMatrix]);

  const permissions = useMemo(() => matrixData?.permissions ?? [], [matrixData]);
  const selectedRole = matrixData?.roles.find((r) => r.id === selectedRoleId) ?? null;

  function togglePerm(roleId: string, permCode: string) {
    setDraft((prev) => {
      const next = { ...prev, [roleId]: [...(prev[roleId] ?? [])] };
      const set = new Set(next[roleId]);
      if (set.has(permCode)) set.delete(permCode);
      else set.add(permCode);
      next[roleId] = [...set].sort();
      return next;
    });
  }

  async function saveMatrix() {
    setBusy(true);
    try {
      await apiJson("/admin/rbac/matrix", { method: "PUT", body: JSON.stringify({ roles: draft }) });
      await loadMatrix();
      Alert.alert("Saved", "Permission matrix updated.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <ScreenShell title="RBAC" subtitle="Roles & permissions">
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  if (!matrixData) {
    return (
      <ScreenShell title="RBAC" subtitle="Roles & permissions">
        <Text style={adminStyles.empty}>Matrix unavailable.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="RBAC" subtitle="Permission matrix">
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <Text style={adminStyles.label}>Role</Text>
        <View style={adminStyles.row}>
          {matrixData.roles.map((r) => (
            <Pressable key={r.id} style={[adminStyles.chip, selectedRoleId === r.id && adminStyles.chipActive]} onPress={() => setSelectedRoleId(r.id)}>
              <Text style={adminStyles.chipText}>{r.code}</Text>
            </Pressable>
          ))}
        </View>

        {selectedRole ? (
          <View style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>{selectedRole.name || selectedRole.code}</Text>
            {permissions.map((p) => {
              const granted = (draft[selectedRole.id] ?? []).includes(p.code);
              return (
                <View key={p.code} style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <Text style={[adminStyles.sub, { flex: 1, marginRight: 8 }]}>{p.code}</Text>
                  <Switch value={granted} onValueChange={() => togglePerm(selectedRole.id, p.code)} />
                </View>
              );
            })}
          </View>
        ) : null}

        <View style={adminStyles.row}>
          <PrimaryButton label="Reset" variant="outline" compact onPress={() => void loadMatrix()} />
          <PrimaryButton label={busy ? "Saving…" : "Save matrix"} variant="cta" compact disabled={busy} onPress={() => void saveMatrix()} />
        </View>
      </ScrollView>
    </ScreenShell>
  );
}
