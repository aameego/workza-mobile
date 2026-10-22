import { Text as RNText, type TextProps } from "react-native";

import { colors, type ColorName, type, type TypeName } from "@/theme";

type AppTextProps = TextProps & {
  variant?: TypeName;
  tone?: ColorName;
};

export function AppText({ variant = "body", tone, style, ...props }: AppTextProps) {
  return (
    <RNText
      style={[type[variant], tone ? { color: colors[tone] } : null, style]}
      {...props}
    />
  );
}
