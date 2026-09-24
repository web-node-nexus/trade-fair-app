import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { ScreenShell } from "@/components/ui/ScreenShell";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { KeyboardAwareScrollView } from "@/components/ui/KeyboardAwareScrollView";
import { DateTimeField } from "@/components/ui/DateTimeField";
import { TextField } from "@/components/ui/TextField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { apiJson } from "@/lib/authFetch";
import {
  contactsToPayload,
  draftsFromContacts,
  newContactDraft,
  type EventContact,
  type EventContactDraft,
} from "@/utils/eventContacts";
import { ZoomableImage } from "@/context/ImageZoomContext";
import {
  defaultDatetimeLocal,
  parseDatetimeLocal,
  toDatetimeLocalValue,
} from "@/lib/datetimeLocal";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useAuth } from "@/context/AuthContext";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Category = { id: number; name: string; slug: string };

type LoadedEvent = {
  title: string;
  description: string | null;
  venueName: string;
  venueCity: string | null;
  venueCountry: string | null;
  venueState: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  startsAt: string;
  endsAt: string;
  categoryId: number | null;
  categoryIds?: number[];
  requireBookingApproval?: boolean;
  stallBookingEnabled?: boolean;
  stallTokenEnabled?: boolean;
  stallTokenAmountMinor?: string;
  entryQrAllowReentry?: boolean;
  isFeatured?: boolean;
  isB2b: boolean;
  isB2c: boolean;
  tags: string[] | null;
  status: string;
  contacts?: EventContact[];
};

type StepKey = "basics" | "venue" | "categories" | "tickets" | "media" | "stall" | "finish";

function validatePublishedSchedule(starts: string, ends: string): string | null {
  const s = new Date(starts);
  const e = new Date(ends);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "Enter valid start and end dates.";
  if (e.getTime() <= s.getTime()) return "End date must be after start date.";
  if (e.getTime() <= Date.now()) {
    return "End date must be in the future for a published fair to appear on the homepage.";
  }
  return null;
}

function buildSteps(premiumActive: boolean, stallEnabled: boolean): StepKey[] {
  const steps: StepKey[] = ["basics", "venue"];
  if (premiumActive) steps.push("tickets");
  steps.push("categories", "media");
  if (premiumActive && stallEnabled) steps.push("stall");
  steps.push("finish");
  return steps;
}

const STEP_LABELS: Record<StepKey, string> = {
  basics: "Basics",
  venue: "Venue",
  categories: "Categories",
  tickets: "Tickets",
  media: "Media",
  stall: "Stall booking",
  finish: "Finish",
};

function rupeesFieldToMinor(rupees: string): number {
  const n = Number(String(rupees).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

export function OrganizerEventFormScreen({ eventId }: { eventId?: string }) {
  const router = useRouter();
  const { profile } = useAuth();
  const premiumActive = Boolean(profile?.subscriptionByRole?.ORGANIZER?.premiumActive);

  /** Height reserved so scroll content clears the sticky Back/Next footer */
  const navFooterHeight = 56;
  const scrollBottomPad = navFooterHeight + spacing.md;

  const [savedEventId, setSavedEventId] = useState<string | undefined>(eventId);
  const [wasPublished, setWasPublished] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [venueName, setVenueName] = useState("");
  const [venueCity, setVenueCity] = useState("");
  const [venueState, setVenueState] = useState("");
  const [venueCountry, setVenueCountry] = useState("");
  const [address, setAddress] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [starts, setStarts] = useState(() => (eventId ? "" : defaultDatetimeLocal(7, 10)));
  const [ends, setEnds] = useState(() => (eventId ? "" : defaultDatetimeLocal(10, 18)));
  const [categoryIdsPick, setCategoryIdsPick] = useState<Set<number>>(new Set());
  const [bookingApprovalMode, setBookingApprovalMode] = useState<"auto" | "manual">("auto");
  const [stallBookingEnabled, setStallBookingEnabled] = useState(false);
  const [stallTokenEnabled, setStallTokenEnabled] = useState(false);
  const [stallTokenRupees, setStallTokenRupees] = useState("");
  const [entryQrAllowReentry, setEntryQrAllowReentry] = useState(false);
  const [ticketName, setTicketName] = useState("General");
  const [ticketPrice, setTicketPrice] = useState("0");
  const [ticketQuota, setTicketQuota] = useState("500");
  const [existingTicketTypeId, setExistingTicketTypeId] = useState<string | null>(null);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isB2b, setIsB2b] = useState(true);
  const [isB2c, setIsB2c] = useState(true);
  const [tagsRaw, setTagsRaw] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(false);
  const [loadState, setLoadState] = useState<"loading" | "ready" | "error">(() => (eventId ? "loading" : "ready"));
  const [pendingBanner, setPendingBanner] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [pendingGallery, setPendingGallery] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [contactDrafts, setContactDrafts] = useState<EventContactDraft[]>(() => [newContactDraft()]);
  const [stepIndex, setStepIndex] = useState(0);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);

  const steps = useMemo(() => buildSteps(premiumActive, stallBookingEnabled), [premiumActive, stallBookingEnabled]);
  const currentStep = steps[stepIndex] ?? "basics";
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;
  const startsDate = useMemo(() => parseDatetimeLocal(starts), [starts]);
  const endsMinDate = useMemo(() => startsDate ?? undefined, [startsDate]);

  function handleStartsChange(value: string) {
    setStarts(value);
    const nextStart = parseDatetimeLocal(value);
    const currentEnd = parseDatetimeLocal(ends);
    if (nextStart && currentEnd && currentEnd.getTime() <= nextStart.getTime()) {
      const bumped = new Date(nextStart);
      bumped.setHours(bumped.getHours() + 3);
      setEnds(toDatetimeLocalValue(bumped));
    }
  }

  useEffect(() => {
    if (stepIndex >= steps.length) setStepIndex(Math.max(0, steps.length - 1));
  }, [stepIndex, steps.length]);

  const hydrateFromEvent = useCallback((ev: LoadedEvent) => {
    const cats =
      ev.categoryIds?.length ? ev.categoryIds
      : ev.categoryId != null && ev.categoryId > 0 ? [ev.categoryId]
      : [];
    setTitle(ev.title);
    setDescription(ev.description ?? "");
    setVenueName(ev.venueName);
    setVenueCity(ev.venueCity ?? "");
    setVenueState(ev.venueState ?? "");
    setVenueCountry(ev.venueCountry ?? "");
    setAddress(ev.address ?? "");
    setStarts(toDatetimeLocalValue(ev.startsAt));
    setEnds(toDatetimeLocalValue(ev.endsAt));
    setCategoryIdsPick(new Set(cats));
    setBookingApprovalMode(ev.requireBookingApproval ? "manual" : "auto");
    setStallBookingEnabled(ev.stallBookingEnabled !== false);
    setStallTokenEnabled(Boolean(ev.stallTokenEnabled));
    const tokenMinor = Number(ev.stallTokenAmountMinor ?? 0);
    setStallTokenRupees(tokenMinor > 0 ? (tokenMinor / 100).toFixed(2).replace(/\.?0+$/, "") : "");
    setEntryQrAllowReentry(Boolean(ev.entryQrAllowReentry));
    setIsFeatured(Boolean(ev.isFeatured));
    setIsB2b(ev.isB2b);
    setIsB2c(ev.isB2c);
    setTagsRaw(ev.tags?.length ? ev.tags.join(", ") : "");
    const published = ev.status === "published";
    setStatus(published ? "published" : "draft");
    setWasPublished(published);
    setContactDrafts(draftsFromContacts(ev.contacts ?? []));
  }, []);

  const loadCategories = useCallback(async () => {
    try {
      const j = await apiJson<{ categories: Category[] }>("/events/categories");
      setCategories(j.categories ?? []);
    } catch {
      setCategories([]);
    }
  }, []);

  const loadEvent = useCallback(async () => {
    if (!eventId) return;
    setLoadState("loading");
    try {
      const [data, ticketData] = await Promise.all([
        apiJson<{ event: LoadedEvent }>(`/organizer/events/${eventId}`),
        apiJson<{ ticketTypes: { id: string; name: string; priceMinor: string; quota: number }[] }>(
          `/organizer/events/${eventId}/ticket-types`
        ).catch(() => ({ ticketTypes: [] as { id: string; name: string; priceMinor: string; quota: number }[] })),
      ]);
      hydrateFromEvent(data.event);
      const firstTicket = ticketData.ticketTypes?.[0];
      if (firstTicket) {
        setExistingTicketTypeId(firstTicket.id);
        setTicketName(firstTicket.name);
        setTicketPrice(String(Number(firstTicket.priceMinor) / 100));
        setTicketQuota(String(firstTicket.quota));
      } else {
        setExistingTicketTypeId(null);
      }
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }, [eventId, hydrateFromEvent]);

  const reloadForm = useCallback(async () => {
    await loadCategories();
    await loadEvent();
  }, [loadCategories, loadEvent]);

  const { refreshControl } = usePullToRefresh(reloadForm);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    void loadEvent();
  }, [loadEvent]);

  const selectedCategoryLabel = useMemo(() => {
    if (categoryIdsPick.size === 0) return "Choose categories";
    const names = categories.filter((c) => categoryIdsPick.has(c.id)).map((c) => c.name);
    return names.length <= 2 ? names.join(", ") : `${names.slice(0, 2).join(", ")} +${names.length - 2}`;
  }, [categories, categoryIdsPick]);

  function validateStep(step: StepKey): string | null {
    if (step === "basics") {
      if (!title.trim()) return "Event title is required.";
      if (Number.isNaN(new Date(starts).getTime()) || Number.isNaN(new Date(ends).getTime())) {
        return "Enter valid start and end dates.";
      }
      if (new Date(ends).getTime() <= new Date(starts).getTime()) {
        return "End date must be after start date.";
      }
    }
    if (step === "venue" && !venueName.trim()) return "Venue name is required.";
    if (step === "tickets") {
      if (!ticketName.trim()) return "Ticket name is required.";
      const priceMinor = rupeesFieldToMinor(ticketPrice);
      if (!Number.isFinite(priceMinor)) return "Enter a valid ticket price (0 for free).";
      const q = Number(ticketQuota);
      if (!Number.isFinite(q) || q < 1) return "Enter max tickets (at least 1).";
    }
    if (step === "stall" && stallTokenEnabled) {
      const rupees = parseFloat(stallTokenRupees.trim());
      if (!Number.isFinite(rupees) || rupees <= 0) return "Enter a valid token amount in rupees.";
    }
    return null;
  }

  function goNext() {
    const err = validateStep(currentStep);
    if (err) {
      Alert.alert("Required", err);
      return;
    }
    if (currentStep === "venue" && !savedEventId) {
      void saveDraftAndContinue();
      return;
    }
    if (!isLast) setStepIndex((i) => i + 1);
    else void onSubmit({ publish: true });
  }

  async function saveDraftAndContinue() {
    setLoading(true);
    try {
      const id = await persistEvent({ publish: false, includeTickets: false });
      setSavedEventId(id);
      setStepIndex((i) => i + 1);
      Alert.alert("Draft saved", "Basics saved. Continue to tickets & publish.");
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (!isFirst) setStepIndex((i) => i - 1);
    else router.back();
  }

  async function persistEvent(opts: { publish: boolean; includeTickets: boolean }): Promise<string> {
    const startsAt = new Date(starts).toISOString();
    const endsAt = new Date(ends).toISOString();

    if (opts.publish) {
      const scheduleErr = validatePublishedSchedule(starts, ends);
      if (scheduleErr) throw new Error(scheduleErr);
    }

    const tags = tagsRaw.split(",").map((s) => s.trim()).filter(Boolean);
    const categoryIdsArr = [...categoryIdsPick].sort((a, b) => a - b);
    const stallOn = Boolean(premiumActive && stallBookingEnabled);

    const body: Record<string, unknown> = {
      title: title.trim(),
      venueName: venueName.trim(),
      venueCity: venueCity.trim() || null,
      venueState: venueState.trim() || null,
      venueCountry: venueCountry.trim() || null,
      startsAt,
      endsAt,
      status: wasPublished && !opts.publish ? "published" : "draft",
      isB2b,
      isB2c,
      requireBookingApproval: stallOn && bookingApprovalMode === "manual",
      stallBookingEnabled: stallOn,
      stallTokenEnabled: stallOn && stallTokenEnabled,
      stallTokenAmountMinor:
        stallOn && stallTokenEnabled && stallTokenRupees.trim()
          ? Math.round(parseFloat(stallTokenRupees.trim()) * 100)
          : 0,
      entryQrAllowReentry: premiumActive ? entryQrAllowReentry : false,
      isFeatured,
      categoryIds: categoryIdsArr,
      description: description.trim() || null,
      address: address.trim() || null,
      tags: tags.length ? tags : null,
      contacts: contactsToPayload(contactDrafts),
    };

    if (savedEventId) {
      const primary = categoryIdsArr.length ? categoryIdsArr[0]! : undefined;
      body.categoryId = primary !== undefined && primary > 0 ? primary : null;
      body.latitude = null;
      body.longitude = null;
    } else {
      const primaryNew = categoryIdsArr.length ? categoryIdsArr[0]! : undefined;
      if (primaryNew !== undefined && primaryNew > 0) body.categoryId = primaryNew;
    }

    let targetId: string;
    if (savedEventId) {
      await apiJson(`/organizer/events/${savedEventId}`, { method: "PATCH", body: JSON.stringify(body) });
      targetId = savedEventId;
    } else {
      const data = await apiJson<{ event: { id: string } }>("/organizer/events", {
        method: "POST",
        body: JSON.stringify(body),
      });
      targetId = data.event.id;
    }

    if (opts.includeTickets && premiumActive) {
      if (pendingBanner) {
        await uploadMultipart(
          `/organizer/events/${targetId}/media/upload?kind=banner`,
          {},
          pendingBanner
        ).catch(() => undefined);
      }
      if (pendingGallery) {
        await uploadMultipart(
          `/organizer/events/${targetId}/media/upload?kind=gallery`,
          {},
          pendingGallery
        ).catch(() => undefined);
      }

      const ticketBody = {
        name: ticketName.trim(),
        priceMinor: rupeesFieldToMinor(ticketPrice),
        quota: Number(ticketQuota),
      };
      try {
        if (existingTicketTypeId) {
          await apiJson(`/organizer/events/${targetId}/ticket-types/${existingTicketTypeId}`, {
            method: "PATCH",
            body: JSON.stringify(ticketBody),
          });
        } else {
          const created = await apiJson<{ id: string }>(`/organizer/events/${targetId}/ticket-types`, {
            method: "POST",
            body: JSON.stringify(ticketBody),
          });
          setExistingTicketTypeId(created.id ?? null);
        }
      } catch (ticketErr) {
        throw new Error(
          ticketErr instanceof Error ? ticketErr.message : "Event saved, but visitor ticket could not be saved."
        );
      }
    } else if (opts.includeTickets) {
      if (pendingBanner) {
        await uploadMultipart(
          `/organizer/events/${targetId}/media/upload?kind=banner`,
          {},
          pendingBanner
        ).catch(() => undefined);
      }
      if (pendingGallery) {
        await uploadMultipart(
          `/organizer/events/${targetId}/media/upload?kind=gallery`,
          {},
          pendingGallery
        ).catch(() => undefined);
      }
    }

    if (opts.publish) {
      await apiJson(`/organizer/events/${targetId}/publish`, { method: "POST" });
      setWasPublished(true);
      setStatus("published");
    }

    return targetId;
  }

  async function onSubmit(opts: { publish: boolean }) {
    setLoading(true);
    try {
      const targetId = await persistEvent({ publish: opts.publish, includeTickets: true });
      setSavedEventId(targetId);
      Alert.alert(
        opts.publish ? "Published" : "Saved",
        opts.publish ? "Event is now published." : "Draft updated."
      );
      router.replace(`/dashboard/organizer/events/${targetId}` as never);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  function toggleCategory(id: number) {
    setCategoryIdsPick((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function renderStepContent() {
    switch (currentStep) {
      case "basics":
        return (
          <>
            <Text style={styles.stepHint}>Title, schedule & description</Text>
            <TextField label="Title" value={title} onChangeText={setTitle} placeholder="Auto Expo 2026" />
            <TextField
              label="Description"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholder="Optional — add later from event workspace"
              style={{ minHeight: 90, textAlignVertical: "top" }}
            />
            <DateTimeField label="Start date & time" value={starts} onChange={handleStartsChange} />
            <DateTimeField
              label="End date & time"
              value={ends}
              onChange={setEnds}
              minimumDate={endsMinDate}
            />
          </>
        );

      case "venue":
        return (
          <>
            <Text style={styles.stepHint}>Where is the fair happening?</Text>
            <TextField
              label="Venue name"
              value={venueName}
              onChangeText={setVenueName}
              placeholder="e.g. Pragati Maidan, New Delhi"
            />
            <TextField label="City" value={venueCity} onChangeText={setVenueCity} />
            <TextField label="State / region" value={venueState} onChangeText={setVenueState} />
            <TextField label="Country" value={venueCountry} onChangeText={setVenueCountry} />
            <TextField
              label="Full address"
              value={address}
              onChangeText={setAddress}
              multiline
              style={{ minHeight: 70, textAlignVertical: "top" }}
            />

            <Text style={[styles.label, { marginTop: spacing.md }]}>Event contacts</Text>
            <Text style={styles.hint}>
              Shown on the public event page instead of your organiser account. Add name + phone for each person.
            </Text>
            {contactDrafts.map((c, i) => (
              <View key={c.key} style={styles.contactCard}>
                <View style={styles.contactTop}>
                  <Text style={styles.contactTitle}>Contact {i + 1}</Text>
                  {contactDrafts.length > 1 || c.name || c.phone ? (
                    <Pressable
                      onPress={() => {
                        const next = contactDrafts.filter((x) => x.key !== c.key);
                        setContactDrafts(next.length ? next : [newContactDraft()]);
                      }}
                    >
                      <Text style={styles.contactRemove}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
                <TextField label="Name" value={c.name} onChangeText={(v) => setContactDrafts((prev) => prev.map((x) => (x.key === c.key ? { ...x, name: v } : x)))} />
                <TextField label="Phone" value={c.phone} onChangeText={(v) => setContactDrafts((prev) => prev.map((x) => (x.key === c.key ? { ...x, phone: v } : x)))} keyboardType="phone-pad" />
                <TextField label="Email (optional)" value={c.email ?? ""} onChangeText={(v) => setContactDrafts((prev) => prev.map((x) => (x.key === c.key ? { ...x, email: v } : x)))} keyboardType="email-address" />
                <TextField label="Role (optional)" value={c.roleLabel ?? ""} onChangeText={(v) => setContactDrafts((prev) => prev.map((x) => (x.key === c.key ? { ...x, roleLabel: v } : x)))} placeholder="Stall booking, registration…" />
              </View>
            ))}
            {contactDrafts.length < 10 ? (
              <Pressable style={styles.addContactBtn} onPress={() => setContactDrafts((prev) => [...prev, newContactDraft()])}>
                <Ionicons name="add-circle-outline" size={18} color={colors.emerald} />
                <Text style={styles.addContactText}>Add another contact</Text>
              </Pressable>
            ) : null}
          </>
        );

      case "categories":
        return (
          <>
            <Text style={styles.stepHint}>Audience & fair type</Text>
            <Text style={styles.label}>Categories</Text>
            <Pressable style={styles.pickerField} onPress={() => setCategorySheetOpen(true)}>
              <Text style={[styles.pickerText, categoryIdsPick.size === 0 && styles.pickerPlaceholder]} numberOfLines={2}>
                {selectedCategoryLabel}
              </Text>
              <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
            </Pressable>
            {categoryIdsPick.size > 0 ? (
              <View style={styles.selectedChips}>
                {categories
                  .filter((c) => categoryIdsPick.has(c.id))
                  .map((c) => (
                    <View key={c.id} style={styles.selectedChip}>
                      <Text style={styles.selectedChipText}>{c.name}</Text>
                    </View>
                  ))}
              </View>
            ) : null}

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>B2B fair</Text>
              <Switch value={isB2b} onValueChange={setIsB2b} trackColor={{ true: colors.emerald }} />
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>B2C fair</Text>
              <Switch value={isB2c} onValueChange={setIsB2c} trackColor={{ true: colors.emerald }} />
            </View>
            <TextField label="Tags (comma-separated)" value={tagsRaw} onChangeText={setTagsRaw} placeholder="pharma, 2026" />

            <View style={styles.divider} />
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={styles.switchLabel}>Enable stall booking</Text>
                <Text style={styles.hint}>Off for ticket-only or conference events</Text>
              </View>
              <Switch
                value={stallBookingEnabled}
                onValueChange={(on) => {
                  setStallBookingEnabled(on);
                  if (!on) {
                    setStallTokenEnabled(false);
                    setStallTokenRupees("");
                  }
                }}
                trackColor={{ true: colors.emerald }}
              />
            </View>
            {!stallBookingEnabled ? (
              <Text style={styles.skipNote}>Stall booking step will be skipped. Configure stalls later from event workspace.</Text>
            ) : null}
          </>
        );

      case "tickets":
        return (
          <>
            <Text style={styles.stepHint}>Visitor pass for gate entry</Text>
            <TextField label="Ticket name" value={ticketName} onChangeText={setTicketName} placeholder="General admission" />
            <TextField
              label="Price (₹)"
              value={ticketPrice}
              onChangeText={setTicketPrice}
              keyboardType="decimal-pad"
              placeholder="0 = free"
            />
            <TextField label="Max tickets" value={ticketQuota} onChangeText={setTicketQuota} keyboardType="number-pad" />
            <View style={[styles.switchRow, styles.ticketScanCard]}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={styles.switchLabel}>Allow multiple scans</Text>
                <Text style={styles.hint}>
                  Off: first scan marks ticket used. On: same QR works again for re-entry.
                </Text>
              </View>
              <Switch value={entryQrAllowReentry} onValueChange={setEntryQrAllowReentry} trackColor={{ true: colors.emerald }} />
            </View>
            <Text style={styles.hint}>Add more ticket types later from the event workspace.</Text>
          </>
        );

      case "media":
        return (
          <>
            <Text style={styles.stepHint}>Event photos for cards & detail pages</Text>
            <Text style={styles.label}>Banner / poster (optional)</Text>
            <Pressable
              style={styles.mediaPick}
              onPress={() => {
                void (async () => {
                  const pick = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.85,
                  });
                  if (pick.canceled || !pick.assets[0]) return;
                  const a = pick.assets[0];
                  setPendingBanner({
                    uri: a.uri,
                    name: a.fileName ?? "banner.jpg",
                    type: a.mimeType ?? "image/jpeg",
                  });
                })();
              }}
            >
              <Ionicons name="image-outline" size={20} color={colors.emerald} />
              <Text style={styles.mediaPickText}>{pendingBanner ? "Change banner image" : "Choose banner image"}</Text>
            </Pressable>
            {pendingBanner ? (
              <ZoomableImage uri={pendingBanner.uri} style={styles.pendingPreview} contentFit="cover" />
            ) : null}

            <Text style={[styles.label, { marginTop: spacing.md }]}>Gallery image (optional)</Text>
            <Pressable
              style={styles.mediaPick}
              onPress={() => {
                void (async () => {
                  const pick = await ImagePicker.launchImageLibraryAsync({
                    mediaTypes: ImagePicker.MediaTypeOptions.Images,
                    quality: 0.85,
                  });
                  if (pick.canceled || !pick.assets[0]) return;
                  const a = pick.assets[0];
                  setPendingGallery({
                    uri: a.uri,
                    name: a.fileName ?? "gallery.jpg",
                    type: a.mimeType ?? "image/jpeg",
                  });
                })();
              }}
            >
              <Ionicons name="images-outline" size={20} color={colors.emerald} />
              <Text style={styles.mediaPickText}>{pendingGallery ? "Change gallery image" : "Choose gallery image"}</Text>
            </Pressable>
            {pendingGallery ? (
              <ZoomableImage uri={pendingGallery.uri} style={styles.pendingPreview} contentFit="cover" />
            ) : null}
          </>
        );

      case "stall":
        return (
          <>
            <Text style={styles.stepHint}>Exhibitor booking rules</Text>
            <View style={styles.row}>
              {(["auto", "manual"] as const).map((m) => (
                <Pressable
                  key={m}
                  style={[styles.chip, bookingApprovalMode === m && styles.chipActive]}
                  onPress={() => setBookingApprovalMode(m)}
                >
                  <Text style={[styles.chipText, bookingApprovalMode === m && styles.chipTextActive]}>
                    {m === "auto" ? "Auto-approve" : "Manual approval"}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Token-only online payment</Text>
              <Switch value={stallTokenEnabled} onValueChange={setStallTokenEnabled} trackColor={{ true: colors.emerald }} />
            </View>
            {stallTokenEnabled ? (
              <TextField
                label="Token amount (₹)"
                value={stallTokenRupees}
                onChangeText={setStallTokenRupees}
                keyboardType="decimal-pad"
                placeholder="5000"
              />
            ) : null}
          </>
        );

      case "finish":
        return (
          <>
            <Text style={styles.stepHint}>Optional extras — add more later from workspace</Text>
            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: spacing.md }}>
                <Text style={styles.switchLabel}>Feature on homepage banner</Text>
                <Text style={styles.hint}>Shows in the featured exhibition carousel when published</Text>
              </View>
              <Switch value={isFeatured} onValueChange={setIsFeatured} trackColor={{ true: colors.emerald }} />
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Ready to publish</Text>
              <Text style={styles.summaryLine}>{title.trim() || "Untitled event"}</Text>
              <Text style={styles.summaryMeta}>{venueName.trim() || "Venue TBD"}</Text>
              <Text style={styles.summaryMeta}>
                Stall booking: {premiumActive && stallBookingEnabled ? "Enabled" : "Off — listing only / configure later"}
              </Text>
              {!premiumActive ? (
                <Text style={[styles.summaryMeta, { marginTop: 8 }]}>
                  Free plan: publish the listing here. Tickets & stalls need a paid plan.
                </Text>
              ) : null}
            </View>
          </>
        );

      default:
        return null;
    }
  }

  if (eventId && loadState === "loading") {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.cta} size="large" />
      </View>
    );
  }

  if (eventId && loadState === "error") {
    return (
      <ScreenShell title="Edit event">
        <Text style={styles.muted}>Could not load this event.</Text>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      title={eventId ? "Edit event" : "Create event"}
      subtitle={`Step ${stepIndex + 1} of ${steps.length} · ${STEP_LABELS[currentStep]}`}
      contentStyle={styles.shellContent}
    >
      <View style={styles.formRoot}>
        <View style={styles.progressTrack}>
          {steps.map((s, i) => (
            <View key={s} style={[styles.progressSeg, i <= stepIndex && styles.progressSegActive]} />
          ))}
        </View>

        <KeyboardAwareScrollView
          style={styles.formScroll}
          stickyFooterHeight={navFooterHeight}
          viewIsInsideTabBar
          contentContainerStyle={{ paddingHorizontal: spacing.screen, paddingBottom: scrollBottomPad }}
          refreshControl={refreshControl}
        >
          {renderStepContent()}
        </KeyboardAwareScrollView>

        <View style={styles.navFooter}>
          <View style={styles.navRow}>
            <Pressable style={styles.backBtn} onPress={goBack}>
              <Ionicons name="arrow-back" size={18} color={colors.navy} />
              <Text style={styles.backText}>{isFirst ? "Cancel" : "Back"}</Text>
            </Pressable>
            <PrimaryButton
              label={
                loading
                  ? "Saving…"
                  : currentStep === "venue" && !savedEventId
                    ? "Save & continue"
                    : isLast
                      ? "Publish event"
                      : "Next"
              }
              variant={isLast ? "cta" : "emerald"}
              disabled={loading}
              onPress={goNext}
              style={{ flex: 1 }}
            />
          </View>
        </View>
      </View>

      <BottomSheetModal
        visible={categorySheetOpen}
        onClose={() => setCategorySheetOpen(false)}
        title="Choose categories"
        maxHeight="78%"
      >
        <Text style={styles.hint}>Select one or more — tap to toggle</Text>
        <ScrollView style={styles.sheetList} showsVerticalScrollIndicator={false}>
          {categories.map((c) => {
            const on = categoryIdsPick.has(c.id);
            return (
              <Pressable key={c.id} style={styles.categoryRow} onPress={() => toggleCategory(c.id)}>
                <Text style={[styles.categoryName, on && styles.categoryNameOn]}>{c.name}</Text>
                <View style={[styles.checkCircle, on && styles.checkCircleOn]}>
                  {on ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
        <PrimaryButton label="Done" onPress={() => setCategorySheetOpen(false)} />
      </BottomSheetModal>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  muted: { color: colors.textMuted, lineHeight: 22 },
  shellContent: { flex: 1, paddingTop: 0, paddingHorizontal: 0 },
  formRoot: { flex: 1 },
  formScroll: { flex: 1 },
  progressTrack: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.screen,
  },
  progressSeg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: colors.border },
  progressSegActive: { backgroundColor: colors.emerald },
  stepHint: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.md, lineHeight: 20 },
  label: { fontWeight: "700", color: colors.navy, marginBottom: 6 },
  hint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm, lineHeight: 18 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  chipText: { fontSize: 13, fontWeight: "700", color: colors.navy, textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
    paddingVertical: 4,
  },
  ticketScanCard: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(16,185,129,0.35)",
    backgroundColor: "rgba(16,185,129,0.08)",
  },
  switchLabel: { flex: 1, fontSize: 14, fontWeight: "600", color: colors.navy, marginRight: spacing.md },
  pickerField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  pickerText: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.navy },
  pickerPlaceholder: { color: colors.textMuted, fontWeight: "500" },
  selectedChips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  selectedChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    backgroundColor: `${colors.emerald}18`,
  },
  selectedChipText: { fontSize: 12, fontWeight: "700", color: colors.emeraldDark },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
  skipNote: {
    fontSize: 12,
    color: colors.emeraldDark,
    backgroundColor: `${colors.emerald}12`,
    padding: spacing.sm,
    borderRadius: radius.md,
    lineHeight: 18,
    marginBottom: spacing.sm,
  },
  mediaPick: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  mediaPickText: { fontWeight: "700", color: colors.emerald },
  pendingPreview: {
    width: "100%",
    height: 140,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  contactCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.xs,
  },
  contactTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  contactTitle: { fontSize: 12, fontWeight: "800", color: colors.textMuted, textTransform: "uppercase" },
  contactRemove: { fontSize: 12, fontWeight: "700", color: colors.cta },
  addContactBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: spacing.sm },
  addContactText: { color: colors.emerald, fontWeight: "700", fontSize: 14 },
  summaryCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    backgroundColor: `${colors.emerald}10`,
    borderWidth: 1,
    borderColor: `${colors.emerald}30`,
  },
  summaryTitle: { fontSize: 13, fontWeight: "800", color: colors.emeraldDark, marginBottom: 6 },
  summaryLine: { fontSize: 16, fontWeight: "800", color: colors.navy },
  summaryMeta: { fontSize: 13, color: colors.textMuted, marginTop: 4 },
  navFooter: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  navRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 12, paddingHorizontal: 4 },
  backText: { fontSize: 14, fontWeight: "700", color: colors.navy },
  modalBg: { flex: 1, backgroundColor: "rgba(10,31,61,0.45)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    maxHeight: "75%",
  },
  sheetList: { maxHeight: 320, marginBottom: spacing.sm },
  sheetHandle: {
    alignSelf: "center",
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  sheetTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: 4 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  categoryName: { fontSize: 15, fontWeight: "600", color: colors.navy },
  categoryNameOn: { color: colors.emeraldDark },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkCircleOn: { backgroundColor: colors.emerald, borderColor: colors.emerald },
});
