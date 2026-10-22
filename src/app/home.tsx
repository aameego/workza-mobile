import { Redirect } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType, type Ref } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { WebView as RNWebView } from "react-native-webview";

import {
  WEB_APP_BASE_URL,
  decideOpenWindow,
  decideWebViewNavigation,
  isWebAppSignedOutUrl,
  sessionBootstrapScript,
  webAppEntryUrl,
} from "@/config/webApp";
import { requestAttendanceMediaPermissions, WEBVIEW_MEDIA_PROPS } from "@/config/webViewMedia";
import { colors, space } from "@/theme";
import { AppButton, AppScreen, AppText, BrandLogo } from "@/ui";
import { useSession } from "@/session/SessionProvider";

type WebViewHost = {
  goBack: () => void;
  reload: () => void;
};

type WebViewNav = { url: string; canGoBack: boolean };
type WebViewRequest = { url: string; isTopFrame?: boolean };
type WebViewOpenWindow = { nativeEvent: { targetUrl: string } };

// RN 0.88 + react-native-webview props currently collapse to `never` under tsc.
const WebView = RNWebView as unknown as ComponentType<Record<string, unknown> & { ref?: Ref<WebViewHost> }>;

export default function HomeScreen() {
  const { session, signOut } = useSession();
  const webRef = useRef<WebViewHost>(null);
  const firstPaintDone = useRef(false);
  const lastUrl = useRef("");
  const [canGoBack, setCanGoBack] = useState(false);
  const [showFirstLoad, setShowFirstLoad] = useState(true);
  const [loadError, setLoadError] = useState("");

  const entryUrl = useMemo(() => (session ? webAppEntryUrl(session) : ""), [session]);
  const bootstrap = useMemo(
    () => (session ? sessionBootstrapScript(session) : "true;"),
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

  useEffect(() => {
    void requestAttendanceMediaPermissions({
      os: Platform.OS,
      requestMultiple: (permissions) =>
        PermissionsAndroid.requestMultiple(
          permissions as Parameters<typeof PermissionsAndroid.requestMultiple>[0]
        ),
    });
  }, []);

  const applyNavDecision = useCallback((decision: ReturnType<typeof decideWebViewNavigation>) => {
    if (decision.action === "openExternal") {
      void Linking.openURL(decision.url).catch(() => {});
      return false;
    }
    return decision.action === "allow";
  }, []);

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
        originWhitelist={["https://*", "http://*", "about:*", "blob:*", "data:*"]}
        sharedCookiesEnabled
        thirdPartyCookiesEnabled
        javaScriptEnabled
        domStorageEnabled
        cacheEnabled
        mixedContentMode="always"
        nestedScrollEnabled
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
