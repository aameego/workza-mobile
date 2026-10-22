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

export const requestAttendanceMediaPermissions = async ({
  os,
  requestMultiple,
}: {
  os: string;
  requestMultiple?: (
    permissions: readonly string[]
  ) => Promise<Record<string, string>>;
}): Promise<AttendancePermissionResult> => {
  if (os !== "android") return { prompted: false, camera: true, location: true };
  if (!requestMultiple) return { prompted: false, camera: false, location: false };

  const result = await requestMultiple(ATTENDANCE_ANDROID_PERMISSIONS);
  const granted = (permission: string) => result[permission] === "granted";
  return {
    prompted: true,
    camera: granted("android.permission.CAMERA"),
    location:
      granted("android.permission.ACCESS_FINE_LOCATION") ||
      granted("android.permission.ACCESS_COARSE_LOCATION"),
  };
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
  mediaCapturePermissionGrantType: "grantIfSameHostElsePrompt" as const,
};
