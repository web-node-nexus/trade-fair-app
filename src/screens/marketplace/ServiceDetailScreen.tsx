import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { publicJson } from "@/lib/authFetch";
import { resolveMediaUrl } from "@/lib/mediaUrl";
import { ZoomableImage } from "@/context/ImageZoomContext";
import type { ServiceListing, ServiceProviderContact } from "@/api/types";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type ServiceDetailPayload = {
  service: ServiceListing;
  provider: ServiceProviderContact | null;
};

export function ServiceDetailScreen() {
  const { serviceId } = useLocalSearchParams<{ serviceId: string }>();
  const [service, setService] = useState<ServiceListing | null>(null);
  const [provider, setProvider] = useState<ServiceProviderContact | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!serviceId) return;
    const d = await publicJson<ServiceDetailPayload>(`/services/${serviceId}`);
    setService(d.service);
    setProvider(d.provider ?? null);
  }, [serviceId]);

  const { refreshControl } = usePullToRefresh(load);

  useEffect(() => {
    void load()
      .catch(() => {
        setService(null);
        setProvider(null);
      })
      .finally(() => setLoading(false));
  }, [load]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  if (!service) {
    return (
      <ScreenShell title="Service">
        <Text style={styles.muted}>Service not found.</Text>
      </ScreenShell>
    );
  }

  const imageUrl = resolveMediaUrl(service.coverImageUrl ?? service.imageUrls?.[0] ?? null);
  const galleryUrls = [
    ...(service.coverImageUrl ? [service.coverImageUrl] : []),
    ...(service.imageUrls ?? []),
  ]
    .map((u) => resolveMediaUrl(u))
    .filter((u): u is string => Boolean(u));
  const uniqueGallery = [...new Set(galleryUrls)];
  const price = service.priceMinor ? Number(service.priceMinor) : 0;

  return (
    <ScreenShell title={service.title} subtitle={service.categoryName ?? "Service provider"}>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={refreshControl}>
        {imageUrl ? (
          <ZoomableImage uri={imageUrl} style={styles.cover} contentFit="cover" />
        ) : null}

        {uniqueGallery.length > 1 ? (
          <>
            <Text style={styles.sectionTitle}>Gallery</Text>
            <FlatList
              horizontal
              data={uniqueGallery}
              keyExtractor={(u) => u}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.galleryRow}
              renderItem={({ item }) => (
                <ZoomableImage uri={item} style={styles.galleryThumb} contentFit="cover" />
              )}
            />
          </>
        ) : null}

        {price > 0 ? (
          <Text style={styles.price}>
            ₹{(price / 100).toLocaleString("en-IN")} {service.currency ?? "INR"}
          </Text>
        ) : null}

        {service.description ? <Text style={styles.desc}>{service.description}</Text> : null}

        {service.serviceArea ? (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={16} color={colors.emerald} />
            <Text style={styles.metaText}>{service.serviceArea}</Text>
          </View>
        ) : null}

        {service.leadTimeDays != null ? (
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={16} color={colors.emerald} />
            <Text style={styles.metaText}>Lead time: ~{service.leadTimeDays} days</Text>
          </View>
        ) : null}

        {service.deliveryNotes ? (
          <View style={styles.notesBox}>
            <Text style={styles.notesTitle}>Delivery & details</Text>
            <Text style={styles.notesBody}>{service.deliveryNotes}</Text>
          </View>
        ) : null}

        {provider ? (
          <View style={styles.providerSection}>
            <Text style={styles.sectionTitle}>Service provider</Text>
            <Text style={styles.callHint}>Call or email directly to confirm your requirement.</Text>
            <View style={styles.providerCard}>
              <ProviderRow label="Name" value={provider.name || provider.companyName || "—"} />
              {provider.companyName && provider.name ? (
                <ProviderRow label="Company" value={provider.companyName} />
              ) : null}
              <ProviderRow
                label="Email"
                value={provider.email || "Not provided"}
                onPress={provider.email ? () => void Linking.openURL(`mailto:${provider.email}`) : undefined}
                link
              />
              <ProviderRow
                label="Phone"
                value={provider.phone || "Not provided"}
                onPress={provider.phone ? () => void Linking.openURL(`tel:${provider.phone}`) : undefined}
                link={Boolean(provider.phone)}
              />
            </View>
          </View>
        ) : null}

        {/*
          Phase 2: enquiry → in-app chat → contract → booking
          async function sendEnquiry() { ... }
        */}
      </ScrollView>
    </ScreenShell>
  );
}

function ProviderRow({
  label,
  value,
  onPress,
  link,
}: {
  label: string;
  value: string;
  onPress?: () => void;
  link?: boolean;
}) {
  const content = (
    <View style={styles.providerRow}>
      <Text style={styles.providerLabel}>{label}</Text>
      <Text style={[styles.providerValue, link && styles.providerLink]}>{value}</Text>
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted },
  cover: {
    width: "100%",
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  galleryRow: { gap: spacing.sm, paddingBottom: spacing.md },
  galleryThumb: {
    width: 120,
    height: 90,
    borderRadius: radius.md,
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.cta,
    marginBottom: spacing.sm,
  },
  desc: { fontSize: 15, lineHeight: 22, color: colors.textMuted, marginBottom: spacing.md },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: spacing.sm },
  metaText: { flex: 1, fontSize: 14, color: colors.textMuted },
  notesBox: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  notesTitle: { fontSize: 13, fontWeight: "800", color: colors.navy, marginBottom: 6 },
  notesBody: { fontSize: 14, lineHeight: 20, color: colors.textMuted },
  providerSection: { marginTop: spacing.md, marginBottom: spacing.xl },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: 4 },
  callHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.sm },
  providerCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  providerRow: { gap: 4 },
  providerLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textMuted,
    textTransform: "uppercase",
  },
  providerValue: { fontSize: 15, fontWeight: "600", color: colors.navy },
  providerLink: { color: colors.cta },
});
