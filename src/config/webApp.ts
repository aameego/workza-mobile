import type { SessionData } from "../auth/types";
import { resolveAppEnvName } from "./appEnv";

export const PRODUCTION_WEB_URL = "https://workza.ai";
export const DEVELOPMENT_WEB_URL = "https://dev.workza.ai";
export const LOCAL_WEB_URL = "http://localhost:3000";

export const WEB_APP_ENVIRONMENTS = {
  production: PRODUCTION_WEB_URL,
  development: DEVELOPMENT_WEB_URL,
  local: LOCAL_WEB_URL,
} as const;

const trimTrailingSlash = (url: string) => url.trim().replace(/\/$/, "");

export const resolveWebAppBaseUrl = ({
  explicitUrl,
  envName,
}: {
  explicitUrl?: string;
  envName?: string;
} = {}) => {
  if (explicitUrl?.trim()) return trimTrailingSlash(explicitUrl);
  return WEB_APP_ENVIRONMENTS[resolveAppEnvName(envName)];
};

export const WEB_APP_BASE_URL = resolveWebAppBaseUrl({
  explicitUrl: process.env.EXPO_PUBLIC_WEB_APP_URL,
  envName: process.env.EXPO_PUBLIC_API_ENV,
});

/** Same slug rules as AameegoGig-Frontend/src/utils/vendorPath.js */
export const toVendorSlug = (vendorName: string | null | undefined) =>
  String(vendorName || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const vendorDashboardPath = (user: { vendorName?: string | null } | null | undefined) => {
  const slug = toVendorSlug(user?.vendorName);
  return slug ? `/${slug}/dashboard` : "/dashboard";
};

export const webAppEntryUrl = (
  session: SessionData,
  options?: { explicitUrl?: string; envName?: string }
) => {
  const base = options ? resolveWebAppBaseUrl(options) : WEB_APP_BASE_URL;
  return `${base}${vendorDashboardPath(session.user)}`;
};

/** Push `data.path` is vendor-relative (`/leave`); anything else is ignored. */
export const vendorWebUrl = (session: SessionData, path: unknown, base = WEB_APP_BASE_URL) => {
  if (typeof path !== "string" || !path.startsWith("/") || path.startsWith("//")) return null;
  const slug = toVendorSlug(session.user?.vendorName);
  return `${base}${slug ? `/${slug}` : ""}${path}`;
};

export const sessionBootstrapScript = (
  session: SessionData,
  mobileClient?: { key?: string; version?: string }
) => {
  const token = JSON.stringify(session.token);
  const user = JSON.stringify(JSON.stringify(session.user));
  const organisations = JSON.stringify(JSON.stringify(session.organisations ?? []));
  const mobileKey = JSON.stringify(mobileClient?.key || "");
  const mobileVersion = JSON.stringify(mobileClient?.version || "");
  return `
    (function () {
      try {
        localStorage.setItem('token', ${token});
        localStorage.setItem('user', ${user});
        localStorage.setItem('organisations', ${organisations});
        localStorage.setItem('workzaMobileClientKey', ${mobileKey});
        localStorage.setItem('workzaMobileAppVersion', ${mobileVersion});
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        sessionStorage.removeItem('organisations');
      } catch (e) {}
    })();
    true;
  `;
};

const AUTH_EXIT_PATHS = new Set([
  "/login",
  "/create-org",
  "/join",
  "/forgot-password",
  "/forgot-org-code",
]);

const pathnameOf = (url: string) => {
  const parsed = new URL(url);
  const path = parsed.pathname.replace(/\/+$/, "");
  return path || "/";
};

export const isSameWebAppOrigin = (url: string, webBase: string) => {
  try {
    return new URL(url).origin === new URL(webBase).origin;
  } catch {
    return false;
  }
};

export const isWebAppSignedOutUrl = (url: string, webBase: string) => {
  if (!isSameWebAppOrigin(url, webBase)) return false;
  try {
    const path = pathnameOf(url);
    return AUTH_EXIT_PATHS.has(path);
  } catch {
    return false;
  }
};

const INTERNAL_WEBVIEW_URL = /^(about:|blob:|data:|file:)/i;
const COORD_PAIR = /(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/;
const MAPS_INTENT_HINT =
  /google\.com\/maps|maps\.google\.com|maps\.app\.goo\.gl|package=com\.google\.android\.apps\.maps/i;

export type WebViewNavRequest = {
  url: string;
  isTopFrame?: boolean;
};

export type WebViewNavDecision =
  | { action: "allow" }
  | { action: "block" }
  | { action: "openExternal"; url: string };

const hostOf = (url: string) => {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return "";
  }
};

/** Tiles/scripts for the in-app Google Map (sites / geofence). */
export const isMapsAssetUrl = (url: string) => {
  const host = hostOf(url);
  if (!host) return false;
  return (
    host === "maps.googleapis.com" ||
    host.endsWith(".googleapis.com") ||
    host === "maps.gstatic.com" ||
    host.endsWith(".gstatic.com")
  );
};

/** Pin links (`target=_blank` to google.com/maps) must leave the WebView. */
export const isExternalMapsUrl = (url: string) => {
  if (!url) return false;
  if (url.startsWith("geo:") || url.startsWith("maps:") || url.startsWith("comgooglemaps:")) {
    return true;
  }
  if (url.startsWith("google.navigation:")) return true;
  if (/^intent:/i.test(url) && MAPS_INTENT_HINT.test(url)) return true;
  try {
    const parsed = new URL(reconstructHttpsFromIntent(url) || url);
    const host = parsed.hostname.toLowerCase();
    const path = parsed.pathname.toLowerCase();
    if (host === "maps.google.com" || host === "maps.app.goo.gl") return true;
    if ((host === "www.google.com" || host === "google.com") && path.startsWith("/maps")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

/** Rebuild https:// from Android `intent://host/path#Intent;scheme=https;...` */
export const reconstructHttpsFromIntent = (url: string) => {
  if (!/^intent:/i.test(url)) return null;
  const hash = url.indexOf("#");
  const body = hash >= 0 ? url.slice(0, hash) : url;
  const fragment = hash >= 0 ? url.slice(hash + 1) : "";
  const scheme = /(?:^|;)scheme=([^;]+)/i.exec(fragment)?.[1] || "https";
  const rest = body.replace(/^intent:/i, "");
  if (!rest.startsWith("//")) return null;
  return `${scheme}:${rest}`;
};

export const parseMapsCoordinates = (url: string) => {
  const normalized = reconstructHttpsFromIntent(url) || url;
  const geo = /^geo:([^?;]+)/i.exec(normalized);
  if (geo) {
    const pair = COORD_PAIR.exec(decodeURIComponent(geo[1]));
    if (pair) return { lat: pair[1], lng: pair[2] };
  }
  try {
    const parsed = new URL(normalized);
    for (const key of ["q", "query", "ll", "daddr", "destination"]) {
      const value = parsed.searchParams.get(key);
      if (!value) continue;
      const pair = COORD_PAIR.exec(value);
      if (pair) return { lat: pair[1], lng: pair[2] };
    }
    const at = /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/.exec(`${parsed.pathname}${parsed.hash}`);
    if (at) return { lat: at[1], lng: at[2] };
  } catch {
    // Fall through to a raw scan of the original string.
  }
  const pair = COORD_PAIR.exec(normalized);
  return pair ? { lat: pair[1], lng: pair[2] } : null;
};

/**
 * https maps links open Chrome, which then shows "Open App" and does nothing.
 * geo: / maps: launch the installed Maps app at the pin.
 */
export const toNativeMapsUrl = (url: string, platform: string) => {
  const coords = parseMapsCoordinates(url);
  if (!coords) return reconstructHttpsFromIntent(url) || url;
  const q = `${coords.lat},${coords.lng}`;
  if (platform === "ios") return `maps:?q=${q}`;
  return `geo:${q}?q=${q}`;
};

export const urlForExternalOpen = (url: string, platform: string) =>
  isExternalMapsUrl(url) ? toNativeMapsUrl(url, platform) : reconstructHttpsFromIntent(url) || url;

export const shouldOpenMapsExternally = (request: WebViewNavRequest) =>
  isExternalMapsUrl(request.url) && request.isTopFrame !== false;

/**
 * Android calls this for iframes, Maps, and often omits `isTopFrame`.
 * Returning false after a load has started leaves a white/blank WebView.
 * Cancel only an explicit top-frame navigation away from Workza.
 * Attendance pin links open in the system Maps app instead of this WebView.
 */
export const shouldAllowWebViewRequest = (request: WebViewNavRequest, webBase: string) => {
  const url = request.url || "";
  if (!url || INTERNAL_WEBVIEW_URL.test(url)) return true;
  if (request.isTopFrame === false) return true;
  if (isSameWebAppOrigin(url, webBase)) return true;
  if (isMapsAssetUrl(url)) return true;
  if (shouldOpenMapsExternally(request)) return false;
  return request.isTopFrame !== true;
};

export const decideWebViewNavigation = (
  request: WebViewNavRequest,
  webBase: string
): WebViewNavDecision => {
  if (shouldOpenMapsExternally(request)) {
    return { action: "openExternal", url: request.url };
  }
  return shouldAllowWebViewRequest(request, webBase)
    ? { action: "allow" }
    : { action: "block" };
};

/** `target=_blank` / window.open — Maps and other sites leave the shell. */
export const decideOpenWindow = (url: string, webBase: string): WebViewNavDecision => {
  if (isExternalMapsUrl(url) || !isSameWebAppOrigin(url, webBase)) {
    return { action: "openExternal", url };
  }
  return { action: "block" };
};
