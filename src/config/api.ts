import { resolveAppEnvName } from "./appEnv";

export const PRODUCTION_API_URL = "https://backend-gig.aameego.com/api";
export const DEVELOPMENT_API_URL = "https://dev-gig.aameego.com/api";
export const LOCAL_API_URL = "http://localhost:5001/api";

export const API_ENVIRONMENTS = {
  production: PRODUCTION_API_URL,
  development: DEVELOPMENT_API_URL,
  local: LOCAL_API_URL,
} as const;

export type ApiEnvName = keyof typeof API_ENVIRONMENTS;

const trimTrailingSlash = (url: string) => url.trim().replace(/\/$/, "");

const ensureApiSuffix = (url: string) => {
  const trimmed = trimTrailingSlash(url);
  return /\/api$/i.test(trimmed) ? trimmed : `${trimmed}/api`;
};

/** Explicit URL, then named environment. Missing names are development, not production. */
export const resolveApiBaseUrl = ({
  explicitUrl,
  envName,
}: {
  explicitUrl?: string;
  envName?: string;
} = {}) => {
  if (explicitUrl?.trim()) return ensureApiSuffix(explicitUrl);
  return API_ENVIRONMENTS[resolveAppEnvName(envName)];
};

export const API_BASE_URL = resolveApiBaseUrl({
  explicitUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
  envName: process.env.EXPO_PUBLIC_API_ENV,
});
