import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { TextField } from "@/components/ui/TextField";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useI18n } from "@/context/I18nContext";
import {
  dashboardPathForAccountType,
  type SignupAccountType,
} from "@/lib/dashboardDestination";
import {
  BUSINESS_CATEGORIES,
  COUNTRIES,
  INDUSTRY_INTERESTS,
  INDIAN_STATES,
  ORGANIZATION_TYPES,
  PRODUCT_CATEGORIES,
  SERVICE_OFFERINGS,
  citiesForState,
} from "@/lib/locationOptions";
import { uploadMultipart } from "@/lib/uploadMultipart";
import { useToast } from "@/components/ui/ToastProvider";
import {
  isValidEmail,
  isValidGst,
  isValidPassword,
  isValidPhone,
  isValidUrl,
  required,
} from "@/lib/validation";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Step = 1 | 2 | 3;

function StepIndicator({ current }: { current: Step }) {
  const { t } = useI18n();
  const pct = (current / 3) * 100;
  return (
    <View style={styles.progressWrap}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={styles.progressLabel}>{t("auth.stepOf", { current, total: 3 })}</Text>
    </View>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
  placeholder = "Select…",
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Pressable style={styles.select} onPress={() => setOpen(true)}>
        <Text style={selected ? styles.selectValue : styles.selectPlaceholder}>
          {selected?.label ?? placeholder}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      <BottomSheetModal visible={open} onClose={() => setOpen(false)} title={label} maxHeight="70%">
        <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator>
          {options.map((o) => (
            <Pressable
              key={o.value}
              style={styles.modalRow}
              onPress={() => {
                onChange(o.value);
                setOpen(false);
              }}
            >
              <Text style={styles.modalRowText}>{o.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </BottomSheetModal>
    </>
  );
}

export function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ accountType?: string }>();
  const { register } = useAuth();
  const { t } = useI18n();
  const { showError } = useToast();
  const roles = useMemo(
    () =>
      [
        { value: "organizer" as const, short: t("auth.organizer"), color: "#0f766e" },
        { value: "exhibitor" as const, short: t("auth.exhibitor"), color: "#065f46" },
        { value: "service_provider" as const, short: t("auth.services"), color: "#5b21b6" },
        { value: "visitor" as const, short: t("auth.visitor"), color: "#0369a1" },
      ] satisfies { value: SignupAccountType; short: string; color: string }[],
    [t]
  );
  const [step, setStep] = useState<Step>(1);
  const [accountType, setAccountType] = useState<SignupAccountType>(() => {
    const raw = String(params.accountType ?? "");
    if (raw === "organizer" || raw === "exhibitor" || raw === "service_provider" || raw === "visitor") {
      return raw;
    }
    return "visitor";
  });
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("India");
  const [organizationName, setOrganizationName] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [designation, setDesignation] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [website, setWebsite] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("");
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [servicesOffered, setServicesOffered] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [occupation, setOccupation] = useState("");
  const [companyInstitution, setCompanyInstitution] = useState("");
  const [industryInterest, setIndustryInterest] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [friendReferralCode, setFriendReferralCode] = useState("");
  const [loading, setLoading] = useState(false);

  const cityOptions = useMemo(
    () => citiesForState(state).map((c) => ({ value: c, label: c })),
    [state]
  );
  function toggleService(value: string) {
    setServicesOffered((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function toggleProductCategory(value: string) {
    setProductCategories((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
    );
  }

  function validateStep(): string | null {
    if (step === 1) {
      const nameErr = required(fullName, "Full name");
      if (nameErr) return nameErr;
      if (fullName.trim().length < 2) return "Enter a valid full name.";

      const emailErr = required(email, "Email");
      if (emailErr) return emailErr;
      if (!isValidEmail(email)) return "Enter a valid email address.";

      const phoneErr = required(phone, "Phone");
      if (phoneErr) return phoneErr;
      if (!isValidPhone(phone)) return "Enter a valid 10-digit mobile number.";

      const passwordErr = isValidPassword(password);
      if (passwordErr) return passwordErr;
      if (password !== confirmPassword) return "Passwords do not match.";
    }

    if (step === 2) {
      if (accountType === "organizer") {
        const orgErr = required(organizationName, "Organization name");
        if (orgErr) return orgErr;
        if (!organizationType) return "Organization type is required.";
        if (gstNumber.trim() && !isValidGst(gstNumber)) return "Enter a valid GST number.";
        if (website.trim() && !isValidUrl(website)) return "Enter a valid website URL.";
      }
      if (accountType === "exhibitor") {
        const companyErr = required(companyName, "Company name");
        if (companyErr) return companyErr;
        if (!businessCategory) return "Business category is required.";
        if (productCategories.length === 0) return "Select at least one product category.";
        const desigErr = required(designation, "Designation");
        if (desigErr) return desigErr;
        if (gstNumber.trim() && !isValidGst(gstNumber)) return "Enter a valid GST number.";
        if (website.trim() && !isValidUrl(website)) return "Enter a valid website URL.";
      }
      if (accountType === "service_provider") {
        const companyErr = required(companyName, "Company name");
        if (companyErr) return companyErr;
        if (servicesOffered.length === 0) return "Select at least one service.";
        if (yearsOfExperience.trim() && Number.isNaN(Number(yearsOfExperience))) {
          return "Years of experience must be a number.";
        }
        if (website.trim() && !isValidUrl(website)) return "Enter a valid website URL.";
      }
    }

    if (step === 3) {
      if (!agreedTerms || !agreedPrivacy) return "Accept Terms & Privacy to continue.";
    }
    return null;
  }

  function buildPayload(): Record<string, string | boolean | string[]> {
    const payload: Record<string, string | boolean | string[]> = {
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      password,
      accountType,
      country: country.trim() || "India",
      notifyEmail,
      notifySms,
      notifyWhatsapp,
      agreedTerms,
      agreedPrivacy,
    };
    if (city.trim()) payload.city = city.trim();
    if (state.trim()) payload.state = state.trim();
    if (friendReferralCode.trim() && accountType !== "exhibitor") {
      payload.friendReferralCode = friendReferralCode.trim().toUpperCase();
    }

    if (accountType === "organizer") {
      payload.organizationName = organizationName.trim();
      payload.organizationType = organizationType;
      if (designation.trim()) payload.designation = designation.trim();
      if (gstNumber.trim()) payload.gstNumber = gstNumber.trim();
      if (website.trim()) payload.website = website.trim();
    }
    if (accountType === "exhibitor") {
      payload.companyName = companyName.trim();
      payload.businessCategory = businessCategory;
      payload.productCategories = productCategories;
      payload.designation = designation.trim();
      if (gstNumber.trim()) payload.gstNumber = gstNumber.trim();
      if (website.trim()) payload.website = website.trim();
    }
    if (accountType === "service_provider") {
      payload.companyName = companyName.trim();
      payload.servicesOffered = servicesOffered;
      if (yearsOfExperience.trim()) payload.yearsOfExperience = yearsOfExperience.trim();
      if (website.trim()) payload.website = website.trim();
    }
    if (accountType === "visitor") {
      if (occupation.trim()) payload.occupation = occupation.trim();
      if (companyInstitution.trim()) payload.companyInstitution = companyInstitution.trim();
      if (industryInterest) payload.industryInterest = industryInterest;
    }
    return payload;
  }

  async function pickPhoto() {
    const pick = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (pick.canceled || !pick.assets[0]) return;
    const asset = pick.assets[0];
    setPhotoUri(asset.uri);
    setPhotoName(asset.fileName ?? "photo.jpg");
  }

  async function submit() {
    const err = validateStep();
    if (err) {
      showError(err);
      return;
    }
    setLoading(true);
    try {
      await register(buildPayload());
      if (photoUri) {
        try {
          await uploadMultipart(
            "/auth/me/profile-photo",
            {},
            {
              uri: photoUri,
              name: photoName ?? "profile.jpg",
              type: "image/jpeg",
            },
            "profilePhoto"
          );
        } catch {
          /* signup succeeded; photo optional */
        }
      }
      router.replace(dashboardPathForAccountType(accountType) as never);
    } catch (e) {
      showError(e instanceof Error ? e.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  function onPrimary() {
    const err = validateStep();
    if (err) {
      showError(err);
      return;
    }
    if (step < 3) setStep((s) => (s + 1) as Step);
    else void submit();
  }

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#059669", "#10b981", "#0f766e"]}
        style={[styles.hero, { paddingTop: insets.top + spacing.sm }]}
      >
        <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
          <Ionicons name="chevron-back" size={26} color="#fff" />
        </Pressable>
        <View style={styles.logoBadge}>
          <BrandLogo size="auth" showTagline={false} />
        </View>
        <View style={styles.heroLang}>
          <LanguageSwitcher compact />
        </View>
        <Text style={styles.heroTitle}>{t("auth.registerTitle")}</Text>
        <Text style={styles.heroSub}>{t("auth.registerSubtitle")}</Text>
        <StepIndicator current={step} />
      </LinearGradient>

      <KeyboardAvoidingView
        style={styles.formWrap}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.form, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.formCard}>
          {step === 1 ? (
            <>
              <Text style={styles.sectionLabel}>{t("auth.signingUpAs")}</Text>
              <View style={styles.roleGrid}>
                {roles.map((r) => {
                  const active = accountType === r.value;
                  return (
                    <Pressable
                      key={r.value}
                      onPress={() => setAccountType(r.value)}
                      style={[
                        styles.roleChip,
                        active && { borderColor: r.color, backgroundColor: `${r.color}14` },
                      ]}
                    >
                      <Text
                        style={[styles.roleChipText, active && { color: r.color }]}
                        numberOfLines={1}
                      >
                        {r.short}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <TextField label={t("auth.fullName")} value={fullName} onChangeText={setFullName} />
              <TextField
                label={t("auth.email")}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <TextField label={t("auth.phone")} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              <TextField label={t("auth.password")} value={password} onChangeText={setPassword} secureTextEntry />
              <TextField
                label={t("auth.confirmPassword")}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <SelectField
                label="Country"
                value={country}
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
                onChange={setCountry}
              />
              <SelectField
                label="State"
                value={state}
                options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                onChange={(v) => {
                  setState(v);
                  setCity("");
                }}
              />
              <SelectField
                label="City"
                value={city}
                options={cityOptions}
                onChange={setCity}
                placeholder={state ? "Select city" : "Select state first"}
              />

              {accountType === "organizer" ? (
                <>
                  <TextField label="Organization name *" value={organizationName} onChangeText={setOrganizationName} />
                  <SelectField
                    label="Organization type *"
                    value={organizationType}
                    options={ORGANIZATION_TYPES.map((o) => ({ value: o.value, label: o.label }))}
                    onChange={setOrganizationType}
                  />
                  <TextField label="Designation" value={designation} onChangeText={setDesignation} />
                  <TextField label="GST number" value={gstNumber} onChangeText={setGstNumber} />
                  <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
                </>
              ) : null}

              {accountType === "exhibitor" ? (
                <>
                  <TextField label="Company name *" value={companyName} onChangeText={setCompanyName} />
                  <SelectField
                    label="Business category *"
                    value={businessCategory}
                    options={BUSINESS_CATEGORIES.map((b) => ({ value: b.value, label: b.label }))}
                    onChange={setBusinessCategory}
                  />
                  <Text style={styles.fieldLabel}>Product categories *</Text>
                  <Text style={styles.fieldHint}>Select the product lines you showcase at trade fairs.</Text>
                  <View style={styles.serviceGrid}>
                    {PRODUCT_CATEGORIES.map((c) => {
                      const on = productCategories.includes(c.value);
                      return (
                        <Pressable
                          key={c.value}
                          style={[styles.serviceChip, on && styles.serviceChipOn]}
                          onPress={() => toggleProductCategory(c.value)}
                        >
                          <Text style={[styles.serviceChipText, on && styles.serviceChipTextOn]}>{c.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextField label="Designation *" value={designation} onChangeText={setDesignation} />
                  <TextField label="GST number" value={gstNumber} onChangeText={setGstNumber} />
                  <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
                </>
              ) : null}

              {accountType === "service_provider" ? (
                <>
                  <TextField label="Company name *" value={companyName} onChangeText={setCompanyName} />
                  <TextField
                    label="Years of experience"
                    value={yearsOfExperience}
                    onChangeText={setYearsOfExperience}
                    keyboardType="number-pad"
                  />
                  <TextField label="Website" value={website} onChangeText={setWebsite} autoCapitalize="none" />
                  <Text style={styles.fieldLabel}>Services offered *</Text>
                  <View style={styles.serviceGrid}>
                    {SERVICE_OFFERINGS.map((s) => {
                      const on = servicesOffered.includes(s.value);
                      return (
                        <Pressable
                          key={s.value}
                          style={[styles.serviceChip, on && styles.serviceChipOn]}
                          onPress={() => toggleService(s.value)}
                        >
                          <Text style={[styles.serviceChipText, on && styles.serviceChipTextOn]}>{s.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </>
              ) : null}

              {accountType === "visitor" ? (
                <>
                  <TextField label="Occupation" value={occupation} onChangeText={setOccupation} />
                  <TextField
                    label="Company / institution"
                    value={companyInstitution}
                    onChangeText={setCompanyInstitution}
                  />
                  <SelectField
                    label="Industry interest"
                    value={industryInterest}
                    options={INDUSTRY_INTERESTS.map((i) => ({ value: i.value, label: i.label }))}
                    onChange={setIndustryInterest}
                  />
                </>
              ) : null}
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Pressable style={styles.photoBox} onPress={() => void pickPhoto()}>
                <Ionicons name="camera-outline" size={24} color={colors.emerald} />
                <Text style={styles.photoBoxText}>{photoName ?? "Upload profile photo (optional)"}</Text>
              </Pressable>
              {accountType !== "exhibitor" ? (
                <>
                  <TextField
                    label="Friend's referral code (optional)"
                    value={friendReferralCode}
                    onChangeText={(t) => setFriendReferralCode(t.toUpperCase())}
                    placeholder="e.g. TFWABC123"
                    autoCapitalize="characters"
                  />
                  <Text style={styles.referralHint}>
                    Have a friend on Trade Fair Wala? Enter their code — they earn 100 points when you join.
                  </Text>
                </>
              ) : null}
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>Email notifications</Text>
                <Switch value={notifyEmail} onValueChange={setNotifyEmail} trackColor={{ true: colors.emerald }} />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>SMS notifications</Text>
                <Switch value={notifySms} onValueChange={setNotifySms} trackColor={{ true: colors.emerald }} />
              </View>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleLabel}>WhatsApp notifications</Text>
                <Switch value={notifyWhatsapp} onValueChange={setNotifyWhatsapp} trackColor={{ true: colors.emerald }} />
              </View>
              <Pressable style={styles.checkRow} onPress={() => setAgreedTerms((v) => !v)}>
                <Ionicons name={agreedTerms ? "checkbox" : "square-outline"} size={22} color={colors.emerald} />
                <Text style={styles.checkText}>I agree to the Terms & Conditions</Text>
              </Pressable>
              <Pressable style={styles.checkRow} onPress={() => setAgreedPrivacy((v) => !v)}>
                <Ionicons name={agreedPrivacy ? "checkbox" : "square-outline"} size={22} color={colors.emerald} />
                <Text style={styles.checkText}>I agree to the Privacy Policy</Text>
              </Pressable>
              <View style={styles.legalLinks}>
                <Pressable onPress={() => router.push("/pages/terms-of-service" as never)}>
                  <Text style={styles.legalLink}>Terms & Conditions</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={() => router.push("/pages/privacy-policy" as never)}>
                  <Text style={styles.legalLink}>Privacy policy</Text>
                </Pressable>
                <Text style={styles.legalDot}>·</Text>
                <Pressable onPress={() => router.push("/pages/payment-refund-policy" as never)}>
                  <Text style={styles.legalLink}>Payment & refund</Text>
                </Pressable>
              </View>
            </>
          ) : null}

          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          {step > 1 ? (
            <Pressable style={styles.footerBack} onPress={() => setStep((s) => (s - 1) as Step)}>
              <Ionicons name="arrow-back" size={18} color={colors.navy} />
            </Pressable>
          ) : (
            <View style={styles.footerBackSpacer} />
          )}
          {loading ? (
            <ActivityIndicator color={colors.emerald} style={{ flex: 1 }} />
          ) : (
            <PrimaryButton
              label={step === 3 ? t("auth.createAccount") : t("common.continue")}
              onPress={onPrimary}
              style={{ flex: 1 }}
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#eef4f2" },
  hero: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  back: { alignSelf: "flex-start", padding: 8, marginLeft: -8, marginBottom: spacing.sm },
  logoBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#fff",
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  heroLang: { alignItems: "flex-end", marginBottom: spacing.sm },
  heroTitle: { fontSize: 26, fontWeight: "800", color: "#fff", letterSpacing: -0.4 },
  heroSub: { marginTop: 4, fontSize: 13, color: "rgba(248,250,252,0.82)" },
  progressWrap: { marginTop: spacing.lg },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2, backgroundColor: "#fff" },
  progressLabel: { marginTop: 8, fontSize: 11, fontWeight: "700", color: "rgba(248,250,252,0.85)" },
  formWrap: { flex: 1, marginTop: -spacing.md },
  form: { paddingHorizontal: spacing.screen, paddingTop: spacing.md },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionLabel: { fontWeight: "800", color: colors.navy, marginBottom: spacing.sm, fontSize: 14 },
  roleGrid: {
    flexDirection: "row",
    gap: 6,
    marginBottom: spacing.sm,
  },
  roleChip: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  roleChipText: { fontSize: 10, fontWeight: "700", color: colors.textMuted, textAlign: "center" },
  fieldLabel: { fontWeight: "700", color: colors.navy, marginBottom: 6, marginTop: spacing.sm, fontSize: 13 },
  fieldHint: { fontSize: 11, color: colors.textMuted, marginBottom: 8, marginTop: -2, lineHeight: 15 },
  referralHint: { fontSize: 11, color: colors.textMuted, marginTop: -4, marginBottom: spacing.sm, lineHeight: 16 },
  select: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  selectValue: { color: colors.navy, fontWeight: "600" },
  selectPlaceholder: { color: colors.textMuted },
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.lg,
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.navy, marginBottom: spacing.md },
  modalRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  modalRowText: { fontSize: 15, color: colors.navy },
  serviceGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: spacing.md },
  serviceChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  serviceChipOn: { borderColor: colors.emerald, backgroundColor: "#ecfdf5" },
  serviceChipText: { fontSize: 11, color: colors.textMuted, fontWeight: "600" },
  serviceChipTextOn: { color: colors.emeraldDark },
  photoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.emerald,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    backgroundColor: "#ecfdf5",
  },
  photoBoxText: { flex: 1, color: colors.emeraldDark, fontSize: 13, fontWeight: "600" },
  toggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  toggleLabel: { color: colors.navy, fontWeight: "600", fontSize: 14 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, marginTop: spacing.sm },
  checkText: { flex: 1, color: colors.navy, fontSize: 13 },
  legalLink: { color: colors.emerald, fontWeight: "700", fontSize: 13 },
  legalLinks: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginTop: spacing.sm },
  legalDot: { color: colors.textMuted, fontSize: 13 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  footerBack: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  footerBackSpacer: { width: 48 },
});
