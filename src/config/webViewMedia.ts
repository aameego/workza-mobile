/**
 * Attendance check-in uses getUserMedia (selfie) and geolocation (site fence).
 * The WebView can only prompt after these native permissions exist.
 * Android "Allow this time" is revoked when the process dies — always call
 * requestPermissions (do not trust check()) so the system dialog can return.
 */
export const ATTENDANCE_ANDROID_PERMISSIONS = [
  "android.permission.CAMERA",
  "android.permission.ACCESS_FINE_LOCATION",
  "android.permission.ACCESS_COARSE_LOCATION",
] as const;

export type AttendancePermissionResult = {
  prompted: boolean;
  camera: boolean;
  location: boolean;
  cameraBlocked: boolean;
};

export type AttendanceMediaFollowUp = {
  script: string;
  openSettings: boolean;
};

export const ATTENDANCE_MEDIA_REQUEST_TYPE = "REQUEST_ATTENDANCE_MEDIA";

export const ATTENDANCE_MEDIA_READY_SCRIPT =
  "window.dispatchEvent(new Event('workza-media-ready')); true;";

export const ATTENDANCE_MEDIA_DENIED_SCRIPT =
  "window.dispatchEvent(new Event('workza-media-denied')); true;";

export const requestAttendanceMediaPermissions = async ({
  os,
  requestMultiple,
}: {
  os: string;
  requestMultiple?: (
    permissions: readonly string[]
  ) => Promise<Record<string, string>>;
}): Promise<AttendancePermissionResult> => {
  if (os !== "android") {
    return { prompted: false, camera: true, location: true, cameraBlocked: false };
  }
  if (!requestMultiple) {
    return { prompted: false, camera: false, location: false, cameraBlocked: false };
  }

  const needed = [...ATTENDANCE_ANDROID_PERMISSIONS];
  const result = await requestMultiple(needed);
  const granted = (permission: string) => result[permission] === "granted";
  return {
    prompted: true,
    camera: granted("android.permission.CAMERA"),
    location:
      granted("android.permission.ACCESS_FINE_LOCATION") ||
      granted("android.permission.ACCESS_COARSE_LOCATION"),
    cameraBlocked: result["android.permission.CAMERA"] === "never_ask_again",
  };
};

/** After Deny, do not pretend the camera is ready. Blocked = Android will not ask again. */
export const attendanceMediaNativeFollowUp = (
  result: AttendancePermissionResult
): AttendanceMediaFollowUp => {
  if (result.camera) {
    return { script: ATTENDANCE_MEDIA_READY_SCRIPT, openSettings: false };
  }
  return {
    script: ATTENDANCE_MEDIA_DENIED_SCRIPT,
    openSettings: result.cameraBlocked,
  };
};

export const ATTENDANCE_CAMERA_BLOCKED_ALERT = {
  title: "Camera is blocked",
  message:
    "Enable Camera for Workza in Settings, then tap Allow camera on check-in.",
  cancel: "Not now",
  confirm: "Open Settings",
} as const;

/**
 * Check-in calls getUserMedia then geolocation. Wrap both so Android can
 * re-ask after an "Allow this time" grant dies with the process.
 */
export const ATTENDANCE_MEDIA_BRIDGE_SCRIPT = `
(function () {
  if (window.__workzaMediaBridge) return;
  window.__workzaMediaBridge = true;
  var waiters = [];
  window.addEventListener('workza-media-ready', function () {
    waiters.splice(0).forEach(function (fn) { fn(true); });
  });
  window.addEventListener('workza-media-denied', function () {
    waiters.splice(0).forEach(function (fn) { fn(false); });
  });
  function waitForNative() {
    return new Promise(function (resolve, reject) {
      var done = false;
      var finish = function (ok) {
        if (done) return;
        done = true;
        if (ok) resolve();
        else {
          var err = new Error('Camera permission was not granted.');
          err.name = 'NotAllowedError';
          reject(err);
        }
      };
      waiters.push(finish);
      setTimeout(function () { finish(false); }, 30000);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${ATTENDANCE_MEDIA_REQUEST_TYPE}' }));
      } catch (e) {
        finish(false);
      }
    });
  }
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var origGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      return waitForNative().then(function () { return origGum(constraints); });
    };
  }
  function wrapLegacyGum(orig) {
    return function (constraints, success, error) {
      waitForNative().then(function () { orig(constraints, success, error); }, error);
    };
  }
  if (navigator.getUserMedia) {
    navigator.getUserMedia = wrapLegacyGum(navigator.getUserMedia.bind(navigator));
  }
  if (navigator.webkitGetUserMedia) {
    navigator.webkitGetUserMedia = wrapLegacyGum(navigator.webkitGetUserMedia.bind(navigator));
  }
  function wrapGeo(orig) {
    return function (success, error, options) {
      waitForNative().then(function () { orig(success, error, options); }, function (err) {
        if (typeof error === 'function') error({ code: 1, message: err && err.message ? err.message : 'denied', PERMISSION_DENIED: 1 });
      });
    };
  }
  if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    navigator.geolocation.getCurrentPosition = wrapGeo(navigator.geolocation.getCurrentPosition.bind(navigator.geolocation));
  }
  if (navigator.geolocation && navigator.geolocation.watchPosition) {
    navigator.geolocation.watchPosition = wrapGeo(navigator.geolocation.watchPosition.bind(navigator.geolocation));
  }
})();
true;
`;

export const parseAttendanceMediaMessage = (raw: string) => {
  try {
    const data = JSON.parse(raw) as { type?: string };
    return data?.type === ATTENDANCE_MEDIA_REQUEST_TYPE;
  } catch {
    return false;
  }
};

export const ATTENDANCE_IOS_USAGE = {
  NSCameraUsageDescription:
    "Workza uses the camera so you can take an attendance selfie.",
  NSLocationWhenInUseUsageDescription:
    "Workza uses your location to confirm you are at the work site when you check in.",
} as const;

export const WEBVIEW_MEDIA_PROPS = {
  geolocationEnabled: true,
  allowsInlineMediaPlayback: true,
  mediaPlaybackRequiresUserAction: false,
  mediaCapturePermissionGrantType: "prompt" as const,
};
