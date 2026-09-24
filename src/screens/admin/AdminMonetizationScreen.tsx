import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import { formatInrFromMinor } from "@/lib/formatMoney";
import { adminStyles } from "./adminStyles";

type PlanRow = {
  id: number;
  name: string;
  description: string | null;
  priceMinor: string;
  durationDays: number;
  active: boolean;
  targetRoleCode: string;
  stallBookingCommissionBps: number;
};

type ReferralRow = {
  id: number;
  code: string;
  label: string;
  targetRoleCode: string;
  discountType: "percent" | "fixed_minor";
  discountValue: number;
  active: boolean;
  redemptionCount: number;
};

export function AdminMonetizationScreen() {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [codes, setCodes] = useState<ReferralRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"plans" | "referrals" | "grant">("plans");
  const [editPlanId, setEditPlanId] = useState<number | null>(null);
  const [planName, setPlanName] = useState("");
  const [planDescription, setPlanDescription] = useState("");
  const [planPrice, setPlanPrice] = useState("999");
  const [planDays, setPlanDays] = useState("365");
  const [planRole, setPlanRole] = useState<"ORGANIZER" | "SERVICE_PROVIDER">("ORGANIZER");
  const [planActive, setPlanActive] = useState(true);
  const [planCommission, setPlanCommission] = useState("10");
  const [refCode, setRefCode] = useState("");
  const [refLabel, setRefLabel] = useState("");
  const [refDiscount, setRefDiscount] = useState("20");
  const [refActive, setRefActive] = useState(true);
  const [subUser, setSubUser] = useState("");
  const [subPlanId, setSubPlanId] = useState("");

  const load = useCallback(async () => {
    const [pl, rc] = await Promise.all([
      apiJson<{ plans: PlanRow[] }>("/admin/monetization/subscription-plans"),
      apiJson<{ codes: ReferralRow[] }>("/admin/monetization/referral-codes"),
    ]);
    setPlans(pl.plans ?? []);
    setCodes(rc.codes ?? []);
  }, []);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [load]);

  function loadPlanIntoForm(p: PlanRow) {
    setEditPlanId(p.id);
    setPlanName(p.name);
    setPlanDescription(p.description ?? "");
    setPlanPrice(String(Number(p.priceMinor) / 100));
    setPlanDays(String(p.durationDays));
    setPlanRole(p.targetRoleCode === "SERVICE_PROVIDER" ? "SERVICE_PROVIDER" : "ORGANIZER");
    setPlanActive(p.active);
    setPlanCommission(String((p.stallBookingCommissionBps ?? 0) / 100));
    setTab("plans");
  }

  async function savePlan() {
    const minor = Math.round(Number(planPrice) * 100);
    if (!planName.trim() || !Number.isFinite(minor) || minor < 0) {
      Alert.alert("Invalid", "Name and valid price required.");
      return;
    }
    const pct = Number(planCommission);
    const bps = planRole === "SERVICE_PROVIDER" ? 0 : Math.round(pct * 100);
    try {
      await apiJson("/admin/monetization/subscription-plans", {
        method: "PUT",
        body: JSON.stringify({
          ...(editPlanId ? { id: editPlanId } : {}),
          name: planName.trim(),
          description: planDescription.trim() || null,
          priceMinor: minor,
          durationDays: Number(planDays),
          active: planActive,
          targetRoleCode: planRole,
          limitations: null,
          stallBookingCommissionBps: bps,
        }),
      });
      setEditPlanId(null);
      setPlanName("");
      setPlanDescription("");
      await load();
      Alert.alert("Saved", "Subscription plan saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function deletePlan(id: number) {
    Alert.alert("Delete plan?", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          void (async () => {
            try {
              await apiJson(`/admin/monetization/subscription-plans/${id}`, { method: "DELETE" });
              await load();
            } catch (e) {
              Alert.alert("Error", e instanceof Error ? e.message : "Delete failed");
            }
          })();
        },
      },
    ]);
  }

  async function saveReferral() {
    if (!refCode.trim() || !refLabel.trim()) {
      Alert.alert("Required", "Code and label required.");
      return;
    }
    try {
      await apiJson("/admin/monetization/referral-codes", {
        method: "PUT",
        body: JSON.stringify({
          code: refCode.trim(),
          label: refLabel.trim(),
          targetRoleCode: "ORGANIZER",
          discountType: "percent",
          discountValue: Math.trunc(Number(refDiscount)),
          maxRedemptions: null,
          validFrom: null,
          validUntil: null,
          active: refActive,
        }),
      });
      setRefCode("");
      setRefLabel("");
      await load();
      Alert.alert("Saved", "Referral code saved.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Save failed");
    }
  }

  async function toggleReferral(row: ReferralRow) {
    try {
      await apiJson(`/admin/monetization/referral-codes/${row.id}/active`, {
        method: "PATCH",
        body: JSON.stringify({ active: !row.active }),
      });
      await load();
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Update failed");
    }
  }

  async function grantSubscription() {
    if (!subUser.trim() || !subPlanId) {
      Alert.alert("Required", "User id and plan required.");
      return;
    }
    try {
      await apiJson("/admin/monetization/subscribe-user", {
        method: "POST",
        body: JSON.stringify({ userId: subUser.trim(), planId: Number(subPlanId) }),
      });
      Alert.alert("Granted", "Subscription assigned.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed");
    }
  }

  if (loading) {
    return (
      <ScreenShell title="Monetization" subtitle="Plans & referral codes">
        <ActivityIndicator color="#0d9488" style={{ marginTop: 40 }} />
      </ScreenShell>
    );
  }

  return (
    <ScreenShell title="Monetization" subtitle="Subscription plans & codes">
      <View style={adminStyles.row}>
        {(["plans", "referrals", "grant"] as const).map((t) => (
          <Pressable key={t} style={[adminStyles.chip, tab === t && adminStyles.chipActive]} onPress={() => setTab(t)}>
            <Text style={adminStyles.chipText}>{t}</Text>
          </Pressable>
        ))}
      </View>

      {tab === "plans" ? (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
          <View style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>{editPlanId ? `Edit plan #${editPlanId}` : "Create plan"}</Text>
            <TextInput style={adminStyles.input} value={planName} onChangeText={setPlanName} placeholder="Name" />
            <TextInput
              style={[adminStyles.input, { minHeight: 100, textAlignVertical: "top" }]}
              value={planDescription}
              onChangeText={setPlanDescription}
              placeholder="Description (shown on plan cards)"
              multiline
            />
            <TextInput style={adminStyles.input} value={planPrice} onChangeText={setPlanPrice} placeholder="Price INR" keyboardType="decimal-pad" />
            <TextInput style={adminStyles.input} value={planDays} onChangeText={setPlanDays} placeholder="Duration days" keyboardType="number-pad" />
            <View style={adminStyles.row}>
              {(["ORGANIZER", "SERVICE_PROVIDER"] as const).map((r) => (
                <Pressable key={r} style={[adminStyles.chip, planRole === r && adminStyles.chipActive]} onPress={() => setPlanRole(r)}>
                  <Text style={adminStyles.chipText}>{r}</Text>
                </Pressable>
              ))}
            </View>
            {planRole === "ORGANIZER" ? (
              <TextInput style={adminStyles.input} value={planCommission} onChangeText={setPlanCommission} placeholder="Stall commission %" keyboardType="decimal-pad" />
            ) : null}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Switch value={planActive} onValueChange={setPlanActive} />
              <Text style={adminStyles.sub}>Active</Text>
            </View>
            <PrimaryButton label="Save plan" variant="cta" onPress={() => void savePlan()} />
          </View>
          {plans.map((p) => (
            <View key={p.id} style={adminStyles.card}>
              <Text style={adminStyles.title}>{p.name}</Text>
              <Text style={adminStyles.sub}>
                {formatInrFromMinor(p.priceMinor)} · {p.durationDays}d · {p.targetRoleCode} · {p.active ? "Active" : "Inactive"}
              </Text>
              <View style={adminStyles.row}>
                <Pressable style={adminStyles.chip} onPress={() => loadPlanIntoForm(p)}>
                  <Text style={adminStyles.chipText}>Edit</Text>
                </Pressable>
                <Pressable style={[adminStyles.chip, { borderColor: "#ef4444" }]} onPress={() => void deletePlan(p.id)}>
                  <Text style={[adminStyles.chipText, { color: "#ef4444" }]}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {tab === "referrals" ? (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
          <View style={adminStyles.section}>
            <Text style={adminStyles.sectionTitle}>Upsert referral code</Text>
            <TextInput style={adminStyles.input} value={refCode} onChangeText={setRefCode} placeholder="Code" autoCapitalize="characters" />
            <TextInput style={adminStyles.input} value={refLabel} onChangeText={setRefLabel} placeholder="Label" />
            <TextInput style={adminStyles.input} value={refDiscount} onChangeText={setRefDiscount} placeholder="Discount %" keyboardType="number-pad" />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Switch value={refActive} onValueChange={setRefActive} />
              <Text style={adminStyles.sub}>Active</Text>
            </View>
            <PrimaryButton label="Save code" variant="cta" onPress={() => void saveReferral()} />
          </View>
          {codes.map((c) => (
            <View key={c.id} style={adminStyles.card}>
              <Text style={adminStyles.title}>{c.code}</Text>
              <Text style={adminStyles.sub}>{c.label} · {c.discountValue}% · used {c.redemptionCount} · {c.active ? "on" : "off"}</Text>
              <Pressable style={adminStyles.chip} onPress={() => void toggleReferral(c)}>
                <Text style={adminStyles.chipText}>{c.active ? "Deactivate" : "Activate"}</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}

      {tab === "grant" ? (
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        <View style={adminStyles.section}>
          <Text style={adminStyles.sectionTitle}>Grant subscription</Text>
          <TextInput style={adminStyles.input} value={subUser} onChangeText={setSubUser} placeholder="User id" />
          <Text style={adminStyles.label}>Plan id</Text>
          {plans.filter((p) => p.active).map((p) => (
            <Pressable key={p.id} style={[adminStyles.chip, subPlanId === String(p.id) && adminStyles.chipActive]} onPress={() => setSubPlanId(String(p.id))}>
              <Text style={adminStyles.chipText}>{p.name} (#{p.id})</Text>
            </Pressable>
          ))}
          <PrimaryButton label="Grant" variant="cta" onPress={() => void grantSubscription()} />
        </View>
        </ScrollView>
      ) : null}
    </ScreenShell>
  );
}
