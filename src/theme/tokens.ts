/** Workza product tokens. Match the web HRMS login and app chrome. */

export const colors = {
  navy: "#0A1F4A",
  ink: "#1A2353",
  text: "#1E293B",
  teal: "#0BA896",
  mint: "#59B39B",
  link: "#1867C0",
  success: "#059669",
  info: "#3B82F6",
  warning: "#D97706",
  error: "#EF4444",
  background: "#F8FAFC",
  card: "#FFFFFF",
  white: "#FFFFFF",
  border: "#E2E8F0",
  muted: "#64748B",
  subtle: "#94A3B8",
} as const;

export type ColorName = keyof typeof colors;

export const fonts = {
  regular: "Sora_400Regular",
  medium: "Sora_500Medium",
  semibold: "Sora_600SemiBold",
  bold: "Sora_700Bold",
} as const;

export const space = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 6,
  control: 8,
  md: 12,
  lg: 16,
  sheet: 24,
} as const;

export const size = {
  control: 48,
  checkbox: 18,
  icon: 20,
  hit: 8,
} as const;

export const shadow = {
  card: {
    shadowColor: colors.navy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },
} as const;

export const type = {
  display: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.navy,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    lineHeight: 38,
    color: colors.navy,
  },
  brand: {
    fontFamily: fonts.bold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.teal,
  },
  kicker: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.muted,
  },
  body: {
    fontFamily: fonts.regular,
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
  },
  helper: {
    fontFamily: fonts.medium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.subtle,
  },
  error: {
    fontFamily: fonts.medium,
    fontSize: 14,
    lineHeight: 20,
    color: colors.error,
  },
  button: {
    fontFamily: fonts.bold,
    fontSize: 16,
    lineHeight: 20,
    color: colors.white,
  },
  link: {
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.link,
  },
  caption: {
    fontFamily: fonts.medium,
    fontSize: 13,
    lineHeight: 18,
    color: colors.muted,
  },
} as const;

export type TypeName = keyof typeof type;

/** @deprecated Use `colors`. Kept so older screens keep compiling while they migrate. */
export const Workza = colors;
