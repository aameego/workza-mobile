/**
 * Attendance check-in uses getUserMedia (selfie) and geolocation (site fence).
 * The WebView can only prompt after these native permissions exist.
 * Android "Allow this time" is revoked when the process dies — request again
 * on each cold start so the system dialog can return.
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
};

export const ATTENDANCE_MEDIA_REQUEST_TYPE = "REQUEST_ATTENDANCE_MEDIA";

export const requestAttendanceMediaPermissions = async ({
  os,
  check,
  requestMultiple,
}: {
  os: string;
  check?: (permission: string) => Promise<boolean>;
  requestMultiple?: (
    permissions: readonly string[]
  ) => Promise<Record<string, string>>;
}): Promise<AttendancePermissionResult> => {
  if (os !== "android") return { prompted: false, camera: true, location: true };
  if (!requestMultiple) return { prompted: false, camera: false, location: false };

  let needed = [...ATTENDANCE_ANDROID_PERMISSIONS];
  if (check) {
    const statuses = await Promise.all(
      needed.map(async (permission) => [permission, await check(permission)] as const)
    );
    needed = statuses.filter(([, ok]) => !ok).map(([permission]) => permission);
    if (needed.length === 0) {
      return { prompted: false, camera: true, location: true };
    }
  }

  const result = await requestMultiple(needed);
  const asked = new Set(needed);
  const granted = (permission: string) =>
    !asked.has(permission) || result[permission] === "granted";
  return {
    prompted: true,
    camera: granted("android.permission.CAMERA"),
    location:
      granted("android.permission.ACCESS_FINE_LOCATION") ||
      granted("android.permission.ACCESS_COARSE_LOCATION"),
  };
};

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
    waiters.splice(0).forEach(function (fn) { fn(); });
  });
  function waitForNative() {
    return new Promise(function (resolve) {
      var done = false;
      var finish = function () {
        if (done) return;
        done = true;
        resolve();
      };
      waiters.push(finish);
      setTimeout(finish, 15000);
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: '${ATTENDANCE_MEDIA_REQUEST_TYPE}' }));
      } catch (e) {
        finish();
      }
    });
  }
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    var origGum = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
    navigator.mediaDevices.getUserMedia = function (constraints) {
      return waitForNative().then(function () { return origGum(constraints); });
    };
  }
  if (navigator.geolocation && navigator.geolocation.getCurrentPosition) {
    var origGeo = navigator.geolocation.getCurrentPosition.bind(navigator.geolocation);
    navigator.geolocation.getCurrentPosition = function (success, error, options) {
      waitForNative().then(function () { origGeo(success, error, options); });
    };
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

export const ATTENDANCE_MEDIA_READY_SCRIPT =
  "window.dispatchEvent(new Event('workza-media-ready')); true;";

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
  mediaCapturePermissionGrantType: "grantIfSameHostElsePrompt" as const,
};
