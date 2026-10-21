import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import type { KeyValueStore } from "./sessionStore";

const webStore = (): Storage | null =>
  typeof globalThis !== "undefined" && "localStorage" in globalThis ? globalThis.localStorage : null;

/** Device builds use the secure store. The web preview uses localStorage for the same keys. */
export const deviceKeyValueStore: KeyValueStore = {
  async getItem(key) {
    if (Platform.OS === "web") return webStore()?.getItem(key) ?? null;
    return SecureStore.getItemAsync(key);
  },
  async setItem(key, value) {
    if (Platform.OS === "web") {
      webStore()?.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  async deleteItem(key) {
    if (Platform.OS === "web") {
      webStore()?.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
