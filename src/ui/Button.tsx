import { ActivityIndicator, Pressable, type PressableProps } from "react-native";

import { buttonLabelColor, buttonStyle, type ButtonVariant } from "@/theme";
import { AppText } from "./Text";

type AppButtonProps = Omit<PressableProps, "children"> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
};

export function AppButton({
  label,
  variant = "primary",
  loading = false,
  disabled,
  style,
  ...props
}: AppButtonProps) {
  const idle = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={idle}
      style={(state) => [
        buttonStyle(variant, { disabled: idle }),
        state.pressed && !idle ? { opacity: 0.88 } : null,
        typeof style === "function" ? style(state) : style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={buttonLabelColor(variant)} />
      ) : (
        <AppText variant="button" style={{ color: buttonLabelColor(variant) }}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
