import { Platform, Text, TextInput, type TextProps, type TextInputProps } from "react-native";
import { normalizePlainText } from "@/lib/normalizePlainText";

/** App-wide UI font — prevents OEM / paste quirks from changing typeface. */
export const appFontFamily = Platform.select({
  ios: "System",
  android: "sans-serif",
  default: undefined,
});

export const appTextStyle = { fontFamily: appFontFamily } as const;

export function AppText(props: TextProps) {
  return <Text {...props} style={[appTextStyle, props.style]} />;
}

export function AppTextInput(props: TextInputProps) {
  const { onChangeText, secureTextEntry, style, ...rest } = props;
  return (
    <TextInput
      {...rest}
      secureTextEntry={secureTextEntry}
      style={[appTextStyle, style]}
      onChangeText={
        onChangeText
          ? (t) => onChangeText(secureTextEntry ? t : normalizePlainText(t))
          : undefined
      }
    />
  );
}
