import type { SessionData } from "../auth/types";

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
  if (envName && envName in WEB_APP_ENVIRONMENTS) {
    return WEB_APP_ENVIRONMENTS[envName as keyof typeof WEB_APP_ENVIRONMENTS];
  }
  return PRODUCTION_WEB_URL;
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

export const sessionBootstrapScript = (session: SessionData) => {
  const token = JSON.stringify(session.token);
  const user = JSON.stringify(JSON.stringify(session.user));
  const organisations = JSON.stringify(JSON.stringify(session.organisations ?? []));
  return `
    (function () {
      try {
        localStorage.setItem('token', ${token});
        localStorage.setItem('user', ${user});
        localStorage.setItem('organisations', ${organisations});
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

const INTERNAL_WEBVIEW_URL = /^(about:|blob:|data:|file:|intent:)/i;

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
  if (url.startsWith("geo:")) return true;
  try {
    const parsed = new URL(url);
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
