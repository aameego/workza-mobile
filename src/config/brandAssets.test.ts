import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { describe, it } from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const app = JSON.parse(readFileSync(join(root, "app.json"), "utf8"));

const splashPlugin = app.expo.plugins.find(
  (plugin: unknown) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen"
);

describe("Workza brand assets", () => {
  it("points every Expo icon and splash at the Workza artwork, not the Expo placeholder", () => {
    assert.equal(app.expo.icon, "./assets/images/icon.png");
    assert.equal(app.expo.web.favicon, "./assets/images/favicon.png");
    assert.equal(app.expo.android.adaptiveIcon.foregroundImage, "./assets/images/android-icon-foreground.png");
    assert.equal(app.expo.android.adaptiveIcon.backgroundColor, "#FFFFFF");
    assert.equal(app.expo.ios.icon, undefined);
    assert.equal(splashPlugin[1].image, "./assets/images/splash-icon.png");
    assert.equal(splashPlugin[1].backgroundColor, "#F8FAFC");
    // Android 12 masks the splash to a circle. 288 fills Expo's canvas; padding lives in the PNG.
    assert.equal(splashPlugin[1].imageWidth, 288);
  });

  it("keeps the login wordmark and generated launcher files on disk", () => {
    for (const relative of [
      "assets/images/workza-logo.png",
      "assets/images/icon.png",
      "assets/images/splash-icon.png",
      "assets/images/android-icon-foreground.png",
      "assets/images/favicon.png",
      "assets/icon.png",
    ]) {
      assert.ok(existsSync(join(root, relative)), `missing ${relative}`);
    }
  });
});
