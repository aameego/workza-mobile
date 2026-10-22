import { useState, type ReactNode } from "react";
import { Pressable, TextInput, View, type TextInputProps } from "react-native";

import { colors, fieldStyle, size, space, type } from "@/theme";
import { AppText } from "./Text";

type AppFieldProps = TextInputProps & {
  label: string;
  helper?: ReactNode;
  error?: string;
  secure?: boolean;
};

export function AppField({
  label,
  helper,
  error,
  secure = false,
  editable = true,
  style,
  ...inputProps
}: AppFieldProps) {
  const [focused, setFocused] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const invalid = Boolean(error);

  return (
    <View style={{ gap: space.xs }}>
      <AppText variant="label">{label}</AppText>
      <View style={[fieldStyle({ focused, error: invalid }), { flexDirection: "row", alignItems: "center" }]}>
        <TextInput
          {...inputProps}
          editable={editable}
          secureTextEntry={secure && !revealed}
          placeholderTextColor={colors.subtle}
          onFocus={(event) => {
            setFocused(true);
            inputProps.onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            inputProps.onBlur?.(event);
          }}
          style={[
            type.body,
            { flex: 1, paddingVertical: space.sm, color: colors.text },
            style,
          ]}
        />
        {secure ? (
          <Pressable
            onPress={() => setRevealed((current) => !current)}
            hitSlop={size.hit}
            accessibilityRole="button"
            accessibilityLabel={revealed ? "Hide password" : "Show password"}
          >
            <AppText variant="link" tone="teal">
              {revealed ? "Hide" : "Show"}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? <AppText variant="error">{error}</AppText> : null}
      {!error && helper ? (
        typeof helper === "string" ? (
          <AppText variant="helper">{helper}</AppText>
        ) : (
          helper
        )
      ) : null}
    </View>
  );
}
