export const APP_ENV_NAMES = ["local", "development", "production"] as const;
export type AppEnvName = (typeof APP_ENV_NAMES)[number];

export const isAppEnvName = (value: unknown): value is AppEnvName =>
  value === "local" || value === "development" || value === "production";

/**
 * Production API / WebView is opt-in via EXPO_PUBLIC_API_ENV=production.
 * Missing or unknown names resolve to development so `expo run` and QA
 * release APKs never silently open https://workza.ai.
 */
export const resolveAppEnvName = (envName?: string): AppEnvName =>
  isAppEnvName(envName) ? envName : "development";
