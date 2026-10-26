import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import {
  ATTENDANCE_ANDROID_PERMISSIONS,
  ATTENDANCE_IOS_USAGE,
  ATTENDANCE_MEDIA_BRIDGE_SCRIPT,
  ATTENDANCE_MEDIA_REQUEST_TYPE,
  WEBVIEW_MEDIA_PROPS,
  parseAttendanceMediaMessage,
  requestAttendanceMediaPermissions,
} from "./webViewMedia.ts";

const app = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), "../../app.json"), "utf8")
);

describe("WEBVIEW_MEDIA_PROPS", () => {
  it("lets the attendance page use camera preview and GPS inside the WebView", () => {
    assert.equal(WEBVIEW_MEDIA_PROPS.geolocationEnabled, true);
    assert.equal(WEBVIEW_MEDIA_PROPS.allowsInlineMediaPlayback, true);
    assert.equal(WEBVIEW_MEDIA_PROPS.mediaPlaybackRequiresUserAction, false);
    assert.equal(WEBVIEW_MEDIA_PROPS.mediaCapturePermissionGrantType, "grantIfSameHostElsePrompt");
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

  it("asks Android again when a one-time grant is gone after kill", async () => {
    const asked: string[][] = [];
    const result = await requestAttendanceMediaPermissions({
      os: "android",
      check: async () => false,
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
    assert.deepEqual(result, { prompted: true, camera: true, location: true });
  });

  it("does not show a second dialog while the current session still has the grant", async () => {
    let called = false;
    const result = await requestAttendanceMediaPermissions({
      os: "android",
      check: async () => true,
      requestMultiple: async () => {
        called = true;
        return {};
      },
    });
    assert.equal(called, false);
    assert.deepEqual(result, { prompted: false, camera: true, location: true });
  });

  it("asks the OS before getUserMedia and geolocation run in the WebView", () => {
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /getUserMedia/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, /getCurrentPosition/);
    assert.match(ATTENDANCE_MEDIA_BRIDGE_SCRIPT, new RegExp(ATTENDANCE_MEDIA_REQUEST_TYPE));
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
});
