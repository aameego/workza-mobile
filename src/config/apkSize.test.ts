import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

import { ANDROID_SIZE_PROPERTIES } from "../../plugins/withAndroidAppSize.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));

describe("Android APK size", () => {
  it("keeps only phone ABIs and compresses native libraries", () => {
    assert.equal(ANDROID_SIZE_PROPERTIES.reactNativeArchitectures, "armeabi-v7a,arm64-v8a");
    assert.equal(ANDROID_SIZE_PROPERTIES.reactNativeArchitectures.includes("x86"), false);
    assert.equal(ANDROID_SIZE_PROPERTIES["expo.useLegacyPackaging"], "true");
    assert.equal(ANDROID_SIZE_PROPERTIES["android.enableBundleCompression"], "true");
    assert.equal(ANDROID_SIZE_PROPERTIES["expo.gif.enabled"], "false");
    assert.equal(ANDROID_SIZE_PROPERTIES["expo.webp.enabled"], "false");
  });

  it("applies those rules through the Expo config plugin so prebuild cannot revert them", () => {
    assert.ok(app.expo.plugins.includes("./plugins/withAndroidAppSize"));
    assert.ok(app.expo.plugins.includes("./plugins/withAndroidReleaseSigning"));
    assert.ok(app.expo.plugins.includes("./plugins/withWebViewOneTimePermissions"));
  });

  it("matches the generated gradle.properties when the android folder is present", () => {
    const gradleProperties = join(root, "android/gradle.properties");
    if (!existsSync(gradleProperties)) return;
    const text = readFileSync(gradleProperties, "utf8");
    for (const [key, value] of Object.entries(ANDROID_SIZE_PROPERTIES)) {
      assert.match(text, new RegExp(`^${key.replace(".", "\\.")}=${value}$`, "m"), `${key} should be ${value}`);
    }
  });
});
