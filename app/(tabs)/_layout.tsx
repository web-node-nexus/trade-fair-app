import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useI18n } from "@/context/I18nContext";
import { colors } from "@/theme/colors";
import { tabBarBottomInset, tabBarTotalHeight } from "@/lib/tabBarInsets";

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = tabBarBottomInset(insets.bottom);
  const { t } = useI18n();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.navy,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarTotalHeight(insets.bottom),
          paddingTop: 6,
          paddingBottom: bottomInset,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarLabelStyle: styles.tabLabel,
        tabBarHideOnKeyboard: true,
        animation: "shift",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("tabs.home"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="trade-fairs"
        options={{
          title: t("tabs.fairs"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "calendar" : "calendar-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: t("tabs.services"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "construct" : "construct-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="workspace"
        options={{
          title: t("tabs.workspace"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "briefcase" : "briefcase-outline"} size={23} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("tabs.profile"),
          tabBarIcon: ({ focused, color }) => (
            <Ionicons name={focused ? "person" : "person-outline"} size={23} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
});
