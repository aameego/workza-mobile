import { colors, radius, shadow, size, space, type, type TypeName } from "./tokens";

export const textStyle = (variant: TypeName) => type[variant];

export type ButtonVariant = "primary" | "secondary" | "ghost";

export const buttonStyle = (variant: ButtonVariant, options: { disabled?: boolean } = {}) => {
  const shared = {
    minHeight: size.control,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    opacity: options.disabled ? 0.7 : 1,
  };

  if (variant === "secondary") {
    return {
      ...shared,
      backgroundColor: colors.white,
      borderWidth: 1,
      borderColor: colors.navy,
    };
  }

  if (variant === "ghost") {
    return {
      ...shared,
      backgroundColor: "transparent",
      minHeight: size.icon,
      paddingHorizontal: space.sm,
    };
  }

  return {
    ...shared,
    backgroundColor: colors.navy,
  };
};

export const buttonLabelColor = (variant: ButtonVariant) => {
  if (variant === "primary") return colors.white;
  if (variant === "ghost") return colors.teal;
  return colors.navy;
};

export const fieldStyle = (options: { focused?: boolean; error?: boolean } = {}) => ({
  minHeight: size.control,
  borderWidth: 1,
  borderColor: options.error ? colors.error : options.focused ? colors.mint : colors.border,
  borderRadius: radius.control,
  backgroundColor: colors.white,
  paddingHorizontal: space.md,
});

export const cardStyle = () => ({
  backgroundColor: colors.card,
  borderRadius: radius.sheet,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadow.card,
});

export const checkboxStyle = (checked: boolean) => ({
  width: size.checkbox,
  height: size.checkbox,
  borderRadius: radius.sm,
  borderWidth: 1,
  borderColor: checked ? colors.ink : colors.border,
  backgroundColor: checked ? colors.ink : colors.white,
  alignItems: "center" as const,
  justifyContent: "center" as const,
});
