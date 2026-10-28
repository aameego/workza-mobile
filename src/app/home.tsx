import { Redirect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from "react";
import {
  ActivityIndicator,
  Alert,
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView as RNWebView } from "react-native-webview";
import * as FileSystem from "expo-file-system/legacy";
import * as Notifications from "expo-notifications";
import { saveToPublicDownloads } from "workza-downloads";

import {
  WEB_APP_BASE_URL,
  decideOpenWindow,
  decideWebViewNavigation,
  isWebAppSignedOutUrl,
  sessionBootstrapScript,
  urlForExternalOpen,
  vendorWebUrl,
  webAppEntryUrl,
} from "@/config/webApp";
import {
  DOWNLOAD_BRIDGE_SCRIPT,
  parseWebViewDownloadMessage,
  saveWebViewDownload,
} from "@/config/webViewDownload";
import {
  ATTENDANCE_CAMERA_BLOCKED_ALERT,
  ATTENDANCE_MEDIA_BRIDGE_SCRIPT,
  attendanceMediaNativeFollowUp,
  parseAttendanceMediaMessage,
  requestAttendanceMediaPermissions,
  WEBVIEW_MEDIA_PROPS,
} from "@/config/webViewMedia";
import { WEBVIEW_SHELL_PROPS } from "@/config/webViewShell";
import { colors, space } from "@/theme";
import { AppButton, AppScreen, AppText, BrandLogo } from "@/ui";
import { useSession } from "@/session/SessionProvider";

type WebViewHost = {
  goBack: () => void;
  reload: () => void;
  injectJavaScript: (script: string) => void;
};

type WebViewNav = { url: string; canGoBack: boolean };
type WebViewRequest = { url: string; isTopFrame?: boolean };
type WebViewOpenWindow = { nativeEvent: { targetUrl: string } };

const NOTIFICATIONS_UPDATED_SCRIPT = "window.dispatchEvent(new Event('notifications-updated')); true;";
const navigateScript = (url: string) => `window.location.assign(${JSON.stringify(url)}); true;`;

// RN 0.88 + react-native-webview props currently collapse to `never` under tsc.
const WebView = RNWebView as unknown as ComponentType<Record<string, unknown> & { ref?: Ref<WebViewHost> }>;

export default function HomeScreen() {
  const { session, signOut } = useSession();
  const webRef = useRef<WebViewHost>(null);
  const firstPaintDone = useRef(false);
  const lastUrl = useRef("");
  const pendingUrl = useRef<string | null>(null);
  const [canGoBack, setCanGoBack] = useState(false);
  const [showFirstLoad, setShowFirstLoad] = useState(true);
  const [loadError, setLoadError] = useState("");

  const entryUrl = useMemo(() => (session ? webAppEntryUrl(session) : ""), [session]);
  const bootstrap = useMemo(
    () =>
      session
        ? `${sessionBootstrapScript(session)}\n${ATTENDANCE_MEDIA_BRIDGE_SCRIPT}\n${DOWNLOAD_BRIDGE_SCRIPT}`
        : `${ATTENDANCE_MEDIA_BRIDGE_SCRIPT}\n${DOWNLOAD_BRIDGE_SCRIPT}`,
    [session]
  );

  const leaveIfSignedOut = useCallback(
    (url: string) => {
      if (!isWebAppSignedOutUrl(url, WEB_APP_BASE_URL)) return false;
      void signOut();
      return true;
    },
    [signOut]
  );

  const recoverWebView = useCallback(() => {
    webRef.current?.reload();
  }, []);

  const askAttendanceMedia = useCallback(async () => {
    const result = await requestAttendanceMediaPermissions({
      os: Platform.OS,
      requestMultiple: (permissions) =>
        PermissionsAndroid.requestMultiple(
          permissions as Parameters<typeof PermissionsAndroid.requestMultiple>[0]
        ),
    });
    const follow = attendanceMediaNativeFollowUp(result);
    if (follow.openSettings) {
      Alert.alert(
        ATTENDANCE_CAMERA_BLOCKED_ALERT.title,
        ATTENDANCE_CAMERA_BLOCKED_ALERT.message,
        [
          { text: ATTENDANCE_CAMERA_BLOCKED_ALERT.cancel, style: "cancel" },
          {
            text: ATTENDANCE_CAMERA_BLOCKED_ALERT.confirm,
            onPress: () => {
              void Linking.openSettings();
            },
          },
        ]
      );
    }
    webRef.current?.injectJavaScript(follow.script);
  }, []);

  const applyNavDecision = useCallback((decision: ReturnType<typeof decideWebViewNavigation>) => {
    if (decision.action === "openExternal") {
      const url = urlForExternalOpen(decision.url, Platform.OS);
      void Linking.openURL(url).catch(() => {
        if (url !== decision.url) {
          void Linking.openURL(decision.url).catch(() => {});
        }
      });
      return false;
    }
    return decision.action === "allow";
  }, []);

  const saveWebFile = useCallback(async (raw: string) => {
    const file = parseWebViewDownloadMessage(raw);
    if (!file) return;
    try {
      if (Platform.OS === "android") {
        const sdk = Number(Platform.Version);
        const request = (permission: string) =>
          PermissionsAndroid.request(
            permission as Parameters<typeof PermissionsAndroid.request>[0]
          );
        if (sdk >= 33) {
          await request("android.permission.POST_NOTIFICATIONS");
        } else if (sdk < 29) {
          await request("android.permission.WRITE_EXTERNAL_STORAGE");
        }
      }
      const directory =
        (Platform.OS === "android" ? FileSystem.cacheDirectory : FileSystem.documentDirectory) ||
        FileSystem.documentDirectory ||
        FileSystem.cacheDirectory ||
        "";
      const result = await saveWebViewDownload(file, {
        os: Platform.OS,
        directory,
        writeFile: (uri, base64) =>
          FileSystem.writeAsStringAsync(uri, base64, {
            encoding: FileSystem.EncodingType.Base64,
          }),
        publishToDownloads: Platform.OS === "android" ? saveToPublicDownloads : undefined,
      });
      Alert.alert("Download complete", `${result.fileName} was saved to your device.`);
    } catch {
      Alert.alert("Download failed", "Could not save the file. Please try again.");
    }
  }, []);

  const openFromNotification = useCallback(
    (response: Notifications.NotificationResponse | null) => {
      Notifications.clearLastNotificationResponse();
      const url = session && response && vendorWebUrl(session, response.notification.request.content.data?.path);
      if (!url) return;
      // Before the first load finishes an injected script would be lost; onLoadEnd applies it.
      if (firstPaintDone.current) webRef.current?.injectJavaScript(navigateScript(url));
      else pendingUrl.current = url;
    },
    [session]
  );

  useEffect(() => {
    if (Platform.OS === "web") return;
    openFromNotification(Notifications.getLastNotificationResponse());
    const tap = Notifications.addNotificationResponseReceivedListener(openFromNotification);
    const received = Notifications.addNotificationReceivedListener(() => {
      webRef.current?.injectJavaScript(NOTIFICATIONS_UPDATED_SCRIPT);
    });
    return () => {
      tap.remove();
      received.remove();
    };
  }, [openFromNotification]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!canGoBack) return false;
      webRef.current?.goBack();
      return true;
    });
    return () => sub.remove();
  }, [canGoBack]);

  if (!session) return <Redirect href="/login" />;

  if (Platform.OS === "web") {
    return (
      <AppScreen>
        <BrandLogo />
        <AppText variant="title" style={{ marginTop: space.xl }}>
          Open Workza on your phone
        </AppText>
        <AppText variant="subtitle" style={{ marginTop: space.sm }}>
          After sign-in, the dashboard and every HRMS module open in the app. Use iOS or
          Android to continue.
        </AppText>
        <AppButton
          label="Sign out"
          variant="secondary"
          onPress={() => signOut()}
          style={{ marginTop: space.xl, alignSelf: "flex-start" }}
        />
      </AppScreen>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <WebView
        ref={webRef}
        style={styles.webview}
        source={{ uri: entryUrl }}
        originWhitelist={["https://*", "http://*", "about:*", "blob:*", "data:*", "geo:*", "intent:*", "maps:*"]}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        mixedContentMode="always"
        nestedScrollEnabled={WEBVIEW_SHELL_PROPS.nestedScrollEnabled}
        setSupportMultipleWindows
        androidLayerType="hardware"
        geolocationEnabled={WEBVIEW_MEDIA_PROPS.geolocationEnabled}
        allowsInlineMediaPlayback={WEBVIEW_MEDIA_PROPS.allowsInlineMediaPlayback}
        mediaPlaybackRequiresUserAction={WEBVIEW_MEDIA_PROPS.mediaPlaybackRequiresUserAction}
        mediaCapturePermissionGrantType={WEBVIEW_MEDIA_PROPS.mediaCapturePermissionGrantType}
        allowsBackForwardNavigationGestures
        injectedJavaScriptBeforeContentLoaded={bootstrap}
        injectedJavaScript={bootstrap}
        onLoadStart={() => {
          setLoadError("");
          if (!firstPaintDone.current) setShowFirstLoad(true);
        }}
        onLoadEnd={() => {
          firstPaintDone.current = true;
          setShowFirstLoad(false);
          if (lastUrl.current) leaveIfSignedOut(lastUrl.current);
          if (pendingUrl.current) {
            webRef.current?.injectJavaScript(navigateScript(pendingUrl.current));
            pendingUrl.current = null;
          }
        }}
        onError={() => {
          firstPaintDone.current = true;
          setShowFirstLoad(false);
          setLoadError("Could not open Workza. Check your connection and try again.");
        }}
        onHttpError={(event: { nativeEvent: { statusCode: number } }) => {
          if (event.nativeEvent.statusCode >= 500) {
            setLoadError("Workza is unavailable right now. Try again.");
          }
        }}
        onContentProcessDidTerminate={recoverWebView}
        onRenderProcessGone={recoverWebView}
        onNavigationStateChange={(nav: WebViewNav) => {
          setCanGoBack(nav.canGoBack);
          lastUrl.current = nav.url;
          if (firstPaintDone.current) leaveIfSignedOut(nav.url);
        }}
        onShouldStartLoadWithRequest={(request: WebViewRequest) =>
          applyNavDecision(decideWebViewNavigation(request, WEB_APP_BASE_URL))
        }
        onOpenWindow={(event: WebViewOpenWindow) => {
          applyNavDecision(decideOpenWindow(event.nativeEvent.targetUrl, WEB_APP_BASE_URL));
        }}
        onMessage={(event: { nativeEvent: { data: string } }) => {
          const raw = event.nativeEvent.data;
          if (parseAttendanceMediaMessage(raw)) {
            void askAttendanceMedia();
            return;
          }
          void saveWebFile(raw);
        }}
      />
      {showFirstLoad && !loadError ? (
        <View style={styles.overlay} pointerEvents="none">
          <ActivityIndicator color={colors.navy} size="large" />
        </View>
      ) : null}
      {loadError ? (
        <View style={styles.overlay}>
          <AppText variant="error">{loadError}</AppText>
          <AppButton
            label="Try again"
            onPress={() => {
              setLoadError("");
              firstPaintDone.current = false;
              setShowFirstLoad(true);
              webRef.current?.reload();
            }}
            style={{ marginTop: space.md }}
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  // opacity < 1 avoids an Android compositor bug that paints the WebView white after SPA navigations.
  webview: { flex: 1, backgroundColor: colors.background, opacity: 0.99 },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    padding: space.xl,
  },
});
