/**
 * Full-screen HRMS WebView. Android nested scrolling is for a WebView inside
 * a ScrollView; turning it on here steals vertical pans so the page cannot
 * scroll (Play "Broken Functionality" / ANR).
 */
export const WEBVIEW_SHELL_PROPS = {
  nestedScrollEnabled: false,
} as const;
