import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { ApiClient } from "../api/client";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// iOS getDevicePushTokenAsync returns an APNs token, which the FCM backend cannot use.
const canPush = () => Platform.OS === "android" && Device.isDevice;

export async function registerPush(api: ApiClient) {
  if (!canPush()) return;
  try {
    // Android 13+ only shows the permission prompt once a channel exists.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.HIGH,
    });
    const { granted } = await Notifications.requestPermissionsAsync();
    if (!granted) return;
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    await api.request({
      path: "/notification/devices",
      method: "POST",
      body: { token, platform: "android" },
    });
  } catch {
    // Push is best-effort; the in-app bell still works without it.
  }
}

export async function unregisterPush(api: ApiClient) {
  if (!canPush()) return;
  try {
    const { data: token } = await Notifications.getDevicePushTokenAsync();
    await api.request({
      path: "/notification/devices",
      method: "DELETE",
      body: { token },
      skipAuthRedirect: true,
    });
  } catch {
    // Never block sign-out on this.
  }
}
