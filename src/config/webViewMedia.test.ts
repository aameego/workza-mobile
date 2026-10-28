import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { patchWebChromeClientSource } from "../../plugins/patchWebChromeClient.js";
import {
  ATTENDANCE_ANDROID_PERMISSIONS,
  ATTENDANCE_IOS_USAGE,
  ATTENDANCE_MEDIA_BRIDGE_SCRIPT,
  ATTENDANCE_MEDIA_DENIED_SCRIPT,
  ATTENDANCE_MEDIA_READY_SCRIPT,
  ATTENDANCE_MEDIA_REQUEST_TYPE,
  WEBVIEW_MEDIA_PROPS,
  attendanceMediaNativeFollowUp,
  parseAttendanceMediaMessage,
  requestAttendanceMediaPermissions,
} from "./webViewMedia.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));

describe("WEBVIEW_MEDIA_PROPS", () => {
  it("lets the attendance page use camera preview and GPS inside the WebView", () => {
    assert.equal(WEBVIEW_MEDIA_PROPS.geolocationEnabled, true);
    assert.equal(WEBVIEW_MEDIA_PROPS.allowsInlineMediaPlayback, true);
    assert.equal(WEBVIEW_MEDIA_PROPS.mediaPlaybackRequiresUserAction, false);
    assert.equal(WEBVIEW_MEDIA_PROPS.mediaCapturePermissionGrantType, "prompt");
  });
});

describe("native attendance permissions", () => {
  it("declares camera and location on Android so getUserMedia can prompt", () => {
    const declared = app.expo.android.permissions ?? [];
    for (const permission of ATTENDANCE_ANDROID_PERMISSIONS) {
      assert.ok(declared.includes(permission), `app.json is missing ${permission}`);
    }
  });

  it("explains camera and location use on iOS", () => {
    const plist = app.expo.ios.infoPlist ?? {};
    assert.equal(plist.NSCameraUsageDescription, ATTENDANCE_IOS_USAGE.NSCameraUsageDescription);
    assert.equal(
      plist.NSLocationWhenInUseUsageDescription,
      ATTENDANCE_IOS_USAGE.NSLocationWhenInUseUsageDescription
    );
  });

  it("asks Android even when check() would still say granted after Allow this time", async () => {
    const asked: string[][] = [];
    const result = await requestAttendanceMediaPermissions({
      os: "android",
      requestMultiple: async (permissions) => {
        asked.push([...permissions]);
        return {
          "android.permission.CAMERA": "granted",
          "android.permission.ACCESS_FINE_LOCATION": "denied",
          "android.permission.ACCESS_COARSE_LOCATION": "granted",
        };
      },
    });
    assert.deepEqual(asked, [ATTENDANCE_ANDROID_PERMISSIONS.slice()]);
    assert.deepEqual(result, {
      prompted: true,
      camera: true,
      location: true,
      cameraBlocked: false,
    });
  });

  it("keeps getUserMedia waiting when the user taps Deny, so the selfie screen can retry", async () => {
    const result = await requestAttendanceMediaPermissions({
      os: "android",
      requestMultiple: async () => ({
        "android.permission.CAMERA": "denied",
        "android.permission.ACCESS_FINE_LOCATION": "granted",
        "android.permission.ACCESS_COARSE_LOCATION": "granted",
      }),
    });
    const follow = attendanceMediaNativeFollowUp(result);
    assert.equal(result.camera, false);
    assert.equal(result.cameraBlocked, false);
    assert.equal(follow.openSettings, false);
    assert.equal(follow.script, ATTENDANCE_MEDIA_DENIED_SCRIPT);
  });

  it("opens Settings when Android will not show the camera dialog again", async () => {
    const result = await requestAttendanceMediaPermissions({
      os: "android",
      requestMultiple: async () => ({
        "android.permission.CAMERA": "never_ask_again",
        "android.permission.ACCESS_FINE_LOCATION": "denied",
        "android.permission.ACCESS_COARSE_LOCATION": "denied",
      }),
    });
    const follow = attendanceMediaNativeFollowUp(result);
    assert.equal(result.cameraBlocked, true);
    assert.equal(follow.openSettings, true);
    assert.equal(follow.script, ATTENDANCE_MEDIA_DENIED_SCRIPT);
  });

  it("asks the OS before getUserMedia, legacy getUserMedia, and geolocation run", () => {
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /getUserMedia/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /webkitGetUserMedia/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /getCurrentPosition/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /watchPosition/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, new RegExp(ATTENDANCE_MEDIA_REQUEST_TYPE));
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /workza-media-denied/);
    assert.match(ATTENDANCE_MEDIA_DENIED_SCRIPT, /workza-media-denied/);
    assert.match(ATTENDANCE_MEDIA_READY_SCRIPT, /workza-media-ready/);
    assert.equal(parseAttendanceMediaMessage(JSON.stringify({ type: ATTENDANCE_MEDIA_REQUEST_TYPE })), true);
    assert.equal(parseAttendanceMediaMessage("not-json"), false);
  });

  it("does not show the Android dialog on iOS", async () => {
    let called = false;
    const result = await requestAttendanceMediaPermissions({
      os: "ios",
      requestMultiple: async () => {
        called = true;
        return {};
      },
    });
    assert.equal(called, false);
    assert.equal(result.prompted, false);
  });

  it("keeps the WebView permission plugin on the Expo config", () => {
    assert.ok(app.expo.plugins.includes("./plugins/withWebViewOneTimePermissions"));
  });
});

describe("WebView chrome client patch", () => {
  it("stops auto-granting camera and GPS from a stale checkSelfPermission", () => {
    const file = join(
      root,
      "node_modules/react-native-webview/android/src/main/java/com/reactnativecommunity/webview/RNCWebChromeClient.java"
    );
    const src = readFileSync(file, "utf8");
    const patched = patchWebChromeClientSource(src);
    assert.match(patched, /Always ask the OS/);
    assert.doesNotMatch(
      patched,
      /if \(ContextCompat\.checkSelfPermission\(this\.mWebView\.getThemedReactContext\(\), androidPermission\) == PackageManager\.PERMISSION_GRANTED\)/
    );
    assert.doesNotMatch(patched, /callback\.invoke\(origin, true, false\)/);
  });
});
