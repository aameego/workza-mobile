const { withGradleProperties } = require("expo/config-plugins");

/** Phone CPUs only. x86 / x86_64 are emulator slices and roughly double a sideload APK. */
const ANDROID_SIZE_PROPERTIES = {
  reactNativeArchitectures: "armeabi-v7a,arm64-v8a",
  "expo.useLegacyPackaging": "true",
  "android.enableBundleCompression": "true",
  "android.enableShrinkResourcesInReleaseBuilds": "true",
  "expo.gif.enabled": "false",
  "expo.webp.enabled": "false",
};

const upsert = (modResults, key, value) => {
  const item = { type: "property", key, value };
  const index = modResults.findIndex((entry) => entry.type === "property" && entry.key === key);
  if (index >= 0) modResults[index] = item;
  else modResults.push(item);
};

const withAndroidAppSize = (config) =>
  withGradleProperties(config, (config) => {
    for (const [key, value] of Object.entries(ANDROID_SIZE_PROPERTIES)) {
      upsert(config.modResults, key, value);
    }
    return config;
  });

module.exports = withAndroidAppSize;
module.exports.ANDROID_SIZE_PROPERTIES = ANDROID_SIZE_PROPERTIES;
