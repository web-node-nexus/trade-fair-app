import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { RefreshableFlatList } from "@/components/ui/RefreshableFlatList";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { adminStyles, ROLE_OPTIONS, statusBadgeStyle } from "./adminStyles";
import { rowsToCsv } from "@/lib/exportCsv";
import { shareTextAsFile } from "@/lib/downloadAuthenticated";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  phone: string | null;
  status: string;
  createdAt: string;
  roleCodes?: string[];
  pendingAdminReview?: boolean;
};

export function AdminUsersScreen() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingOnly, setPendingOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [createEmail, setCreateEmail] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createFullName, setCreateFullName] = useState("");
  const [createPhone, setCreatePhone] = useState("");
  const [createRoles, setCreateRoles] = useState<Record<string, boolean>>({ ORGANIZER: true });

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (roleFilter) n++;
    if (statusFilter) n++;
    if (pendingOnly) n++;
    return n;
  }, [roleFilter, statusFilter, pendingOnly]);

  const load = useCallback(async () => {
    const qs = new URLSearchParams();
    if (search.trim()) qs.set("search", search.trim());
    if (roleFilter) qs.set("role", roleFilter);
    if (statusFilter) qs.set("status", statusFilter);
    if (pendingOnly) qs.set("pendingReview", "true");
    const q = qs.toString();
    const data = await apiJson<{ users: UserRow[] }>(`/admin/users${q ? `?${q}` : ""}`);
    setUsers(data.users ?? []);
  }, [search, roleFilter, statusFilter, pendingOnly]);

  useEffect(() => {
    void load()
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  }, [load]);

  async function createUser() {
    const roleCodes = ROLE_OPTIONS.filter((r) => createRoles[r]);
    if (!createEmail.trim() || !createPassword || !createFullName.trim() || roleCodes.length === 0) {
      Alert.alert("Required", "Email, password, name, and at least one role are required.");
      return;
    }
    setBusy("create");
    try {
      await apiJson("/admin/users", {
        method: "POST",
        body: JSON.stringify({
          email: createEmail.trim(),
          password: createPassword,
          fullName: createFullName.trim(),
          phone: createPhone.trim() || null,
          roleCodes,
        }),
      });
      setCreateEmail("");
      setCreatePassword("");
      setCreateFullName("");
      setCreatePhone("");
      setCreateRoles({ ORGANIZER: true });
      setCreateOpen(false);
      await load();
      Alert.alert("Created", "User account created.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Create failed");
    } finally {
      setBusy(null);
    }
  }

  async function patchStatus(userId: string, status: string) {
    setBusy(userId);
    try {
      await apiJson(`/admin/users/${userId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  async function approveAccount(userId: string) {
    setBusy(userId);
    try {
      await apiJson(`/admin/users/${userId}/approve-account`, { method: "POST", body: JSON.stringify({}) });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Approve failed");
    } finally {
      setBusy(null);
    }
  }

  async function exportCsv() {
    if (!users.length) {
      Alert.alert("Export", "No users loaded to export.");
      return;
    }
    try {
      const csv = rowsToCsv(
        users.map((u) => ({
          id: u.id,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone ?? "",
          status: u.status,
          roles: (u.roleCodes ?? []).join(";"),
          createdAt: u.createdAt,
        }))
      );
      await shareTextAsFile(csv, `users_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) {
      Alert.alert("Export failed", e instanceof Error ? e.message : "Try again");
    }
  }

  function clearFilters() {
    setRoleFilter("");
    setStatusFilter("");
    setPendingOnly(false);
  }

  const headerRight = (
    <View style={{ flexDirection: "row", gap: 6 }}>
      <Pressable style={adminStyles.iconBtn} onPress={() => setCreateOpen(true)}>
        <Ionicons name="person-add-outline" size={20} color={colors.navy} />
      </Pressable>
      <Pressable
        style={[adminStyles.iconBtn, activeFilterCount > 0 && { borderColor: colors.emerald, backgroundColor: "#ecfdf5" }]}
        onPress={() => setFiltersOpen(true)}
      >
        <Ionicons name="options-outline" size={20} color={activeFilterCount > 0 ? colors.emerald : colors.navy} />
        {activeFilterCount > 0 ? (
          <View style={styles.filterDot}>
            <Text style={styles.filterDotText}>{activeFilterCount}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );

  return (
    <ScreenShell title="Users" subtitle={`${users.length} accounts`} right={headerRight}>
      <View style={adminStyles.searchRow}>
        <View style={adminStyles.searchBox}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={adminStyles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Search email or name"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={() => void load()}
          />
        </View>
        <Pressable style={adminStyles.iconBtn} onPress={() => void exportCsv()}>
          <Ionicons name="download-outline" size={20} color={colors.navy} />
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.emerald} style={{ marginTop: 40 }} />
      ) : (
        <RefreshableFlatList
          onRefresh={() => void load()}
          style={{ flex: 1, marginHorizontal: -spacing.screen }}
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: spacing.md }}
          data={users}
          keyExtractor={(u) => u.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState title="No users found." compact />}
          renderItem={({ item }) => {
            const badge = statusBadgeStyle(item.status);
            return (
              <View style={adminStyles.card}>
                <View style={adminStyles.cardTop}>
                  <View style={adminStyles.avatar}>
                    <Text style={adminStyles.avatarText}>{(item.fullName?.[0] ?? item.email[0]).toUpperCase()}</Text>
                  </View>
                  <View style={adminStyles.cardBody}>
                    <Text style={adminStyles.title} numberOfLines={1}>{item.fullName || "—"}</Text>
                    <Text style={adminStyles.sub} numberOfLines={1}>{item.email}</Text>
                  </View>
                  <View style={[adminStyles.badge, badge.badge]}>
                    <Text style={[adminStyles.badgeText, badge.text]}>{item.status}</Text>
                  </View>
                </View>

                <Text style={[adminStyles.sub, { marginTop: spacing.sm }]}>
                  {(item.roleCodes ?? []).join(" · ") || "No roles"}
                </Text>

                {item.pendingAdminReview ? (
                  <Pressable
                    style={[adminStyles.btn, adminStyles.approve, { marginTop: spacing.sm, flex: 0 }]}
                    disabled={busy === item.id}
                    onPress={() => void approveAccount(item.id)}
                  >
                    <Text style={adminStyles.btnText}>Clear pending review</Text>
                  </Pressable>
                ) : null}

                <View style={adminStyles.actionRow}>
                  {(["active", "inactive", "blocked"] as const).map((st) => (
                    <Pressable
                      key={st}
                      style={[adminStyles.actionPill, item.status === st && { borderColor: colors.emerald, backgroundColor: "#ecfdf5" }]}
                      disabled={busy === item.id}
                      onPress={() => void patchStatus(item.id, st)}
                    >
                      <Text style={adminStyles.actionPillText}>{st}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            );
          }}
        />
      )}

      <BottomSheetModal
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Filter users"
        footer={
          <View style={styles.sheetActions}>
            <Pressable onPress={clearFilters}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
            <PrimaryButton
              label="Apply"
              style={{ flex: 1 }}
              onPress={() => {
                setFiltersOpen(false);
                setLoading(true);
                void load().finally(() => setLoading(false));
              }}
            />
          </View>
        }
      >
        <Text style={adminStyles.label}>Role</Text>
        <View style={adminStyles.row}>
          {(["", ...ROLE_OPTIONS] as const).map((r) => (
            <Pressable
              key={r || "any"}
              style={[adminStyles.chip, roleFilter === r && adminStyles.chipActive]}
              onPress={() => setRoleFilter(r)}
            >
              <Text style={adminStyles.chipText}>{r || "Any"}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={adminStyles.label}>Status</Text>
        <View style={adminStyles.row}>
          {["", "active", "inactive", "blocked"].map((s) => (
            <Pressable
              key={s || "any-status"}
              style={[adminStyles.chip, statusFilter === s && adminStyles.chipActive]}
              onPress={() => setStatusFilter(s)}
            >
              <Text style={adminStyles.chipText}>{s || "Any"}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Legacy pending only</Text>
          <Switch value={pendingOnly} onValueChange={setPendingOnly} trackColor={{ true: colors.emerald }} />
        </View>
      </BottomSheetModal>

      <BottomSheetModal visible={createOpen} onClose={() => setCreateOpen(false)} title="Create user" maxHeight="85%">
        <Text style={adminStyles.label}>Email</Text>
        <TextInput style={adminStyles.input} value={createEmail} onChangeText={setCreateEmail} autoCapitalize="none" keyboardType="email-address" />
        <Text style={adminStyles.label}>Password</Text>
        <TextInput style={adminStyles.input} value={createPassword} onChangeText={setCreatePassword} secureTextEntry />
        <Text style={adminStyles.label}>Full name</Text>
        <TextInput style={adminStyles.input} value={createFullName} onChangeText={setCreateFullName} />
        <Text style={adminStyles.label}>Phone</Text>
        <TextInput style={adminStyles.input} value={createPhone} onChangeText={setCreatePhone} keyboardType="phone-pad" />
        <Text style={adminStyles.label}>Roles</Text>
        <View style={adminStyles.row}>
          {ROLE_OPTIONS.map((r) => (
            <Pressable
              key={r}
              style={[adminStyles.chip, createRoles[r] && adminStyles.chipActive]}
              onPress={() => setCreateRoles((prev) => ({ ...prev, [r]: !prev[r] }))}
            >
              <Text style={adminStyles.chipText}>{r.replace(/_/g, " ")}</Text>
            </Pressable>
          ))}
        </View>
        <PrimaryButton label={busy === "create" ? "Creating…" : "Create user"} disabled={busy === "create"} onPress={() => void createUser()} />
      </BottomSheetModal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  filterDot: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.emerald,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  filterDotText: { color: "#fff", fontSize: 8, fontWeight: "800" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  toggleLabel: { fontSize: 14, fontWeight: "600", color: colors.navy },
  sheetActions: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  clearText: { color: colors.textMuted, fontWeight: "700", paddingHorizontal: spacing.sm },
});
