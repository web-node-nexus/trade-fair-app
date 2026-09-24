import { Image, StyleSheet, Text, View } from "react-native";
import { useEffect, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { useAuth } from "@/context/AuthContext";
import { getMarketingPage, type MarketingPage } from "@/data/marketingContent";
import { MARKETING_PAGES } from "@/lib/webBaseUrl";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  slug?: string;
  title?: string;
  page?: MarketingPage;
};

const ROLE_SLUGS: Record<string, { role: string; dashboard: string; accountType: string }> = {
  "for-organizers": {
    role: "ORGANIZER",
    dashboard: "/dashboard/organizer",
    accountType: "organizer",
  },
  "for-exhibitors": {
    role: "EXHIBITOR",
    dashboard: "/dashboard/exhibitor",
    accountType: "exhibitor",
  },
  "for-service-providers": {
    role: "SERVICE_PROVIDER",
    dashboard: "/dashboard/service-provider",
    accountType: "service_provider",
  },
  "for-visitors": {
    role: "VISITOR",
    dashboard: "/dashboard/visitor",
    accountType: "visitor",
  },
};

function parseCtaRoute(route: string): { pathname: string; params?: Record<string, string> } {
  const [path, query = ""] = route.split("?");
  if (!query) return { pathname: path };
  const params: Record<string, string> = {};
  for (const part of query.split("&")) {
    const [k, v] = part.split("=");
    if (k && v) params[decodeURIComponent(k)] = decodeURIComponent(v);
  }
  return { pathname: path, params };
}

export function NativeMarketingScreen({ slug: slugProp, title: titleProp, page: pageProp }: Props) {
  const router = useRouter();
  const { ready, user, primaryDashboard } = useAuth();
  const slug = slugProp ?? "";
  const fallbackTitle = MARKETING_PAGES[slug]?.title ?? "Page";
  const page = pageProp ?? getMarketingPage(slug);
  const title = titleProp ?? page?.title ?? fallbackTitle;
  const roleMeta = ROLE_SLUGS[slug];

  const hasRole = useMemo(() => {
    if (!user || !roleMeta) return false;
    return (user.roles ?? []).includes(roleMeta.role);
  }, [user, roleMeta]);

  useEffect(() => {
    if (!ready || !user || !roleMeta) return;
    // Signed-in users with this role go to their workspace — not create-event marketing CTAs
    if (hasRole) {
      router.replace(roleMeta.dashboard as never);
    }
  }, [ready, user, roleMeta, hasRole, router]);

  if (!ready) {
    return (
      <ScreenShell title={title}>
        <Text style={styles.emptyBody}>Loading…</Text>
      </ScreenShell>
    );
  }

  if (user && roleMeta && hasRole) {
    return (
      <ScreenShell title={title}>
        <Text style={styles.emptyBody}>Opening your workspace…</Text>
      </ScreenShell>
    );
  }

  if (!page) {
    return (
      <ScreenShell title={title}>
        <View style={styles.empty}>
          <Ionicons name="document-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Page not found</Text>
          <Text style={styles.emptyBody}>This content is not available in the app yet.</Text>
          <PrimaryButton label="Go back" onPress={() => router.back()} />
        </View>
      </ScreenShell>
    );
  }

  const onCta = () => {
    if (!page.cta) return;

    // Guests must sign in before any role workspace / create-event action
    if (!user) {
      const accountType = roleMeta?.accountType;
      router.push({
        pathname: "/(auth)/login",
        params: accountType ? { accountType, next: page.cta.route } : undefined,
      } as never);
      return;
    }

    // Logged in without this role — register path or browse
    const parsed = parseCtaRoute(page.cta.route);
    if (parsed.pathname.startsWith("/dashboard")) {
      router.push(primaryDashboard as never);
      return;
    }
    if (parsed.pathname.includes("login") || parsed.pathname.includes("register")) {
      router.push({
        pathname: "/(auth)/register",
        params: roleMeta ? { accountType: roleMeta.accountType } : parsed.params,
      } as never);
      return;
    }
    router.push(parsed.pathname as never);
  };

  return (
    <ScreenShell title={title} subtitle={page.subtitle} scroll onRefresh={async () => {}}>
      {page.heroImage ? (
        <Image
          source={page.heroImage}
          style={styles.heroImage}
          resizeMode="cover"
          accessibilityLabel=""
        />
      ) : (
        <View style={[styles.heroIcon, { backgroundColor: `${page.accent}18` }]}>
          <Ionicons name={page.icon as keyof typeof Ionicons.glyphMap} size={32} color={page.accent} />
        </View>
      )}

      {page.sections.map((section) => (
        <View key={section.heading} style={styles.section}>
          <Text style={styles.sectionHeading}>{section.heading}</Text>
          {section.body ? <Text style={styles.sectionBody}>{section.body}</Text> : null}
          {section.bullets?.map((b) => (
            <View key={b} style={styles.bulletRow}>
              <View style={[styles.bulletDot, { backgroundColor: page.accent }]} />
              <Text style={styles.bulletText}>{b}</Text>
            </View>
          ))}
        </View>
      ))}

      {page.cta ? (
        <View style={styles.ctaWrap}>
          <PrimaryButton
            label={user ? (roleMeta ? "Register for this role" : page.cta.label) : page.cta.label}
            onPress={onCta}
          />
        </View>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingBottom: spacing.xxl },
  heroImage: {
    width: "100%",
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.border,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.navy,
    marginBottom: spacing.sm,
  },
  sectionBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.textMuted,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  ctaWrap: { marginTop: spacing.md },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
    paddingVertical: spacing.section,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: colors.navy },
  emptyBody: { fontSize: 14, color: colors.textMuted, textAlign: "center" },
});
