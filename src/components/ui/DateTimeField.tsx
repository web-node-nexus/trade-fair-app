import { useMemo, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import DateTimePicker, { type DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import { BottomSheetModal } from "@/components/ui/BottomSheetModal";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { formatDatetimeDisplay, parseDatetimeLocal, toDatetimeLocalValue } from "@/lib/datetimeLocal";
import { colors } from "@/theme/colors";
import { radius, spacing } from "@/theme/spacing";

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  minimumDate?: Date;
  maximumDate?: Date;
  error?: string;
};

type AndroidStep = "idle" | "date" | "time";

export function DateTimeField({ label, value, onChange, minimumDate, maximumDate, error }: Props) {
  const [iosOpen, setIosOpen] = useState(false);
  const [androidStep, setAndroidStep] = useState<AndroidStep>("idle");
  const [draft, setDraft] = useState(() => parseDatetimeLocal(value) ?? new Date());

  const display = useMemo(() => formatDatetimeDisplay(value), [value]);
  const hasValue = Boolean(parseDatetimeLocal(value));

  function openPicker() {
    setDraft(parseDatetimeLocal(value) ?? new Date());
    if (Platform.OS === "android") {
      setAndroidStep("date");
    } else {
      setIosOpen(true);
    }
  }

  function commit(date: Date) {
    onChange(toDatetimeLocalValue(date));
    setIosOpen(false);
  }

  function onAndroidDateChange(event: DateTimePickerEvent, selected?: Date) {
    if (event.type !== "set" || !selected) {
      setAndroidStep("idle");
      return;
    }

    const next = new Date(draft);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    setDraft(next);
    setAndroidStep("time");
  }

  function onAndroidTimeChange(event: DateTimePickerEvent, selected?: Date) {
    setAndroidStep("idle");
    if (event.type !== "set" || !selected) return;

    const next = new Date(draft);
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    onChange(toDatetimeLocalValue(next));
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <Pressable
        style={[styles.field, error && styles.fieldError, !hasValue && styles.fieldEmpty]}
        onPress={openPicker}
        accessibilityRole="button"
        accessibilityLabel={`${label}, ${display}`}
      >
        <Ionicons name="calendar-outline" size={20} color={hasValue ? colors.emerald : colors.textMuted} />
        <Text style={[styles.value, !hasValue && styles.placeholder]} numberOfLines={1}>
          {display}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {Platform.OS === "android" && androidStep === "date" ? (
        <DateTimePicker
          value={draft}
          mode="date"
          minimumDate={minimumDate}
          maximumDate={maximumDate}
          onChange={onAndroidDateChange}
        />
      ) : null}

      {Platform.OS === "android" && androidStep === "time" ? (
        <DateTimePicker value={draft} mode="time" is24Hour={false} onChange={onAndroidTimeChange} />
      ) : null}

      {Platform.OS === "ios" ? (
        <BottomSheetModal visible={iosOpen} onClose={() => setIosOpen(false)} title={label}>
          <DateTimePicker
            value={draft}
            mode="datetime"
            display="spinner"
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            onChange={(_, selected) => {
              if (selected) setDraft(selected);
            }}
            style={styles.picker}
          />
          <PrimaryButton label="Done" onPress={() => commit(draft)} />
        </BottomSheetModal>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.navy,
    marginBottom: 6,
  },
  field: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    backgroundColor: colors.surface,
  },
  fieldEmpty: { borderStyle: "dashed" },
  fieldError: { borderColor: "#ef4444" },
  value: { flex: 1, fontSize: 15, fontWeight: "600", color: colors.text },
  placeholder: { color: colors.textMuted, fontWeight: "500" },
  error: { marginTop: 4, fontSize: 12, color: "#ef4444" },
  picker: { height: 220, marginBottom: spacing.md, width: "100%" },
});
