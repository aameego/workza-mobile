export const MOBILE_APP_VERSION = "1.0.5";
export const MOBILE_CLIENT_KEY_HEADER = "X-Workza-Client-Key";
export const MOBILE_APP_VERSION_HEADER = "X-Workza-App-Version";
export const WEB_MOBILE_KEY_STORAGE = "workzaMobileClientKey";
export const WEB_MOBILE_VERSION_STORAGE = "workzaMobileAppVersion";

export const mobileClientKey = () =>
  String(process.env.EXPO_PUBLIC_MOBILE_CLIENT_KEY || "").trim();

export const mobileClientRequestHeaders = () => {
  const headers: Record<string, string> = {
    "User-Agent": `WorkzaMobile/${MOBILE_APP_VERSION}`,
    [MOBILE_APP_VERSION_HEADER]: MOBILE_APP_VERSION,
  };
  const key = mobileClientKey();
  if (key) headers[MOBILE_CLIENT_KEY_HEADER] = key;
  return headers;
};
